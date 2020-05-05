---
title: 编写第一个 Sublime 插件 —— BuildX
date: 2020-04-22T17:04:40+08:00
draft: true
cover: http://asset.cjting.cn/FvnQbq-MpgcAKuLDYeuhUuern_Yr.jpg
---

从我接触计算机开始到现在 Sublime 一直是我的主要编辑器，现代化的 UI、流畅的速度以及众多的插件，特别是开箱即用的各种特性，让他一直默默成为我的生产力助手。最好的工具就是这样的状态，我甚至都注意不到他的存在。

我尽量避免使用各种 IDE，除非万不得以，有些工作不使用配套的工具十分麻烦，当然计算机里面没有不能绕过的事情，只是得不偿失而已。

比如苹果的 XCode 和谷歌的 Android Studio，如果做 Android/iOS 开发，不用这些工具当然可以，但是绝对是不推荐的方案。第三方工具永远不会有官方的工具更新的快，同时，各种教程资料也不会针对第三方工具，一旦遇到问题只能靠自己解决，这个时间投入，是非常不值得的。

幸好我的主要技术栈都不需要 IDE，JS, C, Go, Python, Elixir 这些语言 IDE 当然可以有些帮助，但是和 IDE 的臃肿卡顿比起来，这些帮助就显得不重要了。

<!--more-->

## Sublime && Vim

虽然 Sublime 满足了我的各种需要，但是我心里其实一直在积累换掉他的想法，原因是我觉得 Sublime 的定制性不够。当然，现在回过头看，这是一个偏见，或者说这个论点不够站得住脚。

因为 Sublime 是闭源的关系，再加上各种讨论也不多，不像 Vim/Emacs 我时常能在 HackerNews 看到帖子讨论他们，给人的感觉是社区很不活跃。所以我也一直没有花时间去了解 Sublime 的插件系统和 API。一般都是遇到问题的时候才去 Package Control 上找一找有没有现成的插件。

上一次安装 Sublime Go 的时候花了一些时间，结果也不尽如人意，我对 Go 的要求很简单，保存时自动运行一下 `goimports` 对我来说就够了。但是 Sublime Go 这个插件安装配置都非常麻烦（也可能当时是我不够了解 Sublime 的插件系统），为了实现这样一个小功能费了我很大功夫，总之当时给我留了很不好的印象。

相比之下 Vim 那边的 [vim-go](https://github.com/fatih/vim-go) 是一款大名鼎鼎的插件，使用量和热度都要比 Sublime Go 高很多。

这些年也能明显感觉到 Sublime 的圈子在缩小，似乎参与的人变得越来越少，很多插件的最后更新时间都停留在很久之前。不难猜测，大部分开发者应该是转到 VS Code 上去了。我对基于 Web 的应用程序态度是能不用就不用，我始终无法忍受那种时不时的卡顿感。VS Code 确实很不错，功能，界面，易用性都很棒，但不是我的类型。

因为这些种种原因，Sublime 虽然在大部分中时间完美契合了我的需要，但是在我眼中他是一个定制性不够高，社区不够活跃，未来也不够明朗（不开源由私人公司控制）的编辑器。

选择技术学习时我的看法一向是学习那些能够持久的技术，这样知识的积累才会带来价值。所以很自然地，我一直有一个计划要把我的整个工作流迁移到 Vim 上。Vim 毫无疑问满足我的各项要求：

- 足够高的定制性
- 足够大的社区
- 对 Vim 的知识积累会带来价值，越使用，越了解，越熟练。

年后疫情期间我花了大概一个月的时间，完成了这个迁移。我把我的各项需要都在 Vim 中实现了。

我先是通过 [Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/) 系统地学习了 Vimscript，然后花了大量的时间阅读 Vim 的手册（从 `help usr_01.txt` 开始），理解 Vim 中的各个概念（Buffer, Window, Tab, Session, Mode, Syntax, Map, Text Object）。

然后就是安装配置各种插件，阅读插件的文档以及根据各种网络上的 `.vimrc` 来配置自己的 `.vimrc`，时不时再读一下各种 setting 的文档，理解一下配置项到底在干什么。

比如下面这是一个很常见的 Vim 配置，但是 `shiftwidth` 和 `softtabstop` 以及 `tabstop` 有什么区别？设置成不一样会怎么样？

```text
set expandtab " tabs are spaces
set shiftwidth=2
set softtabstop=2
set tabstop=2
```

粗略列一下我在 Vim 中配置的一些功能：

- Buffer 管理（删除，重命名，快速切换）
- 文件快速切换 (fzf)
- 项目快速切换
- 构建系统，QuickFix
- 搜索替换
- 侧边栏
- Tag 管理，符号跳转
- Statusline/Tabline 配置

Vim 的特点是，功能都可以实现，但是需要你自己配置，而且往往会有一些小的瑕疵，让你非常难受。比如，NERDTree 这个大名鼎鼎的 Vim 插件，我用下来真是感觉太一般了。外部新建的文件需要手动刷新才能看到，当然，你可以用一些技术来实现“自动刷新”，比如监听 Cursor 事件，但是这样对新手是太不友好了。

总体来说，迁移是成功的，但是在某个阳光明媚的清晨，我决定还是换回 Sublime。

Vim 的定制性是很强，这没问题，问题是这个定制性带给我的东西不多却浪费了我太多时间。我犯了一个严重的错误：**针对少数情况优化**。

Sublime 让我不满意的时候非常少，可以说占比 5%，在 95% 的时间里，我是用得非常开心的。但是为了解决那 5% 的不满，我推翻了整个系统，从头来过，到头来我还是发现，Vim 一样会让我不满，甚至还不止 5%。

现在回过头来说 Sublime 的那几个问题。

定制性不够高？不然，Sulbime 有一套丰富的 API，当然没有 Vim 那么丰富，但是足够用了。

社区不够活跃？这个问题确实存在，但是对我的影响不大，我常用的功能都已经被覆盖，不常用的功能我完全可以自己开发。希望社区够大是因为不想自己去开发，如果自己去开发，社区大不大都无所谓。

未来不够明朗？现在的 Sublime 已经足够优秀了，未来不更新了都没关系，他是一个工具，工具的使命是帮助我完成任务。我有一把好用的锤子，我会一直用下去，更新不更新不重要。再说，Sublime 未来完全可以像 Textmate 那样直接开源。

## Hello World Plugin

## Sublime Plugin System

## Sublime Build System

## BuildX Design

1. 监听事件
2. 监听 panel 内容更新
3. 创建 target view
4. 将 panel 内容复制到 target view
5. 定义一个简单的 syntax
6. 监听 selection 变化
7. 修改 target view 的 selection

## BuildX Implementation

4. 实现 BuildX

<!--more-->

```python
import sublime
import sublime_plugin

class OurFirstPlugin(sublime_plugin.TextCommand):
  def run(self, edit):
    print("!!!!example command", edit)
    selections = self.view.sel()
    if len(selections) == 1 and selections[0].begin() == selections[0].end():
      self.view.insert(edit, selections[0].begin(), "Hello, World!")
```

```
{
  "keys": ["ctrl+-"],
  "command": "our_first_plugin"
}
```
