---
title: 编写第一个 Sublime 插件 —— BuildX
date: 2020-05-10T10:04:40+08:00
cover: /image/FvnQbq-MpgcAKuLDYeuhUuern_Yr.jpg
tags: [sublime, texteditor]
---

从我接触计算机开始到现在 Sublime 一直是我的主力编辑器，现代化的 UI、流畅的速度以及众多的插件，特别是各种开箱即用的特性，让他一直默默成为我的生产力助手。

我尽量避免使用各种 IDE，除非万不得以，有些工作不使用配套的工具十分麻烦，比如苹果的 XCode 和谷歌的 Android Studio。如果做 Android/iOS 开发，不用这些工具当然可以，但是绝对是不推荐的方案。第三方工具永远不会有官方的工具更新的快，同时，各种教程资料也不会针对第三方工具，一旦遇到问题只能靠自己解决，这个时间投入，是非常不值得的。

幸好我的主要技术栈都不需要 IDE，JS/HTML/CSS, C, Go 这些语言 IDE 当然可以有些帮助，但是和 IDE 的臃肿卡顿比起来，这些帮助就显得不重要了。

<!--more-->

## Sublime/Vim

虽然 Sublime 满足了我的各种需要，但是我心里其实一直在积累换掉他的想法，原因是我觉得 Sublime 的定制性不够。当然，现在回过头看，这是一个偏见，或者说这个论点不够站得住脚。

因为 Sublime 是闭源的关系，再加上各种讨论也不多，不像 Vim/Emacs 我时常能在各种论坛上看到帖子讨论他们，给人的感觉是社区很不活跃。所以我也一直没有花时间去了解 Sublime 的插件系统和 API。一般都是遇到问题的时候才去 Package Control 上找一找有没有现成的插件。

顺手提一下，Package Control 在国内被墙了，需要在配置里面开启一下 `http_proxy` 和 `https_proxy`。

上一次安装 Sublime Go 的时候花了一些时间，我对 Go 的要求很简单，保存时自动运行一下 `goimports` 对我来说就够了。但是 Sublime Go 这个插件要做到这个都非常麻烦，首先安装就很麻烦，无法使用 Package Control 只能手动安装。配置也十分不便，因为 Go 的插件其实都依赖于 Go 的一些 utility 工具，比如 `goimports`，`gopls` 等等。

相比之下 Vim 的 [vim-go](https://github.com/fatih/vim-go) 以及 VS Code 的 Go 插件使用体验都要好得多，而且安装也方便地多。尤其是 VS Code，对各种语言的支持真的非常好。

当时我就觉得，对于 Go 这样一个热门的语言，Sublime 的支持都是如此的差，只能说明 Sublime 的生态实在是江河日下。

这些年也能明显感觉到 Sublime 的圈子在缩小，参与的人变得越来越少，很多插件的最后更新时间都停留在很久之前。不难猜测，大部分开发者应该是转到 VS Code 上去了。

我对各种基于 Web 的桌面应用程序态度是能不用就不用，我始终无法忍受那种时不时的卡顿感。VS Code 确实很不错，功能，界面，易用性都很棒，但不是我的类型。

因为偶尔的这些不愉快体验，Sublime 虽然在大部分中时间完美契合了我的需要，但是在我眼中他是一个定制性不够高，社区不够活跃，未来也不够光明（不开源由私人公司控制）的编辑器。

选择技术学习时我的看法一向是学习那些 **能够持久的技术**，这样知识的积累才会带来价值。所以很自然地，我一直有一个计划要把我的整个工作流迁移到 Vim 上，Vim 毫无疑问满足我的各项要求：

- 足够高的定制性
- 足够大的社区
- 对 Vim 的知识积累会带来价值，越使用，越了解，越熟练。

有一次在看 [Handmade Hero](https://handmadehero.org/) 时，我实在太想要 Emacs 中那个 **构建、显示错误信息、跳转到错误行** 这个功能了，大大解放了生产力。

![](/image/lq6s1RwXWtdSZunK3V4AFhpO5kEL.gif)

Sublime 自带的构建系统可以构建也可以跳转到错误行，但是，构建信息是显示在底部的而不是侧边，看起来非常不方便。我使用了 [sublime text 2 buildview](https://packagecontrol.io/packages/sublime-text-2-buildview) 这个插件将构建信息显示到侧边，但是这个插件又不能跳转到错误行，以至于每次我都要自己看错误信息，然后手动跳转，别提多烦了。

Sublime 默认的构建是输出在底部，位置无法调整：

![](/image/FgoHDJ0reZJl2bl9ZD3OOZsMZBek.png)

为了这个功能，也为了以后 N 个想要的功能，我下定决心迁移到 Vim。前后花了大概一个月的时间才把我想要的各项功能都在 Vim 中实现了。

我先是通过 [Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/) 系统地学习了 Vimscript。

然后花了大量的时间阅读 Vim 的手册，从 `:help usr_01.txt` 开始，理解 Vim 中的各个概念，Buffer, Window, Tab, Session, Mode, Syntax, Map, Text Object 等等等等。

最后通读了 [Practical Vim](https://pragprog.com/book/dnvim2/practical-vim-second-edition) 这本书。

接下来就是安装配置各种插件，阅读插件的文档以及根据各种网络上的 `.vimrc` 来配置自己的 `.vimrc`，时不时再读一下各种 setting 的文档，比如 `:help shiftround` 理解一下配置项到底在干什么。

比如下面这是一个很常见的 Vim 配置，但是 `shiftwidth` 和 `softtabstop` 以及 `tabstop` 有什么区别？设置成不一样会怎么样？

```text
set expandtab " tabs are spaces
set shiftwidth=2
set softtabstop=2
set tabstop=2
```

要真的理解 Vim 掌握 Vim 毫无疑问是要花费大量时间的。

粗略列一下我在 Vim 中配置的一些功能：

- Buffer 管理（删除，重命名，快速切换）
- 文件快速切换 (fzf)
- 项目快速切换 (fzf)
- 构建系统 (Make, AsyncBuild, QuickFix)
- 搜索替换 (Ripgrep)
- 侧边栏 (NERDTree)
- Tag 管理，符号跳转
- Statusline/Tabline 配置 (Lightline)

Vim 的特点是，功能都可以实现，但是需要你自己配置，而且往往会有一些小的瑕疵，让你非常难受。比如，NERDTree 这个大名鼎鼎的 Vim 插件，我用下来真是感觉太一般了。外部新建的文件需要手动刷新才能看到，当然，你可以用一些技术来实现“自动刷新”，比如监听 Cursor 事件，但是这样对新手来说是很不友好的。再比如说每次搜索以后，搜索的高亮不会消失，需要手动让它消失，这实在是非常烦人，当然，如果你花了很多时间，你就会知道 [vim-cool](https://github.com/romainl/vim-cool) 这个插件能帮你解决问题。

总体来说，迁移是成功的，但是在某个阳光明媚的清晨，我决定还是换回 Sublime。

Vim 的定制性是很强，这没问题，问题是这个定制性带给我的价值不多却大大浪费了我的时间。我犯了一个严重的错误：**针对少数情况优化**。

Sublime 让我不满意的时候非常少，可以说占比 5%，在 95% 的时间里，他完美解决了我的各种需要。但是为了解决那 5% 的不满，我推翻了整个系统，从头来过，到头来我还是发现，Vim 一样会让我不满，甚至还不止 5%。

现在回过头来说 Sublime 的那几个问题。

定制性不够高？不然，Sulbime 有一套丰富的 API，没有 Vim/Emacs 那么丰富，但是也足够用了。

社区不够活跃？这个问题确实存在，但是对我的影响并不大，我常用的功能都已经被覆盖，不常用的功能我可以自己开发，社区不够活跃我可以努力成为活跃的一员。

未来不够明朗？现在的 Sublime 已经足够优秀了，未来不更新了都没关系，他只是一个工具，工具的使命是帮助我完成任务。何况 Sublime 现在背后的公司 Sublime HQ 看起来发展的不错，毕竟 Sulbime 销量很好，赚到了钱才有动力开发更好的软件。再说，Sublime 未来完全可以像 Textmate 那样直接开源。

所以，我担心的那些问题其实并不成立，Sublime 作为一个优秀的工具，他有他的不足，任何工具都会有所不足，解决这些不足的方法并不总是换掉这个工具。

既然 Sublime 已有的插件不能满足我的需求，为什么不能自己开发一款？抱着这个态度，我读了一下 Sublime 的插件文档，学习了一些插件的源码，我发现，Sublime 的插件系统设计的很好，接口文档也很清楚，我想要的功能，实现起来很简单。

## Sublime Plugin System

先来简单介绍一下 Sublime 的插件体系。

首先，Sublime 的插件使用的是 Python，比起 Vimscript 来说实在是舒服太多了。

Sublime 所有的插件都在 Sublime 的插件目录下。打开 Command Palette，输入 `Preferences: Browse Packages` 就可以打开插件目录。在 Mac 上，这个目录是 `/Users/__USERNAME__/Library/Application Support/Sublime Text 3/Packages`。

这个目录中的任何 `.py` 文件以及一级子目录中的 `.py` 文件都会自动被 Sublime 识别为插件文件并运行。

点击 Sublime 底部左边的三个点选择 `Console` 打开 Sublime 的控制台，在 Mac 上快捷键是 ``ctrl+` ``。在插件目录中新建一个文件 `touch a.py`，会看到控制台输出一行信息 `reloading plugin a`。

插件文件更新时 Sublime 会自动重新运行，所以开发插件体验其实非常好，直接保存就可以了。

一般我们使用菜单中的 `Tools->Developer->New Plugin...` 来创建一个新插件文件。插件可以使用 Python 的各种标准库以及 Sublime 提供的 [各种 API](https://www.sublimetext.com/docs/3/api_reference.html)。

开发插件需要了解 Sublime 中的几个重要概念：

- `Window`: 很好理解，就是一个 Sublime 窗口
- `Sheet`: 基本上等于 Tab，就是每一个标签页
- `View`: 相当于 Vim 中的 Buffer，表示每一个被编辑的文本
- `Region`: 一个连续的区域
- `Selection`: 当前选中的内容，由一或多个 Region 构成，因为 Sublime 允许多个光标，所以需要区分 Region 和 Selection

![](/image/FgSf8kONWHFqqBXVLy5yQDXO-ocX.png)

## Hello World Plugin

现在我们来编写一个 Hello World 插件感受一下 Sublime 的插件开发。我们要实现的功能很简单，按下 `ctrl+-`，在当前光标位置插入 `Hello, World!`。

首先，使用菜单新建一个插件，保存为 `hello.py`。Sublime 默认填充的内容如下：

```python
import sublime
import sublime_plugin

class ExampleCommand(sublime_plugin.TextCommand):
  def run(self, edit):
    self.view.insert(edit, 0, "Hello, World!")
```

Sublime 提供了几个基础类用于我们继承来实现一些基本功能，比如 `TextCommand` 用于实现文本操作，`EventListener` 实现事件监听。

这个默认插件定义了 `ExampleCommand`，每次运行时，调用 view 的 `insert` 方法插入 `Hello, World!` 字符串到 0 位置，也就是最前面。

定义了 Command 以后，我们绑定一个快捷键到这个 Command 就可以运行它。在 Command Paletee，输入 `Preferences: Key Bindings` 打开快捷键配置，输入以下配置：

```json
{
  "keys": ["ctrl+-"],
  "command": "example"
}
```

注意，Command 的名字是 `camel_case`，而 Class 的名字是 `PascalCase`，同时不用带最后面的 `Command`。比如类的名字是 `MyAwesomeCommand`，那么配置快捷键时对应的 Command 名字是 `my_awesome` 就行了。

配置好以后我们的插件就可以工作了，按下 `ctrl+-` 会发现最前面插入了 `Hello, World!`。

![](/image/FrQGL9ISx_JJ6qrRLP_Z_ccOoZHF.gif)

但这离我们要的效果还差了一点，我们的目标是在当前光标位置插入内容，而不是在文件的最前面。

很明显，我们要修改 `view.insert` 方法的第二个参数，这个参数不用看文档也可以猜到表示的是插入内容的位置。

所以，现在任务变成了如何获取当前光标的位置。查看 Sublime 文档会发现，`view.sel()` 方法会返回当前 View 的 `Selection` 对象，根据 `Selection` 对象可以获取到 `Region` 对象，根据 `Region` 对象就可以获取到位置的偏移量。

光标在闪烁表示当前没有选中任何东西，也就是 Region 的 start 和 end 偏移量是相同的。我们根据这个条件来检查当前是否是光标状态还是选中状态，插件只有在光标状态才工作。

使用这些知识，我们就可以来改造这个插件了，代码很简单就不多说了。

```python
import sublime
import sublime_plugin

class ExampleCommand(sublime_plugin.TextCommand):
  def run(self, edit):
    selections = self.view.sel()
    if len(selections) == 1 and selections[0].begin() == selections[0].end():
      self.view.insert(edit, selections[0].begin(), "Hello, World!")
```

![](/image/Fv7cIbgvITQv5GEasA4W04435vxI.gif)

## BuildX

现在我们来看看怎样实现一个插件实现我想要的 构建、侧边显示错误信息、快速跳转错误行 的功能。我给这个插件起名叫做 BuildX。

首先，Sublime 是自带构建系统的，叫做 Build System，是一个很好用的工具，我们可以使用它来构建任意项目，配置很简单，这里不再展开。

Sublime 的构建系统默认会输出内容到底部的 Exec Panel，看起来很难受。平时我写代码，编辑器都会开两列，方便互相对照，我希望构建以后能在侧边看到输出信息而不是要低头去底部看，就像上面的 Emacs 那样。

我们的插件最终效果如下，构建以后，侧边显示输出信息，同时可以快速跳转到报错的行。

![](/image/Ft6ukJ3VEUopUnL0hXtEpSkn8S-l.gif)

参考了 `sublime text 2 buildview` 的实现，插件的设计思路是：

- 监听 Sublime 的构建，Sublime 会输出内容到底部的 Exec Panel
- 监听 Exec Panel 的 `on_modified` 事件
- 如果没有 Target View，创建一个 Target View 用于显示构建的输出
- 读取 Exec Panel 中的内容到 Target View


### 监听构建

首先，我们需要监听 Sublime 的构建。这里用了一个比较 Tricky 的手段，构建实际上是在运行自带的 `build` Command，但是 Sublime 没有提供方法让我们监听这个 Command。

所以换一个思路，我们监听这个 Command 对应的快捷键是否按下了。Sublime 中每个快捷键都可以带上 Context，插件中可以实现一个方法叫做 `on_query_context` 然后动态返回是否要触发对应的 Command。这样设计的好处在于同样的快捷键在不同的场景中可以运行不同的 Command。

通过“滥用”这个技术，我们可以监听到某个快捷键是否按下。具体做法是配置一个快捷键用于触发构建，同时带上一个 Context，然后在 EventListener 的 `on_query_context` 方法中判断是否存在这个 Context，如果存在，我们就知道快捷键按下了，也就是说，构建开始了。

快捷键配置：

```json
[
  {
    "keys": ["super+b"],
    "command": "build",
    "context": [{"key": "for_buildx", "operator":"equal", "operand":true}]
  },
]
```

BuildX 插件：

```python
class BuildXListener(sublime_plugin.EventListener):
  def on_query_context(self, view, key, *args):
    if key != 'for_buildx':
      # 取消执行快捷键对应的 Command
      return None

    # 此时我们知道构建开始了
    return True
```

### 监听 Exec Panel

通过 Window 的 `get_output_panel` 方法我们可以获取到 Exec Panel 对应的 View，然后就可以使用 EventListener 去监听这个 View 是否修改了。

如果这个 View 的 `on_modified` 出发了，说明构建内容正在输出。

```python
class BuildXListener(sublime_plugin.EventListener):
  source_view = None

  def on_modified(self, view):
    if self.source_view is None:
      return

    if self.source_view.id() != view.id():
      return

    # 到了这里说明 Exec Panel 的内容更新了

  def on_query_context(self, view, key, *args):
    if key != 'for_buildx':
      return None

    self.source_view = view.window().get_output_panel('exec')

    return True
```

### 创建 Target View

得到构建内容以后，我们要做的就是输出到我们的 Target View 中去，在此之前，我们先要创建这个 View。

这一步很简单，调用 `Window` 的 `new_file` 函数就可以得到一个 View，同时注意设置它的属性为 Scratch，也就是说，关闭它的时候 Sublime 不会提醒你保存它。

```python
class BuildXListener(sublime_plugin.EventListener):
  source_view = None
  target_view = None
  window = None

  def on_modified(self, view):
    if self.source_view is None:
      return

    if self.source_view.id() != view.id():
      return

    # 创建 target view
    if self.target_view is None:
      self.target_view = self.window.new_file()
      self.target_view.set_name('Build Output')
      self.target_view.set_scratch(True)

  def on_query_context(self, view, key, *args):
    if key != 'for_buildx':
      return None

    self.window = view.window()
    self.source_view = view.window().get_output_panel('exec')

    return True
```

这样每次构建时，如果没有 Target View，就会新建一个。

### 拷贝 Exec Panel 中的内容

最后，我们要做的就是在 `on_modified` 的时候拷贝内容到我们的 Target View 中。

首先，我们通过 `view.substr` 函数读取到 Exec Panel 中的内容，然后使用 `view.replace` 函数将该内容写到 Target View 中。

因为 `view.replace` 需要一个 `Edit` 对象，所以我们需要创建一个 TextCommand 来执行这个方法。

因为 `on_modified` 可能会触发多次，所以我们需要一个变量来记录一下最后一次写的位置是什么。

```python
import sublime
import sublime_plugin

class ContentReplace(sublime_plugin.TextCommand):
  def run(self, edit, start, end, text):
    self.view.replace(edit, sublime.Region(start, end), text)

class BuildXListener(sublime_plugin.EventListener):
  source_view = None
  target_view = None
  window = None
  last_pos = 0

  def on_modified(self, view):
    if self.source_view is None:
      return

    if self.source_view.id() != view.id():
      return

    # 创建 target view
    if self.target_view is None:
      self.target_view = self.window.new_file()
      self.target_view.set_name('Build Output')
      self.target_view.set_scratch(True)

    # 复制内容到 target view
    new_pos = view.size()
    region = sublime.Region(self.last_pos, new_pos)
    content = view.substr(region)
    self.target_view.run_command('content_replace', {'start': self.last_pos, 'end': new_pos, 'text': content})

  def on_query_context(self, view, key, *args):
    if key != 'for_buildxy':
      return None

    self.window = view.window()
    self.source_view = view.window().get_output_panel('exec')

    return True
```

到了这里，核心功能就已经有了，构建的输出可以在 Target View 中显示，从现在开始我们就可以摆脱底部的 Exec Panel 了。

![](/image/Fn3sCw7H8q7ZJAtx2znBsuSHf4LK.gif)

## 最后

当然插件离最后可用还有一些细节要打磨，比如

- 每次构建时需要清除 Target View 中上次输出的东西
- 每次构建时需要将 Target View 放置在当前 View 的侧边
- 每一个窗口都需要有一个对应的 Target View
- 如果内容过长，要滚动 Target View

这些对着文档都很容易，不再赘述了，有兴趣的朋友可以自己尝试一下怎样实现，是一个很好的练手机会。

关于错误行跳转功能，Sublime 是自带的，点击菜单 `Build Results->Next Result/Previous Result` 就可以使用，前提是 Build System 中的 `file_regex` 正则要配置好。

每次跳转的时候，Sublime 会在 Exec Panel 中高亮当前所在的错误信息（具体实现是选中那些信息，选中的文本会有不一样的样式，也就实现了高亮），通过监听 Exec Panel 的 `on_selection_modified` 的事件，我们就可以在 Target View 中实现高亮。

我最后完成的代码在这里 [sublime-buildx](https://github.com/cj1128/sublime-buildx)。内容很简单，没有什么复杂的，但是实现的这个功能对我来说却大大提高了生产力。我想如果对 Sublime 的 API 有了解的人，实现这样的插件应该花不了两个小时。

两个小时就可以解决的问题，为什么要推翻整个系统重来？之后任何的重大动作都要仔细评估是否值得。

XKCD 的这幅漫画很能引发思考，在你动手 切换工具/造工具/改进工具 的时候，一定要评估一下你投入的时间以及节省的时间是否匹配。

![](/image/Ft_ZecIdlpHJGqhla063FcO3txrv.png)

如果说一个任务你每天做一次，每次耗费 6 分钟，你觉得很慢，动手改进，改进到了 1 分钟，那么这次改进带来的提升是节省了 5 分钟，以五年为例，一共为你节省了 6 天。问题是，将一个工具从 6 分钟改进到 1 分钟如此巨大的性能提升 6 天内你能搞定吗？如果搞不定的话，就要好好想想了。
