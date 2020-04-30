---
title: 编写第一个 Sublime 插件 —— BuildX
date: 2020-04-22T17:04:40+08:00
draft: true
---

Sublime

1. Sublime / Vim

2. Hello World Sublime 插件

3. Sulbime 插件系统介绍

4. Sublime Build System

3. 定义 BuildX

1. 监听事件
2. 监听 panel 内容更新
3. 创建 target view
4. 将 panel 内容复制到 target view
5. 定义一个简单的 syntax
6. 监听 selection 变化
7. 修改 target view 的 selection

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
