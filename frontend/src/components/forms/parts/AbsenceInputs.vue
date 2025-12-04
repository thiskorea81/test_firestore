<script setup>
import DateSelector from './DateSelector.vue';
import TypeSelector from './TypeSelector.vue';
import ProofUploader from './ProofUploader.vue';

const props = defineProps({
  userData: Object,
  startDate: String,
  endDate: String,
  absenceType: String,
  reason: String,
  proofDocType: String,
  proofDocDetail: String,
  fileInfo: Object
});

const emit = defineEmits([
  'update:startDate', 'update:endDate', 'update:absenceType', 'update:reason', 
  'update:proofDocType', 'update:proofDocDetail',
  'file-selected'
]);

// 결석 종류 변경 시 사유 자동입력 로직
const handleTypeChange = (type) => {
  if (type === '인정결석(생리통)') {
    emit('update:reason', '생리통');
  } else if (props.reason === '생리통') {
    emit('update:reason', '');
  }
};
</script>

<template>
  <div class="inputs-container">
    
    <DateSelector 
      :startDate="startDate" 
      :endDate="endDate"
      @update:startDate="val => $emit('update:startDate', val)"
      @update:endDate="val => $emit('update:endDate', val)"
    />

    <TypeSelector 
      :userData="userData"
      :absenceType="absenceType"
      @update:absenceType="val => $emit('update:absenceType', val)"
      @type-changed="handleTypeChange"
    />

    <div class="form-section">
      <label class="section-label">결석 사유</label>
      <textarea 
        :value="reason" 
        @input="$emit('update:reason', $event.target.value)" 
        rows="3" 
        class="input-base resize-none" 
        placeholder="구체적인 사유를 입력하세요."
      ></textarea>
    </div>

    <ProofUploader 
      :proofDocType="proofDocType"
      :proofDocDetail="proofDocDetail"
      :fileInfo="fileInfo"
      @update:proofDocType="val => $emit('update:proofDocType', val)"
      @update:proofDocDetail="val => $emit('update:proofDocDetail', val)"
      @file-selected="val => $emit('file-selected', val)"
    />

  </div>
</template>

<style scoped>
/* 공통 레이아웃 스타일 */
.inputs-container { display: flex; flex-direction: column; gap: 0.5rem; }
.form-section { margin-bottom: 1.5rem; }
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.input-base { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
.input-base:focus { border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
.resize-none { resize: none; }
</style>