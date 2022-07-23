const examInput = document.querySelector(".examinationInput")
const subjectInput = document.querySelector(".subjectInput")
const yearInput = document.querySelector(".yearInput")

const goButton = document.querySelector(".goButton")

let subjectValue = null
let yearValue = null
let examValue = null

examInput.addEventListener("change", () => {
  examValue = examInput.value

  subjectInput.innerHTML = ""
  yearInput.innerHTML = ""

  yearValue = "Any"
  subjectValue = "Any"

  postExamValueAndGetSubjects()
})

subjectInput.addEventListener("change", () => {
  subjectValue = subjectInput.value

  yearInput.innerHTML = ""
  yearValue = "Any"

  postSubjectValueAndGetYears()
})

yearInput.addEventListener("change", () => {
  yearValue = yearInput.value
})

goButton.addEventListener("click", () => {
  if (
    !subjectValue ||
    !yearValue ||
    !examValue ||
    subjectValue == "Any" ||
    yearValue == "Any" ||
    examValue == "Any"
  ) {
    alert("Please fill all boxes!")
    return
  }

  const link = `/pastPapers/papers?subject=${subjectValue}&year=${yearValue}`
  window.location.href = link
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
