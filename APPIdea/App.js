import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

const pointerAsset = require("./assets/pointing-finger.png");
const tabs = ["home", "play", "edit", "browse"];
const steps = ["setup", "players", "chooser", "outcome"];

const seedPublic = [
  { id: "pub-1", categoryName: "Warm Up Energy", author: "HouseHost", isPublic: true, intensity: "Lite", dares: [
    { id: "d1", text: "Do your best celebrity impression for 20 seconds.", type: "dare", enabled: true },
    { id: "d2", text: "Who here would survive longest in a zombie apocalypse?", type: "truth", enabled: true },
    { id: "d3", text: "Take one dramatic runway walk across the room.", type: "dare", enabled: true }
  ]},
  { id: "pub-2", categoryName: "Wild Night Out", author: "User123", isPublic: true, intensity: "Extreme", dares: [
    { id: "d4", text: "Text someone in the room using only song lyrics for one minute.", type: "dare", enabled: true },
    { id: "d5", text: "Take a shot or reveal your most chaotic drunk story.", type: "shot", enabled: true },
    { id: "d6", text: "Let the group pick a dance you must perform right now.", type: "dare", enabled: true }
  ]},
  { id: "pub-3", categoryName: "After Dark", author: "NightShift", isPublic: true, intensity: "NSFW", dares: [
    { id: "d7", text: "Reveal your boldest first-date move.", type: "truth", enabled: true },
    { id: "d8", text: "Whisper your best fake pickup line to the person on your left.", type: "dare", enabled: true },
    { id: "d9", text: "Take a sip if you've flirted your way out of trouble.", type: "shot", enabled: true }
  ]}
];

const seedLibrary = [
  { id: "my-1", categoryName: "Friends Only", author: "You", isPublic: false, intensity: "Lite", dares: [
    { id: "m1", text: "Swap phones with someone for one selfie.", type: "dare", enabled: true },
    { id: "m2", text: "Truth: who was your very first crush?", type: "truth", enabled: true },
    { id: "m3", text: "Take a sip of water and make a toast to the group.", type: "shot", enabled: true }
  ]}
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [step, setStep] = useState("setup");
  const [mode, setMode] = useState("rotation");
  const [library, setLibrary] = useState(seedLibrary);
  const [publicPacks, setPublicPacks] = useState(seedPublic);
  const [selectedIds, setSelectedIds] = useState(["my-1", "pub-1"]);
  const [players, setPlayers] = useState(["Alex", "Jamie", "Taylor"]);
  const [playerDraft, setPlayerDraft] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [turnIndex, setTurnIndex] = useState(0);
  const [spinPlayerBusy, setSpinPlayerBusy] = useState(false);
  const [spinWheelBusy, setSpinWheelBusy] = useState(false);
  const [packTitle, setPackTitle] = useState("");
  const [packAuthor, setPackAuthor] = useState("");
  const [packIntensity, setPackIntensity] = useState("Lite");
  const [packPublic, setPackPublic] = useState(true);
  const [packLines, setPackLines] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const pointer = useRef(new Animated.Value(0)).current;
  const wheel = useRef(new Animated.Value(0)).current;
  const pointerDeg = useRef(0);
  const wheelDeg = useRef(0);
  const pointerSpin = pointer.interpolate({ inputRange: [-20000, 20000], outputRange: ["-20000deg", "20000deg"] });
  const wheelSpin = wheel.interpolate({ inputRange: [-20000, 20000], outputRange: ["-20000deg", "20000deg"] });

  const allPublic = dedupePublic(library, publicPacks);
  const allPacks = [...library, ...allPublic];
  const browse = allPublic.filter((pack) => {
    const term = search.trim().toLowerCase();
    const okTerm = !term || pack.categoryName.toLowerCase().includes(term) || pack.author.toLowerCase().includes(term) || pack.dares.some((d) => d.text.toLowerCase().includes(term));
    const okFilter = filter === "all" || pack.intensity === filter;
    return okTerm && okFilter;
  });

  function openTab(nextTab) {
    if (nextTab === "play") beginPlayFlow();
    setTab(nextTab);
  }

  function moveStep(next) {
    if (next === "players" && !selectedIds.length) return Alert.alert("Pick categories first", "Select at least one pack.");
    if ((next === "chooser" || next === "outcome") && mode === "rotation" && !players.length) {
      return Alert.alert("Add players", "Rotation mode needs at least one player.");
    }
    setStep(next);
  }

  function addPlayer() {
    const name = playerDraft.trim() || nextGuestPlayerName(players);
    setPlayers((v) => [...v, name]);
    setPlayerDraft("");
  }

  function spinChooser() {
    if (spinPlayerBusy) return;
    const pool = players.length ? players : ["Closest Player"];
    if (mode === "rotation" && !players.length) return Alert.alert("Add players", "Rotation mode needs at least one player.");
    const chosenIndex = mode === "random" ? Math.floor(Math.random() * pool.length) : turnIndex % pool.length;
    const segment = 360 / pool.length;
    const targetAngle = chosenIndex * segment + (Math.random() - 0.5) * 8;
    const next = pointerDeg.current + (5 + Math.floor(Math.random() * 3)) * 360 + targetAngle;
    setSpinPlayerBusy(true);
    Animated.timing(pointer, { toValue: next, duration: 3600, easing: Easing.bezier(0.12, 0.88, 0.18, 1), useNativeDriver: true }).start(() => {
      pointerDeg.current = next;
      setSelectedPlayer(pool[chosenIndex]);
      if (mode === "rotation" && players.length) setTurnIndex((v) => (v + 1) % players.length);
      setSpinPlayerBusy(false);
    });
  }

  function spinOutcome() {
    if (spinWheelBusy) return;
    const labels = ["Truth", "Dare", "Take a Shot", "Wildcard Dare"];
    const chosenIndex = Math.floor(Math.random() * labels.length);
    const label = labels[chosenIndex];
    const next = wheelDeg.current + 1800 + (360 - chosenIndex * 90 - 45);
    const prompt = pickPrompt(label, allPacks, selectedIds);
    setSpinWheelBusy(true);
    Animated.timing(wheel, { toValue: next, duration: 3200, easing: Easing.bezier(0.15, 0.89, 0.23, 1), useNativeDriver: true }).start(() => {
      wheelDeg.current = next;
      setSelectedOutcome(label);
      setSelectedPrompt(prompt);
      setSpinWheelBusy(false);
    });
  }

  function resetRound() {
    beginPlayFlow();
  }

  function beginPlayFlow() {
    pointer.stopAnimation();
    wheel.stopAnimation();
    setStep("setup");
    setSelectedPlayer("");
    setSelectedOutcome("");
    setSelectedPrompt("");
    setTurnIndex(0);
    pointerDeg.current = 0;
    wheelDeg.current = 0;
    pointer.setValue(0);
    wheel.setValue(0);
  }

  function createPack() {
    const title = packTitle.trim();
    const lines = packLines.split("\n").map((v) => v.trim()).filter(Boolean);
    if (!title || !lines.length) return Alert.alert("Missing details", "Add a title and at least one prompt.");
    const stamp = Date.now();
    const pack = {
      id: `custom-${stamp}`,
      categoryName: title,
      author: packAuthor.trim() || "Anonymous",
      isPublic: packPublic,
      intensity: packIntensity,
      dares: lines.map((text, index) => ({ id: `custom-${stamp}-${index}`, text, type: inferType(text), enabled: true }))
    };
    setLibrary((v) => [pack, ...v]);
    if (packPublic) setPublicPacks((v) => [{ ...pack }, ...v]);
    setPackTitle("");
    setPackAuthor("");
    setPackLines("");
    setPackPublic(true);
    setPackIntensity("Lite");
  }

  function toggleSelected(id) {
    setSelectedIds((v) => (v.includes(id) ? v.filter((item) => item !== id) : [...v, id]));
  }

  function toggleDare(packId, dareId) {
    setLibrary((items) => items.map((pack) => pack.id !== packId ? pack : { ...pack, dares: pack.dares.map((dare) => dare.id === dareId ? { ...dare, enabled: !dare.enabled } : dare) }));
  }

  function togglePublish(packId) {
    let updated = null;
    setLibrary((items) => items.map((pack) => {
      if (pack.id !== packId) return pack;
      updated = { ...pack, isPublic: !pack.isPublic };
      return updated;
    }));
    if (!updated) return;
    setPublicPacks((items) => {
      const exists = items.some((pack) => pack.id === updated.id);
      if (updated.isPublic && !exists) return [{ ...updated }, ...items];
      if (!updated.isPublic) return items.filter((pack) => pack.id !== updated.id);
      return items.map((pack) => pack.id === updated.id ? { ...updated } : pack);
    });
  }

  function addPack(packId) {
    const pack = publicPacks.find((item) => item.id === packId);
    if (!pack) return;
    const exists = library.some((item) => item.id === pack.id || item.categoryName === pack.categoryName);
    if (!exists) setLibrary((items) => [{ ...pack }, ...items]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <View style={s.shell}>
        <View style={s.top}>
          <Text style={s.eyebrow}>Party App</Text>
          <Text style={s.brand}>After Hours</Text>
          <Text style={s.muted}>A React Native app scaffold with your real finger PNG and suspenseful spinner.</Text>
          <View style={s.nav}>{tabs.map((name) => (
            <Pressable key={name} onPress={() => openTab(name)} style={[s.navBtn, tab === name && s.navBtnOn]}>
              <Text style={s.navTxt}>{name === "browse" ? "Browse Packs" : cap(name)}</Text>
            </Pressable>
          ))}</View>
        </View>

        <ScrollView contentContainerStyle={s.main}>
          {tab === "home" && (
            <View style={s.card}>
              <Text style={s.eyebrow}>Main Screen</Text>
              <Text style={s.hero}>Choose your kind of chaos.</Text>
              <Text style={s.copy}>Play step by step, create your own packs, and browse public packs to add into your library.</Text>
              <View style={s.row}>
                <Button label="Play" onPress={() => openTab("play")} />
                <Button label="Edit Dares" onPress={() => openTab("edit")} tone="soft" />
                <Button label="Browse Packs" onPress={() => openTab("browse")} tone="soft" />
              </View>
              <View style={s.stats}>
                <Stat value={String(library.length)} label="My Packs" />
                <Stat value={String(allPublic.length)} label="Public Packs" />
              </View>
            </View>
          )}

          {tab === "play" && (
            <View style={s.stack}>
              <View style={s.card}>
                <Text style={s.eyebrow}>Gameplay Engine</Text>
                <Text style={s.title}>Move through the round one phase at a time.</Text>
                <View style={s.rowSpread}>
                  <View style={s.stepRow}>{steps.map((name, index) => (
                    <Pressable key={name} onPress={() => moveStep(name)} style={[s.stepBtn, step === name && s.stepBtnOn]}>
                      <Text style={s.stepTxt}>{index + 1}. {stepLabel(name)}</Text>
                    </Pressable>
                  ))}</View>
                  <Button label="Reset" onPress={resetRound} tone="ghost" />
                </View>
              </View>

              {step === "setup" && (
                <Phase title="Pick the categories for this round." subtitle="Mix lite, extreme, NSFW, or drinking packs before the game starts.">
                  <View style={s.cardInner}>{allPacks.map((pack) => (
                    <Pressable key={pack.id} onPress={() => toggleSelected(pack.id)} style={[s.chip, selectedIds.includes(pack.id) && s.chipOn]}>
                      <View style={[s.check, selectedIds.includes(pack.id) && s.checkOn]}>
                        {selectedIds.includes(pack.id) && <Text style={s.checkMark}>✓</Text>}
                      </View>
                      <View style={s.chipCopy}>
                        <Text style={s.chipTitle}>{pack.categoryName}</Text>
                        <Text style={s.chipMeta}>{pack.intensity} pack  •  {enabledCount(pack)} prompts active</Text>
                      </View>
                    </Pressable>
                  ))}</View>
                  <View style={s.rowSpread}>
                    <Text style={s.muted}>Select at least one category to continue.</Text>
                    <Button label="Next: Players" onPress={() => moveStep("players")} />
                  </View>
                </Phase>
              )}

              {step === "players" && (
                <Phase title="Choose how the app picks the next player." subtitle="Rotation keeps order. Random select chooses anyone each spin.">
                  <View style={s.row}>
                    <Button label="Rotation" onPress={() => setMode("rotation")} tone={mode === "rotation" ? "primary" : "soft"} />
                    <Button label="Random Select" onPress={() => setMode("random")} tone={mode === "random" ? "primary" : "soft"} />
                  </View>
                  <Text style={s.muted}>{mode === "random" ? "Random mode can pick any player each spin. With no names, it falls back to a generic closest-player result." : "Rotation mode moves through your players in order."}</Text>
                    <View style={s.cardInner}>
                      <View style={s.inputRow}>
                        <TextInput value={playerDraft} onChangeText={setPlayerDraft} placeholder="Add player name" placeholderTextColor="#8f88ae" style={s.input} />
                        <Button label="Add" onPress={addPlayer} />
                      </View>
                      <View style={s.playerListWrap}>
                        {!players.length && <Text style={s.muted}>{mode === "random" ? "No players added yet. Random mode can still run." : "No players yet. Add names to use rotation mode."}</Text>}
                        {players.map((player, index) => (
                          <View key={`${player}-${index}`} style={s.pill}>
                          <Text style={s.txt}>{player}</Text>
                          <Pressable onPress={() => setPlayers((items) => items.filter((_, i) => i !== index))} style={s.x}><Text style={s.txt}>x</Text></Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={s.rowSpread}>
                    <Button label="Back" onPress={() => moveStep("setup")} tone="ghost" />
                    <Button label="Next: Choose Player" onPress={() => moveStep("chooser")} />
                  </View>
                </Phase>
              )}

              {step === "chooser" && (
                <Phase title="Spin the finger and let the suspense build." subtitle="The pointer uses your real PNG and spins multiple times before landing.">
                  <View style={s.center}>
                    <View style={s.disc}>
                      {markers(players.length ? players : ["Closest Player"]).map((marker) => marker)}
                      <Animated.View style={[s.orbit, { transform: [{ rotate: pointerSpin }] }]}>
                        <Image source={pointerAsset} resizeMode="contain" style={s.pointer} />
                      </Animated.View>
                    </View>
                    <View style={[s.result, s.resultHot]}>
                      <Text style={s.resultLabel}>Selected Player</Text>
                      <Text style={s.resultBig}>{selectedPlayer || "Add players or use random mode."}</Text>
                    </View>
                  </View>
                  <View style={s.rowSpread}>
                    <Button label="Back" onPress={() => moveStep("players")} tone="ghost" />
                    <View style={s.row}>
                      <Button label={spinPlayerBusy ? "Spinning..." : "Spin Finger"} onPress={spinChooser} disabled={spinPlayerBusy} />
                      <Button label="Next: Spin Outcome" onPress={() => moveStep("outcome")} tone="soft" />
                    </View>
                  </View>
                </Phase>
              )}

              {step === "outcome" && (
                <Phase title="Spin the wheel to decide what happens next." subtitle="The wheel picks truth, dare, shot, or wildcard and then pulls a matching prompt.">
                  <View style={s.center}>
                    <View style={s.wheelWrap}>
                      <View style={s.pointerTip} />
                      <Animated.View style={[s.wheel, { transform: [{ rotate: wheelSpin }] }]}>
                        <View style={s.wheelCore}><Text style={s.txt}>Spin</Text></View>
                      </Animated.View>
                    </View>
                    <View style={s.result}><Text style={s.resultLabel}>Wheel Result</Text><Text style={s.resultTxt}>{selectedOutcome || "Truth, Dare, or Shot will appear here."}</Text></View>
                    <View style={[s.result, s.resultHot]}><Text style={s.resultLabel}>Dare / Prompt</Text><Text style={s.resultBig}>{selectedPrompt || "Pick categories, then spin the wheel."}</Text></View>
                  </View>
                  <View style={s.rowSpread}>
                    <Button label="Back" onPress={() => moveStep("chooser")} tone="ghost" />
                    <View style={s.row}>
                      <Button label={spinWheelBusy ? "Spinning..." : "Spin Wheel"} onPress={spinOutcome} disabled={spinWheelBusy} />
                      <Button label="Play Again" onPress={() => moveStep("setup")} tone="soft" />
                    </View>
                  </View>
                </Phase>
              )}
            </View>
          )}

          {tab === "edit" && (
            <View style={s.stack}>
              <View style={s.card}>
                <Text style={s.eyebrow}>Category Creator</Text>
                <Text style={s.title}>Create a Pack</Text>
                <TextInput value={packTitle} onChangeText={setPackTitle} placeholder="Pack title" placeholderTextColor="#8f88ae" style={s.input} />
                <TextInput value={packAuthor} onChangeText={setPackAuthor} placeholder="Your name or alias" placeholderTextColor="#8f88ae" style={s.input} />
                <View style={s.row}>{["Lite", "Extreme", "NSFW", "Drinking"].map((name) => (
                  <Button key={name} label={name} onPress={() => setPackIntensity(name)} tone={packIntensity === name ? "primary" : "soft"} />
                ))}</View>
                <View style={s.rowSpread}><Text style={s.txt}>Publish to browse screen</Text><Switch value={packPublic} onValueChange={setPackPublic} trackColor={{ true: "#ff8f3d" }} /></View>
                <TextInput value={packLines} onChangeText={setPackLines} placeholder="Add one dare or truth per line" placeholderTextColor="#8f88ae" style={[s.input, s.area]} multiline textAlignVertical="top" />
                <Button label="Create Pack" onPress={createPack} />
              </View>

              <View style={s.card}>
                <Text style={s.eyebrow}>My Library</Text>
                <Text style={s.title}>Toggle prompts on or off without deleting the pack.</Text>
                {library.map((pack) => (
                  <View key={pack.id} style={s.pack}>
                    <View style={s.rowSpread}>
                      <View style={s.flex}>
                        <Text style={s.packTitle}>{pack.categoryName}</Text>
                        <Text style={s.muted}>by {pack.author} | {pack.intensity} | {pack.isPublic ? "Public" : "Private"}</Text>
                      </View>
                      <Button label={pack.isPublic ? "Unpublish" : "Publish"} onPress={() => togglePublish(pack.id)} tone="soft" />
                    </View>
                    {pack.dares.map((dare) => (
                      <View key={dare.id} style={[s.dare, !dare.enabled && s.dim]}>
                        <View style={s.flex}>
                          <Text style={s.txt}>{dare.text}</Text>
                          <Text style={s.type}>{cap(dare.type)}</Text>
                        </View>
                        <Switch value={dare.enabled} onValueChange={() => toggleDare(pack.id, dare.id)} trackColor={{ true: "#ff8f3d" }} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === "browse" && (
            <View style={s.card}>
              <Text style={s.eyebrow}>Community Hub</Text>
              <Text style={s.title}>Search public packs and add them to your library.</Text>
              <TextInput value={search} onChangeText={setSearch} placeholder="Search public packs" placeholderTextColor="#8f88ae" style={s.input} />
              <View style={s.row}>{["all", "Lite", "Extreme", "NSFW", "Drinking"].map((name) => (
                <Button key={name} label={name === "all" ? "All Intensities" : name} onPress={() => setFilter(name)} tone={filter === name ? "primary" : "soft"} />
              ))}</View>
              {browse.map((pack) => {
                const added = library.some((item) => item.id === pack.id || item.categoryName === pack.categoryName);
                return (
                  <View key={pack.id} style={s.pack}>
                    <View style={s.rowSpread}>
                      <View style={s.flex}>
                        <Text style={s.packTitle}>{pack.categoryName}</Text>
                        <Text style={s.muted}>by {pack.author} | {pack.intensity} | {pack.dares.length} prompts</Text>
                      </View>
                      <Button label={added ? "Added" : "Add to Library"} onPress={() => addPack(pack.id)} tone={added ? "ghost" : "primary"} disabled={added} />
                    </View>
                    <Text style={s.txt}>{pack.dares.slice(0, 2).map((dare) => dare.text).join(" | ")}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  function markers(pool) {
    const total = pool.length;
    return pool.map((player, index) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
      const x = 50 + Math.cos(angle) * 40;
      const y = 50 + Math.sin(angle) * 40;
      return (
        <View key={`${player}-${index}`} style={[s.marker, { left: `${x}%`, top: `${y}%` }]}>
          <Text style={s.markerTxt} numberOfLines={1}>{player}</Text>
        </View>
      );
    });
  }
}

function Phase({ title, subtitle, children }) {
  return <View style={s.phase}><Text style={s.eyebrow}>Play Phase</Text><Text style={s.hero}>{title}</Text><Text style={s.copy}>{subtitle}</Text>{children}</View>;
}

function Button({ label, onPress, tone = "primary", disabled = false }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.btn, tone === "primary" && s.btnHot, tone === "soft" && s.btnSoft, tone === "ghost" && s.btnGhost, disabled && s.btnOff]}>
      <Text style={[s.btnTxt, tone === "primary" && s.btnTxtHot]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label }) {
  return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.muted}>{label}</Text></View>;
}

function stepLabel(name) {
  if (name === "setup") return "Setup";
  if (name === "players") return "Players";
  if (name === "chooser") return "Choose Player";
  return "Spin Outcome";
}

function dedupePublic(library, publicPacks) {
  const map = new Map();
  [...publicPacks, ...library.filter((pack) => pack.isPublic)].forEach((pack) => map.set(pack.id, pack));
  return Array.from(map.values());
}

function pickPrompt(outcome, packs, selectedIds) {
  const enabled = packs.filter((pack) => selectedIds.includes(pack.id)).flatMap((pack) => pack.dares.filter((dare) => dare.enabled));
  if (!enabled.length) return "No enabled prompts in the selected categories yet.";
  let type = "dare";
  if (outcome === "Truth") type = "truth";
  if (outcome === "Take a Shot") type = "shot";
  const matching = enabled.filter((dare) => dare.type === type);
  const pool = matching.length ? matching : enabled;
  return pool[Math.floor(Math.random() * pool.length)].text;
}

function enabledCount(pack) {
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

function cap(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0912" },
  shell: { flex: 1, backgroundColor: "#120f1f" },
  top: { padding: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(10,11,18,0.86)" },
  main: { padding: 18, gap: 18 },
  eyebrow: { color: "#ff8f3d", textTransform: "uppercase", letterSpacing: 2, fontSize: 11, fontWeight: "800", marginBottom: 8 },
  brand: { color: "#f4f1ff", fontSize: 34, fontWeight: "900" },
  hero: { color: "#f4f1ff", fontSize: 34, lineHeight: 36, fontWeight: "900" },
  title: { color: "#f4f1ff", fontSize: 26, lineHeight: 30, fontWeight: "900" },
  copy: { color: "#b8b2d2", fontSize: 15, lineHeight: 23, marginTop: 8 },
  muted: { color: "#b8b2d2" },
  txt: { color: "#f4f1ff", fontWeight: "700" },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)" },
  navBtnOn: { backgroundColor: "rgba(255,143,61,0.22)" },
  navTxt: { color: "#f4f1ff", fontWeight: "700" },
  stack: { gap: 18 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  rowSpread: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" },
  flex: { flex: 1, gap: 4 },
  stats: { gap: 12, marginTop: 18 },
  stat: { padding: 20, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statValue: { color: "#f4f1ff", fontSize: 40, fontWeight: "900" },
  card: { borderRadius: 24, padding: 20, backgroundColor: "rgba(20,23,37,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 12 },
  phase: { minHeight: 720, borderRadius: 28, padding: 22, backgroundColor: "rgba(20,23,37,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 18, justifyContent: "space-between" },
  cardInner: { borderRadius: 20, padding: 16, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 12 },
  stepRow: { flex: 1, gap: 10 },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)" },
  stepBtnOn: { backgroundColor: "rgba(255,143,61,0.22)" },
  stepTxt: { color: "#f4f1ff", fontWeight: "700" },
  chip: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 18, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  chipOn: { backgroundColor: "rgba(255,143,61,0.12)", borderColor: "rgba(255,143,61,0.55)" },
  chipCopy: { flex: 1, gap: 5 },
  chipTitle: { color: "#f4f1ff", fontSize: 17, fontWeight: "800" },
  chipMeta: { color: "#b8b2d2", fontSize: 13, fontWeight: "600" },
  check: { width: 26, height: 26, borderRadius: 9, borderWidth: 1.5, borderColor: "#6ee7d8", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,10,18,0.55)" },
  checkOn: { backgroundColor: "#ffb54a", borderColor: "#ff8f3d" },
  checkMark: { color: "#130f17", fontSize: 15, fontWeight: "900" },
  inputRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.05)", color: "#f4f1ff", paddingHorizontal: 16, paddingVertical: 14 },
  area: { minHeight: 140 },
  playerListWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  pill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  x: { width: 24, height: 24, borderRadius: 99, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
  center: { alignItems: "center", gap: 18 },
  disc: { width: 330, height: 330, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  orbit: { position: "absolute", width: 330, height: 330, alignItems: "center" },
  pointer: { width: 210, height: 150, marginLeft: 92, marginTop: 18 },
  marker: { position: "absolute", width: 94, marginLeft: -47, marginTop: -16, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 99, backgroundColor: "rgba(13,14,22,0.92)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  markerTxt: { color: "#f4f1ff", fontSize: 12, fontWeight: "700", textAlign: "center" },
  wheelWrap: { width: 320, height: 320, alignItems: "center", justifyContent: "center" },
  wheel: { width: 280, height: 280, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#ff8f3d", borderWidth: 10, borderColor: "rgba(255,255,255,0.08)" },
  wheelCore: { width: 92, height: 92, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,16,25,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  pointerTip: { position: "absolute", top: 8, width: 0, height: 0, borderLeftWidth: 16, borderRightWidth: 16, borderTopWidth: 28, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#fff2cc", zIndex: 2 },
  result: { width: "100%", borderRadius: 20, padding: 16, backgroundColor: "rgba(255,255,255,0.05)" },
  resultHot: { backgroundColor: "rgba(255,143,61,0.14)" },
  resultLabel: { color: "#6ee7d8", textTransform: "uppercase", letterSpacing: 2, fontSize: 11, fontWeight: "800", marginBottom: 10 },
  resultTxt: { color: "#f4f1ff", fontSize: 18, lineHeight: 24, fontWeight: "800" },
  resultBig: { color: "#f4f1ff", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  pack: { borderRadius: 22, padding: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 12 },
  packTitle: { color: "#f4f1ff", fontSize: 18, fontWeight: "800" },
  dare: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.18)" },
  type: { color: "#6ee7d8", fontSize: 12, fontWeight: "700" },
  dim: { opacity: 0.45 },
  btn: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnHot: { backgroundColor: "#ffb54a" },
  btnSoft: { backgroundColor: "rgba(255,255,255,0.08)" },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.05)" },
  btnOff: { opacity: 0.55 },
  btnTxt: { color: "#f4f1ff", fontWeight: "800" },
  btnTxtHot: { color: "#130f17" }
});
