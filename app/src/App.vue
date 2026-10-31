<script setup>
import { computed, onMounted, ref } from "vue";
import ExhibitionCard from "./components/ExhibitionCard.vue";
import { statusOf, todaySeoul } from "./dates.js";

const TABS = [
  { id: "current", label: "En cours" },
  { id: "upcoming", label: "À venir" },
];

const data = ref(null);
const error = ref(null);
const tab = ref("current");
const gallery = ref(null); // null = all galleries

async function load() {
  error.value = null;
  try {
    const res = await fetch("./exhibitions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data.value = await res.json();
  } catch (err) {
    error.value = "Impossible de charger les expositions.";
    console.error(err);
  }
}
onMounted(load);

const galleryNames = computed(() =>
  Object.fromEntries((data.value?.galleries ?? []).map((g) => [g.id, g.name])),
);

const visible = computed(() => {
  const today = todaySeoul();
  return (data.value?.exhibitions ?? []).filter((e) => {
    if (gallery.value && e.gallery !== gallery.value) return false;
    return statusOf(e, today) === tab.value;
  });
});

// Current exhibitions closing soonest first; upcoming ones opening soonest first.
const sorted = computed(() => {
  const key = tab.value === "current" ? "endDate" : "startDate";
  return [...visible.value].sort((a, b) => (a[key] ?? "9999").localeCompare(b[key] ?? "9999"));
});

const updatedAt = computed(() =>
  data.value?.generatedAt
    ? new Date(data.value.generatedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
    : null,
);
</script>

<template>
  <header class="header">
    <h1 class="header__title">Expos à Séoul</h1>
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
      <button class="chip" :class="{ 'is-active': !gallery }" @click="gallery = null">Toutes</button>
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

  <main class="list">
    <p v-if="error" class="state">
      {{ error }}
      <button class="retry" @click="load">Réessayer</button>
    </p>
    <p v-else-if="!data" class="state">Chargement…</p>
    <p v-else-if="!sorted.length" class="state">
      Aucune exposition {{ tab === "current" ? "en cours" : "à venir" }}
      {{ gallery ? `chez ${galleryNames[gallery]}` : "" }}.
    </p>
    <ExhibitionCard
      v-for="e in sorted"
      :key="e.url + e.name"
      :exhibition="e"
      :gallery-name="galleryNames[e.gallery] ?? e.gallery"
    />
    <p v-if="updatedAt" class="updated">Mis à jour le {{ updatedAt }}</p>
  </main>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1;
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
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 14px;
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
