// bun
const links = [
  '/2021/08/07/fourier-transform-and-audio-visualization/',
  '/2021/06/10/hot-reload-c/',
  '/2021/03/16/the-missing-div-instruction-part1/',
  '/2021/03/02/how-to-validate-tls-certificate/',
  '/2020/12/10/tiny-x64-helloworld/',
  '/2020/10/31/tinytorrent-a-deno-bt-downloader/',
  '/2020/09/11/cs107e-review/',
  '/2020/08/16/shell-init-type/',
  '/2020/07/01/douyu-crawler-and-font-anti-crawling/',
  '/2020/06/07/chip8-emulator/',
  '/2020/05/10/write-a-sublime-plugin/',
  '/2020/03/13/rsa/',
  '/2019/08/28/tcp-queue/',
  '/2019/07/29/image-optimization/',
  '/2018/08/11/forward-proxy-and-reverse-proxy/',
  '/2018/07/22/js-and-unicode/',
  '/2018/05/01/dns-101/',
  '/2018/03/31/how-http-basic-auth-work/',
  '/2017/06/04/migrate-to-hugo-from-jekyll/',
  '/2017/05/13/how-git-generate-diff/',
  '/2017/03/12/use-prometheus-to-monitor-server/',
  '/2017/02/18/write-a-code-post-generator-with-go/',
  '/2017/01/23/build-an-img-bed-on-qiniu/',
  '/2016/11/14/use-pprof-to-optimize-go/',
  '/2016/11/07/make-loading-animation-with-svg-morphing/',
  '/2016/10/21/build-log-system-with-elkb/',
  '/2016/09/05/build-a-https-site-from-scratch/',
  '/2016/08/20/use-dnsmasq-to-build-own-dns-server/',
  '/2016/05/21/ngrok-tutorial/',
  '/2016/04/06/first-chrome-extension-image-bed-on-weibo/',
  '/2016/03/20/intruduction-to-functional-reactive-programming/',
  '/2016/01/17/javascript-infinite-currying/',
  '/2015/06/16/underhanded-c/',
  '/2014/04/24/about-string-encoding/',
]

const redirect = {
  '/hot-reload-c': '/2021/06/10/hot-reload-c',

  '/the-missing-div-instruction-part1/': '/2021/03/16/the-missing-div-instruction-part1',

  '/web2.0/dns-101/': '/2018/05/01/dns-101',

  '/web2.0/how-http-basic-auth-work/': '/2018/03/31/how-http-basic-auth-work',

  '/misc/forward-proxy-and-reverse-proxy/': '/2018/08/11/forward-proxy-and-reverse-proxy',

  '/web2.0/intruduction-to-functional-reactive-programming/': '/2016/03/20/intruduction-to-functional-reactive-programming',

  '/golang/migrate-to-hugo-from-jekyll/': '/2017/06/04/migrate-to-hugo-from-jekyll',

  '/misc/how-git-generate-diff/': '/2017/05/13/how-git-generate-diff',

  '/misc/2017-03-12-使用Prometheus监控服务器性能.html': '/2017/03/12/use-prometheus-to-monitor-server',
  '/linux/use-prometheus-to-monitor-server/': '/2017/03/12/use-prometheus-to-monitor-server',

  '/golang/2017-02-18-使用Go编写代码明信片生成器.html': '/2017/02/18/write-a-code-post-generator-with-go',
  '/golang/write-a-code-post-generator-with-go/': '/2017/02/18/write-a-code-post-generator-with-go',

  '/web2.0/build-an-img-bed-on-qiniu/': '/2017/01/23/build-an-img-bed-on-qiniu',

  '/golang/2016-11-14-使用pprof优化golang性能.html': '/2016/11/14/use-pprof-to-optimize-go',
  '/golang/use-pprof-to-optimize-go/': '/2016/11/14/use-pprof-to-optimize-go',

  '/web2.0/make-loading-animation-with-svg-morphing/': '/2016/11/07/make-loading-animation-with-svg-morphing',

  '/misc/2016-10-21-从零开始搭建一个ELKB日志收集系统.html': '/2016/10/21/build-log-system-with-elkb',
  '/misc/build-log-system-with-elkb/': '/2016/10/21/build-log-system-with-elkb',

  '/web2.0/2016-09-05-从零开始搭建一个HTTPS网站.html': '/2016/09/05/build-a-https-site-from-scratch',
  '/web2.0/build-a-https-site-from-scratch/': '/2016/09/05/build-a-https-site-from-scratch',

  '/misc/use-dnsmasq-to-build-own-dns-server/': '/2016/08/20/use-dnsmasq-to-build-own-dns-server',

  '/misc/2016-05-21-使用Ngrok实现内网穿透.html': '/2016/05/21/ngrok-tutorial',
  '/misc/ngrok-tutorial/': '/2016/05/21/ngrok-tutorial',

  '/web2.0/first-chrome-extension-image-bed-on-weibo/': '/2016/04/06/first-chrome-extension-image-bed-on-weibo',

  '/misc/underhanded-c/': '/2015/06/16/underhanded-c',

  '/misc/about-string-encoding/': '/2014/04/24/about-string-encoding',
}

const linksSet = new Set(links)
Object.keys(redirect).forEach((url) => linksSet.add(url))
Object.values(redirect).forEach((url) => linksSet.add(url))

let okCount = 0
let totalCount = 0
let curCount = 0

for (const url of linksSet) {
  totalCount++
  fetch('http://localhost:4321' + url)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error('invalid response status:' + res.status)
      }

      console.log('ok', url)
      okCount++
    })
    .catch((err) => {
      console.error('err', url)
    })
    .finally(() => {
      curCount++
      if (curCount === totalCount) {
        console.log('all done', { okCount, totalCount })
      }
    })
}
