# CJ Ting's Blog

[博客](http://cjting.me)源代码，使用Hugo作为模板引擎。

## 开发

开发需要使用[forego](https://github.com/ddollar/forego)来同时运行多个常驻进程，包括，Hugo，Stylus以及Webpack。

```bash
# 安装forego
go get github.com/ddollary/forego
# 启动开发
make dev
```

## 发布

```bash
make deploy
```


