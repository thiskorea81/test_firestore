<script setup>
import { Loader2 } from 'lucide-vue-next';
</script>

<template>
  <div class="loading-container">
    <Loader2 class="spinner-icon" />
  </div>
</template>

<style scoped>
.loading-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
}

.spinner-icon {
  width: 2rem;
  height: 2rem;
  color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>