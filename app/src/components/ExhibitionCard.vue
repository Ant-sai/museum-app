<script setup>
import { computed } from "vue";
import { countdown, formatRange } from "../dates.js";

const props = defineProps({
  exhibition: { type: Object, required: true },
  galleryName: { type: String, required: true },
});

const dates = computed(() => formatRange(props.exhibition.startDate, props.exhibition.endDate));
const hint = computed(() => countdown(props.exhibition));
</script>

<template>
  <a class="card" :href="exhibition.url" target="_blank" rel="noopener">
    <div class="card__top">
      <span class="card__gallery">{{ galleryName }}</span>
      <span v-if="hint" class="card__hint">{{ hint }}</span>
    </div>
    <h2 class="card__name">{{ exhibition.name }}</h2>
    <p v-if="exhibition.nameKo" class="card__name-ko" lang="ko">{{ exhibition.nameKo }}</p>
    <p class="card__meta">
      <span>{{ dates }}</span>
      <span v-if="exhibition.locations?.length" class="card__locations">
        · {{ exhibition.locations.join(", ") }}
      </span>
    </p>
  </a>
</template>

<style scoped>
.card {
  display: block;
  padding: 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  transition: transform 0.12s ease;
}
.card:active {
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
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
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
