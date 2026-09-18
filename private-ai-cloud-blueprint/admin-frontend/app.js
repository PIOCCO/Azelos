const API = "/api/v1";
let token = localStorage.getItem("paic_token");

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
  const r = await fetch(API + path, { ...opts, headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function login() {
  if (token) return;
  const body = { email: "admin@company.local", password: "admin123!" };
  const r = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  token = (await r.json()).access_token;
  localStorage.setItem("paic_token", token);
}

async function refresh() {
  const docs = await api("/documents");
  document.getElementById("docs").innerHTML = docs.map((d) => `<li>${d.filename} — ${d.status}</li>`).join("");
  document.getElementById("usage").textContent = JSON.stringify(await api("/admin/usage"), null, 2);
}

document.getElementById("addDept").onclick = async () => {
  const name = document.getElementById("deptName").value;
  await api("/admin/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
  refresh();
};

const drop = document.getElementById("drop");
drop.onclick = () => document.getElementById("file").click();
drop.ondragover = (e) => { e.preventDefault(); };
drop.ondrop = async (e) => {
  e.preventDefault();
  for (const f of e.dataTransfer.files) await upload(f);
};
document.getElementById("file").onchange = async (e) => {
  for (const f of e.target.files) await upload(f);
};

async function upload(file) {
  const fd = new FormData();
  fd.append("file", file);
  await fetch(API + "/documents/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  refresh();
}

login().then(refresh).catch(console.error);
