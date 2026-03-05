function safeJsonParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const user = safeJsonParse(localStorage.getItem("user"));
if (!user || user.role !== "student") {
  alert("Access denied (student only)");
  window.location.href = "index.html";
}

const myTodoList = document.getElementById("myTodoList");

async function loadMyTodos() {
  const [students, todos] = await Promise.all([
    fetch("http://localhost:3000/students").then((r) => r.json()),
    fetch("http://localhost:3000/todos").then((r) => r.json()),
  ]);

  // ✅ user.email -> student олно
  const me = students.find(
    (s) => String(s.email).toLowerCase() === String(user.email).toLowerCase(),
  );
  if (!me) {
    myTodoList.innerHTML = `<div class="muted">Таны student profile олдсонгүй (email таарахгүй байна).</div>`;
    return;
  }

  const assigns = await fetch(
    `http://localhost:3000/assignments?studentId=${encodeURIComponent(me.id)}`,
  ).then((r) => r.json());

  if (!assigns.length) {
    myTodoList.innerHTML = `<div class="muted">Одоогоор танд assign хийсэн task алга.</div>`;
    return;
  }

  myTodoList.innerHTML = assigns
    .map((a) => {
      const t = todos.find((x) => String(x.id) === String(a.todoId));
      const done = a.status === "done";

      return `
      <div class="card" style="margin-top:12px;">
        <b>${t?.title || "Unknown Todo"}</b>
        <div class="muted">${t?.description || ""}</div>
        <div class="muted">⏳ Deadline: ${t?.deadline || "-"}</div>

        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
          <button class="btn ${done ? "danger" : ""}" data-toggle="${a.id}" data-done="${done}">
            ${done ? "Undo" : "Mark Done"}
          </button>

          <input class="input" style="max-width:240px;" data-comment="${a.id}" placeholder="Comment"
                 value="${a.comment || ""}" />
          <button class="btn secondary" data-save="${a.id}">Save</button>
        </div>

        <div class="muted" style="margin-top:6px;">
          Status: ${done ? "✅ DONE" : "🕒 ASSIGNED"} ${a.doneAt ? "— " + a.doneAt : ""}
        </div>
      </div>
    `;
    })
    .join("");

  // toggle done/undo
  myTodoList.querySelectorAll("button[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggle;
      const isDone = btn.dataset.done === "true";

      await fetch(`http://localhost:3000/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isDone ? "assigned" : "done",
          doneAt: isDone ? null : new Date().toISOString(),
        }),
      });

      loadMyTodos();
    });
  });

  // save comment
  myTodoList.querySelectorAll("button[data-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.save;
      const input = myTodoList.querySelector(`input[data-comment="${id}"]`);

      await fetch(`http://localhost:3000/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: (input?.value || "").trim() }),
      });

      loadMyTodos();
    });
  });
}

loadMyTodos();
