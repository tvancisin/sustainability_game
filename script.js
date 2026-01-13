// ===========================================
// script.js — diagnostics + robust rendering
// ===========================================

document.getElementById("closeIntro").addEventListener("click", () => {
  const intro = document.getElementById("intro");
  intro.style.opacity = 0;
  intro.style.transition = "opacity 0.4s ease";
  setTimeout(() => intro.style.display = "none", 400);
});

// --- Random name pools ---
const playerNames = [
  "The Von Spigot Gallery",
  "LEAF Consulting",
  "Haunted History Tours Inc.",
  "First City Bank",
  "Baker Baker & McKenzie LLP",
  "The Museum of Lost Socks",
  "The World Wrestling Consortium"
];

const ai1Names = [
  "Business Systems Systems",
  "Lozenge AI",
  "Digital Sales Insight",
  "Hypercircle",
  "Noxio Box Toxic Storage Solutions",
  "Adjaye Jones & Cronk LLP",
  "Distributed Fusion Inc",
  "B.Well",
  "Total Cashflow Solutions",
  "The Data Doulas"
];

// --- Helpers ---
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function el(id) { return document.getElementById(id); }

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateAI2Name() {
  const buzzwords = ["Synergy", "Quantum", "Hyper", "Total", "Future", "Ultra", "Virtual", "Dynamic", "Cloud", "Carbon", "Crypto", "Green"];
  const techTerms = ["Solutions", "Systems", "Analytics", "Intelligence", "Optimisation", "Flow", "Interface", "Blockchain", "Fusion", "Comms", "Matrix", "Ops"];
  const suffixes = ["Inc.", "LLP", "LLC", "Group", "Associates", "Holdings", "Consortium", "Syndicate", "Unlimited", "Worldwide", "Partners"];
  const wildcard = ["Lozenge", "Entropy", "Biscuit", "Tapioca", "Algo", "Flavour", "Mince", "Pigment", "Pentimento", "Pimento", "Taramasalata", "Hummus", "Sludge", "Algorithm", "Gunk", "Echo", "Vapor", "Goblin"];
  const p = Math.random();
  if (p < 0.33) return `${pickRandom(buzzwords)} ${pickRandom(techTerms)} ${pickRandom(suffixes)}`;
  if (p < 0.66) return `${pickRandom(wildcard)} ${pickRandom(buzzwords)} ${pickRandom(suffixes)}`;
  return `${pickRandom(buzzwords)} ${pickRandom(wildcard)} ${pickRandom(techTerms)} ${pickRandom(suffixes)}`;
}

// --- Players ---
const playerName = pickRandom(playerNames);
const AI1Name = pickRandom(ai1Names);
const AI2Name = generateAI2Name();

let player = { name: playerName, hand: [], progress: 0, sustainability: 0, actionsPlayed: new Set(), eventsPlayed: new Set() };
let AI1 = { name: AI1Name, hand: [], progress: 0, sustainability: 0, actionsPlayed: new Set(), eventsPlayed: new Set() };
let AI2 = { name: AI2Name, hand: [], progress: 0, sustainability: 0, actionsPlayed: new Set(), eventsPlayed: new Set() };

// Keep card metadata even after deck mutations
let CARD_BY_ID = {};
function initCardLookup() {
  if (!Array.isArray(window.deck)) return;
  const snapshot = deck.slice();
  CARD_BY_ID = Object.fromEntries(snapshot.map(c => [c.id, c]));
}

function positionSpecialCards() {
  if (!Array.isArray(window.deck)) return;

  const i32 = deck.findIndex(card => card.id === 32);
  if (i32 !== -1) {
    const card32 = deck.splice(i32, 1)[0];
    deck.splice(19, 0, card32);
  }

  const i1 = deck.findIndex(card => card.id === 1);
  if (i1 !== -1) {
    const card1 = deck.splice(i1, 1)[0];
    const r = 2 + Math.floor(Math.random() * 3); // 2..4
    deck.splice(r, 0, card1);
  }
}

function dealOpeningHands() {
  if (!Array.isArray(window.deck)) return;
  for (let i = 0; i < 3; i++) {
    if (deck.length) player.hand.push(deck.pop());
    if (deck.length) AI1.hand.push(deck.pop());
    if (deck.length) AI2.hand.push(deck.pop());
  }
}

// --- Rendering ---
function renderPlayerHand() {
  const handDiv = el("playerHand");
  if (!handDiv) return;
  handDiv.innerHTML = "";

  const descriptionDiv = el("descriptionBox");
  const cardTitle = el("cardTitle");

  player.hand.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.style.background = card.type === "action" ? "steelblue" : "#E97132";

    // --- Header row: badge + type ---
    const headerRow = document.createElement("div");
    headerRow.className = "card-header-row";

    // Badge
    const idBadge = document.createElement("div");
    idBadge.className = "card-id";
    idBadge.textContent = card.id;
    headerRow.appendChild(idBadge);

    // Card type text
    const typeText = document.createElement("span");
    typeText.className = "card-type";
    typeText.textContent = card.type;
    headerRow.appendChild(typeText);

    cardDiv.appendChild(headerRow);

    // --- Card name ---
    const header = document.createElement("h4");
    header.className = "card-name";
    header.textContent = card.name.replace(/^\d+:\s*/, '');
    cardDiv.appendChild(header);

    // --- Card description ---
    const desc = document.createElement("div");
    desc.className = "card-desc";
    desc.textContent = card.description;
    cardDiv.appendChild(desc);

    // Click handler
    cardDiv.addEventListener("click", () => playPlayerCard(index));
    handDiv.appendChild(cardDiv);
  });




}


function logAIPlay(aiName, card) {
  const aiLogDiv = el("aiLog");
  if (!aiLogDiv) return;

  const entry = document.createElement("div");
  entry.innerHTML = `<strong>${aiName}</strong> played <em>${card.name}</em>: ${card.tooltip || "Effect applied."}`;
  entry.className = "ai-entry";

  aiLogDiv.appendChild(entry);

  // scroll the new entry into view
  entry.scrollIntoView({ behavior: "smooth", block: "end" });
}


function updateGameInfo() {
  const infoDiv = el("gameInfo");
  if (!infoDiv) return;
  infoDiv.innerHTML = `
    <strong>${player.name}</strong><br>
    Progress: ${player.progress},<br> Sustainability: ${player.sustainability}<br>
    Actions: ${renderCards([...player.actionsPlayed].sort((a, b) => a - b))}<br>
    Events: ${renderCards([...player.eventsPlayed].sort((a, b) => a - b))}<br><br>

    <strong>${AI1.name}</strong><br>
    Progress: ${AI1.progress},<br> Sustainability: ${AI1.sustainability}<br>
    Actions: ${renderCards([...AI1.actionsPlayed].sort((a, b) => a - b))}<br>
    Events: ${renderCards([...AI1.eventsPlayed].sort((a, b) => a - b))}<br><br>

    <strong>${AI2.name}</strong><br>
    Progress: ${AI2.progress},<br> Sustainability: ${AI2.sustainability}<br>
    Actions: ${renderCards([...AI2.actionsPlayed].sort((a, b) => a - b))}<br>
    Events: ${renderCards([...AI2.eventsPlayed].sort((a, b) => a - b))}<br>
  `;
}

function renderCards(idArray) {
  return idArray.length === 0
    ? "None"
    : idArray
      .map(id => {
        const card = CARD_BY_ID[id];
        const cardName = card ? card.name : "Unknown Card";
        return `<span title="${cardName}">${id}</span>`;
      })
      .join(", ");
}

function setHTMLById(id, html) { const node = el(id); if (node) node.innerHTML = html; }

function updatePlayedLists() {
  setHTMLById("yourActionsPlayed", renderCards([...player.actionsPlayed].sort((a, b) => a - b)));
  setHTMLById("yourEventsPlayed", renderCards([...player.eventsPlayed].sort((a, b) => a - b)));
  setHTMLById("ai1ActionsPlayed", renderCards([...AI1.actionsPlayed].sort((a, b) => a - b)));
  setHTMLById("ai1EventsPlayed", renderCards([...AI1.eventsPlayed].sort((a, b) => a - b)));
  setHTMLById("ai2ActionsPlayed", renderCards([...AI2.actionsPlayed].sort((a, b) => a - b)));
  setHTMLById("ai2EventsPlayed", renderCards([...AI2.eventsPlayed].sort((a, b) => a - b)));
}

// --- Turn logic with error guards ---
function safeEffectInvoke(card, P, A1, A2) {
  if (typeof card.effect !== "function") {
    console.warn("[DSG] Card has no effect function:", card);
    return;
  }
  try {
    card.effect(P, A1, A2);
  } catch (e) {
    console.error("[DSG] Error in card.effect for", card, e);
  }
}

function playAI1Card() {
  let card = null;
  let index = AI1.hand.findIndex(c => c.type === "action");
  if (index !== -1) {
    card = AI1.hand.splice(index, 1)[0];
    AI1.actionsPlayed.add(card.id);
  } else {
    index = AI1.hand.findIndex(c => c.type === "event");
    if (index !== -1) {
      card = AI1.hand.splice(index, 1)[0];
      AI1.eventsPlayed.add(card.id);
    }
  }
  if (card) {
    safeEffectInvoke(card, player, AI1, AI2);
    logAIPlay(AI1.name, card);
  }
  if (Array.isArray(window.deck) && deck.length) AI1.hand.push(deck.pop());
}

function playAI2Card() {
  let card = null;
  let index = AI2.hand.findIndex(c => c.type === "action");
  if (index !== -1) {
    card = AI2.hand.splice(index, 1)[0];
    AI2.actionsPlayed.add(card.id);
  } else {
    index = AI2.hand.findIndex(c => c.type === "event");
    if (index !== -1) {
      card = AI2.hand.splice(index, 1)[0];
      AI2.eventsPlayed.add(card.id);
    }
  }
  if (card) {
    safeEffectInvoke(card, player, AI1, AI2);
    logAIPlay(AI2.name, card);
  }
  if (Array.isArray(window.deck) && deck.length) AI2.hand.push(deck.pop());
}

function playPlayerCard(index) {
  const chosenCard = player.hand.splice(index, 1)[0];
  if (!chosenCard) return;

  safeEffectInvoke(chosenCard, player, AI1, AI2);

  if (chosenCard.type === "action") player.actionsPlayed.add(chosenCard.id);
  else if (chosenCard.type === "event") player.eventsPlayed.add(chosenCard.id);

  if (Array.isArray(window.deck) && deck.length) player.hand.push(deck.pop());

  logAIPlay(player.name, chosenCard);
  playAI1Card();
  playAI2Card();

  renderPlayerHand();
  updateGameInfo();
  updatePlayedLists();
}

// --- Bootstrapping with diagnostics ---
window.onload = () => {
  console.log("[DSG] Boot start");
  console.log("[DSG] deck present?", typeof window.deck, "isArray?", Array.isArray(window.deck), "length:", window.deck && window.deck.length);

  if (!Array.isArray(window.deck)) {
    console.error("[DSG] deck.js did not define window.deck as an array. In deck.js use: window.deck = [ /* cards */ ];");
  } else if (window.deck.length === 0) {
    console.error("[DSG] deck is an empty array. Add cards to deck.js.");
  } else {
    console.log("[DSG] first 3 cards sample:", window.deck.slice(0, 3));
  }

  if (Array.isArray(window.deck) && window.deck.length > 0) {
    initCardLookup();
    positionSpecialCards();
    shuffle(deck);
    dealOpeningHands();
    console.log("[DSG] Dealt hands — player:", player.hand.length, "AI1:", AI1.hand.length, "AI2:", AI2.hand.length);
    console.log("[DSG] Top of deck after deal:", deck.slice(-3));
  } else {
    console.warn("[DSG] Skipping deal because deck is missing/empty.");
  }

  renderPlayerHand();
  updateGameInfo();
  updatePlayedLists();

  // Set AI labels (matches YOUR HTML IDs). Falls back to alternative IDs if present.
  const a1Header = el("ai1ActionsHeader") || el("ai1ActionsLabel");
  const a1EHeader = el("ai1EventsHeader") || el("ai1EventsLabel");
  const a2Header = el("ai2ActionsHeader") || el("ai2ActionsLabel");
  const a2EHeader = el("ai2EventsHeader") || el("ai2EventsLabel");

  if (a1Header) a1Header.textContent = `${AI1.name} Actions Played`;
  if (a1EHeader) a1EHeader.textContent = `${AI1.name} Events Played`;
  if (a2Header) a2Header.textContent = `${AI2.name} Actions Played`;
  if (a2EHeader) a2EHeader.textContent = `${AI2.name} Events Played`;

  console.log("[DSG] Boot end");
};

