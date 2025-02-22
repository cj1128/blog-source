---
title: 使用 Go 编写代码明信片生成器
cover: /image/FpensV5yWTWbHKwENPRdEvUtEsYW.jpeg
date: 2017-02-18T00:00:00+08:00
tags: [codeposter, go]
---

很早之前就看过到关于 [commits.io](http://commits.io) 的一个帖子，这个站点专门制作代码明信片。什么是代码明信片呢？如下图。

![](/image/007FEWc7ly1g1f3o6zdtwj30sj0ee45m.jpg)

<!--more-->

背景是代码，然后中间印上指定的图案，就是一幅代码明信片了。看起来有点意思，将自己的得意作品做成一个代码明信片打印出来挂在办公室将是一个非常不错的装饰选择 😉。

当时我就在想，这东西挺有意思，有空自己做一个，当然，事情一多也就忘记了。最近，我又看到了一个帖子，[Build your own code poster with elixir](http://www.east5th.co/blog/2017/02/13/build-your-own-code-poster-with-elixir/)，是说怎样用 Elixir 来制作代码明信片的。Elixir 是我最近正在研究的语言，不过我觉得它不适合拿来干这个，这种程序，拿 Go 做一个 CLI 最合适，编译好了就可以发放给亲朋好友体验了。说干就干，再不能拖延了。

一个程序，无非是：输入、处理、输出。老话说的好，**程序就是数据结构 + 算法**。数据结构用来表示数据，算法用来处理数据。我们先来看看我们要开发的代码明信片程序的这三个方面分别是什么。

## 输入

- 首先我们需要代码，传递代码文件的路径是最为方便的，第一个确定，codePath，代码文件路径。
- 然后，我们需要图片，同样的道理，给一个图片路径是最为方便的，所以，第二个参数，imgPath，图片路径。

光这两个参数行吗？当然不行。最终生成的代码明信片是多大？所以，又要加两个参数。width 表示代码明信片的宽度，height 表示代码明信片的高度。

这样就够了吗？看起来好像是够了。在程序开发过程中，一开始就将程序所需要的所有参数都定义完全的情况很少，一般在实现过程中发现不够了再补充。这里我们不妨先将思维转换到程序实现上。

程序的主要逻辑是遍历每个字符，计算字符的位置，然后得出这个位置在图片中的颜色即可，最终输出一个 HTML 文件由浏览器进行渲染。所以，问题来了，首先，每行有多少个字符？如果不知道这个，我们根本没法计算字符的坐标。所以，我们需要清楚的知道单个字符的宽度和高度，这就额外引出了四个参数：

- 字符的字体（font），首先字体当然是要明确定义的，不同的字体下字符的宽度高度都不一样，而且代码明信片必须要等宽字体。
- 字符的字体大小（fontSize）。
- 单个字符的宽度（charWidth），这个只能手动去浏览器里测量，将字符放在 `span` 中，指定好字体和字体大小，用检查器就可以看到单个字符的宽度和高度。
- 单个字符的高度（charHeight），得出方法同字符宽度。

这里，我使用 `Hack` 字体为例，可以看出，当字体选择 Hack，字体大小为 16.63px 像素时，单个字符的宽度是 10，高度是 19。

![](/image/007FEWc7ly1g1f3oef7bsj30mn0fgab6.jpg)

最后，图片尺寸一般比代码明信片的尺寸要小，放在中央位置。所以，我们还需要一个背景颜色（bgColor），对于位置不在图片中的字符，应该填充背景色。

## 输出

最终处理完毕后，以什么样的格式输出呢？作为一个整天和浏览器打交道的人，我觉得输出为一个 HTML 文件是最为方便的，直接交给浏览器去渲染。

输出为 HTML 也有多种选择。

- 每一个字符放在一个元素中，然后给这个元素添加样式，也就是基于 DOM。
- 使用 Canvas 进行 2D 绘图。
- 使用 SVG。

为什么要要先考虑输出呢？因为输出会影响程序的结构。在输入输出定义好的情况下，在去想程序实现是比较合理的，无论你怎么实现，只要输入输出不变，都不会影响用户的使用。

因为我们要支持输出多种格式，所以我们的核心程序一定是产生一个中间结果，然后再由不同的模块根据中间结果产生不同的输出。这就是输出对程序结构的影响。

## 处理

最后，我们根据确定好的输入输出，来讨论程序具体的处理逻辑。

1. 根据代码路径（codePath），读取代码文件，压缩，去除掉所有的空白字符。
2. 根据图片路径（imgPath），解析图片。
3. 因为我们知道最终明信片的宽度（width）和高度（height），以及单个字符的宽度（charWidth）和高度（charHeight），我们可以得出一共有多少行字符以及每行多少列。
4. 对于比明信片大的图片，需要对图片进行缩放。
5. 从第一行开始遍历，根据字符的位置，得到字符的坐标，取出对应图片的颜色，如果字符不在图片范围内，则使用背景色（bgColor）。
6. 将结果存入数组中保存，每一项的内容为：字符，颜色。
7. 根据上面生成的数组，产生输出。

到这里，程序的实现就很清楚了，借助于 Go 强大的标准库，需要我们编写的代码其实很少，作为一个周末项目练练手是非常不错的选择。

## 结果

最终，程序在仓库在 Github 上，[codeposter](http://github.com/cj1128/codeposter)。测试了几幅图片，效果还不错。默认使用的字体是 `Hack`，字体大小为 7 x 14，明信片宽度是 114 x 54。如果想提高字符的密度，也就是 **分辨率**，减少字体大小即可😜。

![](/image/007FEWc7ly1g1f3oqy7ldj30m80l4n55.jpg)

![](/image/007FEWc7ly1g1f3ox5d2gj30m70l37ce.jpg)

![](/image/007FEWc7ly1g1f3p3nf61j30m70l3wmc.jpg)
