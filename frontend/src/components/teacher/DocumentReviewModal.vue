<script setup>
import { updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db, getAppId } from '../../firebase';
import { Printer, Trash2, X, Check, Ban } from 'lucide-vue-next';
import DocumentContent from './common/DocumentContent.vue';

const props = defineProps({
  doc: Object,
  teacherData: Object 
});

const emit = defineEmits(['close', 'delete', 'open-print', 'update']);

const updateStatus = async (newStatus) => {
  // 1. 서명 체크 (승인 시)
  let signatureToSave = null;
  
  if (newStatus === '승인') {
    if (!props.teacherData.teacherSignature) {
      alert("⚠️ 등록된 서명(도장)이 없습니다.\n[내 정보] > [수정]에서 서명을 먼저 등록해주세요.");
      return;
    }
    signatureToSave = props.teacherData.teacherSignature;
  }

  if (!confirm(`'${newStatus}' 처리하시겠습니까?`)) return;
  
  try {
    const appId = getAppId();
    
    // 2. DB 업데이트
    await updateDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'submissions', props.doc.id), {
      status: newStatus,
      processedAt: new Date(),
      teacherSignature: newStatus === '승인' ? signatureToSave : null
    });
    
    // 3. 인쇄용 최신 데이터 객체 생성 (DB 다시 안 불러오고 즉시 반영)
    const updatedDoc = {
      ...props.doc,
      status: newStatus,
      teacherSignature: newStatus === '승인' ? signatureToSave : null,
      processedAt: new Date() // 현재 시간
    };

    alert(`처리되었습니다.`);
    
    // 목록 갱신 및 모달 닫기
    emit('update');
    emit('close');

    // [핵심] 승인인 경우, 바로 인쇄 창 열기
    if (newStatus === '승인') {
      emit('open-print', updatedDoc);
    }

  } catch (e) {
    console.error(e);
    alert('오류가 발생했습니다.');
  }
};
</script>

<template>
  <div class="modal-overlay no-print" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold flex items-center gap-2">문서 검토
          <span :class="{'text-blue-600': doc.status==='승인', 'text-red-600': doc.status==='반려'}" class="text-sm">({{ doc.status }})</span>
        </h3>
        <button @click="$emit('close')"><X class="w-6 h-6"/></button>
      </div>

      <div class="modal-body">
        <DocumentContent :doc="doc" :teacherData="teacherData" />
      </div>

      <div class="modal-footer">
        <div class="flex gap-2">
          <button @click="updateStatus('승인')" class="btn-action bg-blue-600 text-white hover:bg-blue-700">
            <Check class="w-4 h-4 mr-1"/>승인 (서명&인쇄)
          </button>
          <button @click="updateStatus('반려')" class="btn-action bg-yellow-500 text-white hover:bg-yellow-600">
            <Ban class="w-4 h-4 mr-1"/>반려
          </button>
        </div>
        
        <div class="flex gap-2 ml-auto">
          <button @click="$emit('open-print', doc)" class="btn-action bg-gray-100 text-gray-700 hover:bg-gray-200">
            <Printer class="w-4 h-4 mr-1"/>인쇄창 열기
          </button>
          <button @click="$emit('delete', doc.id)" class="btn-action bg-red-100 text-red-600 hover:bg-red-200">
            <Trash2 class="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
.modal-content { background: white; border-radius: 1rem; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-header, .modal-footer { padding: 1.25rem; display: flex; align-items: center; }
.modal-header { border-bottom: 1px solid #eee; justify-content: space-between; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.btn-action { padding: 0.6rem 1rem; border-radius: 0.5rem; font-weight: 600; display: flex; align-items: center; transition: background 0.2s; }
</style>