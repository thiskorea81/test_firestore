<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSystemStore } from '../../stores/systemStore';
import { Users, RefreshCw, Lock, Search, FileText, Upload, Loader2, AlertCircle, Settings } from 'lucide-vue-next';
import StudentDetailModal from './student/StudentDetailModal.vue';
import EditProfileModal from '../dashboard/parts/EditProfileModal.vue'; 
// [신규] 성적 업로드 모달 임포트
import GradeUploadModal from '../grade/GradeUploadModal.vue';

const props = defineProps({ teacherData: Object, user: Object });
const store = useSystemStore();

const activeTab = ref('list');
const selectedIds = ref(new Set());
const searchQuery = ref('');
const selectedStudent = ref(null);
const showEditProfile = ref(false); 
const showGradeUploadModal = ref(false); // [신규] 모달 상태

// [핵심] 담당 학급 설정 여부 확인
const hasClassInfo = computed(() => {
  return props.teacherData?.assignedGrade && props.teacherData?.assignedClass;
});

const loadStudents = () => {
  if (!hasClassInfo.value) return; 
  store.fetchClassStudents(props.teacherData.assignedGrade, props.teacherData.assignedClass);
  store.fetchConfig();
};

onMounted(loadStudents);

// 검색 필터링
const filteredList = computed(() => {
  if (!searchQuery.value) return store.userList;
  return store.userList.filter(u => u.name.includes(searchQuery.value));
});

const isAllSelected = computed(() => filteredList.value.length > 0 && filteredList.value.every(u => selectedIds.value.has(u.id)));
const toggleSelectAll = () => {
  if (isAllSelected.value) selectedIds.value.clear();
  else filteredList.value.forEach(u => selectedIds.value.add(u.id));
};
const toggleSelect = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
};

// --- 일괄 등록 로직 (기존과 동일) ---
const csvInput = ref(null);
const manualInputText = ref('');
const parsedUsers = ref([]);

const parseInputText = (text) => {
  const lines = text.split('\n');
  const result = [];
  const domain = store.config.domain || 'school.kr';
  
  lines.forEach(line => {
    const cols = line.split(/,|\t/).map(c => c.trim()).filter(c => c !== '');
    if (cols.length < 3) return;

    const numberStr = cols[0].padStart(2, '0');
    const nameStr = cols[1];
    const genderStr = cols[2];
    
    // 이메일 자동 생성
    const studentId = `${props.teacherData.assignedGrade}${props.teacherData.assignedClass}${numberStr}`;
    const email = `${studentId}@${domain}`;

    result.push({
      role: 'student',
      grade: props.teacherData.assignedGrade,
      class: props.teacherData.assignedClass,
      number: numberStr,
      name: nameStr,
      gender: (genderStr === '남' || genderStr === 'male') ? 'male' : 'female',
      email: email,
      studentId: studentId,
      password: '123456'
    });
  });
  
  parsedUsers.value = result;
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
  parsedUsers.value = []; manualInputText.value = ''; activeTab.value = 'list'; loadStudents();
};

const handleBatchDelete = async () => { if(!confirm('삭제?')) return; await store.bulkDeleteUsers([...store.userList.filter(u=>selectedIds.value.has(u.id))]); selectedIds.value.clear(); loadStudents(); };
const handleBatchArchive = async () => { if(!confirm('보관?')) return; await store.bulkArchiveUsers([...store.userList.filter(u=>selectedIds.value.has(u.id))]); selectedIds.value.clear(); loadStudents(); };
const handleResetPW = async (u) => { await store.resetUserPassword(u); loadStudents(); };
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold flex items-center text-gray-800">
        <Users class="w-6 h-6 mr-2 text-blue-600"/> 
        <span v-if="hasClassInfo">{{ teacherData.assignedGrade }}학년 {{ teacherData.assignedClass }}반 학생 관리</span>
        <span v-else>학급 학생 관리</span>
      </h2>
      <div class="flex gap-2">
         <button v-if="hasClassInfo" @click="showGradeUploadModal = true" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-bold text-sm shadow-sm">
          <Upload class="w-4 h-4" /> 성적 업로드
        </button>

        <div class="flex bg-gray-100 p-1 rounded-lg">
          <button @click="activeTab='list'" :class="['px-4 py-2 rounded font-bold text-sm', activeTab==='list'?'bg-white shadow text-blue-600':'text-gray-500']">명단 관리</button>
          <button @click="activeTab='upload'" :class="['px-4 py-2 rounded font-bold text-sm', activeTab==='upload'?'bg-white shadow text-blue-600':'text-gray-500']">일괄 등록</button>
        </div>
      </div>
    </div>

    <div v-if="!hasClassInfo" class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
      <AlertCircle class="w-12 h-12 text-yellow-500 mx-auto mb-3"/>
      <h3 class="text-lg font-bold text-gray-800 mb-2">담당 학급 정보가 없습니다.</h3>
      <p class="text-gray-600 mb-6">학생 목록을 불러오려면 먼저 담당 학년과 반을 설정해야 합니다.</p>
      <button @click="showEditProfile = true" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center mx-auto">
        <Settings class="w-4 h-4 mr-2"/> 내 정보 수정하기
      </button>
    </div>

    <div v-else-if="activeTab==='list'">
      <div class="flex gap-2 mb-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
          <input v-model="searchQuery" type="text" placeholder="이름 검색" class="w-full pl-9 pr-4 py-2 border rounded-lg outline-none"/>
        </div>
        <button @click="loadStudents" class="px-3 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw class="w-4 h-4"/></button>
      </div>

      <div v-if="selectedIds.size > 0" class="flex items-center gap-2 mb-4 p-2 bg-blue-50 border border-blue-100 rounded text-sm">
        <span class="font-bold text-blue-800 ml-2">{{ selectedIds.size }}명 선택</span>
        <div class="flex-1"></div>
        <button @click="handleBatchArchive" class="flex items-center px-3 py-1 bg-white border rounded hover:bg-gray-50">보관</button>
        <button @click="handleBatchDelete" class="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">삭제</button>
      </div>

      <div class="overflow-x-auto border rounded-lg">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-700 uppercase">
            <tr>
              <th class="px-4 py-3 w-10 text-center"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"/></th>
              <th class="px-4 py-3">번호</th>
              <th class="px-4 py-3">이름</th>
              <th class="px-4 py-3">상태</th>
              <th class="px-4 py-3">연락처</th>
              <th class="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in filteredList" :key="user.id" class="hover:bg-gray-50 cursor-pointer" @click="selectedStudent = user">
              <td class="px-4 py-3 text-center" @click.stop><input type="checkbox" :checked="selectedIds.has(user.id)" @change="toggleSelect(user.id)"/></td>
              <td class="px-4 py-3 font-bold">{{ user.number }}</td>
              <td class="px-4 py-3 font-bold text-gray-900">{{ user.name }}</td>
              <td class="px-4 py-3">
                <span v-if="user.status==='active'" class="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs font-bold">가입됨</span>
                <span v-else class="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">대기중</span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ user.phone || '-' }}</td>
              <td class="px-4 py-3 text-center" @click.stop>
                <div class="flex justify-center gap-2">
                  <button @click="selectedStudent = user" class="text-blue-600 p-1.5 bg-blue-50 rounded" title="상세"><FileText class="w-4 h-4"/></button>
                  <button v-if="user.status==='active'" @click="handleResetPW(user)" class="text-orange-500 p-1.5 bg-orange-50 rounded" title="비번 초기화"><Lock class="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-400">등록된 학생이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="p-4 border rounded bg-gray-50">
       <h4 class="font-bold mb-4 flex items-center text-gray-800"><Upload class="w-5 h-5 mr-2"/> 학생 일괄 등록</h4>
       <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex flex-col gap-3">
          <textarea v-model="manualInputText" rows="12" class="w-full p-3 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="붙여넣기..."></textarea>
          <div class="flex items-center gap-2"><span class="text-xs text-gray-500 font-bold">파일:</span><input type="file" ref="csvInput" @change="handleFileUpload" accept=".csv" class="text-xs"/></div>
          <button @click="handleManualPreview" class="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">미리보기</button>
        </div>
        <div class="border rounded-lg bg-white overflow-hidden flex flex-col h-[400px]">
          <div class="bg-gray-100 px-4 py-2 border-b font-bold text-xs text-gray-600">미리보기 ({{ parsedUsers.length }}명)</div>
          <div class="flex-1 overflow-y-auto p-0">
            <table v-if="parsedUsers.length > 0" class="w-full text-sm text-left">
              <thead class="bg-gray-50 sticky top-0"><tr><th class="p-2 border-b">번호</th><th class="p-2 border-b">이름</th><th class="p-2 border-b">성별</th><th class="p-2 border-b">이메일</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in parsedUsers" :key="i"><td class="p-2">{{ u.number }}</td><td class="p-2 font-bold">{{ u.name }}</td><td class="p-2">{{ u.gender }}</td><td class="p-2 text-xs text-gray-500">{{ u.email }}</td></tr>
              </tbody>
            </table>
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">입력 후 미리보기를 누르세요.</div>
          </div>
          <div class="p-3 border-t bg-gray-50">
            <button @click="handleBulkRegister" :disabled="parsedUsers.length === 0 || store.loading" class="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex justify-center items-center"><Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-2"/>최종 등록하기</button>
          </div>
        </div>
      </div>
    </div>

    <StudentDetailModal v-if="selectedStudent" :student="selectedStudent" @close="selectedStudent = null" @update="loadStudents" />
    <EditProfileModal v-if="showEditProfile" :user="user" :userData="teacherData" safeRole="teacher" @close="showEditProfile = false" />
    
    <GradeUploadModal 
      v-if="showGradeUploadModal"
      :isOpen="showGradeUploadModal"
      :grade="teacherData.assignedGrade"
      :classNum="teacherData.assignedClass"
      @close="showGradeUploadModal = false"
    />
  </div>
</template>