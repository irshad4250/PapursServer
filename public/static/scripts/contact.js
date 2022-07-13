const sendBut = document.querySelector(".sendButton")
const emailInput = document.querySelector(".emailInput")
const messageInput = document.querySelector(".messageInput")

sendBut.addEventListener("click", async () => {
  const email = emailInput.value
  const message = messageInput.value

  const postObj = await postReq({ email: email, message: message })

  if (!postObj) {
    alert("Error could not send message")
    return
  }

  if (postObj.error) {
    alert(postObj.info)
  } else {
    emailInput.value = ""
    messageInput.value = ""
    alert("Message successfully delivered.")
  }

  function postReq(data) {
    return new Promise((resolve, reject) => {
      fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(data)
        })
    })
  }
})
