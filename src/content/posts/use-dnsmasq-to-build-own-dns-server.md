---
title: 使用 Dnsmasq 搭建内网 DNS 服务器
cover: /image/9b85365djw1f7bjp0tf5dj21jk0ikq95.jpg
date: 2016-08-20T00:00:00+08:00
tags: [dns, dnsmasq]
---

在日常开发过程中，我们经常要配置各种
host，比如公司内部的各种服务，或者测试项目的时候暂时把生产环境 URL 配置到本地上等等。一般采取的方法都是每个人手动编辑自己的 `/etc/hosts` 文件。这个做法有两个缺点：

- 手动编辑 `/etc/hosts` 文件非常麻烦，需要 `sudo`
- 工作量重复，团队内每个人都要配置一遍

<!--more-->

第一个缺点只是有点麻烦，问题还不大。在团队中，怎样解决第二个问题才是关键。试想，有一个新的项目 `test` 要开始开发了，内部搭建了 Sandbox 环境和 Staging 环境，这时候，参与项目的所有人（包括开发人员，测试人员，PM 等）都要手动添加 `sandbox.test.dev` 以及 `staging.test.dev` 这两条记录到 `/etc/hosts` 文件中。这实在是无比繁琐。和非开发人员说怎么配 host 也是一件很痛苦的事情。

解决这个问题的思路也很简单，我们需要一个内部的 DNS 服务器能够控制 DNS 查询就行，然后把所有的 `host` 配置在这台 DNS 服务器上，从而实现一次配置，所有人都可以使用。

这里我们使用的是 `Dnsmasq`，一个轻量的支持 `DNS`, `DHCP` 以及 `TFTP` 协议的小工具。功能很多，有兴趣可以自己研究，这里我们主要关心他的 DNS 功能。

## 安装

Mac 上很简单，`brew install dnsmasq` 即可。Linux 上可以使用相应的包管理器来装。

## 配置

在 Mac 上，`Dnsmasq` 使用的配置文件是 `/usr/local/etc/dnsmasq.conf` 文件。Linux 上是 `/etc/dnsmasq.conf`。

默认配置文件中列举了所有的配置和解释，所以很容易看懂。这里我们使用以下的配置。

```text
# 所有没有 `.`` 的域名 (plain names) 都不会向上游 DNS Server 转发，只查询 hosts 文件
domain-needed
# 所有保留 IP 地址段内的反向查询都不会向上游 DNS Server 转发，只查询 hosts 文件
bogus-priv
# 不要读取 /etc/resolver 中的 DNS Server 的配置
no-resolv
# 不要 poll /etc/resolver 文件的更新
no-poll
# 下面这两个配置我们的上游 DNS 服务器
server=8.8.8.8
server=8.8.4.4
```

配置完了以后，在 `/etc/hosts` 中添加我们的内部 hosts。启动 `Dnsmasq` 就行了。

## 配置路由器

默认情况下，每一台新进入网络的计算机，默认 DNS Server 是路由器，而路由器的默认 DNS Server 是自动根据 ISP 获取。我们最后一步是把路由器的 DNS 服务器设置为启动了 Dnsmasq 的机器即可。每一台路由器修改 DNS Server 不一样，找一找可以很容易找到。

## 最后

到这里，我们的目标就实现了，以后所有的 host 只需要配置在 Dnsmasq 服务器上的 `/etc/hosts` 文件中（每一次修改 /etc/hosts 文件以后，需要重启 Dnsmasq）。网络中的每一台主机都可以访问配置的域名，再也不用自己手动配置了。同时，Dnsmasq 还默认提供 DNS Cache 功能，可以一定程度上加速网站访问。
