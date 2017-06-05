---
date: 2017-06-04T15:46:33+08:00
draft: true
title: 从Jekyll迁移到Hugo，Hugo不完全指南
---
最近这段时间一直在忙着迁移博客，博文的写作都耽误了，还好很多有趣的话题我都记了下来，以后慢慢写。

之所以从Jekyll迁移的原因并不复杂，就是一个字：**慢**。Jekyll的速度实在是太慢了，我只有几十篇文章，在Watch模式下，每次改动，重新生成都要花费3秒钟。

这里要说一下，我的机器是i7的CPU，16G的内存外加256G的SSD。如此强的配置，如此简单的操作，竟然花费了3秒钟，实在是忍无可忍。

虽然我非常赞同Matz的观点，人的效率要比机器的效率更加重要，但这个大前提是机器的效率让人能够接受。同时，Jekyll作为一个静态站点生成器，并没有什么明显的优势，换掉它是势在必行了。

```bash
Regenerating: 1 file(s) changed at 2017-05-14 10:37:16 ...done in 3.085089 seconds.
Regenerating: 1 file(s) changed at 2017-05-14 10:37:20 ...done in 3.121783 seconds.
Regenerating: 1 file(s) changed at 2017-05-14 10:40:01 ...done in 2.899541 seconds.
Regenerating: 1 file(s) changed at 2017-05-14 10:40:45 ...done in 3.072933 seconds.
Regenerating: 1 file(s) changed at 2017-05-14 10:41:37 ...done in 3.108383 seconds.
```

<!--more-->

## SSG的基本素养

我一直认为静态站点生成器（Static Site Generator，后面简称为SSG）是一个非常重要的东西，对于内容导向的网站，使用SSG是最为简单高效的。比如说，博客系统，文档系统等等。花一点时间掌握好SSG，以后要构建这些系统便易如反掌。

SSG简单来说，就是根据你的配置和内容，生成静态网页。配置一般由全局配置，模板，以及每个源文件的FrontMatter构成，内容一般是Markdown的源文件。

在我看来，掌握SSG最为核心的就是搞清楚一个问题：**每一个源文件会被渲染成怎样的网页？**

弄清了这个问题，就弄清了SSG的渲染流程，也就把握了最为核心的脉络。至于模板，不管是什么模板语言，需要什么去查文档即可。

目前，最为流行的SSG是Jekyll，Hugo，Hexo这三个，不太流行的数不胜数，具体可以去看[Static Gen]网站。

Jekyll先排除，在Hugo和Hexo之中，鉴于我对Go的喜爱，当然是选择Hugo啦。并且，Hugo也是三个中速度最快的一个，Watch模式，每次改动，重新生成只要30ms，相比于Jekyll的3s，足足快了100倍。

## Hugo简介

Hugo因为是Go编写的，直接下载二进制程序即可，安装十分简单，这里不再赘述。

Hugo的官方文档很不错，建议大家先浏览一遍，需要的时候再去慢慢精读。我看的最多是[Hugo Template]，这个模块阐述了源文件是怎样根据模板被渲染成HTML的，也就是我认为想要掌握SSG最为关键的一个问题。

我们先来看看Hugo基本的文件结构。

```bash
hugo new site test-site
tree test-site
test-site
├── archetypes
├── config.toml
├── content
├── data
├── layouts
├── static
└── themes

6 directories, 1 file
```

一共六个文件夹。

- `archetypes`：给不同的类型定义默认FrontMatter，一般用不上
- `content`：存储内容
- `data`：存储数据文件，一般也用不上
- `layouts`：存储模板
- `static`：存储静态资源，也就是不需要Hugo处理的静态资源，比如图片等
- `themes`：存储第三方主题，将第三方主题拷贝到这个文件夹下即可使用

比较常用的就是content和layouts，一个存放内容，一个存放模板。Hugo使用的模板为Go标准库中的`text/template`，语法比较简单，即便不了解Go也可以很容易上手。

## Mi

下面以我的博客为例，介绍一下每个部分是怎么样实现的。

### 侧边栏

侧边有一个导航栏，是文章的顶级分类。

[Hugo Template]: https://gohugo.io/templates/overview/
[Static Gen]: https://www.staticgen.com/


