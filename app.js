(() => {
  "use strict";
  const STORAGE_KEY = "dailytrack.v1";
  const $ = (id) => document.getElementById(id);
  const today = () => new Date().toLocaleDateString("en-CA");
  const state = { items: [], logs: [] };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.items = Array.isArray(saved.items) ? saved.items : [];
      state.logs = Array.isArray(saved.logs) ? saved.logs : [];
    } catch (error) {
      console.error("DailyTrack: unable to read saved data", error);
      state.items = []; state.logs = [];
    }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function activeToday(item) {
    return item.startDate <= today() && (!item.endDate || item.endDate >= today());
  }
  function logFor(itemId, date = today()) {
    return state.logs.find(log => log.itemId === itemId && log.date === date);
  }
  function render() {
    const scheduled = state.items.filter(activeToday).sort((a,b) => a.time.localeCompare(b.time));
    const done = scheduled.filter(item => logFor(item.id)?.status === "taken").length;
    $("progressText").textContent = `${done} of ${scheduled.length} completed`;
    $("progressBar").style.width = scheduled.length ? `${done / scheduled.length * 100}%` : "0%";
    $("schedule").innerHTML = "";
    if (!scheduled.length) $("schedule").innerHTML = '<div class="empty">No items scheduled for today. Add your first item.</div>';
    scheduled.forEach(item => {
      const log = logFor(item.id);
      const card = document.createElement("article");
      card.className = "item";
      const info = document.createElement("div");
      const title = document.createElement("h3"); title.textContent = item.name;
      const detail = document.createElement("p"); detail.textContent = `${item.dosage || "Dosage not set"} · ${item.time}`;
      const status = document.createElement("p"); status.className = `status ${log?.status === "skipped" ? "skipped" : ""}`;
      status.textContent = log ? (log.status === "taken" ? "Taken today" : "Skipped today") : "Pending";
      info.append(title, detail, status);
      const actions = document.createElement("div"); actions.className = "item-actions";
      if (!log) {
        actions.append(makeButton("Taken", "small", () => setStatus(item.id, "taken")), makeButton("Skip", "small secondary", () => setStatus(item.id, "skipped")));
      } else {
        actions.append(makeButton("Undo", "small secondary", () => undo(item.id)));
      }
      actions.append(makeButton("Edit", "small secondary", () => openEdit(item)));
      actions.append(makeButton("Delete", "small secondary", () => removeItem(item.id)));
      card.append(info, actions); $("schedule").append(card);
    });
    $("history").innerHTML = "";
    const recent = [...state.logs].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,10);
    if (!recent.length) $("history").innerHTML = '<div class="empty">No activity recorded yet.</div>';
    recent.forEach(log => {
      const item = state.items.find(x => x.id === log.itemId);
      const row = document.createElement("div"); row.className = "history-row";
      const left = document.createElement("span"); left.textContent = `${item?.name || "Deleted item"} · ${log.date}`;
      const right = document.createElement("strong"); right.textContent = log.status === "taken" ? "Taken" : "Skipped";
      row.append(left,right); $("history").append(row);
    });
  }
  function makeButton(label, className, handler) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label;
    button.className = className; button.addEventListener("click", handler); return button;
  }
  function setStatus(itemId, status) {
    state.logs = state.logs.filter(log => !(log.itemId === itemId && log.date === today()));
    state.logs.push({itemId, date: today(), status, updatedAt: new Date().toISOString()});
    save(); render();
  }
  function undo(itemId) {
    state.logs = state.logs.filter(log => !(log.itemId === itemId && log.date === today()));
    save(); render();
  }
  function removeItem(itemId) {
    if (!confirm("Delete this item and its history?")) return;
    state.items = state.items.filter(item => item.id !== itemId);
    state.logs = state.logs.filter(log => log.itemId !== itemId);
    save(); render();
  }
  function openEdit(item) {
    $("formTitle").textContent = "Edit item";
    $("itemId").value = item.id; $("name").value = item.name;
    $("dosage").value = item.dosage || ""; $("time").value = item.time;
    $("startDate").value = item.startDate; $("endDate").value = item.endDate || "";
    $("notes").value = item.notes || ""; $("formError").textContent = "";
    $("itemDialog").showModal();
  }
  function resetForm() {
    $("itemForm").reset(); $("itemId").value = ""; $("startDate").value = today();
    $("time").value = "08:00"; $("formTitle").textContent = "Add medicine or supplement";
    $("formError").textContent = "";
  }
  $("addBtn").addEventListener("click", () => { resetForm(); $("itemDialog").showModal(); });
  $("closeItem").addEventListener("click", () => $("itemDialog").close());
  $("cancelItem").addEventListener("click", () => $("itemDialog").close());
  $("itemForm").addEventListener("submit", event => {
    event.preventDefault();
    const item = {
      id: $("itemId").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      name: $("name").value.trim(), dosage: $("dosage").value.trim(), time: $("time").value,
      startDate: $("startDate").value, endDate: $("endDate").value, notes: $("notes").value.trim()
    };
    if (!item.name || !item.time || !item.startDate || (item.endDate && item.endDate < item.startDate)) {
      $("formError").textContent = "Enter a name, time, valid start date, and an end date after the start date.";
      return;
    }
    const index = state.items.findIndex(x => x.id === item.id);
    if (index >= 0) state.items[index] = item; else state.items.push(item);
    save(); render(); $("itemDialog").close();
  });
  $("backupBtn").addEventListener("click", () => $("backupDialog").showModal());
  $("closeBackup").addEventListener("click", () => $("backupDialog").close());
  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `dailytrack-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url);
    $("backupMessage").textContent = "Backup export started.";
  });
  $("importFile").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported.items) || !Array.isArray(imported.logs)) throw new Error("Invalid backup format");
      state.items = imported.items; state.logs = imported.logs; save(); render();
      $("backupMessage").textContent = "Backup restored successfully.";
    } catch (error) { $("backupMessage").textContent = `Could not restore: ${error.message}`; }
    event.target.value = "";
  });
  load(); render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker registration failed", error)));
  }
})();