<script setup>
import { computed, onMounted, ref } from "vue";
import ExhibitionCard from "./components/ExhibitionCard.vue";
import HeartIcon from "./components/HeartIcon.vue";
import { statusOf, todaySeoul } from "./dates.js";
import { useFavorites } from "./favorites.js";

const TABS = [
  { id: "current", label: "On view" },
  { id: "upcoming", label: "Upcoming" },
];
const FAVORITES = "favorites"; // special value of the gallery filter

const data = ref(null);
const error = ref(null);
const tab = ref("current");
const gallery = ref(null); // null = all galleries, FAVORITES, or a gallery id
const { favorites, isFavorite } = useFavorites();

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
  if (gallery.value === FAVORITES) return isFavorite(e.gallery);
  return !gallery.value || e.gallery === gallery.value;
};

const visible = computed(() => {
  const today = todaySeoul();
  return (data.value?.exhibitions ?? []).filter((e) => matchesGallery(e) && statusOf(e, today) === tab.value);
});

// On view: closing soonest first; upcoming: opening soonest first.
const sorted = computed(() => {
  const key = tab.value === "current" ? "endDate" : "startDate";
  return [...visible.value].sort((a, b) => (a[key] ?? "9999").localeCompare(b[key] ?? "9999"));
});

const emptyMessage = computed(() => {
  if (gallery.value === FAVORITES && !favorites.value.size) {
    return "No favorite galleries yet. Tap the ♥ next to a gallery name to add it.";
  }
  const what = tab.value === "current" ? "on view" : "upcoming";
  if (gallery.value === FAVORITES) return `No exhibitions ${what} at your favorite galleries.`;
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
  <header class="header">
    <h1 class="header__title">Seoul Exhibitions</h1>
    <nav class="tabs" role="tablist">
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
    <div v-if="data" class="chips">
      <button class="chip" :class="{ 'is-active': !gallery }" @click="gallery = null">All</button>
      <button
        class="chip chip--favorites"
        :class="{ 'is-active': gallery === FAVORITES }"
        @click="gallery = gallery === FAVORITES ? null : FAVORITES"
      >
        <HeartIcon filled class="chip__heart" />
        Favorites
      </button>
      <button
        v-for="g in data.galleries"
        :key="g.id"
        class="chip"
        :class="{ 'is-active': gallery === g.id }"
        @click="gallery = gallery === g.id ? null : g.id"
      >
        <HeartIcon v-if="isFavorite(g.id)" filled class="chip__heart" />
        {{ g.name }}
      </button>
    </div>
  </header>

  <main class="list">
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
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: calc(env(safe-area-inset-top) + 16px) 16px 12px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.header__title {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 3px;
  border-radius: 10px;
  background: var(--track);
}
.tabs__tab {
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 600;
}
.tabs__tab.is-active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
}
.chips {
  display: flex;
  gap: 8px;
  margin: 12px -16px 0;
  padding: 0 16px;
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
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 14px;
}
.chip__heart {
  color: var(--heart);
  font-size: 13px;
}
.chip.is-active {
  background: var(--text);
  border-color: var(--text);
  color: var(--bg);
}
.list {
  display: grid;
  gap: 12px;
  padding: 16px 16px calc(env(safe-area-inset-bottom) + 24px);
  max-width: 640px;
  margin: 0 auto;
}
.state {
  margin: 48px 0;
  text-align: center;
  color: var(--muted);
}
.retry {
  display: block;
  margin: 12px auto 0;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.updated {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
