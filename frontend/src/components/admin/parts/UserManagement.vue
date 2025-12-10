<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { Upload, Users, Loader2, RefreshCw, Trash2, Search, UserCheck, Clock, Archive } from 'lucide-vue-next';

const store = useSystemStore();
const activeTab = ref('list');
const searchQuery = ref('');
const selectedIds = ref(new Set());

onMounted(() => {
  store.fetchAllUsers();
  store.fetchConfig();
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.userList;
  const q = searchQuery.value.toLowerCase();
  return store.userList.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
});

const isAllSelected = computed(() => filteredUsers.value.length > 0 && filteredUsers.value.every(u => selectedIds.value.has(u.id)));
const toggleSelectAll = () => { if (isAllSelected.value) selectedIds.value.clear(); else filteredUsers.value.forEach(u => selectedIds.value.add(u.id)); };
const toggleSelection = (id) => { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); };
const handleBatchDelete = async () => { if (!confirm(`삭제?`)) return; await store.bulkDeleteUsers([...store.userList.filter(u => selectedIds.value.has(u.id))]); selectedIds.value.clear(); };
const handleBatchArchive = async () => { if (!confirm(`보관?`)) return; await store.bulkArchiveUsers([...store.userList.filter(u => selectedIds.value.has(u.id))]); selectedIds.value.clear(); };

// --- [일괄 등록 로직 수정] ---
const parsedUsers = ref([]);
const csvInput = ref(null);
const manualInputText = ref('');
const parseError = ref('');

const parseInputText = (text) => {
  parseError.value = '';
  const lines = text.split('\n');
  const result = [];
  const domain = store.config.domain || 'school.kr';
  
  lines.forEach((line) => {
    // 쉼표 또는 탭으로 분리
    const cols = line.split(/,|\t/).map(c => c.trim()).filter(c => c !== '');
    if (cols.length < 3) return; 

    // 자동 판별
    let role = cols[0].toLowerCase();
    
    let email = '';
    let name = '';
    let studentId = '';
    let gender = 'male';
    let password = '';

    // [Case 1] 학번으로 시작하는 경우 (학생) 예: 10901, 홍길동, 남
    if (!isNaN(Number(cols[0])) && cols[0].length >= 5) {
      role = 'student';
      studentId = cols[0];
      name = cols[1];
      gender = (cols[2] === '여' || cols[2] === 'female') ? 'female' : 'male';
      
      email = `${studentId}@${domain}`;
      password = '123456';
    } 
    // [Case 2] 명시적 역할 지정 (기존 방식) 예: teacher, t1@aa.com, 박선생
    else if (role === 'student' || role === 'teacher') {
      email = cols[1];
      name = cols[2];
      if (role === 'student') {
        studentId = cols[3] || '';
        gender = (cols[4] === '여' || cols[4] === 'female') ? 'female' : 'male';
        password = '123456';
      } else {
        password = '654321';
      }
    } else {
      return; // 형식 불일치
    }

    result.push({ role, email, name, studentId, gender, password });
  });
  
  parsedUsers.value = result;
  if (result.length === 0 && text.trim().length > 0) parseError.value = "데이터 형식을 확인해주세요.";
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { manualInputText.value = ev.target.result; parseInputText(ev.target.result); };
  reader.readAsText(file);
};
const handleManualPreview = () => parseInputText(manualInputText.value);
const handleBulkRegister = async () => {
  if (!confirm(`${parsedUsers.value.length}명 등록?`)) return;
  await store.bulkCreateUsers(parsedUsers.value);
  parsedUsers.value = []; manualInputText.value = ''; if (csvInput.value) csvInput.value.value = '';
  activeTab.value = 'list';
  store.fetchAllUsers();
};
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold text-gray-800">사용자 관리</h3>
      <div class="flex bg-gray-200 p-1 rounded-lg">
        <button @click="activeTab = 'list'" :class="['px-4 py-2 rounded-md text-sm font-bold transition', activeTab === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500']">목록 조회</button>
        <button @click="activeTab = 'upload'" :class="['px-4 py-2 rounded-md text-sm font-bold transition', activeTab === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500']">일괄 등록</button>
      </div>
    </div>

    <div v-if="activeTab === 'list'">
      <div class="flex gap-2 mb-4"><div class="relative flex-1"><Search class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/><input v-model="searchQuery" type="text" placeholder="검색" class="w-full pl-9 pr-4 py-2 border rounded-lg outline-none"/></div><button @click="store.fetchAllUsers()" class="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw class="w-4 h-4"/></button></div>
      <div v-if="selectedIds.size>0" class="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg"><span class="text-sm font-bold text-blue-800 ml-2">{{selectedIds.size}}명</span><div class="flex-1"></div><button @click="handleBatchArchive" class="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">보관</button><button @click="handleBatchDelete" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">삭제</button></div>
      <div class="overflow-x-auto bg-white border rounded-lg shadow-sm"><table class="w-full text-sm text-left"><thead class="bg-gray-50 text-gray-700 uppercase"><tr><th class="px-4 py-3 w-10 text-center"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"/></th><th class="px-4 py-3">상태</th><th class="px-4 py-3">구분</th><th class="px-4 py-3">이름/정보</th><th class="px-4 py-3">이메일</th></tr></thead><tbody class="divide-y divide-gray-100"><tr v-for="user in filteredUsers" :key="user.id"><td class="px-4 py-3 text-center"><input type="checkbox" :checked="selectedIds.has(user.id)" @change="toggleSelection(user.id)"/></td><td class="px-4 py-3">{{ user.status==='active'?'활동':'대기' }}</td><td class="px-4 py-3 font-bold" :class="user.role==='student'?'text-blue-600':'text-green-600'">{{ user.role }}</td><td class="px-4 py-3">{{ user.name }} <span v-if="user.studentId">({{ user.studentId }})</span></td><td class="px-4 py-3">{{ user.email }}</td></tr></tbody></table></div>
    </div>

    <div v-else class="upload-section">
      <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h4 class="font-bold text-blue-800 mb-2">💡 입력 가이드 (엑셀 붙여넣기 가능)</h4>
        <div class="text-xs text-gray-600 font-mono bg-white p-3 rounded border">
          <span class="text-blue-600 font-bold">// 학생: 학번(5자리), 이름, 성별</span><br>
          10901, 김철수, 남 &rarr; 10901@{{ store.config.domain }}<br>
          <span class="text-green-600 font-bold">// 교사: teacher, 이메일, 이름</span><br>
          teacher, t1@test.com, 박선생
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <textarea v-model="manualInputText" rows="12" class="w-full p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="여기에 입력하세요..."></textarea>
          <div class="flex items-center gap-2"><span class="text-xs text-gray-500 font-bold">파일 업로드:</span><input type="file" ref="csvInput" @change="handleFileUpload" accept=".csv" class="text-xs text-gray-500"/></div>
          <button @click="handleManualPreview" class="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">미리보기</button>
          <p v-if="parseError" class="text-red-500 text-sm">{{ parseError }}</p>
        </div>
        <div class="border rounded-lg bg-white overflow-hidden flex flex-col h-[400px]">
          <div class="bg-gray-100 px-4 py-2 border-b font-bold text-xs text-gray-600">등록 대기 ({{ parsedUsers.length }}명)</div>
          <div class="flex-1 overflow-y-auto p-0">
            <table v-if="parsedUsers.length > 0" class="w-full text-sm text-left">
              <thead class="bg-gray-50 sticky top-0"><tr><th class="p-2 border-b">구분</th><th class="p-2 border-b">이름</th><th class="p-2 border-b">이메일</th><th class="p-2 border-b">비번</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in parsedUsers" :key="i" class="border-b">
                  <td class="p-2 font-bold" :class="u.role==='student'?'text-blue-600':'text-green-600'">{{ u.role === 'student' ? '학생' : '교사' }}</td>
                  <td class="p-2">{{ u.name }}</td><td class="p-2 text-xs">{{ u.email }}</td><td class="p-2 text-xs text-gray-400">{{ u.password }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>
          </div>
          <div class="p-3 border-t bg-gray-50">
            <button @click="handleBulkRegister" :disabled="parsedUsers.length === 0 || store.loading" class="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex justify-center items-center"><Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-2"/>최종 등록하기</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>