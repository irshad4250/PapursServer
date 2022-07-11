const searchButton = document.querySelector(".searchButton")
const searchBox = document.querySelector(".searchBox")

document.addEventListener("DOMContentLoaded", () => {
  searchButton.addEventListener("click", go)
  searchBox.addEventListener("keydown", (event) => {
    if (event.keyCode === 13) {
      go()
    }
  })
})

function go() {
  const inputVal = searchBox.value
  if (!inputVal) return

  const url = `/search?q=${inputVal}`

  window.location.href = url
}

const closeNavButton = document.querySelector(".closeNavButton")
const burger = document.querySelector(".burgerContainer")
const rightSide = document.querySelector(".rightSide")

burger.addEventListener("click", () => {
  rightSide.style.top = 0
})

closeNavButton.addEventListener("click", () => {
  rightSide.style.top = "100%"
})
