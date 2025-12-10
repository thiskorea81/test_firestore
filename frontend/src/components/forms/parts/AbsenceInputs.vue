<script setup>
import { computed, ref, watch } from 'vue';
import { Calendar, Upload, FileText, MessageSquare, Clock, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps({
  userData: Object,
  startDate: String, endDate: String,
  startPeriod: String, endPeriod: String,
  absenceType: String,
  absenceDetail: String, 
  reason: String, parentOpinion: String,
  proofDocType: String, proofDocDetail: String,
  fileInfo: Object
});

const emit = defineEmits([
  'update:startDate', 'update:endDate', 
  'update:startPeriod', 'update:endPeriod',
  'update:absenceType', 'update:absenceDetail',
  'update:reason', 'update:parentOpinion',
  'update:proofDocType', 'update:proofDocDetail',
  'file-selected'
]);

const fileInputRef = ref(null);
const todayStr = new Date().toISOString().split('T')[0];

const duration = computed(() => {
  if (!props.startDate || !props.endDate) return 0;
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
});

const handleFile = (e) => {
  const file = e.target.files[0];
  if (file) { emit('file-selected', file); e.target.value = ''; }
};

const handleTypeChange = (type) => {
  emit('update:absenceType', type);
  if (type === '인정결석(생리통)') {
    emit('update:reason', '생리통');
  } else if (props.reason === '생리통') {
    emit('update:reason', '');
  }
};

// [수정] 구분 변경 시 교시 자동 세팅 (조회/종례)
const handleDetailChange = (detail) => {
  emit('update:absenceDetail', detail);
  
  if (detail === '지각') {
    // 지각: 조회 ~ N교시
    emit('update:startPeriod', '조회');
    emit('update:endPeriod', ''); 
  } else if (detail === '조퇴') {
    // 조퇴: N교시 ~ 종례
    emit('update:startPeriod', '');
    emit('update:endPeriod', '종례');
  } else {
    // 결석, 결과: 초기화
    emit('update:startPeriod', '');
    emit('update:endPeriod', '');
  }
};

// 날짜 유효성 감지
watch(() => props.startDate, (newStart) => {
  if (newStart > props.endDate) emit('update:endDate', newStart);
});
watch(() => props.endDate, (newEnd) => {
  if (newEnd < props.startDate) emit('update:startDate', newEnd);
});
</script>

<template>
  <div class="inputs-container space-y-6">
    
    <div class="form-section">
      <label class="section-label"><Calendar class="w-4 h-4 mr-1"/> 결석 기간 및 구분</label>
      <div class="flex flex-col gap-3">
        <div class="date-row">
          <input type="date" :value="startDate" :max="todayStr" @input="$emit('update:startDate', $event.target.value)" class="input-base" />
          <span class="tilde">~</span>
          <input type="date" :value="endDate" :max="todayStr" @input="$emit('update:endDate', $event.target.value)" class="input-base" />
        </div>
        
        <div class="flex gap-4 p-2 bg-gray-50 rounded border border-gray-200 justify-center">
          <label class="flex items-center gap-1 cursor-pointer text-sm font-bold">
            <input type="radio" :checked="absenceDetail === '결석'" @change="handleDetailChange('결석')"> 결석
          </label>
          <label class="flex items-center gap-1 cursor-pointer text-sm font-bold">
            <input type="radio" :checked="absenceDetail === '조퇴'" @change="handleDetailChange('조퇴')"> 조퇴
          </label>
          <label class="flex items-center gap-1 cursor-pointer text-sm font-bold">
            <input type="radio" :checked="absenceDetail === '지각'" @change="handleDetailChange('지각')"> 지각
          </label>
          <label class="flex items-center gap-1 cursor-pointer text-sm font-bold">
            <input type="radio" :checked="absenceDetail === '결과'" @change="handleDetailChange('결과')"> 결과
          </label>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <Clock class="w-4 h-4 text-gray-400"/>
          <input type="text" :value="startPeriod" @input="$emit('update:startPeriod', $event.target.value)" placeholder="시작" class="input-base w-16 text-center"
            :readonly="absenceDetail === '지각'" :class="{'bg-gray-100': absenceDetail === '지각'}"/>
          <span>~</span>
          <input type="text" :value="endPeriod" @input="$emit('update:endPeriod', $event.target.value)" placeholder="종료" class="input-base w-16 text-center"
            :readonly="absenceDetail === '조퇴'" :class="{'bg-gray-100': absenceDetail === '조퇴'}"/>
        </div>

        <p class="duration-text" v-if="duration > 0">
          총 {{ duration }}일간 ({{ startDate === endDate ? '당일' : '연속' }})
        </p>
      </div>
    </div>

    <div class="form-section">
      <label class="section-label">결석 유형</label>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <label class="radio-item"><input type="radio" :checked="absenceType === '질병결석'" @change="handleTypeChange('질병결석')"> 질병</label>
        <label class="radio-item"><input type="radio" :checked="absenceType === '기타결석'" @change="handleTypeChange('기타결석')"> 기타(미인정)</label>
        <label class="radio-item"><input type="radio" :checked="absenceType === '경조사'" @change="handleTypeChange('경조사')"> 출석인정(경조사)</label>
        <label class="radio-item"><input type="radio" :checked="absenceType === '사회봉사'" @change="handleTypeChange('사회봉사')"> 출석인정(사회봉사)</label>
        <label class="radio-item"><input type="radio" :checked="absenceType === '법정감염병'" @change="handleTypeChange('법정감염병')"> 출석인정(법정감염병)</label>
        
        <label v-if="userData?.gender === 'female'" class="radio-item female-option">
          <input type="radio" :checked="absenceType === '인정결석(생리통)'" @change="handleTypeChange('인정결석(생리통)')"> 출석인정(생리통)
        </label>
      </div>
    </div>

    <div class="form-section">
      <label class="section-label">결석 사유</label>
      <textarea :value="reason" @input="$emit('update:reason', $event.target.value)" rows="2" class="input-base resize-none" placeholder="구체적인 사유를 입력하세요."></textarea>
      
      <label class="section-label mt-4"><MessageSquare class="w-4 h-4 mr-1"/> 학부모 의견</label>
      <textarea :value="parentOpinion" @input="$emit('update:parentOpinion', $event.target.value)" rows="2" class="input-base resize-none" placeholder="선생님께 전할 말씀"></textarea>
    </div>

    <div class="form-section">
      <label class="section-label"><FileText class="w-4 h-4 mr-1"/> 증빙 서류 정보</label>
      <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
        <div class="radio-group mb-2">
          <label class="radio-item"><input type="radio" :checked="proofDocType === '진료확인서'" @change="$emit('update:proofDocType', '진료확인서')"> 진료확인서</label>
          <label class="radio-item"><input type="radio" :checked="proofDocType === '진단서'" @change="$emit('update:proofDocType', '진단서')"> 진단서</label>
          <label class="radio-item"><input type="radio" :checked="proofDocType === '기타'" @change="$emit('update:proofDocType', '기타')"> 기타</label>
        </div>
        <input v-if="proofDocType === '기타'" type="text" :value="proofDocDetail" @input="$emit('update:proofDocDetail', $event.target.value)" placeholder="증빙서류 이름 입력" class="input-base bg-white"/>
      </div>

      <label class="file-upload-box cursor-pointer block">
        <input type="file" @change="handleFile" accept="image/*" class="hidden" capture="environment" />
        <div v-if="!fileInfo.name && !fileInfo.url" class="placeholder-text flex flex-col items-center">
          <Upload class="w-6 h-6 mb-1 text-gray-400"/><span>클릭하여 사진 촬영/업로드</span>
        </div>
        <div v-else-if="fileInfo.name" class="file-name new">{{ fileInfo.name }} (업로드 대기)</div>
        <div v-else class="file-name old">기존 파일 유지 중 (변경하려면 클릭)</div>
      </label>
    </div>
  </div>
</template>

<style scoped>
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.input-base { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; }
.input-base:focus { border-color: #2563eb; ring: 2px solid #93c5fd; }
.input-base[readonly] { background-color: #f3f4f6; cursor: not-allowed; }
.date-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.duration-text { font-size: 0.85rem; color: #2563eb; font-weight: 600; margin-top: 0.4rem; }
.radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
.radio-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.5rem; cursor: pointer; }
.female-option { color: #db2777; background-color: #fce7f3; }
.file-upload-box { border: 2px dashed #d1d5db; padding: 1.5rem; text-align: center; border-radius: 0.75rem; background-color: #f9fafb; }
</style>