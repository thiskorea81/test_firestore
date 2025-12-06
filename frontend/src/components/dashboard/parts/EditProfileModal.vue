<script setup>
import { reactive, ref, onMounted } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, getAppId } from '../../../firebase';
import { X, Save, Loader2, Phone, PenTool } from 'lucide-vue-next';
import SignaturePad from '../../SignaturePad.vue';

const props = defineProps({
  user: Object,
  userData: Object,
  safeRole: String,
  forceOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['close']);
const isSaving = ref(false);
const sigPadRef = ref(null);

const editForm = reactive({
  name: '', phone: '', gender: 'male',
  grade: '', class: '', number: '',
  parentName: '', parentPhone: '', childName: '',
  teacherSignature: ''
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
    editForm.teacherSignature = d.teacherSignature || '';
  }
});

const handleUpdate = async () => {
  if (!confirm('저장하시겠습니까?')) return;
  
  isSaving.value = true;
  try {
    const appId = getAppId();
    // [중요] 경로 수정: users/{uid}
    const userRef = doc(db, 'artifacts', appId, 'users', props.user.uid);

    let updates = { name: editForm.name, phone: editForm.phone };

    if (props.safeRole === 'teacher' && sigPadRef.value && !sigPadRef.value.isEmpty()) {
      const sigData = sigPadRef.value.getSignatureData();
      const res = await fetch(sigData);
      const blob = await res.blob();
      const fileRef = storageRef(storage, `artifacts/${appId}/signatures/${props.user.uid}_${Date.now()}.png`);
      const snapshot = await uploadBytes(fileRef, blob);
      updates.teacherSignature = await getDownloadURL(snapshot.ref);
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
      updates = { ...updates, assignedGrade: String(editForm.grade), assignedClass: String(editForm.class).padStart(2, '0') };
    } else if (props.safeRole === 'parent') {
      updates = { ...updates, childName: editForm.childName };
    }

    if (props.forceOpen) {
      updates.isNewUser = false;
    }

    await updateDoc(userRef, updates);
    alert('저장되었습니다.');
    window.location.reload(); 
  } catch (error) {
    console.error(error);
    alert("오류가 발생했습니다.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ forceOpen ? '필수 정보 입력' : '내 정보 수정' }}</h3>
        <button v-if="!forceOpen" @click="$emit('close')"><X class="w-5 h-5 text-gray-500" /></button>
      </div>
      
      <div v-if="forceOpen" class="bg-yellow-50 p-4 text-sm text-yellow-800 border-b border-yellow-100 font-bold text-center">
        👋 환영합니다!<br>원활한 서비스 이용을 위해 나머지 정보를 입력해주세요.
      </div>

      <div class="modal-body">
        <div class="form-group"><label>이름</label><input type="text" v-model="editForm.name" class="input-field" /></div>

        <template v-if="safeRole === 'student'">
           <div class="form-group"><label>성별</label><div class="flex gap-4 p-2 bg-gray-50 rounded border border-gray-200"><label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="editForm.gender" value="male"> 남</label><label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="editForm.gender" value="female"> 여</label></div></div>
           <div class="form-group"><label>학년/반/번호</label><div class="flex gap-2"><input type="number" v-model="editForm.grade" class="input-field"/><input type="number" v-model="editForm.class" class="input-field"/><input type="number" v-model="editForm.number" class="input-field"/></div></div>
           <div class="form-group"><label>학생 연락처</label><input type="tel" v-model="editForm.phone" class="input-field"/></div>
           <div class="p-3 bg-gray-50 rounded border mt-2"><p class="text-xs font-bold mb-2">보호자 정보</p><input type="text" v-model="editForm.parentName" placeholder="성함" class="input-field mb-2"/><input type="tel" v-model="editForm.parentPhone" placeholder="연락처" class="input-field"/></div>
        </template>

        <template v-if="safeRole === 'teacher'">
           <div class="form-group"><label>담당 학급</label><div class="flex gap-2"><input type="number" v-model="editForm.grade" class="input-field"/><input type="number" v-model="editForm.class" class="input-field"/></div></div>
           <div class="mt-4 pt-4 border-t"><label class="text-sm font-bold block mb-2">서명 등록</label><div v-if="editForm.teacherSignature" class="mb-2 text-center"><img :src="editForm.teacherSignature" class="h-8 mx-auto"/></div><div class="border rounded"><SignaturePad ref="sigPadRef"/></div></div>
        </template>

        <template v-if="safeRole === 'parent'">
           <input type="text" v-model="editForm.childName" placeholder="자녀이름" class="input-field mb-2"/>
           <input type="tel" v-model="editForm.phone" placeholder="연락처" class="input-field"/>
        </template>
      </div>

      <div class="modal-footer">
        <button @click="handleUpdate" :disabled="isSaving" class="save-btn">
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin mr-1" />
          <span v-else><Save class="w-4 h-4 mr-1 inline" /> {{ forceOpen ? '입력 완료 및 시작' : '저장하기' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: white; width: 90%; max-width: 400px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
.modal-footer { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }
.input-field { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
.save-btn { width: 100%; background: #2563eb; color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; }
.input-icon-wrapper { position: relative; }
.input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #9ca3af; }
.pl-9 { padding-left: 2.25rem; }
</style>