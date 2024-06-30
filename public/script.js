document.getElementById("myForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://example.com/submit", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  };

  var formData = new FormData(document.getElementById("myForm"));
  var encodedData = new URLSearchParams(formData).toString();

  xhr.send(encodedData);
});
