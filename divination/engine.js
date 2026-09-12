/* GhostLab: Divination web engine.
   A port of the iOS app's Shared/ layer: the Field Deck, the spread catalog,
   the shuffle, the three reading voices, the Oracle composer, and the eight
   ball faces. No UI in here. */
(function () {
  "use strict";
  const GL = (window.GL = window.GL || {});

  // ---------- Text helpers (ReadingComposer private helpers) ----------
  const scrub = (t) => String(t == null ? "" : t).replace(/—/g, ",").replace(/–/g, ",").replace(/‑/g, "-");
  const trim = (t) => scrub(t).trim();
  function finish(text) {
    let v = trim(text);
    while (v.includes("  ")) v = v.replace(/ {2}/g, " ");
    if (!v) return "";
    if (!/[.?)"]$/.test(v)) v += ".";
    return v;
  }
  const lowerFirst = (t) => { const s = trim(t); return s ? s[0].toLowerCase() + s.slice(1) : s; };
  const upperFirst = (t) => { const s = trim(t); return s ? s[0].toUpperCase() + s.slice(1) : s; };
  function statement(t) { const v = trim(t); return v ? finish(upperFirst(v)) : "A shift in your life."; }
  function clause(t) { const v = trim(t); return v ? finish(lowerFirst(v)) : "a shift in your life."; }
  const assemble = (parts) => parts.map(finish).filter(Boolean).join(" ");
  const join = (parts) => parts.filter((p) => p && p.length).join(" ");
  const sentenceCount = (t) => Math.max(1, (t.match(/[.?]/g) || []).length);
  function clip(parts, limit) {
    const kept = []; let used = 0;
    for (const raw of parts) { const part = finish(raw); if (!part) continue; const cost = sentenceCount(part); if (!kept.length || used + cost <= limit) { kept.push(part); used += cost; } }
    return kept.join(" ");
  }
  function firstSentences(text, limit) {
    const t = trim(text); const kept = []; let cur = "";
    for (const ch of t) { cur += ch; if (ch === "." || ch === "?") { kept.push(cur.trim()); cur = ""; if (kept.length === limit) break; } }
    if (!kept.length) return t;
    if (kept.length < limit && cur.trim()) kept.push(cur.trim());
    return kept.join(" ");
  }
  function distilled(text) {
    const raw = trim(text);
    let parts = raw.split(", ").map((p) => { p = p.trim(); for (const lead of ["or ", "and "]) if (p.toLowerCase().startsWith(lead)) p = p.slice(lead.length); while (p.endsWith(".")) p = p.slice(0, -1); return p; }).filter(Boolean);
    if (parts.length >= 3 && parts.every((p) => p.split(" ").length <= 4)) return `${parts[0]} and ${parts[1]}`;
    return raw;
  }
  const containsWord = (hay, word) => new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(hay);
  const scalarSum = (s) => { let n = 0; for (const ch of s) n = (n + ch.codePointAt(0)) | 0; return Math.abs(n); };
  const quoted = (t) => scrub(t).replace(/"/g, "'");
  GL.text = { scrub, finish, lowerFirst, upperFirst };

  // ---------- Voices ----------
  const VOICES = [
    { id: "mystic", title: "Mystic", blurb: "Warm and atmospheric, a reader talking with you in picture language.", short: "What is coming through." },
    { id: "clinical", title: "Clinical", blurb: "Short and direct. Each seat named, each card said in a line or two.", short: "Short and direct." },
    { id: "skeptical", title: "Skeptical", blurb: "A straight-talking friend who calls the pattern and stays honest about the shuffle.", short: "The pattern, called straight." },
  ];
  GL.VOICES = VOICES;
  GL.voice = (id) => VOICES.find((v) => v.id === id) || VOICES[1];

  // ---------- Field Deck ----------
  const SUITS = {
    wands: { title: "Wands", element: "Fire", fieldNote: "Ignition and fieldwork", register: "drive and appetite" },
    cups: { title: "Cups", element: "Water", fieldNote: "Condensation and signal in water", register: "feeling and connection" },
    swords: { title: "Swords", element: "Air", fieldNote: "Interference and analysis", register: "the mind and what needs saying" },
    pentacles: { title: "Pentacles", element: "Earth", fieldNote: "Apparatus and residual objects", register: "the practical and material ground" },
    none: { title: "Lab", element: "Lab", fieldNote: "Method, observer, contamination", register: "the method itself" },
  };
  GL.SUITS = SUITS;
  const INSTRUMENT_ID = "instrument";
  const SMITH_CREDIT = "Illustrations by Pamela Colman Smith, 1909 (public domain).";
  GL.SMITH_CREDIT = SMITH_CREDIT;

  function rankLabel(arcana, rank, roman, isInstrument) {
    if (isInstrument) return null;
    if (arcana === "major") return roman || (rank != null ? String(rank) : null);
    return { 1: "Ace", 11: "Page", 12: "Knight", 13: "Queen", 14: "King" }[rank] || (rank != null ? String(rank) : null);
  }
  function makeCard(raw) {
    const isInstrument = raw.id === INSTRUMENT_ID || raw.arcana === "lab";
    const arcana = ["major", "minor", "lab"].includes(raw.arcana) ? raw.arcana : (isInstrument ? "lab" : "major");
    const suit = ["wands", "cups", "swords", "pentacles"].includes(raw.suit) ? raw.suit : "none";
    const rank = raw.number == null ? null : raw.number;
    return {
      id: raw.id, name: raw.name, arcana, suit, rank,
      rankLabel: rankLabel(arcana, rank, raw.roman, isInstrument),
      roman: raw.roman || null, element: raw.element || null,
      meaningCoreUpright: raw.uprightMeaning,
      meaningCoreReversed: isInstrument ? null : raw.reversedMeaning,
      core: raw.core || null,
      labNote: isInstrument ? "A card about the tool itself. It is never a spirit and never the app speaking." : (raw.core || SUITS[suit].fieldNote),
      imageAsset: raw.imageAsset, imageDescription: raw.imageDescription || "", credit: raw.credit || "",
      uprightKeywords: raw.uprightKeywords || [], reversedKeywords: raw.reversedKeywords || [],
      uprightLove: raw.uprightLove, uprightCareer: raw.uprightCareer, uprightGeneral: raw.uprightGeneral,
      reversedLove: isInstrument ? null : raw.reversedLove, reversedCareer: isInstrument ? null : raw.reversedCareer, reversedGeneral: isInstrument ? null : raw.reversedGeneral,
      isInstrument,
      get isCourt() { return this.arcana === "minor" && this.rank != null && this.rank >= 11 && this.rank <= 14; },
      keywords(reversed) { return this.isInstrument ? this.uprightKeywords : (reversed ? this.reversedKeywords : this.uprightKeywords); },
      meaning(lens, reversed) {
        if (this.isInstrument) return { general: this.uprightGeneral, love: this.uprightLove, career: this.uprightCareer }[lens];
        const fallback = this.meaningCoreReversed || this.meaningCoreUpright;
        if (lens === "general") return reversed ? (this.reversedGeneral || fallback) : this.uprightGeneral;
        if (lens === "love") return reversed ? (this.reversedLove || this.reversedGeneral || fallback) : this.uprightLove;
        return reversed ? (this.reversedCareer || this.reversedGeneral || fallback) : this.uprightCareer;
      },
      matches(query) {
        const q = query.trim().toLowerCase(); if (!q) return true;
        const hay = [this.id, this.name, this.imageDescription, this.meaningCoreUpright, this.meaningCoreReversed || "", this.core || "", this.labNote,
          this.uprightGeneral, this.uprightLove, this.uprightCareer, this.reversedGeneral || "", this.reversedLove || "", this.reversedCareer || "",
          this.rankLabel || "", this.roman || "", this.element || "", SUITS[this.suit].title, this.arcana, ...this.uprightKeywords, ...this.reversedKeywords];
        return hay.some((h) => String(h).toLowerCase().includes(q));
      },
      matchesFilter(f) {
        if (f === "all") return true; if (f === "majors") return this.arcana === "major"; if (f === "lab") return this.arcana === "lab" || this.isInstrument; return this.suit === f;
      },
    };
  }
  const Deck = { all: [], byId: new Map(), loaded: false };
  Deck.load = function (json) {
    Deck.all = json.cards.map(makeCard); Deck.byId = new Map(Deck.all.map((c) => [c.id, c])); Deck.loaded = true;
  };
  Deck.card = (id) => Deck.byId.get(id) || null;
  Deck.instrument = () => Deck.card(INSTRUMENT_ID);
  Deck.bag = (includeInstrument) => Deck.all.filter((c) => includeInstrument || !c.isInstrument).map((c) => c.id);
  Deck.majors = () => Deck.all.filter((c) => c.arcana === "major").sort((a, b) => (a.rank || 0) - (b.rank || 0));
  Deck.cards = (filter, query) => Deck.all.filter((c) => c.matchesFilter(filter) && c.matches(query));
  GL.Deck = Deck;

  // ---------- Spreads ----------
  const pos = (index, name, prompt) => ({ index, name, prompt });
  const SPREADS = {
    observation: { id: "observation", name: "The Observation", subtitle: "One card for a question that is not today's official daily.", positions: [pos(0, "The Observation", "The dominant energy on the bench.")] },
    three: { id: "three", name: "3-card", subtitle: "Situation, action, outcome.", positions: [pos(0, "Situation", "What you are in."), pos(1, "Action", "A move that answers the situation."), pos(2, "Outcome", "Where that move tends to land.")] },
    decision: { id: "decision", name: "A or B", subtitle: "Two paths, and the tension that makes the choice real.", positions: [pos(0, "Option A", "What this path is asking of you."), pos(1, "Option B", "What the other path is asking of you."), pos(2, "The Tension", "The force that makes the choice real.")] },
    yesno: { id: "yesno", name: "Yes or No", subtitle: "Which way this leans, and what could tilt it.", positions: [pos(0, "The Lean", "Upright leans yes. Reversed leans no. The Instrument is inconclusive."), pos(1, "Why", "What that lean is made of."), pos(2, "What to watch", "The condition that could tilt the reading.")] },
    relationship: { id: "relationship", name: "Relationship", subtitle: "You, the other, and the bond between you.", positions: [pos(0, "You", "Your stance in the bond."), pos(1, "The other", "The other person, or the part of you meeting them."), pos(2, "The bond", "The current weather between you."), pos(3, "What supports", "What is already holding."), pos(4, "What strains", "What frays the line."), pos(5, "Hidden", "What is not being said."), pos(6, "Counsel", "One honest next step you could take.")] },
    career: { id: "career", name: "Career", subtitle: "Where the work sits now, and where it points.", positions: [pos(0, "Current post", "Where the work sits now."), pos(1, "Hidden factor", "What is under the job description."), pos(2, "Action", "A move you can actually make."), pos(3, "Obstacle", "What resists that move."), pos(4, "Trajectory", "Where this energy points if you stay honest.")] },
  };
  GL.SPREADS = SPREADS;
  GL.VISIBLE_SPREADS = ["decision", "yesno", "relationship", "career"];
  GL.dailyPrompt = (card, reversed) => card.isInstrument ? "Log how you asked. Do not force a fortune from the lens."
    : `One thing to sit with this week: where did ${card.name} (${reversed ? "reversed" : "upright"}) show up in a real hour of your life? Write down what you noticed.`;
  GL.MOODS = [[1, "Flat"], [2, "Low"], [3, "Steady"], [4, "Charged"], [5, "Peak"]];

  // ---------- Shuffle (Fisher-Yates over crypto.getRandomValues) ----------
  function randomIndex(upperBound) {
    // Rejection sampling keeps every index equally likely.
    const max = Math.floor(0x100000000 / upperBound) * upperBound; const buf = new Uint32Array(1);
    for (;;) { crypto.getRandomValues(buf); if (buf[0] < max) return buf[0] % upperBound; }
  }
  GL.randomIndex = randomIndex;
  GL.randomBit = () => randomIndex(2) === 1;
  GL.shuffle = function (ids) {
    const bag = ids.slice();
    for (let i = bag.length - 1; i >= 1; i--) { const j = randomIndex(i + 1); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    return bag;
  };
  GL.receipt = async function (cardIds, reversals, date) {
    const ts = new Date(date).toISOString().replace(/\.\d{3}Z$/, "Z");
    const payload = cardIds.join(",") + "|" + reversals.map((r) => (r ? "1" : "0")).join("") + "|" + ts;
    if (!crypto.subtle) return "--------";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
    return Array.from(new Uint8Array(digest).slice(0, 4)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  GL.dailyKey = function (d) { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  // ---------- VoiceRenderer ----------
  const VR = {
    instrumentLine(voice) {
      return { mystic: "The lens is in the frame. I am not calling a spirit. This seat is about how you are looking.",
        clinical: "Method, observer, or contamination. A note about the experiment itself.",
        skeptical: "This one is the Instrument: what you are looking at is a shuffle you performed. Never a spirit." }[voice];
    },
    polarityLabel(card, reversed) { return card.isInstrument ? "Calibration" : (reversed ? "Reversed" : "Upright"); },
    wrap(core, reversed, voice) {
      const body = lowerFirst(core);
      if (voice === "mystic") return reversed ? `Inverted, the figure turns toward you. What is coming through is ${body}` : `What is coming through is ${body}`;
      if (voice === "clinical") return reversed ? `Reversed in this seat: ${body}` : `In this seat: ${body}`;
      return reversed ? `Read plainly, this is ${body} Upside down is still just how the shuffle fell.` : `Read plainly, this is ${body}`;
    },
    oneLiner(card, reversed, voice) {
      if (card.isInstrument) return VR.instrumentLine(voice);
      const core = reversed && card.meaningCoreReversed ? card.meaningCoreReversed : card.meaningCoreUpright;
      return VR.wrap(core, reversed, voice);
    },
  };
  GL.VR = VR;

  // ---------- YesNoLean ----------
  const YesNoLean = {
    instrumentPresent: (draws) => draws.some((d) => Deck.card(d.cardId)?.isInstrument),
    yesNoKind(draws) { if (!draws.length) return null; if (YesNoLean.instrumentPresent(draws)) return "inconclusive"; return draws[0].reversed ? "no" : "yes"; },
    decisionKind(draws) {
      if (!draws.length) return null; if (YesNoLean.instrumentPresent(draws)) return "inconclusive";
      const a = draws.find((d) => d.positionName === "Option A") || draws[0]; const b = draws.find((d) => d.positionName === "Option B") || draws[1];
      if (!a || !b) return "inconclusive"; if (a.reversed === b.reversed) return null; return a.reversed ? "optionB" : "optionA";
    },
    summary(protocolId, draws) {
      if (protocolId !== "yesno") return null;
      const k = YesNoLean.yesNoKind(draws);
      if (k === "inconclusive") return "Inconclusive. The Instrument landed, so I will not force a yes or no. Sit with the question, or we deal again.";
      if (k === "no") return "Right now this leans toward no. The cards underneath explain why, and what could still change it.";
      if (k === "yes") return "Right now this leans toward yes. The cards underneath explain why, and what could still change it.";
      return null;
    },
    decisionNote(protocolId, draws) {
      if (protocolId !== "decision") return null;
      const k = YesNoLean.decisionKind(draws);
      if (k === "inconclusive") return "Inconclusive. The Instrument landed on this decision, so I will not force a pick. Sit with the question, or we deal again.";
      if (k === "optionA") return "Right now this leans toward Option A. Read the tension card before you treat it as settled.";
      if (k === "optionB") return "Right now this leans toward Option B. Read the tension card before you treat it as settled.";
      return "The cards do not pick a side here. Option A and Option B landed the same way, so sit with the tension card instead of forcing it.";
    },
  };
  GL.YesNoLean = YesNoLean;

  // ---------- ReadingComposer ----------
  const FOOTER = "Entertainment and experimental investigation only.";
  const DEFAULT_DAILY_Q = "What is worth observing today?";
  GL.DEFAULT_DAILY_Q = DEFAULT_DAILY_Q;
  const LOVE = ["love", "relationship", "partner", "romance", "boyfriend", "girlfriend", "spouse", "marriage", "dating", "crush", "husband", "wife", "couple", "partnership"];
  const CAREER = ["job", "work", "career", "money", "boss", "promotion", "office", "business", "income", "paycheck", "profession", "employment", "salary", "wage", "interview", "workplace"];
  const HARD = new Set(["death", "tower", "devil", "ten-swords", "three-swords", "nine-swords", "five-swords", "eight-swords", "ten-wands", "five-pentacles", "five-cups"]);
  const RC = {};
  RC.lens = function (question, protocolId) {
    if (protocolId === "relationship") return "love"; if (protocolId === "career") return "career";
    const q = (question || "").toLowerCase(); const l = LOVE.some((w) => containsWord(q, w)); const c = CAREER.some((w) => containsWord(q, w));
    if (l && !c) return "love"; if (c && !l) return "career"; return "general";
  };
  function resolved(draw, lens) {
    const card = Deck.card(draw.cardId); if (!card) return null;
    const reversed = card.isInstrument ? false : !!draw.reversed;
    return { positionName: draw.positionName, card, reversed, polarity: VR.polarityLabel(card, reversed), meaning: scrub(card.meaning(lens, reversed)), isInstrument: card.isInstrument };
  }
  const spoken = (s) => (s.reversed ? `${s.card.name}, reversed` : s.card.name);
  const seatNamed = (name, seats) => seats.find((s) => s.positionName === name) || null;
  const isFutureSeat = (s) => ["Near future", "Outcome", "Trajectory", "Future"].includes(s.positionName);
  const isOtherSeat = (s) => s.positionName.toLowerCase() === "the other";
  const isHard = (s) => HARD.has(s.card.id);
  const V3 = (voice, m, c, s) => ({ mystic: m, clinical: c, skeptical: s })[voice];
  const reversedNotes = (voice) => V3(voice,
    ["Upside down here, it usually means something is in the way. Naming the blocker is half the work.", "Reversed, the meaning turns inward. More of this is happening in you than around you.", "Landing upside down often just means slower. Give it time before you write it off."],
    ["Reversed here reads as blocked, so name the blocker.", "Reversed turns it inward, more in you than around you.", "Reversed reads as delayed, so give it time."],
    ["Upside down usually means something is jamming it, and naming the jam is most of the work.", "A reversal turns the card inward, so look at your own side of this before anyone else's.", "Upside down often just means slow. That is worth knowing before you write it off."]);
  const reversedNote = (s, voice) => { const n = reversedNotes(voice); return n[scalarSum(s.card.id) % n.length]; };
  const hardLine = (voice) => V3(voice, "This is a heavier card. It lands on strain that is already in the room, so start with whatever feels shaky.", "Heavier card, and it marks strain already present.", "That is one of the rough ones. It tends to land on something you already know is shaky.");
  const futureNote = (voice) => V3(voice, "This shows where things are heading if nothing changes, and you can still change plenty.", "Direction of travel if nothing changes, and it stays changeable.", "Read that as the current drift. Change what you are doing and it moves.");
  const otherGuard = (voice) => V3(voice, "This card speaks to how things feel between you. It cannot read the other person's mind.", "This seat covers the space between you and does not report their thoughts.", "No deck can tell you what someone else is thinking. This is your read on the space between you.");
  function courtLine(s, voice) {
    if (!s.card.isCourt) return null;
    const offer = { 11: "a messenger or young person in your life, or a stance of curiosity", 12: "a person in motion around you, or a stance you are taking", 13: "a person who holds this ground, or a stance of inner authority" }[s.card.rank] || "a person who sets the terms, or a stance of command you are trying on";
    return V3(voice, `This card can be ${offer}. You will know which fits.`, `Reads as ${offer}.`, `That card is either ${offer}. You will know which fits.`);
  }
  function carried(s, voice) {
    const notes = []; const court = courtLine(s, voice);
    if (court) notes.push(court); else if (isOtherSeat(s)) notes.push(otherGuard(voice)); else if (isHard(s)) notes.push(hardLine(voice)); else if (s.reversed) notes.push(reversedNote(s, voice));
    if (isFutureSeat(s)) notes.push(futureNote(voice));
    return notes;
  }
  const clinicalNote = (s, voice) => (isFutureSeat(s) ? futureNote(voice) : (carried(s, voice)[0] || null));
  function lifeLine(s, voice) {
    if (voice === "clinical") return statement(firstSentences(distilled(s.meaning), 2));
    const meaning = clause(distilled(s.meaning)); const variant = (scalarSum(s.card.id) + s.positionName.length) % 3;
    if (voice === "mystic") return ["The heart of it is ", "It points to ", "This one is about "][variant] + meaning;
    return ["In practice that reads as ", "The plain content of it is ", "Most readers would call that "][variant] + meaning;
  }
  function askingLine(s, voice) {
    const key = s.card.keywords(s.reversed)[0];
    if (voice === "mystic") return key ? `A simple way to use this: notice where ${key} shows up today.` : "A simple way to use this: notice what you already feel about it.";
    if (voice === "clinical") return key ? `Watch for ${key} today.` : "Watch what you already feel about it.";
    return key ? `Cheap test: see where ${key} actually turns up today.` : "Cheap test: notice what you already feel about it.";
  }
  const tensionNote = (voice) => V3(voice, "This is the thing that makes the choice real, and it leaves the pick with you.", "The pick stays with you.", "That is the part that makes it a real choice, and the pick is still yours.");
  const instrumentPickNote = (voice) => V3(voice, "The Instrument landed, so I will not force a pick.", "The Instrument landed. No pick from this table.", "The Instrument landed, so I am not going to talk you into either one.");
  const mirrorNote = (voice) => V3(voice, "The outcome partly mirrors what you are already expecting.", "The outcome tracks what you already expect.", "The outcome is close to what you already expect, which is worth noticing.");
  const tableIntro = (name, voice) => V3(voice, `This is your ${name} table.`, `${name} table.`, `Here is how the ${name} table fell.`);
  const instrumentStory = (s, voice) => assemble([VR.instrumentLine(voice), s.meaning, "Never a spirit."]);
  function lead(role, s, voice) {
    const card = spoken(s);
    if (voice === "clinical") return `${s.positionName}: ${card}.`;
    if (voice === "mystic") return {
      single: `You drew a single card: ${card}.`, slot: s.reversed ? `${s.card.name} landed reversed in ${s.positionName}.` : `${s.card.name} landed in ${s.positionName}.`,
      optionA: `For Option A you drew ${card}.`, optionB: `Option B came up as ${card}.`, tension: `Between them sits ${card}, the tension in this choice.`,
      lean: `In the lean seat you drew ${card}.`, why: `Behind that sits ${card}.`, watch: `Keep an eye on ${card}.`,
      you: `Your side of the table shows ${card}.`, other: `Their seat holds ${card}.`, bond: `Between you, the bond came up as ${card}.`, supports: `Working in your favor is ${card}.`, strains: `Pulling against you is ${card}.`, hidden: `Under the surface sits ${card}.`, counsel: `For counsel you drew ${card}.`,
      post: `Where you stand now shows as ${card}.`, hiddenFactor: `Underneath the work sits ${card}.`, action: `For a move you can actually make, you drew ${card}.`, obstacle: `Standing in the way is ${card}.`, trajectory: `The road ahead shows ${card}.`,
      hopes: `In hopes and fears sits ${card}.`, outcome: `The outcome seat shows ${card}.` }[role];
    return {
      single: `One card came off the top: ${card}.`, slot: `For ${s.positionName} you turned up ${card}.`,
      optionA: `Option A got ${card}.`, optionB: `Option B got ${card}.`, tension: `The card in the middle is ${card}, and that is where the friction is.`,
      lean: `The lean card is ${card}.`, why: `Sitting behind it is ${card}.`, watch: `The last card is ${card}, so that is the one to watch.`,
      you: `Your seat came up ${card}.`, other: `The seat standing in for them is ${card}.`, bond: `The bond between you drew ${card}.`, supports: `On the helpful side you got ${card}.`, strains: `On the friction side you got ${card}.`, hidden: `The buried seat is ${card}.`, counsel: `For advice the deck gave you ${card}.`,
      post: `Where you are standing now came up ${card}.`, hiddenFactor: `The factor nobody named is ${card}.`, action: `For something you can actually do, you got ${card}.`, obstacle: `In the way is ${card}.`, trajectory: `The road ahead came up ${card}.`,
      hopes: `Hopes and fears turned up ${card}.`, outcome: `The outcome seat came up ${card}.` }[role];
  }
  function tail(role, voice) {
    switch (role) {
      case "lean": return V3(voice, "Hold the answer loosely for now.", "Hold it loosely.", "Do not carve it in stone.");
      case "why": return V3(voice, "That is the why under the lean.", "That is the reason under the lean.", "That is the reasoning the lean is resting on.");
      case "watch": return V3(voice, "That is where the answer could still shift before you settle on it.", "This is the variable that can still move the answer.", "That is the piece most likely to change your mind before you settle.");
      case "hidden": return V3(voice, "This is the part neither of you is saying out loud.", "Unspoken on both sides.", "Whatever neither of you has said out loud lives here.");
      case "counsel": return V3(voice, "Take it as one honest next step, yours to take or leave.", "One next step. Yours to take or skip.", "One honest next step. Take it or leave it.");
      case "hopes": return V3(voice, "What you hope for and what you worry about are often closely linked.", "Hope and worry usually share this seat.", "What you want and what you dread are usually the same card.");
      default: return null;
    }
  }
  function story(s, role, voice) {
    if (s.isInstrument) return instrumentStory(s, voice);
    const parts = [lead(role, s, voice), lifeLine(s, voice)]; const closer = tail(role, voice);
    if (voice === "clinical") { if (closer) parts.push(closer); else { const n = clinicalNote(s, voice); if (n) parts.push(n); } }
    else { parts.push(...carried(s, voice)); if (closer) parts.push(closer); }
    return assemble(parts);
  }
  function celticPart(s, frame, voice) {
    if (s.isInstrument) return instrumentStory(s, voice);
    const card = spoken(s); let head;
    if (voice === "mystic") head = frame ? `${frame} ${s.positionName} holds ${card}.` : `${s.positionName} holds ${card}.`;
    else if (voice === "clinical") head = `${s.positionName}: ${card}.`;
    else head = frame ? `${frame} ${s.positionName} turned up ${card}.` : `${s.positionName} turned up ${card}.`;
    return assemble([head, lifeLine(s, voice), ...carried(s, voice)]);
  }
  function askedLine(question) {
    const t = (question || "").trim(); if (!t || t === DEFAULT_DAILY_Q) return null;
    const q = quoted(t); return /[?.]$/.test(q) ? `You asked, "${q}"` : `You asked, "${q}."`;
  }
  function sessionOpen(question, voice) {
    const asked = askedLine(question);
    if (voice === "mystic") return asked ? `I sat with your question. ${asked} Here is what is coming through.` : "You came in without a set question, so I looked at where things stand in general. Here is what is coming through.";
    if (voice === "clinical") return asked ? `${asked} Here is what the table shows, seat by seat.` : "No question was set, so this reads where things stand in general.";
    return asked ? `${asked} You shuffled this deck yourself, and here is what stands out to me.` : "You skipped the question, so I am reading where things stand in general.";
  }
  const opening = (question, seats, voice) => [sessionOpen(question, voice)];
  function themeKeywords(seats) {
    const seen = new Set(); const out = [];
    for (const s of seats) { if (s.isInstrument) continue; const k = s.card.keywords(s.reversed)[0]; if (!k) continue; if (!seen.has(k.toLowerCase())) { seen.add(k.toLowerCase()); out.push(k); } if (out.length === 3) break; }
    return out;
  }
  function themeList(seats) { const u = themeKeywords(seats); if (!u.length) return "where your attention goes"; if (u.length === 1) return u[0]; if (u.length === 2) return `${u[0]} and ${u[1]}`; return `${u.slice(0, -1).join(", ")}, ${u[u.length - 1]}`; }
  function tableTheme(seats) { const u = themeKeywords(seats); if (!u.length) return "take a quiet look at where your attention goes"; if (u.length === 1) return `the main theme is ${u[0]}`; if (u.length === 2) return `the main themes are ${u[0]} and ${u[1]}`; return `the main themes are ${u.slice(0, -1).join(", ")}, and ${u[u.length - 1]}`; }
  function weekInvite(seats, protocolId, voice) {
    const live = seats.find((s) => !s.isInstrument); const key = live ? live.card.keywords(live.reversed)[0] : null;
    if (voice === "clinical") {
      switch (protocolId) {
        case "daily": case "observation": return key ? `spend one hour watching for ${key}` : "log how you asked and leave the fortune out of it";
        case "three": return "run the move from Action once"; case "decision": return "say the tension out loud before you pick"; case "yesno": return "watch the last card before you settle the answer";
        case "relationship": return "have the one honest conversation"; case "career": return "make one work move you can finish"; case "celtic": return "sit with the Crossing and note what it complicates";
        default: return key ? `pick one scene and watch for ${key}` : "pick one scene from this table and watch it";
      }
    }
    switch (protocolId) {
      case "daily": case "observation": return key ? `give this card one concrete hour and watch where ${key} is already in the room` : "log how you asked, and do not force a fortune from the lens";
      case "three": return "choose one move from Action and try it once this week"; case "decision": return "name the tension out loud before you pick a path"; case "yesno": return "watch for the thing the last card named before you settle your answer";
      case "relationship": return "have one honest conversation, or write the thing that is not being said"; case "career": return "make one concrete work move you can actually finish this week"; case "celtic": return "sit with the Crossing this week and notice what it complicates";
      default: return key ? `pick one scene from this table and watch where ${key} shows up` : "pick one scene from this table and watch it in a real hour of your week";
    }
  }
  function sessionClose(seats, protocolId, voice) {
    const invite = weekInvite(seats, protocolId, voice);
    if (voice === "mystic") return `To sum up, ${tableTheme(seats)}. One thing to try this week: ${invite}. None of this is set in stone. What happens next is up to you.`;
    if (voice === "clinical") return `Themes: ${themeList(seats)}. One thing this week: ${invite}. None of it is fixed. The next move is yours.`;
    return `Short version: ${tableTheme(seats)}. One thing worth trying this week: ${invite}. None of this is set in stone, and what happens next is on you.`;
  }
  function repeatableBoilerplate() {
    const all = [];
    for (const v of ["mystic", "clinical", "skeptical"]) { all.push(...reversedNotes(v), hardLine(v), futureNote(v), otherGuard(v)); }
    all.push("You will know which fits."); return all;
  }
  const BOILER = repeatableBoilerplate();
  function capped(paras) {
    const seen = new Set();
    const deduped = paras.map((para) => { let p = para; for (const b of BOILER) { if (p.includes(b)) { if (seen.has(b)) p = p.split(b).join(""); else seen.add(b); } } return p; });
    const cleaned = deduped.map(finish).filter(Boolean);
    if (cleaned.length <= 6) return cleaned;
    let kept = cleaned.slice(0, -1); if (kept.length > 5) kept = kept.slice(0, 5); kept.push(cleaned[cleaned.length - 1]); return kept;
  }
  function crownGap(crown, outcome, voice) {
    if (crown.card.id === outcome.card.id) return V3(voice, "Crown and Outcome match: what is possible and where you are heading agree.", "Crown and Outcome match. Possibility and direction agree.", "Crown and Outcome came up as the same card, so what is possible and where this is going line up.");
    return V3(voice, `${crown.card.name} shows what is possible. ${outcome.card.name} shows where things are heading. The space between them is where your choices still count.`,
      `${crown.card.name} is the ceiling. ${outcome.card.name} is the direction. The space between them is where your choices still count.`,
      `${crown.card.name} is the best case and ${outcome.card.name} is the drift. The space between them is where your choices still count.`);
  }
  function pair(aName, bName, seats, frame, voice) {
    const parts = []; const a = seatNamed(aName, seats); const b = seatNamed(bName, seats);
    if (a) parts.push(celticPart(a, frame, voice)); if (b) parts.push(celticPart(b, parts.length ? null : frame, voice)); return parts.join(" ");
  }
  function oneCardNarrative(question, protocolName, seat, voice) {
    if (seat.isInstrument) return capped([...opening(question, [seat], voice), `${VR.instrumentLine(voice)} ${seat.meaning} This ${protocolName.toLowerCase()} is a calibration. Never a spirit.`, sessionClose([seat], "daily", voice)]);
    return capped([...opening(question, [seat], voice), story(seat, "single", voice), sessionClose([seat], "daily", voice)]);
  }
  function threeNarrative(question, seats, voice) {
    const p = opening(question, seats, voice); seats.slice(0, 3).forEach((s) => p.push(story(s, "slot", voice))); p.push(sessionClose(seats, "three", voice)); return capped(p);
  }
  function decisionNarrative(question, seats, voice) {
    const a = seatNamed("Option A", seats) || seats[0]; const b = seatNamed("Option B", seats) || seats[1]; const t = seatNamed("The Tension", seats) || seats[2];
    const p = opening(question, seats, voice);
    if (a) p.push(story(a, "optionA", voice)); if (b) p.push(story(b, "optionB", voice));
    if (t) { const note = seats.some((s) => s.isInstrument) ? instrumentPickNote(voice) : tensionNote(voice); p.push(`${story(t, "tension", voice)} ${note}`); }
    p.push(sessionClose(seats, "decision", voice)); return capped(p);
  }
  function yesNoNarrative(question, seats, voice) {
    const lean = seatNamed("The Lean", seats) || seats[0]; const why = seatNamed("Why", seats) || seats[1]; const watch = seatNamed("What to watch", seats) || seats[2];
    const p = opening(question, seats, voice);
    if (lean) p.push(story(lean, "lean", voice)); if (why) p.push(story(why, "why", voice)); if (watch) p.push(story(watch, "watch", voice));
    p.push(sessionClose(seats, "yesno", voice)); return capped(p);
  }
  function relationshipNarrative(question, seats, voice) {
    const g = (n) => seatNamed(n, seats); const st = (s, r) => (s ? story(s, r, voice) : null);
    const p = opening(question, seats, voice);
    p.push(join([st(g("You"), "you"), st(g("The other"), "other")]));
    if (g("The bond")) p.push(story(g("The bond"), "bond", voice));
    p.push(join([st(g("What supports"), "supports"), st(g("What strains"), "strains")]));
    p.push(join([st(g("Hidden"), "hidden"), st(g("Counsel"), "counsel")]));
    p.push(sessionClose(seats, "relationship", voice)); return capped(p);
  }
  function careerNarrative(question, seats, voice) {
    const post = seatNamed("Current post", seats) || seats[0]; const hidden = seatNamed("Hidden factor", seats) || seats[1]; const action = seatNamed("Action", seats) || seats[2]; const obstacle = seatNamed("Obstacle", seats) || seats[3]; const path = seatNamed("Trajectory", seats) || seats[4];
    const p = opening(question, seats, voice);
    if (post) p.push(story(post, "post", voice)); if (hidden) p.push(story(hidden, "hiddenFactor", voice));
    p.push(join([action ? story(action, "action", voice) : null, obstacle ? story(obstacle, "obstacle", voice) : null]));
    if (path) p.push(story(path, "trajectory", voice));
    p.push(sessionClose(seats, "career", voice)); return capped(p);
  }
  function celticNarrative(question, seats, voice) {
    const p = opening(question, seats, voice);
    p.push(pair("Present", "Crossing", seats, "At the heart of the matter,", voice));
    p.push(pair("Foundation", "Recent past", seats, "Under your question,", voice));
    p.push(join([pair("Crown", "Near future", seats, "Above you,", voice), pair("Self", "Environment", seats, "Around you,", voice)]));
    const hopes = seatNamed("Hopes and fears", seats); const outcome = seatNamed("Outcome", seats); const last = [];
    if (hopes) last.push(story(hopes, "hopes", voice));
    if (outcome) { let line = story(outcome, "outcome", voice); if (hopes && hopes.card.suit === outcome.card.suit && hopes.card.suit !== "none") line += " " + mirrorNote(voice); const crown = seatNamed("Crown", seats); if (crown) line += " " + crownGap(crown, outcome, voice); last.push(line); }
    p.push(join(last)); p.push(sessionClose(seats, "celtic", voice)); return capped(p);
  }
  function genericNarrative(question, protocolName, seats, voice) {
    const p = opening(question, seats, voice); p.push(tableIntro(protocolName, voice));
    const chunk = seats.length <= 3 ? 1 : 2;
    for (let i = 0; i < seats.length; i += chunk) p.push(join(seats.slice(i, i + chunk).map((s) => story(s, "slot", voice))));
    p.push(sessionClose(seats, protocolName, voice)); return capped(p);
  }
  function narrative(question, protocolId, protocolName, seats, voice) {
    if (!seats.length) return [finish("I sat down and the table is empty. Deal first, then I can read.")];
    switch (protocolId) {
      case "daily": case "observation": return oneCardNarrative(question, protocolName, seats[0], voice);
      case "three": return threeNarrative(question, seats, voice);
      case "decision": return decisionNarrative(question, seats, voice);
      case "yesno": return yesNoNarrative(question, seats, voice);
      case "relationship": return relationshipNarrative(question, seats, voice);
      case "career": return careerNarrative(question, seats, voice);
      case "celtic": return celticNarrative(question, seats, voice);
      default: return genericNarrative(question, protocolName, seats, voice);
    }
  }
  function instrumentPlate(seat, protocolId, voice) {
    const s = [VR.instrumentLine(voice), seat.meaning, "Never a spirit and never the app speaking."];
    if (protocolId === "yesno" || protocolId === "decision") s.push(V3(voice, "I will not force a yes, a no, or a pick from this seat.", "No yes, no no, and no pick from this seat.", "I am not going to squeeze a yes, a no, or a pick out of this one."));
    else if (protocolId === "daily") s.push(V3(voice, "Log how you asked. Do not force a fortune from the lens.", "Log how you asked. No fortune from this seat.", "Log how you asked, and leave the fortune out of it."));
    return assemble(s.slice(0, voice === "clinical" ? 3 : 5));
  }
  function plateReading(seat, protocolId, voice) {
    if (seat.isInstrument) return instrumentPlate(seat, protocolId, voice);
    let head, cap;
    if (voice === "mystic") { head = `Sitting in ${seat.positionName} for you is ${spoken(seat)}.`; cap = 5; }
    else if (voice === "clinical") { head = ""; cap = 3; }
    else { head = `Here you turned up ${spoken(seat)}.`; cap = 4; }
    const sentences = [head, lifeLine(seat, voice)];
    if (voice === "clinical") { const n = clinicalNote(seat, voice); sentences.push(n || askingLine(seat, voice)); }
    else { sentences.push(...carried(seat, voice)); if (sentences.length < 4) sentences.push(askingLine(seat, voice)); }
    return clip(sentences, cap);
  }
  RC.compose = function ({ question, protocolId, protocolName, draws, voice }) {
    const lens = RC.lens(question, protocolId);
    const seats = draws.map((d) => resolved(d, lens)).filter(Boolean);
    const leanLine = YesNoLean.summary(protocolId, draws) || YesNoLean.decisionNote(protocolId, draws);
    const paragraphs = narrative(question, protocolId, protocolName, seats, voice);
    const plates = seats.map((s) => ({ positionName: s.positionName, cardName: s.card.name, polarity: s.polarity, cardId: s.card.id, reversed: s.reversed, isInstrument: s.isInstrument, reading: plateReading(s, protocolId, voice) }));
    const reading = { narrativeParagraphs: paragraphs, plates, leanLine, footer: FOOTER };
    reading.fullText = [leanLine, paragraphs.join("\n\n"), ...plates.map((p) => `${p.positionName}. ${p.cardName} (${p.polarity}). ${p.reading}`), FOOTER].filter(Boolean).join("\n\n");
    return reading;
  };
  RC.composeDaily = function (record, voice) {
    const card = Deck.card(record.cardId) || Deck.instrument();
    return RC.compose({ question: record.hypothesis || DEFAULT_DAILY_Q, protocolId: "daily", protocolName: record.isCalibration ? "Calibration" : "Daily pull",
      draws: [{ positionIndex: 0, positionName: "The Observation", cardId: card.id, reversed: record.reversed }], voice: voice || record.voice });
  };
  RC.FOOTER = FOOTER;
  GL.RC = RC;

  // ---------- Oracle ----------
  const Oracle = { decks: [], byId: new Map(), cardsById: new Map(), loaded: false, disclaimer: "" };
  Oracle.load = function (json) {
    Oracle.disclaimer = json.disclaimer || "";
    Oracle.decks = json.decks.map((d) => ({ id: d.id, name: d.name, tagline: d.tagline, theme: d.theme, symbol: d.symbol, notes: d.notes || [],
      cards: d.cards.map((c) => ({ id: c.id, deckId: d.id, name: c.name, symbol: c.symbol, keyword: c.keyword, meaningCore: c.meaningCore, meaningReversed: c.meaningReversed || null, labNote: c.labNote,
        imageAsset: c.id + ".webp", allowsReversal: !!c.meaningReversed,
        meaning(reversed) { return reversed && this.meaningReversed ? this.meaningReversed : this.meaningCore; },
        matches(q) { q = q.trim().toLowerCase(); if (!q) return true; return [this.id, this.name, this.keyword, this.meaningCore, this.meaningReversed || "", this.labNote].some((h) => h.toLowerCase().includes(q)); } })) }));
    Oracle.byId = new Map(Oracle.decks.map((d) => [d.id, d]));
    Oracle.cardsById = new Map(Oracle.decks.flatMap((d) => d.cards).map((c) => [c.id, c]));
    Oracle.loaded = true;
  };
  Oracle.deck = (id) => Oracle.byId.get(id) || null;
  Oracle.card = (id) => Oracle.cardsById.get(id) || null;
  Oracle.bag = (deckId) => (Oracle.deck(deckId) ? Oracle.deck(deckId).cards.map((c) => c.id) : []);
  Oracle.positions = (three) => (three ? [[0, "Where you are"], [1, "What is in the way"], [2, "What could open"]] : [[0, "What is here"]]);
  Oracle.copy = {
    tagline: "Five sets of picture plates. Each set is a different way to look at a question.",
    footer: "Entertainment only. The plates are a way to think, and the choice stays yours.",
    defaultHypothesis: "What should I pay attention to right now?",
    catalogBlurb: "All five sets are open. Each one has 36 plates and its own tone. The shuffle is the same under every set.",
    hypothesisHint: "Questions that start with what, why, or how work better than yes or no. This is entertainment, and nothing here predicts anything.",
    notesEmpty: "Saved readings stay on this device. No account. No cloud.",
    plainLead: "Here is a simple way to read this.", youAsked: "You asked:", entertainmentLine: FOOTER,
  };
  const SENSITIVE = ["passed away", "who died", "is he dead", "is she dead", "are they dead", "my late", "will i die", "want to die", "kill myself", "suicide", "should i marry", "should i divorce", "get divorced", "cancer", "diagnos", "my medication", "should i stop taking", "am i pregnant", "should i sue", "lawsuit", "should i invest", "how much money", "pay my rent", "lose my job"];
  const TIMING = ["when will", "when do", "when am", "when is", "how long", "how soon"];
  const CHOICE = ["which one", "which of", "which room", "which is better"];
  const CHOICE_IF_TWO = ["should i", "or should", "do i stay", "better to"];
  const YESNO_LEADS = ["will ", "is ", "are ", "does ", "do ", "did ", "can ", "am ", "was ", "has ", "have "];
  const QL = {
    kind(question) {
      const q = (question || "").trim().toLowerCase(); if (!q) return "blank";
      if (SENSITIVE.some((p) => q.includes(p))) return "sensitive"; if (TIMING.some((p) => q.includes(p))) return "timing";
      if (CHOICE.some((p) => q.includes(p))) return "choice";
      if (CHOICE_IF_TWO.some((p) => q.includes(p))) return q.includes(" or ") ? "choice" : "yesNo";
      if (q.includes(" or ")) return "choice"; if (YESNO_LEADS.some((p) => q.startsWith(p))) return "yesNo"; return "open";
    },
    opening(kind) {
      return { sensitive: "That question deserves a real person. This is entertainment, so treat what follows as something to think about, and take the decision itself to someone qualified.",
        choice: "You are choosing between things. These plates will not pick for you. Read them as what each path is carrying, then choose.",
        yesNo: "That is a yes or no question, and cards do not answer yes or no. Read them for what is worth noticing while you decide.",
        timing: "You asked about when. Nothing here is a date. Read it as a pace: slower, faster, or wait.",
        open: null, blank: "You did not type a question, so this is a general look at what is in front of you." }[kind];
    },
    closing(kind, voice, cardCount) {
      switch (kind) {
        case "sensitive": return "None of that answered your question, and it was never going to. Please take it to someone who can.";
        case "choice": return V3(voice, "Hold both ways in mind and notice which one the cards made heavier. The choosing is still yours.", "Neither way was picked for you here. Use what is above to make the choice yourself.", "A shuffle cannot choose for you. If one side feels heavier now, that is you deciding, which is the point.");
        case "yesNo": return V3(voice, "No yes and no no came through. What came through is what to watch while you decide.", "Nothing above is a yes or a no. Use it to sharpen the question and decide for yourself.", "Still no answer, because random cards do not have one. What you do have is a better version of the question.");
        case "timing": return V3(voice, "Read that as pace rather than a date on a calendar.", "That is pace, and it is not a date. Nothing here can tell you when.", "Cards cannot tell time. Take the pace and leave the date alone.");
        default:
          if (voice === "mystic") return cardCount > 1 ? "Take this as a picture to try on. See which plate you keep thinking about." : "Sit with this picture today. If it fits, it is because you recognized something already in the room.";
          if (voice === "clinical") return "None of this predicts the future. Use it as a prompt, then make the next move yourself.";
          return cardCount > 1 ? "A shuffle picked these plates. If they fit your question, that fitting is your work, which is the useful part." : "One random plate, honestly read. If it fits your question, you did the fitting.";
      }
    },
  };
  Oracle.lens = QL;
  Oracle.explain = function ({ position, cardName, keyword, meaning, voice, single }) {
    const body = trim(meaning); const hint = trim(keyword); const about = hint ? `${cardName}, a plate about ${hint.toLowerCase()}` : cardName;
    let leadLine;
    if (voice === "mystic") leadLine = single ? `The plate in front of you is ${about}.` : `${position} shows ${about}.`;
    else if (voice === "clinical") leadLine = single ? `${about}.` : `${position}: ${about}.`;
    else leadLine = single ? `The shuffle gave you ${about}.` : `For ${position.toLowerCase()}, the shuffle gave you ${about}.`;
    return { lead: leadLine, body };
  };
  const listEnglish = (parts) => (parts.length < 2 ? parts[0] || "" : parts.length === 2 ? `${parts[0]}, and ${parts[1]}` : parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1]);
  Oracle.stitch = function (sitting) {
    const parts = sitting.draws.map((d) => { const c = Oracle.card(d.cardId); if (!c) return null; const k = trim(c.keyword).toLowerCase(); return k ? `${d.positionName.toLowerCase()} is ${k}` : null; }).filter(Boolean);
    if (parts.length < 2 || parts.length !== sitting.draws.length) return null;
    return `Put together, ${listEnglish(parts)}. Hold that against your question and see which part you keep coming back to.`;
  };
  Oracle.compose = function (sitting, voice) {
    voice = voice || sitting.voice; const single = sitting.draws.length <= 1; const blocks = [];
    const asked = (sitting.hypothesis || "").trim(); const kind = QL.kind(asked);
    if (asked) blocks.push({ type: "asked", text: `${Oracle.copy.youAsked} ${asked}` });
    blocks.push({ type: "p", text: Oracle.copy.plainLead });
    const op = QL.opening(kind); if (op) blocks.push({ type: "p", text: op });
    for (const d of sitting.draws) {
      const c = Oracle.card(d.cardId); if (!c) continue; const reversed = d.reversed && c.allowsReversal;
      const ex = Oracle.explain({ position: d.positionName, cardName: c.name, keyword: c.keyword, meaning: c.meaning(reversed), voice, single });
      blocks.push({ type: "seat", lead: ex.lead, body: ex.body, cardId: c.id });
    }
    const together = Oracle.stitch(sitting); if (together) blocks.push({ type: "p", text: together });
    if (blocks.length <= 1) return [{ type: "p", text: Oracle.copy.entertainmentLine }];
    blocks.push({ type: "p", text: QL.closing(kind, voice, sitting.draws.length) });
    return blocks;
  };
  Oracle.blocksToText = (blocks) => blocks.map((b) => (b.type === "seat" ? `${b.lead}\n${b.body}` : b.text)).join("\n\n");
  GL.Oracle = Oracle;

  // ---------- Eight Ball ----------
  const BALL = {
    classic: ["It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.", "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful."],
    brass: ["The gears say yes.", "Wound tight for yes.", "It turns your way.", "Yes, and soon.", "The brass agrees.", "Set it going.", "Every cog says yes.", "The spring holds. Yes.", "Count on the works.", "It runs true.", "The works are still.", "Wind it and ask again.", "A cog is missing.", "Ask when it warms.", "The dial has not moved.", "The gears grind. No.", "Rust on that one.", "It jams here.", "No, the spring is spent.", "Not with these works."],
    ember: ["The coals glow yes.", "Heat says go.", "It catches. Yes.", "Fan it and it burns.", "Bright yes.", "The fire leans your way.", "Warm and certain.", "Yes, while it burns.", "The ember holds.", "Go while it is hot.", "Only smoke for now.", "Ash for the moment.", "Wait for the flare.", "Too much smoke to read.", "Blow on it and ask.", "The fire is out.", "Cold ash. No.", "That one burned up.", "No heat in it.", "Smoke, and nothing more."],
    violet: ["The dusk says yes.", "Yes, quietly.", "It leans to yes.", "The night agrees.", "Something says yes.", "Yes, in its own time.", "The dark is warm to it.", "A soft yes.", "It opens for you.", "Yes, and you know it.", "The dusk keeps it.", "Not lit yet.", "Ask when it is dark.", "The answer is veiled.", "Wait for the moon.", "The dusk says no.", "It closes here.", "No, and let it rest.", "Nothing opens.", "The dark holds no."],
    frost: ["Clear ice says yes.", "Yes, and it holds.", "The cold agrees.", "It sets firm. Yes.", "A cold, clean yes.", "Frost says go.", "Yes, hold steady.", "The ice is thick here.", "Yes, it will keep.", "Solid yes.", "The ice is thin.", "Frost on the glass.", "Wait for the thaw.", "Too cold to read.", "Ask when it melts.", "The ice says no.", "It cracks. No.", "No, too cold.", "Frozen shut.", "Nothing under the ice."],
  };
  const rgb = (r, g, b) => `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  const FINISHES = [
    { id: "classic", name: "Obsidian", shellLit: rgb(0.18, 0.19, 0.22), shellMid: rgb(0.05, 0.055, 0.07), shellDeep: rgb(0.01, 0.012, 0.02), rim: "#3dffa8", liquidGlow: rgb(0.12, 0.28, 0.52), liquidMid: rgb(0.04, 0.10, 0.24), liquidDeep: rgb(0.01, 0.03, 0.10), dieLit: rgb(0.22, 0.46, 0.82), die: rgb(0.10, 0.28, 0.62), dieDeep: rgb(0.04, 0.12, 0.34) },
    { id: "brass", name: "Brass", shellLit: rgb(0.22, 0.19, 0.14), shellMid: rgb(0.07, 0.06, 0.04), shellDeep: rgb(0.02, 0.016, 0.01), rim: rgb(0.93, 0.74, 0.36), liquidGlow: rgb(0.52, 0.36, 0.10), liquidMid: rgb(0.22, 0.14, 0.03), liquidDeep: rgb(0.08, 0.05, 0.01), dieLit: rgb(0.86, 0.68, 0.32), die: rgb(0.58, 0.42, 0.14), dieDeep: rgb(0.30, 0.20, 0.05) },
    { id: "ember", name: "Ember", shellLit: rgb(0.22, 0.15, 0.15), shellMid: rgb(0.07, 0.04, 0.04), shellDeep: rgb(0.02, 0.01, 0.01), rim: rgb(0.98, 0.48, 0.32), liquidGlow: rgb(0.56, 0.16, 0.12), liquidMid: rgb(0.24, 0.05, 0.05), liquidDeep: rgb(0.09, 0.01, 0.02), dieLit: rgb(0.88, 0.34, 0.28), die: rgb(0.62, 0.16, 0.14), dieDeep: rgb(0.32, 0.06, 0.06) },
    { id: "violet", name: "Violet", shellLit: rgb(0.19, 0.16, 0.24), shellMid: rgb(0.06, 0.05, 0.09), shellDeep: rgb(0.02, 0.01, 0.03), rim: "#c759f2", liquidGlow: rgb(0.40, 0.18, 0.56), liquidMid: rgb(0.17, 0.06, 0.26), liquidDeep: rgb(0.06, 0.02, 0.11), dieLit: rgb(0.70, 0.42, 0.92), die: rgb(0.44, 0.20, 0.68), dieDeep: rgb(0.22, 0.08, 0.36) },
    { id: "frost", name: "Frost", shellLit: rgb(0.17, 0.21, 0.24), shellMid: rgb(0.04, 0.06, 0.08), shellDeep: rgb(0.01, 0.02, 0.03), rim: rgb(0.62, 0.90, 0.98), liquidGlow: rgb(0.20, 0.48, 0.58), liquidMid: rgb(0.05, 0.18, 0.26), liquidDeep: rgb(0.01, 0.06, 0.11), dieLit: rgb(0.52, 0.82, 0.92), die: rgb(0.20, 0.50, 0.64), dieDeep: rgb(0.06, 0.22, 0.32) },
  ];
  const EightBall = { FINISHES, faces: (id) => BALL[id] || BALL.classic, finish: (id) => FINISHES.find((f) => f.id === id) || FINISHES[0] };
  EightBall.pick = function (previous, finishId) {
    const faces = EightBall.faces(finishId); let index = randomIndex(faces.length);
    if (previous != null && faces.length > 1) { let guard = 0; while (index === previous && guard < 8) { index = randomIndex(faces.length); guard++; } if (index === previous) index = (previous + 1) % faces.length; }
    return { index, text: faces[index] };
  };
  // Pack a face legend into short balanced lines that sit inside a point-up triangle.
  EightBall.lines = function (answer) {
    const words = answer.split(" ").filter(Boolean);
    if (words.length <= 1 || answer.length <= 12) return [answer];
    const target = Math.min(3, words.length); const n = words.length; const line = (a) => a.join(" ");
    const better = (c, t) => { const cm = Math.max(...c.map((s) => s.length)); const tm = Math.max(...t.map((s) => s.length)); if (cm !== tm) return cm < tm; if (c[0].length !== t[0].length) return c[0].length < t[0].length; const ss = (x) => x.reduce((a, s) => a + s.length * s.length, 0); return ss(c) < ss(t); };
    let best = [words.join(" ")];
    if (target === 2 || n === 2) { for (let i = 1; i < n; i++) { const c = [line(words.slice(0, i)), line(words.slice(i))]; if (better(c, best)) best = c; } return best; }
    for (let i = 1; i < n - 1; i++) for (let j = i + 1; j < n; j++) { const c = [line(words.slice(0, i)), line(words.slice(i, j)), line(words.slice(j))]; if (better(c, best)) best = c; }
    return best;
  };
  EightBall.copy = { tagline: "Ask a yes or no question. Then shake.", holdTheQuestion: "Hold the question in your head. A shake turns up one of twenty faces at random.", waiting: "Waiting for a shake.", tapFallback: "Tap the ball if this device cannot shake.", settledHint: "Shake again for another reading.", faceReads: "THE FACE READS", entertainment: "A toy die that lands at random. Entertainment only.", finishHint: "Each finish speaks with its own twenty faces.", noAnswerYet: "No answer yet." };
  GL.EightBall = EightBall;
})();
