import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import remarkMath from "remark-math"
import rehypeMathjax from "rehype-mathjax/chtml"
// import remarkToc from 'remark-toc'
import vue from "@astrojs/vue"

// https://astro.build/config
export default defineConfig({
  site: "https://cjting.me",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [
        rehypeMathjax,
        {
          chtml: {
            fontURL:
              "https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2",
            scale: 1.2,
          },
        },
      ],
    ],
  },
  redirects: {
    "/index.xml": "/rss.xml",

    "/hot-reload-c": "/2021/06/10/hot-reload-c",

    "/the-missing-div-instruction-part1/":
      "/2021/03/16/the-missing-div-instruction-part1",

    "/web2.0/dns-101/": "/2018/05/01/dns-101",

    "/web2.0/how-http-basic-auth-work/": "/2018/03/31/how-http-basic-auth-work",

    "/misc/forward-proxy-and-reverse-proxy/":
      "/2018/08/11/forward-proxy-and-reverse-proxy",

    "/web2.0/intruduction-to-functional-reactive-programming/":
      "/2016/03/20/intruduction-to-functional-reactive-programming",

    "/golang/migrate-to-hugo-from-jekyll/":
      "/2017/06/04/migrate-to-hugo-from-jekyll",

    "/misc/how-git-generate-diff/": "/2017/05/13/how-git-generate-diff",

    "/misc/2017-03-12-使用Prometheus监控服务器性能.html":
      "/2017/03/12/use-prometheus-to-monitor-server",
    "/linux/use-prometheus-to-monitor-server/":
      "/2017/03/12/use-prometheus-to-monitor-server",

    "/golang/2017-02-18-使用Go编写代码明信片生成器.html":
      "/2017/02/18/write-a-code-post-generator-with-go",
    "/golang/write-a-code-post-generator-with-go/":
      "/2017/02/18/write-a-code-post-generator-with-go",

    "/web2.0/build-an-img-bed-on-qiniu/":
      "/2017/01/23/build-an-img-bed-on-qiniu",

    "/golang/2016-11-14-使用pprof优化golang性能.html":
      "/2016/11/14/use-pprof-to-optimize-go",
    "/golang/use-pprof-to-optimize-go/": "/2016/11/14/use-pprof-to-optimize-go",

    "/web2.0/make-loading-animation-with-svg-morphing/":
      "/2016/11/07/make-loading-animation-with-svg-morphing",

    "/misc/2016-10-21-从零开始搭建一个ELKB日志收集系统.html":
      "/2016/10/21/build-log-system-with-elkb",
    "/misc/build-log-system-with-elkb/":
      "/2016/10/21/build-log-system-with-elkb",

    "/web2.0/2016-09-05-从零开始搭建一个HTTPS网站.html":
      "/2016/09/05/build-a-https-site-from-scratch",
    "/web2.0/build-a-https-site-from-scratch/":
      "/2016/09/05/build-a-https-site-from-scratch",

    "/misc/use-dnsmasq-to-build-own-dns-server/":
      "/2016/08/20/use-dnsmasq-to-build-own-dns-server",

    "/misc/2016-05-21-使用Ngrok实现内网穿透.html": "/2016/05/21/ngrok-tutorial",
    "/misc/ngrok-tutorial/": "/2016/05/21/ngrok-tutorial",

    "/web2.0/first-chrome-extension-image-bed-on-weibo/":
      "/2016/04/06/first-chrome-extension-image-bed-on-weibo",

    "/misc/underhanded-c/": "/2015/06/16/underhanded-c",

    "/misc/about-string-encoding/": "/2014/04/24/about-string-encoding",
  },
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
    }),
    vue(),
  ],
})
