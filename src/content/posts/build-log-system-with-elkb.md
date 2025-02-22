---
title: 从零开始搭建一个 ELKB 日志收集系统
date: 2016-10-21T00:00:00+08:00
cover: /image/9b85365dgw1f8qjr6igesj21kw0w7ac4.jpg
tags: [log, elk, logstash, elasticsearch, kibana]
---

当今的软件开发 **多核** 以及 **分布** 已经成为了常态，基本上稍大型的应用都是多台机器分布式部署。分布式在提高性能的同时也带来了很多问题，今天我们只讨论一点，那就是如何处理多台机器线上系统的日志。

以我司的某个应用 T 为例，部署在了百度云 5 台机子上，其中一台拥有公网 IP，使用了百度云提供的负载均衡服务。每次想要在日志中检索某个关键字时，基本步骤如下：

- 打开五个 SSH，登陆拥有公网 IP 的那台机器
- 在另外四个 SSH 中分别登陆其他的内网机器
- 对日志文件进行检索

<!--more-->

当然，我们可以写脚本来简化这个过程，或者使用类似 _cssh_ 这样的工具。但是成功登陆到五台机器上只是任务的开始，接下来我们要手动选择我们希望检索的日志（日志按照日期进行存储），使用 grep 进行检索，然后还要在五个 SSH 上一个一个地看结果。如果有一个稍微高级的需求，比如检查某个关键词是否在昨天和今天的日志中都出现过，任务会变得十分麻烦，而且使用 Shell 非常容易出错。

从这个过程中就可以总结出分布式系统日志处理的需求，我希望有这么个日志处理系统，有以下几个功能：

- 将多台机器上的日志收集到一台机器上。这样我在一个地方就可以看到所有的日志。
- 按照我指定的格式分析日志。日志肯定要解析的，最基本的日志也都要分为时间戳和内容。
- 有一个漂亮的界面能够让我查看日志和搜索日志。现在是 21 世纪了，谁也不想一天到晚用终端来完成任务。

幸运地是，[Elastic](https://www.elastic.co/) 提供了一套非常高级的工具 `ELKB` 来满足以上这几个需求。`ELKB` 指的是用于日志分析或者说数据分析的四个软件，各自拥有独立的功能又可以组合在一起。先来简单介绍一下这四个软件。

- `Elastic Search`: 从名称可以看出，Elastic Search 是用来进行搜索的，提供数据以及相应的配置信息（什么字段是什么数据类型，哪些字段可以检索等），然后你就可以自由地使用 API 搜索你的数据。
- `Logstash`: 日志文件基本上都是每行一条，每一条里面有各种信息，这个软件的功能是将每条日志解析为各个字段。
- `Kibana`: 提供一套 Web 界面用来和 Elastic Search 进行交互，这样我们不用使用 API 来检索数据了，可以直接在 Kibana 中输入关键字，Kibana 会将返回的数据呈现给我们，当然，有很多漂亮的数据可视化图表可供选择。
- `Beats`: 安装在每台需要收集日志的服务器上，将日志发送给 Logstash 进行处理，所以 Beats 是一个“搬运工”，将你的日志搬运到日志收集服务器上。

## 安装

这里使用 CentOS 7 为例来说明怎么装这几个软件。其中 ELK 只需要安装在进行日志收集分析的服务器（server）上，而Beats是每一台产生日志的机器（client）都需要安装，当然也可能包括日志收集服务器本身。

### Java

```shell
$ yum install java-1.8.0
```

### Ealstic Search

```shell
$ rpm --import http://packages.elastic.co/GPG-KEY-elasticsearch
$ echo '[elasticsearch-2.x]
name=Elasticsearch repository for 2.x packages
baseurl=http://packages.elastic.co/elasticsearch/2.x/centos
gpgcheck=1
gpgkey=http://packages.elastic.co/GPG-KEY-elasticsearch
enabled=1
' | tee /etc/yum.repos.d/elasticsearch.repo
$ yum install elasticsearch
```

### Logstash

```shell
$ vim /etc/yum.repos.d/logstash.repo
# 添加以下内容
[logstash-2.4]
name=logstash repository for 2.2 packages
baseurl=http://packages.elasticsearch.org/logstash/2.2/centos
gpgcheck=1
gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
enabled=1
# 安装
$ yum install logstash
```

### Kibana

```shell
$ vim /etc/yum.repos.d/kibana.repo
# 添加以下内容
[kibana-4.6]
name=Kibana repository for 4.4.x packages
baseurl=http://packages.elastic.co/kibana/4.4/centos
gpgcheck=1
gpgkey=http://packages.elastic.co/GPG-KEY-elasticsearch
enabled=1
# 安装
$ yum install kibana
```

### Beats

Beats 分为很多种，每一种收集特定的信息。常用的是 `Filebeat`，监听文件变化，传送文件内容。一般日志系统使用 Filebeat 就够了。

我们切换到 client 上。首先同样需要导入 `GPG KEY`。

```shell
$ rpm --import http://packages.elastic.co/GPG-KEY-elasticsearch
```

创建新的 repo 并安装。

```shell
$ vim /etc/yum.repos.d/elastic-beats.repo
# 添加以下内容
[beats]
name=Elastic Beats Repository
baseurl=https://packages.elastic.co/beats/yum/el/$basearch
enabled=1
gpgkey=https://packages.elastic.co/GPG-KEY-elasticsearch
gpgcheck=1
# 安装
$ yum install filebeat
```

## Elastic Search

Elastic Search 不需要太多配置，只需要阻止一下外网访问即可。修改配置文件 `/etc/elasticsearch/elasticsearch.yml`。

```shell
network.host: localhost
```

启动 Elastic Search: `service elasticsearch start`。

Elastic Search 本身可以认为是一个 NoSQL 数据库，通过 REST API 来操作。数据存储在 `Index` 中，Index 在 Elastic Search 中就相当于 SQL 中的表。因为 Elastci Search 主要是用来对数据进行检索，所以 Index 有一个配置叫做 `mapping`。我们使用 mapping 来告诉 Elastic Search 数据的一些相关信息，比如，某个字段是什么数据类型，是否创建索引等。我们先来玩玩 Elastic Search，使用官方提供的[莎士比亚数据集](https://www.elastic.co/guide/en/kibana/3.0/snippets/shakespeare.json)为例。

```shell
$ curl localhost:9200/_cat/indices?v # 查看当前所有的 index
health status index pri rep docs.count docs.deleted store.size pri.store.size # 没有任何 index
# 创建 shakespeare 索引，并设置 mapping 信息
# speaker 字段和 play_name 不需要分析，Elastic Search 默认会拆分字符串中的每个词并进行索引
$ curl -XPUT http://localhost:9200/shakespeare -d '
{
 "mappings" : {
  "_default_" : {
   "properties" : {
    "speaker" : {"type": "string", "index" : "not_analyzed" },
    "play_name" : {"type": "string", "index" : "not_analyzed" },
    "line_id" : { "type" : "integer" },
    "speech_number" : { "type" : "integer" }
   }
  }
 }
}
';
$ curl localhost:9200/_cat/indices?v # 查看索引
health status index       pri rep docs.count docs.deleted store.size pri.store.size
yellow open   shakespeare   5   1          0            0       260b           260b
# 下载数据，并将数据集 load 进索引中
$ wget https://www.elastic.co/guide/en/kibana/3.0/snippets/shakespeare.json
$ curl -XPOST 'localhost:9200/shakespeare/_bulk?pretty' --data-binary @shakespeare.json
# 以上操作完成后，Elastic Search 中就已经有了我们 load 的所有数据，并建立好了索引，我们可以开始查询了
# 查询一下含有 'man' 这个词的 text_entry
$ curl -s 'localhost:9200/shakespeare/_search?q=text_entry:man&pretty=1&size=20' | jq '.hits.hits | .[]._source.text_entry'
"man."
"Man?"
"man."
"Why, man?"
"Worthy man!"
"Every man,"
"complete man."
"married man?"
"melancholy man."
"Speak, man."
"Why, man?"
"What, man?"
"prave man."
"Speak, man."
"Why, man?"
"So man and man should be;"
"O, the difference of man and man!"
"The young man is an honest man."
"A gross fat man."
"plain-dealing man?"
```

下面我们通过解析 Nginx 的访问日志来说明怎么配合使用 ELKB。

## 解析 Nginx 访问日志

整个过程的流程比较简单，Filebeat 收集日志传送给 Logstash，Logstash 解析好了以后，写入到 Elastic Search 中，最后我们使用 Kibana 来查看这些日志并进行检索。

### Filebeat

首先切换到 client 上，我们来配置 Filebeat。

```shell
$ vim /etc/filebeat/filebeat.yml
...
prospectors:
  -
    paths:
      - /var/log/nginx/access.log
    # 找到 document_type 字段，取消注释，这个字段会告诉 Logstash 日志的类型，对应 Logstash 中的 type 字段
    document_type: nginx
...
# 默认输出为 Elastic Search，注释掉，使用 Logstash
logstash:
  hosts: ["IP:5044"] # 注意更改这里的 IP
```

### Logstash

Logstash 的配置相对麻烦一下，因为 Logstash 需要接受输入，进行处理然后产生输出。Logstash 采用 `input`, `filter`, `output` 的三段配置法。input 配置输入源，filter 配置对输入源中的信息怎样进行处理，而 output 配置输出位置。

一般情况下，input 为 beat，filter 中我们解析 input 获取到的日志，得到我们想要的字段，而output 为 Elastic Search。这里我们以 Nginx 的访问日志为例。filter 中有一个关键的东西叫做 `grok`，我们使用这个东西来解析日志结构。Logstash 提供了一些默认的 [Pattern](https://github.com/elastic/logstash/blob/v1.4.2/patterns/grok-patterns)，方便我们解析用。当然，我们也可以自己用正则来自定义 pattern 匹配日志内容。

```shell
$ vim /etc/logstash/conf.d/nginx.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [type] == "nginx" { # 这里的type是日志类型，我们在后面的filebeat中设定
    grok {
      match => { "message" => "%{COMBINEDAPACHELOG} %{QS:gzip_ratio}" } # 使用自带的pattern即可，注意空格
      remove_field => ["beat", "input_type", "message", "offset", "tags"] # filebeat添加的字段，我们不需要
    }

    # 更改匹配到的字段的数据类型
    mutate {
      convert => ["response", "integer"]
      convert => ["bytes", "integer"]
      convert => ["responsetime", "float"]
    }

    # 指定时间戳字段以及具体的格式
    date {
      match => ["timestamp", "dd/MMM/YYYY:HH:mm:ss Z"]
      remove_field => ["timestamp"]
    }
  }
}

outpugst {
  elasticsearch {
    hosts => [ "localhost:9200" ]
    index => "%{type}-%{+YYYY.MM.dd}" # index 中含有时间戳
  }
}
```

`service logstash start` 启动 Logstash 即可，注意，他的启动速度很慢。

### Elastcisearch

上面的 Logstash 配置中，我们可以看到最终写入 Elastic Search 的 Index 含有时间戳，这是比较推荐的做法。因为可以方便我们按天对数据进行分析。关于 Elastic Search 我们只要配置一下 Index 的 Mapping 信息即可。因为我们的 Index 是按天生成的，每天都是一个新的 Index，那当然不可能每天都配置一次 Index 的 Mapping。这里需要使用 Elastic Search 的一个功能，`Index Template`，我们可以创建一个 Index 的配置模板，使用这个模板来配置所有匹配的 Index。

```shell
curl -XPUT localhost:9200/_template/nginx -d '
{
  "template": "nginx*",
  "mappings": {
    "_default_": {
      "properties": {
        "clientip": {
          "type": "string",
          "index": "not_analyzed"
        },
        "ident": {
          "type": "string"
        },
        "auth": {
          "type": "string"
        },
        "verb": {
          "type": "string"
        },
        "request": {
          "type": "string"
        },
        "httpversion": {
          "type": "string"
        },
        "rawrequest": {
          "type": "string"
        },
        "response": {
          "type": "string"
        },
        "bytes": {
          "type": "integer"
        },
        "referrer": {
          "type": "string"
        },
        "agent": {
          "type": "string"
        },
        "gzip_ratio": {
          "type": "string"
        }
      }
    }
  }
}
'
```

上面的代码创建了一个名为 `nginx` 的模板，匹配所有以 nginx 开头的 Index。

### Kibana

Kibana 不需要什么配置，直接启动即可。`service kibana start`，默认运行在 5601 端口。如果考虑到安全性，也可以将 Kibana 配置为只监听本机，然后使用 Nginx 进行反向代理并控制权限，这里就不再赘述了。

接下来我们需要产生点日志，然后在 Kibana 中能查看到就说明系统工作正常了。我们用 curl 随便请求一下 client 上的 Nginx 来产生一点日志。然后，打开 Kibana，`http://[server ip]:5601`。刚进去的时候，我们先要配置一下 Kibana 的 `Index Pattern`，告诉 Kibana 我们想看哪个 Index 的数据，输入 `nginx*` 即可，然后点击 `Discover` 浏览数据。

最终效果如下，我们可以在 Kibana 中浏览我们的 Nginx 日志，并进行任意搜索。

![](/image/9b85365djw1f8zwhs3j5vj21h50mijxx.jpg)
