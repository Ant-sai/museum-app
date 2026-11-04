import { ref, watch } from "vue";

const KEY = "savedExhibitions";

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? []);
  } catch {
    return new Set();
  }
}

const saved = ref(load());

watch(saved, (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...items]));
  } catch {
    // Saved exhibitions remain available for this session if storage is unavailable.
  }
}, { deep: true });

export function useSavedExhibitions() {
  const isSaved = (exhibitionId) => saved.value.has(exhibitionId);
  const toggleSaved = (exhibitionId) => {
    if (saved.value.has(exhibitionId)) saved.value.delete(exhibitionId);
    else saved.value.add(exhibitionId);
  };
  return { saved, isSaved, toggleSaved };
}
