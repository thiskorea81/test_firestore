<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, getAppId } from '../../firebase';
import { useSystemStore } from '../../stores/systemStore';
import { Save, Loader2, AlertCircle } from 'lucide-vue-next';

import AbsenceInputs from './parts/AbsenceInputs.vue';
import SignatureSection from './parts/SignatureSection.vue';

const props = defineProps({
  user: Object, userData: Object, editData: { type: Object, default: null }
});
const emit = defineEmits(['close', 'submitted']);

const systemStore = useSystemStore();

const startDate = ref(props.editData?.period?.start || new Date().toISOString().split('T')[0]);
const endDate = ref(props.editData?.period?.end || new Date().toISOString().split('T')[0]);
const absenceType = ref(props.editData?.absenceType || '질병결석');
const reason = ref(props.editData?.reason || '');
const parentName = ref(props.userData?.parentName || '');
const proofFile = ref(null);
const proofDocType = ref(props.editData?.proofDocType || '진료확인서');
const proofDocDetail = ref('');

const sigSectionRef = ref(null);
const isSubmitting = ref(false);
const error = ref('');

onMounted(() => {
  systemStore.fetchConfig();
  if (props.editData?.proofDocType) {
    const val = props.editData.proofDocType;
    if (val !== '진료확인서' && val !== '진단서') {
      proofDocType.value = '기타';
      proofDocDetail.value = val;
    } else {
      proofDocType.value = val;
    }
  }
});

const duration = computed(() => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
});

const checkMonthlyUsage = async () => {
  const appId = getAppId();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const q = query(
    collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
    where('userId', '==', props.user.uid),
    where('absenceType', '==', '인정결석(생리통)')
  );
  const snapshot = await getDocs(q);
  const count = snapshot.docs.filter(d => d.id !== props.editData?.id && d.data().period.start.startsWith(currentMonth)).length;
  const limit = systemStore.config.limits.menstrual || 1;
  return count >= limit; 
};

const handleSubmit = async () => {
  error.value = '';
  if (!reason.value || !parentName.value) return error.value = "필수 정보를 모두 입력해주세요.";
  
  const sigs = sigSectionRef.value.getSignatures();
  const hasOldSigs = props.editData?.signatures;
  if ((sigs.isStudentEmpty && !hasOldSigs?.studentSig) || (sigs.isParentEmpty && !hasOldSigs?.parentSig)) {
    return error.value = "서명을 완료해주세요.";
  }

  let finalProofDocType = proofDocType.value;
  if (finalProofDocType === '기타') {
    if (!proofDocDetail.value) return error.value = "기타 증빙서류 내용을 입력해주세요.";
    finalProofDocType = proofDocDetail.value;
  }

  isSubmitting.value = true;

  try {
    let finalType = absenceType.value;
    let finalReason = reason.value;

    if (absenceType.value === '인정결석(생리통)') { // 용어 통일
      const limit = systemStore.config.limits.menstrual || 1;
      if (duration.value > limit) {
        if (!confirm(`⚠️ 인정결석(생리통) 기간(${duration.value}일) 초과. '질병결석'으로 전환됩니다.`)) { isSubmitting.value = false; return; }
        finalType = '질병결석';
        finalReason = `[인정결석 초과 전환] ${reason.value}`;
      } else if (await checkMonthlyUsage()) {
        if (!confirm(`⚠️ 이번 달 인정결석(생리통) 한도 초과. '질병결석'으로 전환됩니다.`)) { isSubmitting.value = false; return; }
        finalType = '질병결석';
        finalReason = `[인정결석 월한도 초과] ${reason.value}`;
      }
    }

    const appId = getAppId();
    let fileUrl = props.editData?.proofFileUrl || '';
    if (proofFile.value) {
      const snapshot = await uploadBytes(storageRef(storage, `artifacts/${appId}/uploads/${props.user.uid}/${Date.now()}_${proofFile.value.name}`), proofFile.value);
      fileUrl = await getDownloadURL(snapshot.ref);
    }

    const docData = {
      type: '결석신고서',
      userId: props.user.uid,
      studentId: props.userData?.studentId || 'unknown',
      studentName: props.userData?.name,
      grade: props.userData?.grade, class: props.userData?.class, number: props.userData?.number,
      phone: props.userData?.phone,
      parentPhone: props.userData?.parentPhone, // [중요] 학부모 연락처 저장
      
      period: { start: startDate.value, end: endDate.value, days: duration.value },
      absenceType: finalType, 
      reason: finalReason,
      proofFileUrl: fileUrl,
      proofDocType: finalProofDocType,
      
      signatures: {
        studentName: props.userData?.name,
        studentSig: (sigs.isStudentEmpty && hasOldSigs?.studentSig) ? hasOldSigs.studentSig : sigs.student,
        parentName: parentName.value,
        parentSig: (sigs.isParentEmpty && hasOldSigs?.parentSig) ? hasOldSigs.parentSig : sigs.parent
      },
      status: '제출완료',
      submittedAt: props.editData?.submittedAt || Timestamp.now()
    };

    if (props.editData) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'submissions', props.editData.id), docData);
    else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), docData);

    alert(`제출 완료`);
    emit('submitted');
    emit('close');
  } catch (err) {
    console.error(err);
    error.value = "오류: " + err.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
    <h3 class="text-xl font-bold text-gray-800 mb-6 border-b-2 border-blue-600 pb-2">
      결석 신고서 {{ editData ? '수정' : '작성' }}
    </h3>
    <AbsenceInputs 
      :userData="userData"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:absenceType="absenceType"
      v-model:reason="reason"
      v-model:proofDocType="proofDocType"
      v-model:proofDocDetail="proofDocDetail"
      :fileInfo="{ name: proofFile?.name, url: editData?.proofFileUrl }"
      @file-selected="f => proofFile = f"
    />
    <SignatureSection 
      ref="sigSectionRef"
      :studentName="userData?.name"
      v-model:parentName="parentName"
      :editData="editData"
    />
    <div v-if="error" class="text-red-500 text-sm mt-4 flex items-center"><AlertCircle class="w-4 h-4 mr-1"/> {{ error }}</div>
    <div class="flex gap-2 mt-6">
      <button @click="$emit('close')" class="flex-1 py-3 bg-gray-200 rounded-lg font-bold text-gray-700">취소</button>
      <button @click="handleSubmit" :disabled="isSubmitting" class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center">
        <Loader2 v-if="isSubmitting" class="animate-spin w-5 h-5"/>
        <span v-else><Save class="w-4 h-4 mr-1 inline"/> {{ editData ? '수정 완료' : '제출하기' }}</span>
      </button>
    </div>
  </div>
</template>