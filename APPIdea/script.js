const STORAGE_KEY = "after-hours-prototype-state";

const PLAY_STEPS = ["setup", "players", "ready"];

const seedPublicPacks = [
  {
    id: "pub-1",
    categoryName: "Warm Up Energy",
    author: "HouseHost",
    isPublic: true,
    intensity: "Lite",
    source: "community",
    dares: [
      { id: "d1", text: "Do your best celebrity impression for 20 seconds.", type: "dare", enabled: true },
      { id: "d2", text: "Who here would survive longest in a zombie apocalypse?", type: "truth", enabled: true },
      { id: "d3", text: "Take one dramatic runway walk across the room.", type: "dare", enabled: true }
    ]
  },
  {
    id: "pub-2",
    categoryName: "Wild Night Out",
    author: "User123",
    isPublic: true,
    intensity: "Extreme",
    source: "community",
    dares: [
      { id: "d4", text: "Text someone in the room using only song lyrics for one minute.", type: "dare", enabled: true },
      { id: "d5", text: "Take a shot or reveal your most chaotic drunk story.", type: "shot", enabled: true },
      { id: "d6", text: "Let the group pick a dance you must perform right now.", type: "dare", enabled: true }
    ]
  },
  {
    id: "pub-3",
    categoryName: "After Dark",
    author: "NightShift",
    isPublic: true,
    intensity: "NSFW",
    source: "community",
    dares: [
      { id: "d7", text: "Reveal your boldest first-date move.", type: "truth", enabled: true },
      { id: "d8", text: "Whisper your best fake pickup line to the person on your left.", type: "dare", enabled: true },
      { id: "d9", text: "Take a sip if you've flirted your way out of trouble.", type: "shot", enabled: true }
    ]
  },
  {
    id: "pub-4",
    categoryName: "Bar Cart Roulette",
    author: "MixMaster",
    isPublic: true,
    intensity: "Drinking",
    source: "community",
    dares: [
      { id: "d10", text: "Invent a house cocktail name for the person across from you.", type: "dare", enabled: true },
      { id: "d11", text: "Take a shot of your choice.", type: "shot", enabled: true },
      { id: "d12", text: "Truth: what drink order is your biggest red flag?", type: "truth", enabled: true }
    ]
  }
];

const seedLibraryPacks = [
  {
    id: "my-1",
    categoryName: "Friends Only",
    author: "You",
    isPublic: false,
    intensity: "Lite",
    source: "local",
    dares: [
      { id: "m1", text: "Swap phones with someone for one selfie.", type: "dare", enabled: true },
      { id: "m2", text: "Truth: who was your very first crush?", type: "truth", enabled: true },
      { id: "m3", text: "Take a sip of water and make a toast to the group.", type: "shot", enabled: true }
    ]
  }
];

let state = loadState();
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
  playerRing: document.getElementById("player-ring"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  modeInfo: document.getElementById("mode-info"),
  phaseDots: Array.from(document.querySelectorAll(".phase-dot")),
  playScreens: Array.from(document.querySelectorAll(".play-screen")),
  goToPlayers: document.getElementById("go-to-players"),
  goToChooser: document.getElementById("go-to-chooser"),
  startGameRoom: document.getElementById("start-game-room"),
  backStepButtons: Array.from(document.querySelectorAll("[data-back-step]")),
  resetGame: document.getElementById("reset-game"),
  newPackTitle: document.getElementById("new-pack-title"),
  newPackAuthor: document.getElementById("new-pack-author"),
  newPackIntensity: document.getElementById("new-pack-intensity"),
  newPackPublic: document.getElementById("new-pack-public"),
  newPackDares: document.getElementById("new-pack-dares"),
  createPack: document.getElementById("create-pack"),
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

function init() {
  bindEvents();
  render();
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  els.jumpButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.jump));
  });

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setPlayerMode(button.dataset.mode));
  });

  els.phaseDots.forEach((button) => {
    button.addEventListener("click", () => setPlayStep(button.dataset.step));
  });

  els.goToPlayers.addEventListener("click", () => {
    if (!state.selectedCategoryIds.length) return;
    setPlayStep("players");
  });

  els.goToChooser.addEventListener("click", () => {
    if (!canAdvanceToReady()) return;
    setPlayStep("ready");
  });
  els.startGameRoom.addEventListener("click", () => {
    saveState();
    window.location.href = "gameplay.html";
  });

  els.backStepButtons.forEach((button) => {
    button.addEventListener("click", () => setPlayStep(button.dataset.backStep));
  });

  els.addPlayer.addEventListener("click", addPlayer);
  els.playerName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addPlayer();
  });

  els.resetGame.addEventListener("click", resetRound);
  els.createPack.addEventListener("click", createPack);
  els.browseSearch.addEventListener("input", renderBrowse);
  els.browseFilter.addEventListener("change", renderBrowse);
}

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
        currentPlayerIndex: parsed.currentPlayerIndex || 0
      });
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return normalizeState({
    currentView: "home",
    playStep: "setup",
    playerMode: "rotation",
    libraryPacks: structuredClone(seedLibraryPacks),
    publicPacks: structuredClone(seedPublicPacks),
    selectedCategoryIds: ["my-1", "pub-1"],
    players: ["Alex", "Jamie", "Taylor"],
    selectedPlayer: "",
    selectedOutcome: "",
    selectedDare: "",
    currentPlayerIndex: 0
  });
}

function saveState() {
  state = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

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
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  els.views.forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
  if (!options.skipSave) saveState();
}

function setPlayStep(step, options = {}) {
  if (!PLAY_STEPS.includes(step)) return;
  if (!options.force && !canNavigateToStep(step)) return;

  state.playStep = step;
  els.phaseDots.forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.step === step);
  });
  els.playScreens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.stepScreen === step);
  });
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
    meta.textContent = `${pack.intensity} pack - ${countEnabled(pack)} prompts active`;
    els.playCategoryList.appendChild(node);
  });
}

function renderPlayerMode() {
  els.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.playerMode);
  });
  els.modeInfo.textContent =
    state.playerMode === "random"
      ? "Random select mode will pick any player each spin. You can also play with no names and use a generic closest-player callout."
      : "Rotation mode will move through your players in order so everyone gets a turn.";
}

function renderReadyRoom() {
  const selectedPacks = getPlayablePacks().filter((pack) =>
    state.selectedCategoryIds.includes(pack.id)
  );

  els.readyPackList.innerHTML = "";
  els.readyPlayerList.innerHTML = "";

  selectedPacks.forEach((pack) => {
    const item = document.createElement("div");
    item.className = "ready-pill";
    item.textContent = `${pack.categoryName} - ${pack.intensity}`;
    els.readyPackList.appendChild(item);
  });

  state.players.forEach((player) => {
    const item = document.createElement("div");
    item.className = "ready-pill";
    item.textContent = player;
    els.readyPlayerList.appendChild(item);
  });

  if (!selectedPacks.length) {
    els.readyPackList.innerHTML = '<div class="empty-state">Choose at least one pack in setup.</div>';
  }

  if (!state.players.length) {
    const message = state.playerMode === "random"
      ? "No named players yet. Random mode can still use a closest-player callout."
      : "Add at least one player to use rotation mode.";
    els.readyPlayerList.innerHTML = `<div class="empty-state">${message}</div>`;
  }

  els.readyMode.textContent = state.playerMode === "random" ? "Random Select" : "Rotation";
  els.readyPackCount.textContent = String(selectedPacks.length);
  els.readyPlayerCount.textContent = String(state.players.length);
}

function renderPlayers() {
  els.playerList.innerHTML = "";

  if (!state.players.length) {
    const message =
      state.playerMode === "random"
        ? "No players added yet. Random mode can still run with a generic closest-player result."
        : "No players yet. Add names to use rotation mode.";
    els.playerList.innerHTML = `<div class="empty-state">${message}</div>`;
    return;
  }

  state.players.forEach((player, index) => {
    const pill = document.createElement("div");
    pill.className = "player-pill";
    pill.innerHTML = `<span>${escapeHtml(player)}</span>`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
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
          <div class="tag-row">
            <span class="tag">${capitalize(dare.type)}</span>
          </div>
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
          <button class="mini-action" data-publish="${pack.id}">
            ${pack.isPublic ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
      <div class="pack-dares">${dareLines}</div>
    `;

    wrapper.querySelectorAll('input[type="checkbox"][data-pack]').forEach((toggle) => {
      toggle.addEventListener("change", (event) => {
        const { pack: packId, dare: dareId } = event.target.dataset;
        toggleDare(packId, dareId);
      });
    });

    wrapper.querySelector("[data-publish]").addEventListener("click", (event) => {
      togglePublish(event.currentTarget.dataset.publish);
    });

    els.libraryList.appendChild(wrapper);
  });
}

function renderBrowse() {
  const term = els.browseSearch.value.trim().toLowerCase();
  const filter = els.browseFilter.value;
  const packs = getAllPublicPacks().filter((pack) => {
    const matchesTerm =
      !term ||
      pack.categoryName.toLowerCase().includes(term) ||
      pack.author.toLowerCase().includes(term) ||
      pack.dares.some((dare) => dare.text.toLowerCase().includes(term));
    const matchesFilter = filter === "all" || pack.intensity === filter;
    return matchesTerm && matchesFilter;
  });

  els.browseList.innerHTML = "";

  if (!packs.length) {
    els.browseList.innerHTML = '<div class="empty-state">No public packs match that search yet.</div>';
    return;
  }

  packs.forEach((pack) => {
    const addedAlready = state.libraryPacks.some((libraryPack) => libraryPack.id === pack.id || libraryPack.categoryName === pack.categoryName);
    const card = document.createElement("article");
    card.className = "browse-card";
    card.innerHTML = `
      <div class="browse-top">
        <div>
          <h3>${escapeHtml(pack.categoryName)}</h3>
          <p>by ${escapeHtml(pack.author)}</p>
        </div>
        <button class="primary-action small" data-add="${pack.id}" ${addedAlready ? "disabled" : ""}>
          ${addedAlready ? "Added" : "Add to Library"}
        </button>
      </div>
      <div class="tag-row">
        <span class="tag">${pack.intensity}</span>
        <span class="tag">${pack.dares.length} prompts</span>
        <span class="tag">${pack.isPublic ? "Public" : "Private"}</span>
      </div>
      <p>${pack.dares.slice(0, 2).map((dare) => escapeHtml(dare.text)).join(" | ")}</p>
    `;

    card.querySelector("[data-add]").addEventListener("click", (event) => {
      addPackToLibrary(event.currentTarget.dataset.add);
    });

    els.browseList.appendChild(card);
  });
}

function addPlayer() {
  const name = els.playerName.value.trim() || nextGuestPlayerName(state.players);
  state.players.push(name);
  els.playerName.value = "";
  saveState();
  renderPlayers();
  renderReadyRoom();
}

function setPlayerMode(mode) {
  state.playerMode = mode;
  if (mode === "rotation" && !state.players.length) {
    state.selectedPlayer = "";
  }
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
  const pack = state.libraryPacks.find((item) => item.id === packId);
  if (!pack) return;
  const dare = pack.dares.find((item) => item.id === dareId);
  if (!dare) return;
  dare.enabled = !dare.enabled;
  saveState();
  renderLibrary();
  renderPlayCategories();
  renderReadyRoom();
}

function togglePublish(packId) {
  const pack = state.libraryPacks.find((item) => item.id === packId);
  if (!pack) return;

  pack.isPublic = !pack.isPublic;
  const existingPublicIndex = state.publicPacks.findIndex((item) => item.id === pack.id);

  if (pack.isPublic && existingPublicIndex === -1) {
    state.publicPacks.unshift(structuredClone({ ...pack, source: "community" }));
  } else if (!pack.isPublic && existingPublicIndex >= 0) {
    state.publicPacks.splice(existingPublicIndex, 1);
  }

  saveState();
  renderMetrics();
  renderLibrary();
  renderBrowse();
  renderPlayCategories();
  renderReadyRoom();
}

function addPackToLibrary(packId) {
  const pack = state.publicPacks.find((item) => item.id === packId);
  if (!pack) return;
  const exists = state.libraryPacks.some((item) => item.id === pack.id || item.categoryName === pack.categoryName);
  if (exists) return;

  state.libraryPacks.unshift(structuredClone({ ...pack, source: "local" }));
  saveState();
  renderMetrics();
  renderLibrary();
  renderBrowse();
  renderPlayCategories();
  renderReadyRoom();
}

function createPack() {
  const title = els.newPackTitle.value.trim();
  const author = els.newPackAuthor.value.trim() || "Anonymous";
  const intensity = els.newPackIntensity.value;
  const isPublic = els.newPackPublic.checked;
  const lines = els.newPackDares.value.split("\n").map((line) => line.trim()).filter(Boolean);

  if (!title || !lines.length) return;

  const stamp = Date.now();
  const dares = lines.map((text, index) => ({
    id: `custom-${stamp}-${index}`,
    text,
    type: inferType(text),
    enabled: true
  }));

  const pack = {
    id: `custom-${stamp}`,
    categoryName: title,
    author,
    isPublic,
    intensity,
    source: "local",
    dares
  };

  state.libraryPacks.unshift(pack);
  if (isPublic) {
    state.publicPacks.unshift(structuredClone({ ...pack, source: "community" }));
  }

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
  if (!options.skipSave) saveState();
}

function getAllPublicPacks() {
  const deduped = new Map();
  [...state.publicPacks, ...state.libraryPacks.filter((pack) => pack.isPublic)].forEach((pack) => {
    deduped.set(getPackIdentity(pack), pack);
  });
  return Array.from(deduped.values());
}

function getPlayablePacks() {
  return state.libraryPacks;
}

function normalizeState(nextState) {
  const libraryPacks = dedupePacksById(nextState.libraryPacks?.length ? nextState.libraryPacks : structuredClone(seedLibraryPacks));
  const publicPacks = dedupePacksByIdentity(nextState.publicPacks?.length ? nextState.publicPacks : structuredClone(seedPublicPacks));
  const availableCategoryIds = new Set(libraryPacks.map((pack) => pack.id));
  const selectedCategoryIds = (nextState.selectedCategoryIds?.length ? nextState.selectedCategoryIds : ["my-1", "pub-1"])
    .filter((id, index, ids) => availableCategoryIds.has(id) && ids.indexOf(id) === index);

  return {
    ...nextState,
    libraryPacks,
    publicPacks,
    selectedCategoryIds: selectedCategoryIds.length ? selectedCategoryIds : ["my-1", "pub-1"]
  };
}

function dedupePacksById(packs) {
  const deduped = new Map();
  packs.forEach((pack) => {
    if (!pack?.id) return;
    deduped.set(pack.id, normalizePack(pack));
  });
  return Array.from(deduped.values());
}

function dedupePacksByIdentity(packs) {
  const deduped = new Map();
  packs.forEach((pack) => {
    if (!pack) return;
    deduped.set(getPackIdentity(pack), normalizePack(pack));
  });
  return Array.from(deduped.values());
}

function normalizePack(pack) {
  return {
    ...pack,
    categoryName: String(pack.categoryName || "Untitled Pack").trim(),
    author: String(pack.author || "Anonymous").trim(),
    source: pack.source || (pack.isPublic ? "community" : "local"),
    dares: Array.isArray(pack.dares) ? pack.dares.map((dare, index) => ({
      id: dare.id || `${pack.id || "pack"}-dare-${index}`,
      text: String(dare.text || "").trim(),
      type: dare.type || inferType(String(dare.text || "")),
      enabled: dare.enabled !== false
    })).filter((dare) => dare.text) : []
  };
}

function getPackIdentity(pack) {
  const name = String(pack?.categoryName || "").trim().toLowerCase();
  return name || String(pack?.id || "").trim().toLowerCase();
}

function countEnabled(pack) {
  return pack.dares.filter((dare) => dare.enabled).length;
}

function inferType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("truth") || lower.includes("who") || lower.includes("reveal")) return "truth";
  if (lower.includes("shot") || lower.includes("sip") || lower.includes("drink")) return "shot";
  return "dare";
}

function nextGuestPlayerName(players) {
  let index = 1;
  const names = new Set(players);
  while (names.has(`Player ${index}`)) index += 1;
  return `Player ${index}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
