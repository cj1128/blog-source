---
title: Functional Reactive Programming 简介
cover: /image/9b85365dgw1f7bmcscnvij21jk112496.jpg
date: 2016-03-20T00:00:00+08:00
tags: [rxjs, javascript, functional-programming]
---

推荐阅读：

- [Netflix JavaScript Talks - Async JavaScript with Reactive Extensions]
- [The introduction to Reactive Programming you've been missing]

HTML5Rocks 有一篇关于 [Promise](http://www.html5rocks.com/en/tutorials/es6/promises/) 的经典文章，通过引入这样一个问题来说明 Promise 的优越性，问题如下：

> 我们需要渲染一个故事，首先我们获取故事的 json，渲染标题 (story.heading)，然后再根据其中的 charpter url，获取每一章的内容，并显示。中间出了任何问题，显示错误信息。

<!--more-->

这个问题乍一看好像很容易，不就是 ajax 拿几个数据嘛。但是我们可以想想怎么做才是最高效的方式，程序优化的点有时候很难想到，有时候却是显而易见的。这个问题要高效解决我们至少需要做以下两点：

- 故事的每一章内容我们应该并行获取
- 显示的时候，不能等到所有章节内容都获取到再显示，而应该在保持顺序的情况下尽快显示。比如第一章内容来了，我们立刻显示第一章，但是我们要等第二章内容，即便第三章先来，我们也不能显示。

再考虑到我们需要追踪每个 ajax 的错误信息，一旦有错误立刻显示错误页面，这个问题似乎没有那么好解决。传统的解决方法我们不可避免的要跟踪状态，比如当前有没有错误？内容已经到第几章了？这种代码写出来很容易出错而且很难看。

作者在这个 [gist](https://gist.github.com/jakearchibald/0e652d95c07442f205ce) 上面贴出了文中问题的一些解法对比，包括使用 Promise，使用传统的状态追踪等。这个 gist 下面有个评论中使用了 RxJS，代码十分简洁优美，很是引人注目。

[RxJS] 指的是 **Functional Reactive Programming extensions for JavsScript**，Functional Reactive Programming 是一种编程思想，并不局限于某一个语言。这种思想的核心就是流，RxJS 中的使用的术语是 `Observable`，但是我觉得这个词不好理解，用流也就是 `Stream` 更好理解。流代表的是一个随着时间而变化的序列，在这过程中，它可以产生值，或者错误，或者终止信号，只有这三种情况。

![](/image/9b85365djw1f238lhm2c4j20e807974m.jpg)

流的引入最大的优点是我们有了一个手段来表示“无尽”的东西，并且可以对它们进行各种变换，就像我们处理数组那样。处理数组我们有 `map`, `filter`，`reduce` 这几个核心方法。对于流我们也有类似这些的基本方法，这里推荐一个好用的网站 [RxMarbles](http://rxmarbles.com/)，非常直观的显示一些方法是怎样操作流的。

面向流的编程基本过程就是，创建代表原始输入的流，对它们进行组合、过滤等各种操作，最后生成我们感兴趣的结果流，监听结果流（subscribe）并进行相应操作即可，监听的时候提供三个函数，分别用于处理流产生了值，流产生了错误以及流结束这三种情况。

这里用 RxJS 首页的自动补全（auto completion）例子来看一看怎么使用 RxJS。自动补全是搜索框中很常见的一个功能，随着用户的输入，系统会自动在下拉框中显示相关的词汇供用户选择，也可以起到给用户一些提示的作用，这是一个很方便的功能。实现思路也比较简单，根据用户目前输入的词汇去获取词汇列表，然后显示。但是这里面有几个细节：

- 用户的输入需要 debounce，否则会发送太多无意义的请求。
- 只有用户输入的字符串大于一个长度我们才请求。否则返回的结果太模糊并且数量也大。
- 考虑到网络延迟，需要追踪后台返回的数据是否匹配用户当前的输入。比如用户输入 "ABC"，系统发了一次请求，用户又改输入为 "DEF"，此时 ABC 的结果返回，我们就不能显示了，因为这个结果已经过时了。

首先，我们来构建原始流：

```javascript
var $input = $('#input') //输入框
var originInputStream = Rx.Observable.fromEvent($input, 'keyup')
```

这里，我们使用 RxJS 提供的 `fromEvent` 方法来构建原始事件流，`originInputStream` 代表的是每一个 `keyup` 事件，用户每输入一个字符，`originInputStream` 便会产生一个值，值的内容为对应的事件对象。现在来想想怎么变换这个原始流，首先，我们需要 debounce，然后我们 map 拿到用户输入的字符串，接下来需要过滤长度比较小的字符串，最后，如果后面的值和前面的值一样，我们就丢弃它。

```javascript
var resultInputStream = originInputStream
  .debounce(500 /* ms */)
  .map((evt) => evt.target.value)
  .filter((text) => text.length > 2)
  .distinctUntilChanged()
```

`resultInputStream` 代表的便是每一个需要请求后台的用户输入值，这个还不是最终的 Stream。最终的 `suggestionStream` 应该代表的是后台返回的结果，我们监听然后显示 suggestions，就大功告成了。现在剩下的任务便是怎么由 `resultInputStream` 得到 `suggestionStream`。

这里我们要介绍两个重要的方法，分别是 `flatMap` 以及 `flatMapLatest`。`map` 方法是根据流（mainStream）里面的值，产生一个新的值，如果这个新的值是一个流（subStream）怎么办呢？大部分情况下，我们会希望这个新的流（subStream）它的值出现在 mainStream 中，这样我们可以直接监听 mainStream 而不用去监听每一个 subStream，如图所示：

![](/image/9b85365djw1f23ftn0686j208z04cdg4.jpg)

`flatMap` 就是这样一个方法，`flatMapLatest` 顾名思义，他只会处理最新的 subStream，之前的 subStream 的值全部丢掉。这非常吻合我们的需求，因为当用户输入新的字符串时，之前的字符串的返回结果我们不再需要了。

有了 `flatMapLatest` 这个方法，我们接下来需要做的便是写一个方法，根据 `resultInputStream` 的每个值，请求后台，返回一个 subStream（返回 Promise 便可，RxJS 会自动帮我们转换为 Stream）。

```javascript
function searchWikipedia(term) {
  return $.ajax({
    url: 'https://en.wikipedia.org/w/api.php',
    dataType: 'jsonp',
    data: {
      action: 'opensearch',
      format: 'json',
      search: term,
    },
  })
}

var suggestionStream = resultInputStream.flatMapLatest(searchWikipedia)
```

得到 `suggestionStream` 以后，我们监听并显示结果就行了。至此，任务大功告成。

```javascript
var $results = $('#results') // ul to hold the results
suggestionStream.subscribe(
  (data) => {
    $results.empty().append($.map(data[1], (value) => $('<li>').text(value)))
  },
  (error) => {
    $results
      .empty()
      .append($('<li>'))
      .text('Error:' + error)
  }
)
```

最终的代码可以看[这里](https://jsbin.com/luvamizavo/1/edit?html,js,output)。

上面是一个使用 RxJS 的经典例子，下面我们再来看一个例子。

![](/image/9b85365djw1f23koqhfbmj20n10603yk.jpg)

这是一个十分常见的用户注册表单，几乎每一个网站都要实现的功能。实现起来也比较简单，用户点击 Submit 的时候提交内容到后台就行了，根据后台的结果再进行反馈，比如后台返回成功，则告诉用户注册成功，跳转到个人中心，后台返回“用户名已存在”，则告诉用户注册失败，重新输入。

但是，我们也可以做一些事情来提高这个简单表单的用户体验，包括但不限于：

- 用户输入用户名的时候，就进行用户名可用性检测，当然，我们需要 debounce
- 进行用户名可用性检测的时候，显示相应的信息告知用户我们正在检测用户名可用性
- 告知用户用户名可用性检测的结果
- 如果用户名或者密码为空，禁用提交按钮
- 如果用户名不可用，禁用提交按钮
- 当用户点击提交按钮以后，立刻禁用提交按钮，防止二次提交

我们先来看看使用 jQuery 怎么解决。

```javascript
var $username = $('[name=username]')
var $password = $('[name=password]')
var $btn = $('button')

$btn.click(function (evt) {
  evt.preventDefault()
  btnClicked = true
  setButtonState()

  $.ajax({
    type: 'POST',
    url: '/register',
    data: {
      username: $username.val(),
      password: $password.val(),
    },
    success: function () {
      alert('Success!')
    },
  })
})

// Status variables
var usernameAvailable,
  checkingUsername,
  prevUsername,
  timeout,
  btnClicked,
  counter = 0

$username.keyup(function (evt) {
  var username = $username.val()
  if (username === prevUsername) return
  usernameAvailable = false
  setButtonState()
  clearAllInfo()

  if (username.length === 0) return

  if (timeout) clearTimeout(timeout)
  prevUsername = username
  timeout = setTimeout(function () {
    checkingUsername = true
    toggleCheckingIndicator()
    var id = ++counter
    $.ajax({
      url: '/check',
      data: {
        username: $username.val(),
      },
      success: function (res) {
        if (id !== counter) return
        checkingUsername = false
        usernameAvailable = res.available
        setButtonState()
        toggleCheckingIndicator()
        showResult()
      },
    })
  }, 500)
})

$password.keyup(function (evt) {
  setButtonState()
})

function setButtonState() {
  var enabled = $username.val().length > 0 && $password.val().length > 0 && usernameAvailable && !btnClicked
  $btn.prop('disabled', !enabled)
}

function toggleCheckingIndicator() {
  $('#result-ok').hide()
  $('#result-bad').hide()
  if (checkingUsername) {
    $('#indicator').show()
  } else {
    $('#indicator').hide()
  }
}

function showResult(available) {
  usernameAvailable ? $('#result-ok').show() : $('#result-bad').show()
}

function clearAllInfo() {
  $('#result-ok').hide()
  $('#result-bad').hide()
  $('#indicator').hide()
}

setButtonState()
```

代码不需要太多解释，逻辑很直接，使用几个变量来追踪我们想要追踪的状态来实现上述的几个功能。这样的代码有一个问题，那就是随着需求的增加，会变来越来越复杂，引入越来越多的状态，直到最后无法控制。

我们再来看看 RxJS 怎么解决这个问题。

```javascript
var $username = $('[name=username]')
var $password = $('[name=password]')
var $btn = $('button')

function getStream($ele) {
  return Rx.Observable.fromEvent($ele, 'keyup').pluck('target', 'value').distinctUntilChanged().startWith('')
}

var usernameStream = getStream($username)
var passwordStream = getStream($password)
var btnClickedStream = Rx.Observable.fromEvent($btn, 'click')

var enteredStream = usernameStream.combineLatest(passwordStream, (username, password) => {
  return username.length > 0 && password.length > 0
})

var ajaxStream = usernameStream
  .debounce(500)
  .filter((s) => s.length > 0)
  .flatMapLatest((s) => {
    setIndicator(true)
    return $.getJSON('/check', { username: s })
  })
  .map((res) => {
    setIndicator(false)
    setResult(res.available)
    return res.available
  })

var availabilityStream = ajaxStream.merge(usernameStream.map((s) => false))
availabilityStream.subscribe(clearResult)

var buttonStateStream = enteredStream.combineLatest(availabilityStream, (a, b) => a && b).merge(btnClickedStream.map((s) => false))

btnClickedStream.flatMap(register).subscribe(
  (d) => {
    if (d.success) {
      alert('Success!')
    }
  },
  (jqXHR) => {
    console.error(jqXHR.statusText)
  }
)

buttonStateStream.subscribe(function (enabled) {
  $btn.prop('disabled', !enabled)
})

function register(evt) {
  evt.preventDefault()
  return $.ajax({
    url: '/register',
    method: 'POST',
    data: {
      username: $username.val(),
      password: $password.val(),
    },
  })
}

function setIndicator(enabled) {
  clearResult()
  enabled ? $('#indicator').show() : $('#indicator').hide()
}

function clearResult() {
  $('#result-ok,#result-bad').hide()
}

function setResult(ok) {
  ok ? $('#result-ok').show() : $('#result-bad').show()
}
```

还是一样的思路，首先构建原始的 Stream，变换得到我们想要监听的 Stream，除了辅助的 UI 函数以外，剩下的代码都在操作 Stream，没有任何状态的跟踪，代码变得简洁清楚明了。

最后，用户注册的完整代码包括 UI 和一个 Express 的服务器可以在 [frp-demo] 下载。

[Netflix JavaScript Talks - Async JavaScript with Reactive Extensions]: https://www.youtube.com/watch?v=XRYN2xt11Ek
[The introduction to Reactive Programming you've been missing]: https://gist.github.com/staltz/868e7e9bc2a7b8c1f754
[Promise]: http://www.html5rocks.com/en/tutorials/es6/promises/
[RxJS]: https://github.com/Reactive-Extensions/RxJS
[frp-demo]: https://github.com/cj1128/frp-demo
