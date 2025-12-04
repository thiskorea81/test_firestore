<script setup>
import { reactive, ref, onMounted } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, getAppId } from '../../../firebase';
import { X, Save, Loader2, Phone, PenTool } from 'lucide-vue-next';
import SignaturePad from '../../SignaturePad.vue'; // 서명 패드 재사용

const props = defineProps({
  user: Object,
  userData: Object,
  safeRole: String
});

const emit = defineEmits(['close']);

const isSaving = ref(false);
const sigPadRef = ref(null); // 서명 패드 참조

const editForm = reactive({
  name: '', phone: '', gender: 'male',
  grade: '', class: '', number: '',
  parentName: '', parentPhone: '', childName: '',
  teacherSignature: '' // 기존 서명 URL
});

onMounted(() => {
  if (props.userData) {
    const d = props.userData;
    editForm.name = d.name || '';
    editForm.phone = d.phone || '';
    editForm.gender = d.gender || 'male';
    editForm.grade = d.grade || d.assignedGrade || '';
    editForm.class = d.class || d.assignedClass || '';
    editForm.number = d.number || '';
    editForm.parentName = d.parentName || '';
    editForm.parentPhone = d.parentPhone || '';
    editForm.childName = d.childName || '';
    editForm.teacherSignature = d.teacherSignature || ''; // 기존 서명 불러오기
  }
});

const handleUpdate = async () => {
  if (!confirm('정보를 수정하시겠습니까?')) return;
  
  isSaving.value = true;
  try {
    const appId = getAppId();
    const userRef = doc(db, 'artifacts', appId, 'users', props.user.uid, 'profile', 'info');

    let updates = { name: editForm.name, phone: editForm.phone };

    // [추가] 교사 서명 업로드 로직
    if (props.safeRole === 'teacher' && sigPadRef.value && !sigPadRef.value.isEmpty()) {
      const sigData = sigPadRef.value.getSignatureData(); // base64 데이터
      // base64 -> Blob 변환
      const res = await fetch(sigData);
      const blob = await res.blob();
      
      const fileRef = storageRef(storage, `artifacts/${appId}/signatures/${props.user.uid}_${Date.now()}.png`);
      const snapshot = await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      updates.teacherSignature = downloadURL; // URL 저장
    }

    if (props.safeRole === 'student') {
      const fGrade = String(editForm.grade);
      const fClass = String(editForm.class).padStart(2, '0');
      const fNum = String(editForm.number).padStart(2, '0');
      updates = {
        ...updates,
        grade: fGrade, class: fClass, number: fNum,
        studentId: `${fGrade}${fClass}${fNum}`,
        parentName: editForm.parentName,
        parentPhone: editForm.parentPhone,
        gender: editForm.gender
      };
    } else if (props.safeRole === 'teacher') {
      updates = {
        ...updates,
        assignedGrade: String(editForm.grade),
        assignedClass: String(editForm.class).padStart(2, '0')
      };
    } else if (props.safeRole === 'parent') {
      updates = { ...updates, childName: editForm.childName };
    }

    await updateDoc(userRef, updates);
    alert('수정 완료되었습니다.');
    window.location.reload(); 
  } catch (error) {
    console.error(error);
    alert("오류가 발생했습니다: " + error.message);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>내 정보 수정</h3>
        <button @click="$emit('close')"><X class="w-5 h-5 text-gray-500" /></button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>이름</label>
          <input type="text" v-model="editForm.name" class="input-field" />
        </div>

        <template v-if="safeRole === 'student'">
          <div class="form-group">
            <label>성별</label>
            <div class="flex gap-4 p-2 bg-gray-50 rounded border border-gray-200">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="editForm.gender" value="male"> <span class="text-sm">남학생</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="editForm.gender" value="female"> <span class="text-sm">여학생</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>학년 / 반 / 번호</label>
            <div class="flex gap-2">
              <input type="number" v-model="editForm.grade" placeholder="학년" class="input-field" />
              <input type="number" v-model="editForm.class" placeholder="반" class="input-field" />
              <input type="number" v-model="editForm.number" placeholder="번호" class="input-field" />
            </div>
          </div>
          <div class="form-group">
            <label>학생 연락처</label>
            <div class="input-icon-wrapper">
              <Phone class="input-icon" />
              <input type="tel" v-model="editForm.phone" class="input-field pl-9" />
            </div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg mt-2 border border-gray-200">
            <p class="text-xs font-bold text-gray-600 mb-2">보호자 정보 수정</p>
            <div class="form-group mb-2">
              <input type="text" v-model="editForm.parentName" placeholder="보호자 성함" class="input-field" />
            </div>
            <div class="form-group">
              <div class="input-icon-wrapper">
                <Phone class="input-icon" />
                <input type="tel" v-model="editForm.parentPhone" placeholder="보호자 연락처" class="input-field pl-9" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="safeRole === 'teacher'">
          <div class="form-group">
            <label>담당 학년 / 반</label>
            <div class="flex gap-2">
              <input type="number" v-model="editForm.grade" placeholder="학년" class="input-field" />
              <input type="number" v-model="editForm.class" placeholder="반" class="input-field" />
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-100">
            <label class="flex items-center text-sm font-bold text-gray-700 mb-2">
              <PenTool class="w-4 h-4 mr-1"/> 나의 도장/서명 등록
            </label>
            
            <div v-if="editForm.teacherSignature" class="mb-2 p-2 bg-blue-50 border border-blue-100 rounded text-center">
              <p class="text-xs text-blue-600 mb-1">현재 등록된 서명</p>
              <img :src="editForm.teacherSignature" class="h-10 mx-auto" alt="Current Signature" />
            </div>

            <div class="border rounded-lg overflow-hidden">
              <SignaturePad ref="sigPadRef" />
            </div>
            <p class="text-xs text-gray-400 mt-1">※ 새로 그리면 기존 서명이 덮어씌워집니다.</p>
          </div>
        </template>

        <template v-if="safeRole === 'parent'">
            <div class="form-group">
            <label>자녀 이름</label>
            <input type="text" v-model="editForm.childName" class="input-field" />
          </div>
          <div class="form-group">
            <label>학부모 연락처</label>
            <div class="input-icon-wrapper">
              <Phone class="input-icon" />
              <input type="tel" v-model="editForm.phone" class="input-field pl-9" />
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button @click="handleUpdate" :disabled="isSaving" class="save-btn">
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin mr-1" />
          <span v-else><Save class="w-4 h-4 mr-1 inline" /> 저장하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; width: 90%; max-width: 400px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #374151; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
.modal-footer { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #4b5563; }
.input-field { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; }
.input-field:focus { border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
.input-icon-wrapper { position: relative; }
.input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; }
.pl-9 { padding-left: 2.25rem; }
.save-btn { width: 100%; background: #2563eb; color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; }
.save-btn:hover:not(:disabled) { background: #1d4ed8; }
.save-btn:disabled { opacity: 0.7; }
</style>