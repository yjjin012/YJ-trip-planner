const STORAGE_KEY = "tripflow-travel-manager-v1";
const OLD_STORAGE_KEY = "solo-trip-planner-v1";
const PREVIOUS_STORAGE_KEYS = [
  "solo-trip-planner-v6",
  "solo-trip-planner-v5",
  "solo-trip-planner-v4",
  "solo-trip-planner-v3",
  "solo-trip-planner-v2",
];
const COMMON_FUND_LABEL = "공용 준비금";
const ZERO_DECIMAL_CURRENCIES = new Set(["KRW", "JPY", "VND"]);
const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";
const DESTINATION_IMAGE_ALIASES = new Map([
  ["new york", "New York City"],
  ["new york city", "New York City"],
  ["nyc", "New York City"],
  ["뉴욕", "New York City"],
]);
const WEATHER_DESTINATION_ALIASES = new Map([
  ["danang", { name: "Da Nang", country: "Vietnam", latitude: 16.0471, longitude: 108.2068 }],
  ["da nang", { name: "Da Nang", country: "Vietnam", latitude: 16.0471, longitude: 108.2068 }],
  ["다낭", { name: "Da Nang", country: "Vietnam", latitude: 16.0471, longitude: 108.2068 }],
]);
const DESTINATION_CURRENCY_HINTS = [
  { currency: "USD", keywords: ["new york", "new york city", "nyc", "뉴욕", "미국", "usa", "united states"] },
  { currency: "JPY", keywords: ["tokyo", "osaka", "kyoto", "도쿄", "오사카", "교토", "일본", "japan"] },
  { currency: "EUR", keywords: ["paris", "rome", "madrid", "barcelona", "파리", "로마", "마드리드", "바르셀로나", "프랑스", "이탈리아", "스페인"] },
  { currency: "GBP", keywords: ["london", "런던", "영국", "uk"] },
  { currency: "THB", keywords: ["bangkok", "phuket", "방콕", "푸켓", "태국", "thailand"] },
  { currency: "VND", keywords: ["danang", "hanoi", "ho chi minh", "다낭", "하노이", "호치민", "베트남", "vietnam"] },
  { currency: "TWD", keywords: ["taipei", "타이베이", "대만", "taiwan"] },
  { currency: "SGD", keywords: ["singapore", "싱가포르"] },
  { currency: "HKD", keywords: ["hong kong", "홍콩"] },
  { currency: "AUD", keywords: ["sydney", "melbourne", "시드니", "멜버른", "호주", "australia"] },
  { currency: "CAD", keywords: ["toronto", "vancouver", "토론토", "밴쿠버", "캐나다", "canada"] },
];
const DEFAULT_CHECKLIST_ITEMS = [
  { id: "passport", text: "여권 확인" },
  { id: "flight", text: "항공권 예약 확인" },
  { id: "stay", text: "숙소 예약 확인" },
  { id: "esim", text: "eSIM 또는 로밍 준비" },
  { id: "money", text: "환전 또는 해외 결제 카드 준비" },
  { id: "insurance", text: "여행자보험 확인" },
  { id: "packing", text: "짐 챙기기" },
];

const defaultState = {
  trip: {
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: 0,
    commonFund: 0,
    currency: "KRW",
    exchangeRate: 1,
  },
  participants: ["나"],
  checklist: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false })),
  prepaidCosts: [],
  selectedDate: "",
  editing: {
    planId: "",
    expenseId: "",
  },
  plans: [],
  expenses: [],
};

let tripStore = loadTripStore();
let state = activeTripState();
let weatherState = {
  key: "",
  status: "idle",
  data: null,
  message: "",
};
let heroImageState = {
  key: "",
  status: "idle",
  url: FALLBACK_HERO_IMAGE,
};
let selectedQuickCategory = "식비";
let cloudClient = null;
let cloudUser = null;
let cloudSaveTimer = null;

const elements = {
  appShell: document.querySelector(".app-shell"),
  topbar: document.querySelector(".topbar"),
  heroStartButton: document.querySelector("#heroStartButton"),
  tripTitle: document.querySelector("#tripTitle"),
  tripMeta: document.querySelector("#tripMeta"),
  onboardingPanel: document.querySelector("#onboardingPanel"),
  onboardingStartButton: document.querySelector("#onboardingStartButton"),
  onboardingCloudForm: document.querySelector("#onboardingCloudForm"),
  onboardingCloudEmail: document.querySelector("#onboardingCloudEmail"),
  onboardingCloudPassword: document.querySelector("#onboardingCloudPassword"),
  onboardingCloudSignupButton: document.querySelector("#onboardingCloudSignupButton"),
  onboardingCloudLoginButton: document.querySelector("#onboardingCloudLoginButton"),
  onboardingCloudLogoutButton: document.querySelector("#onboardingCloudLogoutButton"),
  onboardingCloudDownloadButton: document.querySelector("#onboardingCloudDownloadButton"),
  onboardingCloudStatus: document.querySelector("#onboardingCloudStatus"),
  onboardingCloudLastSaved: document.querySelector("#onboardingCloudLastSaved"),
  ownerPanel: document.querySelector("#ownerPanel"),
  tripSelector: document.querySelector("#tripSelector"),
  newTripButton: document.querySelector("#newTripButton"),
  deleteTripButton: document.querySelector("#deleteTripButton"),
  tripForm: document.querySelector("#tripForm"),
  tripName: document.querySelector("#tripName"),
  destination: document.querySelector("#destination"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  budget: document.querySelector("#budget"),
  commonFund: document.querySelector("#commonFund"),
  currency: document.querySelector("#currency"),
  exchangeRate: document.querySelector("#exchangeRate"),
  exchangeRateLabel: document.querySelector("#exchangeRateLabel"),
  checklistForm: document.querySelector("#checklistForm"),
  checklistText: document.querySelector("#checklistText"),
  checklistProgress: document.querySelector("#checklistProgress"),
  checklistList: document.querySelector("#checklistList"),
  prepaidForm: document.querySelector("#prepaidForm"),
  prepaidPanel: document.querySelector(".prepaid-panel"),
  prepaidName: document.querySelector("#prepaidName"),
  prepaidCategory: document.querySelector("#prepaidCategory"),
  prepaidAmount: document.querySelector("#prepaidAmount"),
  prepaidCurrency: document.querySelector("#prepaidCurrency"),
  prepaidSummary: document.querySelector("#prepaidSummary"),
  prepaidList: document.querySelector("#prepaidList"),
  resetButton: document.querySelector("#resetButton"),
  saveStatus: document.querySelector("#saveStatus"),
  tabButtons: document.querySelectorAll(".tab-button"),
  views: document.querySelectorAll(".view"),
  todayDateLabel: document.querySelector("#todayDateLabel"),
  weatherTitle: document.querySelector("#weatherTitle"),
  weatherMeta: document.querySelector("#weatherMeta"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherCondition: document.querySelector("#weatherCondition"),
  weatherDetails: document.querySelector("#weatherDetails"),
  refreshWeatherButton: document.querySelector("#refreshWeatherButton"),
  todayBudget: document.querySelector("#todayBudget"),
  todayRemaining: document.querySelector("#todayRemaining"),
  todayCommonFundLeft: document.querySelector("#todayCommonFundLeft"),
  todayDailySafe: document.querySelector("#todayDailySafe"),
  todayPlanned: document.querySelector("#todayPlanned"),
  todayActual: document.querySelector("#todayActual"),
  todayDiff: document.querySelector("#todayDiff"),
  todayPlansList: document.querySelector("#todayPlansList"),
  todayExpensesList: document.querySelector("#todayExpensesList"),
  quickExpenseForm: document.querySelector("#quickExpenseForm"),
  quickExpenseAmountLabel: document.querySelector("#quickExpenseAmountLabel"),
  quickExpenseAmount: document.querySelector("#quickExpenseAmount"),
  quickExpenseKrwPreview: document.querySelector("#quickExpenseKrwPreview"),
  quickExpenseMemo: document.querySelector("#quickExpenseMemo"),
  quickExpenseStatus: document.querySelector("#quickExpenseStatus"),
  quickCategoryButtons: document.querySelectorAll(".quick-category-button"),
  quickIsPersonalExpense: document.querySelector("#quickIsPersonalExpense"),
  quickPersonalParticipantField: document.querySelector("#quickPersonalParticipantField"),
  quickPersonalParticipant: document.querySelector("#quickPersonalParticipant"),
  quickExpenseSubmitButton: document.querySelector("#quickExpenseSubmitButton"),
  dayTabs: document.querySelector("#dayTabs"),
  daySummary: document.querySelector("#daySummary"),
  planForm: document.querySelector("#planForm"),
  planTime: document.querySelector("#planTime"),
  planPlace: document.querySelector("#planPlace"),
  planMemo: document.querySelector("#planMemo"),
  planSubmitButton: document.querySelector("#planSubmitButton"),
  cancelPlanEditButton: document.querySelector("#cancelPlanEditButton"),
  plansList: document.querySelector("#plansList"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDate: document.querySelector("#expenseDate"),
  linkedPlan: document.querySelector("#linkedPlan"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseAmountLabel: document.querySelector("#expenseAmountLabel"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseKrwPreview: document.querySelector("#expenseKrwPreview"),
  isPersonalExpense: document.querySelector("#isPersonalExpense"),
  personalParticipantField: document.querySelector("#personalParticipantField"),
  personalParticipant: document.querySelector("#personalParticipant"),
  paidByField: document.querySelector("#paidByField"),
  paidByHint: document.querySelector("#paidByHint"),
  paidByParticipant: document.querySelector("#paidByParticipant"),
  expenseMemo: document.querySelector("#expenseMemo"),
  expenseSubmitButton: document.querySelector("#expenseSubmitButton"),
  cancelExpenseEditButton: document.querySelector("#cancelExpenseEditButton"),
  expensesList: document.querySelector("#expensesList"),
  expenseSummary: document.querySelector("#expenseSummary"),
  totalBudget: document.querySelector("#totalBudget"),
  commonFundTotal: document.querySelector("#commonFundTotal"),
  commonFundRemaining: document.querySelector("#commonFundRemaining"),
  plannedTotal: document.querySelector("#plannedTotal"),
  actualTotal: document.querySelector("#actualTotal"),
  krwActualTotal: document.querySelector("#krwActualTotal"),
  sharedTotal: document.querySelector("#sharedTotal"),
  personalTotal: document.querySelector("#personalTotal"),
  remainingBudget: document.querySelector("#remainingBudget"),
  budgetRate: document.querySelector("#budgetRate"),
  budgetProgress: document.querySelector("#budgetProgress"),
  dayBreakdown: document.querySelector("#dayBreakdown"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  participantBreakdown: document.querySelector("#participantBreakdown"),
  settlementBreakdown: document.querySelector("#settlementBreakdown"),
  prepaidBreakdown: document.querySelector("#prepaidBreakdown"),
  participantForm: document.querySelector("#participantForm"),
  participantName: document.querySelector("#participantName"),
  participantCount: document.querySelector("#participantCount"),
  participantsList: document.querySelector("#participantsList"),
  exportDataButton: document.querySelector("#exportDataButton"),
  exportCompanionDataButton: document.querySelector("#exportCompanionDataButton"),
  exportViewHtmlButton: document.querySelector("#exportViewHtmlButton"),
  importDataInput: document.querySelector("#importDataInput"),
  backupStatus: document.querySelector("#backupStatus"),
  cloudForm: document.querySelector("#cloudForm"),
  cloudEmail: document.querySelector("#cloudEmail"),
  cloudPassword: document.querySelector("#cloudPassword"),
  cloudSignupButton: document.querySelector("#cloudSignupButton"),
  cloudLoginButton: document.querySelector("#cloudLoginButton"),
  cloudLogoutButton: document.querySelector("#cloudLogoutButton"),
  cloudUploadButton: document.querySelector("#cloudUploadButton"),
  cloudDownloadButton: document.querySelector("#cloudDownloadButton"),
  cloudStatus: document.querySelector("#cloudStatus"),
  cloudLastSaved: document.querySelector("#cloudLastSaved"),
};

function normalizeState(savedState) {
  return {
    ...structuredClone(defaultState),
    ...savedState,
    trip: {
      ...structuredClone(defaultState.trip),
      ...(savedState.trip || {}),
    },
    participants:
      Array.isArray(savedState.participants) && savedState.participants.length ? savedState.participants : ["나"],
    checklist: Array.isArray(savedState.checklist)
      ? savedState.checklist.map((item) => ({
          id: item.id || uid("check"),
          text: item.text || "준비할 일",
          checked: Boolean(item.checked),
        }))
      : structuredClone(defaultState.checklist),
    prepaidCosts: Array.isArray(savedState.prepaidCosts)
      ? savedState.prepaidCosts.map((item) => ({
          ...item,
          currency: item.currency || "KRW",
        }))
      : [],
    editing: {
      ...structuredClone(defaultState.editing),
      ...(savedState.editing || {}),
    },
    plans: Array.isArray(savedState.plans)
      ? savedState.plans.map((plan, index) => ({
          completed: false,
          order: index,
          ...plan,
        }))
      : [],
    expenses: Array.isArray(savedState.expenses)
      ? savedState.expenses.map((expense) => ({
          isPersonal: false,
          participant: "나",
          ...expense,
          paidBy: expense.paidBy || expense.participant || "나",
        }))
      : [],
  };
}

function loadTripStore() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      return normalizeTripStore(JSON.parse(saved));
    } catch {
      return createTripStore();
    }
  }

  const legacySaved =
    PREVIOUS_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) || localStorage.getItem(OLD_STORAGE_KEY);

  if (!legacySaved) {
    return createTripStore();
  }

  try {
    return createTripStore(normalizeState(JSON.parse(legacySaved)));
  } catch {
    return createTripStore();
  }
}

function normalizeTripStore(savedStore) {
  if (!savedStore || !Array.isArray(savedStore.trips)) {
    return createTripStore(normalizeState(savedStore || {}));
  }

  const trips = savedStore.trips.map((entry) => normalizeTripEntry(entry));

  if (!trips.length) {
    return createTripStore();
  }

  const activeTripId = trips.some((entry) => entry.id === savedStore.activeTripId) ? savedStore.activeTripId : trips[0].id;

  return {
    accessMode: savedStore.accessMode === "companion" ? "companion" : "owner",
    activeTripId,
    trips,
  };
}

function normalizeTripEntry(entry) {
  const now = new Date().toISOString();
  const tripState = entry?.state || entry || {};

  return {
    id: entry?.id || uid("trip"),
    createdAt: entry?.createdAt || entry?.updatedAt || now,
    updatedAt: entry?.updatedAt || now,
    state: normalizeState(tripState),
  };
}

function createTripStore(initialState = structuredClone(defaultState), accessMode = "owner") {
  const now = new Date().toISOString();
  const id = uid("trip");

  return {
    accessMode,
    activeTripId: id,
    trips: [
      {
        id,
        createdAt: now,
        updatedAt: now,
        state: normalizeState(initialState),
      },
    ],
  };
}

function activeTripEntry() {
  let entry = tripStore.trips.find((item) => item.id === tripStore.activeTripId);

  if (!entry) {
    entry = normalizeTripEntry({ state: structuredClone(defaultState) });
    tripStore.trips.push(entry);
    tripStore.activeTripId = entry.id;
  }

  return entry;
}

function activeTripState() {
  return structuredClone(activeTripEntry().state);
}

function persistTripStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tripStore));
}

function saveState() {
  const entry = activeTripEntry();
  entry.state = normalizeState(state);
  entry.updatedAt = new Date().toISOString();
  persistTripStore();
  elements.saveStatus.textContent = "자동 저장됨";
}

function setBackupStatus(message) {
  elements.backupStatus.textContent = message;
}

function cloudConfig() {
  return window.TRIP_APP_SUPABASE || {};
}

function isCloudConfigured() {
  const config = cloudConfig();

  return Boolean(config.url && config.anonKey && !config.url.includes("YOUR_") && !config.anonKey.includes("YOUR_"));
}

function setCloudStatus(message) {
  if (elements.cloudStatus) {
    elements.cloudStatus.textContent = message;
  }

  if (elements.onboardingCloudStatus) {
    elements.onboardingCloudStatus.textContent = message;
  }
}

function setCloudLastSaved(updatedAt) {
  const message = updatedAt ? `마지막 클라우드 저장: ${formatDateTime(updatedAt)}` : "마지막 클라우드 저장: 없음";

  if (elements.cloudLastSaved) {
    elements.cloudLastSaved.textContent = message;
  }

  if (elements.onboardingCloudLastSaved) {
    elements.onboardingCloudLastSaved.textContent = message;
  }
}

function renderCloudControls() {
  if (!elements.cloudForm) {
    return;
  }

  const configured = isCloudConfigured();
  const loggedIn = Boolean(cloudUser);
  const setupDisabled = !configured;
  const authInputs = [
    elements.cloudEmail,
    elements.cloudPassword,
    elements.cloudSignupButton,
    elements.cloudLoginButton,
    elements.onboardingCloudEmail,
    elements.onboardingCloudPassword,
    elements.onboardingCloudSignupButton,
    elements.onboardingCloudLoginButton,
  ].filter(Boolean);

  authInputs.forEach((item) => {
    item.disabled = setupDisabled || loggedIn;
  });

  elements.cloudLogoutButton.classList.toggle("hidden", !loggedIn);
  elements.onboardingCloudLogoutButton?.classList.toggle("hidden", !loggedIn);
  elements.cloudUploadButton.disabled = !loggedIn;
  elements.cloudDownloadButton.disabled = !loggedIn;
  if (elements.onboardingCloudDownloadButton) {
    elements.onboardingCloudDownloadButton.disabled = !loggedIn;
  }

  if (!configured) {
    setCloudStatus("supabase-config.js에 Supabase 주소와 공개 키를 넣으면 클라우드 저장을 켤 수 있습니다.");
    setCloudLastSaved("");
    return;
  }

  if (!window.supabase?.createClient) {
    setCloudStatus("Supabase 연결 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
    setCloudLastSaved("");
    return;
  }

  if (loggedIn) {
    setCloudStatus(`${cloudUser.email} 계정으로 연결됨. 필요할 때 직접 저장하거나 불러오세요.`);
  } else {
    setCloudStatus("로그인하면 클라우드 저장/불러오기를 사용할 수 있습니다.");
    setCloudLastSaved("");
  }
}

function initCloudSync() {
  if (!elements.cloudForm) {
    return;
  }

  renderCloudControls();

  if (!isCloudConfigured() || !window.supabase?.createClient) {
    return;
  }

  const config = cloudConfig();
  cloudClient = window.supabase.createClient(config.url, config.anonKey);

  cloudClient.auth.getSession().then(({ data }) => {
    cloudUser = data.session?.user || null;
    renderCloudControls();
    loadCloudLastSaved();
  });

  cloudClient.auth.onAuthStateChange((_event, session) => {
    cloudUser = session?.user || null;
    renderCloudControls();
    loadCloudLastSaved();
  });
}

function queueCloudSave() {
  // Cloud sync is intentionally manual. Keep this no-op to preserve older call sites safely.
}

async function loadCloudLastSaved() {
  if (!cloudClient || !cloudUser) {
    return;
  }

  const { data, error } = await cloudClient
    .from("trip_app_stores")
    .select("updated_at")
    .eq("user_id", cloudUser.id)
    .maybeSingle();

  if (error || !data?.updated_at) {
    setCloudLastSaved("");
    return;
  }

  setCloudLastSaved(data.updated_at);
}

async function syncTripStoreToCloud() {
  if (!cloudClient || !cloudUser) {
    setCloudStatus("먼저 클라우드에 로그인해 주세요.");
    return;
  }

  setCloudStatus("클라우드에 저장하는 중...");

  const updatedAt = new Date().toISOString();
  const { error } = await cloudClient.from("trip_app_stores").upsert(
    {
      user_id: cloudUser.id,
      trip_store: normalizeTripStore(tripStore),
      updated_at: updatedAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    setCloudStatus(`클라우드 저장 실패: ${error.message}`);
    return;
  }

  setCloudLastSaved(updatedAt);
  setCloudStatus(`${cloudUser.email} 계정에 현재 앱 전체 상태를 저장했습니다.`);
}

async function downloadTripStoreFromCloud() {
  if (!cloudClient || !cloudUser) {
    setCloudStatus("먼저 클라우드에 로그인해 주세요.");
    return;
  }

  if (!confirm("현재 브라우저의 데이터가 클라우드 데이터로 교체됩니다. 계속할까요?")) {
    return;
  }

  setCloudStatus("클라우드 데이터를 가져오는 중...");

  const { data, error } = await cloudClient
    .from("trip_app_stores")
    .select("trip_store, updated_at")
    .eq("user_id", cloudUser.id)
    .maybeSingle();

  if (error) {
    setCloudStatus(`클라우드 가져오기 실패: ${error.message}`);
    return;
  }

  if (!data?.trip_store) {
    setCloudStatus("아직 클라우드에 저장된 여행 데이터가 없습니다.");
    return;
  }

  tripStore = normalizeTripStore(data.trip_store);
  state = activeTripState();
  resetRuntimeState();
  persistTripStore();
  render();
  setCloudLastSaved(data.updated_at);
  setCloudStatus("클라우드 데이터를 불러와 현재 화면에 반영했습니다.");
}

async function signUpToCloud() {
  if (!cloudClient) {
    setCloudStatus("Supabase 설정을 먼저 넣어 주세요.");
    return;
  }

  const { email, password } = cloudCredentials();

  if (!email || password.length < 6) {
    setCloudStatus("이메일과 6자 이상의 비밀번호를 입력해 주세요.");
    return;
  }

  setCloudStatus("가입 처리 중...");

  const { error } = await cloudClient.auth.signUp({ email, password });

  if (error) {
    setCloudStatus(`가입 실패: ${error.message}`);
    return;
  }

  setCloudStatus("가입 완료. 이메일 확인이 켜져 있다면 메일 확인 후 로그인해 주세요.");
}

function cloudCredentials() {
  const onboardingEmail = elements.onboardingCloudEmail?.value.trim() || "";
  const onboardingPassword = elements.onboardingCloudPassword?.value || "";
  const shareEmail = elements.cloudEmail?.value.trim() || "";
  const sharePassword = elements.cloudPassword?.value || "";

  return {
    email: onboardingEmail || shareEmail,
    password: onboardingPassword || sharePassword,
  };
}

async function loginToCloud() {
  if (!cloudClient) {
    setCloudStatus("Supabase 설정을 먼저 넣어 주세요.");
    return;
  }

  const { email, password } = cloudCredentials();

  if (!email || !password) {
    setCloudStatus("이메일과 비밀번호를 입력해 주세요.");
    return;
  }

  setCloudStatus("로그인 중...");

  const { data, error } = await cloudClient.auth.signInWithPassword({ email, password });

  if (error) {
    setCloudStatus(`로그인 실패: ${error.message}`);
    return;
  }

  cloudUser = data.user || data.session?.user || cloudUser;
  renderCloudControls();
  await loadCloudLastSaved();
}

async function logoutFromCloud() {
  if (!cloudClient) {
    return;
  }

  await cloudClient.auth.signOut();
  cloudUser = null;
  renderCloudControls();
  setCloudStatus("로그아웃했습니다. 이 브라우저의 로컬 데이터는 그대로 남아 있습니다.");
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateRange(start, end) {
  if (!start || !end) {
    return [];
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    return [];
  }

  const days = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    days.push(localDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "알 수 없음";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "알 수 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoneyForCurrency(amount, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
  }).format(Number(amount) || 0);
}

function formatMoneyForTrip(amount, trip = state.trip) {
  return formatMoneyForCurrency(amount, trip.currency || "KRW");
}

function formatMoney(amount) {
  return formatMoneyForTrip(amount, state.trip);
}

function numberFromInput(inputOrValue) {
  const value = typeof inputOrValue === "string" ? inputOrValue : inputOrValue?.value || "";
  const normalized = String(value).replaceAll(",", "").trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function formatPlainNumber(value) {
  const raw = String(value || "").replaceAll(",", "").replace(/[^\d.]/g, "");

  if (!raw) {
    return "";
  }

  const [integerPart, ...decimalParts] = raw.split(".");
  const formattedInteger = integerPart ? Number(integerPart).toLocaleString("ko-KR") : "0";
  const decimalPart = decimalParts.join("");

  return raw.includes(".") ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

function setAmountInputValue(inputElement, value) {
  inputElement.value = value ? formatPlainNumber(value) : "";
}

function formatAmountInput(inputElement) {
  inputElement.value = formatPlainNumber(inputElement.value);
}

function suggestedCurrencyForDestination(destination = "") {
  const normalized = destination.trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  const match = DESTINATION_CURRENCY_HINTS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  return match?.currency || "";
}

function updateExchangeRateUi(currency = elements.currency.value) {
  elements.exchangeRate.disabled = currency === "KRW";
  elements.exchangeRateLabel.textContent =
    currency === "KRW" ? "현지 사용 화폐가 KRW일 때만 환율 입력이 필요 없습니다" : `1 ${currency} = 원화`;
  elements.quickExpenseAmountLabel.textContent = `금액 (${currency})`;
  elements.expenseAmountLabel.textContent = `금액 (${currency})`;
  renderKrwPreview(elements.quickExpenseAmount, elements.quickExpenseKrwPreview);
  renderKrwPreview(elements.expenseAmount, elements.expenseKrwPreview);
}

function exchangeRateForTrip(trip = state.trip) {
  if ((trip.currency || "KRW") === "KRW") {
    return 1;
  }

  return Number(trip.exchangeRate || 0);
}

function krwEquivalent(amount, currency = state.trip.currency || "KRW", trip = state.trip) {
  if (currency === "KRW") {
    return Number(amount || 0);
  }

  if (currency === (trip.currency || "KRW")) {
    const rate = exchangeRateForTrip(trip);
    return rate > 0 ? Number(amount || 0) * rate : null;
  }

  return null;
}

function krwTotalFromGroups(groups, trip = state.trip) {
  return Object.entries(groups || {}).reduce((sum, [currency, amount]) => {
    const converted = krwEquivalent(amount, currency, trip);
    return converted === null ? sum : sum + converted;
  }, 0);
}

function formatMoneyGroups(groups, preferredCurrency = state.trip.currency || "KRW") {
  const entries = Object.entries(groups).filter(([, amount]) => Number(amount || 0) > 0);

  if (!entries.length) {
    return formatMoneyForCurrency(0, preferredCurrency);
  }

  return entries
    .sort(([currencyA], [currencyB]) => {
      if (currencyA === preferredCurrency) return -1;
      if (currencyB === preferredCurrency) return 1;
      if (currencyA === "KRW") return -1;
      if (currencyB === "KRW") return 1;
      return currencyA.localeCompare(currencyB);
    })
    .map(([currency, amount]) => formatMoneyForCurrency(amount, currency))
    .join(" / ");
}

function destinationImageUrl(destination = "") {
  return destination.trim() ? heroImageState.url : FALLBACK_HERO_IMAGE;
}

function applyHeroImage(url = FALLBACK_HERO_IMAGE) {
  const imageUrl = url || FALLBACK_HERO_IMAGE;
  elements.topbar.style.setProperty("--hero-image", `url("${cssUrl(imageUrl)}")`);
}

function cssUrl(url) {
  return String(url).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function getDays() {
  return dateRange(state.trip.startDate, state.trip.endDate);
}

function hasTripBasics() {
  return Boolean(state.trip.name.trim() && state.trip.startDate && state.trip.endDate);
}

function preferredViewForTrip() {
  if (!hasTripBasics()) {
    return "settings";
  }

  const today = localDateString();

  if (state.trip.startDate && today < state.trip.startDate) {
    return "pretrip";
  }

  if (state.trip.endDate && today > state.trip.endDate) {
    return "report";
  }

  return "today";
}

function tripDisplayName(tripState, index = 0) {
  const name = tripState.trip.name.trim() || `새 여행 ${index + 1}`;
  const destination = tripState.trip.destination.trim();
  const dates =
    tripState.trip.startDate && tripState.trip.endDate
      ? `${formatDate(tripState.trip.startDate)} - ${formatDate(tripState.trip.endDate)}`
      : "날짜 미정";

  return destination ? `${name} · ${destination} · ${dates}` : `${name} · ${dates}`;
}

function getTodayTripDate() {
  const days = getDays();
  const today = localDateString();

  if (!days.length) {
    return "";
  }

  if (days.includes(today)) {
    return today;
  }

  return state.selectedDate || days[0];
}

function ensureSelectedDate() {
  const days = getDays();

  if (!days.length) {
    state.selectedDate = "";
    return;
  }

  if (!state.selectedDate || !days.includes(state.selectedDate)) {
    state.selectedDate = days[0];
  }
}

function totals() {
  const tripCurrency = state.trip.currency || "KRW";
  const prepaidGroups = groupAmountsByCurrency(state.prepaidCosts);
  const prepaid = prepaidGroups[tripCurrency] || 0;
  const variableActual = state.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const actual = prepaid + variableActual;
  const shared = state.expenses
    .filter((expense) => !expense.isPersonal)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), prepaid);
  const personal = state.expenses
    .filter((expense) => expense.isPersonal)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const budget = Number(state.trip.budget || 0);

  return {
    prepaid,
    prepaidGroups,
    allActualGroups: mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual }),
    sharedGroups: mergeMoneyGroups(prepaidGroups, { [tripCurrency]: shared - prepaid }),
    krwActual: krwTotalFromGroups(mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual })),
    variableActual,
    actual,
    shared,
    personal,
    budget,
    remaining: budget - krwTotalFromGroups(mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual })),
  };
}

function groupAmountsByCurrency(items = []) {
  return items.reduce((groups, item) => {
    const currency = item.currency || state.trip.currency || "KRW";
    groups[currency] = (groups[currency] || 0) + Number(item.amount || 0);
    return groups;
  }, {});
}

function mergeMoneyGroups(...groupsList) {
  return groupsList.reduce((merged, groups) => {
    Object.entries(groups || {}).forEach(([currency, amount]) => {
      merged[currency] = (merged[currency] || 0) + Number(amount || 0);
    });
    return merged;
  }, {});
}

function sharedExpenseTotal(expenses = state.expenses) {
  return expenses
    .filter((expense) => !expense.isPersonal)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function prepaidCostsTotal(prepaidCosts = state.prepaidCosts, currency = state.trip.currency || "KRW") {
  return prepaidCosts
    .filter((item) => (item.currency || "KRW") === currency)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function commonFundStatus(expenses = state.expenses, trip = state.trip, prepaidCosts = state.prepaidCosts) {
  const fund = Number(trip.commonFund || 0);
  const used = prepaidCostsTotal(prepaidCosts, trip.currency || "KRW") + sharedExpenseTotal(expenses);

  return {
    fund,
    used,
    remaining: fund - used,
    exceeded: used > fund,
  };
}

function totalsForDate(date) {
  const actual = state.expenses
    .filter((expense) => expense.date === date)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const prepaid = prepaidCostsTotal();

  return {
    prepaid,
    actual,
    total: prepaid + state.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  };
}

function remainingTripDays(fromDate) {
  const days = getDays();

  if (!fromDate || !days.length) {
    return 0;
  }

  const currentIndex = days.indexOf(fromDate);
  return currentIndex >= 0 ? days.length - currentIndex : days.length;
}

function render() {
  ensureSelectedDate();
  renderTripManager();
  renderTripHeader();
  renderTripForm();
  renderOnboardingMode();
  renderChecklist();
  renderPrepaidCosts();
  renderParticipants();
  renderCloudControls();
  renderToday();
  renderQuickExpenseControls();
  renderDayTabs();
  renderPlanEditState();
  renderPlanList();
  renderExpenseSelectors();
  renderExpenseTypeControls();
  renderExpenseEditState();
  renderExpenseList();
  renderReport();
}

function renderTripManager() {
  const isCompanion = tripStore.accessMode === "companion";
  elements.ownerPanel.classList.toggle("hidden", isCompanion);

  if (isCompanion) {
    return;
  }

  elements.tripSelector.innerHTML = "";

  tripStore.trips.forEach((entry, index) => {
    elements.tripSelector.add(new Option(tripDisplayName(entry.state, index), entry.id));
  });

  elements.tripSelector.value = tripStore.activeTripId;
  elements.deleteTripButton.textContent = tripStore.trips.length > 1 ? "현재 여행 삭제" : "현재 여행 비우기";
}

function renderTripHeader() {
  const { name, destination, startDate, endDate, budget, commonFund } = state.trip;
  applyHeroImage(destinationImageUrl(destination));
  maybeLoadHeroImage(destination);
  elements.tripTitle.textContent = name || "여행 관리";

  if (!startDate || !endDate) {
    elements.tripMeta.textContent = "현재 여행 정보를 한눈에 확인하세요";
    return;
  }

  const placeText = destination ? `${destination} · ` : "";
  const budgetText = budget ? `예산 ${formatMoneyForCurrency(budget, "KRW")}` : "예산 미정";
  const fundText = commonFund ? `현지 공용 준비금 ${formatMoney(commonFund)}` : "현지 공용 준비금 미정";
  const rateText =
    state.trip.currency === "KRW"
      ? "환율 없음"
      : state.trip.exchangeRate
        ? `1 ${state.trip.currency} ≈ ${formatMoneyForCurrency(state.trip.exchangeRate, "KRW")}`
        : "환율 미입력";
  elements.tripMeta.textContent = `${placeText}${formatDate(startDate)} - ${formatDate(endDate)} · ${budgetText} · ${fundText} · ${rateText}`;
}

function renderChecklist() {
  const checklist = state.checklist || [];
  const doneCount = checklist.filter((item) => item.checked).length;
  elements.checklistProgress.textContent = checklist.length
    ? `${doneCount}/${checklist.length} 완료`
    : "준비물을 추가해 주세요";
  elements.checklistList.innerHTML = "";

  if (!checklist.length) {
    elements.checklistList.innerHTML = `<div class="empty-state">여행 전에 챙길 준비물을 추가해 주세요.</div>`;
    return;
  }

  checklist.forEach((item) => {
    const row = document.createElement("article");
    row.className = `checklist-item ${item.checked ? "checked" : ""}`;
    row.innerHTML = `
      <button class="check-toggle" type="button" data-toggle-checklist="${item.id}" aria-label="${escapeHtml(item.text)} 완료 상태 변경">
        ${item.checked ? "✓" : ""}
      </button>
      <span>${escapeHtml(item.text)}</span>
        <button class="delete-button" type="button" data-delete-checklist="${item.id}" title="준비물 삭제" aria-label="준비물 삭제">×</button>
    `;
    elements.checklistList.append(row);
  });
}

function renderTripForm() {
  elements.tripName.value = state.trip.name;
  elements.destination.value = state.trip.destination;
  elements.startDate.value = state.trip.startDate;
  elements.endDate.value = state.trip.endDate;
  setAmountInputValue(elements.budget, state.trip.budget);
  setAmountInputValue(elements.commonFund, state.trip.commonFund);
  elements.currency.value = state.trip.currency;
  setAmountInputValue(elements.exchangeRate, state.trip.currency === "KRW" ? "" : state.trip.exchangeRate);
  updateExchangeRateUi(state.trip.currency);
  renderExpenseCurrencyHints();
}

function renderOnboardingMode() {
  const isOnboarding = !hasTripBasics();

  elements.appShell.classList.toggle("onboarding-mode", isOnboarding);
  elements.appShell.classList.toggle("setup-open", !isOnboarding);
  elements.onboardingPanel.classList.toggle("hidden", !isOnboarding);
  elements.prepaidPanel.classList.toggle("hidden", isOnboarding);

  const submitButton = elements.tripForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.textContent = isOnboarding ? "여행 관리 시작" : "여행 저장";
  }

  if (isOnboarding) {
    elements.saveStatus.textContent = "기본 정보를 저장하면 준비, 기록, 정산 화면이 열립니다";
    setActiveView("settings");
  }
}

function renderExpenseCurrencyHints() {
  const currency = state.trip.currency || "KRW";
  elements.quickExpenseAmountLabel.textContent = `금액 (${currency})`;
  elements.expenseAmountLabel.textContent = `금액 (${currency})`;
  renderKrwPreview(elements.quickExpenseAmount, elements.quickExpenseKrwPreview);
  renderKrwPreview(elements.expenseAmount, elements.expenseKrwPreview);
}

function renderKrwPreview(inputElement, outputElement) {
  const currency = state.trip.currency || "KRW";
  const amount = numberFromInput(inputElement);

  if (!amount) {
    outputElement.textContent = currency === "KRW" ? "원화 그대로 기록됩니다" : "금액을 입력하면 원화 환산액이 보입니다";
    return;
  }

  const converted = krwEquivalent(amount, currency);

  if (converted === null) {
    outputElement.textContent = "환율을 입력하면 원화 환산액이 보입니다";
    return;
  }

  outputElement.textContent = `약 ${formatMoneyForCurrency(converted, "KRW")}`;
}

function renderPrepaidCosts() {
  const prepaidGroups = groupAmountsByCurrency(state.prepaidCosts);
  elements.prepaidSummary.textContent = `선결제 ${formatMoneyGroups(prepaidGroups)}`;
  elements.prepaidList.innerHTML = "";

  if (!state.prepaidCosts.length) {
    elements.prepaidList.innerHTML = `<div class="empty-state">항공, 숙박, 입장권처럼 여행 전에 결제한 비용을 추가해 주세요.</div>`;
    return;
  }

  state.prepaidCosts.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card expense-card";
    card.innerHTML = `
      <div class="item-time">${escapeHtml(item.category)}</div>
      <div class="item-main">
        <strong>${formatMoneyForCurrency(item.amount, item.currency || "KRW")} · ${escapeHtml(item.name)}</strong>
        <span class="expense-badge">선결제</span>
      </div>
      <div class="item-actions">
        <button class="delete-button" type="button" data-delete-prepaid="${item.id}" title="선결제 경비 삭제" aria-label="선결제 경비 삭제">×</button>
      </div>
    `;
    elements.prepaidList.append(card);
  });
}

function renderParticipants() {
  const participants = getParticipants();
  elements.participantCount.textContent = participants.join(", ");
  elements.participantsList.innerHTML = "";

  participants.forEach((participant) => {
    const chip = document.createElement("div");
    chip.className = "participant-chip";
    const deleteButton =
      participant === "나" ? "" : `<button type="button" data-delete-participant="${escapeHtml(participant)}" aria-label="${escapeHtml(participant)} 삭제">×</button>`;
    chip.innerHTML = `<span>${escapeHtml(participant)}</span>${deleteButton}`;
    elements.participantsList.append(chip);
  });

  renderParticipantOptions();
}

function getParticipants() {
  const participants = state.participants.filter(Boolean);
  return participants.length ? participants : ["나"];
}

function renderParticipantOptions(selectedParticipant = elements.personalParticipant.value) {
  fillParticipantSelect(elements.personalParticipant, selectedParticipant);
  fillParticipantSelect(elements.paidByParticipant, elements.paidByParticipant.value);
  fillParticipantSelect(elements.quickPersonalParticipant, elements.quickPersonalParticipant.value);
}

function fillParticipantSelect(selectElement, selectedParticipant) {
  const participants = getParticipants();
  selectElement.innerHTML = "";

  participants.forEach((participant) => {
    selectElement.add(new Option(participant, participant));
  });

  selectElement.value = participants.includes(selectedParticipant) ? selectedParticipant : participants[0];
}

function requiresPaidByForSharedAmount(amount, editingExpenseId = "") {
  const commonFund = Number(state.trip.commonFund || 0);

  if (commonFund <= 0) {
    return true;
  }

  const sharedTotalBeforeThisExpense = state.expenses
    .filter((expense) => !expense.isPersonal && expense.id !== editingExpenseId)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return prepaidCostsTotal() + sharedTotalBeforeThisExpense + numberFromInput(String(amount || 0)) > commonFund;
}

function shouldAskPaidBy() {
  if (elements.isPersonalExpense.checked) {
    return false;
  }

  return requiresPaidByForSharedAmount(elements.expenseAmount.value, state.editing.expenseId);
}

function renderExpenseTypeControls() {
  const isPersonal = elements.isPersonalExpense.checked;
  const asksPaidBy = shouldAskPaidBy();

  elements.personalParticipantField.classList.toggle("hidden", !isPersonal);
  elements.paidByField.classList.toggle("hidden", !asksPaidBy);
  elements.paidByHint.classList.toggle("hidden", !asksPaidBy);
  renderParticipantOptions();
}

function renderQuickExpenseControls() {
  const hasTravelDate = Boolean(getTodayTripDate());
  const isPersonal = elements.quickIsPersonalExpense.checked;

  elements.quickPersonalParticipantField.classList.toggle("hidden", !isPersonal);
  elements.quickExpenseSubmitButton.disabled = !hasTravelDate;
  elements.quickCategoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.quickCategory === selectedQuickCategory);
  });
  renderParticipantOptions();
}

function renderToday() {
  const todayDate = getTodayTripDate();

  if (!todayDate) {
    elements.todayDateLabel.textContent = "여행 기간을 저장해 주세요";
    renderTodayLists("", [], []);
    renderTodayNumbers({ prepaid: 0, actual: 0, total: 0 });
    renderWeather();
    return;
  }

  const actualToday = localDateString();
  const labelPrefix = todayDate === actualToday ? "오늘" : "선택된 여행일";
  elements.todayDateLabel.textContent = `${labelPrefix} · ${formatDate(todayDate)}`;

  const dayPlans = orderedPlansForDate(todayDate);
  const dayExpenses = state.expenses.filter((expense) => expense.date === todayDate);

  renderTodayNumbers(totalsForDate(todayDate));
  renderTodayLists(todayDate, dayPlans, dayExpenses);
  renderWeather();
  maybeLoadWeather();
}

function renderTodayNumbers(dayTotals) {
  const { remaining, prepaidGroups, allActualGroups, krwActual } = totals();
  const fund = commonFundStatus();
  const remainingDays = remainingTripDays(getTodayTripDate());
  const dailySafe = remainingDays > 0 ? Math.max(remaining, 0) / remainingDays : 0;

  elements.todayBudget.textContent = formatMoneyForCurrency(state.trip.budget, "KRW");
  elements.todayRemaining.textContent = formatMoneyForCurrency(remaining, "KRW");
  elements.todayCommonFundLeft.textContent = formatMoney(fund.remaining);
  elements.todayDailySafe.textContent = formatMoneyForCurrency(dailySafe, "KRW");
  elements.todayPlanned.textContent = formatMoneyGroups(prepaidGroups);
  elements.todayActual.textContent = formatMoney(dayTotals.actual);
  elements.todayDiff.textContent = `${formatMoneyGroups(allActualGroups)} · 약 ${formatMoneyForCurrency(krwActual, "KRW")}`;
}

function renderTodayLists(date, plans, expenses) {
  elements.todayPlansList.innerHTML = "";
  elements.todayExpensesList.innerHTML = "";

  if (!date) {
    elements.todayPlansList.innerHTML = `<div class="empty-state">여행 기간을 저장하면 오늘 일정이 보입니다.</div>`;
    elements.todayExpensesList.innerHTML = `<div class="empty-state">여행 기간을 저장하면 오늘 지출이 보입니다.</div>`;
    return;
  }

  if (!plans.length) {
    elements.todayPlansList.innerHTML = `<div class="empty-state">이 날짜에는 아직 일정이 없습니다.</div>`;
  } else {
    plans.forEach((plan) => {
      const item = document.createElement("div");
      item.className = `mini-row ${plan.completed ? "completed-row" : ""}`;
      item.innerHTML = `<span>${escapeHtml(plan.time || "시간 미정")} · ${escapeHtml(plan.place)}</span><strong>${
        plan.completed ? "완료" : "예정"
      }</strong>`;
      elements.todayPlansList.append(item);
    });
  }

  if (!expenses.length) {
    elements.todayExpensesList.innerHTML = `<div class="empty-state">이 날짜에는 아직 지출 기록이 없습니다.</div>`;
  } else {
    const settlementMap = settlementAmountByExpense();
    expenses.forEach((expense) => {
      const item = document.createElement("div");
      item.className = "mini-row";
      const ownerText = expenseOwnerText(expense, settlementMap.get(expense.id));
      item.innerHTML = `<span>${escapeHtml(ownerText)} · ${escapeHtml(expense.category)} · ${escapeHtml(expense.memo || "메모 없음")}</span><strong>${formatMoney(expense.amount)}</strong>`;
      elements.todayExpensesList.append(item);
    });
  }
}

function renderWeather() {
  const destination = state.trip.destination.trim();
  elements.weatherTitle.textContent = destination ? `${destination} 날씨` : "여행지 날씨";

  if (!destination) {
    elements.weatherMeta.textContent = "여행지 칸에 도시 이름을 넣고 저장해 주세요";
    elements.weatherTemp.textContent = "--";
    elements.weatherCondition.textContent = "대기 중";
    elements.weatherDetails.innerHTML = "";
    elements.refreshWeatherButton.disabled = true;
    return;
  }

  elements.refreshWeatherButton.disabled = false;

  if (weatherState.status === "loading") {
    elements.weatherMeta.textContent = "날씨를 불러오는 중입니다";
    elements.weatherTemp.textContent = "--";
    elements.weatherCondition.textContent = "불러오는 중";
    elements.weatherDetails.innerHTML = "";
    return;
  }

  if (weatherState.status === "error") {
    elements.weatherMeta.textContent = weatherState.message || "날씨를 불러오지 못했습니다";
    elements.weatherTemp.textContent = "--";
    elements.weatherCondition.textContent = "확인 필요";
    elements.weatherDetails.innerHTML = "";
    return;
  }

  if (!weatherState.data) {
    elements.weatherMeta.textContent = "날씨를 불러올 준비가 됐습니다";
    elements.weatherTemp.textContent = "--";
    elements.weatherCondition.textContent = "대기 중";
    elements.weatherDetails.innerHTML = "";
    return;
  }

  const { place, current } = weatherState.data;
  elements.weatherMeta.textContent = `${place} · ${new Date(current.time).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  elements.weatherTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  elements.weatherCondition.textContent = weatherCodeText(current.weather_code);
  elements.weatherDetails.innerHTML = `
    <div class="weather-detail"><span>체감</span><strong>${Math.round(current.apparent_temperature)}°</strong></div>
    <div class="weather-detail"><span>습도</span><strong>${Math.round(current.relative_humidity_2m)}%</strong></div>
    <div class="weather-detail"><span>강수</span><strong>${current.precipitation ?? 0}mm</strong></div>
    <div class="weather-detail"><span>바람</span><strong>${Math.round(current.wind_speed_10m)}km/h</strong></div>
  `;
}

async function maybeLoadHeroImage(destination = state.trip.destination) {
  const key = destination.trim().toLowerCase();

  if (!key) {
    heroImageState = { key: "", status: "idle", url: FALLBACK_HERO_IMAGE };
    applyHeroImage(FALLBACK_HERO_IMAGE);
    return;
  }

  if (heroImageState.key === key && ["loading", "success", "error"].includes(heroImageState.status)) {
    return;
  }

  heroImageState = { key, status: "loading", url: FALLBACK_HERO_IMAGE };

  try {
    const imageUrl = await fetchDestinationImage(destination.trim());
    heroImageState = { key, status: "success", url: imageUrl || FALLBACK_HERO_IMAGE };
  } catch {
    heroImageState = { key, status: "error", url: FALLBACK_HERO_IMAGE };
  }

  if (state.trip.destination.trim().toLowerCase() === key) {
    applyHeroImage(heroImageState.url);
  }
}

async function fetchDestinationImage(destination) {
  const normalizedDestination = destination.trim().toLowerCase();
  const aliasedTitle = DESTINATION_IMAGE_ALIASES.get(normalizedDestination);
  const directCandidates = aliasedTitle
    ? [
        { language: "en", title: aliasedTitle },
        { language: "ko", title: destination },
      ]
    : [
        { language: "ko", title: destination },
        { language: "en", title: destination },
      ];

  for (const candidate of directCandidates) {
    const imageUrl = await fetchWikipediaPageImage(candidate.language, candidate.title);

    if (imageUrl) {
      return imageUrl;
    }
  }

  for (const language of ["ko", "en"]) {
    const searchedTitle = await searchWikipediaTitle(language, destination);

    if (!searchedTitle) {
      continue;
    }

    const imageUrl = await fetchWikipediaPageImage(language, searchedTitle);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return FALLBACK_HERO_IMAGE;
}

async function fetchWikipediaPageImage(language, title) {
  const params = new URLSearchParams({
    action: "query",
    origin: "*",
    format: "json",
    prop: "pageimages",
    piprop: "original|thumbnail",
    pithumbsize: "1600",
    titles: title,
  });

  try {
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const page = Object.values(data.query?.pages || {})[0];

    return page?.original?.source || page?.thumbnail?.source || "";
  } catch {
    return "";
  }
}

async function searchWikipediaTitle(language, destination) {
  const params = new URLSearchParams({
    action: "query",
    origin: "*",
    format: "json",
    list: "search",
    srsearch: destination,
    srlimit: "1",
  });

  try {
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    return data.query?.search?.[0]?.title || "";
  } catch {
    return "";
  }
}

async function maybeLoadWeather(force = false) {
  const destination = state.trip.destination.trim();
  const key = destination.toLowerCase();

  if (!destination) {
    weatherState = { key: "", status: "idle", data: null, message: "" };
    return;
  }

  if (!force && weatherState.key === key && ["loading", "success", "error"].includes(weatherState.status)) {
    return;
  }

  weatherState = { key, status: "loading", data: null, message: "" };
  renderWeather();

  try {
    const place = await geocodeDestination(destination);
    const weather = await fetchCurrentWeather(place);
    weatherState = {
      key,
      status: "success",
      data: {
        place: `${place.name}${place.country ? `, ${place.country}` : ""}`,
        current: weather.current,
      },
      message: "",
    };
  } catch (error) {
    weatherState = {
      key,
      status: "error",
      data: null,
      message: error.message || "날씨를 불러오지 못했습니다",
    };
  }

  renderWeather();
}

async function geocodeDestination(destination) {
  const normalized = destination.trim().toLowerCase();
  const alias = WEATHER_DESTINATION_ALIASES.get(normalized);

  if (alias) {
    return alias;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    destination,
  )}&count=10&language=ko&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("여행지 검색에 실패했습니다");
  }

  const data = await response.json();
  const results = data.results || [];
  const exactMatch = results.find((item) => item.name?.trim().toLowerCase() === normalized);
  const place = exactMatch || results[0];

  if (!place) {
    throw new Error("여행지를 찾지 못했습니다. 영어 도시명으로 다시 시도해 보세요.");
  }

  return place;
}

async function fetchCurrentWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!response.ok) {
    throw new Error("현재 날씨를 불러오지 못했습니다");
  }

  return response.json();
}

function weatherCodeText(code) {
  const weatherCodes = {
    0: "맑음",
    1: "대체로 맑음",
    2: "부분적으로 흐림",
    3: "흐림",
    45: "안개",
    48: "서리 안개",
    51: "약한 이슬비",
    53: "이슬비",
    55: "강한 이슬비",
    61: "약한 비",
    63: "비",
    65: "강한 비",
    71: "약한 눈",
    73: "눈",
    75: "강한 눈",
    80: "약한 소나기",
    81: "소나기",
    82: "강한 소나기",
    95: "뇌우",
    96: "우박 동반 뇌우",
    99: "강한 우박 동반 뇌우",
  };

  return weatherCodes[code] || "날씨 정보";
}

function renderDayTabs() {
  const days = getDays();
  elements.dayTabs.innerHTML = "";

  if (!days.length) {
    elements.dayTabs.innerHTML = `<div class="empty-state">여행 기간을 먼저 저장해 주세요.</div>`;
    elements.daySummary.textContent = "일정을 추가해 보세요";
    return;
  }

  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-button ${day === state.selectedDate ? "active" : ""}`;
    button.textContent = `${index + 1}일차 · ${formatDate(day)}`;
    button.addEventListener("click", () => {
      state.selectedDate = day;
      state.editing.planId = "";
      clearPlanForm();
      saveState();
      render();
    });
    elements.dayTabs.append(button);
  });

  const { actual } = totalsForDate(state.selectedDate);
  elements.daySummary.textContent = `이 날짜 지출 ${formatMoney(actual)}`;
}

function renderPlanEditState() {
  const isEditing = Boolean(state.editing.planId);
  elements.planSubmitButton.textContent = isEditing ? "일정 수정" : "일정 추가";
  elements.cancelPlanEditButton.classList.toggle("hidden", !isEditing);
}

function renderPlanList() {
  const plans = orderedPlansForDate(state.selectedDate);

  elements.plansList.innerHTML = "";

  if (!state.selectedDate) {
    elements.plansList.innerHTML = `<div class="empty-state">여행 기간을 저장하면 날짜별 일정을 만들 수 있습니다.</div>`;
    return;
  }

  if (!plans.length) {
    elements.plansList.innerHTML = `<div class="empty-state">이 날짜에는 아직 일정이 없습니다.</div>`;
    return;
  }

  plans.forEach((plan, index) => {
    const card = document.createElement("article");
    const completedClass = plan.completed ? "completed-card" : "";
    const editingClass = state.editing.planId === plan.id ? "editing-card" : "";
    card.className = `item-card ${completedClass} ${editingClass}`;
    card.innerHTML = `
      <div class="item-time">${plan.time || "시간 미정"}</div>
      <div class="item-main">
        <strong>${escapeHtml(plan.place)}</strong>
        <span class="expense-badge ${plan.completed ? "done" : ""}">${plan.completed ? "완료" : "예정"}</span>
        <p>${escapeHtml(plan.memo || "메모 없음")}</p>
      </div>
      <div class="item-actions">
        <button class="move-button" type="button" data-move-plan="${plan.id}" data-direction="up" ${
          index === 0 ? "disabled" : ""
        } title="위로 이동" aria-label="위로 이동">↑</button>
        <button class="move-button" type="button" data-move-plan="${plan.id}" data-direction="down" ${
          index === plans.length - 1 ? "disabled" : ""
        } title="아래로 이동" aria-label="아래로 이동">↓</button>
        <button class="complete-button" type="button" data-toggle-plan="${plan.id}" title="완료 상태 변경" aria-label="완료 상태 변경">${
          plan.completed ? "되돌리기" : "완료"
        }</button>
        <a class="map-link" href="${mapUrl(plan.place)}" target="_blank" rel="noopener" title="Google Maps 열기" aria-label="Google Maps 열기">↗</a>
        <button class="edit-button" type="button" data-edit-plan="${plan.id}" title="일정 수정" aria-label="일정 수정">수정</button>
        <button class="delete-button" type="button" data-delete-plan="${plan.id}" title="일정 삭제" aria-label="일정 삭제">×</button>
      </div>
    `;
    elements.plansList.append(card);
  });
}

function renderExpenseSelectors() {
  const days = getDays();
  const currentValue = elements.expenseDate.value || state.selectedDate || days[0] || "";
  elements.expenseDate.innerHTML = "";

  if (!days.length) {
    const option = new Option("여행 기간 없음", "");
    elements.expenseDate.add(option);
  } else {
    days.forEach((day, index) => {
      const option = new Option(`${index + 1}일차 · ${formatDate(day)}`, day);
      elements.expenseDate.add(option);
    });
    elements.expenseDate.value = days.includes(currentValue) ? currentValue : state.selectedDate || days[0];
  }

  renderLinkedPlanOptions(elements.expenseDate.value);
}

function renderLinkedPlanOptions(date, selectedPlanId = elements.linkedPlan.value) {
  elements.linkedPlan.innerHTML = "";
  elements.linkedPlan.add(new Option("연결 안 함", ""));

  orderedPlansForDate(date).forEach((plan) => {
    elements.linkedPlan.add(new Option(`${plan.time || "시간 미정"} · ${plan.place}`, plan.id));
  });

  if ([...elements.linkedPlan.options].some((option) => option.value === selectedPlanId)) {
    elements.linkedPlan.value = selectedPlanId;
  }
}

function renderExpenseEditState() {
  const isEditing = Boolean(state.editing.expenseId);
  elements.expenseSubmitButton.textContent = isEditing ? "경비 수정" : "경비 추가";
  elements.cancelExpenseEditButton.classList.toggle("hidden", !isEditing);
}

function expenseOwnerText(expense, settlementAmount = null) {
  if (expense.isPersonal) {
    return `개인 · ${expense.participant || "나"}`;
  }

  if (settlementAmount === 0 || expense.paidBy === COMMON_FUND_LABEL) {
    return "공용 · 준비금 사용";
  }

  if (settlementAmount > 0 && settlementAmount < Number(expense.amount || 0)) {
    return `공용 · 일부 결제 ${expense.paidBy || "나"}`;
  }

  return `공용 · 결제 ${expense.paidBy || "나"}`;
}

function renderExpenseList() {
  const expenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));
  elements.expensesList.innerHTML = "";

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  elements.expenseSummary.textContent = `총 지출 ${formatMoney(total)}`;

  if (!expenses.length) {
    elements.expensesList.innerHTML = `<div class="empty-state">아직 기록된 지출이 없습니다.</div>`;
    return;
  }

  const settlementMap = settlementAmountByExpense();

  expenses.forEach((expense) => {
    const linkedPlan = state.plans.find((plan) => plan.id === expense.planId);
    const linkedText = linkedPlan ? ` · ${linkedPlan.place}` : "";
    const typeText = expenseOwnerText(expense, settlementMap.get(expense.id));
    const typeClass = expense.isPersonal ? "expense-badge personal" : "expense-badge";
    const card = document.createElement("article");
    card.className = `item-card expense-card ${state.editing.expenseId === expense.id ? "editing-card" : ""}`;
    card.innerHTML = `
      <div class="item-time">${formatDate(expense.date)}</div>
      <div class="item-main">
        <strong>${formatMoney(expense.amount)} · ${escapeHtml(expense.category)}</strong>
        <span class="${typeClass}">${escapeHtml(typeText)}</span>
        <p>${escapeHtml(expense.memo || "메모 없음")}${escapeHtml(linkedText)}</p>
      </div>
      <div class="item-actions">
        <button class="edit-button" type="button" data-edit-expense="${expense.id}" title="경비 수정" aria-label="경비 수정">수정</button>
        <button class="delete-button" type="button" data-delete-expense="${expense.id}" title="경비 삭제" aria-label="경비 삭제">×</button>
      </div>
    `;
    elements.expensesList.append(card);
  });
}

function renderReport() {
  const { prepaidGroups, allActualGroups, sharedGroups, krwActual, personal, budget, remaining } = totals();
  const fund = commonFundStatus();
  elements.totalBudget.textContent = formatMoneyForCurrency(budget, "KRW");
  elements.commonFundTotal.textContent = formatMoney(fund.fund);
  elements.commonFundRemaining.textContent = formatMoney(fund.remaining);
  elements.plannedTotal.textContent = formatMoneyGroups(prepaidGroups);
  elements.actualTotal.textContent = formatMoneyGroups(allActualGroups);
  elements.krwActualTotal.textContent = formatMoneyForCurrency(krwActual, "KRW");
  elements.sharedTotal.textContent = formatMoneyGroups(sharedGroups);
  elements.personalTotal.textContent = formatMoney(personal);
  elements.remainingBudget.textContent = formatMoneyForCurrency(remaining, "KRW");

  const rate = budget > 0 ? Math.round((krwActual / budget) * 100) : 0;
  elements.budgetRate.textContent = `${rate}%`;
  elements.budgetProgress.style.width = `${Math.min(rate, 100)}%`;

  renderBreakdown(elements.dayBreakdown, groupByDay());
  renderBreakdown(elements.categoryBreakdown, groupByCategory());
  renderBreakdown(elements.participantBreakdown, groupPersonalByParticipant());
  renderSettlementBreakdown();
  renderBreakdown(elements.prepaidBreakdown, groupPrepaidCosts());
}

function groupByDay() {
  const days = getDays();
  return days.map((day) => {
    const total = state.expenses
      .filter((expense) => expense.date === day)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      label: formatDate(day),
      amount: total,
    };
  });
}

function groupByCategory() {
  const categoryMap = new Map();

  state.prepaidCosts.forEach((item) => {
    const currency = item.currency || "KRW";
    const key = `${item.category}__${currency}`;
    const label = currency === (state.trip.currency || "KRW") ? item.category : `${item.category} · ${currency}`;
    const current = categoryMap.get(key) || { label, currency, amount: 0 };
    categoryMap.set(key, { ...current, amount: current.amount + Number(item.amount || 0) });
  });

  state.expenses.forEach((expense) => {
    const currency = state.trip.currency || "KRW";
    const key = `${expense.category}__${currency}`;
    const current = categoryMap.get(key) || { label: expense.category, currency, amount: 0 };
    categoryMap.set(key, { ...current, amount: current.amount + Number(expense.amount || 0) });
  });

  return [...categoryMap.values()].sort((a, b) => b.amount - a.amount);
}

function groupPrepaidCosts() {
  return state.prepaidCosts
    .map((item) => ({
      label: `${item.category} · ${item.name}`,
      currency: item.currency || "KRW",
      amount: Number(item.amount || 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function groupPersonalByParticipant() {
  const participantMap = new Map();

  state.expenses
    .filter((expense) => expense.isPersonal)
    .forEach((expense) => {
      const participant = expense.participant || "나";
      participantMap.set(participant, (participantMap.get(participant) || 0) + Number(expense.amount || 0));
    });

  return [...participantMap.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function sharedExpensesForSettlement(expenses = state.expenses, trip = state.trip, prepaidCosts = state.prepaidCosts) {
  let remainingFund = Number(trip.commonFund || 0) - prepaidCostsTotal(prepaidCosts, trip.currency || "KRW");

  return expenses
    .filter((expense) => !expense.isPersonal)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.id || "").localeCompare(b.id || ""))
    .map((expense) => {
      const amount = Number(expense.amount || 0);
      const coveredByFund = Math.min(Math.max(remainingFund, 0), amount);
      remainingFund -= coveredByFund;

      return {
        ...expense,
        settlementAmount: Math.max(amount - coveredByFund, 0),
      };
    })
    .filter((expense) => expense.settlementAmount > 0);
}

function settlementAmountByExpense(expenses = state.expenses, trip = state.trip, prepaidCosts = state.prepaidCosts) {
  const map = new Map();

  expenses
    .filter((expense) => !expense.isPersonal)
    .forEach((expense) => {
      map.set(expense.id, 0);
    });

  sharedExpensesForSettlement(expenses, trip, prepaidCosts).forEach((expense) => {
    map.set(expense.id, Number(expense.settlementAmount || 0));
  });

  return map;
}

function settlementRows() {
  const participants = getParticipants();
  const settlementExpenses = sharedExpensesForSettlement();
  const sharedTotal = settlementExpenses.reduce((sum, expense) => sum + Number(expense.settlementAmount || 0), 0);

  if (participants.length <= 1 || sharedTotal <= 0) {
    return [];
  }

  const fairShare = sharedTotal / participants.length;
  const paidMap = new Map(participants.map((participant) => [participant, 0]));

  settlementExpenses.forEach((expense) => {
    const paidBy = participants.includes(expense.paidBy) ? expense.paidBy : "나";
    paidMap.set(paidBy, (paidMap.get(paidBy) || 0) + Number(expense.settlementAmount || 0));
  });

  return participants
    .map((participant) => {
      const paid = paidMap.get(participant) || 0;
      const balance = paid - fairShare;

      return {
        participant,
        paid,
        fairShare,
        balance,
      };
    })
    .sort((a, b) => b.balance - a.balance);
}

function renderSettlementBreakdown() {
  const rows = settlementRows();
  elements.settlementBreakdown.innerHTML = "";

  if (!rows.length) {
    elements.settlementBreakdown.innerHTML = `<div class="empty-state">공용 준비금을 넘는 공용 경비가 생기면 정산이 표시됩니다.</div>`;
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "mini-row";
    const label =
      row.balance > 0
        ? `${row.participant} 받을 금액`
        : row.balance < 0
          ? `${row.participant} 보낼 금액`
          : `${row.participant} 정산 완료`;
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${formatMoney(Math.abs(row.balance))}</strong>`;
    elements.settlementBreakdown.append(item);
  });
}

function renderBreakdown(container, rows) {
  container.innerHTML = "";

  const visibleRows = rows.filter((row) => row.amount > 0);

  if (!visibleRows.length) {
    container.innerHTML = `<div class="empty-state">기록이 쌓이면 여기에 표시됩니다.</div>`;
    return;
  }

  visibleRows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "mini-row";
    const amountText = row.currency ? formatMoneyForCurrency(row.amount, row.currency) : formatMoney(row.amount);
    item.innerHTML = `<span>${escapeHtml(row.label)}</span><strong>${amountText}</strong>`;
    container.append(item);
  });
}

function exportTripData(accessMode = "owner") {
  const isCompanionFile = accessMode === "companion";
  const backup = {
    app: "tripflow-travel-manager",
    version: 6,
    scope: "single-trip",
    accessMode,
    exportedAt: new Date().toISOString(),
    state: normalizeState(state),
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const fileName = backupFileName();

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setBackupStatus(
    isCompanionFile
      ? `${fileName} 파일로 저장했습니다. 동행자는 이 여행의 준비, 일정, 지출, 정산만 볼 수 있습니다.`
      : `${fileName} 파일로 저장했습니다. 이 파일에는 현재 여행의 관리 데이터만 담깁니다.`,
  );
}

function exportTripViewHtml() {
  const tripState = normalizeState(state);
  const html = buildTripViewHtml(tripState, weatherState);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  const fileName = tripViewFileName(tripState);

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setBackupStatus(`${fileName} 파일로 저장했습니다. 휴대폰 브라우저에서 바로 열어볼 수 있습니다.`);
}

function buildTripViewHtml(tripState, exportedWeather = { status: "idle", data: null }) {
  const trip = tripState.trip;
  const days = dateRange(trip.startDate, trip.endDate);
  const totals = totalsForTripState(tripState);
  const fund = commonFundStatus(tripState.expenses, trip, tripState.prepaidCosts);
  const title = trip.name.trim() || "여행 관리";
  const destination = trip.destination.trim();
  const heroImage = destinationImageUrl(destination);
  const period = trip.startDate && trip.endDate ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}` : "날짜 미정";
  const meta = destination ? `${destination} · ${period}` : period;
  const weatherText =
    exportedWeather.status === "success" && exportedWeather.data?.current
      ? `${exportedWeather.data.place} · ${Math.round(exportedWeather.data.current.temperature_2m)}° · ${weatherCodeText(
          exportedWeather.data.current.weather_code,
        )}`
      : "원래 앱에서 날씨를 불러온 뒤 저장하면 마지막 날씨가 함께 보입니다.";
  const plans = [...tripState.plans].sort(comparePlans);
  const expenses = [...tripState.expenses].sort((a, b) => a.date.localeCompare(b.date));
  const settlementMap = settlementAmountByExpense(tripState.expenses, trip, tripState.prepaidCosts);
  const checklistRows = tripState.checklist?.length
    ? tripState.checklist
        .map(
          (item) => `
            <li>
              <span>${item.checked ? "완료" : "대기"} · ${escapeHtml(item.text)}</span>
            </li>
          `,
        )
        .join("")
    : `<li class="empty">준비물 체크리스트가 없습니다.</li>`;
  const prepaidRows = tripState.prepaidCosts.length
    ? tripState.prepaidCosts
        .map(
          (item) => `
            <li>
              <span>${escapeHtml(item.category)} · ${escapeHtml(item.name)}</span>
              <strong>${formatMoneyForCurrency(item.amount, item.currency || "KRW")}</strong>
            </li>
          `,
        )
        .join("")
    : `<li class="empty">선결제 경비가 없습니다.</li>`;
  const expenseRows = expenses.length
    ? expenses
        .map((expense) => {
          const owner = expenseOwnerText(expense, settlementMap.get(expense.id));
          return `
            <li>
              <span>${escapeHtml(formatDate(expense.date))} · ${escapeHtml(owner)} · ${escapeHtml(expense.category)} · ${escapeHtml(
                expense.memo || "메모 없음",
              )}</span>
              <strong>${formatMoneyForTrip(expense.amount, trip)}</strong>
            </li>
          `;
        })
        .join("")
    : `<li class="empty">기록된 지출이 없습니다.</li>`;
  const settlementViewRows = settlementRowsForTripState(tripState);
  const settlementRowsHtml = settlementViewRows.length
    ? settlementViewRows
        .map((row) => {
          const label =
            row.balance > 0
              ? `${row.participant} 받을 금액`
              : row.balance < 0
                ? `${row.participant} 보낼 금액`
                : `${row.participant} 정산 완료`;
          return `
            <li>
              <span>${escapeHtml(label)}</span>
              <strong>${formatMoneyForTrip(Math.abs(row.balance), trip)}</strong>
            </li>
          `;
        })
        .join("")
    : `<li class="empty">공용 준비금을 넘는 공용 경비가 생기면 정산이 표시됩니다.</li>`;
  const dayTabs = days.length
    ? days
        .map(
          (day, index) => `
            <button class="day-button ${index === 0 ? "active" : ""}" type="button" data-day="${escapeHtml(day)}">
              ${index + 1}일차 · ${escapeHtml(formatDate(day))}
            </button>
          `,
        )
        .join("")
    : "";
  const daySections = days.length
    ? days
        .map((day, index) => {
          const dayPlans = plans.filter((plan) => plan.date === day);
          const rows = dayPlans.length
            ? dayPlans
                .map((plan) => {
                  const status = plan.completed ? "완료" : "예정";
                  return `
                    <article class="plan">
                      <div>
                        <span class="time">${escapeHtml(plan.time || "시간 미정")}</span>
                        <strong>${escapeHtml(plan.place)}</strong>
                        <em>${status}</em>
                      </div>
                      <p>${escapeHtml(plan.memo || "메모 없음")}</p>
                      <a href="${mapUrl(plan.place)}" target="_blank" rel="noopener">Google Maps</a>
                    </article>
                  `;
                })
                .join("")
            : `<p class="empty">이 날짜에는 일정이 없습니다.</p>`;

          return `
            <div class="day ${index === 0 ? "active" : ""}" data-day-panel="${escapeHtml(day)}">
              <h2>${index + 1}일차 · ${escapeHtml(formatDate(day))}</h2>
              ${rows}
            </div>
          `;
        })
        .join("")
    : `<div class="day active"><p class="empty">여행 날짜가 아직 없습니다.</p></div>`;

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} 여행 관리 보기</title>
    <style>
      :root { color-scheme: light; --ink:#17202a; --muted:#667085; --line:#d9dee8; --paper:#fff; --bg:#eef2f6; --teal:#0f766e; --mint:#d9f2ec; --coral:#e76f51; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif; line-height: 1.5; }
      main { width: min(920px, 100%); margin: 0 auto; padding: 20px; }
      header, section { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 18px; margin-bottom: 14px; }
      header { min-height: 220px; display: grid; align-content: end; border: 0; background-image: linear-gradient(90deg, rgba(12, 21, 31, .84), rgba(12, 21, 31, .28)), url("${cssUrl(heroImage)}"); background-position: center; background-size: cover; color: #fff; }
      .eyebrow { margin: 0 0 6px; color: var(--coral); font-size: .75rem; font-weight: 800; text-transform: uppercase; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { margin-bottom: 6px; font-size: clamp(1.8rem, 8vw, 3rem); line-height: 1.08; }
      h2 { font-size: 1.1rem; }
      .muted, .empty { color: var(--muted); }
      header .muted { color: rgba(255, 255, 255, .86); font-weight: 700; }
      .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .metric { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
      .metric span { display: block; color: var(--muted); font-size: .8rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.1rem; overflow-wrap: anywhere; }
      .day-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 2px 0 10px; margin-bottom: 12px; }
      .day-button { flex: 0 0 auto; min-height: 42px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--muted); padding: 8px 12px; font: inherit; font-weight: 800; }
      .day-button.active { border-color: var(--teal); background: var(--mint); color: var(--teal); }
      .day { display: none; }
      .day.active { display: block; }
      .plan { border-left: 5px solid var(--teal); border-radius: 8px; background: #f8faf9; padding: 12px; margin-top: 10px; }
      .plan div { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .plan strong { font-size: 1.05rem; }
      .time, .plan em { color: var(--teal); font-style: normal; font-weight: 800; }
      .plan p { margin: 8px 0; color: var(--muted); }
      a { color: var(--teal); font-weight: 800; }
      ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      li { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line); padding: 8px 0; }
      li:last-child { border-bottom: 0; }
      footer { color: var(--muted); font-size: .82rem; padding: 4px 2px 24px; }
      @media (max-width: 640px) {
        main { padding: 14px; }
        .summary { grid-template-columns: 1fr; }
        li { display: grid; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">TripFlow</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="muted">${escapeHtml(meta)}</p>
      </header>
      <section>
        <h2>여행 요약</h2>
        <div class="summary">
          <div class="metric"><span>여행지</span><strong>${escapeHtml(destination || "미정")}</strong></div>
          <div class="metric"><span>여행 기간</span><strong>${escapeHtml(period)}</strong></div>
          <div class="metric"><span>현지 사용 화폐</span><strong>${escapeHtml(trip.currency || "KRW")}</strong></div>
          <div class="metric"><span>날씨</span><strong>${escapeHtml(weatherText)}</strong></div>
          <div class="metric"><span>총 예산</span><strong>${formatMoneyForCurrency(totals.budget, "KRW")}</strong></div>
          <div class="metric"><span>현지 공용 준비금</span><strong>${formatMoneyForTrip(fund.fund, trip)}</strong></div>
          <div class="metric"><span>공용 잔액</span><strong>${formatMoneyForTrip(fund.remaining, trip)}</strong></div>
          <div class="metric"><span>총 사용</span><strong>${formatMoneyGroups(totals.allActualGroups, trip.currency || "KRW")}</strong></div>
          <div class="metric"><span>원화 환산</span><strong>${formatMoneyForCurrency(totals.krwActual, "KRW")}</strong></div>
          <div class="metric"><span>남은 예산</span><strong>${formatMoneyForCurrency(totals.remaining, "KRW")}</strong></div>
        </div>
      </section>
      <section class="schedule-section">
        <h2>여행 중 일정</h2>
        ${
          dayTabs
            ? `<nav class="day-tabs" aria-label="날짜 선택">
                ${dayTabs}
              </nav>`
            : ""
        }
        ${daySections}
      </section>
      <section>
        <h2>여행 전 준비물</h2>
        <ul>${checklistRows}</ul>
      </section>
      <section>
        <h2>선결제 경비</h2>
        <ul>${prepaidRows}</ul>
      </section>
      <section>
        <h2>여행 중 지출</h2>
        <ul>${expenseRows}</ul>
      </section>
      <section>
        <h2>여행 후 정산</h2>
        <p class="muted">공용 준비금을 넘은 공용 경비 기준</p>
        <ul>${settlementRowsHtml}</ul>
      </section>
      <section>
        <h2>참여자</h2>
        <p>${escapeHtml(tripState.participants.join(", "))}</p>
      </section>
      <footer>보기 전용 여행 관리 파일입니다. 수정이나 자동 동기화는 원래 앱에서 진행해 주세요.</footer>
    </main>
    <script>
      document.querySelectorAll(".day-button").forEach((button) => {
        button.addEventListener("click", () => {
          const day = button.dataset.day;
          document.querySelectorAll(".day-button").forEach((item) => {
            item.classList.toggle("active", item === button);
          });
          document.querySelectorAll("[data-day-panel]").forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.dayPanel === day);
          });
        });
      });
    </script>
  </body>
</html>`;
}

function totalsForTripState(tripState) {
  const tripCurrency = tripState.trip.currency || "KRW";
  const prepaidGroups = groupAmountsByCurrencyForTrip(tripState.prepaidCosts, tripCurrency);
  const prepaid = prepaidGroups[tripCurrency] || 0;
  const variableActual = tripState.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const actual = prepaid + variableActual;
  const budget = Number(tripState.trip.budget || 0);

  return {
    prepaid,
    prepaidGroups,
    allActualGroups: mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual }),
    krwActual: krwTotalFromGroups(mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual }), tripState.trip),
    variableActual,
    actual,
    budget,
    remaining: budget - krwTotalFromGroups(mergeMoneyGroups(prepaidGroups, { [tripCurrency]: variableActual }), tripState.trip),
  };
}

function groupAmountsByCurrencyForTrip(items = [], fallbackCurrency = "KRW") {
  return items.reduce((groups, item) => {
    const currency = item.currency || fallbackCurrency;
    groups[currency] = (groups[currency] || 0) + Number(item.amount || 0);
    return groups;
  }, {});
}

function settlementRowsForTripState(tripState) {
  const participants = tripState.participants?.length ? tripState.participants : ["나"];
  const settlementExpenses = sharedExpensesForSettlement(tripState.expenses, tripState.trip, tripState.prepaidCosts);
  const sharedTotal = settlementExpenses.reduce((sum, expense) => sum + Number(expense.settlementAmount || 0), 0);

  if (participants.length <= 1 || sharedTotal <= 0) {
    return [];
  }

  const fairShare = sharedTotal / participants.length;
  const paidMap = new Map(participants.map((participant) => [participant, 0]));

  settlementExpenses.forEach((expense) => {
    const paidBy = participants.includes(expense.paidBy) ? expense.paidBy : "나";
    paidMap.set(paidBy, (paidMap.get(paidBy) || 0) + Number(expense.settlementAmount || 0));
  });

  return participants
    .map((participant) => ({
      participant,
      paid: paidMap.get(participant) || 0,
      fairShare,
      balance: (paidMap.get(participant) || 0) - fairShare,
    }))
    .sort((a, b) => b.balance - a.balance);
}

function comparePlans(a, b) {
  const dateDiff = (a.date || "").localeCompare(b.date || "");
  const orderDiff = Number(a.order ?? 0) - Number(b.order ?? 0);

  return dateDiff || orderDiff || (a.time || "99:99").localeCompare(b.time || "99:99");
}

function tripViewFileName(tripState) {
  const baseName = tripState.trip.name.trim() || "tripflow";
  const safeName = baseName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .toLowerCase();

  return `${safeName || "tripflow"}-view-${localDateString()}.html`;
}

function backupFileName() {
  const baseName = state.trip.name.trim() || "tripflow";
  const safeName = baseName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .toLowerCase();

  return `${safeName || "tripflow"}-backup-${localDateString()}.json`;
}

function importTripData(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const importedState = parsed.state || parsed;
      const normalized = normalizeState(importedState);
      const isCompanionFile = parsed.accessMode === "companion";

      if (!isValidBackupState(normalized)) {
        throw new Error("여행 데이터 형식이 맞지 않습니다.");
      }

      const message = isCompanionFile
        ? "동행자용 파일입니다. 이 여행 하나만 보이는 동행자 모드로 열까요?"
        : "이 파일의 여행을 내 여행 목록에 새로 추가할까요?";

      if (!confirm(message)) {
        elements.importDataInput.value = "";
        return;
      }

      normalized.editing = structuredClone(defaultState.editing);

      if (isCompanionFile) {
        tripStore = createTripStore(normalized, "companion");
        state = activeTripState();
        resetRuntimeState();
        persistTripStore();
        setActiveView(preferredViewForTrip());
        render();
        setBackupStatus(`${file.name} 파일을 동행자 모드로 열었습니다.`);
      } else {
        addTripToStore(normalized);
        setBackupStatus(`${file.name} 파일을 새 여행으로 추가했습니다.`);
      }
    } catch (error) {
      setBackupStatus(error.message || "백업 파일을 불러오지 못했습니다.");
    } finally {
      elements.importDataInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    setBackupStatus("파일을 읽지 못했습니다.");
    elements.importDataInput.value = "";
  });

  reader.readAsText(file);
}

function isValidBackupState(candidate) {
  return (
    candidate &&
    typeof candidate === "object" &&
    candidate.trip &&
    typeof candidate.trip === "object" &&
    Array.isArray(candidate.plans) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.participants)
  );
}

function mapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearPlanForm() {
  elements.planForm.reset();
  state.editing.planId = "";
  renderPlanEditState();
}

function clearExpenseForm() {
  elements.expenseForm.reset();
  state.editing.expenseId = "";
  elements.expenseDate.value = state.selectedDate || getDays()[0] || "";
  renderLinkedPlanOptions(elements.expenseDate.value, "");
  elements.isPersonalExpense.checked = false;
  elements.paidByParticipant.value = "나";
  renderExpenseTypeControls();
  renderExpenseEditState();
  renderKrwPreview(elements.expenseAmount, elements.expenseKrwPreview);
}

function clearQuickExpenseForm() {
  elements.quickExpenseAmount.value = "";
  elements.quickExpenseMemo.value = "";
  elements.quickIsPersonalExpense.checked = false;
  renderQuickExpenseControls();
  renderKrwPreview(elements.quickExpenseAmount, elements.quickExpenseKrwPreview);
}

function addExpense(expense) {
  state.expenses.push({
    id: uid("expense"),
    ...expense,
  });
}

function resetRuntimeState() {
  weatherState = { key: "", status: "idle", data: null, message: "" };
  heroImageState = { key: "", status: "idle", url: FALLBACK_HERO_IMAGE };
  selectedQuickCategory = "식비";
  elements.quickExpenseStatus.textContent = "저장 대기";
}

function addTripToStore(tripState = structuredClone(defaultState)) {
  const entry = normalizeTripEntry({ state: tripState });
  tripStore.trips.push(entry);
  tripStore.activeTripId = entry.id;
  state = structuredClone(entry.state);
  resetRuntimeState();
  persistTripStore();
  setActiveView(preferredViewForTrip());
  render();
}

function switchTrip(tripId) {
  if (tripStore.accessMode === "companion") {
    return;
  }

  if (tripId === tripStore.activeTripId) {
    return;
  }

  saveState();
  tripStore.activeTripId = tripId;
  state = activeTripState();
  state.editing = structuredClone(defaultState.editing);
  resetRuntimeState();
  persistTripStore();
  setActiveView(preferredViewForTrip());
  render();
}

function deleteActiveTrip() {
  if (tripStore.accessMode === "companion") {
    return;
  }

  if (tripStore.trips.length <= 1) {
    state = structuredClone(defaultState);
    resetRuntimeState();
    saveState();
    setBackupStatus("현재 여행을 비웠습니다.");
    setActiveView(preferredViewForTrip());
    render();
    return;
  }

  const currentIndex = tripStore.trips.findIndex((entry) => entry.id === tripStore.activeTripId);
  tripStore.trips = tripStore.trips.filter((entry) => entry.id !== tripStore.activeTripId);
  const nextIndex = Math.max(0, currentIndex - 1);
  tripStore.activeTripId = tripStore.trips[nextIndex]?.id || tripStore.trips[0].id;
  state = activeTripState();
  state.editing = structuredClone(defaultState.editing);
  resetRuntimeState();
  persistTripStore();
  setBackupStatus("현재 여행을 삭제했습니다.");
  setActiveView(preferredViewForTrip());
  render();
}

function orderedPlansForDate(date) {
  return state.plans
    .filter((plan) => plan.date === date)
    .sort((a, b) => {
      const orderDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
      return orderDiff || (a.time || "99:99").localeCompare(b.time || "99:99");
    });
}

function nextPlanOrder(date) {
  const plans = orderedPlansForDate(date);
  const lastOrder = plans.length ? Math.max(...plans.map((plan) => Number(plan.order ?? 0))) : -1;
  return lastOrder + 1;
}

function movePlan(planId, direction) {
  const plan = state.plans.find((item) => item.id === planId);

  if (!plan) {
    return;
  }

  const plans = orderedPlansForDate(plan.date);
  const currentIndex = plans.findIndex((item) => item.id === planId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= plans.length) {
    return;
  }

  const currentOrder = Number(plans[currentIndex].order ?? currentIndex);
  const targetOrder = Number(plans[targetIndex].order ?? targetIndex);

  state.plans = state.plans.map((item) => {
    if (item.id === plans[currentIndex].id) {
      return { ...item, order: targetOrder };
    }

    if (item.id === plans[targetIndex].id) {
      return { ...item, order: currentOrder };
    }

    return item;
  });

  saveState();
  render();
}

function togglePlanComplete(planId) {
  state.plans = state.plans.map((plan) => (plan.id === planId ? { ...plan, completed: !plan.completed } : plan));
  saveState();
  render();
}

function toggleChecklistItem(itemId) {
  state.checklist = state.checklist.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
  saveState();
  render();
}

function startPlanEdit(planId) {
  const plan = state.plans.find((item) => item.id === planId);

  if (!plan) {
    return;
  }

  state.selectedDate = plan.date;
  state.editing.planId = plan.id;
  setActiveView("plan");
  render();

  elements.planTime.value = plan.time;
  elements.planPlace.value = plan.place;
  elements.planMemo.value = plan.memo;
  elements.planPlace.focus();
}

function startExpenseEdit(expenseId) {
  const expense = state.expenses.find((item) => item.id === expenseId);

  if (!expense) {
    return;
  }

  state.selectedDate = expense.date;
  state.editing.expenseId = expense.id;
  setActiveView("expenses");
  render();

  elements.expenseDate.value = expense.date;
  renderLinkedPlanOptions(expense.date, expense.planId);
  elements.expenseCategory.value = expense.category;
  setAmountInputValue(elements.expenseAmount, expense.amount);
  elements.isPersonalExpense.checked = Boolean(expense.isPersonal);
  renderExpenseTypeControls();
  elements.personalParticipant.value = expense.participant || "나";
  elements.paidByParticipant.value = expense.paidBy || expense.participant || "나";
  elements.expenseMemo.value = expense.memo;
  elements.expenseAmount.focus();
}

function setActiveView(viewName, options = {}) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  elements.views.forEach((view) => {
    view.classList.toggle("active", view.id === `${viewName}View`);
  });

  if (options.scroll) {
    requestAnimationFrame(() => scrollToViewSection(viewName));
  }
}

function scrollToViewSection(viewName) {
  const target =
    viewName === "report"
        ? document.querySelector("#reportTitle")
        : document.querySelector(`#${viewName}View`);

  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

[elements.budget, elements.commonFund, elements.exchangeRate, elements.prepaidAmount, elements.quickExpenseAmount, elements.expenseAmount].forEach(
  (inputElement) => {
    const syncAmountDisplay = () => {
      formatAmountInput(inputElement);
    };

    inputElement.addEventListener("input", syncAmountDisplay);
    inputElement.addEventListener("change", syncAmountDisplay);
    inputElement.addEventListener("blur", syncAmountDisplay);
    inputElement.addEventListener("keyup", syncAmountDisplay);
  },
);

function openTripSetup() {
  elements.appShell.classList.add("setup-open");
  setActiveView("settings");
  elements.tripName.focus();
  elements.tripName.scrollIntoView({ behavior: "smooth", block: "center" });
}

function startTripFromHero() {
  if (!hasTripBasics()) {
    openTripSetup();
    return;
  }

  saveState();
  addTripToStore();
  setBackupStatus("새 여행을 만들었습니다.");
  openTripSetup();
}

elements.heroStartButton.addEventListener("click", startTripFromHero);
elements.onboardingStartButton.addEventListener("click", openTripSetup);

elements.tripSelector.addEventListener("change", () => {
  switchTrip(elements.tripSelector.value);
});

elements.newTripButton.addEventListener("click", () => {
  saveState();
  addTripToStore();
  setBackupStatus("새 여행을 만들었습니다.");
});

elements.deleteTripButton.addEventListener("click", () => {
  const message =
    tripStore.trips.length > 1
      ? "현재 여행을 목록에서 삭제할까요? 이 여행의 일정과 경비가 함께 삭제됩니다."
      : "현재 여행 내용을 모두 비울까요?";

  if (!confirm(message)) {
    return;
  }

  deleteActiveTrip();
});

elements.tripForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (elements.startDate.value && elements.endDate.value && elements.startDate.value > elements.endDate.value) {
    alert("종료일은 시작일보다 빠를 수 없습니다.");
    return;
  }

  const oldDestination = state.trip.destination;
  const wasOnboarding = !hasTripBasics();
  state.trip = {
    name: elements.tripName.value.trim(),
    destination: elements.destination.value.trim(),
    startDate: elements.startDate.value,
    endDate: elements.endDate.value,
    budget: numberFromInput(elements.budget),
    commonFund: numberFromInput(elements.commonFund),
    currency: elements.currency.value,
    exchangeRate: elements.currency.value === "KRW" ? 1 : numberFromInput(elements.exchangeRate),
  };

  if (oldDestination !== state.trip.destination) {
    weatherState = { key: "", status: "idle", data: null, message: "" };
    heroImageState = { key: "", status: "idle", url: FALLBACK_HERO_IMAGE };
  }

  ensureSelectedDate();
  saveState();
  if (wasOnboarding && hasTripBasics()) {
    setActiveView(preferredViewForTrip());
  }
  render();
});

elements.planForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!state.selectedDate) {
    alert("여행 기간을 먼저 저장해 주세요.");
    return;
  }

  const nextPlan = {
    date: state.selectedDate,
    time: elements.planTime.value,
    place: elements.planPlace.value.trim(),
    memo: elements.planMemo.value.trim(),
  };

  if (state.editing.planId) {
    state.plans = state.plans.map((plan) => (plan.id === state.editing.planId ? { ...plan, ...nextPlan } : plan));
  } else {
    state.plans.push({
      id: uid("plan"),
      completed: false,
      order: nextPlanOrder(state.selectedDate),
      ...nextPlan,
    });
  }

  clearPlanForm();
  saveState();
  render();
});

elements.cancelPlanEditButton.addEventListener("click", () => {
  clearPlanForm();
  saveState();
  render();
});

elements.prepaidForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.prepaidCosts.push({
    id: uid("prepaid"),
    name: elements.prepaidName.value.trim(),
    category: elements.prepaidCategory.value,
    amount: numberFromInput(elements.prepaidAmount),
    currency: elements.prepaidCurrency.value || "KRW",
  });

  elements.prepaidForm.reset();
  elements.prepaidCurrency.value = "KRW";
  saveState();
  render();
});

elements.currency.addEventListener("change", () => {
  updateExchangeRateUi(elements.currency.value);
});

elements.destination.addEventListener("change", () => {
  const suggestedCurrency = suggestedCurrencyForDestination(elements.destination.value);

  if (!suggestedCurrency || elements.currency.value !== "KRW") {
    return;
  }

  elements.currency.value = suggestedCurrency;
  updateExchangeRateUi(suggestedCurrency);
});

elements.exchangeRate.addEventListener("input", () => {
  renderKrwPreview(elements.quickExpenseAmount, elements.quickExpenseKrwPreview);
  renderKrwPreview(elements.expenseAmount, elements.expenseKrwPreview);
});

elements.checklistForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = elements.checklistText.value.trim();

  if (!text) {
    return;
  }

  state.checklist.push({
    id: uid("check"),
    text,
    checked: false,
  });
  elements.checklistText.value = "";
  saveState();
  render();
});

elements.expenseDate.addEventListener("change", () => {
  renderLinkedPlanOptions(elements.expenseDate.value, "");
});

elements.isPersonalExpense.addEventListener("change", () => {
  renderExpenseTypeControls();
});

elements.expenseAmount.addEventListener("input", () => {
  renderExpenseTypeControls();
  renderKrwPreview(elements.expenseAmount, elements.expenseKrwPreview);
});

elements.participantForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = elements.participantName.value.trim();

  if (!name) {
    return;
  }

  if (state.participants.includes(name)) {
    alert("이미 추가된 참여자입니다.");
    return;
  }

  state.participants.push(name);
  elements.participantName.value = "";
  saveState();
  render();
});

elements.exportDataButton.addEventListener("click", () => {
  exportTripData();
});

elements.exportCompanionDataButton.addEventListener("click", () => {
  exportTripData("companion");
});

elements.exportViewHtmlButton.addEventListener("click", () => {
  exportTripViewHtml();
});

elements.importDataInput.addEventListener("change", () => {
  importTripData(elements.importDataInput.files?.[0]);
});

elements.cloudForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

elements.onboardingCloudForm?.addEventListener("submit", (event) => {
  event.preventDefault();
});

elements.cloudSignupButton.addEventListener("click", () => {
  signUpToCloud();
});

elements.onboardingCloudSignupButton?.addEventListener("click", () => {
  signUpToCloud();
});

elements.cloudLoginButton.addEventListener("click", () => {
  loginToCloud();
});

elements.onboardingCloudLoginButton?.addEventListener("click", () => {
  loginToCloud();
});

elements.cloudLogoutButton.addEventListener("click", () => {
  logoutFromCloud();
});

elements.onboardingCloudLogoutButton?.addEventListener("click", () => {
  logoutFromCloud();
});

elements.cloudUploadButton.addEventListener("click", () => {
  syncTripStoreToCloud();
});

elements.cloudDownloadButton.addEventListener("click", () => {
  downloadTripStoreFromCloud();
});

elements.onboardingCloudDownloadButton?.addEventListener("click", () => {
  downloadTripStoreFromCloud();
});

elements.quickCategoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedQuickCategory = button.dataset.quickCategory;
    renderQuickExpenseControls();
  });
});

elements.quickIsPersonalExpense.addEventListener("change", () => {
  renderQuickExpenseControls();
});

elements.quickExpenseAmount.addEventListener("input", () => {
  renderKrwPreview(elements.quickExpenseAmount, elements.quickExpenseKrwPreview);
});

elements.quickExpenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const expenseDate = getTodayTripDate();

  if (!expenseDate) {
    alert("여행 기간을 먼저 저장해 주세요.");
    return;
  }

  const amount = numberFromInput(elements.quickExpenseAmount);
  const isPersonal = elements.quickIsPersonalExpense.checked;
  const paidBy = isPersonal
    ? elements.quickPersonalParticipant.value || "나"
    : requiresPaidByForSharedAmount(amount)
      ? "나"
      : COMMON_FUND_LABEL;

  addExpense({
    date: expenseDate,
    planId: "",
    category: selectedQuickCategory,
    amount,
    isPersonal,
    participant: isPersonal ? elements.quickPersonalParticipant.value || "나" : "나",
    paidBy,
    memo: elements.quickExpenseMemo.value.trim(),
  });

  elements.quickExpenseStatus.textContent = `${formatDate(expenseDate)} · ${selectedQuickCategory} ${formatMoney(
    amount,
  )} 저장됨`;
  clearQuickExpenseForm();
  saveState();
  render();
});

elements.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!elements.expenseDate.value) {
    alert("여행 기간을 먼저 저장해 주세요.");
    return;
  }

  const amount = numberFromInput(elements.expenseAmount);
  const isPersonal = elements.isPersonalExpense.checked;
  const asksPaidBy = !isPersonal && requiresPaidByForSharedAmount(amount, state.editing.expenseId);
  const nextExpense = {
    date: elements.expenseDate.value,
    planId: elements.linkedPlan.value,
    category: elements.expenseCategory.value,
    amount,
    isPersonal,
    participant: isPersonal ? elements.personalParticipant.value || "나" : "나",
    paidBy: isPersonal ? elements.personalParticipant.value || "나" : asksPaidBy ? elements.paidByParticipant.value || "나" : COMMON_FUND_LABEL,
    memo: elements.expenseMemo.value.trim(),
  };

  if (state.editing.expenseId) {
    state.expenses = state.expenses.map((expense) =>
      expense.id === state.editing.expenseId ? { ...expense, ...nextExpense } : expense,
    );
  } else {
    addExpense(nextExpense);
  }

  clearExpenseForm();
  saveState();
  render();
});

elements.cancelExpenseEditButton.addEventListener("click", () => {
  clearExpenseForm();
  saveState();
  render();
});

elements.refreshWeatherButton.addEventListener("click", () => {
  maybeLoadWeather(true);
});

elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view, { scroll: true });
  });
});

document.addEventListener("click", (event) => {
  const planIdToEdit = event.target.dataset.editPlan;
  const planIdToDelete = event.target.dataset.deletePlan;
  const planIdToToggle = event.target.dataset.togglePlan;
  const planIdToMove = event.target.dataset.movePlan;
  const moveDirection = event.target.dataset.direction;
  const expenseIdToEdit = event.target.dataset.editExpense;
  const expenseIdToDelete = event.target.dataset.deleteExpense;
  const participantToDelete = event.target.dataset.deleteParticipant;
  const prepaidIdToDelete = event.target.dataset.deletePrepaid;
  const checklistIdToToggle = event.target.dataset.toggleChecklist;
  const checklistIdToDelete = event.target.dataset.deleteChecklist;

  if (planIdToMove) {
    movePlan(planIdToMove, moveDirection);
  }

  if (planIdToToggle) {
    togglePlanComplete(planIdToToggle);
  }

  if (checklistIdToToggle) {
    toggleChecklistItem(checklistIdToToggle);
  }

  if (planIdToEdit) {
    startPlanEdit(planIdToEdit);
  }

  if (expenseIdToEdit) {
    startExpenseEdit(expenseIdToEdit);
  }

  if (planIdToDelete) {
    if (!confirm("이 일정을 삭제할까요? 연결된 경비는 남지만 일정 연결은 해제됩니다.")) {
      return;
    }

    state.plans = state.plans.filter((plan) => plan.id !== planIdToDelete);
    state.expenses = state.expenses.map((expense) =>
      expense.planId === planIdToDelete ? { ...expense, planId: "" } : expense,
    );

    if (state.editing.planId === planIdToDelete) {
      clearPlanForm();
    }

    saveState();
    render();
  }

  if (expenseIdToDelete) {
    if (!confirm("이 경비를 삭제할까요?")) {
      return;
    }

    state.expenses = state.expenses.filter((expense) => expense.id !== expenseIdToDelete);

    if (state.editing.expenseId === expenseIdToDelete) {
      clearExpenseForm();
    }

    saveState();
    render();
  }

  if (prepaidIdToDelete) {
    if (!confirm("이 선결제 경비를 삭제할까요?")) {
      return;
    }

    state.prepaidCosts = state.prepaidCosts.filter((item) => item.id !== prepaidIdToDelete);
    saveState();
    render();
  }

  if (checklistIdToDelete) {
    state.checklist = state.checklist.filter((item) => item.id !== checklistIdToDelete);
    saveState();
    render();
  }

  if (participantToDelete) {
    if (!confirm(`${participantToDelete} 참여자를 삭제할까요? 기존 개인 경비는 '나'로 옮겨집니다.`)) {
      return;
    }

    state.participants = state.participants.filter((participant) => participant !== participantToDelete);
    state.expenses = state.expenses.map((expense) =>
      expense.participant === participantToDelete || expense.paidBy === participantToDelete
        ? {
            ...expense,
            participant: expense.participant === participantToDelete ? "나" : expense.participant,
            paidBy: expense.paidBy === participantToDelete ? "나" : expense.paidBy,
          }
        : expense,
    );
    saveState();
    render();
  }
});

elements.resetButton.addEventListener("click", () => {
  if (!confirm("현재 여행 내용을 모두 비울까요? 다른 여행 목록은 그대로 남습니다.")) {
    return;
  }

  state = structuredClone(defaultState);
  resetRuntimeState();
  clearQuickExpenseForm();
  saveState();
  setBackupStatus("현재 여행을 비웠습니다.");
  setActiveView(preferredViewForTrip());
  render();
});

initCloudSync();
setActiveView(preferredViewForTrip());
render();
