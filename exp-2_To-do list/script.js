const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const errorMessage = document.getElementById("error-message");
const taskList = document.getElementById("task-list");
const summary = document.getElementById("summary");
const filterBar = document.getElementById("filters");
const clearBtn = document.getElementById("clear-completed");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = localStorage.getItem("my-tasks");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem("my-tasks", JSON.stringify(tasks));
  } catch (err) {
  }
}

function addTask(text) {
  tasks.push({
    id: Date.now(),
    text: text,
    completed: false,
  });
  update();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  update();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    update();
  }
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  if (task.completed) li.classList.add("completed");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Mark as completed");
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", "Delete task");
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
    summary.textContent = "All done. Nice work! 🎉";
  } else {
    summary.textContent = `${done} of ${total} tasks completed`;
  }

  clearBtn.hidden = done === 0;
}

function update() {
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  const text = input.value.trim();

  if (text === "") {
    errorMessage.textContent = "Please type something first.";
    return;
  }

  errorMessage.textContent = "";
  addTask(text);
  input.value = "";
  input.focus();
});

filterBar.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;

  currentFilter = button.dataset.filter;

  document.querySelectorAll(".filter").forEach((btn) => {
    btn.classList.toggle("active", btn === button);
  });

  render();
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  update();
});

input.addEventListener("input", () => {
  errorMessage.textContent = "";
});

render();
