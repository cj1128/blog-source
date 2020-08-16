---
title: Shell 启动类型探究 ── login && interactive
date: 2020-08-16T11:30:23+08:00
cover: http://asset.cjting.cn/FgNP1hv-An94wEaBmEuMraLR457-.jpg
---

Shell 对程序员来说是必不可少的生产力工具。

```text
$ figlet <<< "Hello Shell"
 _   _      _ _         ____  _          _ _
| | | | ___| | | ___   / ___|| |__   ___| | |
| |_| |/ _ \ | |/ _ \  \___ \| '_ \ / _ \ | |
|  _  |  __/ | | (_) |  ___) | | | |  __/ | |
|_| |_|\___|_|_|\___/  |____/|_| |_|\___|_|_|

```

<!--more-->

下面这条指令可以查看 Shell 中我们最常用的 10 条命令，大家可以试一试。

```bash
$ history | awk '{CMD[$2]++;count++;}END { for (a in CMD)print CMD[a] " " CMD[a]/count*100 "% " a;}' | grep -v "./" | column -c3 -s " " -t | sort -nr | nl |  head -n10
 1  429  16.6473%    ls
 2  235  9.11913%    vim
 3  204  7.91618%    gss
 4  186  7.21769%    yarn
 5  169  6.55801%    cd
 6  86   3.33721%    j
 7  75   2.91036%    git
 8  64   2.48351%    subl
 9  49   1.90144%    rg
10  49   1.90144%    glog
```

没想到我最常用的是 `ls`，不过也挺合理的，毕竟做任何操作之前习惯性的 ls 一下。(我的 ls 实际上链接到了 [exa](https://github.com/ogham/exa))。

关于 Shell 有太多的话题可以谈了：

- 各种 Shell 的特性区别：Bash/Zsh/Fish/Csh...
- Shell 中的各种概念：Command/Function/Alias/Environment Variable/Built-in Command...
- 怎样配置一个让大家都羡慕的提示符：[spaceship-prompt](https://github.com/denysdovhan/spaceship-prompt), [powerline-shell](https://github.com/b-ryan/powerline-shell)...
- Shell 的编程特性：If/While/Variable/Array...
- 各种极大提高生产力的工具：Oh My Zsh/Ripgrep/Exa/Htop...
- Windows 上的 Shell 配置：Windows Terminal/PowerShell/MSYS2/MinGW...

这些，都不是这篇博客的主题 😉 这篇博客我想谈一个比较细节的话题：Shell 的启动类型。

第一次遇到这个问题大约是在五年前，有一次去朋友家玩耍，朋友问了我一个问题：为什么他的脚本在执行时提示找不到 `node` 指令，而他在终端中输入 `node` 是没有问题的。

当时我隐约感觉到是 Shell 启动类型不同导致的问题，但是具体的机制我说不上来。

当然，最后我给了一个解决方案，虽然谈不上优雅但是管用，那就是使用绝对路径。五年后的今天，我们来看看，这个问题究竟是怎么回事。

## 什么是 Shell？

首先，我们要厘清一个概念：什么是 Shell？

很长一段时间内我不理解什么是 Shell，也搞不清 Shell 和 Terminal 的区别，只笼统地认为 iTerm 就是 Shell。

我们先来看字典对 Shell 的释义：

> the hard outer covering of something, especially nuts, eggs, and some animals.

从这个解释来看 Shell 指的是物体表面的外壳，在计算机中这其实是一个比喻，**Shell 是 Kernel 的外壳**。

[这个链接](https://unix.stackexchange.com/questions/11454/what-is-the-difference-between-a-builtin-command-and-one-that-is-not/11465#11465) 对这个问题回答地很好，我摘录如下：

> A shell is a program that prints a prompt, reads a line of input from you, and then interprets it as one or more commands to manipulate files or run other programs. Before the invention of the GUI, the shell was the primary user interface of an OS.

Shell 首先是一个程序，这个程序用来和 Kernel 进行交互，在 GUI 发明之前，Shell 是和 Kernel 交互的唯一方式。

在 GUI 发明之后，某些交互转移到 GUI 完成，但是 Shell 依然保留了下来，因为对于高级计算机使用者，Shell 的灵活性和功能的强大性是 GUI 无法比拟的。

## 类型和场景

{{% tip %}}
后续我们的讨论全部基于 [Manjaro Linux](https://manjaro.org/) 和 [Bash](https://www.gnu.org/software/bash/)。
{{% /tip %}}

由于使用场景的不同，Shell 被分为两个类型：

- `login` / `non-login`
- `interactive` / `non-interactive`

这两个类型影响的是 **Shell 的启动文件 (startup files)**。

`login` / `non-login` Shell 我们现在不太好感知了。如果把时间拨回到上个世纪还没有 GUI 的时候，就很好理解。

当我们使用终端登录一台主机时，主机会为我们启动一个 Shell，由于是登录以后启动的，所以是 login Shell。

login Shell 会初始化一些针对整个登录会话的任务，比如说，我希望我每次登录主机，就自动发一封邮件出去，那么这个任务就可以在 login Shell 的启动文件中完成。

其他情况的 Shell 就是 non-login 的，比如我登录以后，输入 `bash` 再启动一个 Shell，那么这个 Shell 就是 non-login 的。

`interactive` / `non-interactive` 就比较好理解了。日常我们在终端中使用的就是 interactive Shell，它会输出提示符，会有 Job Control 等功能。

而当我们执行 Shell 脚本时例如 `bash test.sh`，那么此时的 Shell 便是 non-interactive 的。

使用如下的命令可以检测当前 Shell 是否是 interactive 的：

```bash
[[ $- == *i* ]] && echo 'Interactive shell' || echo 'Non-interactive shell'
```

而这条命令可以检测 Shell 是否是 login 的：

```bash
shopt -q login_shell && echo 'Login shell' || echo 'Non-login shell'
```

检测是否是 login Shell 还有一个办法，那就是输入 `logout`，如果是 login Shell，效果相当于 `exit`，如果不是，会提示 `logout: not login shell`。

## 启动文件

一般来说我们对 Bash 的配置都会放在 `~/.bashrc` 中，因为我们知道 Bash 在启动以后会 source 这个文件。但其实这并不一定，启动类型会影响启动文件。

现在我们知道了 Shell 组合起来看有四种类型：

- `login + interactive`
- `login + non-interactive`
- `non-login + interactive`
- `non-login + non-interactive`

那么它们的启动文件分别是什么？我们一个一个来实验。

我们首先 SSH 到我们的 Manjaro 主机上，此时得到的 Shell 就是 `login + interactive` 的。

实验方式为想办法启动特定类型的 Shell，使用 `strace` 追踪系统调用，通过系统调用分析 Shell 打开了哪些文件。

首先测试第一种，`login + interactive`。

SSH 登录以后，输入指令 `strace -f -e trace=file -o /tmp/login_interactive /bin/bash -l`。

`-l` 参数可以强制 Bash 变成 login Shell，默认情况下，已经登录后再使用 Bash 得到的是 non-login Shell。

分析文件可以得出，`login + interactive` Shell 的启动文件如下：

- `/etc/profile`
- `/etc/profile.d/...`
- `~/.bash_profile`, `~/.bash_login`, `~/.profile` 按顺序找到的第一个

接下来是第二种，`login + non-interactive`。

SSH 登录以后，随便编写一个脚本 `test.sh`，然后使用 `bash -l test.sh` 得到的就是 `login + non-interactive` 的 Shell。

启动文件如下：

- `/etc/profile`
- `/etc/profile.d/...`
- `~/.bash_profile`, `~/.bash_login`, `~/.profile` 按顺序找到的第一个

可以发现，`login + non-interactive` 和 `login + interactive` 模式的启动文件是一模一样的。

第三种情况，`non-login + interactive`。

SSH 登录以后，输入 `bash` 再启动一个 Bash 就是 `non-login + interactive` 的。

启动文件如下：

- `/etc/bash.bashrc`
- `~/.bashrc`

最后一种情况，`non-login + non-interactive`，SSH 登录以后，运行 `bash test.sh` 得到的就是这种情况。

**这种情况下，没有启动文件**。但是，Bash 会查看一个特殊的环境变量 `BASH_ENV`，如果这个变量有值，会 source 这个变量指向的文件。

所以总结一下，其实四种启动类型定义了三种启动文件，因为 `login + interactive` 和 `login + non-interactive` 是一样的。

日常我们在终端中执行脚本，都是 `non-login + non-interactive` 这种情况，也就是没有任何启动文件，为什么没有出问题？这是因为所有的进程都会从父进程中继承环境变量，而对日常使用影响最大的 PATH 变量会被继承过来，所以一般不会出问题。

除了上述的默认行为，我们也可以使用 Bash 的一些选项来调整启动文件，比如 `--rcfile`, `--noprofile`, `--norc`，以及使用 `-l` 和 `-i` 来调整 Bash 的启动类型。

最后我们总结一下，可以得到这样一幅图。

![](http://asset.cjting.cn/Fp3wlzbJBjk9xBPbr-t8SHf9KTbb.png)

是的，看起来很复杂，欢迎来到真实世界🙂。好在我们无需去记住这些细节，只要做到如果有一天遇到了问题，有一个清晰的排查方向就行了。

日常使用中，对于 Bash 的配置就放在 `~/.bashrc` 中即可。`~/.bash_profile` 一般会含有 source `~/.bashrc` 的代码，所以不管 login 还是 non-login， `.bashrc` 文件都会被执行。

```bash
# Manjaro 默认的 ~/.bash_profile
[[ -f ~/.bashrc ]] && . ~/.bashrc
```

{{% tip %}}
有好奇过 `rc` 后缀是什么意思吗？[rc = run commands](https://unix.stackexchange.com/questions/3467/what-does-rc-in-bashrc-stand-for)
{{% /tip %}}

再有一个需要注意的情况就是，常用 Shell 的地方比如 Crontab，以及在各种编程语言中调起的 Shell，比如 Python 的 `os.system` 以及 Node 的 `child_process.exec` 执行的都是 `non-login + non-interactive` 的 Shell，也就是什么启动文件都不会 source，只会继承环境变量。

其实，这里还有一个细节，Crontab, Python, Node, Make 以及其他大部分使用 Shell 的程序，默认使用的 Shell 都是 `/bin/sh`。在大部分系统上，这个文件链接到了 /bin/bash。但是，如果 Bash 发现自己是以 `/bin/sh` 的身份启动的，也就是 `$0` 是 `/bin/sh` 的话，它的行为会发生改变，包括启动文件，会调整自己尽量和 sh(Bourne shell) 兼容。比如说，在 `non-login + non-interactive` 情况下它不会 source `$BASH_ENV`。

我们以 Node 为例，新建一个文件 `echo 'hello from test.sh' > test.sh`，然后设置 BASH_ENV 指向这个文件并启动 Node。

```bash
$ BASH_ENV=test.sh node
> const c = require("child_process")
> c.execSync("echo hello").toString()
'hello\n' # 可以发现 'hello from test.sh' 没有打印，也就是 BASH_ENV 指向的文件没有被 source
> c.execSync("echo hello", {shell: "/bin/bash"})
'hello from test.sh\nhello\n' # 这次有了
> c.execSync("echo $0").toString()
'/bin/sh\n' # 默认情况下执行的是 /bin/sh
```

## ZSH

我们个人开发电脑一般多使用 ZSH，毕竟配合 Oh-My-Zsh 以后实在是太好用了。

ZSH 在启动文件方面和 Bash 有所不同，[Startup Files](http://zsh.sourceforge.net/Intro/intro_3.html) 是 ZSH 官方的说明文档。通过这个非常简略的文档，我们可以知道 ZSH 相关的启动文件有 5 个：

- `.zshenv`
- `.zprofile`
- `.zshrc`
- `.zlogin`
- `.zlogout`

这 5 个文件分别有系统级和用户级的区别，使用上面的方法，我们可以一一测试不同的启动类型会 source 什么样的启动文件，这里不再赘述了，直接贴出结果。

```
+----------------+-----------+-----------+------+
|                |   Login   |Interactive|Script|
|                |           |non-login  |      |
+----------------+-----------+-----------+------+
|/etc/zshenv     |    1      |    1      |  1   |
+----------------+-----------+-----------+------+
|~/.zshenv       |    2      |    2      |  2   |
+----------------+-----------+-----------+------+
|/etc/zprofile   |    3      |           |      |
+----------------+-----------+-----------+------+
|~/.zprofile     |    4      |           |      |
+----------------+-----------+-----------+------+
|/etc/zshrc      |    5      |    3      |      |
+----------------+-----------+-----------+------+
|~/.zshrc        |    6      |    4      |      |
+----------------+-----------+-----------+------+
|/etc/zlogin     |    7      |           |      |
+----------------+-----------+-----------+------+
|~/.zlogin       |    8      |           |      |
+----------------+-----------+-----------+------+
|                |           |           |      |
+----------------+-----------+-----------+------+
|                |           |           |      |
+----------------+-----------+-----------+------+
|~/.zlogout      |    9      |           |      |
+----------------+-----------+-----------+------+
|/etc/zlogout    |    10     |           |      |
+----------------+-----------+-----------+------+
```

ZSH 和 Bash 一样，`login + interactive` 和 `login + non-interactive` 的启动文件是一样的，上表中归为 `Login`，`Script` 指的是 `non-login + non-interactive`。

ZSH 和 Bash 非常不一样的一点就是不管什么情况下 ZSH 都会 source `.zshenv` 文件。这个相比 Bash 就是一个非常好的特性了，从文件名可以看出这个文件主要负责设置一些环境变量，比如 `PATH`, `LC_ALL`, `EDITOR`, `GOPATH`, `GOROOT`等等。这样在 Crontab 等环境中，就不会出现 command not found 的问题了。

ZSH 这么多配置文件，具体该怎么用？什么样的配置放在什么样的文件中？[这里](https://unix.stackexchange.com/questions/71253/what-should-shouldnt-go-in-zshenv-zshrc-zlogin-zprofile-zlogout) 是 StackExchange 中一个问答，非常的详细，可以作为参考。

简单来说，在 `.zshenv` 文件中初始化各种环境变量，里面应该全部都是 `export NAME=VALUE` 这样的语句。

在 `.zshrc` 文件中，初始化交互模式要用的东西，包括

- 各种 function 定义
- `setopt` 终端属性配置
- 各种 alias 定义
- PS1 提示符配置
- 命令补全脚本加载
- 各种高亮和颜色配置，比如 zsh-syntax-highlighting
- 快捷键设置
- autojump 等等

## 参考

- [Zsh/Bash startup files loading order](https://medium.com/@rajsek/zsh-bash-startup-files-loading-order-bashrc-zshrc-etc-e30045652f2e)
- [Zsh/Bash startup files loading order (.bashrc, .zshrc etc.)](https://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/)
- [Bash initialization behaviour](https://github.com/0cjs/sedoc/blob/master/lang/bash/init.md)

