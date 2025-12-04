// 결석 종류 선택 (여학생 로직 포함)
<script setup>
const props = defineProps({
  userData: Object,
  absenceType: String
});

const emit = defineEmits(['update:absenceType', 'type-changed']);

const handleChange = (type) => {
  emit('update:absenceType', type);
  emit('type-changed', type); // 부모에게 알림 (사유 자동완성용)
};
</script>

<template>
  <div class="form-section">
    <label class="section-label">결석 종류</label>
    <div class="radio-group">
      <label class="radio-item">
        <input type="radio" :checked="absenceType === '질병결석'" @change="handleChange('질병결석')">
        <span>질병결석</span>
      </label>
      <label class="radio-item">
        <input type="radio" :checked="absenceType === '인정결석'" @change="handleChange('인정결석')">
        <span>인정결석 (감염병 등)</span>
      </label>
      
      <label v-if="userData?.gender === 'female'" class="radio-item female-option">
        <input type="radio" :checked="absenceType === '인정결석(생리통)'" @change="handleChange('인정결석(생리통)')">
        <span>인정결석 (생리통)</span>
      </label>
      
      <label class="radio-item">
        <input type="radio" :checked="absenceType === '기타결석'" @change="handleChange('기타결석')">
        <span>기타결석</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.form-section { margin-bottom: 1.5rem; }
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.radio-group { display: flex; flex-wrap: wrap; gap: 1rem; }
.radio-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; cursor: pointer; color: #374151; }
.female-option { color: #db2777; font-weight: 700; background-color: #fce7f3; padding: 0.25rem 0.5rem; border-radius: 0.375rem; border: 1px solid #fbcfe8; }
</style>