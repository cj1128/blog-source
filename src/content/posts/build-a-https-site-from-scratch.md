---
title: 从零开始搭建一个 HTTPS 网站
date: 2016-09-05T00:00:00+08:00
cover: /image/9b85365djw1f7fb60zgzaj21kw11xgyy.jpg
tags: [https, tls, ssl]
---

我们都知道 HTTP 是非常不安全的，不安全的根源在于 HTTP 是明文传输。你在谷歌搜索了一个关键词（假设 Google 使用 HTTP），HTTP 数据包从你的计算机传送到服务器的过程中，中间经过的任意一个设备都可以轻松解析你的数据包，获取你的关键词，你的隐私毫无保障。

你的信息被人获取只是明文传输的其中一个问题。总体来说，明文传输有三个问题：

- 窃听：第三方可以获取你的信息
- 篡改：第三方可以修改你的信息
- 冒充：第三方可以冒充你的身份

<!--more-->

不仅是 HTTP，所有明文传输的协议，都有这三个问题。那解决方案自然也是围绕着这三点进行，我们需要有一个协议，能够保证：

- 第三方无法获取通信内容，这意味着通信内容肯定是要加密的。
- 第三方无法修改通信内容，这意味着通信内容需要有校验机制（加密和校验是两回事，虽然信息加密了，第三方无法读取，但是一样可以修改你的内容，比如，把加密的内容拷贝一份贴在后面），如果通信数据被修改了，通信双方能够立刻知道。
- 第三方无法冒充身份，这就意味着需要有一个身份校验机制。

这个协议就是 `SSL/TLS`。

## SSL/TLS

### 历史

`SSL` 协议起源很早。1994 年，网景公司就设计了 SSL 协议 1.0 版，但是因为设计上有很多严重的问题，这个版本并没有对外公布（这一年网景推出了著名的网景浏览器并迅速获得成功）。1995 年，网景公司发布了 SSL 协议的 2.0 版，但是很快被发现有严重的漏洞从而导致了 SSL 协议 3.0 版的诞生。1996 年，经过彻底的重新设计，SSL 协议 3.0 版发布，并得到了大规模应用。目前广泛使用使用的 `SSL/TLS` 协议就是基于 SSL 协议的 3.0 版。

1999 年，互联网标准化组织 ISOC 接替网景公司，发布了 SSL 的升级版 `TLS` 协议 1.0。之后，TLS 协议又经历了几次升级，目前最新的为 TLS 1.3（草案）。

### 工作原理

SSL/TLS 协议的核心是 `RSA 非对称加密`。RSA 是一个伟大的发明，简单来说，通过 RSA，我们可以生成两把钥匙，一把公钥，一把私钥。公钥加密以后私钥可以解开，而私钥加密以后公钥可以解开。这就避免了对称加密系统（加密解密使用同一把密钥）的一个重大缺陷：需要传输密钥。

那么 SSL/TLS 协议的基本原理就是，客户端获取服务器的公钥，加密信息以后传送给服务器，然后服务器使用私钥解密。这个方案有两个问题。

1. 服务器传输公钥的时候，是明文的，第三方可以篡改。
2. RSA 加密的计算量较大，如果每次通信都使用 RSA 加密的话，会对性能产生负担。

针对第一个问题，我们需要一个办法来保证服务器传输的公钥确实是服务器的，而不是第三方的。这个时候，我们需要使用 _数字证书_。数字证书由权威机构 (CA, Certificate Authority) 颁发，里面包含有服务器的公钥，证书文件使用 CA 私钥进行加密。当客户端与服务器建立加密通信的时候，服务器不再返回公钥，而是返回他的数字证书。客户端拿到证书，使用对应的 CA 的公钥解密，然后获取到服务器的公钥。这里有一个问题，客户端怎么拿到 CA 的公钥呢？如果还是去CA 服务器获取的话，那么我们又会回到问题的原点即怎样保证 CA 公钥不被人篡改。因此，大部分浏览器中，权威 CA 的公钥都是内置的，不需要去获取。这就保证了 CA 公钥的正确性。第三方没有办法伪造证书，因为第三方没有 CA 的私钥（当然，CA 被入侵的例子的也是有的，技术永远解决不了人的问题）。

针对第二个问题，SSL/TLS 协议在通信过程中，并不是使用 RSA 加密，而是使用对称加密，对称加密的密钥（对话密钥）由双方协商生成。

因此，SSL/TLS 协议的基本流程如下：

1. 客户端索取服务器的数字证书，从而获得服务器公钥
2. 双方协商生成对话密钥
3. 使用对话密钥进行加密通信

### 具体流程

根据上面的论述，SSL/TLS 协议的核心便是怎样安全的生成一个 _对话密钥_ 来加密之后的通信。这个过程称之为 _握手_。

![](/image/9b85365dgw1f7fdsr6gbzj20tv0m3q7r.jpg)

握手一共有四次请求，注意，这些请求都是明文的（也没法加密）。

#### 客户端请求 (ClientHello)

首先，客户端（通常是浏览器）先向服务器发送请求，这一步叫做 `ClientHello`，
请求携带以下信息：

```text
1. 客户端支持的协议版本（这是为了和服务器协商使用什么版本的 SSL/TLS 进行通信）
2. 客户端生成的一个随机数 n1
3. 客户端支持的加密方法，比如 RSA（这是为了和服务器协商使用什么加密方法）
```

#### 服务器响应 (ServerHello)

服务器收到客户端请求之后，向客户端发送响应，这一步叫做 `ServerHello`，
响应携带以下信息：

```text
1. 确认通信使用的 SSL/TLS 版本
2. 服务器生成的一个随机数 n2
3. 服务器的数字证书
4. 确认加密方法，比如 RSA
```

#### 客户端回应

客户端收到浏览器的响应后，首先验证服务器的证书时候有效。如果证书不是由权威结构颁发 (比如 12306)，证书包含的域名和实际域名不一致或者证书已经过期，那么浏览器会警告用户，由用户决定是否继续访问。

如果证书没有问题，客户端便会从证书中取出服务器的公钥，然后发送一个请求，携带以下信息。

```text
1. 一个随机数 n3，这个随机数用服务器公钥加密，防止被窃听
2. 编码改变通知，表示之后所有的信息都将会使用双方商定的加密方法加密发送
3. 客户端握手结束通知，表示客户端的握手阶段已经结束
```

客户端此时有三个随机数，n1，n2，n3，根据这个三个随机数，客户端使用一定的算法生成通信所需的对话密钥。

#### 服务器最后响应

服务器收到客户端的随机数之后，使用私钥将其解密，这时，服务器也拥有了 n1，n2，n3 这三个随机数，服务器便可以生成和客户端一致的对话密钥。然后向客户端发送最后的响应。信息如下：

```text
1. 编码改变通知，表示随后的信息都将用双方商定的加密方法和密钥发送
2. 服务器握手结束通知，表示服务器端的握手阶段已经结束
```

到了这里，客户端和服务器就可以使用对话密钥加密之后所有的通信过程。第三方无法窃听，都是乱码看不懂。也无法篡改，SSL 使用 MAC(Message Authentication Code) 来校验信息。更无法冒充，因为没有对话密钥。

## HTTPS

HTTPS 便是 `HTTP Over SSL`，使用 SSL 协议来加密 HTTP 通讯过程。SSL 协议本质上是提供了一个加密通道，我们在这个通道中传输 HTTP，便是 HTTPS 协议。

### 证书

从前面的描述中可以看出，要想进行 SSL 通信，服务器需要有一个权威机构认证的证书。证书是一个二进制文件，里面包含有一些信息（服务器的公钥，域名，有效时间等）。和域名一样，证书需要购买，并且价格不菲。下面是三个常用的购买证书的网站。

- [GoGetSSL](https://www.gogetssl.com)
- [SSLs.com](https://www.ssls.com)
- [SSLmate.com](https://www.sslmate.com)

证书分为很多类型，首先分为三级认证：

- 域名认证（Domain Validation, DV）：最低级的认证，CA 只检查申请者拥有某个域名，对于这种证书，浏览器会在地址栏显示一把绿色的小锁。

- 组织认证（Organization Validation, OV)：CA 除了检查域名所有权以外，还会审核组织信息。对于这类认证，浏览器会在地址栏中显示公司信息。

- 扩展认证（Extended Validation, EV)：最高级别的认证，相比于组织认证，CA 会对组织信息进行更加严格的审核。

除了三个级别以外，证书还分为三个覆盖范围：

- 单域名证书：只能用于单一域名，a.com 的证书不能用于 www.a.com

- 通配符证书：可以用于域名下的所有子域名，\*.a.com 的证书可以用于 a.com，也可以用于 www.a.com

- 多域名证书，可以用于多个域名，比如 a.com，b.com

很显然，认证级别越高，覆盖范围越广，证书价格越贵。好消息是，为了推广 HTTPS 协议，电子前哨基金会 EFF 成立了 [Let's Encrypt](https://letsencrypt.org/)，可以提供免费证书。So, Let's Encrpyt~

### Let's Encrpyt

这里，我使用一台新的 `CentOS 7` VPS 来演示怎样从头搭建一个 HTTPS 网站。

#### 安装客户端

先安装基础工具。

```bash
yum update
yum install -y git vim
```

然后，我们来安装 `letsencrypt` 客户端。目前，安装 `letsencrpyt` 客户端最好的方式便是直接克隆代码仓库。我们登录到服务器上，将 `letsencrypt` 的仓库克隆到本地。

```bash
git clone https://github.com/letsencrypt/letsencrypt /opt/letsencrypt
```

最后，我们安装 `nginx` 作为我们的 web server。`yum install -y nginx`，安装好之后，`systemctl start nginx` 启动。默认情况下，`CentOS 7` 只开放了 `DHCP` 和 `SSH` 的端口，我们需要手动把端口开放一下。

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

将自己的域名配置到这台 VPS 上。这里，我使用 `leaningmoon.io` 为例。访问网站，可以看到默认的 nginx 页面。

#### 生成证书

我们使用 `letsencrypt` 来生成 HTTPS 所需的证书。作为一个免费的解决方案，`letsencrypt` 只提供域名认证证书（这很合理，组织机构可以自己购买高级证书）。所以，我们只要能证明域名是自己所有即可。最简单的方式是用 `letsencrypt` 的 `webroot` 验证方式，在 VPS 上告诉 `letsencrypt` nginx 的 `webroot` 和你的域名，`letsencrypt` 会在 `webroot` 的 `.well-known` 文件夹中放置一个特别的文件，然后使用域名去访问这个文件，如果可以访问到，当然能够证明域名是你的了。

默认的 Nginx 配置不用任何修改，Nginx 默认的 `webroot` 是 `/usr/share/nginx/html`。

```bash
cd /opt/letsencrypt
./letsencrypt-auto certonly -a webroot --webroot-path=/usr/share/nginx/html -d leaningmoon.io # 可以使用多个 -d 添加多个域名
```

回车之后，`letsencrypt` 会进行一系列操作生成所需的证书文件，最后会有一个弹窗，提示你输入电子邮件地址，如果证书丢了，可以恢复。

![](/image/9b85365djw1f7hzf480y7j20sp0ap3zk.jpg)

最后，`letsencrypt` 的输出结果如下。

![](/image/9b85365djw1f7hzfmf062j20v60bj456.jpg)

可以看到，最为关键的证书文件存放在 `/etc/letsencrypt/live/leaningmoon.io/fullchain.pem`。

#### 配置 Nginx

最后一步便是配置 Nginx 采用我们的证书文件并开启 HTTPS。这里推荐一个网站，[cipherli.st](https://cipherli.st/)，这个网站提供了当前主流的 Web 服务器怎样开启 HTTPS 的推荐配置，很值得参考。这里我们直接复制他提供的 Nginx 配置。

```nginx
server {
  listen       80 default_server;
  server_name  leaningmoon.io;
  return 301 https://$server_name$request_uri;
}

server {
  # SSL Configuration
  listen 443 ssl default_server;
  root         /usr/share/nginx/html;

  # copy from https://cipherli.st
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
  ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
  ssl_session_cache shared:SSL:10m;
  ssl_session_tickets off; # Requires nginx >= 1.5.9
  ssl_stapling on; # Requires nginx >= 1.3.7
  ssl_stapling_verify on; # Requires nginx => 1.3.7
  resolver 8.8.8.8 8.8.4.4 valid=300s;
  resolver_timeout 5s;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
  add_header X-Frame-Options DENY;
  add_header X-Content-Type-Options nosniff;

  # specify cert files
  ssl_certificate /etc/letsencrypt/live/leaningmoon.io/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/leaningmoon.io/privkey.pem;
}
```

重启 Nginx，`systemctl reload nginx`。再次访问网站，我们可以看到，我们的网站也多了一把可爱的小绿锁~

![](/image/9b85365dgw1f7hzuvhh4jj212h0bqgpx.jpg)

**参考链接**

- [HTTPS 升级指南](http://www.ruanyifeng.com/blog/2016/08/migrate-from-http-to-https.html)
- [SSL/TLS 协议运行机制的概述](http://www.ruanyifeng.com/blog/2014/02/ssl_tls.html)
- [How To Secure Nginx with Let's Encrypt on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
