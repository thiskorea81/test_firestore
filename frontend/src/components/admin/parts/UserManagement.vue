<script setup>
import { ref } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { Upload, Users, Loader2 } from 'lucide-vue-next';

const store = useSystemStore();
const parsedUsers = ref([]);
const csvInput = ref(null);

// CSV 파일 파싱
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
};

const parseCSV = (text) => {
  // 간단한 CSV 파서 (헤더: role, email, name, studentId)
  // 예시: student, s1@test.com, 홍길동, 10101
  const lines = text.split('\n');
  const result = [];
  
  lines.forEach((line) => {
    const cols = line.split(',').map(c => c.trim());
    if (cols.length < 3) return; // 유효하지 않은 줄

    const role = cols[0].toLowerCase();
    if (role !== 'student' && role !== 'teacher') return;

    result.push({
      role: role,
      email: cols[1],
      name: cols[2],
      studentId: role === 'student' ? cols[3] : null,
      password: role === 'student' ? '1234' : '4321' // 참고용
    });
  });
  
  parsedUsers.value = result;
};

const handleBulkRegister = () => {
  if (parsedUsers.value.length === 0) return;
  if (!confirm(`${parsedUsers.value.length}명의 사용자를 등록하시겠습니까?`)) return;
  
  store.bulkCreateUsers(parsedUsers.value);
  parsedUsers.value = []; // 초기화
  if (csvInput.value) csvInput.value.value = '';
};
</script>

<template>
  <div class="user-manage-container">
    <h3 class="title">사용자 일괄 등록</h3>

    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
      <h4 class="font-bold text-blue-800 mb-2 flex items-center"><Users class="w-4 h-4 mr-2"/> CSV 업로드 안내</h4>
      <p class="text-sm text-blue-700 mb-2">
        아래 형식의 CSV(쉼표로 구분) 파일을 업로드해주세요. (첫 줄 헤더 없음)
      </p>
      <div class="bg-white p-3 rounded border border-blue-100 text-xs font-mono text-gray-600">
        student, user1@school.com, 김학생, 10101<br>
        teacher, teach1@school.com, 박선생, 
      </div>
    </div>

    <div class="mb-6">
      <input type="file" ref="csvInput" @change="handleFileUpload" accept=".csv" class="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100
      "/>
    </div>

    <div v-if="parsedUsers.length > 0" class="overflow-x-auto mb-6 border rounded-lg">
      <table class="w-full text-sm text-left">
        <thead class="bg-gray-50 text-gray-700">
          <tr>
            <th class="px-4 py-2">역할</th>
            <th class="px-4 py-2">이름</th>
            <th class="px-4 py-2">이메일</th>
            <th class="px-4 py-2">학번</th>
            <th class="px-4 py-2">초기비번</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, idx) in parsedUsers" :key="idx" class="border-t">
            <td class="px-4 py-2">
              <span :class="u.role === 'student' ? 'text-blue-600' : 'text-green-600'" class="font-bold">{{ u.role }}</span>
            </td>
            <td class="px-4 py-2">{{ u.name }}</td>
            <td class="px-4 py-2">{{ u.email }}</td>
            <td class="px-4 py-2">{{ u.studentId || '-' }}</td>
            <td class="px-4 py-2 text-gray-400">{{ u.password }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="parsedUsers.length > 0" class="flex justify-end">
      <button @click="handleBulkRegister" :disabled="store.loading" class="btn-register">
        <Loader2 v-if="store.loading" class="w-5 h-5 animate-spin mr-2"/>
        <Upload v-else class="w-5 h-5 mr-2"/>
        {{ parsedUsers.length }}명 일괄 등록 실행
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-manage-container { padding: 1rem; }
.title { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin-bottom: 1.5rem; }
.btn-register { background: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; font-size: 1rem; transition: background 0.2s; }
.btn-register:hover { background: #059669; }
.btn-register:disabled { opacity: 0.7; cursor: not-allowed; }
</style>