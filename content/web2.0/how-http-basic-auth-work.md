---
date: 2018-03-31T19:40:48+08:00
draft: true
title: HTTP Basic Auth是怎么样工作的
---
`HTTP Basic Auth`是HTTP提供的一种验证方式，因为明文传输用户名和密码，非HTTPS环境下很不安全，一般用的非常少。但是在某些情况下用一用还是非常方便的，比如，一些静态站点例如文档系统可以使用HTTP Basic Auth进行简单地权限验证。

<!--more-->

## 流程

HTTP Basic Auth使用两个HTTP Header实现，分别是`WWW-Authenticate`和`Authorization`。

流程如下：

1. 客户端请求服务器页面，服务器返回`401`以及`WWW-Authenticate: Basic realm="site"`。
2. 浏览器弹出对话框，提示用户输入用户名和密码。
3. 浏览器再次请求页面，携带`Authorization: Basic <str>`，其中，`str=base64(username:password)`。
4. 服务器返回正常页面。

base64只是一个编码过程，而不是加密过程，因此，HTTP Basic Auth是在明文传输用户名和密码，中间设备很容易通过检查数据包获取用户名和密码。

## Realm

我们可以发现，`WWW-Authenticate`这个头携带了一个`realm`属性，这个属性用来标注页面所属的区域，具体定义见[RFC 7235](https://tools.ietf.org/html/rfc7235#section-2.2)。一般情况下不用在意，随便填写或者不填写都可以。

但是，如果你的网站有两个子目录，每个子目录有自己的用户名和密码的话，`realm`属性就比较重要了。这个属性会影响浏览器的密码自动填充过程。

我们知道，访问一个HTTP Basic Auth的网站，第一次输入密码以后，之后访问就不再需要输入密码了，这是因为浏览器缓存了用户名和密码并且自动替我们填充了。

关于浏览器在HTTP Basic Auth时的密码填充算法，我没有找到明确的描述，自己基于Chrome做了一些实验，总结如下。

考虑下面的网站，有两个URL，每个URL的用户名和密码不相同。

- `/a`: `username: a, password: a, realm: whatever`
- `/b`: `username: b, password b, realm: whatever`

1. 用户访问`/a`，浏览器提示输密码，成功进入，浏览器将密码和`realm=whatever`关联
2. 用户访问`/b`，浏览器请求，发现401，同时`realm=whatever`，默认使用上一次输入的密码填充
3. 还是401，浏览器弹框提示用户输入，然后更新`realm=whatever`的密码关联
4. 用户访问`/a`，浏览器自动使用`realm=whatever`的密码进行填充（应该是缓存了相关信息，知道`/a`需要密码），收到401，弹框提示用户输入，更新`realm=whatever`的密码关联
5. 用户`/b`，和上面的流程一样，还是会导致弹框提示用户输入用户名和密码

也就是说，如果两个子目录的用户名和密码不一样，但是`realm`一样的话，会导致在两个子目录进行切换时，不停地输入用户民和密码。

如果`realm`不一样的话，就没有这个问题了，因为浏览器使用`realm`来关联用户名和密码。

## 如何清除用户名和密码

因为浏览器会记住用户名和密码，然后替我们做“自动登录”，那么该怎么样才能“登出”呢？

考虑这样一个场景，网站设置了多套用户名和密码，下发了部分给客户，结果客户反应说用户名和密码不对，那么此时，因为我已经登录成功了，无法再看到输入框，自然也无法测试。这个时候我们需要就是“登出”，清空浏览器的“HTTP Basic Auth缓存”。

在Chrome中，我们只要在URL前面加上`user@`即可强制浏览器刷新它的缓存，弹出对话框。

例如，网站为`http://www.a.com`，访问输入了密码以后，再使用`http://user@www.a.com`访问，就会重新弹出弹框。
