import Clipboard from "clipboard"

import humane from "./lib/humane.min"
import "./lib/humane.libnotify.css"

import hljs from "highlight.js/lib/highlight"
import "highlight.js/styles/github.css"

import javascript from "highlight.js/lib/languages/javascript"
import css from "highlight.js/lib/languages/css"
import http from "highlight.js/lib/languages/http"
import python from "highlight.js/lib/languages/python"
import bash from "highlight.js/lib/languages/bash"
import makefile from "highlight.js/lib/languages/makefile"
import json from "highlight.js/lib/languages/json"
import markdown from "highlight.js/lib/languages/markdown"
import sql from "highlight.js/lib/languages/sql"
import cpp from "highlight.js/lib/languages/cpp"
import xml from "highlight.js/lib/languages/xml"
import nginx from "highlight.js/lib/languages/nginx"
import go from "highlight.js/lib/languages/go"
import yaml from "highlight.js/lib/languages/yaml"

import "zoom-vanilla.js/dist/zoom-vanilla.min.js"
import "zoom-vanilla.js/dist/zoom.css"

hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("css", css)
hljs.registerLanguage("http", http)
hljs.registerLanguage("python", python)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("makefile", makefile)
hljs.registerLanguage("json", json)
hljs.registerLanguage("markdown", markdown)
hljs.registerLanguage("sql", sql)
hljs.registerLanguage("cpp", cpp)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("nginx", nginx)
hljs.registerLanguage("go", go)
hljs.registerLanguage("yaml", yaml)

function $(sel) {
  return document.querySelector(sel)
}

function $$(sel) {
  return document.querySelectorAll(sel)
}

// replace post header image
var $postHeader = $(".post__header")
if($postHeader) {
  $postHeader.style.backgroundImage = `url(${$postHeader.dataset.cover})`
}

// highlight
$$("pre > code").forEach(function(ele) {
  hljs.highlightBlock(ele)
})

// add copy code buttn
$$("pre > code").forEach(function(ele, index) {
  var id = "code-block-" + index
  ele.setAttribute("id", id)

  var btn = document.createElement("span")
  btn.innerText = "copy"
  btn.classList.add("copy-code-btn")
  btn.setAttribute("data-clipboard-target", "#" + id)
  ele.parentElement.appendChild(btn)
})

var clipboard = new Clipboard(".copy-code-btn")

clipboard.on("success", function(e) {
  humane.log("Copied")
  e.clearSelection()
})

// make all links opened at new tab
$$(".post__body a").forEach(function(ele){
  ele.setAttribute("target", "_blank")
})

// make images zoomable
function magnificPopup(ele) {
  if(ele.naturalWidth > ele.width) {
    ele.classList.add("u-cursor-zoom-in")
    $(ele).magnificPopup({
      type: "image",
      items: {
        src: ele.getAttribute("src"),
      },
    })
  }
}

$$(".post__body img").forEach(function(ele) {
  if(ele.naturalWidth > ele.width) {
    ele.dataset.action = "zoom"
  }
})
