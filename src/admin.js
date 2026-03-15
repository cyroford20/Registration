const rowsEl = document.querySelector("#rows");
const statusEl = document.querySelector("#status");
const addBtn = document.querySelector("#add");
const saveBtn = document.querySelector("#save");
const openQrRegisterBtn = document.querySelector("#openQrRegister");
const exportUsersExcelBtn = document.querySelector("#exportUsersExcel");
const exportUsersPdfBtn = document.querySelector("#exportUsersPdf");

const ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "adminAuthenticated";

function ensureAdminAccess() {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") {
    return true;
  }

  const entered = window.prompt("Enter admin password:");
  if (entered === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    return true;
  }

  if (entered !== null) {
    window.alert("Incorrect password");
  }
  window.location.href = "/";
  return false;
}

if (!ensureAdminAccess()) {
  throw new Error("Unauthorized admin access");
}

const usersRowsEl = document.querySelector("#usersRows");
const regStatusEl = document.querySelector("#regStatus");
const userFullnameInput = document.querySelector("#userFullname");
const userEmailInput = document.querySelector("#userEmail");
const userCollegeInput = document.querySelector("#userCollege");
const userGenderSelect = document.querySelector("#userGender");
const userCampusSelect = document.querySelector("#userCampus");
const userRoleSelect = document.querySelector("#userRole");
const registerBtn = document.querySelector("#registerBtn");

let sectors = [];
let users = [];

function setRegStatus(message, kind = "") {
  if (!regStatusEl) return;
  regStatusEl.textContent = message;
  regStatusEl.style.opacity = message ? "1" : "0";
  regStatusEl.dataset.kind = kind;
}

function renderUsers() {
  if (!usersRowsEl) return;
  usersRowsEl.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");

    const fullnameTd = document.createElement("td");
    fullnameTd.textContent = user.fullname;
    fullnameTd.style.color = "#ffffff";

    const emailTd = document.createElement("td");
    emailTd.textContent = user.email;
    emailTd.style.color = "#ffffff";

    const genderTd = document.createElement("td");
    genderTd.textContent = user.gender;
    genderTd.style.color = "rgba(200, 210, 255, 0.8)";

    const collegeTd = document.createElement("td");
    collegeTd.textContent = user.college;
    collegeTd.style.color = "rgba(200, 210, 255, 0.8)";

    const campusTd = document.createElement("td");
    campusTd.textContent = user.campus;
    campusTd.style.color = "rgba(200, 210, 255, 0.8)";
    campusTd.style.fontWeight = "700";

    const roleTd = document.createElement("td");
    roleTd.textContent = user.role;
    roleTd.style.color = "rgba(200, 210, 255, 0.8)";

    const dateTd = document.createElement("td");
    dateTd.textContent = new Date(user.registered_at).toLocaleString();
    dateTd.style.color = "rgba(200, 210, 255, 0.7)";
    dateTd.style.fontSize = "0.8rem";

    const deleteTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "iconBtn";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => deleteUser(user.id));
    deleteTd.appendChild(delBtn);

    tr.appendChild(fullnameTd);
    tr.appendChild(emailTd);
    tr.appendChild(genderTd);
    tr.appendChild(collegeTd);
    tr.appendChild(campusTd);
    tr.appendChild(roleTd);
    tr.appendChild(dateTd);
    tr.appendChild(deleteTd);

    usersRowsEl.appendChild(tr);
  });
}

async function loadUsers() {
  if (!usersRowsEl) return;
  try {
    const res = await fetch("api/users.php", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    users = data.users || [];
    renderUsers();
  } catch (e) {
    setRegStatus("Error loading users: " + e.message, "error");
  }
}

async function registerUser() {
  const fullname = userFullnameInput.value.trim();
  const email = userEmailInput.value.trim();
  const college = userCollegeInput.value.trim();
  const gender = userGenderSelect.value;
  const campus = userCampusSelect.value;
  const role = userRoleSelect.value;

  if (!fullname || !email || !college || !gender || !campus || !role) {
    setRegStatus("Please fill in all fields", "error");
    return;
  }

  try {
    setRegStatus("Registering…");
    const res = await fetch("api/users.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email, college, gender, campus, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    users = data.users || [];
    renderUsers();
    userFullnameInput.value = "";
    userEmailInput.value = "";
    userCollegeInput.value = "";
    userGenderSelect.value = "";
    userCampusSelect.value = "";
    userRoleSelect.value = "";

    // Clear success message after 3 seconds
    setTimeout(() => setRegStatus(""), 3000);
  } catch (e) {
    setRegStatus(e.message, "error");
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to remove this user?")) {
    return;
  }

  try {
    setRegStatus("Removing…");
    const res = await fetch(`api/users.php?id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Delete failed");
    }

    users = data.users || [];
    renderUsers();
    setRegStatus("User removed successfully!", "success");

    setTimeout(() => setRegStatus(""), 3000);
  } catch (e) {
    setRegStatus(e.message, "error");
  }
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function buildUsersCsv(usersList) {
  const headers = [
    "Full Name",
    "Email",
    "Gender",
    "College",
    "Campus",
    "Role",
    "Spin",
    "Prize",
    "Registered At",
    "Updated At",
  ];

  const lines = [headers.map(escapeCsvValue).join(",")];

  usersList.forEach((user) => {
    lines.push(
      [
        user.fullname,
        user.email,
        user.gender,
        user.college,
        user.campus,
        user.role,
        user.spin,
        user.prizeGet,
        user.registered_at,
        user.updated_at,
      ]
        .map(escapeCsvValue)
        .join(",")
    );
  });

  return lines.join("\r\n");
}

async function exportUsersToExcel() {
  try {
    setStatus("Preparing Excel export...");
    const usersList = await fetchUsersForExport();

    if (!usersList.length) {
      setStatus("No users to export", "error");
      return;
    }

    const date = new Date().toISOString().slice(0, 10);

    if (window.XLSX && typeof window.XLSX.utils?.book_new === "function") {
      const exportRows = usersList.map((user) => ({
        "Full Name": user.fullname || "",
        Email: user.email || "",
        Gender: user.gender || "",
        College: user.college || "",
        Campus: user.campus || "",
        Role: user.role || "",
        Spin: user.spin || "",
        Prize: user.prizeGet || "",
        "Registered At": user.registered_at || "",
        "Updated At": user.updated_at || "",
      }));

      const workbook = window.XLSX.utils.book_new();
      const worksheet = window.XLSX.utils.json_to_sheet(exportRows);
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      window.XLSX.writeFile(workbook, `registered-users-${date}.xlsx`);
    } else {
      const csv = buildUsersCsv(usersList);
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `registered-users-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    setStatus("Excel export ready", "success");
    setTimeout(() => setStatus(""), 3000);
  } catch (e) {
    setStatus("Export failed: " + e.message, "error");
  }
}

async function fetchUsersForExport() {
  const res = await fetch("api/users.php", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load users");
  }

  const data = await res.json();
  return Array.isArray(data.users) ? data.users : [];
}

async function exportUsersToPdf() {
  try {
    setStatus("Preparing PDF export...");
    const usersList = await fetchUsersForExport();

    if (!usersList.length) {
      setStatus("No users to export", "error");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("PDF library failed to load");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const left = 26;
    const right = 26;
    const generatedAt = new Date();
    const fileDate = generatedAt.toISOString().slice(0, 10);
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(23, 63, 102);
    doc.text("Cyber Spin Wheel - Registered Users", left, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(88, 102, 120);
    doc.text(`Generated: ${generatedAt.toLocaleString()}`, left, 58);
    doc.text(`Total users: ${usersList.length}`, left, 76);

    doc.setDrawColor(225, 231, 236);
    doc.setLineWidth(1);
    doc.line(left, 88, pageWidth - right, 88);

    const tableBody = usersList.map((u) => [
      u.fullname || "",
      u.email || "",
      u.gender || "",
      u.college || "",
      u.campus || "",
      u.role || "",
      u.spin || "",
      u.prizeGet || "",
      u.registered_at ? new Date(u.registered_at).toLocaleString() : "",
    ]);

    if (typeof doc.autoTable !== "function") {
      throw new Error("PDF table plugin failed to load");
    }

    doc.autoTable({
      startY: 118,
      margin: { left, right },
      head: [["Full Name", "Email", "Gender", "College", "Campus", "Role", "Spin", "Prize", "Registered At"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [20, 58, 97],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      bodyStyles: {
        textColor: [80, 80, 80],
        fillColor: [250, 250, 250],
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242],
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        lineColor: [225, 231, 236],
        lineWidth: 0.4,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 110 },
        2: { cellWidth: 58 },
        3: { cellWidth: 62 },
        4: { cellWidth: 60 },
        5: { cellWidth: 58 },
        6: { cellWidth: 44 },
        7: { cellWidth: 140 },
        8: { cellWidth: 110 },
      },
    });

    doc.save(`registered-users-${fileDate}.pdf`);
    setStatus("PDF export ready", "success");
    setTimeout(() => setStatus(""), 3000);
  } catch (e) {
    setStatus("Export failed: " + e.message, "error");
  }
}

function updateProbabilities() {
  const totalWeight = sectors.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
  const rows = Array.from(rowsEl.children);

  for (let i = 0; i < rows.length; i++) {
    const tr = rows[i];
    const sector = sectors[i];
    if (!sector) continue;

    // Columns: Label, Color, Text, Weight, Probability, Delete
    const probCell = tr.children[4];
    if (!probCell) continue;

    const w = Number(sector.weight) || 0;
    const p = totalWeight > 0 ? (w / totalWeight) * 100 : NaN;
    probCell.textContent = Number.isFinite(p) ? `${p.toFixed(2)}%` : "—";
  }
}

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.style.opacity = message ? "1" : "0";
  statusEl.dataset.kind = kind;
}

function createInput(value, type = "text", placeholder = "") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  if (placeholder) {
    input.placeholder = placeholder;
  }
  return input;
}

function render() {
  rowsEl.innerHTML = "";

  sectors.forEach((sector, index) => {
    const tr = document.createElement("tr");

    const labelTd = document.createElement("td");
    const labelInput = createInput(sector.label, "text", "Sector label");
    labelInput.addEventListener("input", () => (sectors[index].label = labelInput.value));
    labelTd.appendChild(labelInput);

    const colorTd = document.createElement("td");
    const colorInput = createInput(sector.color, "text", "#RRGGBB");
    colorInput.addEventListener("input", () => (sectors[index].color = colorInput.value));
    colorTd.appendChild(colorInput);

    const textTd = document.createElement("td");
    const textInput = createInput(sector.text, "text", "#RRGGBB");
    textInput.addEventListener("input", () => (sectors[index].text = textInput.value));
    textTd.appendChild(textInput);

    const weightTd = document.createElement("td");
    const weightInput = createInput(String(sector.weight ?? 1), "number");
    weightInput.min = "0";
    weightInput.step = "0.1";
    weightInput.addEventListener(
      "input",
      () => {
        sectors[index].weight = Number(weightInput.value || 0);
        updateProbabilities();
      }
    );
    weightTd.appendChild(weightInput);

    const probTd = document.createElement("td");
    probTd.textContent = "—";

    const deleteTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "iconBtn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      sectors.splice(index, 1);
      render();
    });
    deleteTd.appendChild(delBtn);

    tr.appendChild(labelTd);
    tr.appendChild(colorTd);
    tr.appendChild(textTd);
    tr.appendChild(weightTd);
    tr.appendChild(probTd);
    tr.appendChild(deleteTd);

    rowsEl.appendChild(tr);
  });

  updateProbabilities();
}

async function load() {
  setStatus("Loading…");
  const res = await fetch("api/config.php", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load config");
  const data = await res.json();
  if (!data || !Array.isArray(data.sectors)) throw new Error("Invalid config format");
  sectors = data.sectors;
  render();
  setStatus("");
}

async function save() {
  setStatus("Saving…");

  const payload = {
    version: 1,
    sectors,
  };

  const res = await fetch("api/config.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : "Save failed";
    setStatus(msg);
    return;
  }

  sectors = data.config?.sectors || sectors;
  render();
  setStatus("Saved.");
}

addBtn.addEventListener("click", () => {
  sectors.push({
    label: "New sector",
    color: "#FFBC03",
    text: "#FFFFFF",
    weight: 1,
  });
  render();
});

saveBtn.addEventListener("click", () => {
  save().catch((e) => setStatus(e.message || String(e)));
});

registerBtn?.addEventListener("click", () => {
  registerUser();
});

exportUsersExcelBtn?.addEventListener("click", () => {
  exportUsersToExcel();
});

exportUsersPdfBtn?.addEventListener("click", () => {
  exportUsersToPdf();
});

openQrRegisterBtn?.addEventListener("click", () => {
  window.open("/qr-register.html", "_blank", "noopener,noreferrer");
});

userFullnameInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") registerUser();
});

userEmailInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") registerUser();
});

// Load wheel config on page load
load().catch((e) => setStatus(e.message || String(e)));
