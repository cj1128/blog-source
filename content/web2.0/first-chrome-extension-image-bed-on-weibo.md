---
cover: http://ww1.sinaimg.cn/large/9b85365djw1f7bm61rer2j21hc0u0q58.jpg
date: 2016-04-06T00:00:00+08:00
title: 编写第一个 Chrome 插件 —— 图床on微博
tags: [react, chrome, 微博, 图床]
---
之前写博客需要的图片全部都是本地存储，非常麻烦。流程如下：先用截图工具截图（QQ 截图就很好用），然后移动到目标文件夹，然后在 Markdown 中输入绝对路径（Jekyll 生成站点以后路径会变化，所以不能使用相对路径）。除了麻烦以外，在 Markdown 中编写时还是看不到图的，因为路径不对。

上次花点时间把所有的图片全部迁移到微博图床了。在 Chrome Web Store 中搜索了一下，选了[新浪微博图床](https://chrome.google.com/webstore/detail/%E6%96%B0%E6%B5%AA%E5%BE%AE%E5%8D%9A%E5%9B%BE%E5%BA%8A/fdfdnfpdplfbbnemmmoklbfjbhecpnhf?utm_source=chrome-ntp-icon)。功能是可以用的，不过有一些问题，最让我无法忍受的就是一点击按钮就会弹出一个 Chrome 的空白窗口，无法关闭，只有重启 Chrome 才行，这个实在是忍无可忍。

闲话不说了，总之我发现这是一次绝佳的自己造轮子的机会。自己造自己用多好玩，所以我准备自己写一个 Chrome 插件，来实现微博图床的功能。起什么名字好呢，恩，这真是一个世界难题。想了半天，决定叫做“图床on微博”吧，是的，我是 RoR 粉丝。

<!--more-->

## 项目分析

首先，实现微博图床最核心的便是图片的上传接口。通过阅读 `新浪微博图床` 的源码，可以发现接口是[这个](http://picupload.service.weibo.com/interface)，只要登陆了微博就可以使用，非常简单。知道了接口，剩下的事情就简单了。

第二，这个接口在 `picupload.service.weibo.com` 域下，我们本地开发测试的时候怎样跨域需要解决。打包成 Chrome 插件以后怎样跨域也需要解决。关于这个问题可以参考最终项目的 [README](https://github.com/fate-lovely/pic-on-weibo)。

## 功能设计

有了核心的文件上传接口，其他的功能就看我们自己发挥了。如果要成为一个好用的图床，我想到了以下几个基本功能：

- 拖拽上传：现在谁还通过 Dialog 来选择文件呀
- 复制上传：这个一定要有，这样用 QQ 截图好了直接粘贴就可以上传了
- 批量上传：偶尔还是很实用的
- 上传记录：之前上传过什么还是需要知道的

## 实现

### Chrome 插件

首先，我们要做的是 Chrome 插件，先去看看 [chrome extension get started](https://developer.chrome.com/extensions/getstarted)，可以发现，Chrome 插件其实很简单，提供一个 Manifest 指定一些元信息，其他就是用 Web 技术和 Chrome 提供的一些 api 来完成功能了。基本上都是我们熟悉并喜爱的东西。这里我们要用的就是最简单的 `Browser Actions`，提供一个按钮，然后点击以后跳转到我们的应用页面就行了，先来看看 `manifest.json`。


```json
{
  "manifest_version": 2,
  "name": "图床on微博",
  "description": "支持拖拽上传，复制上传，批量上传以及浏览上传历史记录",
  "version": "1.0",
  "icons": {
    "16": "icon16.png",
    "48": "icon128.png",
    "128": "icon128.png"
  },
  "browser_action": {
    "default_icon": {
      "19": "icon19.png",
      "38": "icon38.png"
    },
   "default_title": "图床on微博"
  },
  "background":{
    "scripts":["background.js"],
    "persistent": false
  },
  "permissions": [
    "http://*/"
   ]
}
```

`background` 指定插件的 background script，在这个 js 中，我们监听按钮的点击事件，当按钮点击的时候，打开我们的应用页面。

```javascript
chrome.browserAction.onClicked.addListener(function() {
  var url = chrome.extension.getURL("app.html")
  chrome.tabs.create({ url: url })
})
```

`permissions` 用于申请权限，我们设置为 `http://*/` 意味着我们可以请求任意的网址（HTTP 协议），解决了跨域问题。剩下来的就是开发 app.html 了，到这里，Chrome 插件的部分已经全部完成了。

### app

习惯了使用 React 开发的我，决定还是使用 React 来开发，虽然会引入 React 这个庞大的库（大约 140kb），但是 Chrome 插件是打包安装的，不会影响加载速度。

关于拖拽功能的实现，网上有很多插件，我粗略找了一下，都非常复杂，比如 [Dropzone.js](http://www.dropzonejs.com/)，不仅实现了拖拽，还帮你实现了文件上传、上传进度等一些列功能。并不需要，我们需要的是一个最简单的拖拽插件，当用户拖拽文件进入的时候，调用我们的回调函数并且传递 file 参数就行了。幸运的是，我找到了 [react-dropzone](https://github.com/okonet/react-dropzone)，好用到不行。

关于复制上传，我们直接监听浏览器的 `paste` 事件就行了。

关于存储上传记录，localStorege 可以轻松搞定。

剩下的便是编码了~大家有兴趣可以自己作为周末项目练练手~

最后，这是完整项目的 [Github Repo](https://github.com/fate-lovely/pic-on-weibo)，这是插件的[地址](https://chrome.google.com/webstore/detail/%E5%9B%BE%E5%BA%8Aon%E5%BE%AE%E5%8D%9A/opblldeehobgiedgjgamaklagilmkagc/related)。欢迎大家使用和评分，需要什么功能或者有什么不满，都可以去 GitHub 吐槽。

PS：如果翻墙不方便的话，可以 clone 仓库，`npm install && npm run build`，接着进入 `Chrome Extensions` 选项，打开开发者模式，然后把 `chrome` 目录拖进去就可以使用插件了（GIF 如下，有图床了就是任性~）。

![](http://ww4.sinaimg.cn/large/9b85365djw1f2twd1698tg21a90p51ky.gif)
