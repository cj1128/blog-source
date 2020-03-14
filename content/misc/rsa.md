---
title: RSA 的原理与实现
date: 2020-03-13T19:24:07+08:00
cover: http://asset.cjting.cn/FlHruid2di9QJ-HK0CTL0OeL6pNM.jpg
draft: true
---

1976 年以前，所有的加密都是如下方式：

- A 使用某种规则对信息进行处理
- B 使用同样的规则对处理过的信息进行复原

这个方式很好理解，不论是非常简单的 ROT13 还是目前广泛使用的 AES，都是这种对称加密方式。

但是这种方式有一个巨大的缺点，那就是 A 需要将对信息进行处理的规则（也就是秘钥）告诉给 B。怎样安全地传输秘钥就成了一个非常棘手的问题。

那么存不存在一种方式，加密和解密使用不同的秘钥，彻底规避掉传输秘钥的问题？

答案是存在的，感谢数学家和计算机科学家，RSA 就是这样一种非对称加密方式，也就是：

- 使用算法可以生成两把钥匙 A 和 B
- 使用 A 加密的信息，使用 B 可以解开
- 使用 B 加密的信息，使用 A 可以解开

日常使用中，我们把一把作为公钥，公开发布。一把作为私钥，自己保留。这样，任何人都可以使用我们的公钥加密信息发给我们，我们则可以使用自己的私钥解开。

只要把私钥保存好，这个通信系统就非常安全。

<!--more-->

## 数学原理

现在我们来看看这样一个神奇的系统背后的数学原理。数学作为人类智慧皇冠上最灿烂的明珠，永远是那么的冷静迷人。这里我只陈述内容，具体的证明如果感兴趣可以 Google。

首先我们梳理几个概念。

**互质**

如果两个正整数，除了 1 以外没有其他的公因数，则他们互质。比如，14 和 15 互质。注意，两个数构成互质关系，他们不一定需要是质数，比如 7 和 9。

**欧拉函数**

$$
\phi(n) = n (1 - \frac{1}{p_1}) (1 - \frac{1}{p_2})...(1 - \frac{1}{p_n})
$$

欧拉函数用于计算任意正整数 n，在 <=n 的正整数中，与 n 互质的正整数个数，其中 $\phi(1) = 1$。

其中，$p_1$，$p_2$ 表示 n 的质因子，重复的只算一个。

例如，$10 = 2 \times 5$，所以 $\phi(10) = 10 (1- \frac12) (1 - \frac15) = 4$，意味着在 <=10 的正整数中，与 10 互质的正整数个数为 4 个。我们可以验证一下，他们分别是 1, 3, 7, 9，一共 4 个。

再例如，$12 = 2 \times 2 \times 3$，所以 $\phi(12) = 12 (1 - \frac12) (1 - \frac13) = 4$。

**欧拉定理和费马小定理**

欧拉定理陈述了这样一个事实：如果两个正整数 a 和 n 互质，则如下等式成立。

$$
a^{\phi(n)} \equiv 1 \pmod n
$$

换句话说，$a^{\phi(n)}$ 减去 1，可以整除 n。

例如，7 和 10 互质，$7^{\phi(10)} = 7^4 = 2401$，减去 1 等于 2400，可以整除 10。

同样的道理，$10^{\phi(7)} = 10^6 = 1000000$，减去 1 等于 999999，可以整除 7。

欧拉定理存在一个特殊情况：如果 p 是质数，而 a 不是 p 的倍数，此时 a 和 p 必然互质。因为 $\phi(p) = p - 1$，所以

$$
a^{\phi(p)} = a^{p - 1} \equiv 1 \pmod p
$$

这就是 [费马小定理]，它是欧拉定理的特例。

**模反元素**

如果两个正整数 a 和 n 互质，那么一定可以找到一个正整数 b，使得 ab - 1 被 n 整除。

$$
ab \equiv 1 \mod n
$$

这个时候，b 就叫做 a 的 [模反元素]。

比如，3 和 11 互质，3 的模反元素是 4，因为 $(3 \times 4) - 1$ 可以整除 11。

我们可以发现，模反元素不止一个，4 加减 11 的倍数都是 3 的模反元素。

我们可以用欧拉定理来证明，模反元素一定存在。

$$
a^{\phi(n)} = a \times a^{\phi(n) - 1} \equiv 1 \pmod n
$$

可以看出，$a^{\phi(n) - 1}$ 就是 a 相对 n 的模反元素。

好了，到此为止，需要的数学知识就全部介绍完毕了。

## 秘钥生成

接下来我们来看秘钥的生成步骤。

第一步，随机选择两个大质数 p 和 q，并计算他们的乘积 n。在日常应用中，出于安全考虑，一般要求 n 换算成二进制要大于 2048 位。

这里因为是演示，我们使用比较小的数，选择 p = 7 以及 q = 9，所以 n = 63。

第二步，计算 n 的欧拉函数 $\phi(n)$。

根据公式，$\phi(n) = (p-1)(q-1)$，我么可以得知 $\phi(63) = 6 \times 8 = 48。


第三步，选择一个数 e 使得 e 与 $\phi(n)$ 互质。很多文章会提到 $1 < e < \phi(n)$，其实这并不严谨，只是工程上的考虑，在数学上来说，e 随便选择，只要与 $\phi(n)$ 互质即可，具体可以参考 [Can the encryption exponent e be greater than ϕ(N)?](https://crypto.stackexchange.com/questions/5729/can-the-encryption-exponent-e-be-greater-than-%CF%95n).

在日常应用中，我们一般选择 65537。**选择一个已知的数字不会降低 RSA 的安全性**。

这里，我们选择 e = 5。

最后一步，计算 e 相对 $\phi(n)$ 的模反元素 d。根据上面的知识，因为 e  和 $\phi(n)$ 互质，我们可以用如下公式计算 d

$$
d = e^{\phi[\phi(n)] - 1}
$$

在我们的例子中，$\phi(n) = 48$，我们可以很容易的查表得出 $\phi(48) = 16$。

但是在实际应用中，这是不现实的，因为 $\phi(n)$ 是一个非常大的数，而我们没有什么办法去快速计算 $\phi[\phi(n)]$。

这里我们要换一个方式来计算 d。

因为

$$
ed \equiv 1 \pmod {\phi(n)}
$$

我们可以得出

$$
ed = k\phi(n) + 1
$$

移项得到

$$
ed - k\phi(n) = 1
$$

所以，实际上这个问题就变成了：已知两个数 a 和 b，求解 x 和 y 满足如下方程：

$$
ax + by = 1
$$

根据 [扩展欧几里得算法](https://zh.wikipedia.org/wiki/%E6%89%A9%E5%B1%95%E6%AC%A7%E5%87%A0%E9%87%8C%E5%BE%97%E7%AE%97%E6%B3%95)，这个方程式有解的充分必要条件是 a 和 b 互质。

在我们的情况中，e 和 $\phi(n)$ 是互质的，所以这个方程式有解。同时，通过扩展欧几里得算法，可以非常容易的通过迭代求解出 d = -19。

d 加减 $\phi(n)$ 的倍数都是有效的值，所以我们加上 48，得到 d = 29。

到这里计算完毕，公钥就是 $[n, e] = [63, 5]$，私钥就是 $[n, d] = [63, 29]$。

## 加密和解密

现在我们来看看加密和解密过程是怎样的。

被加密的消息 m 需要是一个小于 n 的整数（我们可以将任意字节流直接解读为一个无符号整数）。如果消息太大，解读为整数以后比 n 要大，那么分段加密即可。实际上在工程中，我们不会直接用 RSA 来加密消息，而是用 RSA 来加密一个对称秘钥，再用这个秘钥加密消息。

加密的过程，就是计算如下的 c。

$$
m^e \equiv c \pmod n
$$

我们的公钥是 $[63, 5]$，假设我们的消息是 10。

$$
10^5 \equiv 19 \pmod {63}
$$

c  = 19，所以加密以后的消息就是 19。

后面我们会证明，下面的等式一定成立：

$$
c^d \equiv m \pmod n
$$

所以，解密只要使用私钥 $[n, d]$，对 c 进行运算即可。

我们的私钥是 $[63, 29]$。

$$
19^{29} \equiv 10 \pmod {63}
$$

解密得出原始消息 10。

## 解密证明

现在我们来证明为什么如下等式一定成立。

$$
c^d \equiv m \pmod n
$$

因为

$$
m^e \equiv c \pmod n
$$

所以，c 可以写为

$$c = m^e - kn$$

将 c 代入得到

$$
(m^e - kn)^d \equiv m \pmod n
$$

根据 [二项式定理]，左边展开后的每一项，除了 $m^{ed}$ 以外，都含有 $kn$，因此，证明上面的式子等同于证明

$$
m^{ed} \equiv m \pmod n
$$

由于

$$
ed \equiv 1 \pmod {\phi(n)}
$$

所以，$ed = 1 + h\phi(n)$，代入得到

$$
m^{h\phi(n) + 1} \equiv m \pmod n
$$

我们来分两种情况证明。


1、如果 m 和 n 互质

根据欧拉定理，我们可以得到

$$
m^{\phi(n)} \equiv 1 \pmod n
$$

所以

$$
m^{\phi(n)} = kn + 1
$$

$$
(m^{\phi(n)})^h = (kn + 1)^h
$$

根据二项式定理，我们可以得知

$$
(m^{\phi(n)})^h = k'n + 1
$$

也就是

$$
(m^{\phi(n)})^h \equiv 1 \pmod n
$$

从而得到

$$
(m^{\phi(n)})^h \times m \equiv m \pmod n
$$

原式得到证明。

2、如果 m 和 n 不互质

因为 n 是质数 p 和 q 的乘积，此时 m 必然为 kp 或者 kq。

以 m = kp 为例，此时 k 必然与 q 互质。因为 n = pq，而 m < n，所以 k 必然小于 q，而 q 是一个质数，在小于 q 的数字当中所有数都与 q 互质。

同时 kp 必然也与 q 互质，如果 kp 和 q 不互质，那么 kp 必然是 q 的倍数，因为 q 不存在其他因子，那么 kp 就是 n 的倍数，因为 n = pq，但是我们的前提是 m < n。

因为 kp 和 q 互质，根据欧拉定理

$$
(kp)^{q - 1} \equiv 1 \pmod q
$$

和上面同理，利用二项式定理，我们可以到

$$
[(kp)^{q - 1}]^{h(p-1)} \equiv 1 \pmod q
$$

从而得到

$$
[(kp)^{q - 1}]^{h(p-1)} \times kp \equiv kp \pmod q
$$

也就是

$$
(kp)^{ed} \equiv kp \pmod q
$$

改写为如下形式

$$
(kp)^{ed} = kp + tq
$$

左边是 p 的倍数，右边 kp 是 p 的倍数，所以 tq 必然是 p 的倍数。而 q 是 p 互质的，因此 t 必然是 p 的倍数，我们记为 t = t'p，代入得到

$$
(kp)^{ed} = kp + t'pq
$$

也就是

$$
m^{ed} \equiv m \pmod n
$$

RSA 的解密至此得到了证明。

## 可靠性

接下来我们来看为什么 RSA 是可靠的，也就是说，在得知公钥 $[n, e]$ 的情况下，怎样保证私钥 $[n, d]$ 的安全。

因为 n 是公开的，所以私钥的安全本质上就是 d 的安全，那么有没有可能在得知 n 和 e 的情况下，推导得出 d？

- 因为 $ed \equiv 1 \pmod {\phi(n)}$，想知道 d 需要知道 e 和 $\phi(n)$
- 因为 e 是公开的，所以想知道 d 需要知道 $\phi(n)$
- 而 $\phi(n) = (p - 1)(q - 1)$ 计算 $\phi(n)$ 需要对正数 n 进行质数分解

所以，d 的安全性依赖于对 n 进行质数分解的难度。目前来说，大整数的质数分解是一件相当困难的事情，参考 [整数分解](https://zh.wikipedia.org/wiki/%E6%95%B4%E6%95%B0%E5%88%86%E8%A7%A3)。

## 秘钥格式

日常工作中我们似乎并没有使用 RSA，但其实，我们无时无刻都在用它。

在配置 GitHub 或者 远程服务器时，一般我们都会使用 `ssh-keygen` 生成秘钥，然后上传 `id_rsa.pub` 到远程服务器，这样，之后的访问便不再需要输入密码，十分方便，同时也十分安全。

这里的 `ssh-keygen` 生成的就是 RSA 的两把钥匙。访问远程服务器和拉取 Git 仓库这些常见操作底层都是在使用 RSA 进行鉴权，只是一般我们并不去注意而已。

`ssh-keygen` 生成的公钥和私钥默认保存目录为 `~/.ssh`，公钥为 `~/.ssh/id_rsa.pub`，私钥为 `~/.ssh/id_rsa`。

我们现在来生成一对秘钥看看他们的格式是怎样的，上面的几个关键数字 n, e, d 又是怎样保存的。

```bash
$ ssh-keygen -f rsa
```

我们得到了 `rsa` 和 `rsa.pub` 文件，其中 `rsa` 是私钥，`rsa.pub` 是公钥。

先来看公钥，`rsa.pub` 的内容如下。

```text
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMIcdbPh0r8kftRomVX4+6HkCoZYYoWPvI7AQvcEvanZl+j2AqWEFoC8zHMXqXLlMPeE5Nt0tzLFixw9sKOhA3llc2CL4B3cJaYQ1GHI6bpSX1U1PkBtm1YaIMR+d/r22o5On/U0B4Zkmo5Ua+XI3yeYqkyCLgRWz1832IIl9dVvNSln9R89Ox1XOvuMxNnEeACcSBmnAGvY5Jykhf4TBDwwNRmqZpusqkpkfhA6Y9PvjbRNMfcDEz82VV1VeLxIg3ayC6MX5I4vXFORIzx+VbBnxwing8vQZAHj0lFNmWeOZzoh3o9k4uFCSzWezVQD9JV9xQorjsZ5AB1Zdqb1J5 cj@CJs-MacBook-Pro.local
```

这个格式是 OpenSSH 公钥格式，[RFC4253] 中有详细的说明。简单来说，公钥分为三个部分

- 秘钥类型：`ssh-rsa`
- PEM 编码的一段数据：`AAAA..b1J5`
- 备注：`cj@CJs-Macbook-Pro.local`

PEM 的全称是 [Privacy Enhanced Mail]，是一种 Base64 编码，使用 ASCII 来编码二进制数据。

PEM 编码的数据是三个 `(length, data)` 数据块，`length` 为四个字节，BigEndian。

- 第一个 data 表示秘钥类型，和公钥第一部分相同
- 第二个 data 为 RSA exponent，也就是 e
- 第三个 data 为 RSA modulus，也就是 d

根据上面的知识，我们可以很容易地解析 `rsa.pub` 文件，下文中提到的 `rsademo` 程序实现了公钥解析的逻辑。

```bash
$ rsademo -parse rsa.pub
OpenSSH Public Key
  algorithm: ssh-rsa
  e: 0x010001
  n: 0xCC21C75B3E1D2BF247ED4689955F8FBA1E40A865862858FBC8EC042F704BDA9D997E8F602A5841680BCCC7317A972E530F784E4DB74B732C58B1C3DB0A3A103796573608BE01DDC25A610D461C8E9BA525F55353E406D9B561A20C47E77FAF6DA8E4E9FF5340786649A8E546BE5C8DF2798AA4C822E0456CF5F37D88225F5D56F352967F51F3D3B1D573AFB8CC4D9C478009C4819A7006BD8E49CA485FE13043C303519AA669BACAA4A647E103A63D3EF8DB44D31F703133F36555D5578BC488376B20BA317E48E2F5C5391233C7E55B067C708A783CBD06401E3D2514D99678E673A21DE8F64E2E1424B359ECD5403F4957DC50A2B8EC679001D5976A6F5279
```

我们也可以使用 `openssl` 来解析。因为公钥是 OpenSSH 的格式，需要先转换到标准的 PEM 格式。

```bash
$ ssh-keygen -e -m PEM -f rsa.pub | openssl asn1parse -inform PEM
    0:d=0  hl=4 l= 266 cons: SEQUENCE
    4:d=1  hl=4 l= 257 prim: INTEGER           :CC21C75B3E1D2BF247ED4689955F8FBA1E40A865862858FBC8EC042F704BDA9D997E8F602A5841680BCCC7317A972E530F784E4DB74B732C58B1C3DB0A3A103796573608BE01DDC25A610D461C8E9BA525F55353E406D9B561A20C47E77FAF6DA8E4E9FF5340786649A8E546BE5C8DF2798AA4C822E0456CF5F37D88225F5D56F352967F51F3D3B1D573AFB8CC4D9C478009C4819A7006BD8E49CA485FE13043C303519AA669BACAA4A647E103A63D3EF8DB44D31F703133F36555D5578BC488376B20BA317E48E2F5C5391233C7E55B067C708A783CBD06401E3D2514D99678E673A21DE8F64E2E1424B359ECD5403F4957DC50A2B8EC679001D5976A6F5279
  265:d=1  hl=2 l=   3 prim: INTEGER           :010001
```

可以很容易地看出第一个数字是 d，第二个数字是 e，都是十六进制的表达方式。

私钥的内容如下。

```text
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAzCHHWz4dK/JH7UaJlV+Puh5AqGWGKFj7yOwEL3BL2p2Zfo9gKlhB
aAvMxzF6ly5TD3hOTbdLcyxYscPbCjoQN5ZXNgi+Ad3CWmENRhyOm6Ul9VNT5AbZtWGiDE
fnf69tqOTp/1NAeGZJqOVGvlyN8nmKpMgi4EVs9fN9iCJfXVbzUpZ/UfPTsdVzr7jMTZxH
gAnEgZpwBr2OScpIX+EwQ8MDUZqmabrKpKZH4QOmPT7420TTH3AxM/NlVdVXi8SIN2sguj
F+SOL1xTkSM8flWwZ8cIp4PL0GQB49JRTZlnjmc6Id6PZOLhQks1ns1UA/SVfcUKK47GeQ
AdWXam9SeQAAA9B/9/tPf/f7TwAAAAdzc2gtcnNhAAABAQDMIcdbPh0r8kftRomVX4+6Hk
CoZYYoWPvI7AQvcEvanZl+j2AqWEFoC8zHMXqXLlMPeE5Nt0tzLFixw9sKOhA3llc2CL4B
3cJaYQ1GHI6bpSX1U1PkBtm1YaIMR+d/r22o5On/U0B4Zkmo5Ua+XI3yeYqkyCLgRWz183
2IIl9dVvNSln9R89Ox1XOvuMxNnEeACcSBmnAGvY5Jykhf4TBDwwNRmqZpusqkpkfhA6Y9
PvjbRNMfcDEz82VV1VeLxIg3ayC6MX5I4vXFORIzx+VbBnxwing8vQZAHj0lFNmWeOZzoh
3o9k4uFCSzWezVQD9JV9xQorjsZ5AB1Zdqb1J5AAAAAwEAAQAAAQEAiC1gmPXu8ApJAXk0
/3kooLjd2Xkg7nmuPnN0t1DqyYSpiUyMkrMdrxNwINJZPdGhh4hydFX693J2GODXlxL1Dq
A0vc9HMmeF6FUmTcdvO1YI5IgaRtxrEB15xUeSoBOfzDQqBjK7p5ZVPV72urdz2nZKj3MU
ERk/fzRYYiDMDa9o4frPay3vc2NLSjqbrpFXTHGBYGpVoIY1R7awczBILIz+TqVZ0Awlpp
89aU3K9K4Sbgnb6p0dcGD8FLoRI5geviLOwYbAnuELxzMrJSVC4xH6UMiLGGqm07qpB3cx
Dd2M6jW1179bNko5qHnbsi87SYO5ms+3mRnin6I08kBogQAAAIEAlAGXHrG3+L73gXfK74
8qoC//E97EdtjPZImAr4Ess62TTfOi3SBungRvmXtWY9s/gkimZa6BL2elyEWlwlLlllX2
jZLbLDjRbGdEmjEwIlzF6Dlkv5EiuGzzJ06MirVuOVpWSgtI3GL+Ir8ovibHq+zz7MGPMQ
dsqqASDZXvPn8AAACBAP/frz0gP1YC6w1ZPIcNCFgcWqfKofSwQviZGthpk04ZwwCkNu2X
sG61MqhnsrUt2vJhMtB0khboXa1SxHO6og5duCH2Tn8uWlZsTiFAjhqOxuZwaCd2f+1tgc
4SUpIdavJrkeLLUM+7JprdUeqGGrv9ae5vtfhEBozbwDGm3CJFAAAAgQDMO487OesMXGh2
p2WES/pw+LxJuFqtZZY8Oy2uBNJKXNeFWXioiL4EglMLBgPz5zFkg73qMF2cTP/XFSiO8z
q6LUJOy6FnKDPF8eo5jkaIjyLK3ue9BjF79AB2vkB5APSwNBS6Q5sryKqlaT1u3mx+45FZ
HLB/Zl4iDn404UoMpQAAABhjakBDSnMtTWFjQm9vay1Qcm8ubG9jYWwB
-----END OPENSSH PRIVATE KEY-----
```

我并没有找到标准的格式说明文档，不过这篇博客 [The OpenSSH Private Key Format](https://coolaj86.com/articles/the-openssh-private-key-format/) 写的很清楚，我验证了一下，是对的。

简单来说，除去开头和结尾的 Marker，中间部分是 Base64 编码的一段数据，数据格式如下：

```
"openssh-key-v1"0x00    # NULL-terminated "Auth Magic" string
32-bit length, "none"   # ciphername length and string
32-bit length, "none"   # kdfname length and string
32-bit length, nil      # kdf (0 length, no kdf)
32-bit 0x01             # number of keys, hard-coded to 1 (no length)
32-bit length, sshpub   # public key in ssh format
    32-bit length, keytype
    32-bit length, pub0
    32-bit length, pub1
32-bit length for rnd+prv+comment+pad
    64-bit dummy checksum?  # a random 32-bit int, repeated
    32-bit length, keytype  # the private key (including public)
    32-bit length, pub0     # Public Key parts
    32-bit length, pub1
    32-bit length, prv0     # Private Key parts
    ...                     # (number varies by type)
    32-bit length, comment  # comment string
    padding bytes 0x010203  # pad to blocksize (see notes below)
```

根据上面的描述，我们会发现，其实私钥文件中完整编码了公钥的信息，所以通过私钥我们可以很容易地“恢复”出公钥文件。

```bash
$ ssh-keygen -y -f rsa
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMIcdbPh0r8kftRomVX4+6HkCoZYYoWPvI7AQvcEvanZl+j2AqWEFoC8zHMXqXLlMPeE5Nt0tzLFixw9sKOhA3llc2CL4B3cJaYQ1GHI6bpSX1U1PkBtm1YaIMR+d/r22o5On/U0B4Zkmo5Ua+XI3yeYqkyCLgRWz1832IIl9dVvNSln9R89Ox1XOvuMxNnEeACcSBmnAGvY5Jykhf4TBDwwNRmqZpusqkpkfhA6Y9PvjbRNMfcDEz82VV1VeLxIg3ayC6MX5I4vXFORIzx+VbBnxwing8vQZAHj0lFNmWeOZzoh3o9k4uFCSzWezVQD9JV9xQorjsZ5AB1Zdqb1J5
```

有了结构说明，就不难自己实现解析器了。同样，下文的 `rsademo` 程序实现了私钥的解析逻辑。

```bash
$ rsademo -parse rsa
OpenSSH Private Key
  keyType: ssh-rsa
  n: 0xCC21C75B3E1D2BF247ED4689955F8FBA1E40A865862858FBC8EC042F704BDA9D997E8F602A5841680BCCC7317A972E530F784E4DB74B732C58B1C3DB0A3A103796573608BE01DDC25A610D461C8E9BA525F55353E406D9B561A20C47E77FAF6DA8E4E9FF5340786649A8E546BE5C8DF2798AA4C822E0456CF5F37D88225F5D56F352967F51F3D3B1D573AFB8CC4D9C478009C4819A7006BD8E49CA485FE13043C303519AA669BACAA4A647E103A63D3EF8DB44D31F703133F36555D5578BC488376B20BA317E48E2F5C5391233C7E55B067C708A783CBD06401E3D2514D99678E673A21DE8F64E2E1424B359ECD5403F4957DC50A2B8EC679001D5976A6F5279
  e: 0x010001
  d: 0x882D6098F5EEF00A49017934FF7928A0B8DDD97920EE79AE3E7374B750EAC984A9894C8C92B31DAF137020D2593DD1A18788727455FAF7727618E0D79712F50EA034BDCF47326785E855264DC76F3B5608E4881A46DC6B101D79C54792A0139FCC342A0632BBA796553D5EF6BAB773DA764A8F731411193F7F34586220CC0DAF68E1FACF6B2DEF73634B4A3A9BAE91574C7181606A55A0863547B6B07330482C8CFE4EA559D00C25A69F3D694DCAF4AE126E09DBEA9D1D7060FC14BA1123981EBE22CEC186C09EE10BC7332B252542E311FA50C88B186AA6D3BAA90777310DDD8CEA35B5D7BF5B364A39A879DBB22F3B4983B99ACFB79919E29FA234F2406881
  p: 0xFFDFAF3D203F5602EB0D593C870D08581C5AA7CAA1F4B042F8991AD869934E19C300A436ED97B06EB532A867B2B52DDAF26132D0749216E85DAD52C473BAA20E5DB821F64E7F2E5A566C4E21408E1A8EC6E6706827767FED6D81CE1252921D6AF26B91E2CB50CFBB269ADD51EA861ABBFD69EE6FB5F844068CDBC031A6DC2245
  q: 0xCC3B8F3B39EB0C5C6876A765844BFA70F8BC49B85AAD65963C3B2DAE04D24A5CD7855978A888BE0482530B0603F3E7316483BDEA305D9C4CFFD715288EF33ABA2D424ECBA1672833C5F1EA398E46888F22CADEE7BD06317BF40076BE407900F4B03414BA439B2BC8AAA5693D6EDE6C7EE391591CB07F665E220E7E34E14A0CA5
```

如果使用 `openssl` 的话，可以通过如下指令解析私钥。`ssh-keygen` 无法直接更改私钥的格式，需要曲线救国，使用它“修改密码”的功能，参考 [这个提问](https://unix.stackexchange.com/questions/84060/convert-openssh-private-key-into-ssh2-private-key)

```bash
$ cp rsa rsa.pem
$ ssh-keygen -p -m PEM -f rsa.pem
$ cat rsa.pem
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAzCHHWz4dK/JH7UaJlV+Puh5AqGWGKFj7yOwEL3BL2p2Zfo9g
KlhBaAvMxzF6ly5TD3hOTbdLcyxYscPbCjoQN5ZXNgi+Ad3CWmENRhyOm6Ul9VNT
5AbZtWGiDEfnf69tqOTp/1NAeGZJqOVGvlyN8nmKpMgi4EVs9fN9iCJfXVbzUpZ/
UfPTsdVzr7jMTZxHgAnEgZpwBr2OScpIX+EwQ8MDUZqmabrKpKZH4QOmPT7420TT
H3AxM/NlVdVXi8SIN2sgujF+SOL1xTkSM8flWwZ8cIp4PL0GQB49JRTZlnjmc6Id
6PZOLhQks1ns1UA/SVfcUKK47GeQAdWXam9SeQIDAQABAoIBAQCILWCY9e7wCkkB
eTT/eSiguN3ZeSDuea4+c3S3UOrJhKmJTIySsx2vE3Ag0lk90aGHiHJ0Vfr3cnYY
4NeXEvUOoDS9z0cyZ4XoVSZNx287VgjkiBpG3GsQHXnFR5KgE5/MNCoGMrunllU9
Xva6t3PadkqPcxQRGT9/NFhiIMwNr2jh+s9rLe9zY0tKOpuukVdMcYFgalWghjVH
trBzMEgsjP5OpVnQDCWmnz1pTcr0rhJuCdvqnR1wYPwUuhEjmB6+Is7BhsCe4QvH
MyslJULjEfpQyIsYaqbTuqkHdzEN3YzqNbXXv1s2SjmoeduyLztJg7maz7eZGeKf
ojTyQGiBAoGBAP/frz0gP1YC6w1ZPIcNCFgcWqfKofSwQviZGthpk04ZwwCkNu2X
sG61MqhnsrUt2vJhMtB0khboXa1SxHO6og5duCH2Tn8uWlZsTiFAjhqOxuZwaCd2
f+1tgc4SUpIdavJrkeLLUM+7JprdUeqGGrv9ae5vtfhEBozbwDGm3CJFAoGBAMw7
jzs56wxcaHanZYRL+nD4vEm4Wq1lljw7La4E0kpc14VZeKiIvgSCUwsGA/PnMWSD
veowXZxM/9cVKI7zOrotQk7LoWcoM8Xx6jmORoiPIsre570GMXv0AHa+QHkA9LA0
FLpDmyvIqqVpPW7ebH7jkVkcsH9mXiIOfjThSgylAoGBANSTUnQXCWd8zyjs3TNZ
6XfCPrKtzvWJRmpgUIRA2eeF0ZMD2rpzTln7YdW1KSwKp568j8nNPt2XONRZMerv
v9jtlZ9pkPdqXBT2r8ZCaoy315j1BCLc+RUY6EF6yWyo0gQKyE3CGiYq1rzMaFTO
CwHpXAuCdYyHf2Wg38CgXrx9AoGAHvN3xXYFlR38Bt9flykcjzpi7pktxNF8byxY
w+KfK/3d+6uPiZsPkQdfJnCG8NO8vIrqoS8rQKC6tRHTz7Y01Do/rklV8Jg7IGiF
IqvZLKDkmPInFJJ3tV1JJLW4d54ZdwqtiXztazlCA0drs/2pW6GJSYP7i5Mr+OVR
YxoxarECgYEAlAGXHrG3+L73gXfK748qoC//E97EdtjPZImAr4Ess62TTfOi3SBu
ngRvmXtWY9s/gkimZa6BL2elyEWlwlLlllX2jZLbLDjRbGdEmjEwIlzF6Dlkv5Ei
uGzzJ06MirVuOVpWSgtI3GL+Ir8ovibHq+zz7MGPMQdsqqASDZXvPn8=
-----END RSA PRIVATE KEY-----
```

得到 PEM 格式的私钥以后，剩下就好办了。

```bash
$ openssl asn1parse -inform PEM < rsa.pem
    0:d=0  hl=4 l=1189 cons: SEQUENCE
    4:d=1  hl=2 l=   1 prim: INTEGER           :00
    7:d=1  hl=4 l= 257 prim: INTEGER           :CC21C75B3E1D2BF247ED4689955F8FBA1E40A865862858FBC8EC042F704BDA9D997E8F602A5841680BCCC7317A972E530F784E4DB74B732C58B1C3DB0A3A103796573608BE01DDC25A610D461C8E9BA525F55353E406D9B561A20C47E77FAF6DA8E4E9FF5340786649A8E546BE5C8DF2798AA4C822E0456CF5F37D88225F5D56F352967F51F3D3B1D573AFB8CC4D9C478009C4819A7006BD8E49CA485FE13043C303519AA669BACAA4A647E103A63D3EF8DB44D31F703133F36555D5578BC488376B20BA317E48E2F5C5391233C7E55B067C708A783CBD06401E3D2514D99678E673A21DE8F64E2E1424B359ECD5403F4957DC50A2B8EC679001D5976A6F5279
  268:d=1  hl=2 l=   3 prim: INTEGER           :010001
  273:d=1  hl=4 l= 257 prim: INTEGER           :882D6098F5EEF00A49017934FF7928A0B8DDD97920EE79AE3E7374B750EAC984A9894C8C92B31DAF137020D2593DD1A18788727455FAF7727618E0D79712F50EA034BDCF47326785E855264DC76F3B5608E4881A46DC6B101D79C54792A0139FCC342A0632BBA796553D5EF6BAB773DA764A8F731411193F7F34586220CC0DAF68E1FACF6B2DEF73634B4A3A9BAE91574C7181606A55A0863547B6B07330482C8CFE4EA559D00C25A69F3D694DCAF4AE126E09DBEA9D1D7060FC14BA1123981EBE22CEC186C09EE10BC7332B252542E311FA50C88B186AA6D3BAA90777310DDD8CEA35B5D7BF5B364A39A879DBB22F3B4983B99ACFB79919E29FA234F2406881
  534:d=1  hl=3 l= 129 prim: INTEGER           :FFDFAF3D203F5602EB0D593C870D08581C5AA7CAA1F4B042F8991AD869934E19C300A436ED97B06EB532A867B2B52DDAF26132D0749216E85DAD52C473BAA20E5DB821F64E7F2E5A566C4E21408E1A8EC6E6706827767FED6D81CE1252921D6AF26B91E2CB50CFBB269ADD51EA861ABBFD69EE6FB5F844068CDBC031A6DC2245
  666:d=1  hl=3 l= 129 prim: INTEGER           :CC3B8F3B39EB0C5C6876A765844BFA70F8BC49B85AAD65963C3B2DAE04D24A5CD7855978A888BE0482530B0603F3E7316483BDEA305D9C4CFFD715288EF33ABA2D424ECBA1672833C5F1EA398E46888F22CADEE7BD06317BF40076BE407900F4B03414BA439B2BC8AAA5693D6EDE6C7EE391591CB07F665E220E7E34E14A0CA5
  798:d=1  hl=3 l= 129 prim: INTEGER           :D49352741709677CCF28ECDD3359E977C23EB2ADCEF589466A60508440D9E785D19303DABA734E59FB61D5B5292C0AA79EBC8FC9CD3EDD9738D45931EAEFBFD8ED959F6990F76A5C14F6AFC6426A8CB7D798F50422DCF91518E8417AC96CA8D2040AC84DC21A262AD6BCCC6854CE0B01E95C0B82758C877F65A0DFC0A05EBC7D
  930:d=1  hl=3 l= 128 prim: INTEGER           :1EF377C57605951DFC06DF5F97291C8F3A62EE992DC4D17C6F2C58C3E29F2BFDDDFBAB8F899B0F91075F267086F0D3BCBC8AEAA12F2B40A0BAB511D3CFB634D43A3FAE4955F0983B20688522ABD92CA0E498F227149277B55D4924B5B8779E19770AAD897CED6B394203476BB3FDA95BA1894983FB8B932BF8E551631A316AB1
 1061:d=1  hl=3 l= 129 prim: INTEGER           :9401971EB1B7F8BEF78177CAEF8F2AA02FFF13DEC476D8CF648980AF812CB3AD934DF3A2DD206E9E046F997B5663DB3F8248A665AE812F67A5C845A5C252E59655F68D92DB2C38D16C67449A3130225CC5E83964BF9122B86CF3274E8C8AB56E395A564A0B48DC62FE22BF28BE26C7ABECF3ECC18F31076CAAA0120D95EF3E7F
```

我们得到了一堆数字，对照如下的说明，就可以知道每个数字的含义。

```text
RSAPrivateKey ::= SEQUENCE {
    version           Version,
    modulus           INTEGER,  -- n
    publicExponent    INTEGER,  -- e
    privateExponent   INTEGER,  -- d
    prime1            INTEGER,  -- p
    prime2            INTEGER,  -- q
    exponent1         INTEGER,  -- d mod (p-1)
    exponent2         INTEGER,  -- d mod (q-1)
    coefficient       INTEGER,  -- (inverse of q) mod p
    otherPrimeInfos   OtherPrimeInfos OPTIONAL
}
```

## Use RSA

清楚了公私钥格式以后，我们来看看怎样直接使用 RSA 来加密数据。

因为加密的消息 m 必须要小于 n，所以，在日常应用中，RSA 不会用来直接加密消息，而是用来加密一个对称秘钥，再用这个对称秘钥加密消息。

当然，直接加密一个消息自然是不会有任何问题的，这里我们来演示一下。

```bash
# 生成我们的私密消息
$ echo "This is our secret message." > secret.txt
# 使用 RSA 加密，注意要转换公钥格式到 PKCS8
$ openssl rsautl -encrypt -oaep -pubin -inkey <(ssh-keygen -e -m PKCS8 -f rsa.pub) -in secret.txt -out secret.txt.enc
# 加密以后的文件是 secret.txt.enc
# 接下来使用 RSA 解密，同样要转换私钥格式
# 我们使用上文中得到的 PEM 格式私钥，rsa.pem
$ openssl rsautl -decrypt -oaep -inkey rsa.pem -in secret.txt.enc -out result.txt
# 验证一下是否得到了原始消息
$ cat result.txt
This is our secret message.
```

上面我们提到的 RSA 加密过程，也就是 $m^e \equiv c \pmod n$，也被称为教科书式 RSA。工程应用中，不会直接这样处理，而是会存在一个 Padding 的过程，具体不再展开，感兴趣可以去看 [RSA - theory and implementation](https://eli.thegreenplace.net/2019/rsa-theory-and-implementation/)。


注意，密码学中有很多微妙的问题要考虑。我们这里所做的一切都是为了学习和理解他们的工作原理，而不是为了自己去实现他们。**千万不要自己去实现任何加密解密算法，专业的事情交给专业的人员处理就好**。

## A Simple Demo

基于上面的理解，我们来实现自己的 RSA 程序就不难了。

[rsademo] 是我使用 Go 开发的一个 RSA 实现。可以解析 OpenSSH 的秘钥文件以及演示 RSA 加解密，具体功能可以查看 GitHub 的 README。

使用 `rsademo` 加解密需要提供两个质数，可以使用 [这个网站](https://www.browserling.com/tools/prime-numbers) 来生成。

现在我们使用 `101` 和 `103` 两个质数来生成加密所需的 `n`, `e`, `d`，然后加密数字 `1024`。

```bash
$ rsademo -enc 101 103 1024
Key details:
  p: 101
  q: 103
  n: 10403
  phi(n): 10200
  e: 7
  d: 8743
Encrypt message: 1024
Encrypt result: 9803
```

可以发现，加密以后的数字为 `9803`，大家可以自行验证一下，$1024^7 \pmod {10403}$ 是不是等于 9803。

然后我们来进行解密：

```bash
$ rsademo -dec 101 103 1024
Key details:
  p: 101
  q: 103
  n: 10403
  phi(n): 10200
  e: 7
  d: 8743
Decrypt cipher: 9803
Decrypt result: 1024
```

🎉 我们得到了 `1024`！

## 参考

- http://www.ruanyifeng.com/blog/2013/06/rsa_algorithm_part_one.html
- https://blog.oddbit.com/post/2011-05-08-converting-openssh-public-keys/
- https://eli.thegreenplace.net/2019/rsa-theory-and-implementation/

[费马小定理]: https://zh.wikipedia.org/zh-hans/%E8%B4%B9%E9%A9%AC%E5%B0%8F%E5%AE%9A%E7%90%86
[二项式定理]: https://zh.wikipedia.org/wiki/%E4%BA%8C%E9%A1%B9%E5%BC%8F%E5%AE%9A%E7%90%86
[模反元素]: https://zh.wikipedia.org/wiki/%E6%A8%A1%E5%8F%8D%E5%85%83%E7%B4%A0
[Privacy Enhanced Mail]: https://en.wikipedia.org/wiki/Base64#Privacy-enhanced_mail
[RFC4253]: https://tools.ietf.org/html/rfc4253#section-6.6
[rsademo]: https://github.com/cj1128/rsa-demo
