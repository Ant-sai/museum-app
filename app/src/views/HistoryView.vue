<script setup>
defineProps({ data: Object, error: String });
defineEmits(["retry"]);
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">Visit History</h1>
    </header>
    <div class="empty">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6.5C10 5 7 4.6 3.5 5v14c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5zM12 6.5v14" />
      </svg>
      <p class="empty__title">Coming soon</p>
      <p class="empty__copy">The exhibitions you have visited will be kept here.</p>
    </div>
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
.empty {
  margin-top: 96px;
  text-align: center;
  color: var(--muted);
}
.empty svg {
  width: 48px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linejoin: round;
}
.empty__title {
  margin: 12px 0 6px;
  color: var(--text);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
}
.empty__copy {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}
</style>
