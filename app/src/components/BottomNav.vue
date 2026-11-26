<script setup>
defineProps({ current: { type: String, required: true } });
defineEmits(["navigate"]);

const ITEMS = [
  { id: "explore", label: "Explore" },
  { id: "calendar", label: "Calendar" },
  { id: "history", label: "Visit History" },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Main">
    <div class="bottom-nav__inner">
      <button
        v-for="item in ITEMS"
        :key="item.id"
        type="button"
        class="bottom-nav__item"
        :class="{ 'is-active': current === item.id }"
        :aria-current="current === item.id ? 'page' : undefined"
        @click="$emit('navigate', item.id)"
      >
        <svg v-if="item.id === 'explore'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7v10M7.5 5v14" />
          <rect x="11" y="3" width="9.5" height="18" rx="1" />
        </svg>
        <svg v-else-if="item.id === 'calendar'" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="1" />
          <path d="M8 3v4M16 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6.5C10 5 7 4.6 3.5 5v14c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5zM12 6.5v14" />
        </svg>
        <span class="bottom-nav__label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  z-index: 10;
  right: 0;
  bottom: 0;
  left: 0;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: var(--rule);
  background: var(--color-bg);
}
.bottom-nav__inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 640px;
  margin: 0 auto;
}
.bottom-nav__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px 10px;
  border: 0;
  background: transparent;
  color: var(--color-text-subtle);
  transition: color var(--duration) var(--ease);
}
.bottom-nav__item svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bottom-nav__label {
  font-size: 10px;
  font-weight: var(--weight-medium);
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}
.bottom-nav__item.is-active {
  color: var(--color-text);
}
/* Brass rule above the active tab: a detail, the slate label carries the state. */
.bottom-nav__item.is-active::before {
  position: absolute;
  top: -1px;
  left: 50%;
  width: 32px;
  height: 1px;
  background: var(--color-brass);
  content: "";
  transform: translateX(-50%);
}
.bottom-nav__item:focus-visible {
  outline-offset: -4px;
}
</style>
