---
cover: http://ww1.sinaimg.cn/large/007FEWc7ly1g1f3uidzsqj31hc0goafm
date: 2017-01-23T00:00:00+08:00
title: 图床on七牛，简单好用的图床插件
tags: [图床, 七牛, chrome]
---

注：因为七牛 API 修改，编辑于 2019-03-25T16:20:00。

最近在使用过程中发现 **图床on微博** 出了点问题，响应体的 JSON 解析错误，不用想都知道肯定是微博修改了响应体的数据结构（微博图片上传接口响应体是 html 和 json 混在一起，十分专业）。简单修复了一下，测试的时候却发现，微博的图片上传接口变得不再稳定了，经常 404。看来微博图床是不能用了，正好我早就觉得微博不是个好图床，缺点如下：

1. 经常性的要重新登陆，麻烦死了
2. 无法获取到完整的上传图片列表
3. 无法删除上传的图片
4. 服务状态不可控，指不定什么时候接口就不能用了

<!--more-->

要想对上传的图片拥有完全的控制权，那么图片一定要上传到自己能够控制的地方去。目前国内比较出名的免费存储空间提供商我所知的就是七牛了，简单看了看七牛的文档，做个图床没问题。用户可以创建免费空间，免费空间提供测试域名，限制如下：

1. 单 IP 每秒限制请求次数 10 次，大于 10 次禁止 5 秒
2. 单 URL 限速 8 Mbps

对于一个图床来说，这个限制完全够用了。

图床其实只需要两个核心接口：

1. 图片上传接口
2. 图片获取接口

至于图片删除什么的，当然七牛也提供，我个人觉得一个图床工具没必要这么麻烦了。

关于上传，七牛封装有现成的 SDK，比如 [JavaScript SDK]，这个 SDK 是基于 [Plupload] 做的，十分麻烦，提供了一大堆不需要的功能，我需要的就是简单的一个 POST 调用。

在文档中心里的 [API 参考] 找了一下，找到了 [直传文件 API]，接口定义如下。

```bash
POST / HTTP/1.1
Host:           <UpHost>
Content-Type:   multipart/form-data; boundary=<frontier>
Content-Length: <multipartContentLength>
--<frontier>
Content-Disposition:       form-data; name="key"
<resource_key>
--<frontier>
Content-Disposition:       form-data; name="x:<custom_name>"
<custom_value>
--<frontier>
Content-Disposition:       form-data; name="token"
<upload_token>
--<frontier>
Content-Disposition:       form-data; name="crc32"
<crc32>
--<frontier>
Content-Disposition: form-data; name="x-qn-meta-<metaKey>"
<metaValue>
--<frontier>
Content-Disposition:       form-data; name="accept"
<acceptContentType>
--<frontier>
Content-Disposition:       form-data; name="file"; filename="<fileName>"
Content-Type:              application/octet-stream
Content-Transfer-Encoding: binary
<fileBinaryData>
```

一个使用 multipart 传参数的接口，虽然参数很多，但是必传参数只有 `upload_token`，`fileName` 以及 `fileBinaryData`。

关于上传凭证也就是 token 的生成，七牛的文档 [上传凭证] 说的很清楚，同时还提供了 [JSFiddle 的在线示例]，真是业界良心，千言万语不如代码来的直接。

这里摘录一下最后我的实现。

```javascript
function genUpToken(accessKey, secretKey, policy) {
  var policyStr = JSON.stringify(policy)
  var encoded = btoa(utf16to8(policyStr))
  var hash = CryptoJS.HmacSHA1(encoded, secretKey) // npm install crypto-js
  var encodedSign = hash.toString(CryptoJS.enc.Base64)
  var uploadToken = accessKey + ":" + safe64(encodedSign) + ":" + encoded
  return uploadToken
}

function utf16to8(str) {
  var out, i, len, c
  out = ""
  len = str.length
  for(i = 0; i < len; i++) {
    c = str.charCodeAt(i)
    if ((c >= 0x0001) && (c <= 0x007F)) {
      out += str.charAt(i)
    } else if (c > 0x07FF) {
      out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F))
      out += String.fromCharCode(0x80 | ((c >>  6) & 0x3F))
      out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F))
    } else {
      out += String.fromCharCode(0xC0 | ((c >>  6) & 0x1F))
      out += String.fromCharCode(0x80 | ((c >>  0) & 0x3F))
    }
  }
  return out
}

function safe64(base64) {
  base64 = base64.replace(/\+/g, "-")
  base64 = base64.replace(/\//g, "_")
  return base64
}
```

好了，到此上传文件就搞定了。接下来我们看看该怎样获取所有上传的文件。七牛提供了 [资源列举] 这样的一个接口，听着名字应该就是我们要的，接口定义如下。

```bash
GET /list?bucket=<Bucket>&marker=<Marker>&limit=<Limit>&prefix=<UrlEncodedPrefix>&delimiter=<UrlEncodedDelimiter> HTTP/1.1
Host:           rsf.qbox.me
Content-Type:   application/x-www-form-urlencoded
Authorization:  QBox <AccessToken>
```

这里又需要一个 token，放在 `Authorization` Header 里面的，叫做 [管理凭证]。打开文档看了一下，不算麻烦。代码如下。

```javascript
function genManageToken(accessKey, secretKey, pathAndQuery, body) {
  const str = pathAndQuery + "\n" + body
  const hash = CryptoJS.HmacSHA1(str, secretKey)
  const encodedSign = safe64(hash.toString(CryptoJS.enc.Base64))
  return accessKey + ":" + encodedSign
}
```

管理凭证生成好以后，将 bucket 参数携带上应该就可以了。最终图片获取的代码如下。

```javascript
function fetch() {
  const path = "/list?bucket=" + getItem("bucket")
  return axios.post("http://rsf.qbox.me" + path, null, {
    headers: {
      Authorization: "QBox " + genManageToken(
        getItem("accessKey"),
        getItem("secretKey"),
        path,
        "",
      ),
    },
  })
}
```

到这里，核心功能就做好了，剩下的就是 UI 层面的事情，在 *图床on微博* 的基础上，将历史记录功能优化成了和 Unsplash 一样的三栏显示。最终效果如下所示，关于插件的安装使用仓库 README 中有详细说明，[仓库地址]。

![](http://ww1.sinaimg.cn/large/007FEWc7ly1g1f3v5j3f4g31810jcnpd)

[JavaScript SDK]: https://developer.qiniu.com/kodo/sdk/1283/javascript
[Plupload]: http://www.plupload.com/
[API 参考]: https://developer.qiniu.com/kodo/api/1731/api-overview
[直传文件 API]: https://developer.qiniu.com/kodo/api/1312/upload
[JSFiddle 的在线示例]: http://jsfiddle.net/gh/get/extjs/4.2/icattlecoder/jsfiddle/tree/master/uptoken
[资源列举]: https://developer.qiniu.com/kodo/api/1284/list
[管理凭证]: https://developer.qiniu.com/kodo/manual/1201/access-token
[仓库地址]: https://github.com/fate-lovely/pic-on-qiniu
[上传凭证]: https://developer.qiniu.com/kodo/manual/1208/upload-token

