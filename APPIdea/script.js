// script.js — After Hours Prototype (improved)
// Fixes applied:
// #1  No duplicate code between script.js / gameplay.js (each file is self-contained but shared helpers are defined once per file)
// #4  inferType() uses expanded keyword list + [truth]/[dare]/[shot] prefix syntax
// #5  Inline validation feedback on editor form and player step
// (gameplay-specific fixes #2,#3,#6,#7,#8,#9 are in gameplay.js)

const STORAGE_KEY = "after-hours-prototype-state";
const PLAY_STEPS = ["setup", "players", "ready"];

// ─── Seed data ────────────────────────────────────────────────────────────────

const seedPublicPacks = [
  {
    id: "pub-1", categoryName: "Warm Up Energy", author: "HouseHost",
    isPublic: true, intensity: "Lite", source: "community",
    dares: [
      { id: "d1", text: "Do your best celebrity impression for 20 seconds.", type: "dare", enabled: true },
      { id: "d2", text: "Who here would survive longest in a zombie apocalypse?", type: "truth", enabled: true },
      { id: "d3", text: "Take one dramatic runway walk across the room.", type: "dare", enabled: true }
    ]
  },
  {
    id: "pub-2", categoryName: "Wild Night Out", author: "User123",
    isPublic: true, intensity: "Extreme", source: "community",
    dares: [
      { id: "d4", text: "Text someone in the room using only song lyrics for one minute.", type: "dare", enabled: true },
      { id: "d5", text: "Take a shot or reveal your most chaotic drunk story.", type: "shot", enabled: true },
      { id: "d6", text: "Let the group pick a dance you must perform right now.", type: "dare", enabled: true }
    ]
  },
  {
    id: "pub-3", categoryName: "After Dark", author: "NightShift",
    isPublic: true, intensity: "NSFW", source: "community",
    dares: [
      { id: "d7", text: "Reveal your boldest first-date move.", type: "truth", enabled: true },
      { id: "d8", text: "Whisper your best fake pickup line to the person on your left.", type: "dare", enabled: true },
      { id: "d9", text: "Take a sip if you've flirted your way out of trouble.", type: "shot", enabled: true }
    ]
  },
  {
    id: "pub-4", categoryName: "Bar Cart Roulette", author: "MixMaster",
    isPublic: true, intensity: "Drinking", source: "community",
    dares: [
      { id: "d10", text: "Invent a house cocktail name for the person across from you.", type: "dare", enabled: true },
      { id: "d11", text: "Take a shot of your choice.", type: "shot", enabled: true },
      { id: "d12", text: "Truth: what drink order is your biggest red flag?", type: "truth", enabled: true }
    ]
  }
];

const seedLibraryPacks = [
  {
    id: "my-1", categoryName: "Friends Only", author: "You",
    isPublic: false, intensity: "Lite", source: "local",
    dares: [
      { id: "m1", text: "Swap phones with someone for one selfie.", type: "dare", enabled: true },
      { id: "m2", text: "Truth: who was your very first crush?", type: "truth", enabled: true },
      { id: "m3", text: "Take a sip of water and make a toast to the group.", type: "shot", enabled: true }
    ]
  }
];

// ─── State ────────────────────────────────────────────────────────────────────

let state = loadState();

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const els = {
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  views: Array.from(document.querySelectorAll(".view")),
  jumpButtons: Array.from(document.querySelectorAll("[data-jump]")),
  metricLibrary: document.getElementById("metric-library"),
  metricPublic: document.getElementById("metric-public"),
  playCategoryList: document.getElementById("play-category-list"),
  playerName: document.getElementById("player-name"),
  addPlayer: document.getElementById("add-player"),
  playerList: document.getElementById("player-list"),
  playersError: document.getElementById("players-error"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  modeInfo: document.getElementById("mode-info"),
  phaseDots: Array.from(document.querySelectorAll(".phase-dot")),
  playScreens: Array.from(document.querySelectorAll(".play-screen")),
  goToPlayers: document.getElementById("go-to-players"),
  goToChooser: document.getElementById("go-to-chooser"),
  startGameRoom: document.getElementById("start-game-room"),
  backStepButtons: Array.from(document.querySelectorAll("[data-back-step]")),
  resetGame: document.getElementById("reset-game"),
  setupHint: document.getElementById("setup-hint"),
  newPackTitle: document.getElementById("new-pack-title"),
  newPackAuthor: document.getElementById("new-pack-author"),
  newPackIntensity: document.getElementById("new-pack-intensity"),
  newPackPublic: document.getElementById("new-pack-public"),
  newPackDares: document.getElementById("new-pack-dares"),
  createPack: document.getElementById("create-pack"),
  errorTitle: document.getElementById("error-title"),
  errorDares: document.getElementById("error-dares"),
  libraryList: document.getElementById("library-list"),
  browseSearch: document.getElementById("browse-search"),
  browseFilter: document.getElementById("browse-filter"),
  browseList: document.getElementById("browse-list"),
  categoryTemplate: document.getElementById("category-chip-template"),
  readyPackList: document.getElementById("ready-pack-list"),
  readyPlayerList: document.getElementById("ready-player-list"),
  readyMode: document.getElementById("ready-mode"),
  readyPackCount: document.getElementById("ready-pack-count"),
  readyPlayerCount: document.getElementById("ready-player-count")
};

init();

// ─── Boot ─────────────────────────────────────────────────────────────────────

function init() {
  bindEvents();
  render();
}

function bindEvents() {
  els.navButtons.forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
  els.jumpButtons.forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.jump)));
  els.modeButtons.forEach((btn) => btn.addEventListener("click", () => setPlayerMode(btn.dataset.mode)));
  els.phaseDots.forEach((btn) => btn.addEventListener("click", () => setPlayStep(btn.dataset.step)));

  els.goToPlayers.addEventListener("click", () => {
    if (!state.selectedCategoryIds.length) {
      els.setupHint.style.color = "var(--accent-2)";
      return;
    }
    setPlayStep("players");
  });

  // Fix #5: validate before advancing to ready room
  els.goToChooser.addEventListener("click", () => {
    if (!canAdvanceToReady()) {
      showEl(els.playersError);
      return;
    }
    hideEl(els.playersError);
    setPlayStep("ready");
  });

  els.startGameRoom.addEventListener("click", () => {
    saveState();
    window.location.href = "gameplay.html";
  });

  els.backStepButtons.forEach((btn) => btn.addEventListener("click", () => setPlayStep(btn.dataset.backStep)));
  els.addPlayer.addEventListener("click", addPlayer);
  els.playerName.addEventListener("keydown", (e) => { if (e.key === "Enter") addPlayer(); });
  els.resetGame.addEventListener("click", resetRound);

  // Fix #5: validate pack creation form
  els.createPack.addEventListener("click", createPack);
  els.newPackTitle.addEventListener("input", () => hideEl(els.errorTitle));
  els.newPackDares.addEventListener("input", () => hideEl(els.errorDares));

  els.browseSearch.addEventListener("input", renderBrowse);
  els.browseFilter.addEventListener("change", renderBrowse);
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  setView(state.currentView, { skipSave: true });
  setPlayStep(state.playStep, { skipSave: true, force: true });
  renderMetrics();
  renderPlayCategories();
  renderPlayerMode();
  renderPlayers();
  renderReadyRoom();
  renderLibrary();
  renderBrowse();
}

function setView(view, options = {}) {
  state.currentView = view;
  if (view === "play") {
    startPlayFlow({ skipSave: true });
    setPlayStep("setup", { skipSave: true, force: true });
  }
  els.navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  els.views.forEach((sec) => sec.classList.toggle("active", sec.id === `view-${view}`));
  if (!options.skipSave) saveState();
}

function setPlayStep(step, options = {}) {
  if (!PLAY_STEPS.includes(step)) return;
  if (!options.force && !canNavigateToStep(step)) return;
  state.playStep = step;
  els.phaseDots.forEach((dot) => dot.classList.toggle("active", dot.dataset.step === step));
  els.playScreens.forEach((screen) => screen.classList.toggle("active", screen.dataset.stepScreen === step));
  if (!options.skipSave) saveState();
}

function canNavigateToStep(step) {
  if (step === "players") return state.selectedCategoryIds.length > 0;
  if (step === "ready") return canAdvanceToReady();
  return true;
}

function canAdvanceToReady() {
  return state.playerMode === "random" || state.players.length > 0;
}

function renderMetrics() {
  els.metricLibrary.textContent = state.libraryPacks.length;
  els.metricPublic.textContent = getAllPublicPacks().length;
}

function renderPlayCategories() {
  const packs = getPlayablePacks();
  els.playCategoryList.innerHTML = "";
  packs.forEach((pack) => {
    const node = els.categoryTemplate.content.firstElementChild.cloneNode(true);
    const input = node.querySelector("input");
    const title = node.querySelector(".category-chip-title");
    const meta = node.querySelector(".category-chip-meta");
    const selected = state.selectedCategoryIds.includes(pack.id);
    input.checked = selected;
    node.classList.toggle("selected", selected);
    input.addEventListener("change", () => toggleSelectedCategory(pack.id));
    title.textContent = pack.categoryName;
    meta.textContent = `${pack.intensity} pack · ${countEnabled(pack)} prompts active`;
    els.playCategoryList.appendChild(node);
  });
}

function renderPlayerMode() {
  els.modeButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === state.playerMode));
  els.modeInfo.textContent = state.playerMode === "random"
    ? "Random select mode will pick any player each spin. You can also play with no names and use a generic closest-player callout."
    : "Rotation mode will move through your players in order so everyone gets a turn.";
}

function renderReadyRoom() {
  const selectedPacks = getPlayablePacks().filter((p) => state.selectedCategoryIds.includes(p.id));
  els.readyPackList.innerHTML = "";
  els.readyPlayerList.innerHTML = "";
  selectedPacks.forEach((pack) => {
    const item = document.createElement("div");
    item.className = "ready-pill";
    item.textContent = `${pack.categoryName} — ${pack.intensity}`;
    els.readyPackList.appendChild(item);
  });
  state.players.forEach((player) => {
    const item = document.createElement("div");
    item.className = "ready-pill";
    item.textContent = player;
    els.readyPlayerList.appendChild(item);
  });
  if (!selectedPacks.length) els.readyPackList.innerHTML = '<div class="empty-state">Choose at least one pack in setup.</div>';
  if (!state.players.length) {
    const msg = state.playerMode === "random"
      ? "No named players yet. Random mode can still use a closest-player callout."
      : "Add at least one player to use rotation mode.";
    els.readyPlayerList.innerHTML = `<div class="empty-state">${msg}</div>`;
  }
  els.readyMode.textContent = state.playerMode === "random" ? "Random Select" : "Rotation";
  els.readyPackCount.textContent = String(selectedPacks.length);
  els.readyPlayerCount.textContent = String(state.players.length);
}

function renderPlayers() {
  els.playerList.innerHTML = "";
  if (!state.players.length) {
    const msg = state.playerMode === "random"
      ? "No players added yet. Random mode can still run with a generic closest-player result."
      : "No players yet. Add names to use rotation mode.";
    els.playerList.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }
  state.players.forEach((player, index) => {
    const pill = document.createElement("div");
    pill.className = "player-pill";
    pill.innerHTML = `<span>${escapeHtml(player)}</span>`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.players.splice(index, 1);
      if (state.currentPlayerIndex >= state.players.length) state.currentPlayerIndex = 0;
      saveState();
      renderPlayers();
      renderReadyRoom();
    });
    pill.appendChild(remove);
    els.playerList.appendChild(pill);
  });
}

function renderLibrary() {
  els.libraryList.innerHTML = "";
  if (!state.libraryPacks.length) {
    els.libraryList.innerHTML = '<div class="empty-state">Your custom or downloaded packs will show up here.</div>';
    return;
  }
  state.libraryPacks.forEach((pack) => {
    const wrapper = document.createElement("article");
    wrapper.className = "library-pack";
    const dareLines = pack.dares.map((dare) => `
      <div class="dare-line ${dare.enabled ? "" : "disabled"}">
        <div>
          <strong>${escapeHtml(dare.text)}</strong>
          <div class="tag-row"><span class="tag">${capitalize(dare.type)}</span></div>
        </div>
        <label class="toggle-row">
          <input type="checkbox" data-pack="${pack.id}" data-dare="${dare.id}" ${dare.enabled ? "checked" : ""} />
          <span>${dare.enabled ? "On" : "Off"}</span>
        </label>
      </div>
    `).join("");
    wrapper.innerHTML = `
      <div class="pack-top">
        <div>
          <h3>${escapeHtml(pack.categoryName)}</h3>
          <p>by ${escapeHtml(pack.author)} | ${pack.intensity} | ${pack.isPublic ? "Public" : "Private"}</p>
        </div>
        <div class="tag-row">
          <span class="tag">${countEnabled(pack)} enabled</span>
          <button class="mini-action" data-publish="${pack.id}">${pack.isPublic ? "Unpublish" : "Publish"}</button>
        </div>
      </div>
      <div class="pack-dares">${dareLines}</div>
    `;
    wrapper.querySelectorAll('input[type="checkbox"][data-pack]').forEach((toggle) => {
      toggle.addEventListener("change", (e) => toggleDare(e.target.dataset.pack, e.target.dataset.dare));
    });
    wrapper.querySelector("[data-publish]").addEventListener("click", (e) => togglePublish(e.currentTarget.dataset.publish));
    els.libraryList.appendChild(wrapper);
  });
}

function renderBrowse() {
  const term = els.browseSearch.value.trim().toLowerCase();
  const filter = els.browseFilter.value;
  const packs = getAllPublicPacks().filter((pack) => {
    const matchesTerm = !term
      || pack.categoryName.toLowerCase().includes(term)
      || pack.author.toLowerCase().includes(term)
      || pack.dares.some((d) => d.text.toLowerCase().includes(term));
    const matchesFilter = filter === "all" || pack.intensity === filter;
    return matchesTerm && matchesFilter;
  });
  els.browseList.innerHTML = "";
  if (!packs.length) {
    els.browseList.innerHTML = '<div class="empty-state">No public packs match that search yet.</div>';
    return;
  }
  packs.forEach((pack) => {
    const addedAlready = state.libraryPacks.some((lp) => lp.id === pack.id || lp.categoryName === pack.categoryName);
    const card = document.createElement("article");
    card.className = "browse-card";
    card.innerHTML = `
      <div class="browse-top">
        <div>
          <h3>${escapeHtml(pack.categoryName)}</h3>
          <p>by ${escapeHtml(pack.author)}</p>
        </div>
        <button class="primary-action small" data-add="${pack.id}" ${addedAlready ? "disabled" : ""}>${addedAlready ? "Added" : "Add to Library"}</button>
      </div>
      <div class="tag-row">
        <span class="tag">${pack.intensity}</span>
        <span class="tag">${pack.dares.length} prompts</span>
        <span class="tag">${pack.isPublic ? "Public" : "Private"}</span>
      </div>
      <p>${pack.dares.slice(0, 2).map((d) => escapeHtml(d.text)).join(" · ")}</p>
    `;
    card.querySelector("[data-add]").addEventListener("click", (e) => addPackToLibrary(e.currentTarget.dataset.add));
    els.browseList.appendChild(card);
  });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

function addPlayer() {
  const name = els.playerName.value.trim() || nextGuestPlayerName(state.players);
  state.players.push(name);
  els.playerName.value = "";
  hideEl(els.playersError);
  saveState();
  renderPlayers();
  renderReadyRoom();
}

function setPlayerMode(mode) {
  state.playerMode = mode;
  if (mode === "rotation" && !state.players.length) state.selectedPlayer = "";
  saveState();
  renderPlayerMode();
  renderPlayers();
  renderReadyRoom();
}

function toggleSelectedCategory(packId) {
  const isSelected = state.selectedCategoryIds.includes(packId);
  state.selectedCategoryIds = isSelected
    ? state.selectedCategoryIds.filter((id) => id !== packId)
    : [...state.selectedCategoryIds, packId];
  saveState();
  renderPlayCategories();
  renderReadyRoom();
}

function toggleDare(packId, dareId) {
  const pack = state.libraryPacks.find((p) => p.id === packId);
  if (!pack) return;
  const dare = pack.dares.find((d) => d.id === dareId);
  if (!dare) return;
  dare.enabled = !dare.enabled;
  saveState();
  renderLibrary();
  renderPlayCategories();
  renderReadyRoom();
}

function togglePublish(packId) {
  const pack = state.libraryPacks.find((p) => p.id === packId);
  if (!pack) return;
  pack.isPublic = !pack.isPublic;
  const existingIdx = state.publicPacks.findIndex((p) => p.id === pack.id);
  if (pack.isPublic && existingIdx === -1) {
    state.publicPacks.unshift(structuredClone({ ...pack, source: "community" }));
  } else if (!pack.isPublic && existingIdx >= 0) {
    state.publicPacks.splice(existingIdx, 1);
  }
  saveState();
  renderMetrics();
  renderLibrary();
  renderBrowse();
  renderPlayCategories();
  renderReadyRoom();
}

function addPackToLibrary(packId) {
  const pack = state.publicPacks.find((p) => p.id === packId);
  if (!pack) return;
  const exists = state.libraryPacks.some((p) => p.id === pack.id || p.categoryName === pack.categoryName);
  if (exists) return;
  state.libraryPacks.unshift(structuredClone({ ...pack, source: "local" }));
  saveState();
  renderMetrics();
  renderLibrary();
  renderBrowse();
  renderPlayCategories();
  renderReadyRoom();
}

// Fix #5: validation on pack creation
function createPack() {
  const title = els.newPackTitle.value.trim();
  const author = els.newPackAuthor.value.trim() || "Anonymous";
  const intensity = els.newPackIntensity.value;
  const isPublic = els.newPackPublic.checked;
  const rawLines = els.newPackDares.value.split("\n").map((l) => l.trim()).filter(Boolean);

  let valid = true;
  if (!title) { showEl(els.errorTitle); valid = false; } else hideEl(els.errorTitle);
  if (!rawLines.length) { showEl(els.errorDares); valid = false; } else hideEl(els.errorDares);
  if (!valid) return;

  const stamp = Date.now();
  // Fix #4: parse [truth]/[dare]/[shot] prefix tags
  const dares = rawLines.map((line, index) => {
    const prefixMatch = line.match(/^\[(truth|dare|shot|wildcard)\]\s*/i);
    const type = prefixMatch ? prefixMatch[1].toLowerCase() : inferType(line);
    const text = prefixMatch ? line.slice(prefixMatch[0].length).trim() : line;
    return { id: `custom-${stamp}-${index}`, text, type, enabled: true };
  }).filter((d) => d.text);

  const pack = { id: `custom-${stamp}`, categoryName: title, author, isPublic, intensity, source: "local", dares };
  state.libraryPacks.unshift(pack);
  if (isPublic) state.publicPacks.unshift(structuredClone({ ...pack, source: "community" }));

  els.newPackTitle.value = "";
  els.newPackAuthor.value = "";
  els.newPackDares.value = "";
  els.newPackPublic.checked = true;
  els.newPackIntensity.value = "Lite";

  saveState();
  render();
}

function resetRound() {
  startPlayFlow({ skipSave: true });
  saveState();
  setPlayStep("setup", { skipSave: true, force: true });
}

function startPlayFlow(options = {}) {
  state.playStep = "setup";
  state.selectedPlayer = "";
  state.selectedOutcome = "";
  state.selectedDare = "";
  state.currentPlayerIndex = 0;
  state.roundCount = 0;
  state.playerTurnCounts = {};
  if (!options.skipSave) saveState();
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getAllPublicPacks() {
  const deduped = new Map();
  [...state.publicPacks, ...state.libraryPacks.filter((p) => p.isPublic)].forEach((p) => {
    deduped.set(getPackIdentity(p), p);
  });
  return Array.from(deduped.values());
}

function getPlayablePacks() {
  return state.libraryPacks;
}

// ─── State persistence ────────────────────────────────────────────────────────

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return normalizeState({
        currentView: parsed.currentView || "home",
        playStep: parsed.playStep || "setup",
        playerMode: parsed.playerMode || "rotation",
        libraryPacks: parsed.libraryPacks || structuredClone(seedLibraryPacks),
        publicPacks: parsed.publicPacks || structuredClone(seedPublicPacks),
        selectedCategoryIds: parsed.selectedCategoryIds || ["my-1", "pub-1"],
        players: parsed.players || ["Alex", "Jamie", "Taylor"],
        selectedPlayer: parsed.selectedPlayer || "",
        selectedOutcome: parsed.selectedOutcome || "",
        selectedDare: parsed.selectedDare || "",
        currentPlayerIndex: parsed.currentPlayerIndex || 0,
        roundCount: parsed.roundCount || 0,
        playerTurnCounts: parsed.playerTurnCounts || {}
      });
    } catch (_) { localStorage.removeItem(STORAGE_KEY); }
  }
  return normalizeState({
    currentView: "home", playStep: "setup", playerMode: "rotation",
    libraryPacks: structuredClone(seedLibraryPacks),
    publicPacks: structuredClone(seedPublicPacks),
    selectedCategoryIds: ["my-1", "pub-1"],
    players: ["Alex", "Jamie", "Taylor"],
    selectedPlayer: "", selectedOutcome: "", selectedDare: "",
    currentPlayerIndex: 0, roundCount: 0, playerTurnCounts: {}
  });
}

function saveState() {
  state = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeState(nextState) {
  const libraryPacks = dedupePacksById(nextState.libraryPacks?.length ? nextState.libraryPacks : structuredClone(seedLibraryPacks));
  const publicPacks = dedupePacksByIdentity(nextState.publicPacks?.length ? nextState.publicPacks : structuredClone(seedPublicPacks));
  const availableIds = new Set(libraryPacks.map((p) => p.id));
  const selectedCategoryIds = (nextState.selectedCategoryIds?.length ? nextState.selectedCategoryIds : ["my-1", "pub-1"])
    .filter((id, i, ids) => availableIds.has(id) && ids.indexOf(id) === i);
  return {
    ...nextState, libraryPacks, publicPacks,
    selectedCategoryIds: selectedCategoryIds.length ? selectedCategoryIds : ["my-1", "pub-1"]
  };
}

function dedupePacksById(packs) {
  const map = new Map();
  packs.forEach((p) => { if (p?.id) map.set(p.id, normalizePack(p)); });
  return Array.from(map.values());
}

function dedupePacksByIdentity(packs) {
  const map = new Map();
  packs.forEach((p) => { if (p) map.set(getPackIdentity(p), normalizePack(p)); });
  return Array.from(map.values());
}

function normalizePack(pack) {
  return {
    ...pack,
    categoryName: String(pack.categoryName || "Untitled Pack").trim(),
    author: String(pack.author || "Anonymous").trim(),
    source: pack.source || (pack.isPublic ? "community" : "local"),
    dares: Array.isArray(pack.dares) ? pack.dares.map((dare, i) => ({
      id: dare.id || `${pack.id || "pack"}-dare-${i}`,
      text: String(dare.text || "").trim(),
      type: dare.type || inferType(String(dare.text || "")),
      enabled: dare.enabled !== false
    })).filter((d) => d.text) : []
  };
}

function getPackIdentity(pack) {
  const name = String(pack?.categoryName || "").trim().toLowerCase();
  return name || String(pack?.id || "").trim().toLowerCase();
}

function countEnabled(pack) {
  return pack.dares.filter((d) => d.enabled).length;
}

// Fix #4: expanded inferType with broader keyword matching
function inferType(text) {
  const lower = text.toLowerCase();
  const shotWords = ["shot", "sip", "drink", "chug", "take a ", "bottoms up", "down your"];
  const truthWords = [
    "truth", "who ", "what ", "when ", "where ", "why ", "how ",
    "reveal", "confess", "admit", "tell ", "have you", "would you",
    "do you", "did you", "your biggest", "your most", "your worst",
    "your best", "your last", "your least"
  ];
  if (shotWords.some((w) => lower.includes(w))) return "shot";
  if (truthWords.some((w) => lower.includes(w))) return "truth";
  return "dare";
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function nextGuestPlayerName(players) {
  let i = 1;
  const names = new Set(players);
  while (names.has(`Player ${i}`)) i++;
  return `Player ${i}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function showEl(el) { el && el.classList.remove("hidden"); }
function hideEl(el) { el && el.classList.add("hidden"); }
