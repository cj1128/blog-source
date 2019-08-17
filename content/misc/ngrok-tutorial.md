---
cover: http://asset.cjting.cn/9b85365djw1f7bk8tdwtej21kw0w0gry.jpg
date: 2016-05-21T00:00:00+08:00
title: 使用 Ngrok 实现内网穿透
tags: [ngrok, nat]
aliases:
  - /misc/2016-05-21-使用Ngrok实现内网穿透.html
  - /misc/ngrok-tutorial/
---
很多时候，我们都有这样的需求：需要将本地正在开发的服务暴露在公网上，也就是从外网直接访问我们本机上的服务。正常情况下，这是办不到的，因为我们的本机并没有公网 IP，我们的本机处在内网当中。

这里需要顺手提及一个知识：NAT 穿透。我们的机器一般都在路由器的内网当中，IP 地址基本上都是 `192.168.x.x` 系列，我们并没有公网 IP，那么如何访问外网呢？我们打开浏览器访问 Google，Google 与我们主机之间如何通信？假设我们主机 IP 为 `192.168.0.100`，路由器 LAN IP 为 `192.168.0.1`，WAN IP 为 `211.22.145.234（这是一个公网IP）`，Google 服务器 IP 为 `74.125.204.101`，详细通信流程如下。

<!--more-->

1. 主机构建 HTTP 请求数据包，目标 IP 为 74.125.204.101，目标端口 80，源 IP 为 192.168.0.100，源端口随机生成，假定为 5000。
2. 主机检查目标 IP 地址，发现不在一个网段，数据包丢给默认网关（192.168.0.1）。
3. 路由器 LAN 口收到数据包，构建 NAT 映射，随机生成端口，假定为 5500，这样映射就是 :5500 -> 192.168.0.100:5000。WAN 口收到的数据包，如果目标端口是 5500，则转发给内网 IP 为 192.168.0.100 的机器的 5000 端口。
4. 路由器修改数据包的源端口为 5500，源 IP 地址为 211.22.145.234，使用 WAN 口将数据包发送出去。
5. Google 服务器收到请求，构建响应 HTTP 数据包，目标 IP 地址 211.22.145.234，目标端口为 5500。
6. 路由器 WAN 口收到数据包，目标端口为 5500，查询 NAT 表，发现对应的机器是 192.168.0.100:5000，所以修改目标 IP 为 192.168.0.100，目标端口为 5000，并通过 LAN 口发送给主机。
7. 主机接收到数据包，完成这一次通信。

从上面可以看出，内网机器能够和外网通信，全靠拥有公网 IP 的路由器做交通枢纽。路由器通过查询 NAT 表，来确定数据包该发送给内网哪台机器。所以内网多台机器都可以通过这一台路由器和外网进行通信，这极大的节省了宝贵的公网 IP 资源。

NAT 表项是在内网主动和外网通信的过程中构建的，如果外网主动访问内网，那么自然没有表项，也就访问不到。如果想要从外网访问内网，根据上面的原理我们可以有两种做法。

首先，我们可以手动添加 NAT 表项，大部分路由器里面都有这个设置项。我的 NETGEAR 路由器的设置页面如图所示。

![](http://asset.cjting.cn/9b85365dgw1f43dxm3ux6j21gz0jo78u.jpg)

另一种办法，是找一个公网服务器做中介。比如服务器 A，流程如下。

- 开发主机和服务器 A 构建一条连接
- 用户访问服务器 A
- 服务器 A 联系开发主机获取内容
- 服务器 A 将获取到的内容发送给用户

通过上面的流程，就实现了用户访问到了我们内网的内容。那么帮助我们实现这个功能的程序就是 Ngrok。通过在服务器上安装 Ngrok，我们就可以和本地主机构建一条隧道，来让外网用户访问本地主机的内容。

以下是安装 Ngrok 的详细步骤。

首先，下载代码。

```bash
git clone https://github.com/inconshreveable/ngrok.git
cd ngrok
```

第二步，生成我们自己的证书。我们首先要想好一个基础域名（NGROK_BASE_DOMAIN)。比如我选择 `tunnel.cjting.me`，那么我之后就会使用 `*.tunnel.cjting.me` 来访问相应的本地服务。

```bash
openssl genrsa -out base.key 2048
openssl req -new -x509 -nodes -key base.key -days 10000 -subj "/CN=[NGROK_BASE_DOMAIN]" -out base.pem
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=[NGROK_BASE_DOMAIN]" -out server.csr
openssl x509 -req -in server.csr -CA base.pem -CAkey base.key -CAcreateserial -days 10000 -out server.crt
```

![](http://asset.cjting.cn/9b85365djw1f439iat2lpj20qi0g5grx.jpg)

第三步，拷贝证书文件，然后编译相应的客户端和服务器程序。

```bash
cp base.pem assets/client/tls/ngrokroot.crt
GOOS=linux make release-linux # 服务器是 linux，我们需要交叉编译
make release-client # 客户端运行在我们自己的机器上
```

第四步，将相应的文件传送到服务器上，并启动服务器程序。服务器程序需要第二部生成的 `server.crt` 和 `server.key`。

```bash
mkdir release
cp bin/linux_amd64/ngrokd release/
cp server.crt server.key release/
scp -r release/ root@[host]:~/ngrok
ssh root@[host]
cd ~/ngrok
./ngrokd -tlsKey=server.key -tlsCrt=server.crt -domain="[NGROK_BASE_DOMAIN]" -httpAddr=":80" -httpsAddr=":443"
```

第五步，配置域名解析。解析 `[NGROK_BASE_DOMAIN]` 以及 `*.[NGROK_BASE_DOMAIN]` 地址到服务器上。我使用的是 DNSPOD，截图如下。

![](http://asset.cjting.cn/9b85365djw1f43rtmytwvj20nn0bqwgl.jpg)

最后一步，配置客户端，启动客户端程序。客户端的默认配置文件位置是 `$HOME/.ngrok`，填入以下配置。

```yaml
server_addr: [NGROK_BASE_DOMAIN]:4443
trust_host_root_certs: false
```

然后启动客户端。

```bash
./ngrok -subdomain test 8080
```

客户端会转发本地 8080 端口的服务到 `test.[NGROK_BASE_DOMAIN]` 上。以我为例，只要我访问 `test.tunnel.cjting.me`，就可以看到开发主机上 8080 端口的内容。实现了外网访问内容的目标。

![](http://asset.cjting.cn/9b85365dgw1f43t9r2wshj20iq06i74v.jpg)

最后提一点：客户端和服务器连接是需要验证证书的。只有我们同时编译的客户端和服务器才能连接上。在新的电脑上重新编译客户端去连接一个已部署的服务器，是无法连接的。因此建议存档一份客户端程序。
