---
title: 用 C 实现一个 CHIP-8 模拟器
date: 2020-06-07T17:17:58+08:00
cover: http://asset.cjting.cn/FrxGU8-3EO8dEfXB-zxLk_L3b4pK.png
tags: [chip8, emulator, c]
---

很早之前我就想写一个 GBA 模拟器，因为小时候的 GBA 游戏给我留下了深刻的印象。

口袋妖怪、孤岛求生、牧场物语这些 GBA 的经典游戏，在那个时候还玩着小霸王的我眼中，无异于打开了新世界的大门，原来游戏可以这样的有趣。

因为对 GBA 的喜欢，所以有了编写一个 GBA 模拟器的想法。看过一些资料以后，我决定从最简单的 CHIP-8 开始练手。CHIP-8 是一个功能完整的平台，可以运行多个游戏，同时它的设计又非常简单，很适合新手入门。

<!--more-->

## CHIP-8

我们先来简单了解一下 CHIP-8。

[CHIP-8](https://en.wikipedia.org/wiki/CHIP-8) 是 70 年代中期由 Joseph Weisbecker 发明的一个虚拟机，发明的初衷是为了让编写电子游戏更加方便。

任何一个虚拟机都离不开这几样：指令集、寄存器、内存、输入、输出。

CHIP-8 的指令集含有 35 条指令，每个指令长度固定为 2 个字节。

CHIP-8 一共可以访问 4KB 的内存，地址从 `0x000 ~ 0xfff`，这里面有一些地址是保留给内部使用的。

CHIP-8 有 16 个 8-bit 的寄存器，记做 `V0` ~ `VF`。

输入方面 CHIP-8 有一个 16 键的键盘，布局如下：

```text
1 2 3 C
4 5 6 D
7 8 9 E
A 0 B F
```

指令集中有相关指令可以查询某个键是否被按下了。

CHIP-8 有一个 64x32 像素的屏幕用于输出画面，每个像素只有一个 bit，也就是只能显示两种颜色，0 为黑色 1 为白色，和大部分绘图系统一样，左上角的坐标为 (0, 0)。

CHIP-8 的绘图指令非常简单，指定了三个参数，`x`, `y` 以及 `n`。绘图的流程是从内存中读取 n 个字节，每个字节为一行，从 (x, y) 开始与原有的像素进行 xor 运算。

同时，CHIP-8 内置了一套字体 Bitmap (Font Sprite) 用于绘制 0 ~ F 这 16 个字符。每个字符的分辨率为 4x5，占用 5 个字节，每个字节只有高四位存储了数据，低四位没有用上。

除了绘图以外，CHIP-8 也可以输出非常简单的声音。CHIP-8 有两个 8-bit 定时器，分别是 delay timer 和 sound timer，它们都按照 60hz 的频率递减直到减为 0。

其中 sound timer 用来控制 CHIP-8 发出声音。当 sound timer 不为 0 的时候，CHIP-8 会发出一个声音，具体的声音由实现来定。

我们的目标是编写一个 CHIP-8 模拟器在我们的系统上来模拟 CHIP-8 虚拟机，从而可以运行 CHIP-8 程序，

最终完成时的效果如下，图中在运行的程序是俄罗斯方块。

![](http://asset.cjting.cn/FtbhROUInp7O-OOHurKuK6fVQ7VK.png)

## Spec

上面只是简单介绍了一下 CHIP-8，如果要着手编写模拟器，我们需要更加详细的 Spec，以下是我主要参考的两个资料：

- [CHIP-8 Technical Reference](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM)
- [CHIP‐8 Instruction Set](https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Instruction-Set)

第一个资料比较全面系统地阐述了 CHIP-8 的各个方面。

第二个资料主要是指令集的部分，它的排版看起来更加友好。

在这两个资料的基础上，再通过 Google 厘清一些细节问题，最终我用来开发模拟器的 Spec 如下：

- 内存为 4K
  - `0x0 ~ 0x1ff`: 内部保留
  - `0x200 ~ 0xe9f`: 程序可以自由使用
  - `0xea0 ~ 0xeff`: 保留给栈以及其他内部应用
  - `0xf00 ~ 0xfff`: 保留给屏幕显示使用
- 64x32 分辨率的显示屏，每个像素占用 1 bit，一共 256 个字节，对应内存地址为 `0xf00 ~ 0xfff`
- Font Sprite 的数据存储在 `0x0` ，一共 16 个字符 80 个字节，具体数据上面的资料中有
- 两个 8-bit 的定时器，一个 delay timer 一个 sound timer，按照 60hz 的频率递减直到 0
- 16 个 8-bit 的通用寄存器 `V0` ~ `VF`
- 一个 16-bit 的程序计数器 `PC`
- 一个 8-bit 的栈寄存器 `SP`，指向当前栈的顶端
- 栈起始地址为 `0xea0`，往上递增，可以存储 16 个 16-bit 的值，每个值是一个返回地址，用于实现函数调用
- 一个 16-bit 的地址寄存器 `I`
- 35 条指令，每条指定固定为 2 个字节，这里是 [指令列表](https://github.com/mattmikolay/chip-8/wiki/CHIP%E2%80%908-Instruction-Set)
  - `8XYE`: 这里的英文容易误解，`VF` 存储的是移位之前的 `VX` 而不是 `VY`
  - `8XY6`: 同上
  - `FX55`: 根据测试发现，不需要增加 `I` 寄存器
  - `FX65`: 同上
- 键盘按照如下方式映射
    ```text
    1 2 3 C        1 2 3 4
    4 5 6 D   ->   Q W E R
    7 8 9 E        A S D F
    A 0 B F        Z X C V
    ```

## Design

有了 Spec，接下来就是考虑怎么实现了。

因为 CHIP-8 涉及到屏幕显示和声音，选择实现技术其实就是选择怎样处理输入输出，我能想到如下几个选项：

- 使用终端，使用不同的字符来表示白色和黑色，使用终端的 beep 来发出声音
- 使用平台 Native 技术
- 使用跨平台的库比如 SDL
- 使用浏览器

考虑到我练手的目的是为了以后编写更加复杂的 GBA 模拟器，所以 SDL 自然就是最好的选择了，可以简单跨平台的同时又提供强大的能力。语言方面我选择直接使用 C，不用其他的 Binding 了，我喜欢 C 的操控感。

输入方面，使用 SDL 的事件我们可以很轻松的获取到键盘信息。

```c
SDL_Event e;
while(SDL_PollEvent(&e)) {
  if(e.type == SDL_KEYDOWN) {
    switch(e.key.keysym.sym) {
      case SDLK_1:
        ...
    }
  }
}
```

显示方面，我们可以先创建一个 Texture，然后直接写入像素数据到 Texture 中。

```c
void *rawPixels;
int pitch;
SDL_LockTexture(screenTexture, NULL, &rawPixels, &pitch);

u32(*pixels)[pitch / 4] = rawPixels;

for(int y = 0; y < 64; y++) {
  for(int x = 0; x < 32; x++) {
    pixels[y][x] =  ...
  }
}

SDL_UnlockTexture(screenTexture);
```

声音方面，可以通过 `SDL_QueueAudio` 函数来播放一段声音。

```c
float *buf = malloc(bufLength)

for(int i = 0; i < sampleCount; i++) {
  buf[i] = ...
}

SDL_QueueAudio(audioDevice, buf, bufLength);
```

## The Last

编写好以后，我们可以使用如下两个 ROM 来简单测试我们的模拟器：

- [BC Test](https://github.com/cj1128/chip8-emulator/blob/master/rom/BC_test.ch8)
- [Test Opcode](https://github.com/cj1128/chip8-emulator/blob/master/rom/test_opcode.ch8)

如果一切正常，运行以后屏幕上会有相应的提示。

最后，有一些细节问题可能并不怎么被提及，但是在开发中很重要。

- 一定要记得使用 `SDL_Delay` 让出 CPU 时间，否则你的模拟器会占用太多的 CPU
- 使用 `VSYNC` 来阻止 Screen Tearing
- 显示器刷新一般是 60hz，所以屏幕更新调用应该也是 60hz
- 模拟器运行速度可以使用参数控制，我测试下来 1000hz 体验很流畅
- 绘图的时候注意 Clipping，否则很容易导致 Segmentation Fault

以下两个仓库分别是 Go 和 C++ 的实现，当某个 feature 没有头绪时，可以用来参考，Go 的实现比较完整，C++ 的实现相对粗糙一些。

- Go: https://github.com/massung/CHIP-8
- C++: https://code.austinmorlan.com/austin/chip8-emulator

最终我的 C 实现代码在这里 [chip8-emulator](https://github.com/cj1128/chip8-emulator)。

CHIP-8 是一个非常好的练手项目，需要阅读手册，查阅资料，理解虚拟机的工作原理，读取键盘输入并输出声音图像，完成以后还可以用来玩很多游戏~ 祝大家 Happy Coding 🎉
