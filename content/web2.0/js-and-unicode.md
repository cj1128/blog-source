---
title: JavaScript 与 Unicode
date: 2018-07-22T09:45:12+08:00
tags: [js encoding]
cover: http://ww1.sinaimg.cn/large/9b85365dgy1ftpo2tnzjkj21kw11xe83
---
字符串是任何一个编程语言中的重要概念，同时也是一个非常复杂的问题。

日常编码中可能并不一定能见到它的复杂性，下面是几个字符串操作，使用你最熟悉的编程语言，看看结果如何。

- 逆转字符串 `"noël"`，正确结果应该是 `"lëon"`
- 获取字符串 `"noël"` 前三个字符，正确结果应该是 `"noë"`
- 获取字符串 `"😸😾"` 的长度，正确答案应该是 2
- 字符串 `"noël"` 和字符串 `"noël"` 规整化以后应该相等（他们看起来一样，但是内部表示不一样，一个 6 字节，一个 5 字节，这里涉及到 Unicode 的规整化）

对于大部分编程语言，包括 Ruby，Python，JS，C#，Java 等，上面的问题都无法全部返回正确结果（但是，拥有超强 Unicode 支持的 [Elixir] 可以）。

<!--more-->

## 基本概念

首先来看关于字符串的几个基本概念。

- `字符集（Character Set）`：定义了有哪些字符，任何一段字符串，里面的字符都属于某个字符集，比如经典的 ASCII 字符集以及目前最为常用的 Unicode 字符集。
- `码点（Code Point）`：字符集中的每个字符，都有一个唯一的编号，叫做码点，比如 `A` 在 ASCII 字符集中的码点是 65。
- `字符编码（Character Encoding）`：将字符转换为字节的方式。对于某些字符集，比如 ASCII，字符编码很简单，直接存储码点即可，比如 `A`，计算机中存储就是 65 的二进制补码，`0b01000001`。但是对于 Unicode，字符编码就有很多种，后文我们再详细介绍。
- `编码单元（Code Unit）`：UTF16 中的一个概念，每两个字节称为一个编码单元，一个字符可能使用一个或两个编码单元进行编码

## Unicode

Unicode 是一项了不起的发明，这个字符集诞生的初衷很简单，我们需要有一个大的字符集囊括地球上的所有语言中的所有文字。

在 Unicode 诞生之前，每个语言有自己的字符集，比如英语的 ASCII，繁体中文的 Big Five，简体中文的 GB2312 等等。这就使得计算机处理多语言的文档变得十分麻烦，同时，跨语言交流也非常不便，A 语言的文档发给 B 语言的计算机，B 不知道该如何解码，说不定都没有安装 A 语言对应的字符集。

Unicode 项目诞生于 1987 年，1.0 版本于 1991 年发布，目前最新版是 11.0。

Unicode 字符集目前一共分为 17 个平面（Plane），编号为 0 - 16，每个平面由 16 位构成，也就是每个平面可以编码 2^16 = 65536 个字符。

其中，第一个平面叫做基本平面，*BMP, Basic Multilingual Plane*，里面编码了最为常用的一些字符。

剩下 16 个平面都叫做补充平面，*Supplementary Plane*。

Unicode 的码点从 0 开始，也就是说，目前，Unicode 的字符码点范围为 0x0000 - 0x10FFFF。当然，这中间很多码点没有定义。

## Unicode Encoding

有了字符集，剩下的问题就是字符编码，即怎样将码点编码成字节。常见的方式有 UTF32，UTF16 以及 UTF8。我们来分别看看每个编码的方式和优缺点。

### UTF32

因为目前 Unicode 只用了三个字节就可以完全表示，最为简单的做法是：使用三个字节直接编码码点。

这种思路对应的编码方式是 *UTF32*，使用四个字节直接编码码点。这里可能有的同学会问，为什么不使用三个字节？有两个原因：

1. 为了以后扩充性考虑，虽然目前三个字节够用，但是以后可能不够用
2. 计算机处理四字节对齐数据会更快，使用三字节，虽然节省了内存，但是处理起来效率很低。这就和我们编程语言中一般有 `int8`，`int16`，`int32`，但是没有 `int24` 是一个道理。

UTF32 的优点是编码和解码都非常简单。缺点也非常明显：**对于英文文本（互联网上绝大部分信息是英文），体积要比 ASCII 大4倍**。这是一个无法接受的缺点，因此 UTF32 基本上是不使用的，HTML5 规范就明确规定网页不得使用 UTF32 进行编码。

### UTF16 && UCS-2

UCS-2 (2-byte Universal Character Set)是一个已经废弃的定长编码，始终使用两个字节编码 BMP中 的字符。对于非 BMP 中的字符，UCS-2 无法编码。

UTF16 是 UCS-2 的一个扩展，是一个变长编码，结果可能为两个字节，也可能为四个字节。其中每两个字节叫做 *Code Unit*，编码单元。对于 BMP 中的字符，UTF16 的编码和 UCS-2 一样，使用一个编码单元直接编码字符的码点，对于非 BMP 中的字符，UTF16 使用一个叫做 `Surrogate Pair` 的技术来进行编码。

在 BMP 中，并不是所有的码点都定义了字符，存在一个空白区，`0xD800 - 0xDFFF`这个范围内的码点不定义任何字符。

除了 BMP，剩下的码点一共是 `0x10FFFF - 0xFFFF = 1048576 = 2^20` 个，也就是需要 20 位进行编码。

Surrogate Pair 使用两个编码单元来编码一个非 BMP 字符。第一个编码单元的范围为 `0xD800 - 0xDBFF`，换成二进制为`0b1101_10xx_xxxx_xxxx`，叫做 `Lead Surrogate`，正好可以编码 10 位。

第二个编码单元的范围为 `0xDC00 - 0xDFFF`，换成二进制为 `0b1101_11xx_xxxx_xxxx`，叫做 `Tail Surrogate`，正好也可以用来编码 10 位。

这样，通过使用两个编码单元，UTF16 就可以将非 BMP 字符的偏移码点值（减去 0x10000 以后的码点值），使用 Surrogate Pair 进行存储，从而编码非 BMP 字符。同时，由于编码单元的范围都在 BMP 未定义字符的区间中，解码也不会产生任何歧义。

以 emoji `😜` 为例，码点为 `0x1F61C`，减去 0x10000，结果为 `0xF61C`，换成二进制，填充为 20 位，结果是 `0000_1111_0110_0001_1100`。将这 20 位填充到 Surrogate Pair 中，得到的结果是，Lead Surrogate：`1101_1000_0011_1101`，Tail Surrogate：`1101_1110_0001_1100`，换成 16 进制便是 `0xD83D 0xDE1C`，这就是 `😜` 的 UTF16 编码。

### UTF8

UTF8 是目前使用最多也是最为灵活的一种变长编码，同 UTF16 一样，UTF8 的编码结果是不定长的，在 1 到 4 个字节之间。

具体规则如下，左边为码点范围，右边为二进制编码形式。

- `0x0000 – 0x007F`: `0xxx_xxxx`，使用一个字节，编码 7 位。
- `0x0080 – 0x07FF`: `110x_xxxx`, `10xx_xxxx`，使用两个字节，编码 11 位。
- `0x0800 – 0xFFFF`: `1110_xxxx`, `10xx_xxxx`, `10xx_xxxx`，使用三个字节编码 16 位。
- `0x10000 – 0x1FFFFF`: `1111_0xxx`, `10xx_xxxx`, `10xx_xxxx`, `10xx_xxxx`，使用四个字节，编码 21 位

还是以 emoji `😜` 为例，码点为 `0x1F61C`，在区间 `0x10000 - 0x1FFFFF` 之中，需要使用四个字节进行编码。首先将其转换为二进制，填充为 21 位，结果是 `0_0001_1111_0110_0001_1100`，然后将这 21 位按照上述说明填入，结果是 `1111_0000`，`1001_1111`，`1001_1000`，`1001_1100`，换成 16 进制便是 `0xF0 0x9F 0x98 0x9C`，这就是 `😜` 的 UTF8 编码。

UTF8 因为它的灵活性，尤其是与 ASCII 的兼容性，目前已经成为事实上的标准。对于编码问题的处理很简单，**一律选择使用 UTF8 即可**。

## JS 中的字符串问题和解决方法

### JS 的字符串和字符

JS 中的字符串，我们可以认为是 **理解 Surrogate Pair 的 UCS-2**。

这是因为，JS 中的字符串，我们可以使用 Surrogate Pair 来编码非 BMP 字符，这是 UTF16 的特性，单纯的 UCS-2 是不能理解 Surrogate Pair 的。

但是 JS 中的字符允许无效的 Surrogate Pair，比如 `"\uDFFF\uD800"`，或者单个 Surrogate，比如 `"\uD800"` 。因此 JS 中的字符也不是 UTF16，单纯的 UTF16 是不允许上面的字符串的。

另一个问题是，在 JS 看来，什么样的东西是一个字符？因为 JS 是理解 Surrogate Pair 的 UCS-2，因此，**在 JS 眼中，一个编码单元是一个字符**。

这就给 JS 中的 Unicode 处理带来了很多问题，基本上所有的字符串操作函数在处理非 BMP 字符时都是错误的。

### length

最基本的问题就是，非 BMP 的字符，由于使用了 Surrogate Pair，含有两个编码单元，导致 JS 认为字符的长度为 2，这显然不是我们要的结果。

```js
"😜".length // 2
```

解决这个问题，可以自己编写一个 `strLength` 函数，特别处理码点范围在 `0xD800 - 0xDFFF` 中的字符，当然这比较麻烦，简单的方案是使用 [Punycode] 库。

```js
var puny = require("punycode")
puny.ucs2.decode("😜").length // 1
```

或者利用 ES6 的新特性：ES6 中的 `for of` 循环可以正确识别 Unicode，这也就使得和 for of 循环使用相同机制的 `...` 操作符可以正确识别 Unicode。

```js
// 这个做法很浪费内存
[..."😜"].length // 1
```

### charAt && charCodeAt

`charAt` 以及 `charCodeAt` 两个方法用于返回某个偏移量的字符和字符码点，对于非 BMP 字符，返回结果是错的，返回的是 Lead Surrogate 的字符和码点。

```js
"😜".charAt(0) // "�"
"😜".charCodeAt(0) // 55357
```

可以使用 ES6 的 `String.prototype.codePointAt` 和 `String.fromCodePoint` 两个方法来解决这个问题。

```js
"😜".codePointAt(0) // 128540
String.fromCodePoint("a😜b".codePointAt(1)) // "😜"
```

### Unicode Escape

JS 中允许使用 `\udddd` 以及 `\xdd` 的形式指定十六进制的数字插入字符。但是对于非 BMP 的字符，使用这个方式插入，需要首先得到 Surrogate Pair 才行，不能直接根据码点插入，比较麻烦。

```js
"\u1F61C" // "ὡC"
```

ES6新提供了 `\u{}` 方式，使得根据码点插入字符变得非常简单。注意 escape 中填写的都是码点的十六进制值。

```js
"\u{1F61C}" // "😜"
```

### Substring, Substr, Slice

这三个函数的行为很类似，参数的含义以及是否允许负数索引上有一些细微的不同。他们同样也都不能正确处理非 BMP 字符。

```js
"😜".substr(0, 1) // "�"
"😜".substring(0, 1) // "�"
"😜".slice(0, 1) // "�"
```

我们可以利用 ES6 的 `for of` 实现重新编写这三个函数，下面的实现只用来说明思路，并不完全。

```js
String.prototype.newSubstr = function(start, length) {
  return [...this].slice(start, start + length).join("")
}
String.prototype.newSubstring = function(start, end) {
  return [...this].slice(start, end).join("")
}
String.prototype.newSlice = function(start, end) {
  return [...this].slice(start, end).join("")
}
"😜".newSubstr(0, 1) // "😜"
"😜".newSubstring(0, 1) // "😜"
"😜".newSlice(0, 1) // "😜"
```

其他的一些函数都可以用类似的思路解决，不在赘述了。

### Regexp Dot

JS 中的正则，在处理非 BMP 字符时同样存在问题。

我们首先来看 `.` 字符。`.` 字符在正则中的含义是匹配非换行符以外的任意字符。但是在 JS 中，`.` 只能匹配一个编码单元，对于使用两个编码单元的非 BMP 字符，则无法匹配。

```js
/./.test("😜") // false
```

这个问题的解决方案有两个。第一，自己编写范围来匹配非 BMP 字符。

```js
/[\u0000-\uD7FF][\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/.test("😜") // true
```

第二，使用 ES6 引入的 `u` 标志。

```js
/./u.test("😜") // true
```

### Regexp Range

第二个问题是正则中的范围。范围中如果使用了非 BMP 字符，JS 会报错。

```js
/[😆-😜]/.test("😜")
Uncaught SyntaxError: Invalid regular expression: /[😆-😜]/: Range out of order in character class
    at <anonymous>:1:1
```

出错的原因在于 `/[😆-😜]/` 在 JS 中等价于 `/[\uD83D\uDE06-\uD83D\uDE1C]/`，而 `\uDE06-\uD83D` 会被解释为一个范围，而这个范围的起始值比结束值要大，因此错误。

解决方法同样有两个。第一，改写正则。

```js
/\uD83D[\uDE06-\uDE1C]/.test("😆") // true
```

第二，还是使用 ES6 引入的 `u` 标志。

```js
/[😆-😜]/u.test("😜") // true
/[\u{1F606}-\u{1F61C}]/u.test("😜") // true
```

## Unicode Normalization

最后，我们来谈谈 Unicode 的规整化。这个问题和 JS 没关系，是 Unicode 字符集本身的问题。

根据 Unicode 定义，有些字符属于 *修饰字符*，也就是和别的字符一起出现的时候会修饰别的字符，两个合在一起构成一个我们人眼中的字符。

比如，`ë` 这个字符，由两个 Unicode 码点构成，分别是 `U+0065` 和 `U+0308`。这两个都是 Unicode 中的合法字符，拥有自己的码点，但他们合在一起的时候，构成一个我们人类眼中的字符。

同时，在 Unicode 中，还有一个单独的字符 `ë`，码点为 `U+00EB`。

`ë` 和 `ë` 在我们眼中是一样的字符，但在 Unicode 中却是不同的表现，一个是由两个字符拼接而成，另一个是独立的字符，因此，如果直接比较的话，肯定是不相等的。

```js
"ë" === "ë" // false
```

这时候就需要引入规整化，将字符转变为某种特定的形式。Unicode 中定义了四种形式，常用的两种是：

1. `NFD`: Normalization Form Canonical Decomposition，将所有的单个的复合字符转换为多个字符拼接而成的形式
2. `NFC`: Normalization Form Canonical Composition，将所有的拼接而成的符合字符转换为单个字符的形式

因此，在比较 Unicode 字符串之前，我们需要对两边的字符串规整化到相同的形式，这样结果才是准确的。ES6 中引入的 `String.prototype.normalize` 方法可以用于字符串的规整化。

```js
"ë".normalize("NFC") === "ë".normalize("NFC") // true
```

## Reverse the String

由于存在修饰字符，使得字符串取反变成了一个复杂的操作。

如果不考虑非 BMP 字符，在 JS 中，对字符串取反的一般方式为 `str.split("").reverse().join("")`。

考虑到非 BM 字符，我们可以使用 `[...str].reverse().join("")`。

但是，如果含有修饰字符的话，使用 `...` 一样无法返回正确的结果。

```js
[..."mañana"].reverse().join("") // "anãnam"
```

这里的问题在于对于 `"mañana"` 使用 `...` 产生的字符数组为 `["m", "a", "n", "̃", "a", "n", "a"]`，取反以后，修饰字符会跟在 `a` 的后面，从而产生 `ã`。

这个问题需要做手动做一些的处理，在取反之前，将修饰字符和被修饰的字符颠倒一下顺序，然后再取反就行了。我们可以直接使用 [esrever] 库来处理。

esrever 的 `reverse` 函数具体实现可以看[这里](https://github.com/mathiasbynens/esrever/blob/14b34013dad49106ca08c0e65919f1fc8fea5331/src/esrever.js#L23)。

```js
esrever.reverse("mañana") // "anañam"
```

[Elixir]: https://elixir-lang.org/
[Punycode]: https://github.com/bestiejs/punycode.js/
[esrever]: https://github.com/mathiasbynens/esrever
