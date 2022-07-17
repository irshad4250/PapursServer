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

  let filterString = ""

  if (examValue && examValue != "Any") {
    filterString += `&exam=${examValue}`
  }

  if (subjectValue && subjectValue != "Any") {
    filterString += `&subject=${subjectValue}`
  }

  if (yearValue && yearValue != "Any") {
    filterString += `&year=${yearValue}`
  }

  if (!inputVal) return

  const url = `/search?q=${encodeURIComponent(inputVal)}` + filterString

  window.location.href = url
}

const closeNavButton = document.querySelector(".closeNavButton")
const burger = document.querySelector(".burgerContainer")
const rightSide = document.querySelector(".rightSide")

if (burger) {
  burger.addEventListener("click", () => {
    rightSide.style.top = 0
  })

  closeNavButton.addEventListener("click", () => {
    rightSide.style.top = "100%"
  })
}

// for filter
const examInput = document.querySelector(".examinationInput")
const subjectInput = document.querySelector(".subjectInput")
const yearInput = document.querySelector(".yearInput")
const filterContainer = document.querySelector(".filterContainer")

let subjectValue = null
let yearValue = null
let examValue = null

document.querySelector(".filterApplyButton").addEventListener("click", () => {
  filterContainer.style.top = "100%"
})

document.querySelector(".funnelIcon").addEventListener("click", () => {
  filterContainer.style.top = "0"
})

document.querySelector(".filterCancelButton").addEventListener("click", () => {
  filterContainer.style.top = "100%"
  examValue = null
  subjectValue = null
  yearValue = null

  examInput.value = "Any"
  subjectInput.innerHTML = returnOptionNode("None")
  yearInput.innerHTML = returnOptionNode("None")

  subjectInput.disabled = true
  yearInput.disabled = true
})

examInput.addEventListener("change", () => {
  examValue = examInput.value

  subjectInput.innerHTML = ""
  yearInput.innerHTML = ""
  subjectInput.disabled = true
  yearInput.disabled = true

  yearValue = "Any"
  subjectValue = "Any"

  postExamValueAndGetSubjects()
})

subjectInput.addEventListener("change", () => {
  subjectValue = subjectInput.value

  yearInput.innerHTML = ""
  yearValue = "Any"
  yearInput.disabled = true

  postSubjectValueAndGetYears()
})

yearInput.addEventListener("change", () => {
  yearValue = yearInput.value
})

function postReq(route, JSONData) {
  return new Promise((resolve, reject) => {
    fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSONData),
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data)
      })
  })
}

async function postExamValueAndGetSubjects() {
  if (examValue == "Any") return

  const examRes = await postReq("/api/getSubjectsLevel", { level: examValue })

  if (examRes.error || examRes.data.length === 0) {
    alert("Error in getting subjects try again.")
    return
  }

  subjectInput.innerHTML += returnOptionNode("Any")
  examRes.data.forEach((subject) => {
    const node = returnOptionNode(subject)
    subjectInput.innerHTML += node
  })
  subjectInput.disabled = false
}

async function postSubjectValueAndGetYears() {
  if (subjectValue == "Any") return

  const subjectRes = await postReq("/api/getYears", { subject: subjectValue })

  if (subjectRes.error || subjectRes.data.length === 0) {
    alert("Error in getting years try again.")
    return
  }

  yearInput.innerHTML += returnOptionNode("Any")
  subjectRes.data.forEach((year) => {
    const node = returnOptionNode(year)
    yearInput.innerHTML += node
  })

  yearInput.disabled = false
}

function returnOptionNode(value) {
  const string = `<option value="${value}">${value}</option>`
  return string
}
