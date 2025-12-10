<script setup>
import { ref, onMounted } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Globe } from 'lucide-vue-next';

const store = useSystemStore();
const localConfig = ref(JSON.parse(JSON.stringify(store.config)));

onMounted(async () => {
  await store.fetchConfig();
  localConfig.value = JSON.parse(JSON.stringify(store.config));
});

const addApprovalStep = () => { localConfig.value.approvalLine.push({ role: '', label: '', isFinal: false }); };
const removeApprovalStep = (index) => { localConfig.value.approvalLine.splice(index, 1); };
const moveStep = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= localConfig.value.approvalLine.length) return;
  const temp = localConfig.value.approvalLine[index];
  localConfig.value.approvalLine[index] = localConfig.value.approvalLine[newIndex];
  localConfig.value.approvalLine[newIndex] = temp;
};

const handleSave = () => { store.saveConfig(localConfig.value); };
</script>

<template>
  <div class="config-container">
    <h3 class="title">시스템 설정</h3>

    <div class="section">
      <h4 class="sub-title"><Globe class="w-4 h-4 mr-1 inline"/> 학교 기본 정보</h4>
      <div class="input-group">
        <label>학교 이메일 도메인</label>
        <input type="text" v-model="localConfig.domain" placeholder="예: school.kr" class="input-base flex-1" />
        <span class="text-xs text-gray-500 ml-2">(@ 뒤에 붙을 주소)</span>
      </div>
    </div>

    <div class="section">
      <h4 class="sub-title">📌 인정결석 및 체험학습 일수 설정</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="input-group"><label>인정결석(생리통) / 월</label><input type="number" v-model="localConfig.limits.menstrual" class="input-base" /><span class="unit">일</span></div>
        <div class="input-group"><label>국내 체험학습 / 연</label><input type="number" v-model="localConfig.limits.domesticTrip" class="input-base" /><span class="unit">일</span></div>
        <div class="input-group"><label>국외 체험학습 / 연</label><input type="number" v-model="localConfig.limits.overseasTrip" class="input-base" /><span class="unit">일</span></div>
      </div>
    </div>

    <div class="section">
      <div class="flex justify-between items-end mb-2">
        <h4 class="sub-title">📝 결재 라인 관리</h4>
        <button @click="addApprovalStep" class="btn-small"><Plus class="w-4 h-4 mr-1"/>추가</button>
      </div>
      <div class="approval-list">
        <div v-for="(step, index) in localConfig.approvalLine" :key="index" class="approval-item">
          <span class="step-num">{{ index + 1 }}</span>
          <input type="text" v-model="step.label" placeholder="직책" class="input-base w-32" />
          <label class="flex items-center gap-2 ml-4 cursor-pointer">
            <input type="checkbox" v-model="step.isFinal" class="w-4 h-4" />
            <span class="text-sm font-bold text-blue-600">전결 가능</span>
          </label>
          <div class="ml-auto flex gap-1">
            <button @click="moveStep(index, -1)" class="icon-btn"><ArrowUp class="w-4 h-4"/></button>
            <button @click="moveStep(index, 1)" class="icon-btn"><ArrowDown class="w-4 h-4"/></button>
            <button @click="removeApprovalStep(index)" class="icon-btn delete"><Trash2 class="w-4 h-4"/></button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <button @click="handleSave" class="btn-save"><Save class="w-5 h-5 mr-2"/> 설정 저장하기</button>
    </div>
  </div>
</template>

<style scoped>
.config-container { padding: 1rem; }
.title { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin-bottom: 1.5rem; }
.section { background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; margin-bottom: 1.5rem; }
.sub-title { font-size: 1rem; font-weight: 700; color: #4b5563; margin-bottom: 1rem; }
.input-group { display: flex; align-items: center; gap: 0.5rem; background: white; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #d1d5db; }
.input-group label { font-size: 0.85rem; font-weight: 600; color: #6b7280; width: 140px; }
.input-base { border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.25rem 0.5rem; outline: none; }
.unit { font-size: 0.85rem; color: #6b7280; }
.approval-list { display: flex; flex-direction: column; gap: 0.5rem; }
.approval-item { display: flex; align-items: center; background: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; }
.step-num { width: 24px; height: 24px; background: #374151; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; margin-right: 1rem; }
.btn-small { background: #eff6ff; color: #2563eb; padding: 0.3rem 0.6rem; border-radius: 0.375rem; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; }
.btn-save { background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; font-size: 1rem; }
.icon-btn { padding: 0.3rem; border-radius: 0.25rem; border: none; cursor: pointer; background: #f3f4f6; color: #6b7280; }
.icon-btn.delete { color: #ef4444; background: #fef2f2; }
</style>