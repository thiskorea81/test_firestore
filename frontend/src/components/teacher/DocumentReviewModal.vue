<script setup>
import { ref } from 'vue';
import { updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db, getAppId } from '../../firebase';
import { Printer, Trash2, X, Check, Ban } from 'lucide-vue-next';
import DocumentContent from './common/DocumentContent.vue';

const props = defineProps({ doc: Object, teacherData: Object });
const emit = defineEmits(['close', 'delete', 'open-print', 'update']);

// 상태 변수
const checkMethod = ref('');
const checkMethodDetail = ref(''); // [추가] 기타 직접입력 내용

const proofType = ref('');
// (기타 증빙이 필요할 경우를 대비해 남겨두거나, 요청하신 리스트로 대체)
// 여기서는 요청하신 6개 항목이 명확하므로 별도 텍스트 입력은 제거하거나 '기타' 항목을 추가할 수 있습니다.
// 요청주신 목록에 '기타'는 없지만, 확장을 위해 남겨둡니다.
const proofTypeDetail = ref(''); 

const updateStatus = async (newStatus) => {
  if (newStatus === '승인') {
    if (!checkMethod.value) { alert('보호자 확인 방법을 선택해주세요.'); return; }
    if (checkMethod.value === '기타' && !checkMethodDetail.value) { alert('확인 방법(기타) 내용을 입력해주세요.'); return; }
    if (!proofType.value) { alert('증빙서류 처리 항목을 선택해주세요.'); return; }
    if (!props.teacherData.teacherSignature) { alert('등록된 서명이 없습니다. 내 정보에서 서명을 등록해주세요.'); return; }
  }

  if (!confirm(`'${newStatus}' 처리하시겠습니까?`)) return;
  
  try {
    const appId = getAppId();
    await updateDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'submissions', props.doc.id), {
      status: newStatus,
      processedAt: new Date(),
      teacherSignature: newStatus === '승인' ? props.teacherData.teacherSignature : null,
      
      // [수정] 담임 확인 정보 상세 저장
      teacherCheck: {
        method: checkMethod.value,
        methodDetail: checkMethod.value === '기타' ? checkMethodDetail.value : '', // 기타 내용 저장
        proofType: proofType.value === '기타' ? proofTypeDetail.value : proofType.value
      }
    });
    
    // 인쇄용 데이터 객체 생성 (즉시 반영)
    const updatedDoc = {
      ...props.doc,
      status: newStatus,
      teacherSignature: newStatus === '승인' ? props.teacherData.teacherSignature : null,
      teacherCheck: { 
        method: checkMethod.value, 
        methodDetail: checkMethod.value === '기타' ? checkMethodDetail.value : '',
        proofType: proofType.value === '기타' ? proofTypeDetail.value : proofType.value 
      },
      processedAt: new Date()
    };

    alert(`처리되었습니다.`);
    emit('update'); emit('close');
    if (newStatus === '승인') emit('open-print', updatedDoc);

  } catch (e) { console.error(e); alert('오류 발생'); }
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
        <DocumentContent :doc="doc" :teacherData="teacherData" />

        <div class="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 class="font-bold text-blue-800 mb-4 flex items-center">
            <Check class="w-5 h-5 mr-2"/> 담임 확인 (승인 시 필수)
          </h4>
          
          <div class="mb-5">
            <p class="text-sm font-bold text-gray-700 mb-2">1. 보호자 확인 방법</p>
            <div class="flex flex-wrap items-center gap-4 text-sm">
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="checkMethod" value="통화" class="mr-1"> 통화</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="checkMethod" value="면담" class="mr-1"> 면담</label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" v-model="checkMethod" value="기타" class="mr-1"> 
                기타: 
                <input 
                  type="text" 
                  v-model="checkMethodDetail" 
                  class="ml-1 border border-gray-300 rounded px-2 py-1 text-xs w-40 focus:ring-2 focus:ring-blue-500 outline-none" 
                  :disabled="checkMethod !== '기타'"
                  placeholder="내용 입력"
                >
              </label>
            </div>
          </div>

          <div>
            <p class="text-sm font-bold text-gray-700 mb-2">2. 증빙서류 처리</p>
            <div class="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="병원진료영수증" class="mr-1"> 병원진료영수증</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="투약봉지" class="mr-1"> 투약봉지</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="병원처방전" class="mr-1"> 병원처방전</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="의료기관 진단서/소견서" class="mr-1"> 의료기관 진단서/소견서</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="PCR 결과 통보서" class="mr-1"> PCR 결과 통보서</label>
              <label class="flex items-center cursor-pointer"><input type="radio" v-model="proofType" value="증빙서류 없음" class="mr-1"> 증빙서류 없음</label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="flex gap-2">
          <button @click="updateStatus('승인')" class="btn-action bg-blue-600 text-white hover:bg-blue-700"><Check class="w-4 h-4 mr-1"/>승인 및 인쇄</button>
          <button @click="updateStatus('반려')" class="btn-action bg-yellow-500 text-white hover:bg-yellow-600"><Ban class="w-4 h-4 mr-1"/>반려</button>
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