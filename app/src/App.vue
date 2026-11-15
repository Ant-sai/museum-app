<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import BottomNav from "./components/BottomNav.vue";
import ExploreView from "./views/ExploreView.vue";
import CalendarView from "./views/CalendarView.vue";
import HistoryView from "./views/HistoryView.vue";

const VIEWS = { explore: ExploreView, calendar: CalendarView, history: HistoryView };

// The current view lives in the URL hash (#calendar…) so the back button and reloads work.
const viewFromHash = () => (location.hash.slice(1) in VIEWS ? location.hash.slice(1) : "explore");
const view = ref(viewFromHash());
const onHashChange = () => {
  view.value = viewFromHash();
  window.scrollTo(0, 0);
};
onMounted(() => window.addEventListener("hashchange", onHashChange));
onUnmounted(() => window.removeEventListener("hashchange", onHashChange));

function navigate(id) {
  if (id === view.value) window.scrollTo({ top: 0, behavior: "smooth" });
  else location.hash = id === "explore" ? "" : id;
}

const data = ref(null);
const error = ref(null);

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
</script>

<template>
  <div class="app">
    <!-- KeepAlive keeps each view's filters and selection when switching tabs. -->
    <KeepAlive>
      <component :is="VIEWS[view]" :data="data" :error="error" @retry="load" />
    </KeepAlive>
  </div>
  <BottomNav :current="view" @navigate="navigate" />
</template>

<style scoped>
.app {
  min-height: 100vh;
  /* Leave room for the fixed bottom navigation. */
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
  background: var(--bg);
}
</style>
