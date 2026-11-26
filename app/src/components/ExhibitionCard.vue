<script setup>
import { computed, ref } from "vue";
import { formatCardRange } from "../dates.js";
import { useSavedExhibitions } from "../savedExhibitions.js";

const props = defineProps({
  exhibition: { type: Object, required: true },
  galleryName: { type: String, required: true },
});

const { isSaved, toggleSaved } = useSavedExhibitions();
const saved = computed(() => isSaved(props.exhibition.url));
const dates = computed(() => formatCardRange(props.exhibition.startDate, props.exhibition.endDate));
const imageFailed = ref(false);
</script>

<template>
  <article class="card">
    <div class="card__image">
      <img
        v-if="exhibition.image && !imageFailed"
        :src="exhibition.image"
        :alt="exhibition.name"
        loading="lazy"
        decoding="async"
        @error="imageFailed = true"
      />
      <div v-else class="card__image-fallback label" role="img" :aria-label="`${exhibition.name} image unavailable`">
        {{ galleryName }}
      </div>
      <button
        class="card__save"
        type="button"
        :aria-pressed="saved"
        :aria-label="`${saved ? 'Remove' : 'Save'} ${exhibition.name} ${saved ? 'from' : 'to'} saved exhibitions`"
        @click="toggleSaved(exhibition.url)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3.75h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1z" />
          <path v-if="saved" d="m9 10 2.2 2.2L15.5 8" />
        </svg>
      </button>
    </div>
    <div class="card__body">
      <p class="card__gallery-line label">
        <span class="card__gallery">{{ galleryName }}</span>
        <span v-if="exhibition.locations?.length" class="card__location">
          · {{ exhibition.locations.join(", ") }}
        </span>
      </p>
      <h2 class="card__name">
        <a class="card__link" :href="exhibition.url" target="_blank" rel="noopener">{{ exhibition.name }}</a>
      </h2>
      <p v-if="exhibition.nameKo" class="card__name-ko" lang="ko">{{ exhibition.nameKo }}</p>
      <div class="card__footer">
        <p class="card__dates label">{{ dates }}</p>
        <a class="card__arrow" :href="exhibition.url" target="_blank" rel="noopener" :aria-label="`Visit ${exhibition.name} official page`">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18 18 6M7 6h11v11" />
          </svg>
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  padding: 32px 0 36px;
}
.card + .card {
  border-top: var(--rule);
}
.card__image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.12;
  border-radius: var(--radius);
  background: var(--color-surface);
}
.card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card__image-fallback {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  padding: 16px;
  text-transform: uppercase;
}
.card__save {
  position: absolute;
  z-index: 1;
  top: 12px;
  right: 12px;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  transition: color var(--duration) var(--ease);
}
.card__save svg {
  width: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.card__save[aria-pressed="true"] {
  color: var(--color-accent);
}
.card__body {
  padding-top: 20px;
}
.card__gallery-line {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 6px;
  min-width: 0;
  margin: 0 0 12px;
  font-size: 11px;
  text-transform: uppercase;
}
.card__gallery {
  flex: 0 0 auto;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card__location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card__name {
  margin: 0;
  font-size: clamp(20px, 5.4vw, 24px);
  font-weight: var(--weight-medium);
  line-height: 1.35;
  letter-spacing: -0.005em;
}
.card__link {
  color: inherit;
  text-decoration: none;
}
.card__link::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  content: "";
}
.card__link:focus-visible {
  outline: none;
}
.card:has(.card__link:focus-visible)::after {
  position: absolute;
  z-index: 2;
  inset: 8px -8px;
  border: 1px solid var(--color-text);
  content: "";
  pointer-events: none;
}
.card__name-ko {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
}
.card__footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.card__dates {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.card__arrow {
  display: grid;
  width: 36px;
  height: 36px;
  margin-right: -8px;
  place-items: center;
  color: var(--color-text);
}
.card__arrow svg {
  width: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: square;
}
</style>
