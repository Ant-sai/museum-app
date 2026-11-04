<script setup>
import { computed, onMounted, ref } from "vue";
import ExhibitionCard from "./components/ExhibitionCard.vue";
import { statusOf, todaySeoul } from "./dates.js";
import { useSavedExhibitions } from "./savedExhibitions.js";

const TABS = [
  { id: "current", label: "Current Exhibitions" },
  { id: "upcoming", label: "Upcoming Exhibitions" },
];
const SAVED = "saved"; // special value of the gallery filter

const data = ref(null);
const error = ref(null);
const tab = ref("current");
const gallery = ref(null); // null = all galleries; otherwise a saved or gallery filter
const searchOpen = ref(false);
const query = ref("");
const { saved, isSaved } = useSavedExhibitions();

async function load() {
  error.value = null;
  try {
    const res = await fetch("./exhibitions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data.value = await res.json();
  } catch (err) {
    error.value = "Couldn't load exhibitions.";
    console.error(err);
  }
}
onMounted(load);

const galleryNames = computed(() =>
  Object.fromEntries((data.value?.galleries ?? []).map((g) => [g.id, g.name])),
);

const matchesGallery = (e) => {
  if (gallery.value === SAVED) return isSaved(e.url);
  return !gallery.value || e.gallery === gallery.value;
};

const visible = computed(() => {
  const today = todaySeoul();
  const search = query.value.trim().toLocaleLowerCase();
  return (data.value?.exhibitions ?? []).filter((e) => {
    if (!matchesGallery(e) || statusOf(e, today) !== tab.value) return false;
    if (!search) return true;
    const text = [e.name, e.nameKo, galleryNames.value[e.gallery], ...(e.locations ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return text.includes(search);
  });
});

// On view: closing soonest first; upcoming: opening soonest first.
const sorted = computed(() => {
  const key = tab.value === "current" ? "endDate" : "startDate";
  return [...visible.value].sort((a, b) => (a[key] ?? "9999").localeCompare(b[key] ?? "9999"));
});

const emptyMessage = computed(() => {
  if (query.value.trim()) return `No exhibitions match “${query.value.trim()}”.`;
  if (gallery.value === SAVED && !saved.value.size) {
    return "No saved exhibitions yet. Tap the bookmark on an exhibition to save it.";
  }
  const what = tab.value === "current" ? "on view" : "upcoming";
  if (gallery.value === SAVED) return `No saved exhibitions ${what}.`;
  if (gallery.value) return `No exhibitions ${what} at ${galleryNames.value[gallery.value]}.`;
  return `No exhibitions ${what}.`;
});

const updatedAt = computed(() =>
  data.value?.generatedAt
    ? new Date(data.value.generatedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })
    : null,
);
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header__brand-row">
        <h1 class="header__title">The Moment of Exhibition</h1>
        <button
          class="search-toggle"
          type="button"
          :aria-label="searchOpen ? 'Close search' : 'Search exhibitions'"
          :aria-expanded="searchOpen"
          @click="searchOpen = !searchOpen; query = ''"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
        </button>
      </div>
      <label v-if="searchOpen" class="search-field">
        <span class="sr-only">Search exhibitions</span>
        <input v-model="query" type="search" placeholder="Search exhibitions or galleries" autofocus />
      </label>

      <p v-if="tab === 'upcoming'" class="eyebrow">THE NEXT CHAPTER</p>
      <h2 class="intro__title" :class="{ 'intro__title--current': tab === 'current' }">
        {{ tab === "current" ? "What moments will I encounter today?" : "Soon, a new scene unfolds." }}
      </h2>
      <p class="intro__copy">
        {{
          tab === "current"
            ? "Discover an exhibition that stays with you long after."
            : "Save upcoming exhibitions and check their start dates."
        }}
      </p>

      <nav class="tabs" role="tablist" aria-label="Exhibition status">
        <button
          v-for="t in TABS"
          :key="t.id"
          class="tabs__tab"
          :class="{ 'is-active': tab === t.id }"
          role="tab"
          :aria-selected="tab === t.id"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>
      <div v-if="data" class="chips" aria-label="Filter by gallery">
        <button class="chip" :class="{ 'is-active': !gallery }" @click="gallery = null">All galleries</button>
        <button
          class="chip"
          :class="{ 'is-active': gallery === SAVED }"
          @click="gallery = gallery === SAVED ? null : SAVED"
        >
          <svg class="chip__save" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.75h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1z" />
          </svg>
          Saved
        </button>
        <button
          v-for="g in data.galleries"
          :key="g.id"
          class="chip"
          :class="{ 'is-active': gallery === g.id }"
          @click="gallery = gallery === g.id ? null : g.id"
        >
          {{ g.name }}
        </button>
      </div>
    </header>

    <main class="list" aria-live="polite">
      <p v-if="error" class="state">
        {{ error }}
        <button class="retry" @click="load">Try again</button>
      </p>
      <p v-else-if="!data" class="state">Loading…</p>
      <p v-else-if="!sorted.length" class="state">{{ emptyMessage }}</p>
      <ExhibitionCard
        v-for="e in sorted"
        :key="e.url + e.name"
        :exhibition="e"
        :gallery-name="galleryNames[e.gallery] ?? e.gallery"
      />
      <p v-if="updatedAt" class="updated">Updated {{ updatedAt }}</p>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--bg);
}
.header {
  padding: calc(env(safe-area-inset-top) + 24px) 20px 0;
}
.header__brand-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.header__title {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 500;
  letter-spacing: -0.035em;
}
.search-toggle {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text);
}
.search-toggle svg {
  width: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}
.search-field {
  display: block;
  margin-top: 16px;
}
.search-field input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.eyebrow {
  margin: 30px 0 10px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}
.intro__title {
  max-width: 470px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(32px, 8vw, 42px);
  font-weight: 400;
  line-height: 1.22;
  letter-spacing: -0.035em;
}
.intro__title--current {
  margin-top: 30px;
}
.intro__copy {
  margin: 14px 0 30px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.55;
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--border);
}
.tabs__tab {
  position: relative;
  padding: 12px 0 14px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  text-align: left;
}
.tabs__tab.is-active {
  color: var(--accent);
  font-weight: 700;
}
.tabs__tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--accent);
  content: "";
}
.chips {
  display: flex;
  gap: 7px;
  margin: 12px -20px 0;
  padding: 0 20px 3px;
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 12px;
}
.chip__save {
  width: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
}
.chip.is-active {
  border-color: var(--accent);
  color: var(--accent);
}
.list {
  display: grid;
  gap: 26px;
  padding: 24px 20px calc(env(safe-area-inset-bottom) + 32px);
}
.state {
  margin: 64px 0;
  text-align: center;
  color: var(--muted);
}
.retry {
  display: block;
  margin: 12px auto 0;
  padding: 9px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.updated {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (min-width: 700px) {
  .header {
    padding-right: 28px;
    padding-left: 28px;
  }
  .chips {
    margin-right: -28px;
    margin-left: -28px;
    padding-right: 28px;
    padding-left: 28px;
  }
  .list {
    padding-right: 28px;
    padding-left: 28px;
  }
}
</style>
