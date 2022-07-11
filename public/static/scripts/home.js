const searchButton = document.querySelector(".searchButton")
const searchBox = document.querySelector(".searchBox")

searchButton.addEventListener("click", go)
searchBox.addEventListener("keydown", (event) => {
  if (event.keyCode === 13) {
    go()
  }
})

function go() {
  const inputVal = searchBox.value
  if (!inputVal) return

  const url = `/search?q=${inputVal}`

  window.location.href = url
}

const examInput = document.querySelector(".examinationInput")
const subjectInput = document.querySelector(".subject")
const yearInput = document.querySelector(".yearInput")
const filterContainer = document.querySelector(".filterContainer")

document.querySelector(".filterApplyButton").addEventListener("click", () => {
  filterContainer.style.display = "none"
})

document.querySelector(".funnelIcon").addEventListener("click", () => {
  filterContainer.style.display = "flex"
})
