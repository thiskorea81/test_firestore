// 날짜 선택 및 기간 계산
<script setup>
import { computed } from 'vue';
import { Calendar } from 'lucide-vue-next';

const props = defineProps({
  startDate: String,
  endDate: String
});

const emit = defineEmits(['update:startDate', 'update:endDate']);

const duration = computed(() => {
  if (!props.startDate || !props.endDate) return 0;
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1; 
  return diffDays > 0 ? diffDays : 0;
});
</script>

<template>
  <div class="form-section">
    <label class="section-label"><Calendar class="w-4 h-4 mr-1"/> 결석 기간</label>
    <div class="date-row">
      <input type="date" :value="startDate" @input="$emit('update:startDate', $event.target.value)" class="input-base" />
      <span class="tilde">~</span>
      <input type="date" :value="endDate" @input="$emit('update:endDate', $event.target.value)" class="input-base" />
    </div>
    <p class="duration-text" v-if="duration > 0">
      총 {{ duration }}일간 ({{ startDate === endDate ? '당일' : '연속' }})
    </p>
  </div>
</template>

<style scoped>
.form-section { margin-bottom: 1.5rem; }
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.input-base { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
.input-base:focus { border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
.date-row { display: flex; align-items: center; gap: 0.5rem; }
.tilde { color: #6b7280; }
.duration-text { font-size: 0.85rem; color: #2563eb; font-weight: 600; margin-top: 0.4rem; margin-left: 0.2rem; }
</style>