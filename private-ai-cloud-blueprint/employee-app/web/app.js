const API = "/api/v1";
let token = localStorage.getItem("emp_token");
let conversationId = null;

async function ensureLogin() {
  if (token) return;
  const r = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: prompt("Email"), password: prompt("Password") }),
  });
  token = (await r.json()).access_token;
  localStorage.setItem("emp_token", token);
}

function append(role, text, citations) {
  const el = document.createElement("div");
  el.className = role;
  el.innerHTML = `<strong>${role === "user" ? "You" : "AI"}:</strong> ${text}`;
  if (citations && citations.length) {
    const s = document.createElement("ul");
    citations.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.filename} — Page ${c.page ?? "n/a"}`;
      s.appendChild(li);
    });
    el.appendChild(s);
  }
  document.getElementById("chat").appendChild(el);
}

document.getElementById("send").onclick = async () => {
  await ensureLogin();
  const message = document.getElementById("q").value;
  append("user", message);
  const r = await fetch(API + "/chat/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });
  const data = await r.json();
  conversationId = data.conversation_id;
  append("assistant", data.answer, data.citations);
};
