# CJ's Blog

[我的个人博客](http://cjting.me)源代码，托管在 [GitHub Pages](https://pages.github.com/)，使用 Hugo 作为模板引擎。

## Gitalk

评论系统使用 `gittalk`，Webpack 打包引入存在 bug，因此采用直接引入方式，相关 [issue](https://github.com/gitalk/gitalk/issues/90)。

- Gitalk 根据 Issue 的 Label 来标识 Issue，所以，每个 Issue 都会携带一个和 ID 值一样的 label
