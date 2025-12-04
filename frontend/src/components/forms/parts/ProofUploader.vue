// 증빙서류 종류 선택 및 파일 업로드
<script setup>
import { Upload, FileText } from 'lucide-vue-next';

const props = defineProps({
  proofDocType: String,
  proofDocDetail: String,
  fileInfo: Object
});

const emit = defineEmits(['update:proofDocType', 'update:proofDocDetail', 'file-selected']);

const handleFile = (e) => {
  const file = e.target.files[0];
  if (file) {
    emit('file-selected', file);
    e.target.value = ''; // 재선택 가능하게 초기화
  }
};
</script>

<template>
  <div class="form-section">
    <label class="section-label"><FileText class="w-4 h-4 mr-1"/> 증빙 서류 정보</label>
    
    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
      <div class="radio-group mb-2">
        <label class="radio-item">
          <input type="radio" :checked="proofDocType === '진료확인서'" @change="$emit('update:proofDocType', '진료확인서')">
          <span>진료확인서</span>
        </label>
        <label class="radio-item">
          <input type="radio" :checked="proofDocType === '진단서'" @change="$emit('update:proofDocType', '진단서')">
          <span>진단서</span>
        </label>
        <label class="radio-item">
          <input type="radio" :checked="proofDocType === '기타'" @change="$emit('update:proofDocType', '기타')">
          <span>기타(직접입력)</span>
        </label>
      </div>
      <input v-if="proofDocType === '기타'" 
        type="text" 
        :value="proofDocDetail" 
        @input="$emit('update:proofDocDetail', $event.target.value)" 
        placeholder="증빙서류 이름 입력 (예: 처방전)" 
        class="input-base bg-white"
      />
    </div>

    <label class="file-upload-box cursor-pointer block">
      <input type="file" @change="handleFile" accept="image/*" class="hidden" capture="environment" />
      
      <div v-if="!fileInfo.name && !fileInfo.url" class="placeholder-text flex flex-col items-center">
        <Upload class="w-6 h-6 mb-1 text-gray-400"/>
        <span>클릭하여 증빙 사진 촬영/업로드</span>
      </div>
      <div v-else-if="fileInfo.name" class="file-name new">{{ fileInfo.name }} (업로드 대기)</div>
      <div v-else class="file-name old">
        기존 파일 유지 중 <span class="sub">(클릭 시 변경)</span>
      </div>
    </label>
  </div>
</template>

<style scoped>
.form-section { margin-bottom: 1.5rem; }
.section-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
.input-base { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
.input-base:focus { border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
.radio-group { display: flex; flex-wrap: wrap; gap: 1rem; }
.radio-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; cursor: pointer; color: #374151; }
.file-upload-box { border: 2px dashed #d1d5db; padding: 1.5rem; text-align: center; border-radius: 0.75rem; transition: all 0.2s; background-color: #f9fafb; display: block; }
.file-upload-box:hover { border-color: #2563eb; background-color: #eff6ff; }
.placeholder-text { color: #6b7280; font-size: 0.9rem; }
.file-name { font-size: 0.9rem; font-weight: 700; }
.file-name.new { color: #2563eb; }
.file-name.old { color: #16a34a; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.file-name .sub { font-weight: 400; font-size: 0.8rem; color: #6b7280; }
</style>