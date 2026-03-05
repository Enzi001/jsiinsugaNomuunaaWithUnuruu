const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "index.html";
}

document.getElementById("welcome").innerText =
  `Welcome, ${user.role.toUpperCase()} ${user.name}`;

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
