/* ============================================================
   AI Customer Support — Main JavaScript
   All API calls, auth handling, and UI helpers live here.
   ============================================================ */

// Backend URL — must match where uvicorn is running
// Live Server opens files on port 5500, backend runs on port 8000
const API = "https://ai-customer-support-g9a1.onrender.com";

/* ─────────────────────────────────────────────────────────────
   TOKEN / USER  (localStorage)
───────────────────────────────────────────────────────────── */
function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user",  JSON.stringify(user));
}
function getToken() { return localStorage.getItem("token"); }
function getUser()  {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}
function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
function isLoggedIn() { return !!getToken(); }


/* ─────────────────────────────────────────────────────────────
   HTTP HELPER
───────────────────────────────────────────────────────────── */
async function http(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token   = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(API + path, options);

  // Auto-logout on 401
  if (res.status === 401) {
    clearAuth();
    window.location.href = "login.html";
    return;
  }

  if (res.status === 204) return;   // No content (delete)

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Something went wrong");
  return data;
}

const get    = (path)        => http("GET",    path);
const post   = (path, body)  => http("POST",   path, body);
const patch  = (path, body)  => http("PATCH",  path, body);
const del    = (path)        => http("DELETE", path);


/* ─────────────────────────────────────────────────────────────
   TOAST  (pop-up notifications)
───────────────────────────────────────────────────────────── */
function toast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const el    = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => el.remove(), 3500);
}


/* ─────────────────────────────────────────────────────────────
   NAVBAR  (injected into every page)
───────────────────────────────────────────────────────────── */
function renderNavbar() {
  const user    = getUser();
  if (!user) return;

  const navEl = document.getElementById("navbar");
  if (!navEl) return;

  // Build nav links based on role
  let links = "";
  if (user.role === "admin") {
    links = `
      <a class="navbar__link" href="admin.html">📊 Dashboard</a>
      <a class="navbar__link" href="admin-tickets.html">🎫 All Tickets</a>`;
  } else if (user.role === "agent") {
    links = `<a class="navbar__link" href="agent.html">📋 My Queue</a>`;
  } else {
    links = `
      <a class="navbar__link" href="dashboard.html">🎫 My Tickets</a>
      <a class="navbar__link" href="new-ticket.html">➕ New Ticket</a>`;
  }

  navEl.innerHTML = `
    <div class="navbar__inner">
      <a class="navbar__logo" href="${user.role === 'admin' ? 'admin.html' : user.role === 'agent' ? 'agent.html' : 'dashboard.html'}">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#2563eb"/>
          <path d="M8 10h16v2H8zM8 15h12v2H8zM8 20h10v2H8z" fill="white"/>
          <circle cx="24" cy="21" r="5" fill="#10b981"/>
          <path d="M22 21l1.5 1.5L26 19" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>SupportAI</span>
      </a>
      <div class="navbar__links">${links}</div>
      <div class="navbar__user">
        <div class="navbar__avatar">${user.name.charAt(0).toUpperCase()}</div>
        <span class="hidden" id="nav-name" style="display:block;font-weight:500">${user.name}</span>
        <span class="navbar__role">${user.role}</span>
        <button class="btn-logout" onclick="logout()">Logout</button>
      </div>
    </div>`;
}

function logout() {
  clearAuth();
  window.location.href = "login.html";
}


/* ─────────────────────────────────────────────────────────────
   BADGE HELPERS
───────────────────────────────────────────────────────────── */
function statusBadge(s)   { return `<span class="badge badge--${s}">${s}</span>`; }
function priorityBadge(p) { return `<span class="badge badge--${p}">${p}</span>`; }
function categoryBadge(c) { return `<span class="badge badge--${c}">${c}</span>`; }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 60)  return m + "m ago";
  const h    = Math.floor(m / 60);
  if (h < 24)  return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}


/* ─────────────────────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────────────────────── */
function spinner(msg = "Loading...") {
  return `<div class="spinner-wrap"><div class="spinner"></div><p>${msg}</p></div>`;
}


/* ─────────────────────────────────────────────────────────────
   AUTH GUARD  (call at top of every protected page)
───────────────────────────────────────────────────────────── */
function requireAuth(allowedRoles = null) {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return null;
  }
  const user = getUser();
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct home
    const home = { customer: "dashboard.html", agent: "agent.html", admin: "admin.html" };
    window.location.href = home[user.role];
    return null;
  }
  return user;
}


/* ─────────────────────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────────────────────── */
async function initLogin() {
  if (isLoggedIn()) {
    const user = getUser();
    const home = { customer: "dashboard.html", agent: "agent.html", admin: "admin.html" };
    window.location.href = home[user.role] || "dashboard.html";
    return;
  }

  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn   = form.querySelector("button[type=submit]");
    const email = document.getElementById("email").value;
    const pass  = document.getElementById("password").value;

    btn.disabled    = true;
    btn.textContent = "Signing in…";

    try {
      const data = await post("/auth/login", { email, password: pass });
      saveAuth(data.access_token, data.user);
      toast(`Welcome back, ${data.user.name}!`);
      const home = { customer: "dashboard.html", agent: "agent.html", admin: "admin.html" };
      setTimeout(() => { window.location.href = home[data.user.role]; }, 600);
    } catch (err) {
      toast(err.message, "error");
      btn.disabled    = false;
      btn.textContent = "Sign in";
    }
  });

  // Toggle password visibility
  document.getElementById("toggle-pw")?.addEventListener("click", () => {
    const inp = document.getElementById("password");
    inp.type  = inp.type === "password" ? "text" : "password";
  });
}


/* ─────────────────────────────────────────────────────────────
   REGISTER PAGE
───────────────────────────────────────────────────────────── */
async function initRegister() {
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn  = form.querySelector("button[type=submit]");
    const name = document.getElementById("name").value.trim();
    const email= document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (pass.length < 6) { toast("Password must be at least 6 characters", "error"); return; }

    btn.disabled    = true;
    btn.textContent = "Creating account…";

    try {
      await post("/auth/register", { name, email, password: pass, role });
      toast("Account created! Please sign in.");
      setTimeout(() => { window.location.href = "login.html"; }, 800);
    } catch (err) {
      toast(err.message, "error");
      btn.disabled    = false;
      btn.textContent = "Create account";
    }
  });

  document.getElementById("toggle-pw")?.addEventListener("click", () => {
    const inp = document.getElementById("password");
    inp.type  = inp.type === "password" ? "text" : "password";
  });
}


/* ─────────────────────────────────────────────────────────────
   CUSTOMER DASHBOARD
───────────────────────────────────────────────────────────── */
async function initDashboard() {
  const user = requireAuth(["customer", "agent", "admin"]);
  if (!user) return;

  renderNavbar();

  document.getElementById("user-name").textContent = user.name;

  const listEl = document.getElementById("ticket-list");
  listEl.innerHTML = spinner();

  try {
    const tickets = await get("/tickets/my");

    // Stats
    document.getElementById("stat-total").textContent    = tickets.length;
    document.getElementById("stat-open").textContent     = tickets.filter(t => t.status === "open").length;
    document.getElementById("stat-pending").textContent  = tickets.filter(t => t.status === "pending").length;
    document.getElementById("stat-resolved").textContent = tickets.filter(t => t.status === "resolved").length;

    if (tickets.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📭</div>
          <h3>No tickets yet</h3>
          <p>Submit your first support request to get started.</p>
          <a href="new-ticket.html" class="btn btn--primary">➕ New Ticket</a>
        </div>`;
      return;
    }

    listEl.innerHTML = tickets.map(t => ticketCardHTML(t)).join("");

    // Make each card clickable
    listEl.querySelectorAll(".ticket-card").forEach(card => {
      card.addEventListener("click", () => {
        window.location.href = `ticket.html?id=${card.dataset.id}`;
      });
    });

  } catch (err) {
    toast(err.message, "error");
    listEl.innerHTML = `<p class="text-center" style="color:var(--red)">Failed to load tickets.</p>`;
  }
}

function ticketCardHTML(t) {
  return `
    <div class="ticket-card" data-id="${t.id}">
      <div class="ticket-card__meta">
        <span class="ticket-card__id">#${t.id}</span>
        ${statusBadge(t.status)} ${priorityBadge(t.priority)} ${categoryBadge(t.category)}
      </div>
      <div class="ticket-card__title">${t.title}</div>
      <div class="ticket-card__desc">${t.description}</div>
      ${t.ai_summary ? `<div class="ticket-card__ai">🤖 ${t.ai_summary}</div>` : ""}
      <div class="ticket-card__footer">
        <span>🕐 ${timeAgo(t.created_at)}</span>
        <span>💬 View thread →</span>
      </div>
    </div>`;
}


/* ─────────────────────────────────────────────────────────────
   NEW TICKET PAGE
───────────────────────────────────────────────────────────── */
async function initNewTicket() {
  const user = requireAuth(["customer", "agent", "admin"]);
  if (!user) return;

  renderNavbar();

  const form       = document.getElementById("ticket-form");
  const descInput  = document.getElementById("description");
  const previewEl  = document.getElementById("ai-preview");
  let   analyzing  = false;

  // AI live preview on blur
  descInput.addEventListener("blur", async () => {
    const desc = descInput.value.trim();
    if (desc.length < 10 || analyzing) return;
    analyzing = true;
    previewEl.innerHTML = `
      <div class="ai-preview">
        <div class="ai-preview__title">🤖 AI Analysis <span style="font-weight:400;color:#3b82f6;font-size:.78rem">Analysing…</span></div>
      </div>`;

    try {
      const result = await post("/ai/analyze", { description: desc });
      previewEl.innerHTML = `
        <div class="ai-preview">
          <div class="ai-preview__title">🤖 AI Analysis Preview</div>
          <div class="ai-preview__badges">
            ${categoryBadge(result.category)}
            ${priorityBadge(result.priority)}
            <span class="badge badge--${result.sentiment === 'negative' ? 'urgent' : result.sentiment === 'positive' ? 'resolved' : 'pending'}">${result.sentiment} sentiment</span>
          </div>
          ${result.summary ? `<div class="ai-preview__summary"><strong>Summary:</strong> ${result.summary}</div>` : ""}
        </div>`;
    } catch (_) {
      previewEl.innerHTML = "";
    } finally {
      analyzing = false;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn   = form.querySelector("button[type=submit]");
    const title = document.getElementById("title").value.trim();
    const desc  = descInput.value.trim();

    if (title.length < 5)  { toast("Title must be at least 5 characters", "error"); return; }
    if (desc.length  < 10) { toast("Description must be at least 10 characters", "error"); return; }

    btn.disabled    = true;
    btn.textContent = "Submitting…";

    try {
      const ticket = await post("/tickets/", { title, description: desc });
      toast("Ticket submitted! AI has analysed your request. ✅");
      setTimeout(() => { window.location.href = `ticket.html?id=${ticket.id}`; }, 800);
    } catch (err) {
      toast(err.message, "error");
      btn.disabled    = false;
      btn.textContent = "Submit Ticket";
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   TICKET DETAIL PAGE
───────────────────────────────────────────────────────────── */
async function initTicketDetail() {
  const user = requireAuth();
  if (!user) return;

  renderNavbar();

  const params   = new URLSearchParams(window.location.search);
  const ticketId = params.get("id");
  if (!ticketId) { window.location.href = "dashboard.html"; return; }

  const headerEl  = document.getElementById("ticket-header");
  const threadEl  = document.getElementById("thread");
  const replyEl   = document.getElementById("reply-section");

  headerEl.innerHTML = spinner();
  threadEl.innerHTML = spinner("Loading messages…");

  let ticket = null;

  async function loadTicket() {
    try {
      ticket = await get(`/tickets/${ticketId}`);
      renderHeader(ticket);
      renderThread(ticket.messages);
      if ((user.role === "agent" || user.role === "admin") && ticket.status !== "resolved" && ticket.status !== "closed") {
        renderReplyBox();
      }
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function renderHeader(t) {
    headerEl.innerHTML = `
      <div class="ticket-detail__header">
        <div class="ticket-card__meta">
          <span class="ticket-card__id">#${t.id}</span>
          ${statusBadge(t.status)} ${priorityBadge(t.priority)} ${categoryBadge(t.category)}
        </div>
        <div class="ticket-detail__title">${t.title}</div>
        <p style="color:var(--gray);font-size:.9rem">${t.description}</p>
        ${t.ai_summary ? `
          <div class="ticket-detail__ai">
            <div class="ticket-detail__ai-label">🤖 AI Analysis</div>
            <p>${t.ai_summary}</p>
          </div>` : ""}
        <div class="ticket-detail__meta">
          <div class="meta-item"><label>Submitted by</label><span>${t.owner_name || "—"}</span></div>
          <div class="meta-item"><label>Assigned to</label><span>${t.assignee_name || "Unassigned"}</span></div>
          <div class="meta-item"><label>Created</label><span>${formatDate(t.created_at)}</span></div>
        </div>
      </div>`;
  }

  function renderThread(messages) {
    const count = messages ? messages.length : 0;
    if (count === 0) {
      threadEl.innerHTML = `
        <div class="thread">
          <h2>Conversation (0)</h2>
          <p style="color:var(--gray);text-align:center;padding:30px 0">No messages yet.</p>
        </div>`;
      return;
    }

    const msgsHTML = messages.map(m => {
      const type = m.sender_type;
      const name = m.sender_name || (type === "ai" ? "AI Assistant" : type === "agent" ? "Agent" : "Customer");
      const icon = type === "ai" ? "🤖" : type === "agent" ? "🎧" : "👤";
      return `
        <div class="msg msg--${type}">
          <div class="msg__avatar msg__avatar--${type}">${icon}</div>
          <div class="msg__body">
            <div class="msg__meta">${name} · ${formatDate(m.created_at)}</div>
            <div class="msg__bubble msg__bubble--${type}">${m.message}</div>
          </div>
        </div>`;
    }).join("");

    threadEl.innerHTML = `
      <div class="thread">
        <h2>Conversation (${count})</h2>
        <div class="messages">${msgsHTML}</div>
      </div>`;
  }

  function renderReplyBox() {
    replyEl.innerHTML = `
      <div class="reply-box">
        <div class="reply-box__header">
          <h3>Post a Reply</h3>
          <button class="btn btn--ghost btn--sm" id="ai-suggest-btn">🤖 AI Suggest</button>
        </div>
        <textarea id="reply-msg" placeholder="Write your reply…" rows="4"></textarea>
        <div class="reply-box__footer">
          <div class="status-change">
            <label>Change status:</label>
            <select id="reply-status">
              <option value="">— no change —</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button class="btn btn--primary" id="send-reply-btn">Send Reply ✈️</button>
        </div>
      </div>`;

    // AI suggest button
    document.getElementById("ai-suggest-btn").addEventListener("click", async () => {
      const btn = document.getElementById("ai-suggest-btn");
      btn.disabled    = true;
      btn.textContent = "🤖 Generating…";
      try {
        const result = await get(`/ai/suggest-reply/${ticketId}`);
        document.getElementById("reply-msg").value = result.suggested_reply;
        toast("AI suggestion loaded ✅");
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled    = false;
        btn.textContent = "🤖 AI Suggest";
      }
    });

    // Send reply
    document.getElementById("send-reply-btn").addEventListener("click", async () => {
      const msg         = document.getElementById("reply-msg").value.trim();
      const statusChange= document.getElementById("reply-status").value;
      if (!msg) { toast("Reply cannot be empty", "error"); return; }

      const btn = document.getElementById("send-reply-btn");
      btn.disabled    = true;
      btn.textContent = "Sending…";

      try {
        await post(`/tickets/${ticketId}/messages`, {
          message      : msg,
          status_change: statusChange || null
        });
        toast("Reply sent ✅");
        document.getElementById("reply-msg").value = "";
        document.getElementById("reply-status").value = "";
        await loadTicket();    // Refresh
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled    = false;
        btn.textContent = "Send Reply ✈️";
      }
    });
  }

  await loadTicket();
}


/* ─────────────────────────────────────────────────────────────
   AGENT DASHBOARD
───────────────────────────────────────────────────────────── */
async function initAgent() {
  const user = requireAuth(["agent", "admin"]);
  if (!user) return;

  renderNavbar();
  document.getElementById("agent-name").textContent = user.name;

  const listEl  = document.getElementById("ticket-list");
  let   activeTab = "mine";

  async function loadTickets(tab) {
    listEl.innerHTML = spinner();
    try {
      const path    = tab === "mine" ? "/agent/tickets" : "/agent/all-tickets";
      const tickets = await get(path);

      document.getElementById("stat-assigned").textContent = tab === "mine" ? tickets.length : "—";

      if (tickets.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">📭</div>
            <h3>${tab === "mine" ? "No tickets assigned to you yet" : "No open tickets"}</h3>
          </div>`;
        return;
      }

      listEl.innerHTML = tickets.map(t => ticketCardHTML(t)).join("");
      listEl.querySelectorAll(".ticket-card").forEach(card => {
        card.addEventListener("click", () => {
          window.location.href = `ticket.html?id=${card.dataset.id}`;
        });
      });
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = btn.dataset.tab;
      loadTickets(activeTab);
    });
  });

  document.getElementById("refresh-btn").addEventListener("click", () => loadTickets(activeTab));

  loadTickets("mine");
}


/* ─────────────────────────────────────────────────────────────
   ADMIN DASHBOARD
───────────────────────────────────────────────────────────── */
async function initAdmin() {
  const user = requireAuth(["admin"]);
  if (!user) return;

  renderNavbar();

  try {
    const stats = await get("/admin/dashboard");

    document.getElementById("s-total").textContent     = stats.total_tickets;
    document.getElementById("s-open").textContent      = stats.open_tickets;
    document.getElementById("s-pending").textContent   = stats.pending_tickets;
    document.getElementById("s-resolved").textContent  = stats.resolved_tickets;
    document.getElementById("s-closed").textContent    = stats.closed_tickets;
    document.getElementById("s-high").textContent      = stats.high_priority;
    document.getElementById("s-urgent").textContent    = stats.urgent_tickets;
    document.getElementById("s-unassigned").textContent= stats.unassigned_tickets;
  } catch (err) {
    toast(err.message, "error");
  }
}


/* ─────────────────────────────────────────────────────────────
   ADMIN TICKETS PAGE
───────────────────────────────────────────────────────────── */
async function initAdminTickets() {
  const user = requireAuth(["admin"]);
  if (!user) return;

  renderNavbar();

  let page     = 1;
  let agents   = [];
  const PAGE_SIZE = 15;

  // Load agents for the assign dropdown
  try {
    agents = await get("/admin/agents");
  } catch (_) {}

  async function loadTickets() {
    const status   = document.getElementById("f-status").value;
    const priority = document.getElementById("f-priority").value;
    const category = document.getElementById("f-category").value;

    let url = `/admin/tickets?page=${page}&page_size=${PAGE_SIZE}`;
    if (status)   url += `&status=${status}`;
    if (priority) url += `&priority=${priority}`;
    if (category) url += `&category=${category}`;

    const tbody = document.getElementById("tickets-tbody");
    tbody.innerHTML = `<tr><td colspan="8">${spinner("Loading…")}</td></tr>`;

    try {
      const data       = await get(url);
      const { total, tickets } = data;

      document.getElementById("total-count").textContent = total;

      if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:40px">No tickets found.</td></tr>`;
        return;
      }

      tbody.innerHTML = tickets.map(t => {
        const agentOptions = agents.map(a =>
          `<option value="${a.id}" ${t.assigned_to === a.id ? "selected" : ""}>${a.name}</option>`
        ).join("");

        return `
          <tr>
            <td><span class="ticket-card__id">#${t.id}</span></td>
            <td><a href="ticket.html?id=${t.id}" style="font-weight:600;color:var(--blue)">${t.title}</a></td>
            <td>${statusBadge(t.status)}</td>
            <td>${priorityBadge(t.priority)}</td>
            <td>${categoryBadge(t.category)}</td>
            <td>
              <select class="assign-select" data-id="${t.id}" style="width:130px;padding:4px 8px;font-size:.8rem">
                <option value="">Unassigned</option>
                ${agentOptions}
              </select>
            </td>
            <td>
              <select class="status-select" data-id="${t.id}" style="width:120px;padding:4px 8px;font-size:.8rem">
                <option value="open"     ${t.status==="open"     ?"selected":""}>Open</option>
                <option value="pending"  ${t.status==="pending"  ?"selected":""}>Pending</option>
                <option value="resolved" ${t.status==="resolved" ?"selected":""}>Resolved</option>
                <option value="closed"   ${t.status==="closed"   ?"selected":""}>Closed</option>
              </select>
            </td>
            <td>
              <button class="btn btn--danger btn--sm delete-btn" data-id="${t.id}" title="Delete">🗑️</button>
            </td>
          </tr>`;
      }).join("");

      // Update pagination info
      const totalPages = Math.ceil(total / PAGE_SIZE);
      document.getElementById("page-info").textContent = `Page ${page} of ${totalPages}`;
      document.getElementById("prev-btn").disabled     = page === 1;
      document.getElementById("next-btn").disabled     = page >= totalPages;

      // Assign handler
      tbody.querySelectorAll(".assign-select").forEach(sel => {
        sel.addEventListener("change", async () => {
          const agentId = sel.value;
          if (!agentId) return;
          try {
            await patch(`/tickets/${sel.dataset.id}/assign`, { agent_id: parseInt(agentId) });
            toast("Ticket assigned ✅");
          } catch (err) { toast(err.message, "error"); }
        });
      });

      // Status handler
      tbody.querySelectorAll(".status-select").forEach(sel => {
        sel.addEventListener("change", async () => {
          try {
            await patch(`/tickets/${sel.dataset.id}/status`, { status: sel.value });
            toast("Status updated ✅");
          } catch (err) { toast(err.message, "error"); }
        });
      });

      // Delete handler
      tbody.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this ticket permanently?")) return;
          try {
            await del(`/admin/tickets/${btn.dataset.id}`);
            toast("Ticket deleted ✅");
            loadTickets();
          } catch (err) { toast(err.message, "error"); }
        });
      });

    } catch (err) {
      toast(err.message, "error");
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--red);text-align:center;padding:30px">Failed to load tickets.</td></tr>`;
    }
  }

  // Filter change reloads from page 1
  ["f-status", "f-priority", "f-category"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => { page = 1; loadTickets(); });
  });

  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("f-status").value   = "";
    document.getElementById("f-priority").value = "";
    document.getElementById("f-category").value = "";
    page = 1;
    loadTickets();
  });

  document.getElementById("refresh-btn").addEventListener("click", () => loadTickets());

  document.getElementById("prev-btn").addEventListener("click", () => { if (page > 1) { page--; loadTickets(); } });
  document.getElementById("next-btn").addEventListener("click", () => { page++; loadTickets(); });

  loadTickets();
}
