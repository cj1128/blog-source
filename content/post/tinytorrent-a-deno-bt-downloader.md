---
title: "tinyTorrent: 从头写一个 Deno 的 BitTorrent 下载器"
date: 2020-10-31T23:30:48+08:00
cover: https://asset.cjting.cn/FlijgHgi1MIL_TKTl6i9eZdvIvix.jpg
tags: [bittorrent bt deno]
---

BitTorrent 想必大家应该都不陌生，中文名叫做“种子”。

“种子”到底是什么？我一直不太清楚。在写这个项目之前，我对“种子”的认识停留在使用层面。

当我想找一个资源的时候，我会搜索 `xxx 种子`，一般会在一些非常不知名的小网站里面获取到以 `.torrent` 结尾的种子文件，然后使用迅雷或者 uTorrent 这样的下载器来下载。

如果迅雷有一点速度，哪怕几 kb，那么大概率我充个会员就搞定了。这个软件就是这么的恶心，不用有时候又没办法，像极了人生。

其他下载器比如 uTorrent 的话就一切随缘了，有些资源非常快，有些资源非常慢，有些一开始慢后来快。

这些问题是怎么回事？有没有改进的办法？在读 Jesse Li 的 [Building a BitTorrent client from the ground up in Go](https://blog.jse.li/posts/torrent/) 之前，我从没想过。

<!--more-->

## BitTorrent(BT)

Jesse Li 的博客图文并茂，讲述了如何用 Go 开发一个 BT 的下载器。内容涉及到 BT 协议以及下载器的代码设计，思路清晰，值得一读。

对于喜欢动手的朋友，可以先关掉这篇博客，参考 Jesse 的代码尝试自己写一个 BT 下载器。写完以后再回来，对比我用 Deno 开发的下载器，相信会有不一样的收获。

我们先来看一下 BT 是什么。

{{% tip %}}
BT 一直在演进，新的功能比如有 DHT，磁力链接等，这里我们关注最早版本的 BT。
{{% /tip %}}

BT 是一个协议，和 HTTP, FTP 一样，是一个应用层的协议，这个协议被设计用来实现 P2P(Peer to Peer) 下载。

P2P 我想大家都很了解，中文翻译为点对点，不仅可以用来下载，还可以用来金融😉。

传统的下载是客户端请求服务器获取资源，下载方和资源提供方的角色很清楚。这样做的优点是简单，易于理解，我要下载东西，我就去请求服务器，缺点也很明显：

- 一旦服务器故障，大家都无法下载
- 服务器带宽有限，下载的人多速度必然下降

而 P2P 则不一样，每一个客户端同时也是服务器，从别人那里下载资源的同时，也提供资源给到别人。这样一来，就规避了服务器模型的缺点：

- 每个人都是服务器，除非所有机器都故障了，否则网络依旧可以运转
- 不会去请求单一机器，带宽得到最大利用

[The BitTorrent Protocol Specification](https://www.bittorrent.org/beps/bep_0003.html) 是 BT 协议的官方文档，里面阐述了 BT 的核心概念和设计，但是漏了很多细节。推荐配合 [Unofficial BitTorrent Specification](https://wiki.theory.org/BitTorrentSpecification) 这个民间整理的版本一起看，会更有助于理解。

当学习一个新知识的时候，我喜欢用「提问法」来帮助自己梳理，带着问题去找资料会更有方向。

现在我们知道 BT 是基于种子文件的一种 P2P 下载协议，那么很自然地我们可以提出如下的问题：

- 种子文件是什么格式？里面存储了哪些信息？
- 下载器如何寻找 Peer？如何让别的 Peer 找到自己？
- 下载时是以整个文件为单位吗？还是会分块，如果分，怎么分？
- 怎样从 Peer 那里下载文件？怎样提供文件给到 Peer 下载？
- 使用种子下载一个文件的完整流程是怎样的？

### Torrent File

我们先来看第一个问题，种子文件的格式和里面存储的信息。

种子文件使用了一种名为 [Bencode](https://en.wikipedia.org/wiki/Bencode) 的编码，这个编码非常简单，只支持如下四种数据类型。因为存在 List 和 Dictionary，所以也有能力表达复杂的数据结构。

- Byte String
- Integer
- List
- Dictionary

[deno-bencode](https://deno.land/x/bencode@v0.1.2) 是我给 Deno 写的一个 Bencode 编解码库，我们现在使用这个库来看看种子文件中到底有什么。

我们用 Debian 的官方种子文件来测试。

```typescript
// decode.ts
import { decode } from "https://deno.land/x/bencode@v0.1.2/mod.ts"

const file = Deno.args[0]
console.log(decode(Deno.readFileSync(file)))
```

```bash
$ wget https://cdimage.debian.org/debian-cd/current/amd64/bt-cd/debian-10.6.0-amd64-netinst.iso.torrent
$ deno run --allow-read decode.ts debian-10.6.0-amd64-netinst.iso.torrent
{
  announce: "http://bttracker.debian.org:6969/announce",
  comment: '"Debian CD from cdimage.debian.org"',
  "creation date": 1601120878,
  httpseeds: [
    "https://cdimage.debian.org/cdimage/release/10.6.0//srv/cdbuilder.debian.org/dst/deb-cd/weekly-builds...",
    "https://cdimage.debian.org/cdimage/archive/10.6.0//srv/cdbuilder.debian.org/dst/deb-cd/weekly-builds..."
  ],
  info: {
    length: 365953024,
    name: "debian-10.6.0-amd64-netinst.iso",
    "piece length": 262144,
    pieces: Uint8Array(27920) [
      144,  55, 173,  67, 115, 234, 169, 248, 222,  41, 139, 142, 125,
      100, 183, 130,  43, 148, 137, 130,   2, 194,  83, 109, 140, 147,
      123, 174, 234, 135,  58, 207, 217, 141, 107,  86, 245, 137,  79,
      150,  23,  33, 151, 157, 125, 159,  97,  10, 200, 137,  36, 158,
       74,  19,  97, 194, 171, 164,  32, 145, 175, 213,  91, 193, 120,
       26,  89, 109, 114,  61,  90, 166, 168, 137, 218, 154, 219, 119,
      107,  46, 240,  50, 134, 161, 162,  18, 224,  51, 210,  61,  41,
        6, 207, 124,  62, 199, 227, 134, 146, 206,
      ... 27820 more items
    ]
  }
}
```

首先，种子文件是一个 Bencode 编码的 Dictionary，里面含有一些字段，比较重要的是这些：

- `announce`: 这是一个 URL，作用后面再说
- `info`: 这个又是一个 Dictionary，里面含有文件相关的信息
  - `length`: 文件的总长度，单位是字节
  - `name`: 文件名
  - `piece length`: Piece（分段） 的长度，单位是字节
  - `pieces`: 一个数组，里面对应了每个 Piece 的 SHA1 哈希值，用于校验（SHA1 哈希值长度固定为 20 个字节）

从文件里面的信息来看，我们可以得知，种子是分为 Piece 的，每个 Piece 的长度在文件中已经确定，同时，种子文件也会提供每个 Piece 的 SHA1 哈希值用于校验 Piece 的有效性。

我们来核对一下数据。

- 文件长度是 365953024 个字节，也就是 349MB，
- 每个 Piece 的长度为 262144 个字节，也就是 256KB。
- 那么一共是 `365953024 / 262144 = 1396` 个 Piece（注意，这里不一定整除，也就是说，最后一个 Piece 它的长度可能不等于 _piece length_）
- 每个 Piece 的 SHA1 哈希是 20 个字节，所以总的是 `1396 * 20 = 27920` 个字节

所有数据都对上了🎉

大家可以发现，上面的种子只包含一个文件，很多时候，我们打开种子时，里面会有多个文件，下载器会让我们选择哪些文件需要被下载。

这里就涉及到另外一个问题，[单文件种子](https://wiki.theory.org/BitTorrentSpecification#Info_in_Single_File_Mode) 和 [多文件种子](https://wiki.theory.org/BitTorrentSpecification#Info_in_Multiple_File_Mode)，它们存储的信息略有不同，我们用一个例子来看。

我随便找了一个 Taylow Swift 的专辑 Red 的种子，打开看看。

```
$ deno run --allow-read decode.ts red.torrent
{
  announce: "http://tracker.nwps.ws:6969/announce",
  "announce-list": [
    [ "http://tracker.nwps.ws:6969/announce" ],
    [ "http://tracker.winglai.com/announce" ],
    [ "http://fr33dom.h33t.com:3310/announce" ],
    [ "http://exodus.desync.com:6969/announce" ],
    [ "http://torrent.gresille.org/announce" ],
    [ "http://tracker.trackerfix.com/announce" ],
    [ "udp://tracker.btzoo.eu:80/announce" ],
    [ "http://tracker.windsormetalbattery.com/announce" ],
    [ "udp://10.rarbg.me:80/announce" ],
    [ "udp://ipv4.tracker.harry.lu:80/announce" ],
    [ "udp://tracker.ilibr.org:6969/announce" ],
    [ "udp://tracker.zond.org:80/announce" ],
    [ "http://torrent-tracker.ru/announce.php" ],
    [ "http://bigfoot1942.sektori.org:6969/announce" ],
    [ "http://tracker.best-torrents.net:6969/announce" ],
    [ "http://announce.torrentsmd.com:6969/announce" ],
    [ "udp://tracker.token.ro:80/announce" ],
    [ "udp://open.demonii.com:80" ],
    [ "udp://tracker.coppersurfer.tk:80" ],
    [ "http://tracker.thepiratebay.org/announce" ],
    [ "udp://9.rarbg.com:2710/announce" ],
    [ "udp://open.demonii.com:1337/announce" ],
    [ "udp://tracker.ccc.de:80/announce" ],
    [ "udp://tracker.istole.it:80/announce" ],
    [ "udp://tracker.publicbt.com:80/announce" ],
    [ "udp://tracker.openbittorrent.com:80/announce" ],
    [ "udp://tracker.istole.it:80/announce" ],
    [ "http://tracker.istole.it/announce" ],
    [ "udp://tracker.publicbt.com:80/announce" ],
    [ "http://tracker.publicbt.com/announce" ],
    [ "udp://open.demonii.com:1337/announce" ],
    [ "udp://11.rarbg.me:80/announce" ],
    [ "udp://10.rarbg.me:80/announce" ],
    [ "udp://9.rarbg.com:2710/announce" ],
    [ "udp://tracker.token.ro:80/announce" ],
    [ "udp://12.rarbg.me:80/announce" ],
    [ "http://tracker.trackerfix.com/announce" ]
  ],
  comment: "Torrent downloaded from torrent cache at http://itorrents.org",
  "created by": "uTorrent/3210",
  "creation date": 1351095350,
  encoding: "UTF-8",
  info: {
    files: [
      { length: 13236894, path: [Array] },
      { length: 12992666, path: [Array] },
      { length: 12031154, path: [Array] },
      { length: 11899411, path: [Array] },
      { length: 11535936, path: [Array] },
      { length: 11465792, path: [Array] },
      { length: 9888023, path: [Array] },
      { length: 9853495, path: [Array] },
      { length: 9781419, path: [Array] },
      { length: 9684472, path: [Array] },
      { length: 9681093, path: [Array] },
      { length: 9574507, path: [Array] },
      { length: 9355103, path: [Array] },
      { length: 9154619, path: [Array] },
      { length: 9028224, path: [Array] },
      { length: 8994573, path: [Array] },
      { length: 8903823, path: [Array] },
      { length: 8895321, path: [Array] },
      { length: 8859865, path: [Array] },
      { length: 8304962, path: [Array] },
      { length: 8188974, path: [Array] },
      { length: 7797281, path: [Array] },
      { length: 7357902, path: [Array] }
    ],
    name: "Taylor Swift - Red (Deluxe Version)",
    "piece length": 16384,
    pieces: Uint8Array(276460) [
      107,  33, 238, 211, 243,  14, 230, 146,  23,  98, 147, 188, 251, 168,
      170, 253, 105,  99,  55, 208, 230,  60,  87, 198,  22, 246, 245, 186,
      141, 162,  52, 196, 196, 128,  98, 236, 121,  55, 150, 208,  40, 194,
       18,  57, 112, 165, 245,  17,  18,  51,   4,  44, 243, 254,  34, 207,
       12, 106, 201, 132,  96, 207,  61, 144, 118, 130, 211,  91,   7, 141,
       71,  36, 129, 132,  70, 115,  27, 133,  80, 240, 140, 121, 239,  28,
      240,  58, 212,  35,  20, 208,  94, 203, 176, 178, 126,  90,  37, 255,
      245,  17,
      ... 276360 more items
    ]
  }
}
```

可以发现，最大的区别在于 `info` 里面多了一个字段叫做 `files`。默认的 `console.log` 没有打印出 `path` 内容，我们改一下代码，单独打印 `files`。


```typescript
// decode2.ts
import { decode } from "https://deno.land/x/bencode@v0.1.2/mod.ts"

const file = Deno.args[0]
const result = decode(Deno.readFileSync(file)) as any
console.log(result.info.files)
```

```bash
$  deno run --allow-read decode2.ts red.torrent
[
  { length: 13236894, path: [ "Taylor Swift - All Too Well.mp3" ] },
  {
    length: 12992666,
    path: [ "Taylor Swift - State of Grace (Acoustic Version).mp3" ]
  },
  {
    length: 12031154,
    path: [ "Taylor Swift Feat Gary Lightbody - The Last Time.mp3" ]
  },
  { length: 11899411, path: [ "Taylor Swift - State of Grace.mp3" ] },
  { length: 11535936, path: [ "Taylor Swift - The Moment I Knew.mp3" ] },
  { length: 11465792, path: [ "Taylor Swift - Sad Beautiful Tragic.mp3" ] },
  {
    length: 9888023,
    path: [ "Taylor Swift Feat Ed Sheeran - Everything Has Changed.mp3" ]
  },
  { length: 9853495, path: [ "Taylor Swift - I Almost Do.mp3" ] },
  { length: 9781419, path: [ "Taylor Swift - Treacherous.mp3" ] },
  { length: 9684472, path: [ "Taylor Swift - Treacherous (Demo).mp3" ] },
  { length: 9681093, path: [ "Taylor Swift - The Lucky One.mp3" ] },
  { length: 9574507, path: [ "Taylor Swift - Begin Again.mp3" ] },
  { length: 9355103, path: [ "Taylor Swift - 22.mp3" ] },
  { length: 9154619, path: [ "Taylor Swift - Red (Demo).mp3" ] },
  { length: 9028224, path: [ "Taylor Swift - Come Back... Be Here.mp3" ] },
  { length: 8994573, path: [ "Taylor Swift - Red.mp3" ] },
  { length: 8903823, path: [ "Taylor Swift - Girl At Home.mp3" ] },
  { length: 8895321, path: [ "Taylor Swift - Starlight.mp3" ] },
  { length: 8859865, path: [ "Taylor Swift - I Knew You Were Trouble..mp3" ] },
  { length: 8304962, path: [ "Taylor Swift - Stay Stay Stay.mp3" ] },
  { length: 8188974, path: [ "Taylor Swift - Holy Ground.mp3" ] },
  {
    length: 7797281,
    path: [ "Taylor Swift - We Are Never Ever Getting Back Together.mp3" ]
  },
  { length: 7357902, path: [ "Digital Booklet - Red (Deluxe).pdf" ] }
]
```

现在就很清楚了，对多文件种子来说，`files` 里面存储了每个文件的长度，以及每个文件的路径。

### Tracker

现在我们来看第二个问题，如何找到 Peer 以及如何让 Peer 找到我们？

这里的关键就是种子文件中存储的 `announce` 字段，这个字段是一个 URL，这个 URL 指向了一个 Tracker 服务器。

Tracker 服务器顾名思义，是一个追踪者，或者说是中介。它本身不提供任何下载服务，它的作用是用来沟通 Peers。

每个 Peer 通过 PeerID 来标识自己，这是一个 20 字节的数据，格式没有要求。

我们可以通过请求 Tracker 获取到当前资源有哪些 Peer，同时，我们可以向 Tracker 注册自己成为一个 Peer。

Tracker 使用 HTTP 协议，请求时通过 Query 携带参数，下面是三个关键参数：

- `info_hash`: 这个用来表明我们请求的资源是什么，在 BT 下载中，对资源的唯一标识使用的是 InfoHash，也就是种子文件中的 `info` 字段的内容进行 SHA1 哈希以后得到的结果，20 个字节
- `peer_id`: 我们自己生成的标识身份的一个 ID，20 个字节
- `port`: 我们客户端的监听端口，用于接受其他 Peer 发来的消息

Tracker 返回的信息使用 Bencode 编码，里面含有两个数据，`interval` 和 `peers`。

```js
{
  interval: 900,
  peers: Uint8Array(300) [
    171,  33, 254,  92, 200, 213,  75,  85, 105, 120,  26, 225,  87, 122,
    122, 178, 217,   4,  89, 160, 104,  18, 200, 213, 105, 233,  64,  91,
    200, 213, 112,   3, 198, 231, 200, 213, 177, 136, 104,   4, 200, 213,
     84,   3, 130,  32, 234,  96, 206, 144,  63, 149, 200, 213,  51,  15,
    200,  26, 194, 246,  95,  78, 126, 134, 200, 213, 100,  38,  32, 104,
    200, 213, 123, 113,  10, 254, 200, 213, 148, 251, 183,  98,  26, 225,
    186, 179, 163,  68,  26, 225,  38,  88, 192,  43,  26, 225,  90, 189,
    212, 240,
    ... 200 more items
  ]
}
```

`peers` 是一个 Byte Array，每 6 个字节代表一个 Peer，前 4 个字节为 IP 地址，后 2 个字节为 BigEndian 的端口号。

以上面的输出为例，我们可以看出，第一个 Peer 是 `171.33.254.92:51413`。

{{% tip %}}
当然，后来 BT 扩展了一个 `peers6` 字段用来返回 IPv6 的地址。
{{% /tip %}}

### Download Process

最后我们来梳理一下使用 BT 下载的完整流程：

1. 解析种子文件
2. 请求 Tracker，获取 Peers 列表
3. 请求 Peers，下载 Piece，根据 `pieces` 字段校验 Piece 的有效性
4. 组装 Piece，得到完整的文件

从种子文件中，我们可以知道，资源被划分为 Piece，每个 Piece 的长度在种子文件中已经确定。

这里我们说的资源可以是一个文件（单文件种子），也可以是多个文件（多文件种子），在 BT 下载的时候，其实不区分这两种情况。不管是单文件还是多文件，都是下载一定数量的 Piece。在多文件的情况下，得到总数据以后，再根据 `files` 字段中标明的长度和路径来进行切割。

怎样请求 Peers 下载 Piece？这里就是 BT 协议的重点部分。

当我们 TCP 连接 Peer 的时候，第一步是握手。

发送如下数据给到对方进行握手：

- 协议长度 ProtocolLength，填写固定值 `0x13`
- 协议名 ProtocolName，填写固定值 `BitTorrent protocol`
- 8 个保留字节 Reserved，都填写为 0
- 从种子文件中计算得到的 InfoHash，20 个字节
- 我们自己生成的 PeerID，20 个字节

如果对方是一个正常的 BT Peer 的话，我们会收到同样结构的响应，从中提取出 InfoHash，如果和我们发送的 InfoHash 一样的话，那么就握手成功了🤝

握手成功以后，接下来便是互发消息。BT 是基于 TCP 的一个上层协议，和任何一个自定义协议一样，BT 定义了自己的消息格式 BTMessage，Peer 之间通过 BTMessage 来交换信息。

一个 BTMessage 由三部分构成：

- 4 字节的 Length，BigEndian
- 1 字节的 ID，表明消息的类型
- X 字节的消息体 Payload，含有具体的数据，X 为 Length - 1

重要的消息类型有如下几种：

- `Choke`: 告诉对方不能请求任何数据，先等待
- `Unchoke`: 告诉对方可以开始请求数据了
- `Have`: 告诉对方我有某个 Piece
- `Bitfield`: 将我有的所有 Piece 编码成 Bitfield 发送给对方
- `Request`: 向对方请求下载某个 Piece
- `Piece`: 发送 Piece 数据给到对方

当我们连接 Peer 时，默认处于 Choked 状态，也就是不允许向 Peer 请求任何数据，必须先等待 Peer 发送 `Unchoke` 消息。

这里还有一个细节，当我们使用 `Request` 下载时，并不是一次请求一个完整的 Piece，而是分为 Block 下载，Block 的大小可以在消息体中指定，一般为 16K。

所以，从 Peer 下载数据的流程是

- 握手
- 接收 Peer 发送的 Bitfield 信息，获知 Peer 有哪些 Piece
- 等待 Peer 发送的 Unchoke 信息
- 下载 Piece1
  - 发送 `Request` 消息给 Peer，请求 Piece1 的 Block1
  - 收到 `Piece` 消息，得到 Block1 数据
  - 请求 Piece1 的 Block2
  - 收到 Block2 数据
  - ...
  - Piece1 的所有 Block 下载完毕，校验 SHA1 哈希值
  - 开始下载 Piece2

每一个消息类型的具体消息体这样就不再展开了，这些细节对于理解 BT 不重要，在编码时对照 [Spec](https://wiki.theory.org/BitTorrentSpecification#Messages) 来做就好。

## Implementaion

根据上面的知识，我们可以来开发 BT 客户端了。

很显然，这是一个 IO Bound 的程序，核心是请求 Peer 获取数据，配合状态管理维护 Piece 和 Block 的状态。

这样一个问题给到我，我的第一想法自然是 Go，网络 + 并发这都是 Go 的强项，再加上强大的标准库和生态，写一个 CLI 的 BT 下载器自然是手到擒来。

但是，考虑到 Jesse 的程序就是用 Go 写的，不如换个语言来写，可以加深自己对 BT 的理解和认识。

### Why Deno?

我最熟悉的语言除了 Go 就是 JS，Deno 也是我关注很久的项目，一直没有去认真体验，不如借着这个机会去试试看 Deno+TypeScript 的感觉如何。

Deno 是 Node 的作者 Ryan Dahl 的最新作品，目标是提供一个安全、现代化的 JS+TS 运行时，修复 Node 的一些问题。

{{% tip %}}
Ryan Dahl 曾做过一次分享：[10 Things I Regret About Node.js](https://www.youtube.com/watch?v=M3BM9TB-8yA)，很有意思。
{{% /tip %}}

相比于 Node，我喜欢 Deno 的有如下几点：

- 基于 URL 的包管理，终于没有 `node_modules` 了，感谢上帝 🙏
- 原生支持 TypeScript
- 强大的标准库
- 沙箱和权限控制

{{% tip %}}
Deno 的名称实际上是把 `Node` 的 `no` 和 `de` 重新排列而得到的。
{{% /tip %}}

类型系统的重要性我想是不言而喻的，对于中小型项目来说，TypeScrit 的价值或许并不明显，但是对于大型项目来说，TypeScript 是必不可少的。

TypeScript 所代表的类型系统有很多好处：

- 更精确的表达：完备的类型系统可以更加精确的抽象我们要描述的问题
- 尽早地发现 bug：在编译时而不是在运行时
- 放心大胆地重构：我想前端人员对于重构 JS 代码应该都是很忐忑的，没有什么办法能保证所有涉及到的地方都已经被修改
- 更快的性能：编译器/虚拟机可以根据类型信息生成更高效的代码
- 最好的文档：注释总会过时，类型不会

这里我想引用 Rob Pike 的一句话：

> Data dominates. If you’ve chosen the right data structures and organized things well, the algorithms will almost always be self-evident. Data structures, not algorithms, are central to programming. - Rob Pike

对于日常的开发任务来说，数据结构是核心，一切都围绕着数据结构来进行。在 TypeScript 下，我们对每一个变量的数据结构都有清楚的了解，这一点至关重要。

### Test Torrent

确定了语言以后，在正式开发前，我们先来思考一下怎么测试我们的程序。

一开始我的想法是使用一些官方的种子，比如 Debian 的，但是它的问题是里面包含的文件很大，300+ MB，因为服务器在国外，下载速度也很慢，这用来测试显然是很不理想的。

所以，一个很自然的想法是，能不能找到小一点的官方的种子？

想来想去，除了 Linux 镜像以外，我实在想不到还有什么东西会提供官方种子。而 Linux 镜像中，体积比较小的比如 CoreOS 或者是 Alpine，都没有提供种子下载的选项，本来体积就小，也确实不需要提供种子😂。

既然找不到官方的，那试试在国外随便找一个？海盗湾上种子倒是一堆，但是我找了半天，都没有合适的，体积小的倒是有，但是速度都很不理想。

换个思路，找找看国内有没有什么比较权威的种子站？答案是没有😂 也有可能是我孤陋寡闻了，不过我在国内搜索“种子站”，出来的站点实在是...你懂的...

这个环节花了我很多时间，但是这个又是必须要做的事情。没有测试种子，我根本没办法验证最后的程序是正确的。

突然，我有了一个机智的想法！

我为什么不自己创建一个种子文件呢？自己给自己做种，一切可控，随时可以测试😉。

如果要让 BT 下载在自己的本机上玩起来，我们需要两个东西：

- 一个 Tracker 服务器
- 一个 BT 客户端

先来安装 Tracker 服务器，很容易就可以找到一个开源实现 [bittorrent-tracker](https://github.com/webtorrent/bittorrent-tracker)。

```bash
$ yarn add bittorrent-tracker
$ ./node_modules/.bin/bittorrent-tracker --http
```

现在我们拥有了一个运行在本机 8080 端口的 Tracker 服务器，Tracker URL 是 `http://localhost:8000/announce`。

接下来我们需要个 BT 客户端来给我们做种。

我第一个想法是 uTorrent，但是很可惜，它在 Mac 10.15 上运行不了。

接下来尝试 qBittorrent，可以在 Mac 10.15 上运行。打开以后，选择新建种子，随便选择一个文件，然后 Tracker 填写上面的地址。

用 Jesse 的客户端试着下载一下这个种子，我们会发现，失败了...

Jesse 的客户端是可以下载 Debian 的种子的，所以客户端实现没有问题，只能是 qBittorrent 出了问题。

再换个思路，考虑到我是高贵的 [Setapp](https://setapp.com/) 会员，那么试着找找有没有商业的 BT 客户端，付钱的多少要靠谱一点。

然后我就找到了 [Folx](https://mac.eltima.com/download-manager.html)，果然，收费的软件看起来都特别精致，UI 和体验都舒服极了，完全不是粗糙的 qBittorrent 能比。

{{% tip %}}
当然，开源也有很多很精致的软件，比如 uTorrent。
{{% /tip %}}

打开 Folx，选择 `File -> Create Torrent File`，随便选择一个文件，填入 Tracker 地址，我们就得到了一个种子。

![](http://asset.cjting.cn/Fj8tqLOSaNgHiLJ1neUm1m8yHfXv.png)

至此，我们终于解决了测试种子的问题🎉 可以开始着手编写代码了~

## Afterthought

[tinyTorrent](https://github.com/cj1128/tinyTorrent) 是我最后完成的 BT 下载器。

说它是下载器，因为它并不是一个完整的客户端，用 BT 的术语来说，这是一个 _Leech_。这个下载器只从 Peer 下载内容，但是从不上传内容给到 Peer。

理清 BT 协议以后，具体的开发其实很快，当然部分是因为很多细节并没有被很好处理，毕竟这个项目主要的作用还是用来学习和理解 BT 协议。

### The Good

先来谈谈开发过程中让人觉得愉快的地方。

- VSCode 确实很香，除了偶尔的卡顿，编写 TypeScript 体验非常好。

- Deno 的标准库对于熟悉 Go 的人来说很好用。

毕竟基本上是照着 Go 设计的，常见的功能标准库中都有，接口也很清晰。

像单元测试、日志、哈希函数这些事情，都不需要依赖三方了。

### The Bad

再来谈谈开发过程中一些槽点。

- 首先，Deno 的生态比之 Node 目前来说是天壤之别。

第一步解析种子需要用的 Bencode 编码，Node 自然是有库的 [node-bencode](https://github.com/themasch/node-bencode)，Deno 自然是没有的。

解析 Bencode 需要操作二进制数据，而相关接口 Deno 和 Node 中不一样，所以这个库也没办法直接拷贝过来用。

{{% tip %}}
Node 的库只要没有用到 Node 特有的 Module，都可以直接拷贝过来用。
{{% /tip %}}

所以，我首先需要花一点时间来迁移这个库到 Deno，说是迁移，其实是重写，理解代码以后，顺手就重写了😉。

[deno-bencode](https://deno.land/x/bencode) 是最后完成的 Deno 中的 Bencode 编解码库，功能不多，但是足够用了。

这里顺手提一下，Node 的生态确实很大，但是质量并不尽如人意。

解码 Bencode 的时候需要判断一下 ByteArray 是不是有效的 UTF8 字符串，搜索了一下 NPM，第一个结果就是 [is-utf8](https://www.npmjs.com/package/is-utf8) 这个包。

这是一个周下载量达到 800 多万次的包，按理来说应该不会有任何问题，可以放心使用。

但是当我简单看了一下代码之后就发现，这个包的实现根本就是错误的。

UTF8 是兼容 ASCII 的，但是在这个包的 [代码](https://github.com/wayfind/is-utf8/blob/master/is-utf8.js) 中却认为 ASCII 的控制字符不是 UTF8，也就是 `isUTF8("\x00") === false`。

下载量如此大的包，实现竟然根本不对，令人唏嘘。

- 其次，虽然 Deno/Node 拥有事件驱动的异步模型，但是要编写高并发的 IO 程序依旧很痛苦。

不是能力上达不到，而是写法上很别扭，或者说思维模型上很别扭。

思考这样一个问题：我们有 100 个 Piece 要下载，有 10 个 Peer 可以连接。那么怎样并发地去请求这 10 个 Peer？怎样分配这 100 个 Piece？当某个 Peer 无法连接时，怎样将 Piece 转交给别的 Peer？下载好的结果怎样汇总？出现了错误怎样上报？怎样等待下载全部完成？

如果是 Go，这个问题解决起来很简单，Goroutine 和 Channel 简直就是为这个问题而生。

但是在 Deno/Node 中，这就变得复杂了，不是一个 `Promise.all` 能搞定的问题。

- 最后，Deno 还有一些地方不太成熟。

感受最深的是，涉及到网络的接口比如 `Deno.conect` 居然没有超时选项，这是认真的吗？

当然，我们可以自己想办法包装，但是这些事情接口层应该要强调，超时在网络开发中是十分重要的，新手很容易忽略。

其次，文档还有欠缺。比如说当我用了 [ky](https://github.com/sindresorhus/ky) 这个库以后，Deno 会报一些类型冲突的错误，但是我找遍了文档，也不知道该怎么去限制 Deno 加载的类型库。

最后只能去问官方，[Issue](https://github.com/denoland/deno/issues/8070#issuecomment-717890204) 在这里。幸运的是，官方的响应速度非常快，点赞👍（Elixir 也是一样，José Valim 的响应速度简直让人感动）

### The Future

因为是一个学习项目，不严谨的地方太多了，未来有时间，我想可以在这些方面进行改进：

- 首先也是最重要的，支持上传，让它成为一个完整的 BT 客户端
- 支持多文件种子
- 支持磁力链接
- 支持代理😉
- 更加完善的错误处理和重试机制
- 更加完善的日志系统

BT 下载器在我看来是一个非常适合学习新语言以后的练手项目，涉及到的知识面比较广，需要解析文件、处理二进制数据、网络通信、并发控制等。同时，最终的作品也有实用价值，使用自己的下载器下载资源，想想都激动😉。

祝大家 Happy Coding~🎉


