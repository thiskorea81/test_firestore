<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, getDocs, doc as firestoreDoc, deleteDoc } from 'firebase/firestore';
import { db, getAppId } from '../../firebase';
import { useSystemStore } from '../../stores/systemStore';
import { Loader2 } from 'lucide-vue-next';

// 하위 컴포넌트
import DocumentListTable from './DocumentListTable.vue';
import DocumentReviewModal from './DocumentReviewModal.vue';

const props = defineProps({
  teacherData: { type: Object, required: true }
});

const systemStore = useSystemStore();
const documents = ref([]);
const loading = ref(true);
const filterType = ref('all');
const selectedDoc = ref(null);

// 1. 문서 목록 불러오기
const fetchDocuments = async () => {
  loading.value = true;
  await systemStore.fetchConfig(); // 결재라인 설정 로드
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
    // 최신순 정렬
    docs.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
    documents.value = docs;
  } catch (err) {
    console.error(err);
    alert("데이터 로드 실패");
  } finally {
    loading.value = false;
  }
};

// 2. 삭제 로직
const handleDelete = async (docId) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  try {
    const appId = getAppId();
    await deleteDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'submissions', docId));
    alert("삭제되었습니다.");
    selectedDoc.value = null;
    await fetchDocuments();
  } catch (err) {
    alert("삭제 실패");
  }
};

// 3. 인쇄 새 창 열기 (HTML 생성 - 학부모 연락처 반영됨)
const openPrintWindow = (doc) => {
  // 날짜 변환
  const dateObj = doc.submittedAt?.toDate ? doc.submittedAt.toDate() : new Date();
  const dateStr = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  // 결재란 HTML 동적 생성
  const approvalLine = systemStore.config.approvalLine || [];
  let sanctionHeaderHTML = '';
  let sanctionBodyHTML = '';

  if (approvalLine.length > 0) {
    approvalLine.forEach((step, index) => {
      // 헤더
      sanctionHeaderHTML += `<th class="role-header">${step.label}</th>`;
      
      // 본문 (도장/전결)
      let content = '';
      // 1. 담임 서명 (첫 번째 칸 & 문서에 서명 이미지가 있을 때)
      if (index === 0 && doc.teacherSignature) {
        content = `<img src="${doc.teacherSignature}" class="stamp-img" alt="담임">`;
      } 
      // 2. 전결
      else if (step.isFinal) {
        content = '<span class="proxy-mark">전결</span>';
      }

      sanctionBodyHTML += `<td class="stamp-box">${content}</td>`;
    });
  }

  // 새 창 열기
  const win = window.open('', '_blank', 'width=900,height=1200');
  
  // HTML 쓰기 (이미지 제외, 텍스트 위주 A4)
  win.document.write(`
    <html>
      <head>
        <title>${doc.type} 인쇄</title>
        <style>
          /* 브라우저 여백 제거 (2페이지 방지 핵심) */
          @page { size: A4; margin: 0; }
          
          body { 
            font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; 
            margin: 0; padding: 0; 
            background: #52525b; 
          }
          
          /* A4 용지 컨테이너 */
          .page { 
            background: white; 
            width: 210mm; 
            height: 296mm; /* 1mm 여유 */
            padding: 20mm; 
            margin: 0 auto; 
            box-sizing: border-box; 
            position: relative; 
            overflow: hidden; 
          }
          
          /* 테이블 공통 */
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 14px; }
          th, td { border: 1px solid black; padding: 6px 8px; }
          th { background-color: #f3f4f6 !important; text-align: center; font-weight: bold; -webkit-print-color-adjust: exact; }
          
          /* 결재란 스타일 */
          .sanction-wrapper { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .sanction-table { width: auto !important; font-size: 12px; margin-bottom: 0; }
          .sanction-header { width: 25px; background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .role-header { width: 70px; height: 30px; font-weight: normal; }
          .stamp-box { height: 60px; text-align: center; vertical-align: middle; padding: 0; }
          
          .proxy-mark { font-weight: bold; font-size: 16px; font-family: serif; letter-spacing: 2px; }
          .stamp-img { max-width: 60px; max-height: 50px; object-fit: contain; }

          /* 제목 */
          h1 { text-align: center; font-size: 26px; text-decoration: underline; margin: 10px 0 20px 0; text-underline-offset: 8px; letter-spacing: 2px; }
          .date-right { text-align: right; margin-bottom: 5px; font-size: 13px; }
          
          /* 내용 셀 (높이 고정) */
          .content-cell { height: 180px; vertical-align: top; white-space: pre-wrap; line-height: 1.6; }

          /* 하단 서명란 */
          .signature-section { margin-top: 60px; text-align: center; }
          .declaration { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .date-center { font-size: 16px; margin-bottom: 40px; }
          .signatures { display: flex; flex-direction: column; align-items: flex-end; padding-right: 10px; }
          .sig-row { display: flex; align-items: center; margin-bottom: 10px; width: 350px; justify-content: flex-end; }
          .role { font-size: 16px; margin-right: 20px; width: 60px; text-align: right; }
          .name { font-size: 18px; font-weight: bold; margin-right: 10px; min-width: 70px; text-align: right; }
          .sig-img { height: 35px; }
          .no-sig { color: #ccc; font-size: 14px; }

          @media print {
            body { background: none; }
            .page { margin: 0; width: 100%; height: 100%; box-shadow: none; page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="sanction-wrapper">
            <table class="sanction-table">
              <tbody>
                <tr>
                  <th rowspan="2" class="sanction-header">결<br>재</th>
                  ${sanctionHeaderHTML}
                </tr>
                <tr>
                  ${sanctionBodyHTML}
                </tr>
              </tbody>
            </table>
          </div>

          <h1>${doc.type}</h1>
          <p class="date-right">작성일: ${dateStr}</p>

          <table>
            <colgroup>
              <col style="width: 20%"><col style="width: 30%">
              <col style="width: 20%"><col style="width: 30%">
            </colgroup>
            <tbody>
              <tr>
                <th>학년 / 반</th><td>${doc.grade}학년 ${doc.class}반</td>
                <th>번호</th><td>${doc.number}번</td>
              </tr>
              <tr>
                <th>성 명</th><td colspan="3">${doc.studentName}</td>
              </tr>
              <tr>
                <th>보호자명</th><td>${doc.signatures?.parentName || ''}</td>
                <th>비상연락처</th><td>${doc.parentPhone || '-'}</td>
              </tr>
            </tbody>
          </table>

          <table style="margin-top: 10px;">
            <colgroup><col style="width: 20%"><col style="width: 80%"></colgroup>
            <tbody>
              <tr>
                <th>기 간</th>
                <td>${doc.period?.start || '-'} ~ ${doc.period?.end || '-'} (총 ${doc.period?.days || 0}일간)</td>
              </tr>
              <tr>
                <th>구 분</th><td>${doc.absenceType}</td>
              </tr>
              <tr>
                <th>증빙서류</th><td>${doc.proofDocType || '미지정'}</td>
              </tr>
              <tr>
                <th>사 유</th>
                <td class="content-cell">${doc.reason}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div class="declaration">위와 같이 ${doc.type}를 제출합니다.</div>
            <div class="date-center">${dateStr}</div>
            
            <div class="signatures">
              <div class="sig-row">
                <span class="role">학 생</span>
                <span class="name">${doc.signatures?.studentName}</span>
                ${doc.signatures?.studentSig ? `<img src="${doc.signatures.studentSig}" class="sig-img"/>` : '<span class="no-sig">(인)</span>'}
              </div>
              <div class="sig-row">
                <span class="role">학부모</span>
                <span class="name">${doc.signatures?.parentName}</span>
                ${doc.signatures?.parentSig ? `<img src="${doc.signatures.parentSig}" class="sig-img"/>` : '<span class="no-sig">(인)</span>'}
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(() => { window.print(); }, 500); }
        <\/script>
      </body>
    </html>
  `);
  
  win.document.close();
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
      <h2 class="title">
        <span class="text-blue-600">{{ teacherData.assignedGrade }}학년 {{ teacherData.assignedClass }}반</span> 문서함
      </h2>
      <div class="filters">
        <select v-model="filterType" class="select-box">
          <option value="all">전체 보기</option>
          <option value="결석신고서">결석신고서</option>
          <option value="체험학습신청">체험학습신청서</option>
          <option value="체험학습보고">체험학습보고서</option>
        </select>
        <button @click="fetchDocuments" class="refresh-btn">새로고침</button>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-500">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2"/> 데이터를 불러오는 중...
    </div>

    <DocumentListTable 
      v-else 
      :documents="filteredDocs" 
      :loading="loading" 
      @select="doc => selectedDoc = doc"
      @delete="handleDelete"
    />

    <DocumentReviewModal 
      v-if="selectedDoc" 
      :doc="selectedDoc" 
      :teacherData="teacherData"
      @close="selectedDoc = null"
      @delete="handleDelete"
      @update="fetchDocuments"
      @open-print="openPrintWindow" 
    />
  </div>
</template>

<style scoped>
.manager-container { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.title { font-size: 1.25rem; font-weight: 800; color: #1f2937; }
.filters { display: flex; gap: 0.5rem; }
.select-box { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9rem; }
.refresh-btn { padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
.refresh-btn:hover { background: #e5e7eb; }
</style>