<script setup>
import { User } from 'lucide-vue-next';

defineProps({
  userData: Object
});
</script>

<template>
  <div class="parent-info-container">
    <h4 class="section-sub-title">
      <User class="w-4 h-4 mr-1"/> 보호자 정보
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="info-box bg-gray-50 border-gray-200">
        <span class="label">보호자 성함</span>
        <span class="value text-gray-800">{{ userData.parentName || '-' }}</span>
      </div>
      <div class="info-box bg-gray-50 border-gray-200">
        <span class="label">보호자 연락처</span>
        <span class="value text-gray-800">{{ userData.parentPhone || '-' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parent-info-container { grid-column: 1 / -1; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; }
.section-sub-title { font-size: 0.875rem; font-weight: 700; color: #6b7280; margin-bottom: 0.75rem; display: flex; align-items: center; }

.info-box { background: #f9fafb; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.label { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.value { font-size: 1.125rem; font-weight: 500; color: #111827; }
</style>