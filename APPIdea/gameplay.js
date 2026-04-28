const STORAGE_KEY = "after-hours-prototype-state";
const POINTER_SPIN_DURATION = 2200;
const WHEEL_SPIN_DURATION = 2400;

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
let pointerRotation = 0;
let wheelRotation = 0;
let playerSpinBusy = false;
let dareSpinBusy = false;
let playerSpinTimeout = null;
let dareSpinTimeout = null;

const els = {
  playerStage: document.getElementById("player-stage"),
  dareStage: document.getElementById("dare-stage"),
  gameplayStageTag: document.getElementById("gameplay-stage-tag"),
  focusPlayer: document.getElementById("focus-player"),
  nextRound: document.getElementById("next-round-link"),
  spinPlayer: document.getElementById("spin-player"),
  spinDare: document.getElementById("spin-dare"),
  playerRing: document.getElementById("player-ring"),
  pointerFinger: document.getElementById("pointer-finger"),
  dareWheel: document.getElementById("dare-wheel"),
  selectedPlayer: document.getElementById("selected-player"),
  selectedOutcome: document.getElementById("selected-outcome"),
  selectedDare: document.getElementById("selected-dare")
};

initGameplay();

function initGameplay() {
  els.spinPlayer.addEventListener("click", spinPlayer);
  els.spinDare.addEventListener("click", spinDare);
  els.nextRound.addEventListener("click", nextRound);
  renderGameplay();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return normalizeState({
        currentView: "play",
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
    currentView: "play",
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

function renderGameplay() {
  renderPlayerRing();
  setGameplayPhase("player");
  syncResults();
}

function renderPlayerRing() {
  els.playerRing.innerHTML = "";
  const players = state.players.length ? state.players : ["Closest Player"];
  const total = players.length;

  players.forEach((player, index) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + Math.cos(angle) * 39;
    const y = 50 + Math.sin(angle) * 39;
    const marker = document.createElement("div");
    marker.className = "player-marker";
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.textContent = player;
    els.playerRing.appendChild(marker);
  });
}

function setGameplayPhase(phase) {
  const playerActive = phase === "player";
  els.playerStage.classList.toggle("gameplay-stage-active", playerActive);
  els.dareStage.classList.toggle("gameplay-stage-active", !playerActive);
  els.gameplayStageTag.textContent = playerActive ? "Player Picker" : "Dare Reveal";
}

function spinPlayer() {
  if (playerSpinBusy) return;
  const players = state.players.length ? state.players : ["Closest Player"];
  const selectedIndex = getSelectedPlayerIndex(players);
  const player = players[selectedIndex];
  const targetAngle = ((selectedIndex / players.length) * 360) - 90 + (Math.random() - 0.5) * 10;
  const nextRotation = pointerRotation + 1440 + targetAngle;

  playerSpinBusy = true;
  els.spinPlayer.disabled = true;
  els.pointerFinger.style.transform = `translate(-50%, -50%) rotate(${nextRotation}deg)`;
  window.clearTimeout(playerSpinTimeout);
  playerSpinTimeout = window.setTimeout(() => {
    pointerRotation = nextRotation;
    state.selectedPlayer = player;
    syncResults();
    saveState();
    playerSpinBusy = false;
    els.spinPlayer.disabled = false;
    window.setTimeout(() => setGameplayPhase("dare"), 280);
  }, POINTER_SPIN_DURATION);
}

function getSelectedPlayerIndex(players) {
  if (!players.length) return 0;
  if (state.playerMode === "random") return Math.floor(Math.random() * players.length);
  const nextIndex = state.currentPlayerIndex % players.length;
  state.currentPlayerIndex = (nextIndex + 1) % players.length;
  return nextIndex;
}

function spinDare() {
  if (dareSpinBusy) return;
  if (!state.selectedPlayer) {
    spinPlayer();
    return;
  }

  const options = ["Truth", "Dare", "Take a Shot", "Wildcard Dare"];
  const selectedIndex = Math.floor(Math.random() * options.length);
  const targetAngle = 360 - selectedIndex * 90 - 45;
  const spinAngle = wheelRotation + 1800 + targetAngle;
  const selectedLabel = options[selectedIndex];
  const dare = getPromptForOutcome(selectedLabel);

  dareSpinBusy = true;
  els.spinDare.disabled = true;
  els.dareWheel.style.transform = `rotate(${spinAngle}deg)`;
  window.clearTimeout(dareSpinTimeout);
  dareSpinTimeout = window.setTimeout(() => {
    wheelRotation = spinAngle;
    state.selectedOutcome = selectedLabel;
    state.selectedDare = dare;
    syncResults();
    saveState();
    dareSpinBusy = false;
    els.spinDare.disabled = false;
    els.nextRound.classList.remove("gameplay-hidden");
  }, WHEEL_SPIN_DURATION);
}

function getPromptForOutcome(outcome) {
  const activePacks = getPlayablePacks().filter((pack) =>
    state.selectedCategoryIds.includes(pack.id)
  );
  const enabledDares = activePacks.flatMap((pack) => pack.dares.filter((dare) => dare.enabled));
  if (!enabledDares.length) return "No enabled prompts in the selected categories yet.";

  let matchingType = "dare";
  if (outcome === "Truth") matchingType = "truth";
  if (outcome === "Take a Shot") matchingType = "shot";

  const matchingDares = enabledDares.filter((dare) => dare.type === matchingType);
  const pool = matchingDares.length ? matchingDares : enabledDares;
  return pool[Math.floor(Math.random() * pool.length)].text;
}

function nextRound() {
  state.selectedPlayer = "";
  state.selectedOutcome = "";
  state.selectedDare = "";
  playerSpinBusy = false;
  dareSpinBusy = false;
  window.clearTimeout(playerSpinTimeout);
  window.clearTimeout(dareSpinTimeout);
  playerSpinTimeout = null;
  dareSpinTimeout = null;
  els.spinPlayer.disabled = false;
  els.spinDare.disabled = false;
  els.nextRound.classList.add("gameplay-hidden");
  pointerRotation = 0;
  wheelRotation = 0;
  els.pointerFinger.style.transform = "translate(-50%, -50%) rotate(0deg)";
  els.dareWheel.style.transform = "rotate(0deg)";
  saveState();
  syncResults();
  setGameplayPhase("player");
}

function syncResults() {
  els.selectedPlayer.textContent = state.selectedPlayer || "Spin the arrow to choose the next player.";
  els.selectedOutcome.textContent = state.selectedOutcome || "Truth, Dare, or Shot will appear here.";
  els.selectedDare.textContent = state.selectedDare || "Spin the wheel when the next player is ready.";
  els.focusPlayer.textContent = state.selectedPlayer || "Waiting for a spin";
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
