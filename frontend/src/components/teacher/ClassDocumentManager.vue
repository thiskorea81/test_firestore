<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, getDocs, doc as firestoreDoc, deleteDoc } from 'firebase/firestore';
import { db, getAppId } from '../../firebase';
import { useSystemStore } from '../../stores/systemStore';
import { Loader2 } from 'lucide-vue-next';
import { printDocument } from '../../utils/printUtils';

import DocumentListTable from './DocumentListTable.vue';
import DocumentReviewModal from './DocumentReviewModal.vue';

const props = defineProps({
  teacherData: { type: Object, required: true },
  user: { type: Object, required: true } // [추가] 서명 저장용
});

const systemStore = useSystemStore();
const documents = ref([]);
const loading = ref(true);
const filterType = ref('all');
const selectedDoc = ref(null);

const fetchDocuments = async () => {
  loading.value = true;
  await systemStore.fetchConfig();
  const appId = getAppId();
  try {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
      where('grade', '==', String(props.teacherData.assignedGrade)), 
      where('class', '==', String(props.teacherData.assignedClass))
    );
    const querySnapshot = await getDocs(q);
    const docs = [];
    querySnapshot.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
    documents.value = docs;
  } catch (err) { console.error(err); alert("데이터 로드 실패"); } 
  finally { loading.value = false; }
};

const handleDelete = async (docId) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    await deleteDoc(firestoreDoc(db, 'artifacts', getAppId(), 'public', 'data', 'submissions', docId));
    alert("삭제되었습니다."); selectedDoc.value = null; await fetchDocuments();
  } catch (e) { alert("삭제 실패"); }
};

const handlePrint = (doc) => {
  printDocument(doc, props.teacherData, systemStore.config.approvalLine);
};

const filteredDocs = computed(() => {
  if (filterType.value === 'all') return documents.value;
  return documents.value.filter(doc => doc.type === filterType.value);
});

onMounted(fetchDocuments);
</script>

<template>
  <div class="manager-container">
    <div class="header">
      <h2 class="title">{{ teacherData.assignedGrade }}학년 {{ teacherData.assignedClass }}반 문서함</h2>
      <div class="filters">
        <select v-model="filterType" class="select-box">
          <option value="all">전체 보기</option>
          <option value="결석신고서">결석신고서</option>
          <option value="체험학습신청">체험학습신청서</option>
        </select>
        <button @click="fetchDocuments" class="refresh-btn">새로고침</button>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center"><Loader2 class="animate-spin mx-auto"/></div>
    <DocumentListTable v-else :documents="filteredDocs" :loading="loading" @select="doc => selectedDoc = doc" @delete="handleDelete" />
    
    <DocumentReviewModal 
      v-if="selectedDoc" 
      :doc="selectedDoc" 
      :teacherData="teacherData"
      :user="user"
      @close="selectedDoc = null" 
      @delete="handleDelete" 
      @update="fetchDocuments" 
      @open-print="handlePrint" 
    />
  </div>
</template>

<style scoped>
/* 스타일 유지 */
.manager-container { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.title { font-size: 1.25rem; font-weight: 800; color: #1f2937; }
.filters { display: flex; gap: 0.5rem; }
.select-box { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
.refresh-btn { padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
.refresh-btn:hover { background: #e5e7eb; }
</style>