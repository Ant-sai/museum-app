import { ref, watch } from "vue";

// Favorite galleries live on the device: gallery ids stored in localStorage.
const KEY = "favoriteGalleries";

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? []);
  } catch {
    return new Set(); // storage blocked (private mode…) or corrupted
  }
}

const favorites = ref(load());

watch(favorites, (set) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // Not persisted, but favorites still work for this session.
  }
}, { deep: true });

export function useFavorites() {
  const isFavorite = (galleryId) => favorites.value.has(galleryId);
  const toggle = (galleryId) => {
    if (favorites.value.has(galleryId)) favorites.value.delete(galleryId);
    else favorites.value.add(galleryId);
  };
  return { favorites, isFavorite, toggle };
}
