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
