const base_url = "http://localhost:3000";

async function getStudents() {
  const res = await fetch(`${base_url}/students`);
  return res.json();
}

async function createStudent(params) {
  await fetch(`${base_url}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/* =========================================================
   ✅ ADD: TODOS + ASSIGNMENTS API
========================================================= */

// TODOS
async function getTodos() {
  const res = await fetch(`${base_url}/todos`);
  return res.json();
}

async function createTodo(params) {
  const res = await fetch(`${base_url}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function deleteTodo(id) {
  await fetch(`${base_url}/todos/${id}`, { method: "DELETE" });
}

async function patchTodo(id, params) {
  const res = await fetch(`${base_url}/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

// ASSIGNMENTS
// ✅ query optional: "?studentId=1" гэх мэт
async function getAssignments(query = "") {
  const res = await fetch(`${base_url}/assignments${query}`);
  return res.json();
}

async function createAssignment(params) {
  const res = await fetch(`${base_url}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function patchAssignment(id, params) {
  const res = await fetch(`${base_url}/assignments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function deleteAssignment(id) {
  await fetch(`${base_url}/assignments/${id}`, { method: "DELETE" });
}
