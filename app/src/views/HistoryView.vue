<script setup>
defineProps({ data: Object, error: String });
defineEmits(["retry"]);
</script>

<template>
  <div class="page">
    <header>
      <h1 class="title caps">Visit History</h1>
    </header>
    <section class="empty">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6.5C10 5 7 4.6 3.5 5v14c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5zM12 6.5v14" />
      </svg>
      <p class="empty__title caps">Coming soon</p>
      <p class="empty__copy">Exhibitions you have visited will be listed here.</p>
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
.empty {
  margin-top: 96px;
  padding-top: 32px;
  border-top: var(--rule);
  color: var(--color-text-muted);
}
.empty svg {
  width: 32px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-linejoin: round;
}
.empty__title {
  margin: 20px 0 8px;
  color: var(--color-text);
  font-size: 13px;
}
.empty__copy {
  margin: 0;
  font-size: 15px;
}
</style>
