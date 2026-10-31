<script setup>
import { computed } from "vue";
import { countdown, formatRange } from "../dates.js";
import { useFavorites } from "../favorites.js";
import HeartIcon from "./HeartIcon.vue";

const props = defineProps({
  exhibition: { type: Object, required: true },
  galleryName: { type: String, required: true },
});

const { isFavorite, toggle } = useFavorites();
const favorite = computed(() => isFavorite(props.exhibition.gallery));
const dates = computed(() => formatRange(props.exhibition.startDate, props.exhibition.endDate));
const hint = computed(() => countdown(props.exhibition));
</script>

<template>
  <article class="card">
    <div class="card__top">
      <button
        class="card__gallery"
        :class="{ 'is-favorite': favorite }"
        :aria-pressed="favorite"
        :aria-label="`${favorite ? 'Remove' : 'Add'} ${galleryName} ${favorite ? 'from' : 'to'} favorites`"
        @click="toggle(exhibition.gallery)"
      >
        <HeartIcon :filled="favorite" class="card__heart" />
        {{ galleryName }}
      </button>
      <span v-if="hint" class="card__hint">{{ hint }}</span>
    </div>
    <h2 class="card__name">
      <!-- The link covers the whole card (see ::after), the heart button sits above it. -->
      <a class="card__link" :href="exhibition.url" target="_blank" rel="noopener">{{ exhibition.name }}</a>
    </h2>
    <p v-if="exhibition.nameKo" class="card__name-ko" lang="ko">{{ exhibition.nameKo }}</p>
    <p class="card__meta">
      <span>{{ dates }}</span>
      <span v-if="exhibition.locations?.length" class="card__locations">
        · {{ exhibition.locations.join(", ") }}
      </span>
    </p>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  padding: 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: transform 0.12s ease;
}
.card:has(.card__link:active) {
  transform: scale(0.985);
}
.card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.card__gallery {
  position: relative;
  z-index: 1; /* above the card-wide link */
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: -6px -8px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.card__heart {
  font-size: 16px;
  transition: transform 0.15s ease;
}
.card__gallery:active .card__heart {
  transform: scale(1.25);
}
.card__gallery.is-favorite {
  color: var(--text);
}
.card__gallery.is-favorite .card__heart {
  color: var(--heart);
}
.card__hint {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
}
.card__name {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 650;
}
.card__link {
  color: inherit;
  text-decoration: none;
}
.card__link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.card__link:focus-visible {
  outline: none;
}
.card:has(.card__link:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.card__name-ko {
  margin: 2px 0 0;
  font-size: 15px;
  color: var(--muted);
}
.card__meta {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--muted);
}
</style>
