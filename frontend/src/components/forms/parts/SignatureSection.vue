<script setup>
import { ref } from 'vue';
import SignaturePad from '../../SignaturePad.vue';

const props = defineProps({
  studentName: String,
  parentName: String,
  editData: Object
});

const emit = defineEmits(['update:parentName']);

const sPad = ref(null);
const pPad = ref(null);

const getSignatures = () => {
  return {
    student: sPad.value?.getSignatureData(),
    parent: pPad.value?.getSignatureData(),
    isStudentEmpty: sPad.value?.isEmpty(),
    isParentEmpty: pPad.value?.isEmpty()
  };
};

defineExpose({ getSignatures });
</script>

<template>
  <div class="signature-grid">
    <div class="sig-col">
      <label class="section-label">학생 서명 <span v-if="editData" class="sub">(변경 시 작성)</span></label>
      <input type="text" :value="studentName" readonly class="input-base readonly" />
      <div class="pad-wrapper">
        <SignaturePad ref="sPad" />
      </div>
    </div>
    
    <div class="sig-col">
      <label class="section-label">학부모 서명 <span v-if="editData" class="sub">(변경 시 작성)</span></label>
      <input type="text" :value="parentName" @input="$emit('update:parentName', $event.target.value)" placeholder="학부모 성함 입력" class="input-base" />
      <div class="pad-wrapper">
        <SignaturePad ref="pPad" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1.5rem; }
@media (min-width: 768px) { .signature-grid { grid-template-columns: 1fr 1fr; } }

.sig-col { display: flex; flex-direction: column; }
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.sub { font-size: 0.75rem; color: #9ca3af; font-weight: 400; margin-left: 4px; }

.input-base { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; margin-bottom: 0.5rem; }
.input-base:focus { border-color: #2563eb; }
.input-base.readonly { background-color: #f3f4f6; color: #6b7280; cursor: not-allowed; }

.pad-wrapper { border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e7eb; }
</style>