<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';
import { User, Save, MessageSquare, Clock, X, Phone } from 'lucide-vue-next';

const props = defineProps({ student: Object });
const emit = defineEmits(['close', 'update']);

const store = useSystemStore();
const activeTab = ref('info'); // 'info' or 'consultation'

// 정보 수정 폼
const editForm = reactive({ ...props.student });

// 상담 입력 폼
const consultForm = reactive({ date: new Date().toISOString().split('T')[0], type: '생활지도', content: '' });

onMounted(() => {
  if (props.student.status === 'active') { // 가입된 학생만 상담 가능 (ID 필요)
    store.fetchConsultations(props.student.id); // 여기선 id가 uid
  }
});

const handleSaveInfo = async () => {
  if (!confirm('수정하시겠습니까?')) return;
  await store.updateUser(editForm);
  emit('update');
  emit('close');
};

const handleSaveConsult = async () => {
  if (!consultForm.content) return alert("내용을 입력하세요.");
  await store.addConsultation({
    studentId: props.student.id,
    studentName: props.student.name,
    ...consultForm
  });
  consultForm.content = ''; // 초기화
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold flex items-center">
          <User class="w-5 h-5 mr-2"/> {{ student.name }} 학생 상세
        </h3>
        <button @click="$emit('close')"><X class="w-6 h-6 text-gray-500"/></button>
      </div>

      <div class="flex border-b">
        <button @click="activeTab='info'" :class="['flex-1 py-3 font-bold', activeTab==='info'?'text-blue-600 border-b-2 border-blue-600':'text-gray-500']">기본 정보</button>
        <button @click="activeTab='consultation'" :class="['flex-1 py-3 font-bold', activeTab==='consultation'?'text-blue-600 border-b-2 border-blue-600':'text-gray-500']" :disabled="student.status === 'pending'">상담 기록</button>
      </div>

      <div class="modal-body">
        
        <div v-if="activeTab === 'info'" class="space-y-4">
          <div class="grid grid-cols-3 gap-2">
            <div><label>학년</label><input type="number" v-model="editForm.grade" class="input-base"/></div>
            <div><label>반</label><input type="number" v-model="editForm.class" class="input-base"/></div>
            <div><label>번호</label><input type="number" v-model="editForm.number" class="input-base"/></div>
          </div>
          <div><label>이름</label><input type="text" v-model="editForm.name" class="input-base"/></div>
          <div><label>성별</label>
            <select v-model="editForm.gender" class="input-base">
              <option value="male">남학생</option><option value="female">여학생</option>
            </select>
          </div>
          <div><label>학생 연락처</label><input type="tel" v-model="editForm.phone" class="input-base"/></div>
          <div class="pt-2 border-t mt-2">
            <p class="text-sm font-bold text-gray-500 mb-2">보호자 정보</p>
            <div class="space-y-2">
              <input type="text" v-model="editForm.parentName" placeholder="보호자 성함" class="input-base"/>
              <input type="tel" v-model="editForm.parentPhone" placeholder="보호자 연락처" class="input-base"/>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button @click="handleSaveInfo" class="btn-primary"><Save class="w-4 h-4 mr-1"/> 저장하기</button>
          </div>
        </div>

        <div v-if="activeTab === 'consultation'" class="h-full flex flex-col">
          <div v-if="student.status === 'pending'" class="text-center py-10 text-gray-400">가입 대기 중인 학생은 상담을 기록할 수 없습니다.</div>
          <div v-else class="flex-1 overflow-hidden flex flex-col">
            <div class="bg-gray-50 p-3 rounded-lg mb-4 border">
              <div class="flex gap-2 mb-2">
                <input type="date" v-model="consultForm.date" class="input-sm"/>
                <select v-model="consultForm.type" class="input-sm">
                  <option>생활지도</option><option>진로상담</option><option>학습상담</option><option>학부모상담</option><option>기타</option>
                </select>
              </div>
              <textarea v-model="consultForm.content" rows="2" class="w-full p-2 border rounded resize-none text-sm" placeholder="상담 내용을 입력하세요."></textarea>
              <div class="text-right mt-1"><button @click="handleSaveConsult" class="btn-xs">등록</button></div>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1">
              <div v-for="log in store.consultations" :key="log.id" class="border p-3 rounded-lg hover:bg-gray-50">
                <div class="flex justify-between mb-1">
                  <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{ log.type }}</span>
                  <span class="text-xs text-gray-400 flex items-center"><Clock class="w-3 h-3 mr-1"/> {{ log.date }}</span>
                </div>
                <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ log.content }}</p>
              </div>
              <div v-if="store.consultations.length === 0" class="text-center text-gray-400 text-sm py-4">기록이 없습니다.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
.modal-content { background: white; width: 95%; max-width: 500px; height: 80vh; border-radius: 1rem; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
.input-base { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem; font-size: 0.9rem; }
.input-sm { padding: 0.3rem; border: 1px solid #ddd; border-radius: 0.25rem; font-size: 0.85rem; }
.btn-primary { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: bold; display: flex; align-items: center; }
.btn-xs { background: #374151; color: white; padding: 0.2rem 0.6rem; border-radius: 0.2rem; font-size: 0.8rem; }
label { font-size: 0.8rem; color: #6b7280; display: block; margin-bottom: 2px; }
</style>