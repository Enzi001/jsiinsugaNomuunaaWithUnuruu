// ===============================
// AUTH CHECK
// ===============================
function safeJsonParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const currentUser = safeJsonParse(localStorage.getItem("user"));

if (!currentUser || currentUser.role !== "admin") {
  alert("Access denied (admin only)");
  window.location.href = "index.html";
}

document.getElementById("userEmail").textContent =
  currentUser.email || currentUser.name || "Admin";

document.getElementById("roleBadge").textContent = (
  currentUser.role || "ROLE"
).toUpperCase();

// ===============================
// API
// ===============================
const API = "http://localhost:3000/students";

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return data;
}

// ===============================
// STUDENTS CRUD
// ===============================
let students = [];
let currentPage = 1;
const PAGE_SIZE = 3;

async function loadStudents() {
  students = await request(API);
  applyView();
}

function render(list) {
  const tbody = document.getElementById("tbody");

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="muted">No students yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map(
      (s) => `
      <tr>
        <td>${s.id}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${s.age ?? ""}</td>
        <td>
          <button class="btn secondary" data-action="edit" data-id="${s.id}">Edit</button>
          <button class="btn danger" data-action="delete" data-id="${s.id}">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");
}

function applyView() {
  const q = (document.getElementById("q")?.value || "").trim().toLowerCase();
  const ageFilter = document.getElementById("ageFilter")?.value || "all";
  const sortBy = document.getElementById("sortBy")?.value || "id_desc";

  let list = [...students];

  if (q) list = list.filter((s) => String(s.name).toLowerCase().includes(q));

  // ⚠️ ageFilter value чинь HTML дээр lt10 / 10to15 / gt15 байгаа
  list = list.filter((s) => {
    const age = Number(s.age);
    if (!Number.isFinite(age)) return true;

    if (ageFilter === "lt10") return age < 10;
    if (ageFilter === "10to15") return age >= 10 && age < 15;
    if (ageFilter === "gt15") return age >= 15;

    return true;
  });

  list.sort((a, b) => {
    const A = normalize(a);
    const B = normalize(b);

    switch (sortBy) {
      case "id_asc":
        return A.id - B.id;
      case "id_desc":
        return B.id - A.id;
      case "name_asc":
        return A.name.localeCompare(B.name);
      case "name_desc":
        return B.name.localeCompare(A.name);
      case "age_asc":
        return A.age - B.age;
      case "age_desc":
        return B.age - A.age;
      default:
        return 0;
    }
  });

  // ===== Pagination =====
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const pageList = list.slice(start, end);

  render(pageList);
  updateKPI(list);

  renderPagination(total, totalPages, start, Math.min(end, total));
}
function normalize(s) {
  return {
    id: Number(s.id) || 0,
    name: String(s.name || "").toLowerCase(),
    age: Number.isFinite(Number(s.age)) ? Number(s.age) : 0,
  };
}

function renderPagination(total, totalPages, from, to) {
  const info = document.getElementById("pageInfo");
  const box = document.getElementById("pagination");

  if (info)
    info.textContent = `Showing ${total ? from + 1 : 0}–${to} of ${total}`;
  if (!box) return;

  if (totalPages <= 1) {
    box.innerHTML = "";
    return;
  }

  const buttons = [];

  buttons.push(btn("Prev", currentPage === 1, () => gotoPage(currentPage - 1)));

  const pages = getPageWindow(currentPage, totalPages, 7);
  for (const p of pages) {
    if (p === "...") {
      buttons.push(`<span class="pill">...</span>`);
    } else {
      buttons.push(btn(String(p), false, () => gotoPage(p), p === currentPage));
    }
  }

  buttons.push(
    btn("Next", currentPage === totalPages, () => gotoPage(currentPage + 1)),
  );

  box.innerHTML = buttons.join("");
}

function gotoPage(p) {
  currentPage = p;
  applyView();
}

function btn(label, disabled, onClick, active = false) {
  const cls = active ? "btn" : "btn secondary";
  const dis = disabled ? "disabled" : "";
  const id = `pg_${label}_${Math.random().toString(16).slice(2)}`;

  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.onclick = disabled ? null : onClick;
  }, 0);

  return `<button id="${id}" class="${cls}" ${dis} type="button">${label}</button>`;
}

function getPageWindow(page, totalPages, maxButtons = 7) {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const out = [];
  const side = Math.floor((maxButtons - 3) / 2);
  let start = Math.max(2, page - side);
  let end = Math.min(totalPages - 1, page + side);

  const windowSize = end - start + 1;
  const need = maxButtons - 2 - windowSize;

  if (need > 0) {
    end = Math.min(totalPages - 1, end + need);
    start = Math.max(
      2,
      start - Math.max(0, maxButtons - 2 - (end - start + 1)),
    );
  }

  out.push(1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push("...");
  out.push(totalPages);

  return out;
}
function updateKPI(list) {
  document.getElementById("kpiTotal").textContent = list.length;
  const avg =
    list.reduce((a, b) => a + Number(b.age || 0), 0) / (list.length || 1);
  document.getElementById("kpiAvgAge").textContent = avg.toFixed(1);
}

document
  .getElementById("studentForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const age = Number(document.getElementById("age").value);

    await request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age }),
    });

    e.target.reset();
    loadStudents();
  });

document.getElementById("tbody")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);

  if (btn.dataset.action === "delete") {
    await request(`${API}/${id}`, { method: "DELETE" });
    loadStudents();
  }

  if (btn.dataset.action === "edit") {
    const name = prompt("New name:");
    const age = Number(prompt("New age:"));
    await request(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age }),
    });
    loadStudents();
  }
});

// ===============================
// TODOS (ADMIN)
// ===============================
const todoForm = document.getElementById("todoForm");
const todoSelect = document.getElementById("todoSelect");
const studentSelect = document.getElementById("studentSelect");
const assignBtn = document.getElementById("assignBtn");
const adminTodoBoard = document.getElementById("adminTodoBoard");

async function loadAdminTodos() {
  const [todos, stList, assignments] = await Promise.all([
    fetch("http://localhost:3000/todos").then((r) => r.json()),
    fetch("http://localhost:3000/students").then((r) => r.json()),
    fetch("http://localhost:3000/assignments").then((r) => r.json()),
  ]);

  if (todoSelect)
    todoSelect.innerHTML = todos
      .map((t) => `<option value="${t.id}">${t.title}</option>`)
      .join("");

  if (studentSelect)
    studentSelect.innerHTML = stList
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

  if (!adminTodoBoard) return;

  adminTodoBoard.innerHTML = todos
    .map((todo) => {
      const related = assignments.filter(
        (a) => String(a.todoId) === String(todo.id),
      );

      const rows = related.length
        ? related
            .map((a) => {
              const st = students.find(
                (s) => String(s.id) === String(a.studentId),
              );
              return `<div class="muted">• ${st?.name || "Unknown"} : ${a.status}</div>`;
            })
            .join("")
        : `<div class="muted">No assignments</div>`;

      return `
      <div style="margin-top:12px; padding:12px; border:1px solid #333;">
        <b>${todo.title}</b>
        <div class="muted">${todo.description || ""}</div>
        ${rows}
      </div>
    `;
    })
    .join("");
}

todoForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    title: document.getElementById("todoTitle").value.trim(),
    description: document.getElementById("todoDesc").value.trim(),
    deadline: document.getElementById("todoDeadline").value || "",
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: currentUser.id,
  };

  await fetch("http://localhost:3000/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  e.target.reset();
  loadAdminTodos();
});

assignBtn?.addEventListener("click", async () => {
  const todoId = String(todoSelect?.value || "").trim();
  const studentId = String(studentSelect?.value || "").trim();

  if (!todoId || !studentId) {
    return alert("Todo болон Student сонгоно уу (хоосон байна).");
  }

  // duplicate check (string query)
  const existing = await fetch(
    `http://localhost:3000/assignments?todoId=${encodeURIComponent(todoId)}&studentId=${encodeURIComponent(studentId)}`,
  ).then((r) => r.json());

  if (existing.length) {
    return alert("Энэ сурагчид аль хэдийн assign хийгдсэн байна.");
  }

  const res = await fetch("http://localhost:3000/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      todoId, // ✅ STRING
      studentId, // ✅ STRING
      status: "assigned",
      doneAt: null,
      comment: "",
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return alert("Assign failed: " + txt);
  }

  alert("✅ Assign амжилттай");
  loadAdminTodos();
});

// ===============================
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
window.logout = logout;

const resetBtn = document.getElementById("resetBtn");
const qEl = document.getElementById("q");
const ageFilterEl = document.getElementById("ageFilter");
const sortByEl = document.getElementById("sortBy");

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
qEl?.addEventListener(
  "input",
  debounce(() => {
    currentPage = 1;
    applyView();
  }, 300),
);
ageFilterEl?.addEventListener("change", () => {
  currentPage = 1;
  applyView();
});
sortByEl?.addEventListener("change", () => {
  currentPage = 1;
  applyView();
});

resetBtn?.addEventListener("click", () => {
  currentPage = 1;
  if (qEl) qEl.value = "";
  if (ageFilterEl) ageFilterEl.value = "all";
  if (sortByEl) sortByEl.value = "id_desc";
  applyView();
});
// ===============================
loadStudents();
loadAdminTodos();
