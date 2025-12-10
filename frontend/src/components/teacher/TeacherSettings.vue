<script setup>
import { ref, reactive, onMounted } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db, getAppId } from '../../firebase';
import { Settings, Plus, X, Save, Loader2, Key } from 'lucide-vue-next';

const props = defineProps({
  user: { type: Object, required: true },
  userData: { type: Object, required: true }
});

const isSaving = ref(false);

// 설정 폼 데이터
const form = reactive({
  duties: [],    // 담당 업무
  subjects: [],  // 담당 교과
  clubs: [],     // 담당 동아리
  apiKeys: {
    gemini: '',
    gpt: ''
  }
});

// 입력 상태 (임시 저장용)
const inputState = reactive({
  duty: '',
  subject: '',
  club: ''
});

// 초기 데이터 로드
onMounted(() => {
  if (props.userData) {
    form.duties = props.userData.duties || [];
    form.subjects = props.userData.subjects || [];
    form.clubs = props.userData.clubs || [];
    form.apiKeys.gemini = props.userData.apiKeys?.gemini || '';
    form.apiKeys.gpt = props.userData.apiKeys?.gpt || '';
  }
});

// 태그 추가 함수
const addTag = (type) => {
  const val = inputState[type].trim();
  if (!val) return;
  
  // 중복 체크 후 추가
  if (type === 'duty' && !form.duties.includes(val)) form.duties.push(val);
  if (type === 'subject' && !form.subjects.includes(val)) form.subjects.push(val);
  if (type === 'club' && !form.clubs.includes(val)) form.clubs.push(val);
  
  inputState[type] = ''; // 입력창 초기화
};

// 태그 삭제 함수
const removeTag = (type, index) => {
  if (type === 'duty') form.duties.splice(index, 1);
  if (type === 'subject') form.subjects.splice(index, 1);
  if (type === 'club') form.clubs.splice(index, 1);
};

// 저장 함수
const handleSave = async () => {
  if (!confirm("설정을 저장하시겠습니까?")) return;
  
  isSaving.value = true;
  try {
    const appId = getAppId();
    const userRef = doc(db, 'artifacts', appId, 'users', props.user.uid);
    
    await updateDoc(userRef, {
      duties: form.duties,
      subjects: form.subjects,
      clubs: form.clubs,
      apiKeys: form.apiKeys
    });
    
    alert("저장되었습니다.");
  } catch (e) {
    console.error(e);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
      <Settings class="w-6 h-6 text-gray-700"/>
      <h2 class="text-xl font-bold text-gray-800">교사 환경 설정</h2>
    </div>

    <div class="space-y-8">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="input-group">
          <label>담당 업무</label>
          <div class="input-wrapper">
            <input 
              v-model="inputState.duty" 
              @keyup.enter="addTag('duty')" 
              placeholder="예: 생활지도, 정보부" 
              class="tag-input"
            />
            <button @click="addTag('duty')" class="add-btn"><Plus class="w-4 h-4"/></button>
          </div>
          <div class="tags-area">
            <span v-for="(tag, i) in form.duties" :key="i" class="tag bg-blue-50 text-blue-700 border-blue-100">
              {{ tag }}
              <button @click="removeTag('duty', i)" class="remove-btn"><X class="w-3 h-3"/></button>
            </span>
            <span v-if="form.duties.length === 0" class="no-tag">등록된 업무 없음</span>
          </div>
        </div>

        <div class="input-group">
          <label>담당 교과</label>
          <div class="input-wrapper">
            <input 
              v-model="inputState.subject" 
              @keyup.enter="addTag('subject')" 
              placeholder="예: 수학, 국어" 
              class="tag-input"
            />
            <button @click="addTag('subject')" class="add-btn"><Plus class="w-4 h-4"/></button>
          </div>
          <div class="tags-area">
            <span v-for="(tag, i) in form.subjects" :key="i" class="tag bg-green-50 text-green-700 border-green-100">
              {{ tag }}
              <button @click="removeTag('subject', i)" class="remove-btn"><X class="w-3 h-3"/></button>
            </span>
            <span v-if="form.subjects.length === 0" class="no-tag">등록된 교과 없음</span>
          </div>
        </div>

        <div class="input-group">
          <label>담당 동아리</label>
          <div class="input-wrapper">
            <input 
              v-model="inputState.club" 
              @keyup.enter="addTag('club')" 
              placeholder="예: 코딩반, 축구부" 
              class="tag-input"
            />
            <button @click="addTag('club')" class="add-btn"><Plus class="w-4 h-4"/></button>
          </div>
          <div class="tags-area">
            <span v-for="(tag, i) in form.clubs" :key="i" class="tag bg-purple-50 text-purple-700 border-purple-100">
              {{ tag }}
              <button @click="removeTag('club', i)" class="remove-btn"><X class="w-3 h-3"/></button>
            </span>
            <span v-if="form.clubs.length === 0" class="no-tag">등록된 동아리 없음</span>
          </div>
        </div>
      </div>

      <div class="pt-6 border-t border-gray-100">
        <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center">
          <Key class="w-4 h-4 mr-2"/> AI API 연동 설정
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="sub-label">Gemini API Key</label>
            <input 
              type="password" 
              v-model="form.apiKeys.gemini" 
              placeholder="Google Gemini API Key 입력"
              class="api-input"
            />
          </div>
          <div>
            <label class="sub-label">GPT API Key</label>
            <input 
              type="password" 
              v-model="form.apiKeys.gpt" 
              placeholder="OpenAI GPT API Key 입력"
              class="api-input"
            />
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2">* API Key는 암호화되지 않은 상태로 저장되니 개인 기기에서만 사용하세요.</p>
      </div>

      <div class="flex justify-end pt-4">
        <button 
          @click="handleSave" 
          :disabled="isSaving" 
          class="flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition disabled:opacity-50"
        >
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin mr-2"/>
          <Save v-else class="w-4 h-4 mr-2"/>
          설정 저장
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.input-group label { display: block; font-size: 0.9rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
.sub-label { display: block; font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 0.3rem; }

.input-wrapper { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.tag-input { flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.9rem; outline: none; transition: border 0.2s; }
.tag-input:focus { border-color: #3b82f6; }
.add-btn { padding: 0.5rem; background: #f3f4f6; border-radius: 0.375rem; border: 1px solid #e5e7eb; cursor: pointer; color: #4b5563; transition: background 0.2s; }
.add-btn:hover { background: #e5e7eb; }

.tags-area { display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 2rem; }
.tag { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; border: 1px solid; }
.remove-btn { margin-left: 0.3rem; cursor: pointer; opacity: 0.6; }
.remove-btn:hover { opacity: 1; }
.no-tag { font-size: 0.8rem; color: #9ca3af; padding: 0.25rem 0; }

.api-input { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-family: monospace; outline: none; }
.api-input:focus { border-color: #3b82f6; ring: 2px solid #eff6ff; }
</style>