<script setup>
import { ref } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { Upload, Users, Loader2, AlertCircle } from 'lucide-vue-next';

const store = useSystemStore();
const parsedUsers = ref([]);
const csvInput = ref(null);
const parseError = ref('');

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => parseCSV(e.target.result);
  reader.readAsText(file);
};

const parseCSV = (text) => {
  parseError.value = '';
  const lines = text.split('\n');
  const result = [];
  let errorCount = 0;
  
  lines.forEach((line, index) => {
    const cols = line.split(',').map(c => c.trim());
    if (cols.length < 3) return;

    const role = cols[0].toLowerCase();
    if (role !== 'student' && role !== 'teacher') return;

    let gender = null;
    if (role === 'student') {
      gender = cols[4]?.toLowerCase();
      if (gender !== 'male' && gender !== 'female') {
        console.warn(`Line ${index + 1}: 성별 오류`);
        errorCount++; return;
      }
    }

    // [수정] 기본 비밀번호 설정 (6자리 이상)
    const defaultPassword = role === 'student' ? '123456' : '654321';

    result.push({
      role,
      email: cols[1],
      name: cols[2],
      studentId: role === 'student' ? cols[3] : null,
      gender,
      password: defaultPassword
    });
  });
  
  parsedUsers.value = result;
  if (errorCount > 0) parseError.value = `${errorCount}개의 행이 데이터 오류로 제외되었습니다.`;
};

const handleBulkRegister = () => {
  if (!confirm(`${parsedUsers.value.length}명을 등록 대기자로 추가하시겠습니까?`)) return;
  store.bulkCreateUsers(parsedUsers.value);
  parsedUsers.value = [];
  if (csvInput.value) csvInput.value.value = '';
};
</script>

<template>
  <div class="p-4">
    <h3 class="text-2xl font-bold text-gray-800 mb-4">사용자 일괄 등록</h3>

    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
      <h4 class="font-bold text-blue-800 mb-2 flex items-center"><Users class="w-4 h-4 mr-2"/> CSV 업로드 안내</h4>
      <p class="text-sm text-blue-700 mb-2">
        기본 비밀번호: <span class="font-bold">학생 123456, 교사 654321</span> (첫 로그인 시 변경 강제)
      </p>
      <div class="bg-white p-3 rounded border border-blue-100 text-xs font-mono text-gray-600">
        student, email@school.com, 이름, 학번(10101), male/female<br>
        teacher, email@school.com, 이름
      </div>
    </div>

    <input type="file" ref="csvInput" @change="handleFileUpload" accept=".csv" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"/>
    
    <p v-if="parseError" class="text-red-500 text-sm mb-4 flex items-center"><AlertCircle class="w-4 h-4 mr-1"/> {{ parseError }}</p>

    <div v-if="parsedUsers.length > 0" class="overflow-x-auto mb-6 border rounded-lg">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-700">
          <tr><th class="px-4 py-2">역할</th><th class="px-4 py-2">이름</th><th class="px-4 py-2">이메일</th><th class="px-4 py-2">초기비번</th></tr>
        </thead>
        <tbody>
          <tr v-for="(u, idx) in parsedUsers" :key="idx" class="border-t">
            <td class="px-4 py-2 font-bold" :class="u.role==='student'?'text-blue-600':'text-green-600'">{{ u.role }}</td>
            <td class="px-4 py-2">{{ u.name }}</td>
            <td class="px-4 py-2">{{ u.email }}</td>
            <td class="px-4 py-2 text-gray-400 font-mono">{{ u.password }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="parsedUsers.length > 0" class="flex justify-end">
      <button @click="handleBulkRegister" :disabled="store.loading" class="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center">
        <Loader2 v-if="store.loading" class="w-5 h-5 animate-spin mr-2"/>
        <Upload v-else class="w-5 h-5 mr-2"/> 일괄 등록 실행
      </button>
    </div>
  </div>
</template>