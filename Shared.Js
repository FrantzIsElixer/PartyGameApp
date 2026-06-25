// shared.js — common state, seed data, and utilities for After Hours
// Imported by both script.js and gameplay.js via ES modules

export const STORAGE_KEY = "after-hours-prototype-state";

export const seedPublicPacks = [
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
      { id: "d12", text: "What drink order is your biggest red flag?", type: "truth", enabled: true }
    ]
  }
];

export const seedLibraryPacks = [
  {
    id: "my-1",
    categoryName: "Friends Only",
    author: "You",
    isPublic: false,
    intensity: "Lite",
    source: "local",
    dares: [
      { id: "m1", text: "Swap phones with someone for one selfie.", type: "dare", enabled: true },
      { id: "m2", text: "Who was your very first crush?", type: "truth", enabled: true },
      { id: "m3", text: "Take a sip of water and make a toast to the group.", type: "shot", enabled: true }
    ]
  }
];

// Fix #4: expanded inferType with richer keyword matching
export function inferType(text) {
  const lower = text.toLowerCase();
  const shotWords = ["shot", "sip", "drink", "chug", "take a", "bottoms up", "down your"];
  const truthWords = [
    "truth", "who ", "what ", "when ", "where ", "why ", "how ",
    "reveal", "confess", "admit", "tell ", "have you", "have you ever",
    "would you", "do you", "did you", "your biggest", "your most",
    "your worst", "your best", "your last"
  ];
  if (shotWords.some((w) => lower.includes(w))) return "shot";
  if (truthWords.some((w) => lower.includes(w))) return "truth";
  return "dare";
}

export function normalizeState(nextState) {
  const libraryPacks = dedupePacksById(
    nextState.libraryPacks?.length ? nextState.libraryPacks : structuredClone(seedLibraryPacks)
  );
  const publicPacks = dedupePacksByIdentity(
    nextState.publicPacks?.length ? nextState.publicPacks : structuredClone(seedPublicPacks)
  );
  const availableCategoryIds = new Set(libraryPacks.map((p) => p.id));
  const selectedCategoryIds = (
    nextState.selectedCategoryIds?.length ? nextState.selectedCategoryIds : ["my-1", "pub-1"]
  ).filter((id, i, ids) => availableCategoryIds.has(id) && ids.indexOf(id) === i);

  return {
    ...nextState,
    libraryPacks,
    publicPacks,
    selectedCategoryIds: selectedCategoryIds.length ? selectedCategoryIds : ["my-1", "pub-1"]
  };
}

export function dedupePacksById(packs) {
  const deduped = new Map();
  packs.forEach((pack) => {
    if (!pack?.id) return;
    deduped.set(pack.id, normalizePack(pack));
  });
  return Array.from(deduped.values());
}

export function dedupePacksByIdentity(packs) {
  const deduped = new Map();
  packs.forEach((pack) => {
    if (!pack) return;
    deduped.set(getPackIdentity(pack), normalizePack(pack));
  });
  return Array.from(deduped.values());
}

export function normalizePack(pack) {
  return {
    ...pack,
    categoryName: String(pack.categoryName || "Untitled Pack").trim(),
    author: String(pack.author || "Anonymous").trim(),
    source: pack.source || (pack.isPublic ? "community" : "local"),
    dares: Array.isArray(pack.dares)
      ? pack.dares
          .map((dare, index) => ({
            id: dare.id || `${pack.id || "pack"}-dare-${index}`,
            text: String(dare.text || "").trim(),
            type: dare.type || inferType(String(dare.text || "")),
            enabled: dare.enabled !== false
          }))
          .filter((dare) => dare.text)
      : []
  };
}

export function getPackIdentity(pack) {
  const name = String(pack?.categoryName || "").trim().toLowerCase();
  return name || String(pack?.id || "").trim().toLowerCase();
}

export function countEnabled(pack) {
  return pack.dares.filter((d) => d.enabled).length;
}

export function nextGuestPlayerName(players) {
  let i = 1;
  const names = new Set(players);
  while (names.has(`Player ${i}`)) i++;
  return `Player ${i}`;
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function loadState(defaults = {}) {
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
        playerTurnCounts: parsed.playerTurnCounts || {},
        ...defaults
      });
    } catch (_) {
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
    currentPlayerIndex: 0,
    roundCount: 0,
    playerTurnCounts: {},
    ...defaults
  });
}

export function saveStateToStorage(state) {
  const normalized = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}