---
title: "Write a Sublime Plugin"
date: 2020-04-22T17:04:40+08:00
draft: true
---

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
