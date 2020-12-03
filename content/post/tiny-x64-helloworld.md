---
title: 最小的 64 位 Hello World
tags: [linux, elf, assembly]
cover: http://asset.cjting.cn/FnMniJy5zFNdS5hK8UcXxwcvnoKC.jpg
date: 2020-11-30T21:31:08+08:00
---

Hello World 应该是每一个程序员的启蒙程序，出自于 [Brian Kernighan](https://en.wikipedia.org/wiki/Brian_Kernighan) 和 [Dennis Ritchie](https://en.wikipedia.org/wiki/Dennis_Ritchie) 的一代经典著作 [The C Programming Language](https://en.wikipedia.org/wiki/The_C_Programming_Language)。

```c
// hello.c
#include <stdio.h>

int main() {
  printf("hello, world\n");
  return 0;
}
```

这段代码我想大家都太熟悉了，但是如果细究起来，里面隐藏着很多问题：

- `#include <stdio.h>` 和 `#include "stdio.h"` 有什么区别？
- `stdio.h` 文件在哪里？里面是什么内容？
- 为什么入口是 `main` 函数？可以写一个程序入口不是 `main` 吗？
- `main` 的返回值有什么用？是谁在处理 `main` 的返回值？
- `printf` 是谁实现的？如果不用 `printf` 可以做到在终端中打印字符吗？

<!--more-->

上面这些问题都很有意思，涉及到程序的编译、链接和装载。现代的 IDE 在方便我们开发的同时，也将很多底层的细节隐藏了起来。往往写完代码以后，点击「构建」就行了，至于构建在发生什么，具体是怎么构建的，很多人可能并不关心，甚至根本不知道从源代码到可执行程序这中间经历了什么。

编译、链接和装载是一个非常巨大的话题，不是一篇博客可以涵盖的。在这篇博客中，我想使用「文件尺寸」作为线索，来介绍从 C 源代码到可执行程序这个过程中，所经历的步骤和涉及的知识点。

对于每一个知识点，我会给出详细介绍它的链接。所以，这篇博客更像是一个路线图，标记了前进道路上遇到的每一个关卡以及需要的通关手册。

{{% tip %}}
后续所有的讨论都是基于 CentOS7 64 位 Linux 操作系统环境。
{{% /tip %}}

我们先来编译上面的程序：

```bash
$ gcc hello.c -o hello
$ ./hello
hello, world
$ ll hello
-rwxr-xr-x 1 root root 16712 Nov 24 10:45 hello
```

我们会发现这个简单的 hello 程序大小为 16K，在今天看来，16K 真的没什么，但是考虑到这个程序所做的事情，它真的需要 16K 吗？

在 C 诞生的上个世纪 70 年代，PDP-11 的内存为 144K，一个 hello world 就占了 16K，这显然是不合理的，一定有办法缩减体积。

{{% tip %}}
说起 C 语言，我想顺带提一下 UNIX。没有 C 就没有 UNIX 的成功，没有 UNIX 的成功也就没有 C 的今天。诞生于上个世纪 70 年代的 UNIX 不得不说是一项了不起的创造。

这里推荐两份关于 UNIX 的资料：

- [The UNIX Time-Sharing System](https://chsasank.github.io/classic_papers/unix-time-sharing-system.html) 1974 年由 Dennis Ritchie 和 Ken Thompson 联合发表的介绍 UNIX 的论文。不要被“论文”二字所吓到，实际上，这篇文章写得非常通俗易懂，由 UNIX 的作者们向你娓娓道来 UNIX 的核心设计理念。

- [The UNIX Operating System](https://www.youtube.com/watch?v=tc4ROCJYbm0&t=797s) 一段视频，看身着蓝色时尚毛衣的 Kernighan 演示 UNIX 的特性，不得不说，Kernighan 简直太帅了。
{{% /tip %}}

接下来我们来玩一个游戏，目标是：在 CentOS7 64 位操作系统上，一个打印 hello world 的可执行程序最小可以做到多小？

## Executable

我们先来看「可执行程序」这个概念。

什么是可执行程序？按照字面意思来理解，那就是：可以执行的程序。

### ELF

上面用 C 编写的 hello 当然是可执行程序，毫无疑问。

实际上，我们可以说它是真正的“可执行”程序（区别于后文的脚本），或者说“原生”程序。

因为它里面包含了可以直接用于 CPU 执行的机器代码。

hello 的存储格式叫做 ELF，全称为 Executable and Linkable Format。

ELF 只是一个格式，用于存储目标文件和可执行文件，本身并不难理解，`/usr/include/elf.h` 文件中含有 ELF 的具体定义信息。

关于 ELF 互联网上有很多资料，这里不再展开了。

### Shebang

接下来我们来看另外一种形式的可执行程序，脚本。

```bash
$ cat > hello.sh <<EOF
#!/bin/bash
echo "hello, world"
EOF
$ chmod +x hello.sh
$ ./helo.sh
hello, world
```

按照定义，因为这个脚本可以直接从命令行执行，所以它是可执行程序。

那么 hello 和 hello.sh 的区别在哪里？

可以发现 hello.sh 的第一行是一个叫做 Shebang 的东西 `#!/bin/bash`，这个东西说明当前文件需要 `/bin/bash` 程序来执行。

所以，hello 和 hello.sh 的区别就在于：一个可以直接执行不依赖于外部程序，而一个需要依赖外部程序。

我曾经有一个误解，认为 Shebang 是 Shell 在处理，当 Shell 执行脚本时，发现第一行是 Shebang，然后调用相应的程序来执行该脚本。

实际上并不是这样，对 Shebang 的处理是内核在进行。当内核加载一个文件时，会首先读取文件的前 128 个字节，根据这 128 个字节判断文件的类型，然后调用相应的加载器来加载。

比如说，发现是一个 ELF 文件（ELF 文件前四个字节为固定值，称为魔数），那么就调用 ELF 加载器。

而发现含有 Shebang，那么就启动 Shebang 指定的程序，将当前路径作为第一个参数传入。所有我们执行 `./hello.sh` 时，在内核中会被修改为 `/bin/bash ./hello.sh`。

这里其实有一个问题，如果要脚本可执行，那么第一行必须是 Shebang。Shebang 的形式固定为 `#!` 开头，对于使用 # 字符作为注释的语言比如 Python, Elixir 来说，这自然不是问题。但是对于 # 字符不是注释字符的语言来说，这一行就是一个非法语句，必然带来解释错误。

比如 JavaScript，它就不使用 # 作为注释，我们来写一个带 Shebang 的 JS 脚本看看会怎么样。

```bash
$ cat <<EOF > test.js
#!/usr/bin/env node
console.log("hello world")
EOF
$ chmod +x test.js
$ ./test.js
hello world
```

并没有出现问题，所以这里是怎么回事？按道理来说第一行是非法的 JS 语句，解释器应该要报错才对。

如果把第一行的 Shebang 拷贝到第二行，会发现报了 `SyntaxError`，这才是符合预期的。所以必然是 Node 什么地方对第一行的 Shebang 做了特别处理，否则不可能。

大家可以在 Node 的代码里面找一找，看看在什么地方😉

答案是什么地方都没有，或者说在最新的 Node 中，已经没有地方在处理 Shebang 了。

在 Node v11 中，我们可以看到相应的代码在 [这里](https://github.com/nodejs/node/blob/v11.15.0/lib/internal/main/check_syntax.js#L50)。

`stripShebang` 函数很明显，它的作用在于启动 JS 解释器的时候，将第一行的 Shebang 移除掉。

但是在 Node v12 以后，Node 更新了 JS 引擎 V8 到 7.4，V8 在这个版本中实现一个叫做 [Hashbang grammar](https://v8.dev/blog/v8-release-74#hashbang-grammar)的功能，也就是说，从此以后，Shebang 的剥离交由 V8 来处理了，因此 Node 删除了相关代码。

因为 Shebang 是 V8 在处理了，我们在浏览器中也可以加载带有 Shebang 的 JS 文件，不会有任何问题~

我们可以得出结论，支持作为脚本使用的语言，如果不使用 # 作为注释字符，那么必然要特别处理 Shebang，否则使用起来就太不方便了。

### /usr/bin/env

上面的 test.js 文件中，不知道大家是否注意到，解释器路径写的是 `/usr/bin/env node`。

这样的写法如果经常写脚本，应该不陌生，我之前一直这样用，但是没有仔细去探究过为什么。

首先我们来看 `/usr/bin/env` 这个程序是什么。

根据 `man env` 返回的信息：env - run a program in a modified environment.

`env` 的主要作用似乎是修改程序运行的环境变量，比如说

```bash
$ export name=shell
$ node
> process.env.name
'shell'
$ env name=env node
> process.env.name
'env'
```

通过 env 我们修改了 node 运行时的环境变量。但是这个功能和我们为什么要在 Shebang 中使用 env 其实并没有关系。

在 Shebang 中使用 env 主要是因为另外一个原因，那就是 env 会在 PATH 中搜索程序并执行。

当我们执行 `env abc` 时，env 会在 PATH 中搜索 abc 然后执行，就和 Shell 一样。

这就解释了为什么我们在脚本中使用 `/usr/bin/env node`。对于想要给他人复用的脚本，我们并不清楚他人系统上 node 的路径在哪里，但是我们清楚的是，它一定在 PATH 中。

而同时，绝大部分系统上，`env` 程序的位置是固定的，那就是 `/usr/bin/env`。所以，通过使用 `/usr/bin/env node`，我们可以保证不管其他用户将 node 安装在何处，这个脚本都可以得到正确执行。

### binfmt_misc

前面我们提到过，内核对于文件的加载其实是有一套“多态“机制的，即根据不同的类型来选择不同的加载器。

那么这个过程我们可以自己定制吗？当然可以。

内核中有一个加载器叫做 `binfmt_misc`，看名字可以知道，这个加载器用于处理各种各样非标准的其他类型。

通过一套 [语法](https://www.kernel.org/doc/Documentation/admin-guide/binfmt-misc.rst)，我们可以告知 binfmt_misc 加载规则，实现自定义的加载。

比如我们可以通过 binfmt_misc 实现直接运行 Go 文件。

```bash
# 运行 Go 文件的指令是 `go run`，不是一个独立的程序
# 所以，我们先要写一个脚本包装一下
$ cat <<EOF > /usr/local/bin/rungo
#!/bin/bash
go run $1
EOF
# 接下来写入规则告诉 binfmt_misc 使用上面的程序来加载所有
# 以 .go 结尾的文件
$ echo ':golang:E::go::/usr/local/bin/rungo:' > /proc/sys/fs/binfmt_misc/register
# 现在我们就可以直接运行 Go 文件了
$ cat << EOF > test.go
package main
import "fmt"

func main() {
  fmt.Println("hello, world")
}
EOF
$ chmod +x test.go
$ ./test.go
hello, world
```

### Tiny Script

根据上面的知识，如果是脚本的话，想要做到体积尽可能小，应该要满足一下两点

- 解释器路径要短
- 脚本本身用于打印的代码要尽量短

解释器的路径很好处理，我们可以使用链接。

脚本本身的代码要短，我想到的是 PHP，PHP 打印 hello world 的代码是 `hello, world`，对的，你没看错，连引号都不用。

所以，最终我们得到的结果如下：

```bash
# 假设 php 在 /usr/local/bin/php
$ cd /
$ ln -s /usr/local/bin/php p
$ cat <<EOF > final.php
#!/p
hello, world
EOF
$ chmod +x final.php
$ ./final.php
hello, world
$ ll final.php
-rwxr-xr-x 1 root root 18 Dec  2 22:32 final.php
```

在脚本模式下，我们的成绩是 18 个字节，使用的解释器是 PHP。

## Tiny Native

上面得到的是针对脚本的。接下来我们来看看，对于原生可执行程序，最小的体积能够做到多小。

### step0

首先，我们使用上文提到的 hello.c 作为基准程序。

```c
// hello.c
#include <stdio.h>

int main() {
  printf("hello, world\n");
  return 0;
}
```

`gcc hello.c -o hello.out` 编译以后，它的大小是 16712 个字节。

### step1: strip

第一步，也是最最容易想到的一步，剔除符号表。

符号是链接器工作的的基本元素，我们源代码中函数、变量等被编译以后，都变成了符号。

如果经常从事 C 开发，一定遇到过 `ld: symbol not found` 的错误，往往是忘记链接了某个库导致的。

使用 `nm` 我们可以查看一个二进制程序中含有哪些符号。

对 step0 中的 hello.out 程序使用，输出如下：

```
$ nm hello.out
0000000000404038 B __bss_start
0000000000404038 b completed.6949
0000000000404028 D __data_start
0000000000404028 W data_start
0000000000401090 t deregister_tm_clones
0000000000401110 t __do_global_dtors_aux
0000000000403df8 d __do_global_dtors_aux_fini_array_entry
0000000000404030 D __dso_handle
0000000000403e08 d _DYNAMIC
0000000000404038 D _edata
0000000000404040 B _end
00000000004011e4 T _fini
0000000000401130 t frame_dummy
0000000000403df0 d __frame_dummy_init_array_entry
0000000000402154 r __FRAME_END__
0000000000404000 d _GLOBAL_OFFSET_TABLE_
                 w __gmon_start__
0000000000402014 r __GNU_EH_FRAME_HDR
0000000000401000 T _init
0000000000403df8 d __init_array_end
0000000000403df0 d __init_array_start
0000000000402000 R _IO_stdin_used
0000000000403e00 d __JCR_END__
0000000000403e00 d __JCR_LIST__
00000000004011e0 T __libc_csu_fini
0000000000401170 T __libc_csu_init
                 U __libc_start_main@@GLIBC_2.2.5
0000000000401156 T main
                 U puts@@GLIBC_2.2.5
00000000004010d0 t register_tm_clones
0000000000401060 T _start
0000000000404038 D __TMC_END__
```

可以看到一个符号叫做 `main`，这个对应的就是我们的 main 函数。但是很奇怪没有看到 `printf`，而是出现了一个叫做 `puts@@GLIBC_2.2.5` 的符号。

这里是 GCC 做的一个优化，如果没有使用格式字符串调用 `printf`，GCC 会将它换成 `puts`。

这些符号都存储在了 ELF 中，对于可执行文件来说，并没有什么太大作用。所以我们可以首先通过剔除符号表来节省空间。

有两个方法，第一是通过 `strip` 程序，第二是通过 GCC 的参数。

这里我们使用第二个方法，`gcc -s hello.c -o hello.out` 得到新的可执行程序，它的大小是 14512 字节。

### step2: optimization

step1
  size: 14512
  首先， strip 移除符号表。 gcc -s hello.c -o hello2

step2
  开启优化 gcc -s -O3 hello.c -o hello3
  size: 14512

step3:
  移除启动文件
  https://stackoverflow.com/questions/5422831/what-is-the-difference-between-using-exit-exit-in-a-conventional-linux-fo
  size: 13664

step4:
  移除标准库

  https://github.com/torvalds/linux/blob/v3.13/arch/x86/syscalls/syscall_64.tbl

  https://www.briansteffens.com/introduction-to-64-bit-assembly/01-hello-world/

  https://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/

  inline assembly: https://www.ibiblio.org/gferg/ldp/GCC-Inline-Assembly-HOWTO.html

  x64 assembly: https://cs.brown.edu/courses/cs033/docs/guides/x64_cheatsheet.pdf

  size: 12912

step5: 链接脚本
  size: 584

step6: nasm
  size: 440

step7: handmade elf
  https://elfy.io/
  size: 170

  elf header: 64
  program header: 56

```
```


