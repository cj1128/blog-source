// change top image size
const postHeader = document.querySelector(".post__header")
if(postHeader) {
  const url = postHeader.getAttribute("data-cover")
  postHeader.style.backgroundImage = "url(" + url.replace("large", "bmiddle") + ")"
}
