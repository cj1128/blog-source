---
date: 2017-06-04T15:46:33+08:00
title: 从 Jekyll 迁移到 Hugo，Hugo 不完全指南
tags: [hugo, golang, ssg]
cover: /image/FlKmTvbJZO1j12pQzImT2EbtVgac.jpeg
aliases:
  - /golang/migrate-to-hugo-from-jekyll/
---
最近这段时间一直在忙着迁移博客，把原本基于 Jekyll 的博客迁移到了 Hugo 上。

之所以从 Jekyll 迁移的原因并不复杂，就是一个字：**慢**。Jekyll 的速度实在是太慢了，我只有几十篇文章，在 Watch 模式下，每次改动，重新生成都要花费 3 秒钟，实在是太慢了。

```bash
Regenerating: 1 file(s) changed at 2017-05-14 10:37:16 ...done in 3.085089 seconds.
Regenerating: 1 file(s) changed at 2017-05-14 10:37:20 ...done in 3.121783 seconds.
```

<!--more-->

我的机器是 i7 的 CPU，16G 的内存外加 256G 的 SSD。如此强的配置，如此简单的操作，竟然花费了 3 秒钟，我不知道这是 Ruby 的原因还是和 Jekyll 本身的实现有关系，我也不关心了。慢成这样，我只能换掉它了。

这里要插一句，如果你的 Jekyll 站点中使用了 npm 来管理 JS 依赖，一定要记得配置 Jekyll 让它忽略 `node_modules` 文件夹，否则会慢到你怀疑人生。

## 静态站点生成器

Jekyll 是目前最为流行的静态站点生成器 (Static Site Generator，后面简称为 SSG)，流行的原因我想一大半归功于 GitHub 的推广，Jekyll 是 GitHub Pages 默认的 SSG。

在我看来，SSG 是一个十分有用的东西，因为它可以帮助我们快速生成静态网站。静态网站有很多优点，最为关键的是：

1. 开发部署维护简单，省时省力，精力可以专注在内容上。
2. 访问速度快，还有什么比直接返回已经渲染好的网页更快的呢？

并不是每一个网站都需要一个 Server 来动态生成内容，也不是每一个网站都需要数据库。博客系统，文档系统，企业官网等等，都是静态网站的好用例。

SSG 简单来说，就是根据配置和内容，生成静态网站。配置一般由全局配置，模板，以及 `FrontMatter` 构成。

FrontMatter 指的是文章最前面的一段区域，一般由 `---` 分开，我们可以在这段区域中添加这篇文章携带的数据，数据格式一般是 YAML，如下所示。

```markdown
---
name: CJ
date: 2017-06-09T11:01:08+08:00
---
从这里开始是正文的内容。
```

后续在模板中，我们可以将这些数据读取出来做一些操作，比如，所有 `name` 属性为 `CJ` 的文章我们可以添加特别的 class 进行高亮，这就大大增加了渲染的灵活性。

目前，最为流行的 SSG 是 [Jekyll]，[Hugo]，[Hexo] 这三个，不太流行的数不胜数，具体可以去看 [Static Gen] 网站。

不管是什么型号，工作原理都是一样的，掌握了一个，剩下的学习起来也很容易。鉴于我对 Golang 的喜爱，简单了解 Hugo 以后，就选择使用 Hugo 作为新的博客引擎了。

Hugo 的优点很多，最为重要的自然是：**快**。相比于 Jekyll 要花费 3 秒钟，我的博客在 Hugo 下重新生成只要花费 30ms，足足快了 100 倍。

下面，我们使用 Hugo 来做一个简单的博客系统 (My Blog)，了解一下 Hugo 的基本使用，最终项目在 [hugo-demo] 仓库中。

## 安装

首先，自然是安装 Hugo，如果你是 Mac,`brew install hugo`。

如果你安装了 Go，`go get -u github.com/spf13/hugo`。

其他情况，可以直接去 [Hugo Release] 页面，下载对应平台的二进制程序即可。

## 骨架

我们先使用 Hugo 生成我们的博客站点。

```bash
# hugo 支持多种配置格式，默认为 toml，使用 `-f` 来修改
hugo new site -f yaml my-blog 
tree my-blog
my-blog
├── archetypes
├── config.yaml
├── content
├── data
├── layouts
├── static
└── themes

6 directories, 1 file
```

一共六个文件夹，外加一个全局配置文件 `config.yaml`。

- `archetypes`：给不同的类型定义默认 FrontMatter，一般用不上
- `content`：源文件
- `data`：数据文件，一般也用不上
- `layouts`：模板
- `static`：静态资源，也就是不需要 Hugo 处理的静态资源，比如图片等
- `themes`：第三方主题，将第三方主题拷贝到这个文件夹下即可使用

比较常用的就是 content 和 layouts，一个存放内容，一个存放模板。

Hugo 使用的模板为 Go 标准库中的 `text/template`，和所有其他模板系统一样，看看文档 [Go Template Primer] 掌握基本函数即可。

`config.yaml` 中是全局配置，默认情况下，文章的 FrontMatter 数据格式为 TOML，我们将其改为 YAML，添加如下配置到 `config.yaml` 中。

```yaml
metaDataFormat: yaml
```

## 内容

在 Hugo 中，所有的内容存放在 `content` 目录中，其中每一个目录称为一个 `section`，我们先来生成一些内容用于后面测试我们的模板。

假设我们博客有两个分类，`c1` 和 `c2`，每个分类下有 1 篇文章。

```bash
# 使用 `hugo new` 指令来生成文章
# 会自动替我们添加必需的 FrontMatter，比如 `date` 和 `title`
# `hugo new` 指令会自动添加 `content` 路径前缀
hugo new c1/_index.md
echo "# this is c1" >> content/c1/_index.md
hugo new c1/p1.md
echo "# this is post 1 for cat 1" >> content/c1/p1.md
hugo new c2/_index.md
echo "# this is c2" >> content/c2/_index.md
hugo new c2/p1.md
echo "# this is post 1 for cat 2" >> content/c2/p1.md
```

在 Hugo 中，一切东西都是 `Page`（页面），而每一个页面都对应一个源文件。比如，当我们访问 `/c1/` 时，对应的源文件是 `content/c1/_index.md`，当我们访问 `/c1/p1/` 时，对应的源文件则是 `content/c1/p1.md`。

## 模板

现在，我们可以启动 Hugo 开发服务器来预览我们的站点了。

```bash
# 默认生成的文章都有 `draft: true` 属性，表示文章为草稿，Hugo 默认情况下忽略 drafts
# `--buildDrafts` 告诉 Hugo 我们要渲染 Drafts
hugo server --buildDrafts
```

打开 1313 端口，我们会看到，什么都没有，嗯，这就对了。

为什么什么都没有呢，因为到目前为止，我们什么模板都没有编写，Hugo 要是能展现内容，那就奇怪了。

这里提一下，别的教程可能都会让新手直接安装 Hugo 的某个主题，主题是别人写好的模板系统封装起来了。我觉得掌握 Hugo 的一个关键就是要弄清楚它的模板系统，因此，这里我们不使用任何主题，自己来编写每一个模板。

在 Hugo 的模板系统中，页面分为两种类型，第一是列表型页面，这种页面对应的源文件是某个目录的 `_index.md`，比如，当我们访问 `/c1/` 时，Hugo 默认会使用 `list.html` 模板来渲染 `content/c1/_index.md` 文件。

还有一种就是单纯的内容页面，这种页面对应的源文件是某个目录的普通文件。比如，当我们访问 `/c1/p1/` 时，Hugo 默认会使用 `single.html` 模板来渲染 `content/c1/p1.md` 文件。

首页比较特殊，使用的模板名叫做 `index.html`。除此之外，我们还可以定义一个叫做 `baseof.html` 的模板，看名字就知道了，它是根模板。

Hugo 的模板全部存放在 `layouts` 目录中，默认模板存放在 `_default` 文件夹中。每一个源文件可以通过 FrontMatter 来指定使用什么模板，如果不指定就使用默认模板。渲染模板时，都会自动绑定源文件对应的 `Page` 变量，我们可以通过这个变量获取我们需要的信息。

先来编写 `baseof.html` 模板，新建 `layouts/_default/baseof.html` 文件。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Blog</title>
</head>
<body>
{{ block "main" . }}
{{ end }}
</body>
</html>
```

Hugo 的模板有一个叫做 `block` 的机制，具体见 [Hugo Block]，简单来说，父模板可以定义渲染什么 block，然后子模板中可以定义 block 的内容。

接下来编写 `index.html`，新建 `layouts/index.html` 文件。

```html
{{ define "main" }}
  {{ .Content }}
{{ end }}
```

首页的模板首先定义 `baseof.html` 中渲染的 `main` block，然后直接渲染 Page 变量的 `Content` 属性，也就是对应的源文件的内容。

首页对应的源文件是 `content/_index.md`，我们来创建这个文件。

```bash
hugo new _index.md
echo "# This is index page" >> content/_index.md
```

回到浏览器，可以看到页面自动刷新了。

> git checkout skeleton

![](/image/9b85365dgy1fgesi9dqzwj20lz0ay0ss.jpg)

这里来梳理一下，当 Hugo 编译我们站点时，发现 `content/_index.md` 文件，Hugo 会使用 `layouts/index.html` 和 `layouts/_default/baseof.html` 模板来渲染这个文件，并将得到的 HTML 文件放在结果文件夹的根目录下，当我们访问首页时，就会看到这个文件。

现在，我们要规划一下博客的结构，然后一一实现。

- 首页和分类页都需要一个顶部导航栏，显示所有的分类，点击跳转到对应的分类页。
- 分类页根据时间列出所有的博文，点击跳转到对应的博文页。
- 博文页展示博文内容。

## 导航栏

由于首页和分类页都要用到导航栏，所以我们使用 Hugo 的 `Partial` 来做，Partial 简单来说，就是一个片段，可以在不同的模板中引用它。

我们打算直接将 `content` 目录中的子目录（叫做 `section`）作为分类，首先，在全局配置中添加如下配置。

```yaml
SectionPagesMenu: main
```

Hugo 提供了一套复杂的菜单系统，这个配置告诉 Hugo，将所有的 section 都放入 `main` 这个菜单中，在模板中通过遍历 main 菜单，便可以渲染出所有的分类。

新建文件，`layouts/partials/header.html`。

```html
<header>
  <nav>
    {{ range .Site.Menus.main }}
      <a class="{{if eq $.URL .URL}}active{{end}}" href="{{ .URL }}">
        {{ .Name }}
      </a>
    {{ end }}
  </nav>
</header>
```

先把这个应用到首页上看看，编辑文件 `layouts/index.html`。

```html
{{ define "main" }}
  <main>
    {{ partial "header" . }}
    <article>
      {{ .Content }}
    </article>
  </main>
{{ end }}
```

浏览器页面如下。

![](/image/9b85365dgy1fgeslx5j0ij20ly0bgglo.jpg)

看起来，header 生效了，但是，为什么两个分类的名称叫做 `_index` 呢？这是因为，默认情况下，Hugo 会使用分类对应的源文件的 `title`属性，这个属性默认是文件名。

编辑 `content/c1/_index.md` 文件和 `content/c2/_index.md` 文件的 `title` 属性，改为 `分类1` 和 `分类2`，这次就正确了。

## 分类页

点击这两个分类，发现内容是空白的，当然，分类页用的模板是 `list.html`，我们还没有编写。

新建 `layouts/_default/list.html` 文件。

```html
{{ define "main" }}
  {{ partial "header" . }}
  <div class="list">
    {{ range .Data.Pages.GroupByDate "2006-01" }}
      <div class="list__item">
        <h3 class="list__title">{{ .Key }}</h3>
        <ul>
          {{ range .Pages }}
            <li class="list__post">
              <span></span>
              <a href="{{ .Permalink }}">{{ .Title }}</a>
              <div>{{ .Date.Format "2006.01.02" }}</div>
            </li>
          {{ end }}
        </ul>
      </div>
    {{ end }}
  </div>
{{ end }}
```

模板代码的含义是根据日期和时间来渲染分类下的博文，效果如下。

![](/image/9b85365dgy1fgetkmelx0j20nl0azq30.jpg)

## 博文页

最后，便是展示单篇博文的博文页，使用的模板是 `single.html`，新建文件 `layouts/_default/single.html` 如下。

```html
{{ define "main" }}
  <article>
    {{ .Content }}
  </article>
{{ end }}
```

很简单，直接渲染博文内容，`http://localhost:1313/c1/p1/` 页面如下。

![](/image/9b85365dgy1fgetqxr6fhj20nl078mx4.jpg)

目前为止，我们的博客基本结构就搭建好了。

> git checkout basic

## CSS，JS 及其他静态资源

现在剩下的工作便是使用 CSS 来美化我们的博客了。

Hugo 根目录中的 `static` 目录用于存储各种静态文件，包括 CSS 和 JS，里面的内容在 Hugo 生成站点时会被原封不动拷贝到目标目录中（默认是 public）。

新建 `static/main.css` 文件，修改 `layouts/_default/baseof.html` 基础模板引入这个文件。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Blog</title>
  <link rel="stylesheet" type="text/css" href="/main.css">
</head>
<body>
{{ block "main" . }}
{{ end }}
</body>
</html>
```

引入 JS 的道理同上。至于具体的样式代码，这里就不再赘述了。最终效果如下。

![](/image/9b85365dgy1fgfz1ofshej20sj0e33ys.jpg)

> git checkout final

## 发布

最后一步便是发布，在项目根目录下运行 `hugo` 就可以将站点生成在 `public`文件夹中，丢给 Nginx 或者传到 Github 上随便你了。

Hugo 官方有一篇文档 [Hosting on GitHub Pages] 说明如何部署在 GitHub 上，说的很详细，这里就不再赘述了。

最后，Hugo 确实是一个非常好用的 SSG，拥有速度快，模板灵活，结构清晰等各种优点，如果大家有兴趣，下一个静态站点项目可以试试用 Hugo 来构建。当然，再好的工具也不能解决人的懒惰，我要加油坚持写博客了~😉

[Hugo]: https://github.com/spf13/hugo
[Hugo Release]: https://github.com/spf13/hugo/releases
[Hugo Block]: https://gohugo.io/templates/blocks/
[Hugo Template]: https://gohugo.io/templates/overview/
[Static Gen]: https://www.staticgen.com/
[Go Template Primer]: https://gohugo.io/templates/go-templates/
[Hosting on GitHub Pages]: https://gohugo.io/tutorials/github-pages-blog#building-and-deployment
[hugo-demo]: https://github.com/cj1128/hugo-demo
[Jekyll]: https://jekyllrb.com/
[Hexo]: https://hexo.io/
