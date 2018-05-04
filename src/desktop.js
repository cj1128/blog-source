import Clipboard from "clipboard"
import "magnific-popup"
import "magnific-popup/dist/magnific-popup.css"

import notie from "notie"
import "notie/dist/notie.css"

import hljs from "highlight.js"
import "highlight.js/styles/github.css"

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
  notie.alert(4, "Copy Successfully!", 1)
  e.clearSelection()
})

// make all links opened at new tab
$$(".post__body a").forEach(function(ele){
  ele.setAttribute("target", "_blank")
})

// add popups for images
// function magnificPopup(ele) {
//   if(ele.naturalWidth > ele.width) {
//     ele.classList.add("u-cursor-zoom-in")
//     $(ele).magnificPopup({
//       type: "image",
//       items: {
//         src: ele.getAttribute("src"),
//       },
//     })
//   }
// }

// $$(".post__body img").forEach(function(ele) {
//   if(ele.complete) {
//     magnificPopup(ele)
//     return
//   }

//   ele.onload = function() {
//     magnificPopup(ele)
//   }
// })
