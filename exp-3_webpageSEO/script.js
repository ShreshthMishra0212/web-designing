const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const errorMessage = document.getElementById("error-message");
const taskList = document.getElementById("task-list");
const summary = document.getElementById("summary");
const filterBar = document.getElementById("filters");
const clearBtn = document.getElementById("clear-completed");

let tasks = loadTasks();
let currentFilter = "all";

/* ---------- Saving and loading ---------- */

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem("my-tasks"));
    // If the saved data is ever corrupted, start fresh instead of breaking
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem("my-tasks", JSON.stringify(tasks));
  } catch (err) {
    // Storage can be blocked (private mode, full disk). The app still works, it just won't remember.
  }
}

/* ---------- Task actions ---------- */

function addTask(text) {
  tasks.push({
    id: Date.now(),
    text: text,
    completed: false,
  });
  update();
}

function deleteTask(id) {
  const index = getVisibleTasks().findIndex((t) => t.id === id);
  tasks = tasks.filter((task) => task.id !== id);
  update();

  // The deleted row is gone, so hand focus to its neighbour (or the input).
  // Otherwise keyboard and screen reader users get dropped back at the top of the page.
  const buttons = taskList.querySelectorAll(".delete-btn");
  const next = buttons[Math.min(index, buttons.length - 1)];
  (next || input).focus();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const index = getVisibleTasks().findIndex((t) => t.id === id);
  task.completed = !task.completed;
  update();

  // The list is rebuilt on every change, so put focus back where the user was.
  const same = taskList.querySelector(`li[data-id="${id}"] input`);
  if (same) {
    same.focus();
    return;
  }
  // The task vanished from this filter (e.g. ticked off while viewing "Active")
  const boxes = taskList.querySelectorAll("input[type='checkbox']");
  const next = boxes[Math.min(index, boxes.length - 1)];
  (next || input).focus();
}

/* ---------- Building the list ---------- */

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;
  if (task.completed) li.classList.add("completed");

  const textId = `task-text-${task.id}`;

  const text = document.createElement("span");
  text.className = "task-text";
  text.id = textId;
  text.textContent = task.text;

  // The checkbox is named after the task itself, so a screen reader says
  // "Buy milk, checkbox, checked" instead of ten identical "Mark as completed".
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-labelledby", textId);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  li.append(checkbox, text, deleteBtn);
  return li;
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function render() {
  taskList.innerHTML = "";

  const visible = getVisibleTasks();

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent =
      tasks.length === 0 ? "No tasks yet. Add one above!" : "Nothing to show here.";
    taskList.appendChild(empty);
  } else {
    visible.forEach((task) => taskList.appendChild(createTaskElement(task)));
  }

  updateSummary();
}

function updateSummary() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;

  if (total === 0) {
    summary.textContent = "Nothing here yet. Add your first task!";
  } else if (done === total) {
    summary.textContent = "All done. Nice work!";
    // The emoji is decoration, so screen readers skip it
    const party = document.createElement("span");
    party.setAttribute("aria-hidden", "true");
    party.textContent = " 🎉";
    summary.appendChild(party);
  } else {
    summary.textContent = `${done} of ${total} ${total === 1 ? "task" : "tasks"} completed`;
  }

  clearBtn.hidden = done === 0;
}

function update() {
  saveTasks();
  render();
}

/* ---------- Events ---------- */

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  const text = input.value.trim();

  if (text === "") {
    errorMessage.textContent = "Please type something first.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  clearError();
  addTask(text);
  input.value = "";
  input.focus();
});

filterBar.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;

  currentFilter = button.dataset.filter;

  document.querySelectorAll(".filter").forEach((btn) => {
    const isActive = btn === button;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  render();
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  update();

  // The button hides itself once nothing is completed, so move focus somewhere sensible
  const activeFilter = filterBar.querySelector(".filter.active");
  (activeFilter || input).focus();
});

input.addEventListener("input", clearError);

function clearError() {
  errorMessage.textContent = "";
  input.removeAttribute("aria-invalid");
}

render();