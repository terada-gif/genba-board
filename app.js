const DEFAULT_PEOPLE = [
  { id: "sato", name: "佐藤", visible: true },
  { id: "suzuki", name: "鈴木", visible: true },
  { id: "tanaka", name: "田中", visible: true },
  { id: "yamamoto", name: "山本", visible: true },
  { id: "kato", name: "加藤", visible: true },
  { id: "ito", name: "伊藤", visible: true },
  { id: "watanabe", name: "渡辺", visible: true },
  { id: "kobayashi", name: "小林", visible: true },
];

const STATUSES = [
  { id: "not-started", label: "未着手" },
  { id: "working", label: "作業中" },
  { id: "waiting", label: "部品待ち" },
  { id: "done", label: "完了" },
];

const CARDS_STORAGE_KEY = "morning-board-cards-v1";
const PEOPLE_STORAGE_KEY = "morning-board-people-v1";
const SUGGESTIONS_STORAGE_KEY = "morning-board-suggestions-v2";
const LEGACY_SUGGESTIONS_STORAGE_KEY = "morning-board-suggestions-v1";
const WORK_TEMPLATES_STORAGE_KEY = "morning-board-work-templates-v1";
const ALL_PEOPLE_TAB = "all";
const HISTORY_DAYS = 30;
const SUGGESTION_FIELDS = ["company", "customer", "car", "work"];
const DEFAULT_WORK_TEMPLATES = [
  "ドラレコ取付",
  "ETC取付",
  "エアコン点検",
  "バッテリー交換",
  "車検",
  "点検",
];

const seedCards = [
  {
    id: "card-1",
    assigneeId: "sato",
    status: "working",
    company: "青葉運送",
    plate: "2381",
    car: "エルフ",
    work: "車検整備",
    customer: "高橋様",
    order: 0,
  },
  {
    id: "card-2",
    assigneeId: "sato",
    status: "waiting",
    company: "中村設備",
    plate: "0912",
    car: "ハイエース",
    work: "ブレーキパッド交換",
    customer: "中村様",
    order: 1,
  },
  {
    id: "card-3",
    assigneeId: "suzuki",
    status: "not-started",
    company: "個人",
    plate: "7745",
    car: "N-BOX",
    work: "オイル交換",
    customer: "山田様",
    order: 0,
  },
  {
    id: "card-4",
    assigneeId: "tanaka",
    status: "done",
    company: "東町商店",
    plate: "5108",
    car: "プロボックス",
    work: "タイヤ交換",
    customer: "伊藤様",
    order: 0,
    completedAt: new Date().toISOString(),
  },
];

const board = document.querySelector("#board");
const mobileTabs = document.querySelector("#mobile-tabs");
const mobileList = document.querySelector("#mobile-list");
const completeDropZone = document.querySelector("#complete-drop-zone");
const dialog = document.querySelector("#card-dialog");
const form = document.querySelector("#card-form");
const addButton = document.querySelector("#add-card-button");
const membersButton = document.querySelector("#members-button");
const historyButton = document.querySelector("#history-button");
const closeButton = document.querySelector("#close-dialog-button");
const completeButton = document.querySelector("#complete-card-button");
const deleteButton = document.querySelector("#delete-card-button");
const dialogTitle = document.querySelector("#dialog-title");
const membersDialog = document.querySelector("#members-dialog");
const membersList = document.querySelector("#members-list");
const closeMembersButton = document.querySelector("#close-members-button");
const saveMembersButton = document.querySelector("#save-members-button");
const addPersonButton = document.querySelector("#add-person-button");
const seedPeopleButton = document.querySelector("#seed-people-button");
const historyDialog = document.querySelector("#history-dialog");
const historyList = document.querySelector("#history-list");
const closeHistoryButton = document.querySelector("#close-history-button");
const saveHistoryButton = document.querySelector("#save-history-button");
const imageDropZone = document.querySelector("#image-drop-zone");
const imageEmptyState = document.querySelector("#image-empty-state");
const imagePreviewState = document.querySelector("#image-preview-state");
const imageThumbnail = document.querySelector("#image-thumbnail");
const imagePreviewButton = document.querySelector("#image-preview-button");
const removeImageButton = document.querySelector("#remove-image-button");
const cameraInput = document.querySelector("#camera-input");
const galleryInput = document.querySelector("#gallery-input");
const imageLightbox = document.querySelector("#image-lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const closeLightboxButton = document.querySelector("#close-lightbox-button");
const autocompleteFields = document.querySelectorAll(".autocomplete-field");
const workTemplateList = document.querySelector("#work-template-list");
const workTemplateInput = document.querySelector("#work-template-input");
const addWorkTemplateButton = document.querySelector("#add-work-template-button");

const fields = {
  company: document.querySelector("#company-input"),
  plate: document.querySelector("#plate-input"),
  car: document.querySelector("#car-input"),
  work: document.querySelector("#work-input"),
  customer: document.querySelector("#customer-input"),
  assignee: document.querySelector("#assignee-input"),
  status: document.querySelector("#status-input"),
};

let people = loadPeople();
let cards = loadCards();
let editingCardId = null;
let dragState = null;
let activeMobileTab = ALL_PEOPLE_TAB;
let suggestions = loadSuggestions();
let workTemplates = loadWorkTemplates();
let pendingImageData = null;

function loadPeople() {
  const stored = localStorage.getItem(PEOPLE_STORAGE_KEY);
  if (!stored) return DEFAULT_PEOPLE.map((person) => ({ ...person }));

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PEOPLE.map((person) => ({ ...person }));
    }

    return parsed.map((person, index) => ({
      id: person.id || crypto.randomUUID(),
      name: person.name || `作業者${index + 1}`,
      visible: person.visible !== false,
    }));
  } catch {
    return DEFAULT_PEOPLE.map((person) => ({ ...person }));
  }
}

function loadCards() {
  const stored = localStorage.getItem(CARDS_STORAGE_KEY);
  if (!stored) return seedCards.map((card) => ({ ...card }));

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.map(normalizeCard)
      : seedCards.map((card) => normalizeCard({ ...card }));
  } catch {
    return seedCards.map((card) => normalizeCard({ ...card }));
  }
}

function normalizeCard(card) {
  return {
    ...card,
    imageData: card.imageData || null,
    createdAt: card.createdAt || null,
    updatedAt: card.updatedAt || card.completedAt || card.completed_at || null,
    completedAt:
      card.status === "done"
        ? card.completedAt || card.completed_at || new Date().toISOString()
        : null,
  };
}

function savePeople() {
  localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
}

function saveCards() {
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

function loadSuggestions() {
  const emptySuggestions = Object.fromEntries(SUGGESTION_FIELDS.map((field) => [field, []]));
  try {
    const stored = JSON.parse(localStorage.getItem(SUGGESTIONS_STORAGE_KEY) || "null");
    if (stored) {
      SUGGESTION_FIELDS.forEach((field) => {
        emptySuggestions[field] = normalizeSuggestionRecords(stored[field] || []);
      });
      return emptySuggestions;
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_SUGGESTIONS_STORAGE_KEY) || "{}");
    emptySuggestions.company = normalizeSuggestionRecords(legacy.companies || []);
    emptySuggestions.customer = normalizeSuggestionRecords(legacy.customers || []);
    return emptySuggestions;
  } catch {
    return emptySuggestions;
  }
}

function normalizeSuggestionRecords(records) {
  const now = Date.now();
  const normalized = records
    .map((record, index) => ({
      value: String(typeof record === "string" ? record : record?.value || "").trim(),
      usedAt:
        Number(
          typeof record === "string"
            ? now - (records.length - 1 - index)
            : record?.usedAt,
        ) || 0,
    }))
    .filter((record) => record.value);
  return dedupeSuggestionRecords(normalized);
}

function rememberSuggestions(card) {
  const usedAt = Date.now();
  SUGGESTION_FIELDS.forEach((field) => {
    const value = String(card[field] || "").trim();
    if (!value) return;
    suggestions[field] = dedupeSuggestionRecords([
      { value, usedAt },
      ...suggestions[field],
    ]).slice(0, 100);
  });
  localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(suggestions));
}

function dedupeSuggestionRecords(records) {
  const byValue = new Map();
  records.forEach((record) => {
    const key = normalizeSuggestionValue(record.value);
    const current = byValue.get(key);
    if (!key || (current && current.usedAt >= record.usedAt)) return;
    byValue.set(key, record);
  });
  return [...byValue.values()].sort((a, b) => b.usedAt - a.usedAt);
}

function normalizeSuggestionValue(value) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("ja-JP");
}

function suggestionCandidates(field, query = "") {
  const cardRecords = cards.map((card, index) => ({
    value: String(card[field] || "").trim(),
    usedAt:
      Date.parse(card.updatedAt || card.completedAt || card.createdAt || "") || index + 1,
  }));
  const normalizedQuery = normalizeSuggestionValue(query);

  return dedupeSuggestionRecords([...suggestions[field], ...cardRecords])
    .filter((record) => {
      const value = normalizeSuggestionValue(record.value);
      return value && value !== normalizedQuery && value.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const aStarts = normalizeSuggestionValue(a.value).startsWith(normalizedQuery);
      const bStarts = normalizeSuggestionValue(b.value).startsWith(normalizedQuery);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return b.usedAt - a.usedAt;
    })
    .slice(0, 5);
}

function loadWorkTemplates() {
  try {
    const stored = JSON.parse(localStorage.getItem(WORK_TEMPLATES_STORAGE_KEY) || "null");
    if (Array.isArray(stored)) return uniqueTemplateNames(stored);
  } catch {
    // Use defaults when stored data cannot be read.
  }
  return [...DEFAULT_WORK_TEMPLATES];
}

function uniqueTemplateNames(values) {
  const seen = new Set();
  return values.filter((value) => {
    const name = String(value || "").trim();
    const key = normalizeSuggestionValue(name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((value) => String(value).trim());
}

function saveWorkTemplates() {
  localStorage.setItem(WORK_TEMPLATES_STORAGE_KEY, JSON.stringify(workTemplates));
}

function renderSuggestionList(field) {
  const container = document.querySelector(`[data-suggestion-field="${field}"]`);
  const list = container?.querySelector(".suggestion-list");
  if (!list) return;
  const candidates = suggestionCandidates(field, fields[field].value);
  list.innerHTML = candidates
    .map(
      (record) => `
        <button class="suggestion-option" type="button" role="option" data-value="${escapeHtml(record.value)}">
          ${escapeHtml(record.value)}
        </button>
      `,
    )
    .join("");
  list.hidden = candidates.length === 0;
}

function hideSuggestionLists(except = null) {
  autocompleteFields.forEach((container) => {
    if (container === except) return;
    container.querySelector(".suggestion-list").hidden = true;
  });
}

function selectSuggestion(field, value) {
  fields[field].value = value;
  fields[field].focus();
  hideSuggestionLists();
}

function handleSuggestionKeydown(event, field) {
  const list = event.currentTarget.parentElement.querySelector(".suggestion-list");
  const options = [...list.querySelectorAll(".suggestion-option")];
  if (options.length === 0) return;
  const activeIndex = options.findIndex((option) => option.classList.contains("is-active"));

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (activeIndex + direction + options.length) % options.length;
    options.forEach((option) => option.classList.remove("is-active"));
    options[nextIndex].classList.add("is-active");
  }

  if (event.key === "Enter" && activeIndex >= 0) {
    event.preventDefault();
    selectSuggestion(field, options[activeIndex].dataset.value);
  }

  if (event.key === "Escape") hideSuggestionLists();
}

function renderWorkTemplates() {
  workTemplateList.innerHTML = workTemplates
    .map(
      (template, index) => `
        <span class="work-template-item">
          <button class="work-template-button" type="button" data-index="${index}">${escapeHtml(template)}</button>
          <button class="delete-template-button" type="button" data-index="${index}" title="${escapeHtml(template)}を削除" aria-label="${escapeHtml(template)}を削除">×</button>
        </span>
      `,
    )
    .join("");
}

function addWorkTemplate() {
  const name = workTemplateInput.value.trim();
  if (!name) return;
  workTemplates = uniqueTemplateNames([...workTemplates, name]);
  saveWorkTemplates();
  renderWorkTemplates();
  workTemplateInput.value = "";
}

function removeWorkTemplate(index) {
  workTemplates.splice(index, 1);
  saveWorkTemplates();
  renderWorkTemplates();
}

function statusById(statusId) {
  return STATUSES.find((status) => status.id === statusId) || STATUSES[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function visiblePeople() {
  return people.filter((person) => person.visible !== false);
}

function visibleCardsFor(personId) {
  return sortedCardsFor(personId).filter((card) => card.status !== "done");
}

function sortedCardsFor(personId) {
  return cards
    .filter((card) => card.assigneeId === personId)
    .sort((a, b) => a.order - b.order);
}

function sortedVisibleCards() {
  return visiblePeople().flatMap((person) => visibleCardsFor(person.id));
}

function renderBoard() {
  const displayedPeople = visiblePeople();
  board.innerHTML = "";
  board.style.setProperty("--desktop-columns", desktopColumnCount(displayedPeople.length));
  board.style.setProperty("--desktop-rows", desktopRowCount(displayedPeople.length));

  displayedPeople.forEach((person) => {
    const personCards = visibleCardsFor(person.id);
    const column = document.createElement("article");
    column.className = "person-column";
    column.dataset.personId = person.id;

    column.innerHTML = `
      <div class="column-head">
        <h2>${escapeHtml(person.name)}</h2>
        <span class="count-badge">${personCards.length}</span>
      </div>
      <div class="card-list" data-person-id="${person.id}"></div>
    `;

    const list = column.querySelector(".card-list");
    personCards.forEach((card) => list.appendChild(createCardElement(card)));
    board.appendChild(column);
  });

  ensureActiveMobileTab();
  populateSelects();
  renderMobileTabs();
  renderMobileList();
  renderMembersList();
  renderHistoryList();
}

function desktopColumnCount(count) {
  if (count <= 0) return 1;
  if (count <= 4) return count;
  if (count <= 6) return 3;
  return 4;
}

function desktopRowCount(count) {
  return count <= 4 ? 1 : 2;
}

function ensureActiveMobileTab() {
  if (activeMobileTab === ALL_PEOPLE_TAB) return;
  const activePerson = people.find((person) => person.id === activeMobileTab);
  if (!activePerson || activePerson.visible === false) {
    activeMobileTab = ALL_PEOPLE_TAB;
  }
}

function renderMobileTabs() {
  const tabs = [
    { id: ALL_PEOPLE_TAB, name: "全員", count: sortedVisibleCards().length },
    ...visiblePeople().map((person) => ({
      id: person.id,
      name: person.name,
      count: visibleCardsFor(person.id).length,
    })),
  ];

  mobileTabs.innerHTML = tabs
    .map(
      (tab) => `
        <button
          class="mobile-tab ${tab.id === activeMobileTab ? "is-active" : ""}"
          type="button"
          data-tab-id="${tab.id}"
          aria-pressed="${tab.id === activeMobileTab}"
        >
          <span>${escapeHtml(tab.name)}</span>
          <span class="mobile-tab-count">${tab.count}</span>
        </button>
      `,
    )
    .join("");
}

function renderMobileList() {
  const visibleCards =
    activeMobileTab === ALL_PEOPLE_TAB
      ? sortedVisibleCards()
      : visibleCardsFor(activeMobileTab);

  mobileList.innerHTML = "";

  if (visibleCards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "表示する案件はありません";
    mobileList.appendChild(empty);
    return;
  }

  visibleCards.forEach((card) => {
    const item = document.createElement("div");
    item.className = "mobile-card-row";
    item.dataset.personId = card.assigneeId;

    if (activeMobileTab === ALL_PEOPLE_TAB) {
      const assignee = document.createElement("div");
      assignee.className = "mobile-assignee";
      assignee.textContent = personById(card.assigneeId).name;
      item.appendChild(assignee);
    }

    item.appendChild(createCardElement(card, { mobile: true }));
    mobileList.appendChild(item);
  });
}

function createCardElement(card, options = {}) {
  const status = statusById(card.status);
  const cardElement = document.createElement("div");
  cardElement.className = `work-card ${card.status === "done" ? "is-done" : ""}`;
  cardElement.dataset.cardId = card.id;
  cardElement.setAttribute("aria-label", `${card.company} ${card.work}`);

  cardElement.innerHTML = `
    <span class="status-rail status-${card.status}"></span>
    <button class="card-main" type="button">
      <span class="card-body">
        <span class="card-meta-row">
          <span class="status-chip status-${card.status}">${status.label}</span>
          ${card.imageData ? '<span class="image-indicator" title="画像あり">📷 画像あり</span>' : ""}
        </span>
        <span class="card-line company-line">${escapeHtml(card.company)}</span>
        <span class="card-line vehicle-line">${escapeHtml(card.plate)} ${escapeHtml(card.car)}</span>
        <span class="card-line work-line">${escapeHtml(card.work)}</span>
        <span class="card-line customer-line">${escapeHtml(card.customer)}</span>
      </span>
    </button>
    ${
      options.mobile && card.status !== "done"
        ? '<button class="mobile-done-button" type="button" aria-label="完了にする">完了</button>'
        : ""
    }
  `;

  cardElement.querySelector(".card-main").addEventListener("click", () => {
    openCardDialog(card.id);
  });

  const mobileDoneButton = cardElement.querySelector(".mobile-done-button");
  mobileDoneButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    markCardDone(card.id);
  });

  if (!options.mobile) {
    cardElement.addEventListener("pointerdown", startPointer);
  }

  return cardElement;
}

function personById(personId) {
  return people.find((person) => person.id === personId) || {
    id: "unknown",
    name: "未設定",
    visible: false,
  };
}

function populateSelects() {
  fields.assignee.innerHTML = people
    .map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`)
    .join("");
  fields.status.innerHTML = STATUSES.map(
    (status) => `<option value="${status.id}">${status.label}</option>`,
  ).join("");
}

function openCardDialog(cardId = null, preset = null) {
  editingCardId = cardId;
  const card = cards.find((item) => item.id === cardId);
  const source = card || preset;
  dialogTitle.textContent = card ? "案件カード編集" : "案件カード追加";
  deleteButton.hidden = !card;
  completeButton.hidden = !card || card.status === "done";

  fields.company.value = source?.company || "";
  fields.plate.value = source?.plate || "";
  fields.car.value = source?.car || "";
  fields.work.value = source?.work || "";
  fields.customer.value = source?.customer || "";
  fields.assignee.value =
    source?.assigneeId ||
    (activeMobileTab !== ALL_PEOPLE_TAB ? activeMobileTab : visiblePeople()[0]?.id || people[0]?.id);
  fields.status.value = card ? card.status : STATUSES[0].id;
  pendingImageData = source?.imageData || null;
  updateImagePreview();
  hideSuggestionLists();

  dialog.showModal();
  fields.company.focus();
}

function closeDialog() {
  dialog.close();
  form.reset();
  editingCardId = null;
  pendingImageData = null;
  updateImagePreview();
  hideSuggestionLists();
}

function collectFormCard() {
  return {
    company: fields.company.value.trim(),
    plate: fields.plate.value.trim(),
    car: fields.car.value.trim(),
    work: fields.work.value.trim(),
    customer: fields.customer.value.trim(),
    assigneeId: fields.assignee.value,
    status: fields.status.value,
    imageData: pendingImageData,
  };
}

function nextOrderFor(personId) {
  return sortedCardsFor(personId).length;
}

function saveFormCard() {
  const formCard = collectFormCard();
  const savedAt = new Date().toISOString();

  if (editingCardId) {
    const index = cards.findIndex((card) => card.id === editingCardId);
    const previous = cards[index];
    cards[index] = {
      ...previous,
      ...formCard,
      updatedAt: savedAt,
      completedAt:
        formCard.status === "done"
          ? previous.completedAt || new Date().toISOString()
          : null,
      order:
        previous.assigneeId === formCard.assigneeId
          ? previous.order
          : nextOrderFor(formCard.assigneeId),
    };
  } else {
    cards.push({
      id: crypto.randomUUID(),
      ...formCard,
      createdAt: savedAt,
      updatedAt: savedAt,
      completedAt: formCard.status === "done" ? new Date().toISOString() : null,
      order: nextOrderFor(formCard.assigneeId),
    });
  }

  normalizeOrders();
  rememberSuggestions(formCard);
  saveCards();
  renderBoard();
  closeDialog();
}

function normalizeOrders() {
  people.forEach((person) => {
    sortedCardsFor(person.id).forEach((card, index) => {
      card.order = index;
    });
  });
}

function markCardDone(cardId) {
  const card = cards.find((item) => item.id === cardId);
  if (!card) return;
  card.status = "done";
  card.completedAt = new Date().toISOString();
  saveCards();
  renderBoard();
}

function restoreCard(cardId) {
  const card = cards.find((item) => item.id === cardId);
  if (!card) return;
  card.status = "not-started";
  card.completedAt = null;
  card.order = nextOrderFor(card.assigneeId);
  normalizeOrders();
  saveCards();
  renderBoard();
}

function startPointer(event) {
  if (event.button !== 0 || event.target.closest("button")?.classList.contains("mobile-done-button")) {
    return;
  }

  const cardElement = event.currentTarget;
  const rect = cardElement.getBoundingClientRect();
  dragState = {
    cardElement,
    cardId: cardElement.dataset.cardId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    hasMoved: false,
    placeholder: document.createElement("div"),
  };
  dragState.placeholder.className = "drop-placeholder";

  window.addEventListener("pointermove", movePointer);
  window.addEventListener("pointerup", endPointer, { once: true });
}

function movePointer(event) {
  if (!dragState) return;

  dragState.currentX = event.clientX;
  dragState.currentY = event.clientY;

  const dx = Math.abs(event.clientX - dragState.startX);
  const dy = Math.abs(event.clientY - dragState.startY);
  if (!dragState.hasMoved && dx + dy < 9) return;

  event.preventDefault();

  if (!dragState.hasMoved) {
    dragState.hasMoved = true;
    const rect = dragState.cardElement.getBoundingClientRect();
    dragState.cardElement.style.setProperty("--drag-width", `${rect.width}px`);
    dragState.cardElement.classList.add("dragging");
    dragState.cardElement.after(dragState.placeholder);
    document.body.appendChild(dragState.cardElement);
  }

  dragState.cardElement.style.left = `${event.clientX - dragState.offsetX}px`;
  dragState.cardElement.style.top = `${event.clientY - dragState.offsetY}px`;
  positionPlaceholder(event.clientX, event.clientY);
}

function positionPlaceholder(x, y) {
  dragState.cardElement.hidden = true;
  const target = document.elementFromPoint(x, y);
  dragState.cardElement.hidden = false;

  completeDropZone.classList.toggle(
    "is-over",
    Boolean(target?.closest?.("#complete-drop-zone")),
  );

  const list = target?.closest?.(".card-list");
  if (!list) return;

  const siblings = [...list.querySelectorAll(".work-card:not(.dragging)")];
  const beforeCard = siblings.find((card) => {
    const rect = card.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  });

  list.insertBefore(dragState.placeholder, beforeCard || null);
}

function endPointer() {
  window.removeEventListener("pointermove", movePointer);
  completeDropZone.classList.remove("is-over");
  if (!dragState) return;

  const state = dragState;
  dragState = null;

  if (!state.hasMoved) {
    return;
  }

  state.cardElement.hidden = true;
  const target = document.elementFromPoint(state.currentX, state.currentY);
  state.cardElement.hidden = false;
  const droppedOnComplete = Boolean(target?.closest?.("#complete-drop-zone"));

  state.cardElement.classList.remove("dragging");
  state.cardElement.removeAttribute("style");

  if (droppedOnComplete) {
    state.placeholder.remove();
    markCardDone(state.cardId);
    return;
  }

  state.placeholder.replaceWith(state.cardElement);
  persistDomOrder();
  saveCards();
  renderBoard();
}

function persistDomOrder() {
  document.querySelectorAll("#board .card-list").forEach((list) => {
    const assigneeId = list.dataset.personId;
    [...list.querySelectorAll(".work-card")].forEach((cardElement, index) => {
      const card = cards.find((item) => item.id === cardElement.dataset.cardId);
      if (!card) return;
      card.assigneeId = assigneeId;
      card.order = index;
    });
  });
}

function renderMembersList() {
  membersList.innerHTML = people
    .map((person, index) => {
      const count = sortedCardsFor(person.id).length;
      return `
        <div class="member-row" data-person-id="${person.id}">
          <label class="member-visible">
            <input class="member-visible-input" type="checkbox" ${person.visible !== false ? "checked" : ""} />
            表示
          </label>
          <input class="member-name-input" value="${escapeHtml(person.name)}" aria-label="作業者名" />
          <span class="member-count">${count}件</span>
          <button class="icon-mini-button move-person-up" type="button" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-mini-button move-person-down" type="button" ${index === people.length - 1 ? "disabled" : ""}>↓</button>
          <button class="danger-button delete-person-button" type="button">削除</button>
        </div>
      `;
    })
    .join("");
}

function completedCardsInHistory() {
  const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  return cards
    .filter((card) => {
      if (card.status !== "done") return false;
      const completedTime = new Date(card.completedAt || 0).getTime();
      return Number.isFinite(completedTime) && completedTime >= cutoff;
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

function renderHistoryList() {
  const completedCards = completedCardsInHistory();
  historyList.innerHTML = "";

  if (completedCards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "直近30日の完了履歴はありません";
    historyList.appendChild(empty);
    return;
  }

  completedCards.forEach((card) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.dataset.cardId = card.id;
    row.innerHTML = `
      <div class="history-card-text">
        <strong>${escapeHtml(card.company)}</strong>
        <span>${escapeHtml(card.plate)} ${escapeHtml(card.car)} / ${escapeHtml(card.work)}</span>
        <span>${escapeHtml(personById(card.assigneeId).name)} / ${formatDateTime(card.completedAt)}</span>
      </div>
      <div class="history-row-actions">
        <button class="secondary-button reregister-card-button" type="button">再登録</button>
        <button class="secondary-button restore-card-button" type="button">戻す</button>
      </div>
    `;
    historyList.appendChild(row);
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function updatePerson(personId, changes) {
  const person = people.find((item) => item.id === personId);
  if (!person) return;
  Object.assign(person, changes);
  savePeople();
  renderBoard();
}

function renamePerson(personId, name) {
  const person = people.find((item) => item.id === personId);
  if (!person) return;
  person.name = name;
  savePeople();
  populateSelects();
  renderMobileTabs();
  renderMobileList();
  document.querySelectorAll(`#board [data-person-id="${CSS.escape(personId)}"] .column-head h2`).forEach((heading) => {
    heading.textContent = name;
  });
}

function movePerson(personId, direction) {
  const index = people.findIndex((person) => person.id === personId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= people.length) return;
  const [person] = people.splice(index, 1);
  people.splice(nextIndex, 0, person);
  savePeople();
  renderBoard();
}

function deletePerson(personId) {
  const person = personById(personId);
  const personCards = sortedCardsFor(personId);

  if (personCards.length > 0) {
    const shouldDelete = confirm(
      `${person.name}さんには${personCards.length}件の案件があります。作業者と案件を削除しますか？`,
    );
    if (!shouldDelete) return;
    cards = cards.filter((card) => card.assigneeId !== personId);
    saveCards();
  }

  people = people.filter((item) => item.id !== personId);
  if (activeMobileTab === personId) activeMobileTab = ALL_PEOPLE_TAB;
  savePeople();
  renderBoard();
}

function addPerson() {
  const name = `作業者${people.length + 1}`;
  people.push({ id: crypto.randomUUID(), name, visible: true });
  savePeople();
  renderBoard();
}

function resetSamplePeople() {
  DEFAULT_PEOPLE.forEach((sample) => {
    const existing = people.find(
      (person) => person.id === sample.id || person.name === sample.name,
    );
    if (existing) {
      existing.visible = true;
      return;
    }
    people.push({ ...sample, visible: true });
  });
  savePeople();
  renderBoard();
}

addButton.addEventListener("click", () => openCardDialog());
historyButton.addEventListener("click", () => {
  renderHistoryList();
  historyDialog.showModal();
});
membersButton.addEventListener("click", () => {
  renderMembersList();
  membersDialog.showModal();
});
closeButton.addEventListener("click", closeDialog);
closeMembersButton.addEventListener("click", () => membersDialog.close());
saveMembersButton.addEventListener("click", () => membersDialog.close());
closeHistoryButton.addEventListener("click", () => historyDialog.close());
saveHistoryButton.addEventListener("click", () => historyDialog.close());
addPersonButton.addEventListener("click", addPerson);
seedPeopleButton.addEventListener("click", resetSamplePeople);
cameraInput.addEventListener("change", () => importFromImage(cameraInput.files[0]));
galleryInput.addEventListener("change", () => importFromImage(galleryInput.files[0]));
removeImageButton.addEventListener("click", removeFormImage);
imagePreviewButton.addEventListener("click", openImageLightbox);
closeLightboxButton.addEventListener("click", () => imageLightbox.close());
addWorkTemplateButton.addEventListener("click", addWorkTemplate);

workTemplateInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addWorkTemplate();
});

workTemplateList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  const index = Number(button.dataset.index);
  if (button.classList.contains("delete-template-button")) {
    removeWorkTemplate(index);
    return;
  }
  fields.work.value = workTemplates[index];
  hideSuggestionLists();
  fields.work.focus();
});

autocompleteFields.forEach((container) => {
  const field = container.dataset.suggestionField;
  const input = fields[field];
  const list = container.querySelector(".suggestion-list");

  input.addEventListener("focus", () => {
    hideSuggestionLists(container);
    renderSuggestionList(field);
  });
  input.addEventListener("input", () => renderSuggestionList(field));
  input.addEventListener("keydown", (event) => handleSuggestionKeydown(event, field));
  list.addEventListener("pointerdown", (event) => {
    const option = event.target.closest(".suggestion-option");
    if (!option) return;
    event.preventDefault();
    selectSuggestion(field, option.dataset.value);
  });
});

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".autocomplete-field")) hideSuggestionLists();
});

imageDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (!pendingImageData) imageDropZone.classList.add("is-dragging");
});

imageDropZone.addEventListener("dragleave", () => {
  imageDropZone.classList.remove("is-dragging");
});

imageDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  imageDropZone.classList.remove("is-dragging");
  importFromImage(event.dataTransfer.files[0]);
});

mobileTabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".mobile-tab");
  if (!tab) return;
  activeMobileTab = tab.dataset.tabId;
  renderMobileTabs();
  renderMobileList();
});

membersList.addEventListener("change", (event) => {
  const row = event.target.closest(".member-row");
  if (!row) return;

  if (event.target.classList.contains("member-visible-input")) {
    updatePerson(row.dataset.personId, { visible: event.target.checked });
  }
});

membersList.addEventListener("input", (event) => {
  const row = event.target.closest(".member-row");
  if (!row || !event.target.classList.contains("member-name-input")) return;
  const name = event.target.value.trim() || "名称未設定";
  renamePerson(row.dataset.personId, name);
});

membersList.addEventListener("click", (event) => {
  const row = event.target.closest(".member-row");
  if (!row) return;
  const personId = row.dataset.personId;

  if (event.target.classList.contains("move-person-up")) movePerson(personId, -1);
  if (event.target.classList.contains("move-person-down")) movePerson(personId, 1);
  if (event.target.classList.contains("delete-person-button")) deletePerson(personId);
});

historyList.addEventListener("click", (event) => {
  const row = event.target.closest(".history-row");
  if (!row) return;
  if (event.target.classList.contains("restore-card-button")) {
    restoreCard(row.dataset.cardId);
  }
  if (event.target.classList.contains("reregister-card-button")) {
    const source = cards.find((card) => card.id === row.dataset.cardId);
    if (!source) return;
    historyDialog.close();
    openCardDialog(null, { ...source, status: "not-started", completedAt: null });
  }
});

async function importFromImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  try {
    pendingImageData = await processImageFile(file);
    updateImagePreview();
  } catch {
    alert("画像を読み込めませんでした。別の画像を選択してください。");
  } finally {
    cameraInput.value = "";
    galleryInput.value = "";
  }
}

async function processImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));

  if (scale === 1 && file.size <= 500_000) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function updateImagePreview() {
  imageEmptyState.hidden = Boolean(pendingImageData);
  imagePreviewState.hidden = !pendingImageData;
  if (pendingImageData) {
    imageThumbnail.src = pendingImageData;
  } else {
    imageThumbnail.removeAttribute("src");
  }
}

function removeFormImage() {
  pendingImageData = null;
  cameraInput.value = "";
  galleryInput.value = "";
  updateImagePreview();
}

function openImageLightbox() {
  if (!pendingImageData) return;
  lightboxImage.src = pendingImageData;
  imageLightbox.showModal();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveFormCard();
});

completeButton.addEventListener("click", () => {
  fields.status.value = "done";
});

deleteButton.addEventListener("click", () => {
  if (!editingCardId) return;
  cards = cards.filter((card) => card.id !== editingCardId);
  normalizeOrders();
  saveCards();
  renderBoard();
  closeDialog();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

membersDialog.addEventListener("click", (event) => {
  if (event.target === membersDialog) membersDialog.close();
});

historyDialog.addEventListener("click", (event) => {
  if (event.target === historyDialog) historyDialog.close();
});

imageLightbox.addEventListener("click", (event) => {
  if (event.target === imageLightbox) imageLightbox.close();
});

populateSelects();
renderWorkTemplates();
renderBoard();
