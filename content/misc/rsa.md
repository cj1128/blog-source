---
title: RSA 的原理与实现
date: 2019-10-03T07:19:07+08:00
cover: http://asset.cjting.cn/FlHruid2di9QJ-HK0CTL0OeL6pNM.jpg
draft: true
---

1976 年以前，所有的加密都是如下方式：

- A 使用某种规则对信息进行处理
- B 使用同样的规则对处理过的信息进行复原

这个方式很好理解，不论是非常简单的 ROT13 还是目前广泛使用的 AES，都是这种对称加密方式。

但是这种方式有一个巨大的缺点，那就是 A 需要将对信息进行处理的规则（也就是秘钥）告诉给 B，怎样安全地传输秘钥就成了一个非常棘手的问题。

那么存不存在一种方式，加密和解密使用不同的秘钥，彻底规避掉传输秘钥的问题？

答案是存在的，感谢数学家和计算机学家，RSA 就是这样一种非对称加密方式，也就是：

- 使用算法可以生成两把钥匙，一把为私钥，一把为公钥
- 公钥公开发布，任何人都可以获取，私钥自己保留
- 使用公钥加密的信息，使用私钥可以解开

这样我们只要把私钥保存好，这个通信系统就非常安全。

<!--more-->

寻找大的质数。
https://zh.wikipedia.org/wiki/AKS%E8%B3%AA%E6%95%B8%E6%B8%AC%E8%A9%A6


整数分解为什么困难。
https://zh.wikipedia.org/wiki/%E6%95%B4%E6%95%B0%E5%88%86%E8%A7%A3


计算 e。
https://zh.wikipedia.org/wiki/%E6%89%A9%E5%B1%95%E6%AC%A7%E5%87%A0%E9%87%8C%E5%BE%97%E7%AE%97%E6%B3%95

为什么教科书的 RSA 不安全？为什么需要 Padding。
https://crypto.stackexchange.com/questions/20085/which-attacks-are-possible-against-raw-textbook-rsa

## 数学原理

现在我们来看看这样一个神奇的系统背后的数学原理，数学作为人类智慧皇冠上最灿烂的明珠，永远是那么的冷静迷人。

### 互质

### 欧拉函数

### 欧拉定理和费马小定理

### 模反元素

## 秘钥生成

## 可靠性

## 通信过程

## 秘钥格式

## Go 语言实现

## 参考

- http://www.ruanyifeng.com/blog/2013/06/rsa_algorithm_part_one.html
- https://eli.thegreenplace.net/2019/rsa-theory-and-implementation/
