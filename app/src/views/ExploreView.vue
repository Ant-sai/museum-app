<script setup>
import { computed, ref } from "vue";
import ExhibitionCard from "../components/ExhibitionCard.vue";
import { statusOf, todaySeoul } from "../dates.js";
import { useSavedExhibitions } from "../savedExhibitions.js";

const props = defineProps({
  data: { type: Object, default: null },
  error: { type: String, default: null },
});
defineEmits(["retry"]);

const TABS = [
  { id: "current", label: "Current" },
  { id: "upcoming", label: "Upcoming" },
];
const SAVED = "saved"; // special value of the gallery filter

const tab = ref("current");
const gallery = ref(null); // null = all galleries; otherwise a saved or gallery filter
const searchOpen = ref(false);
const query = ref("");
const { saved, isSaved } = useSavedExhibitions();

const galleryNames = computed(() =>
  Object.fromEntries((props.data?.galleries ?? []).map((g) => [g.id, g.name])),
);

const matchesGallery = (e) => {
  if (gallery.value === SAVED) return isSaved(e.url);
  return !gallery.value || e.gallery === gallery.value;
};

const visible = computed(() => {
  const today = todaySeoul();
  const search = query.value.trim().toLocaleLowerCase();
  return (props.data?.exhibitions ?? []).filter((e) => {
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
  props.data?.generatedAt
    ? new Date(props.data.generatedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })
    : null,
);
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header__brand-row">
        <h1 class="header__title caps">The Moment of Exhibition</h1>
        <button
          class="icon-btn"
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

      <p v-if="tab === 'upcoming'" class="eyebrow label">The next chapter</p>
      <h2 class="intro__title caps" :class="{ 'intro__title--current': tab === 'current' }">
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
          class="tabs__tab caps"
          :class="{ 'is-active': tab === t.id }"
          role="tab"
          :aria-selected="tab === t.id"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>
      <div v-if="data" class="chips" aria-label="Filter by gallery">
        <button class="chip" :class="{ 'is-active': !gallery }" :aria-pressed="!gallery" @click="gallery = null">
          All galleries
        </button>
        <button
          class="chip"
          :class="{ 'is-active': gallery === SAVED }"
          :aria-pressed="gallery === SAVED"
          @click="gallery = gallery === SAVED ? null : SAVED"
        >
          <svg class="chip__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.75h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1z" />
          </svg>
          Saved
        </button>
        <button
          v-for="g in data.galleries"
          :key="g.id"
          class="chip"
          :class="{ 'is-active': gallery === g.id }"
          :aria-pressed="gallery === g.id"
          @click="gallery = gallery === g.id ? null : g.id"
        >
          {{ g.name }}
        </button>
      </div>
    </header>

    <main class="list" aria-live="polite">
      <div v-if="error" class="state">
        <p>{{ error }}</p>
        <button class="btn" type="button" @click="$emit('retry')">Try again</button>
      </div>
      <p v-else-if="!data" class="state">Loading…</p>
      <p v-else-if="!sorted.length" class="state">{{ emptyMessage }}</p>
      <ExhibitionCard
        v-for="e in sorted"
        :key="e.url + e.name"
        :exhibition="e"
        :gallery-name="galleryNames[e.gallery] ?? e.gallery"
      />
      <p v-if="updatedAt" class="updated label">Updated {{ updatedAt }}</p>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
}
.header {
  padding: calc(env(safe-area-inset-top) + 32px) 24px 0;
}
.header__brand-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.header__title {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.18em;
}
.icon-btn {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
}
.icon-btn svg {
  width: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
}
.search-field {
  display: block;
  margin-top: 20px;
}
.search-field input {
  width: 100%;
  padding: 12px 0;
  border: 0;
  border-bottom: 1px solid var(--color-text);
  border-radius: 0;
  background: transparent;
  outline: none;
}
.search-field input::placeholder {
  color: var(--color-text-subtle);
}
.eyebrow {
  margin: 56px 0 12px;
  text-transform: uppercase;
}
.intro__title {
  max-width: 470px;
  margin: 0;
  font-size: clamp(20px, 5.4vw, 26px);
  line-height: 1.4;
  letter-spacing: 0.12em;
}
.intro__title--current {
  margin-top: 56px;
}
.intro__copy {
  max-width: 420px;
  margin: 16px 0 48px;
  color: var(--color-text-muted);
  font-size: 15px;
}
.tabs {
  display: flex;
  gap: 28px;
  border-bottom: var(--rule);
}
.tabs__tab {
  position: relative;
  padding: 12px 0 14px;
  border: 0;
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 11px;
  text-align: left;
  transition: color var(--duration) var(--ease);
}
.tabs__tab.is-active {
  color: var(--color-text);
}
.tabs__tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: var(--color-brass);
  content: "";
}
.chips {
  display: flex;
  gap: 8px;
  margin: 20px -24px 0;
  padding: 0 24px 2px;
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
  gap: 6px;
  padding: 7px 10px;
  border: var(--rule);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: var(--weight-medium);
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
  transition: color var(--duration) var(--ease), border-color var(--duration) var(--ease);
}
.chip__icon {
  width: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
}
.chip.is-active {
  border-color: var(--color-text);
  color: var(--color-text);
}
.list {
  display: grid;
  padding: 16px 24px 40px;
}
.state {
  margin: 56px 0;
  color: var(--color-text-muted);
}
.state p {
  margin: 0 0 20px;
}
.updated {
  margin: 32px 0 0;
}
@media (min-width: 700px) {
  .header {
    padding-right: 32px;
    padding-left: 32px;
  }
  .chips {
    margin-right: -32px;
    margin-left: -32px;
    padding-right: 32px;
    padding-left: 32px;
  }
  .list {
    padding-right: 32px;
    padding-left: 32px;
  }
}
</style>
