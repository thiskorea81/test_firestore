<script setup>
import { ref } from 'vue';
import { updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, getAppId } from '../../firebase';
import { Printer, Trash2, X, Check, Ban, PenTool, Loader2 } from 'lucide-vue-next';
import DocumentContent from './common/DocumentContent.vue';
import SignaturePad from '../SignaturePad.vue';

const props = defineProps({ 
  doc: Object, 
  teacherData: Object,
  user: Object // [추가] 서명 업로드용
});
const emit = defineEmits(['close', 'delete', 'open-print', 'update']);

const checkMethod = ref('');
const checkMethodDetail = ref('');
const proofType = ref('');
const proofTypeDetail = ref('');

// 서명 관련 상태
const isSigning = ref(false); // 서명 모드 여부
const sigPadRef = ref(null);
const isSaving = ref(false);

const handleApproveClick = async () => {
  // 1. 필수 입력 체크
  if (!checkMethod.value) return alert('보호자 확인 방법을 선택해주세요.');
  if (checkMethod.value === '기타' && !checkMethodDetail.value) return alert('확인 방법 내용을 입력해주세요.');
  if (!proofType.value) return alert('증빙서류 항목을 선택해주세요.');

  // 2. 서명 여부 체크
  if (!props.teacherData.teacherSignature) {
    // 서명이 없으면 서명 모드 활성화
    isSigning.value = true;
  } else {
    // 서명이 있으면 바로 승인 로직 실행
    processApproval(props.teacherData.teacherSignature);
  }
};

// 서명 저장 및 승인 처리
const saveSignatureAndApprove = async () => {
  if (sigPadRef.value.isEmpty()) return alert("서명을 입력해주세요.");
  
  isSaving.value = true;
  try {
    const appId = getAppId();
    // A. 서명 이미지 업로드
    const sigData = sigPadRef.value.getSignatureData();
    const res = await fetch(sigData);
    const blob = await res.blob();
    const fileRef = storageRef(storage, `artifacts/${appId}/signatures/${props.user.uid}_${Date.now()}.png`);
    const snapshot = await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // B. 교사 프로필에 서명 저장
    await updateDoc(firestoreDoc(db, 'artifacts', appId, 'users', props.user.uid), {
      teacherSignature: downloadURL
    });

    // C. 승인 진행
    await processApproval(downloadURL);

  } catch (e) {
    console.error(e);
    alert("서명 저장 중 오류가 발생했습니다.");
  } finally {
    isSaving.value = false;
  }
};

const processApproval = async (signatureUrl) => {
  if (!confirm(`'승인' 처리하시겠습니까?`)) return;

  try {
    const appId = getAppId();
    await updateDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'submissions', props.doc.id), {
      status: '승인',
      processedAt: new Date(),
      teacherSignature: signatureUrl,
      teacherCheck: {
        method: checkMethod.value,
        methodDetail: checkMethod.value === '기타' ? checkMethodDetail.value : '',
        proofType: proofType.value === '기타' ? proofTypeDetail.value : proofType.value
      }
    });

    // 인쇄용 객체
    const updatedDoc = {
      ...props.doc,
      status: '승인',
      teacherSignature: signatureUrl,
      teacherCheck: { method: checkMethod.value, methodDetail: checkMethodDetail.value, proofType: proofType.value },
      processedAt: new Date()
    };

    alert("승인되었습니다.");
    emit('update');
    emit('close');
    emit('open-print', updatedDoc); // 바로 인쇄창 열기

  } catch (e) {
    console.error(e);
    alert("승인 처리 중 오류가 발생했습니다.");
  }
};

const updateReject = async () => {
  if (!confirm(`'반려' 처리하시겠습니까?`)) return;
  try {
    const appId = getAppId();
    await updateDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'submissions', props.doc.id), {
      status: '반려',
      processedAt: new Date(),
      teacherSignature: null
    });
    alert("반려되었습니다.");
    emit('update'); emit('close');
  } catch (e) { alert("오류 발생"); }
};
</script>

<template>
  <div class="modal-overlay no-print" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold">문서 검토</h3>
        <button @click="$emit('close')"><X class="w-6 h-6"/></button>
      </div>

      <div class="modal-body">
        
        <div v-if="!isSigning">
          <DocumentContent :doc="doc" :teacherData="teacherData" />

          <div class="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-4 flex items-center"><Check class="w-5 h-5 mr-2"/> 담임 확인 (승인 시 필수)</h4>
            <div class="mb-5">
              <p class="text-sm font-bold text-gray-700 mb-2">1. 보호자 확인 방법</p>
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="checkMethod" value="통화" class="mr-1"> 통화</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="checkMethod" value="면담" class="mr-1"> 면담</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="checkMethod" value="기타" class="mr-1"> 기타: <input type="text" v-model="checkMethodDetail" class="ml-1 border border-gray-300 rounded px-2 py-1 text-xs w-40" :disabled="checkMethod !== '기타'"></label>
              </div>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-700 mb-2">2. 증빙서류 처리</p>
              <div class="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="병원진료영수증" class="mr-1"> 병원진료영수증</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="투약봉지" class="mr-1"> 투약봉지</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="병원처방전" class="mr-1"> 병원처방전</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="의료기관 진단서/소견서" class="mr-1"> 의료기관 진단서</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="PCR 결과 통보서" class="mr-1"> PCR 결과</label>
                <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="증빙서류 없음" class="mr-1"> 없음</label>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="p-6 text-center">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-800 mb-2">📢 서명 등록이 필요합니다</h3>
            <p class="text-sm text-gray-500">등록된 서명이 없어 승인할 수 없습니다.<br>아래에 서명(도장)을 입력해주세요.</p>
          </div>
          <div class="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 mb-4">
            <SignaturePad ref="sigPadRef" />
          </div>
          <div class="flex gap-2">
            <button @click="isSigning = false" class="flex-1 py-2 bg-gray-200 rounded font-bold">취소</button>
            <button @click="saveSignatureAndApprove" :disabled="isSaving" class="flex-1 py-2 bg-blue-600 text-white rounded font-bold flex justify-center items-center">
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin mr-2"/> 서명 저장 및 승인
            </button>
          </div>
        </div>

      </div>

      <div v-if="!isSigning" class="modal-footer">
        <div class="flex gap-2">
          <button @click="handleApproveClick" class="btn-action bg-blue-600 text-white hover:bg-blue-700"><Check class="w-4 h-4 mr-1"/>승인 및 인쇄</button>
          <button @click="updateReject" class="btn-action bg-yellow-500 text-white hover:bg-yellow-600"><Ban class="w-4 h-4 mr-1"/>반려</button>
        </div>
        <div class="flex gap-2 ml-auto">
          <button @click="$emit('open-print', doc)" class="btn-action bg-gray-100 border hover:bg-gray-200"><Printer class="w-4 h-4 mr-1"/>인쇄</button>
          <button @click="$emit('delete', doc.id)" class="btn-action bg-red-100 text-red-600 hover:bg-red-200"><Trash2 class="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
.modal-content { background: white; border-radius: 1rem; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-header, .modal-footer { padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; }
.modal-header { border-bottom: 1px solid #eee; } .modal-footer { border-top: 1px solid #eee; background: #f9fafb; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.btn-action { padding: 0.6rem 1rem; border-radius: 0.5rem; font-weight: 600; display: flex; align-items: center; transition: background 0.2s; }
</style>