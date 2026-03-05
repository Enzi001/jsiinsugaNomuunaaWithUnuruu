async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(
    `http://localhost:3000/users?email=${email}&password=${password}`,
  );

  const users = await res.json();

  if (users.length === 0) {
    return alert("user not found");
  }
  const user = users[0];

  if (user.password !== password) {
    return alert("invalid password");
  }

  localStorage.setItem("user", JSON.stringify(user));

  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else if (user.role === "student") {
    window.location.href = "student.html";
  } else {
    alert("unknown role");
  }
}
