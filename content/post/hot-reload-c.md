---
title: "热重载 C"
created_date: 2021-04-25T21:27:10+08:00
date: 2021-06-10T23:10:10+08:00
cover: http://asset.cjting.cn/Fkc6gm7qyhWpzfzhPpDqHwDtO2ML.png
tags: [c, linker, ld]
aliases:
  - /hot-reload-c/
---

热重载是一个非常好用的功能，可以在不重启的情况下更新应用，从而大大提高开发效率。

前端的 Wepback，后端的 Ruby/Python/Elixir，移动端的 Flutter 都有热重载，属于用过以后就回不去的 Killer Feature。

在我之前的认识中，一直认为只有脚本语言才可以支持热重载，因为虚拟机让热重载的实现变得非常简单，重新运行代码即可。

直到有一天，Casey 在 [HandmadeHero](https://handmadehero.org/) 项目中用非常少的代码演示了怎样热重载 C，我才恍然大悟，编译语言一样可以热重载。

<!--more-->

## Showtime

我们先来看看，最后的效果如何。

<video controls>
  <source src="http://asset.cjting.cn/FrUTcH3rMiOk_2TaWamOutbVvWgs.mp4" type="video/mp4">
</video>

这里我用 SDL 打开了一个窗口进行绘制，通过热重载，我们可以在不重启程序的情况下修改绘图代码并查看效果。

相比于传统的修改、编译、运行，热重载有两个核心优势，特别是在游戏开发中。

第一是提高效率，游戏开发过程中经常需要调试一些参数，如果每次调整都需要重新编译运行的话，很繁琐也很耽误时间。

第二是可以保持状态，比如我现在要调整某个怪物的攻击行为，但是这个怪物在第 10 个房间，通过热重载，我可以直接重载怪物行为的相关代码，但是如果编译重新运行，每次我都需要先跑到第 10 个房间。

那么目前流行的游戏引擎是怎么解决这些问题的？一般来说是通过嵌入一个虚拟机，比如 JS 或者 Lua。游戏引擎的核心部分是 C/C++，逻辑部分使用脚本语言来编写从而实现热重载。

回到正题，热重载 C 是怎样实现的？为什么一个编译语言可以热重载？

这里的核心是**动态链接**。

## Dynamic Linking

使用 Windows 的同学肯定对 `.DLL` 文件不陌生，它们其实就是动态链接库。在 Mac 和 Linux 上，动态链接库的后缀分别是 `.dylib` 和 `.so`。

有动态链接库，自然也有静态链接库，他们对应的是两种链接方式：动态链接和静态链接。

两种链接的区别简单来说如下：

- 静态链接在链接时会将库拷贝进可执行程序中，可执行程序不再依赖任何外部文件。

- 而动态链接会在程序运行时动态去查找并链接库。

也就是说，动态链接的程序是对外部有依赖的，如果相关的库不存在，程序就无法执行。

总结一下

- 静态链接无依赖，自包含，体积大。
- 动态链接有依赖，运行时需要加载外部文件，体积小。

考虑到目前存储技术的发展，文件大小早就是一个无关紧要的事情了，那么动态链接还有必要吗？

### Why

我们先来看看为什么发明了动态链接，只是为了节省文件体积吗？

发明动态链接其实是一个很自然的过程。

当我们的代码很多地方都有相同的逻辑时，很自然地我们会将它抽象为一个函数，避免每个地方都写一份。

同样的道理，如果很多程序都依赖某些功能，那么很自然地会想着把它们抽离出来，避免每个程序都包含一份。

这个想法的结果就是动态链接，思路是将链接推迟到运行时，程序文件中不再包含库代码。

除了节省体积以外，动态链接还有如下的好处

首先是**更新方便**。

如果动态链接库更新了，那么所有使用它的程序无需重新编译就可以用上新功能。

这一点其实非常重要，基本上所有的 C 程序都依赖 glibc，想象一下如果 glibc 出现了安全漏洞，在动态链接下，我们要做的就是升级系统的 glibc。如果是静态链接，那么所有安装的程序都要重新编译。

其次是**程序更加灵活**。

上面的热加载例子就已经足够说明问题，我们可以将某个功能编译为动态链接库，从而在不影响主程序的情况下修改这部分逻辑。

这个特性十分适合于编写「插件系统」，主程序在运行时检测相关的动态链接库是否存在，如果存在就加载使用，不存在也没关系。

就像游戏的本体和 DLC 一样，如果购买了 DLC 就可以享受 DLC 内容，不购买也不影响游戏本体的游玩。

谈完了优点，那么动态链接的缺点呢？

优点的背后也就是缺点，对外部的依赖意味着如果动态链接库如果不存在或者不兼容，我们的程序也将无法运行，也就是多了一份隐患。

这在早期的 Windows 中很常见，系统升级以后 DLL 的兼容性被破坏，导致很多程序无法运行，如果是静态链接就不会有这个问题。

除此之外，动态链接会引入一些性能开销，在性能上比静态链接差 5% 左右。

工程是权衡的艺术，不同的场景不同的需求下有不同的考量。

比如，Go 的作者就认为静态链接更适合 Go 的用途，因此 Go 默认是静态链接的。

[Shared libraries are not a good thing in general](https://lore.kernel.org/lkml/CAHk-=whs8QZf3YnifdLv57+FhBi5_WeNTG1B-suOES=RcUSmQg@mail.gmail.com/) 是 Linus Torvalds 对动态链接库的一些看法，很显然，是负面的看法🙈。

### How

我们来梳理一下动态链接的大致工作原理，囿于篇幅具体细节就不讨论了。

先来编写一个简单的程序 main 动态链接到 foo。

```c
// main.c
#include <stdio.h>

void foo(void);

int main(void) {
  printf("this is main\n");
  foo();
  return 0;
}
```

```c
// foo.c
#include <stdio.h>

void foo(void) {
  printf("this is foo\n");
}
```

```bash
# 编译 foo 为动态链接库
$ gcc -shared foo.c -o foo
# 编译 main
$ gcc main.c ./foo.so -o main.out
# 查看 main.out 依赖的动态链接库
$ ldd main.out
  linux-vdso.so.1 (0x00007fffdb8c3000)
  ./foo.so (0x00007fd913946000)
  libc.so.6 => /usr/lib/libc.so.6 (0x00007fd91375a000)
  /lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007fd913952000)
# 运行 main.out
$ ./main.out
this is main
this is foo
```

可以看到程序运行一切正常。

使用 `ldd` 可以得到程序依赖的动态链接库列表，可以看到 main 确实依赖了 `./foo.so`。

为了从流程上理解动态链接，我们来思考如下几个问题：

1. 是谁在负责动态链接？

答案是动态链接器，也就是 ldd 输出中的 `/lib64/ld-linux-x86-64.so.2`。

对于动态链接的程序，ELF 文件中的 `.interp` 段记载了动态链接器的绝对路径，当程序装载时，会将动态链接器一并装载。

```bash
# 查看 .interp 段的内容
$ objdump -s -j .interp main.out
main.out:     file format elf64-x86-64

Contents of section .interp:
 0318 2f6c6962 36342f6c 642d6c69 6e75782d  /lib64/ld-linux-
 0328 7838362d 36342e73 6f2e3200           x86-64.so.2.
 ```

普通程序装载好以后，CPU 会跳转到程序的入口地址，但是对于动态链接程序，CPU 会先跳转到动态链接器的入口，由动态链接器完成链接工作以后，再跳转到程序入口。

2. 动态链接器怎么知道要链接哪些库？

程序依赖的动态链接库存储在 `.dynamic` 段中。

```bash
$ readelf -d main.out
Dynamic section at offset 0x2de8 contains 27 entries:
  Tag        Type                         Name/Value
 0x0000000000000001 (NEEDED)             Shared library: [./foo.so]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 ...
```

`.dynamic` 段中存储动态链接的相关信息，其中 `Type=NEEDED` 表示程序依赖的动态链接库。

可以看到，`main.out` 依赖了两个动态链接库，一个是 `./foo.so`，还有一个是 `libc.so.6`。

3. 动态链接器如何确定库的位置？

`./foo.so` 是一个路径，这个好办，直接查找就行。但是对于 `libc.so.6` 这样一个库，动态链接器如何定位出它的具体位置？

和 Shell 查找可执行程序一样，ld 有一个预定义的目录，当共享库只有名字时，会去这些目录中进行查找，一般是 /usr/lib 和 /lib。

{{% tip %}}

真实的查找机制其实更为复杂，还有如下因子在发挥作用

- `LD_LIBRARY_PATH` 环境变量
- `rpath` 设置
- `/etc/ld.so.conf` 配置文件

这些都会影响查找过程，具体可以参考 ld 的手册。

{{% /tip %}}

### Explicit Run-time Linking

上面我们说的动态链接发生在程序的启动期间，要链接哪些库程序的 ELF 文件中都记录好了，动态链接库根据记录一一链接，完毕以后程序开始运行。

动态链接的本质是**将链接推迟到运行时去做**，不一定非要是启动的时候，程序运行的时候再去链接某个库自然也是没有问题的。

这种情况叫做「显示运行时链接」，启动时链接由动态链接器完成，运行时链接我们通过如下四个函数完成，他们也是实现热重载 C 的核心。

- `dlopen`: 打开某个库
- `dlsym`: 查找库中的符号，主要就是函数，获得函数地址以后我们就可以调用了
- `dlclose`: 关闭某个库
- `dlerror`: 上述过程中如果出错了，调用这个函数获取错误信息

这些函数声明在 `dlfcn.h` 中，具体实现在 `libdl` 中，我们可以通过一个小例子来体会一下。

```c
// dlopen.c
// usage: ./dlopen <libm path>

#include <stdio.h>
#include <dlfcn.h>

typedef double sin_func(double);

int
main(int argc, char *argv[])
{
  char *err;

  if(argc < 2) {
    printf("usage: ./dlopen <libm path>\n");
    return 1;
  }

  void *handle = dlopen(argv[1], RTLD_NOW);
  if(handle == NULL) {
    printf("dlopen error: %s\n", dlerror());
    return 1;
  }

  sin_func *sin = (sin_func *)dlsym(handle, "sin");
  if(sin == NULL) {
    printf("dlsym error: %s\n", dlerror());
    return 1;
  }

  printf("%f\n", sin(3.1415926 / 2));
  return 0;
}
```

`gcc dlopen.c -ldl -o dlopen` 编译上面的程序，程序的功能是运行时打开 libm 库然后运行里面的 `sin` 函数，如果找不到 libm 程序报错退出。

这里的逻辑可以很灵活，比如找不到 `libm` 就运行我们自己实现的 sin 等。

最后，[hot-reload-c](https://github.com/cj1128/hot-reload-c) 是上面 Demo 的源码，可以在 Mac 和 Linux 下编译运行。知道了核心原理，再去写这样一个程序就很简单了，建议大家自己动手去试试~

