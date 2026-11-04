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
      <div v-else class="card__image-fallback" role="img" :aria-label="`${exhibition.name} image unavailable`">
        <span>{{ galleryName }}</span>
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
        </svg>
      </button>
    </div>
    <div class="card__body">
      <div class="card__gallery-line">
        <span class="card__gallery">{{ galleryName }}</span>
        <span v-if="exhibition.locations?.length" class="card__location">
          · {{ exhibition.locations.join(", ") }}
        </span>
      </div>
      <h2 class="card__name">
        <a class="card__link" :href="exhibition.url" target="_blank" rel="noopener">{{ exhibition.name }}</a>
      </h2>
      <p v-if="exhibition.nameKo" class="card__name-ko" lang="ko">{{ exhibition.nameKo }}</p>
      <div class="card__footer">
        <p class="card__dates">{{ dates }}</p>
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
  overflow: hidden;
}
.card__image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.12;
  border-radius: 5px;
  background: var(--track);
}
.card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card__image-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background:
    radial-gradient(ellipse at 50% 40%, rgb(255 255 255 / 0.46), transparent 57%),
    linear-gradient(140deg, #ded8cb, #bdb5a5);
  color: #6f6a60;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
}
.card__save {
  position: absolute;
  z-index: 1;
  top: 14px;
  right: 14px;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
}
.card__save svg {
  width: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
}
.card__save[aria-pressed="true"] svg {
  fill: var(--accent);
  stroke: var(--accent);
}
.card__body {
  padding: 16px 0 18px;
}
.card__gallery-line {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 13px;
}
.card__gallery {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  max-width: 55%;
  padding: 0;
  overflow: hidden;
  color: inherit;
  font: inherit;
  font-weight: 600;
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
  font-family: Georgia, "Times New Roman", "Apple SD Gothic Neo", serif;
  font-size: clamp(24px, 6vw, 32px);
  line-height: 1.28;
  font-weight: 500;
  letter-spacing: -0.035em;
}
.card__link {
  color: inherit;
  text-decoration: none;
}
.card__link::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  border-radius: inherit;
  content: "";
}
.card__link:focus-visible {
  outline: none;
}
.card:has(.card__link:focus-visible)::after {
  position: absolute;
  z-index: 2;
  inset: -3px;
  border: 2px solid var(--accent);
  border-radius: 8px;
  content: "";
  pointer-events: none;
}
.card__name-ko {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 16px;
}
.card__footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.card__dates {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.card__arrow {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: var(--text);
}
.card__arrow svg {
  width: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: square;
  stroke-linejoin: miter;
}
.card__arrow:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
