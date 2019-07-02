---
cover: http://ww3.sinaimg.cn/large/9b85365djw1f23bofx48nj20j1084a9z.jpg
date: 2013-06-23T00:00:00+08:00
lastmod: 2017-05-28T10:37:15+08:00
title: 使用 CSS 绘制 Ruby 可爱的红宝石标志
tags: [css, ruby]
aliases:
  - /web2.0/draw-ruby-logo-with-css/
---
有一次偶然逛 Dribbble，发现了这个可爱的红宝石标志。

![](http://ww3.sinaimg.cn/large/9b85365djw1f23bofx48nj20j1084a9z.jpg)

Ruby 的标志本来就很好看，加上这个配色，更加好看了。

<!--more-->

正好我一直想抽个时间做一个 Ruby 首页，自然是需要一个 Logo 的，于是就收藏了这张图片。本来想到时候简单的把图片贴上去就行了。没想到的是，我在逛 CodePen 的时候，竟然发现了一个用 CSS 写的一模一样的 Logo。有意思，当时一时没想明白是怎么实现的。正好那几天要考试，没时间研究源码，今天正好考完微积分，好好研究了一下。

看完了源码，其实用到的技术特别简单，就是利用 CSS 来产生三角形，然后定位组合。关于 CSS 怎么产生三角形，这个很早之前我就研究过了，主要是利用 border 的一些性质。仔细观看 Ruby 那个 Logo 可以发现，其实就是由好多三角形构成，上面有五个，下面有三个，然后一个 Shadow。利用很简单的技术，可以做出很 amazing 的效果，其实，很多时候，缺的不是技术，是想法。

今天下午我自己重新动手写了一个，本来觉得会很难，写完发现其实不难，但是首先要搞到一点数据。就是宝石中各个三角形的长宽高比例。这个难倒我了，我去 Google 变着关键词想把宝石的数学比例搜索出来，很遗憾，没找到，可能是太心急了，太过数学的文章都看不进去。只能投机取巧了，直接使用原作者的比例数据。因为如果比例弄错了，做出来的宝石会相当难看。

一会我会贴出我“参考”源作者代码的数据。

现在首先要知道 CSS 的 border 模型，就是如果一个元素的 width 和 height 都为 0 的时候，你设置了他的 border，会是一个什么情况。

![](http://ww4.sinaimg.cn/large/9b85365djw1f23book3izj20pb05qdfw.jpg)

```html
<div class="test_1"></div>
<div class="test_2"></div>
<div class="test_3"></div>
<div class="test">Love is everything</div>
```

```css
.test_1 {
  width: 0;
  height: 0;
  border: solid;
  border-width: 80px;
  border-color: #64b5c9  #89c7d7 #afd9e4 #d5ebf1;
}

.test_2 {
  width: 0;
  height: 0;
  border: solid;
  border-width: 0 80px 80px 80px;
  border-color: transparent #bc42a8 #d88ccc #f2d8ee;
}

.test_3 {
  width: 0;
  height: 0;
  border: solid;
  border-width: border-width:0 0 80px 80px;
  border-color: transparent transparent #5342bc #dbd8f2;
}

.test {
  width: 200px;
  border: solid 30px;
  border-color: #e9c2c6 #c6e9eb  #ede1ca #efefcf;
}
```

从上面示例可以看出，border 并不是大家可能想象以为的方形，其实上，border 的形状是一个梯形（如果元素有宽度和高度的话），当元素宽度和高度为零的时候，梯形变为三角形。上面展示的代码分别产生了四个，三个，两个三角形以及四个梯形。

当三角形形成后，你可能只想用一个，利用颜色为 transparent 便可以隐去其他三角形，是不是很简单？

当然，注意观察会发现，border 只能产生特定形状的三角形。而不是能产生任意形状。

现在来贴数据，从上到下，从左到右，给八个三角形分别命名为 1-8 号。我来分别列出各自的数据。数据以三角形顶点为中心，分别为顶点左边长度，顶点右边长度，以及顶点到对边的高。

| 序号 | 顶点左边长度 | 顶点右边长度 | 高 |
| :--: | :------: | :--------: | :-: |
| 1 | 63 | 26 | 60 |
| 2 | 26 | 62.5 | 60 |
| 3 | 62.5 | 62.5 | 60 |
| 4 | 62.5 | 26 | 60 |
| 5 | 26 | 62.5 | 60 |
| 6 | 0 | 151.5 | 150 |
| 7 | 62.5 | 62.5 | 150 |
| 8 | 0 | 151.5 | 150 |

现在我们来分析这个大大的红宝石。上面是五个三角形，我们可以设置两个 div，class 分别为 `top_1` 和 `top_2`。然后第一个 div 负责形成三个三角形，利用 `:before` 和 `:after` 伪元素便可以。第二个 div 负责形成两个三角形。只要一个 `:after` 就可以了。

下面是三个三角形，一个 div 搞定。class 是 `bottom`。当然，下面左右边的三角形都是 border 不能直接产生的，我们利用产生大的直角三角形。然后定位，利用 z-index 覆盖。如果看不懂，参考源码。先贴出超级简单的 HTML 代码。

```html
<div class="top_1">
<div class="top_2">
<div class="bottom">
```

然后便是对着上面表格中的数据写 CSS 了。

```css
.top_1 {
  width: 0;
  height: 0;
  border: solid;
  /* 
    最最核心的便是这个数据，一定要按照表格中的数字来
    如果这个比例不多，图形会丑到你不忍直视
    这个故事告诉我们，比例非常重要
  */
  border-width: 60px 62.5px 0 26px;   
  border-color: #d94e4e transparent transparent transparent;
  position: absolute;
  left: 100px;
}

.top_1:before {
  /* 不要忘记了这个，非常关键，忘记了就什么都看不见了 */
  content: "";  
  width: 0;
  height: 0;
  border: solid;
  border-width: 0 26px 60px 63px;
  border-color: transparent transparent #ffb9b9 transparent;
  position: absolute;
  /* 定位数据需要自行调试 */
  top: -60px;   
  left: -89px;  
}

.top_1:after {
  content: "";
  width: 0;
  height: 0;
  border: solid;
  border-width: 0 62.5px 60px 62.5px;
  border-color: transparent transparent #eb7474 transparent;
  position: absolute;
  top: -60px;
}

.bottom {
  width: 0;
  height: 0;
  border: solid;
  border-width: 150px 62.5px 0 62.5px;
  border-color: #c54040 transparent transparent transparent;
  position: absolute;
  left: 125px;
  top: 60px;
}

.bottom:before {
  content: "";
  width: 0;
  height: 0;
  border: solid;
  border-width: 150px 151.5px 0 0;
  border-color: #a02828 transparent transparent transparent;
  position: absolute;
  z-index: -2;
  top: -150px;
}
```

OK，一个大大的萌萌的 Ruby 标志就搞定了~
