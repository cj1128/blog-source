---
title: Underhanded C, 有猫腻的 C
cover: /image/9b85365djw1f7bmw01i31j21hc0zkgr3.jpg
date: 2015-06-16T00:00:00+08:00
tags: [underhanded-c, c]
---

这一切，都要从这篇文章说起，[Being Sneaky in C](http://www.codersnotes.com/notes/being-sneaky-in-c)。

通过这篇文章，我了解到，原来外国有一种比赛，叫做 _Underhanded C_（中文翻译：有猫腻的 C），完成规定的题目，要求是写出看起来毫无问题的代码，但是却偷偷的藏有 Bug 或者说后门。

这篇文章说的就是作者参与了这个比赛，以及他的解决方案。

<!--more-->

我先来解释一下这道题目：

> The contest challenge is that you, as a vigilante programmer fighting for the common man, wants to actually leak that logging decision out to the user even though your boss instructed you not to. So your code needs to look perfectly innocent even though it’s doing something underhanded.

题目的要求是写一个类似 Twitter 的服务，接受一条消息（称为一个 piu），然后需要做决定是否 surveil（监视）这条 piu，这个决策过程是秘密的。不可以让用户知道。现在编码者的任务是：需要写出看起来没有任何问题的代码，但是偷偷的将决策结果泄露出来给用户知道。

这是整个程序的[源代码](http://www.underhanded-c.org/_p_26.html)，推荐下载下来学习一下。

现在来分析作者的解决方案，作者利用的核心漏洞是 **malloc 不清除被释放的内存，并且二次分配很有可能得到上次被释放的内存块**。

示例如下：

```c
uint8 *block1 = (uint8 *)malloc(1000);
*block1 = 100;
free(block1);
uint8 *block2 = (uint8 *)malloc(1000); // this time, it's very likely that block2 == block1
assert(*block2 == 100); // we can get previous value
```

`malloc` 是一个常用的堆内存管理函数，不过却有一些非常严重的问题，以上就是一个例子。安全问题往往都在细微之处，但是却都非常致命，上一次非常著名的 HeartBleed 心脏滴血漏洞也是一个细微的问题导致的。

作者利用这个 bug，巧妙的将 surveil 的信息保留了下来。每一个决定需要被 surveil 的 piu，都被加密（异或 0x69）然后写入文件（加密是在一个 copy 上完成的）。

当决策过程结束以后，接下来就会做关键词过滤（比如 fuck -> love, shit -> stuff，哈哈）在这个过程中，又会分配内存复制 piu 进行操作，此时得到的内存块就是决策过程中使用的内存块，内存中的信息都被保留在那里没有清除。因为被监视（surveiled）的 piu 会和 0x69 异或，所以最后一个字节会是 0x69（C 的字符串最后一个字节都是 0），而没有被监视的最后一个字节则是 0。

下面是一些关键的代码：

```c
typedef struct piu_struct {
    int piu_id;
    int piu_id_of_repiu, user_id_of_repiu;    /* zero if not a re-Piu */

    int user_id_of_poster;
    user * poster;

    char piu_text_utf8[140*4+1];
    unsigned char piu_length;   /* UTF8 characters, not bytes */
    unsigned char visible_only_to_followers;
} piu;

typedef struct {
    char buffer[140*4+1];
    time_t stamp;
    int count;
} filter_data;
```

注意 piu 结构体中 `piu_text_uft8` 是 641 个字节，而 `filter_data` 中则是 640 个字节。所以复制的时候，最后一个字节复制到 `filter_data` 中属于 stamp 的字段，覆盖其最低位的字节。所以最后，用户通过观察时间字段的最低位是否是0x69就可以判断消息有没有被监听。

下载源代码，运行 test，会发现，得到的时间比当前时间稍微慢了一点，大概几分钟，那是因为时间字段最后一个字节要么被清零，要么被设置为 0x69 了。这个 bug 真是巧妙。

这真是一个有意思的比赛，官网上 [UnderhandedC](http://www.underhanded-c.org) 还有很多其他的解答，大家有兴趣可以自己去看看。
