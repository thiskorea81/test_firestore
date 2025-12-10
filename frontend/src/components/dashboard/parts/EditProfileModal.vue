<script setup>
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, getAppId } from '../../../firebase';
// [추가] Upload, Image 아이콘 import
import { X, Save, Loader2, Phone, PenTool, Upload, Image as ImageIcon } from 'lucide-vue-next';
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

// [신규] 서명 관련 상태 추가
const signatureMode = ref('draw'); // 'draw' 또는 'upload'
const signatureFile = ref(null);
const signaturePreviewUrl = ref(null);
const signatureFileInput = ref(null);

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

// [신규] 컴포넌트 언마운트 시 미리보기 URL 리소스 해제
onUnmounted(() => {
  if (signaturePreviewUrl.value) {
    URL.revokeObjectURL(signaturePreviewUrl.value);
  }
});

// [신규] 파일 업로드 처리 핸들러
const handleSignatureFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 이미지 파일 타입 체크
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.');
    signatureFileInput.value.value = ''; // 입력창 초기화
    return;
  }

  signatureFile.value = file;

  // 이전 미리보기 URL 해제 (메모리 누수 방지)
  if (signaturePreviewUrl.value) {
    URL.revokeObjectURL(signaturePreviewUrl.value);
  }
  // 새 미리보기 URL 생성
  signaturePreviewUrl.value = URL.createObjectURL(file);
};

const handleUpdate = async () => {
  if (!confirm('저장하시겠습니까?')) return;
  
  isSaving.value = true;
  try {
    const appId = getAppId();
    const userRef = doc(db, 'artifacts', appId, 'users', props.user.uid);

    let updates = { name: editForm.name, phone: editForm.phone };

    // [수정] 서명 저장 로직 개선 (교사일 경우)
    if (props.safeRole === 'teacher') {
      let blobToUpload = null;
      let fileExtension = 'png'; // 기본 확장자

      // 모드에 따라 저장할 데이터 결정
      if (signatureMode.value === 'upload' && signatureFile.value) {
        // 1. 파일 업로드 모드이고 파일이 선택된 경우
        blobToUpload = signatureFile.value;
        fileExtension = signatureFile.value.name.split('.').pop(); // 원본 파일 확장자 유지
      } else if (signatureMode.value === 'draw' && sigPadRef.value && !sigPadRef.value.isEmpty()) {
        // 2. 그리기 모드이고 캔버스에 그림이 있는 경우
        const sigData = sigPadRef.value.getSignatureData();
        const res = await fetch(sigData);
        blobToUpload = await res.blob();
      }

      // 업로드할 데이터가 있다면 실행
      if (blobToUpload) {
        const fileRef = storageRef(storage, `artifacts/${appId}/signatures/${props.user.uid}_${Date.now()}.${fileExtension}`);
        const snapshot = await uploadBytes(fileRef, blobToUpload);
        updates.teacherSignature = await getDownloadURL(snapshot.ref);
      }
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
           
           <div class="mt-4 pt-4 border-t">
             <label class="text-sm font-bold block mb-2">서명 등록</label>
             
             <div class="flex border rounded overflow-hidden mb-3">
                <button type="button" @click="signatureMode = 'draw'" :class="['flex-1 py-2 text-sm flex justify-center items-center gap-1', signatureMode === 'draw' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">
                  <PenTool class="w-4 h-4"/> 그리기
                </button>
                <button type="button" @click="signatureMode = 'upload'" :class="['flex-1 py-2 text-sm flex justify-center items-center gap-1', signatureMode === 'upload' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">
                  <ImageIcon class="w-4 h-4"/> 이미지 업로드
                </button>
             </div>

             <div v-if="signaturePreviewUrl" class="mb-2 text-center p-2 border border-blue-300 rounded bg-blue-50">
               <p class="text-xs text-blue-600 mb-1 font-bold">새로 업로드될 서명 미리보기</p>
               <img :src="signaturePreviewUrl" class="h-12 mx-auto object-contain"/>
             </div>
             <div v-else-if="editForm.teacherSignature" class="mb-2 text-center">
               <p class="text-xs text-gray-500 mb-1">현재 저장된 서명</p>
               <img :src="editForm.teacherSignature" class="h-12 mx-auto border rounded object-contain bg-gray-50"/>
             </div>

             <div v-show="signatureMode === 'draw'" class="border rounded">
                <SignaturePad ref="sigPadRef"/>
             </div>

             <div v-show="signatureMode === 'upload'" class="border rounded p-3 bg-gray-50">
                <div class="flex items-center justify-center w-full">
                    <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                        <div class="flex flex-col items-center justify-center pt-3 pb-4">
                            <Upload class="w-6 h-6 mb-1 text-gray-500"/>
                            <p class="text-sm text-gray-500 font-bold">클릭하여 이미지 선택</p>
                            <p class="text-xs text-gray-400">(PNG, JPG / 배경이 투명하면 좋습니다)</p>
                        </div>
                        <input id="dropzone-file" ref="signatureFileInput" type="file" accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleSignatureFileUpload" />
                    </label>
                </div>
             </div>

           </div>
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
/* .input-icon-wrapper, .input-icon, .pl-9 등 사용하지 않는 스타일 제거됨 */
</style>