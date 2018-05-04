import Clipboard from "clipboard"

import humane from "./lib/humane.min"
import "./lib/humane.libnotify.css"

import hljs from "highlight.js"
import "highlight.js/styles/github.css"

import "zoom-vanilla.js/dist/zoom-vanilla.min.js"
import "zoom-vanilla.js/dist/zoom.css"

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
