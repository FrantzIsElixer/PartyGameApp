// auth.js — After Hours Auth (Login / Signup / Logout)
// Handles the auth modal, session state, and exposes helpers used by script.js

// ─── Auth State ───────────────────────────────────────────────────────────────

let currentUser = null;

async function initAuth() {
  const sb = window._supabase;

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  // Listen for login/logout events
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthUI();
    if (currentUser) {
      // Reload packs from DB when user logs in
      loadPacksFromDB().then(() => render());
    }
  });
}

function getCurrentUser() {
  return currentUser;
}

// ─── Auth UI ──────────────────────────────────────────────────────────────────

function updateAuthUI() {
  const authBtn = document.getElementById("auth-btn");
  const userLabel = document.getElementById("user-label");

  if (currentUser) {
    const email = currentUser.email || "";
    userLabel.textContent = email.split("@")[0]; // show username portion
    authBtn.textContent = "Sign Out";
    authBtn.onclick = signOut;
  } else {
    userLabel.textContent = "";
    authBtn.textContent = "Sign In / Sign Up";
    authBtn.onclick = () => showAuthModal();
  }
}

function showAuthModal(mode = "login") {
  let modal = document.getElementById("auth-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.innerHTML = `
      <div class="auth-backdrop"></div>
      <div class="auth-card">
        <button class="auth-close" id="auth-close">✕</button>
        <h2 id="auth-title">Sign In</h2>
        <p id="auth-subtitle">Access your packs from any device and share with the community.</p>
        <input type="email" id="auth-email" placeholder="Email address" autocomplete="email" />
        <input type="password" id="auth-password" placeholder="Password" autocomplete="current-password" />
        <p id="auth-error" class="auth-error hidden"></p>
        <button id="auth-submit" class="auth-submit-btn">Sign In</button>
        <p class="auth-toggle">Don't have an account? <button id="auth-switch">Create one</button></p>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("auth-close").onclick = hideAuthModal;
    document.getElementById("auth-backdrop") || modal.querySelector(".auth-backdrop").addEventListener("click", hideAuthModal);
    modal.querySelector(".auth-backdrop").addEventListener("click", hideAuthModal);
  }

  let isLogin = mode === "login";

  function refreshMode() {
    document.getElementById("auth-title").textContent = isLogin ? "Sign In" : "Create Account";
    document.getElementById("auth-submit").textContent = isLogin ? "Sign In" : "Sign Up";
    document.getElementById("auth-switch").textContent = isLogin ? "Create one" : "Sign in instead";
    document.querySelector(".auth-toggle").firstChild.textContent = isLogin
      ? "Don't have an account? "
      : "Already have an account? ";
  }

  refreshMode();
  modal.classList.remove("hidden");
  document.getElementById("auth-email").focus();

  document.getElementById("auth-switch").onclick = () => {
    isLogin = !isLogin;
    refreshMode();
    document.getElementById("auth-error").classList.add("hidden");
  };

  document.getElementById("auth-submit").onclick = async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errEl = document.getElementById("auth-error");
    errEl.classList.add("hidden");

    if (!email || !password) {
      errEl.textContent = "Please enter your email and password.";
      errEl.classList.remove("hidden");
      return;
    }

    const sb = window._supabase;
    let error;

    if (isLogin) {
      ({ error } = await sb.auth.signInWithPassword({ email, password }));
    } else {
      ({ error } = await sb.auth.signUp({ email, password }));
      if (!error) {
        errEl.textContent = "Check your email to confirm your account, then sign in!";
        errEl.classList.remove("hidden");
        errEl.style.color = "var(--accent-1, #a8ff78)";
        return;
      }
    }

    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove("hidden");
    } else {
      hideAuthModal();
    }
  };
}

function hideAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.add("hidden");
}

async function signOut() {
  await window._supabase.auth.signOut();
}

// ─── Auth CSS (injected) ──────────────────────────────────────────────────────

(function injectAuthStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* Auth button in sidebar */
    .auth-area {
      margin-top: auto;
      padding: 1rem 0 0.5rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    #user-label {
      font-size: 0.75rem;
      opacity: 0.5;
      min-height: 1rem;
    }
    #auth-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: inherit;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      text-align: left;
      transition: background 0.15s;
    }
    #auth-btn:hover { background: rgba(255,255,255,0.15); }

    /* Modal */
    #auth-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
    #auth-modal.hidden { display: none; }
    .auth-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.7); }
    .auth-card {
      position: relative;
      background: #1a1a2e;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      padding: 2rem;
      width: min(420px, 90vw);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      z-index: 1;
    }
    .auth-card h2 { margin: 0; font-size: 1.4rem; }
    .auth-card p { margin: 0; opacity: 0.6; font-size: 0.85rem; }
    .auth-card input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      color: inherit;
      font-size: 0.95rem;
      outline: none;
    }
    .auth-card input:focus { border-color: rgba(255,255,255,0.4); }
    .auth-submit-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      border-radius: 8px;
      color: #fff;
      padding: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .auth-submit-btn:hover { opacity: 0.9; }
    .auth-close {
      position: absolute; top: 1rem; right: 1rem;
      background: none; border: none; color: inherit; font-size: 1.1rem; cursor: pointer; opacity: 0.5;
    }
    .auth-close:hover { opacity: 1; }
    .auth-error { color: #ff6b6b !important; font-size: 0.85rem !important; opacity: 1 !important; }
    .auth-toggle { font-size: 0.82rem !important; }
    .auth-toggle button { background: none; border: none; color: #a78bfa; cursor: pointer; text-decoration: underline; font-size: inherit; }
  `;
  document.head.appendChild(style);
})();
