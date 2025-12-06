<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { Upload, Users, Loader2, RefreshCw, Trash2, Search, UserCheck, Clock, Archive, CheckSquare } from 'lucide-vue-next';

const store = useSystemStore();
const activeTab = ref('list');
const searchQuery = ref('');

// 선택된 사용자 ID들을 저장하는 Set
const selectedIds = ref(new Set());

onMounted(() => {
  store.fetchAllUsers();
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.userList;
  const q = searchQuery.value.toLowerCase();
  return store.userList.filter(u => 
    u.name?.toLowerCase().includes(q) || 
    u.email?.toLowerCase().includes(q)
  );
});

// [체크박스 로직]
const isAllSelected = computed(() => {
  return filteredUsers.value.length > 0 && selectedIds.value.size === filteredUsers.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value.clear();
  } else {
    filteredUsers.value.forEach(u => selectedIds.value.add(u.id));
  }
};

const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

// [일괄 작업 핸들러]
const handleBatchDelete = async () => {
  if (!confirm(`선택한 ${selectedIds.value.size}명을 영구 삭제하시겠습니까?`)) return;
  const targets = store.userList.filter(u => selectedIds.value.has(u.id));
  await store.bulkDeleteUsers(targets);
  selectedIds.value.clear();
};

const handleBatchArchive = async () => {
  if (!confirm(`선택한 ${selectedIds.value.size}명을 보관함으로 이동하시겠습니까?\n(목록에서 사라지며 로그인이 차단됩니다)`)) return;
  const targets = store.userList.filter(u => selectedIds.value.has(u.id));
  await store.bulkArchiveUsers(targets);
  selectedIds.value.clear();
};

// --- CSV 로직 (기존 유지) ---
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
      if (gender !== 'male' && gender !== 'female') { errorCount++; return; }
    }
    const defaultPassword = role === 'student' ? '123456' : '654321';

    result.push({ role, email: cols[1], name: cols[2], studentId: role === 'student' ? cols[3] : null, gender, password: defaultPassword });
  });
  
  parsedUsers.value = result;
  if (errorCount > 0) parseError.value = `${errorCount}행 오류 제외됨`;
};

const handleBulkRegister = async () => {
  if (!confirm(`등록하시겠습니까?`)) return;
  await store.bulkCreateUsers(parsedUsers.value);
  parsedUsers.value = [];
  if (csvInput.value) csvInput.value.value = '';
  activeTab.value = 'list';
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
      
      <div class="flex gap-2 mb-4 items-center">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
          <input v-model="searchQuery" type="text" placeholder="이름, 이메일, 학번 검색" class="w-full pl-9 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <button @click="store.fetchAllUsers()" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><RefreshCw class="w-4 h-4"/></button>
      </div>

      <div v-if="selectedIds.size > 0" class="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in">
        <span class="text-sm font-bold text-blue-800 ml-2">{{ selectedIds.size }}명 선택됨</span>
        <div class="flex-1"></div>
        <button @click="handleBatchArchive" class="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50">
          <Archive class="w-4 h-4 mr-1"/> 일괄 보관
        </button>
        <button @click="handleBatchDelete" class="flex items-center px-3 py-1.5 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700">
          <Trash2 class="w-4 h-4 mr-1"/> 일괄 삭제
        </button>
      </div>

      <div class="overflow-x-auto bg-white border rounded-lg shadow-sm">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-700 uppercase">
            <tr>
              <th class="px-4 py-3 w-10 text-center">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="w-4 h-4 rounded cursor-pointer"/>
              </th>
              <th class="px-4 py-3">상태</th>
              <th class="px-4 py-3">구분</th>
              <th class="px-4 py-3">이름/정보</th>
              <th class="px-4 py-3">이메일</th>
              <th class="px-4 py-3 text-center">개별관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50" :class="{'bg-blue-50': selectedIds.has(user.id)}">
              <td class="px-4 py-3 text-center">
                <input type="checkbox" :checked="selectedIds.has(user.id)" @change="toggleSelection(user.id)" class="w-4 h-4 rounded cursor-pointer"/>
              </td>
              <td class="px-4 py-3">
                <span v-if="user.status === 'active'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><UserCheck class="w-3 h-3 mr-1"/> 활동</span>
                <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock class="w-3 h-3 mr-1"/> 대기</span>
              </td>
              <td class="px-4 py-3 font-bold" :class="user.role==='student'?'text-blue-600':'text-green-600'">{{ user.role === 'teacher' ? '교사' : '학생' }}</td>
              <td class="px-4 py-3">
                <div class="font-bold text-gray-900">{{ user.name }}</div>
                <div v-if="user.role === 'student'" class="text-xs text-gray-500">{{ user.grade }}학년 {{ user.class }}반 {{ user.number }}번</div>
                <div v-if="user.role === 'teacher'" class="text-xs text-gray-500">담당: {{ user.assignedGrade }}-{{ user.assignedClass }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex justify-center gap-2">
                  <button v-if="user.status === 'active'" @click="store.resetUserPassword(user)" class="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="비번 초기화"><RefreshCw class="w-4 h-4"/></button>
                  <button @click="store.deleteUser(user)" class="p-1.5 text-red-500 hover:bg-red-50 rounded" title="삭제"><Trash2 class="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-400">데이터가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="upload-section">
      <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h4 class="font-bold text-blue-800 mb-2 flex items-center"><Users class="w-4 h-4 mr-2"/> CSV 업로드 안내</h4>
        <div class="bg-white p-3 rounded border border-blue-100 text-xs font-mono text-gray-600">
          <span class="text-blue-600 font-bold">// 학생: role, email, name, studentId, gender</span><br>
          student, s1@s.com, 홍길동, 10101, male<br>
          <span class="text-green-600 font-bold">// 교사: role, email, name</span><br>
          teacher, t1@s.com, 박선생,
        </div>
      </div>
      <input type="file" ref="csvInput" @change="handleFileUpload" accept=".csv" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"/>
      <p v-if="parseError" class="text-red-500 text-sm mb-4">{{ parseError }}</p>
      <div v-if="parsedUsers.length > 0" class="overflow-x-auto mb-6 border rounded-lg">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50"><tr><th class="px-4 py-2">이름</th><th class="px-4 py-2">이메일</th><th class="px-4 py-2">정보</th></tr></thead>
          <tbody>
            <tr v-for="(u, idx) in parsedUsers" :key="idx" class="border-t">
              <td class="px-4 py-2">{{ u.name }}</td><td class="px-4 py-2">{{ u.email }}</td><td class="px-4 py-2 text-gray-500">{{ u.role }} / {{ u.studentId || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end p-2">
          <button @click="handleBulkRegister" :disabled="store.loading" class="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center"><Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-2"/> 등록 실행</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.2s ease-out; }
</style>