<script setup>
import { ref } from 'vue';
import { useExamStore } from '../../stores/examStore'; // 경로 확인 필요
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  grade: String,   // 현재 선택된 학년 (예: '1')
  classNum: String, // 현재 선택된 반 (예: '09')
  isOpen: Boolean  // 모달 표시 여부
});

const emit = defineEmits(['close']);
const store = useExamStore();

const fileInput = ref(null);
const examTitle = ref(`${new Date().getFullYear()}학년도 2학기 기말고사`);
const previewData = ref(null);
const rawText = ref('');

// 파일 선택 시 처리
const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  // 한글 깨짐 방지를 위해 필요시 'euc-kr' 등 인코딩 지정 가능. 기본은 utf-8
  reader.onload = (ev) => {
    rawText.value = ev.target.result;
    parsePreview(ev.target.result);
  };
  reader.readAsText(file);
};

// 업로드 전 간단한 파일 검증 (학생 수 및 첫 번째 학생 확인)
const parsePreview = (text) => {
  try {
    const lines = text.split('\n');
    let studentCount = 0;
    let firstStudentName = '';
    
    // 간단히 '번호' 컬럼이 숫자인 행만 카운트
    lines.forEach(line => {
      const cols = line.split(',').map(c => c.trim());
      // 첫 컬럼이 숫자이고, 두번째(이름)이 존재하면 학생 데이터로 간주
      if (cols[0] && !isNaN(cols[0]) && cols[1]) {
        studentCount++;
        if (!firstStudentName) firstStudentName = `${cols[0]}번 ${cols[1]}`;
      }
    });

    previewData.value = { 
      count: studentCount, 
      first: firstStudentName 
    };
  } catch (e) {
    console.error(e);
    previewData.value = { error: true };
  }
};

const handleUpload = async () => {
  if (!rawText.value) return alert('파일을 선택해주세요.');
  if (!props.grade || !props.classNum) return alert('학년/반 정보가 없습니다.');
  
  if (!confirm(`[${props.grade}학년 ${props.classNum}반] 성적으로 업로드하시겠습니까?\n제목: ${examTitle.value}`)) return;
  
  // examStore의 액션 호출
  await store.uploadExamResults(examTitle.value, rawText.value, props.grade, props.classNum);
  
  // 성공 시 모달 닫기 및 초기화
  emit('close');
  rawText.value = '';
  previewData.value = null;
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all">
      
      <div class="flex justify-between items-center mb-5 border-b pb-3">
        <h3 class="font-bold text-lg flex items-center gap-2 text-gray-800">
          <Upload class="w-5 h-5 text-blue-600"/> 성적 파일 업로드
        </h3>
        <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition">
          <X class="w-5 h-5 text-gray-400 hover:text-gray-600"/>
        </button>
      </div>

      <div class="space-y-5">
        
        <div class="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-gray-500"/>
          <span>대상 학급: <strong class="text-blue-700">{{ grade }}학년 {{ classNum }}반</strong></span>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">시험 제목</label>
          <input v-model="examTitle" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 2024학년도 2학기 기말고사"/>
        </div>

        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer group" @click="$refs.fileInput.click()">
          <input type="file" ref="fileInput" accept=".csv" class="hidden" @change="handleFile"/>
          <div class="flex flex-col items-center">
            <div class="p-3 bg-blue-50 rounded-full text-blue-500 mb-3 group-hover:scale-110 transition">
              <FileText class="w-6 h-6"/>
            </div>
            <span class="text-sm font-bold text-gray-700">CSV 파일 선택하기</span>
            <span class="text-xs text-gray-400 mt-1">학기말 성적 종합일람표 (CSV 형식)</span>
          </div>
        </div>

        <div v-if="previewData" class="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 animate-fade-in">
          <div v-if="previewData.error" class="text-red-500 flex items-center">
            <AlertCircle class="w-4 h-4 mr-1"/> 파일 형식을 확인할 수 없습니다.
          </div>
          <div v-else>
            <p class="font-bold mb-1 flex items-center"><Loader2 v-if="store.loading" class="w-3 h-3 animate-spin mr-1"/>파일 분석 완료</p>
            <ul class="list-disc list-inside text-xs space-y-1 opacity-80">
              <li>총 학생 수: <strong>{{ previewData.count }}명</strong></li>
              <li>첫 번째 학생: {{ previewData.first }}</li>
            </ul>
          </div>
        </div>

        <button @click="handleUpload" :disabled="store.loading || !rawText" 
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center shadow-sm transition">
          <Loader2 v-if="store.loading" class="w-5 h-5 animate-spin mr-2"/>
          {{ store.loading ? '업로드 및 처리 중...' : '성적 데이터 업로드' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>