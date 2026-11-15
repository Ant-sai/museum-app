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
      <h1 class="title">Calendar</h1>
      <p class="copy">Openings and closings at a glance.</p>
    </header>

    <section class="calendar" aria-label="Exhibition calendar">
      <div class="calendar__head">
        <button class="nav-btn" type="button" aria-label="Previous month" @click="shiftMonth(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h2 class="calendar__month">{{ monthLabel }}</h2>
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
        <span class="legend"><span class="dot dot--opening" /> Opening</span>
        <span class="legend"><span class="dot dot--closing" /> Closing</span>
        <button v-if="selected !== today" class="today-btn" type="button" @click="goToday">Today</button>
      </div>
    </section>

    <section class="day-list" aria-live="polite">
      <h2 class="day-list__title">{{ selectedLabel }}</h2>
      <p v-if="error" class="state">
        {{ error }}
        <button class="retry" @click="$emit('retry')">Try again</button>
      </p>
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
          <span class="row__gallery">{{ galleryNames[e.gallery] ?? e.gallery }}</span>
          <span class="row__name">{{ e.name }}</span>
          <span class="row__meta">
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
  padding: calc(env(safe-area-inset-top) + 24px) 20px 32px;
}
.title {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 500;
  letter-spacing: -0.035em;
}
.copy {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 15px;
}
.calendar {
  margin-top: 24px;
  padding: 16px 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.calendar__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.calendar__month {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  font-weight: 500;
}
.nav-btn {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text);
}
.nav-btn svg {
  width: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
}
.calendar__weekday {
  padding-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-height: 46px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
}
.day__number {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.day.is-today .day__number {
  box-shadow: inset 0 0 0 1.5px var(--accent);
  color: var(--accent);
  font-weight: 700;
}
.day.is-selected .day__number {
  background: var(--accent);
  box-shadow: none;
  color: var(--surface);
  font-weight: 700;
}
.day__dots {
  display: flex;
  gap: 3px;
  height: 6px;
}
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot--opening {
  background: var(--accent);
}
.dot--closing {
  box-shadow: inset 0 0 0 1.5px var(--muted);
}
.calendar__foot {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  padding: 0 6px;
  color: var(--muted);
  font-size: 12px;
}
.legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.today-btn {
  margin-left: auto;
  padding: 5px 12px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}
.day-list {
  margin-top: 28px;
}
.day-list__title {
  margin: 0 0 14px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 500;
}
.row {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
}
.row__thumb {
  flex: 0 0 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 5px;
  background: var(--track);
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
  gap: 3px;
  min-width: 0;
}
.row__gallery {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.row__name {
  font-family: Georgia, "Times New Roman", "Apple SD Gothic Neo", serif;
  font-size: 17px;
  line-height: 1.3;
}
.row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.row__badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
}
.state {
  margin: 32px 0;
  text-align: center;
  color: var(--muted);
}
.retry {
  display: block;
  margin: 12px auto 0;
  padding: 9px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
</style>
