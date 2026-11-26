<script setup>
import { computed, ref } from "vue";
import { formatCardRange, todaySeoul } from "../dates.js";

const props = defineProps({
  data: { type: Object, default: null },
  error: { type: String, default: null },
});
defineEmits(["retry"]);

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const today = todaySeoul();
const selected = ref(today);
const month = ref({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });

function shiftMonth(delta) {
  const d = new Date(Date.UTC(month.value.year, month.value.month - 1 + delta, 1));
  month.value = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

const monthLabel = computed(() =>
  new Date(Date.UTC(month.value.year, month.value.month - 1, 1))
    .toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
);

const exhibitions = computed(() => (props.data?.exhibitions ?? []).filter((e) => e.startDate && e.endDate));
const galleryNames = computed(() =>
  Object.fromEntries((props.data?.galleries ?? []).map((g) => [g.id, g.name])),
);

// date → { opening, closing } counts, to draw the dots under each day.
const events = computed(() => {
  const map = {};
  for (const e of exhibitions.value) {
    (map[e.startDate] ??= { opening: 0, closing: 0 }).opening++;
    (map[e.endDate] ??= { opening: 0, closing: 0 }).closing++;
  }
  return map;
});

// Leading blanks for the weekday offset, then one cell per day of the month.
const cells = computed(() => {
  const { year, month: m } = month.value;
  const offset = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return [
    ...Array.from({ length: offset }, (_, i) => ({ key: `blank-${i}` })),
    ...Array.from({ length }, (_, i) => {
      const iso = isoOf(year, m, i + 1);
      return { key: iso, iso, day: i + 1, ...events.value[iso] };
    }),
  ];
});

const selectedLabel = computed(() =>
  new Date(`${selected.value}T00:00:00Z`)
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
);

// Exhibitions on view on the selected day: openings first, then closings, then by end date.
const onView = computed(() => {
  const day = selected.value;
  const rank = (e) => (e.startDate === day ? 0 : e.endDate === day ? 1 : 2);
  return exhibitions.value
    .filter((e) => e.startDate <= day && day <= e.endDate)
    .sort((a, b) => rank(a) - rank(b) || a.endDate.localeCompare(b.endDate));
});

function badge(e) {
  if (e.startDate === selected.value) return "Opens today";
  if (e.endDate === selected.value) return "Last day";
  return null;
}

function select(iso) {
  selected.value = iso;
}
function goToday() {
  selected.value = today;
  month.value = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title caps">Calendar</h1>
      <p class="copy">Openings and closings by day.</p>
    </header>

    <section class="calendar" aria-label="Exhibition calendar">
      <div class="calendar__head">
        <button class="nav-btn" type="button" aria-label="Previous month" @click="shiftMonth(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h2 class="calendar__month caps">{{ monthLabel }}</h2>
        <button class="nav-btn" type="button" aria-label="Next month" @click="shiftMonth(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="calendar__grid" role="grid">
        <span v-for="(w, i) in WEEKDAYS" :key="`w${i}`" class="calendar__weekday" aria-hidden="true">{{ w }}</span>
        <template v-for="cell in cells" :key="cell.key">
          <span v-if="!cell.iso" class="calendar__blank" />
          <button
            v-else
            type="button"
            class="day"
            :class="{ 'is-today': cell.iso === today, 'is-selected': cell.iso === selected }"
            :aria-pressed="cell.iso === selected"
            :aria-label="`${cell.iso}${cell.opening ? `, ${cell.opening} opening` : ''}${cell.closing ? `, ${cell.closing} closing` : ''}`"
            @click="select(cell.iso)"
          >
            <span class="day__number">{{ cell.day }}</span>
            <span class="day__dots" aria-hidden="true">
              <span v-if="cell.opening" class="dot dot--opening" />
              <span v-if="cell.closing" class="dot dot--closing" />
            </span>
          </button>
        </template>
      </div>

      <div class="calendar__foot">
        <span class="legend label"><span class="dot dot--opening" /> Opening</span>
        <span class="legend label"><span class="dot dot--closing" /> Closing</span>
        <button v-if="selected !== today" class="btn btn--accent today-btn" type="button" @click="goToday">Today</button>
      </div>
    </section>

    <section class="day-list" aria-live="polite">
      <h2 class="day-list__title caps">{{ selectedLabel }}</h2>
      <div v-if="error" class="state">
        <p>{{ error }}</p>
        <button class="btn" type="button" @click="$emit('retry')">Try again</button>
      </div>
      <p v-else-if="!data" class="state">Loading…</p>
      <p v-else-if="!onView.length" class="state">No exhibitions on view this day.</p>
      <a
        v-for="e in onView"
        :key="e.url + e.name"
        class="row"
        :href="e.url"
        target="_blank"
        rel="noopener"
      >
        <span class="row__thumb">
          <img v-if="e.image" :src="e.image" alt="" loading="lazy" decoding="async" />
        </span>
        <span class="row__body">
          <span class="row__gallery label">{{ galleryNames[e.gallery] ?? e.gallery }}</span>
          <span class="row__name">{{ e.name }}</span>
          <span class="row__meta label">
            <span v-if="badge(e)" class="row__badge">{{ badge(e) }}</span>
            {{ formatCardRange(e.startDate, e.endDate) }}
          </span>
        </span>
      </a>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 32px) 24px 40px;
}
.title {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.18em;
}
.copy {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
}
.calendar {
  margin-top: 40px;
  padding: 20px 12px 16px;
  border-radius: var(--radius);
  background: var(--color-surface);
}
.calendar__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.calendar__month {
  margin: 0;
  font-size: 12px;
}
.nav-btn {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
}
.nav-btn svg {
  width: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: square;
}
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
}
.calendar__weekday {
  padding-bottom: 8px;
  color: var(--color-text-muted); /* muted, not subtle: AA on the surface colour */
  font-family: var(--font-mono);
  font-size: 11px;
  text-align: center;
}
.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
}
.day__number {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  transition: background-color var(--duration) var(--ease), color var(--duration) var(--ease);
}
.day.is-today .day__number {
  border-color: var(--color-text);
}
.day.is-selected .day__number {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-bg);
}
.day__dots {
  display: flex;
  gap: 4px;
  height: 5px;
}
.dot {
  display: inline-block;
  width: 5px;
  height: 5px;
}
.dot--opening {
  background: var(--color-text);
}
.dot--closing {
  border: 1px solid var(--color-text-subtle);
}
.calendar__foot {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 36px;
  margin-top: 12px;
  padding: 0 8px;
}
.legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: 11px;
}
.today-btn {
  margin-left: auto;
  padding: 8px 14px;
  font-size: 11px;
}
.day-list {
  margin-top: 56px;
}
.day-list__title {
  margin: 0 0 16px;
  font-size: 12px;
}
.row {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-top: var(--rule);
  color: inherit;
  text-decoration: none;
}
.row:last-child {
  border-bottom: var(--rule);
}
.row__thumb {
  flex: 0 0 64px;
  height: 64px;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--color-surface);
}
.row__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.row__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.row__gallery {
  font-size: 11px;
  text-transform: uppercase;
}
.row__name {
  font-size: 16px;
  font-weight: var(--weight-medium);
  line-height: 1.4;
}
.row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}
.row__badge {
  padding: 2px 6px;
  border: 1px solid var(--color-text);
  border-radius: var(--radius);
  color: var(--color-text);
  font-size: 10px;
  text-transform: uppercase;
}
.state {
  margin: 40px 0;
  color: var(--color-text-muted);
}
.state p {
  margin: 0 0 20px;
}
</style>
