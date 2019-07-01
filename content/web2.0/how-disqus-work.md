---
date: 2013-11-21T00:00:00+08:00
title: 关于 Disqus 的作用原理
tags: [disqus]
---
当初用 jekyll-bootstrap 做博客的时候，里面默认配置了 Disqus 的评论模块。当初懵懵懂懂，去 Disqus 官网按照提示填了字段以后，然后根据 Jekyll 配置文件 `_config.yml` 里面的字段 `short-name` 填了一下，然后评论模块就可以用了。我心里一直觉得不能理解，但是心里觉得可能很麻烦，就一直没有去钻研这个事情，今天有空，耐心看了官方文档，一切豁然开朗。

当初对 Disqus 的了解，就是一个 **云端评论中心**。可以将你对一篇文章的评论存储在 Disqus 中，然后通过 JS 脚本调用这些评论。但是，我困惑的问题就是：**Disqus 怎样将评论和相应的页面进行绑定?**

<!--more-->

当我在对一篇文章进行评论的时候,相应的评论会被传送到 Disqus 的云端进行存储，但是 Disqus 怎样识别出这个评论是属于这个页面的呢?可以看到，调用 Disqus 的源码很简单：

```javascript
(function() {
  var dsq = document.createElement('script')
  dsq.type = 'text/javascript'
  dsq.async = true
  dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js'
  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq)
})();
```

其中，`short_name` 这个属性是在 Disqus 配置中心进行配置的，一个 short-name 对应于一个网址。

![](http://ww2.sinaimg.cn/large/9b85365djw1f23b14utehj20nk055dgd.jpg)

很显然，short-name 这个属性不能用来标识页面，每个页面这个属性都是这样的。那到底是什么在唯一标识页面?

我在 Disqus 的 **Home > Developers > JavaScript configuration variables**这篇文章里面找到了如下的内容：

**disqus_shortname**:

> Tells the Disqus service your forum's shortname, which is the unique identifier for your website as registered on Disqus. If undefined, the Disqus embed will not load.

**disqus_identifier**:

> Tells the Disqus service how to identify the current page. When the Disqus embed is loaded, the identifier is used to look up the correct thread. If disqus_identifier is undefined, the page's URL will be used. The URL can be unreliable, such as when renaming an article slug or changing domains, so we recommend using your own unique way of identifying a thread.

然后我终于明白了，其实不是没有配置，只是 jekyll-bootstrap 的文件里面没有列出这几个变量。

上面说的很清楚：

- 首先，`disqus_shortname` 用来表示一个网站，如果没有这个属性，Disqus 是无法加载的。这个属性是所有 Disqus 用户都是唯一的。即你无法创建一个和他人相同的 disqus_shortname，因为他用来唯一标识你的网站。

- 其次，`disqus_identifier` 这个 JS 变量用来唯一表示当前页面，或者称为 `thread`。如果这个属性不进行设置的话，页面的 URL 将用来唯一标识这个页面，所有的评论将会与页面的 URL 进行绑定。

现在就很清楚了，当你在一个页面上写评论的时候，Disqus 会将评论存储在你加载 Disqus 所设置的仓库里面，也就是 `disqus_shortname` 里面，并且与当前页面的 URL 或者你设置的 `disqus_identifier` 进行绑定。当你下一次进入这个页面的时候，Disqus 首先进入仓库，然后根据你这个的 identifier 寻找所对应的评论。

那么，很明显，用 URL 是非常不稳定的。因为如果你一旦对页面改名字或者更改了路径等等等会修改 URL 的操作的话，那么所对应的评论就没有了。所以推荐每个页面都设置一下 `disqus_identifier` 进行唯一标识。
