// gameplay.js — After Hours Prototype (improved)
// Fixes applied:
// #2  Wheel has visible SVG segment labels (TRUTH / DARE / SHOT / WILD)
// #3  Round counter tracked and displayed
// #6  currentPlayerIndex never reset in nextRound(), only in full reset
// #7  Skip / Pass button redraws a prompt without counting as a new turn
// #8  Guard banner shown if no game state / selectedCategoryIds found
// #9  button:disabled opacity handled in CSS; vibration on mobile spin

const STORAGE_KEY = "after-hours-prototype-state";
const POINTER_SPIN_DURATION = 2200;
const WHEEL_SPIN_DURATION = 2400;

// ─── Seed data (self-contained fallback) ──────────────────────────────────────

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
let pointerRotation = 0;
let wheelRotation = 0;
let playerSpinBusy = false;
let dareSpinBusy = false;
let playerSpinTimeout = null;
let dareSpinTimeout = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const els = {
  guardBanner: document.getElementById("guard-banner"),
  playerStage: document.getElementById("player-stage"),
  dareStage: document.getElementById("dare-stage"),
  gameplayStageTag: document.getElementById("gameplay-stage-tag"),
  focusPlayer: document.getElementById("focus-player"),
  nextRound: document.getElementById("next-round-link"),
  skipDare: document.getElementById("skip-dare"),
  spinPlayer: document.getElementById("spin-player"),
  spinDare: document.getElementById("spin-dare"),
  playerRing: document.getElementById("player-ring"),
  pointerFinger: document.getElementById("pointer-finger"),
  dareWheel: document.getElementById("dare-wheel"),
  selectedPlayer: document.getElementById("selected-player"),
  selectedOutcome: document.getElementById("selected-outcome"),
  selectedDare: document.getElementById("selected-dare"),
  roundCount: document.getElementById("round-count")
};

initGameplay();

// ─── Boot ─────────────────────────────────────────────────────────────────────

function initGameplay() {
  // Fix #8: show guard banner if no setup state found
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || !JSON.parse(raw).selectedCategoryIds?.length) {
    els.guardBanner.classList.remove("hidden");
  }

  els.spinPlayer.addEventListener("click", spinPlayer);
  els.spinDare.addEventListener("click", spinDare);
  els.nextRound.addEventListener("click", nextRound);
  // Fix #7: skip button redraws prompt, doesn't advance round counter
  els.skipDare.addEventListener("click", skipDare);
  renderGameplay();
}

// ─── Render ───────────────────────────────────────────────────────────────────

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

// ─── Spin actions ─────────────────────────────────────────────────────────────

function spinPlayer() {
  if (playerSpinBusy) return;
  const players = state.players.length ? state.players : ["Closest Player"];
  const selectedIndex = getSelectedPlayerIndex(players);
  const player = players[selectedIndex];
  const targetAngle = ((selectedIndex / players.length) * 360) - 90 + (Math.random() - 0.5) * 10;
  const nextRotation = pointerRotation + 1440 + targetAngle;

  playerSpinBusy = true;
  els.spinPlayer.disabled = true;
  // Fix #9: haptic feedback on mobile
  if (navigator.vibrate) navigator.vibrate(60);
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

function spinDare() {
  if (dareSpinBusy) return;
  if (!state.selectedPlayer) { spinPlayer(); return; }

  // Segments are drawn at 45, 135, 225, 315 degrees on the SVG (diagonal quarters).
  // The pointer sits at the TOP of the wheel (12 o'clock = 0deg in CSS rotation space).
  // Segment centers in the SVG's own coordinate system:
  //   TRUTH  = 45deg,  DARE = 135deg, SHOT = 225deg, WILD = 315deg
  // To bring a segment to the top (0deg), we rotate the wheel by: -segmentCenter
  // i.e. rotate(-45) brings TRUTH to top, rotate(-135) brings DARE, etc.
  const options = ["Truth", "Dare", "Take a Shot", "Wildcard Dare"];
  const segmentCenters = [45, 135, 225, 315]; // matches SVG rotate() values

  // Pick a random segment
  const selectedIndex = Math.floor(Math.random() * options.length);

  // How much to rotate wheel so chosen segment faces top (0deg pointer)?
  // targetDeg = 360 - segmentCenter  (rotate forward to bring it to top)
  const targetDeg = (360 - segmentCenters[selectedIndex]) % 360;
  const currentNormalized = ((wheelRotation % 360) + 360) % 360;
  let delta = (targetDeg - currentNormalized + 360) % 360;
  if (delta < 30) delta += 360; // ensure meaningful spin
  const spinAngle = wheelRotation + 1800 + delta;

  dareSpinBusy = true;
  els.spinDare.disabled = true;
  if (navigator.vibrate) navigator.vibrate(80);
  els.dareWheel.style.transform = `rotate(${spinAngle}deg)`;

  window.clearTimeout(dareSpinTimeout);
  dareSpinTimeout = window.setTimeout(() => {
    wheelRotation = spinAngle;

    // Verify which segment actually landed at top by back-calculating.
    // finalNorm is where the wheel rests. The segment at top satisfies:
    //   (segmentCenter + finalNorm) % 360 ≈ 0  (or 360)
    const finalNorm = ((spinAngle % 360) + 360) % 360;
    const landedIndex = segmentCenters.reduce((bestIdx, center, i) => {
      const landed = (center + finalNorm) % 360;
      const dist = Math.min(landed, 360 - landed); // distance from 0/360
      const bestLanded = (segmentCenters[bestIdx] + finalNorm) % 360;
      const bestDist = Math.min(bestLanded, 360 - bestLanded);
      return dist < bestDist ? i : bestIdx;
    }, selectedIndex);

    const selectedLabel = options[landedIndex];
    const dare = getPromptForOutcome(selectedLabel);

    state.selectedOutcome = selectedLabel;
    state.selectedDare = dare;
    state.roundCount = (state.roundCount || 0) + 1;
    if (state.selectedPlayer && state.selectedPlayer !== "Closest Player") {
      state.playerTurnCounts = state.playerTurnCounts || {};
      state.playerTurnCounts[state.selectedPlayer] = (state.playerTurnCounts[state.selectedPlayer] || 0) + 1;
    }
    syncResults();
    saveState();
    dareSpinBusy = false;
    els.spinDare.disabled = false;
    els.nextRound.classList.remove("gameplay-hidden");
    els.skipDare.classList.remove("gameplay-hidden");
  }, WHEEL_SPIN_DURATION);
}

// Fix #7: skip redraws a new prompt without counting as a new round
function skipDare() {
  if (!state.selectedOutcome) return;
  const newDare = getPromptForOutcome(state.selectedOutcome);
  state.selectedDare = newDare;
  syncResults();
  saveState();
}

function nextRound() {
  state.selectedOutcome = "";
  state.selectedDare = "";
  // Fix #6: do NOT reset currentPlayerIndex here — only reset on full game reset
  playerSpinBusy = false;
  dareSpinBusy = false;
  window.clearTimeout(playerSpinTimeout);
  window.clearTimeout(dareSpinTimeout);
  playerSpinTimeout = null;
  dareSpinTimeout = null;
  els.spinPlayer.disabled = false;
  els.spinDare.disabled = false;
  els.nextRound.classList.add("gameplay-hidden");
  els.skipDare.classList.add("gameplay-hidden");
  pointerRotation = 0;
  wheelRotation = 0;
  els.pointerFinger.style.transform = "translate(-50%, -50%) rotate(0deg)";
  els.dareWheel.style.transform = "rotate(0deg)";
  // Clear selected player so picker runs again
  state.selectedPlayer = "";
  saveState();
  syncResults();
  setGameplayPhase("player");
}

function syncResults() {
  els.selectedPlayer.textContent = state.selectedPlayer || "Spin the arrow to choose the next player.";
  els.selectedOutcome.textContent = state.selectedOutcome || "Truth, Dare, or Shot will appear here.";
  els.selectedDare.textContent = state.selectedDare || "Spin the wheel when the next player is ready.";
  els.focusPlayer.textContent = state.selectedPlayer || "Waiting for a spin";
  // Fix #3: update round counter display
  if (els.roundCount) els.roundCount.textContent = state.roundCount || 0;
}

// ─── Prompt selection ─────────────────────────────────────────────────────────

function getPromptForOutcome(outcome) {
  const activePacks = getPlayablePacks().filter((p) => state.selectedCategoryIds.includes(p.id));
  const enabledDares = activePacks.flatMap((p) => p.dares.filter((d) => d.enabled));
  if (!enabledDares.length) return "No enabled prompts in the selected categories yet.";
  let matchingType = "dare";
  if (outcome === "Truth") matchingType = "truth";
  if (outcome === "Take a Shot") matchingType = "shot";
  const matching = enabledDares.filter((d) => d.type === matchingType);
  const pool = matching.length ? matching : enabledDares;
  return pool[Math.floor(Math.random() * pool.length)].text;
}

// ─── Player selection ─────────────────────────────────────────────────────────

// Fix #6: index advances correctly and is NOT reset between rounds
function getSelectedPlayerIndex(players) {
  if (!players.length) return 0;
  if (state.playerMode === "random") return Math.floor(Math.random() * players.length);
  const nextIndex = (state.currentPlayerIndex || 0) % players.length;
  // Advance for next time — persisted to state so it survives between rounds
  state.currentPlayerIndex = (nextIndex + 1) % players.length;
  return nextIndex;
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
        currentView: "play",
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
    currentView: "play", playerMode: "rotation",
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
