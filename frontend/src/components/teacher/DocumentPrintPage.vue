// 사용하지 않으나 혹시 모를 상황을 대비해 남겨둠.
<script setup>
import { Printer, X } from 'lucide-vue-next';
import SignatureBlock from './common/SignatureBlock.vue'; // 결재란

const props = defineProps({
  doc: Object,
  teacherData: Object
});

defineEmits(['close']);

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const triggerPrint = () => {
  window.print();
};
</script>

<template>
  <div class="print-overlay">
    <div class="control-bar no-print">
      <h2 class="text-white font-bold text-lg">문서 인쇄 미리보기 (A4)</h2>
      <div class="flex gap-3">
        <button @click="triggerPrint" class="btn-print"><Printer class="w-5 h-5 mr-2"/> 인쇄하기</button>
        <button @click="$emit('close')" class="btn-close"><X class="w-5 h-5 mr-2"/> 닫기</button>
      </div>
    </div>

    <div class="a4-page" id="print-section">
      
      <SignatureBlock />

      <h1 class="doc-title">{{ doc.type }}</h1>
      <p class="doc-date">작성일: {{ formatDate(doc.submittedAt) }}</p>

      <table class="doc-table">
        <colgroup>
          <col style="width: 20%"> <col style="width: 30%"> <col style="width: 20%"> <col style="width: 30%">
        </colgroup>
        <tbody>
          <tr>
            <th>학년 / 반</th> <td>{{ doc.grade }}학년 {{ doc.class }}반</td>
            <th>번호</th> <td>{{ doc.number }}번</td>
          </tr>
          <tr>
            <th>성 명</th> <td colspan="3">{{ doc.studentName }}</td>
          </tr>
          <tr>
            <th>보호자명</th> <td>{{ doc.signatures?.parentName }}</td>
            <th>비상연락처</th> <td>{{ doc.phone || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <table class="doc-table mt-4">
        <colgroup>
          <col style="width: 20%"> <col style="width: 80%">
        </colgroup>
        <tbody>
          <tr>
            <th>기 간</th>
            <td>
              {{ doc.period?.start || '-' }} ~ {{ doc.period?.end || '-' }}
              <span v-if="doc.period?.days">(총 {{ doc.period.days }}일간)</span>
            </td>
          </tr>
          <tr>
            <th>구 분</th> <td>{{ doc.absenceType }}</td>
          </tr>
          <tr>
            <th>증빙종류</th> 
            <td>
              {{ doc.proofDocType || '미지정' }} 
              <span v-if="doc.proofFileUrl" class="text-xs text-gray-500 ml-2">(첨부파일은 시스템에서 확인 가능)</span>
            </td>
          </tr>
          <tr>
            <th class="align-top pt-4">사 유</th>
            <td class="py-4 h-48 align-top whitespace-pre-wrap">{{ doc.reason }}</td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="declaration-box">
          <p class="mb-4 text-xl font-bold">위와 같이 {{ doc.type }}를 제출합니다.</p>
          <p class="text-lg">{{ formatDate(doc.submittedAt) }}</p>
        </div>
        
        <div class="signatures-wrapper">
          <div class="sig-row">
            <span class="role">학 생</span>
            <span class="name">{{ doc.signatures?.studentName }}</span>
            <div class="sig-area">
              <img v-if="doc.signatures?.studentSig" :src="doc.signatures?.studentSig" class="sig-img" />
              <span v-else class="text-gray-400">(인)</span>
            </div>
          </div>
          <div class="sig-row">
            <span class="role">학부모</span>
            <span class="name">{{ doc.signatures?.parentName }}</span>
            <div class="sig-area">
              <img v-if="doc.signatures?.parentSig" :src="doc.signatures?.parentSig" class="sig-img" />
              <span v-else class="text-gray-400">(인)</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 화면용 스타일 */
.print-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #374151; z-index: 9999; display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
.control-bar { width: 100%; padding: 1rem 2rem; background: #1f2937; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.btn-print { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; }
.btn-close { background: #4b5563; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; }

/* A4 용지 스타일 */
.a4-page { background: white; width: 210mm; min-height: 297mm; padding: 20mm; margin: 2rem auto; box-shadow: 0 0 15px rgba(0,0,0,0.5); color: black; box-sizing: border-box; position: relative; }

/* 문서 스타일 */
.doc-title { text-align: center; font-size: 28px; font-weight: bold; text-decoration: underline; margin-bottom: 10px; text-underline-offset: 8px; }
.doc-date { text-align: right; margin-bottom: 10px; }
.doc-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 14px; }
.doc-table th, .doc-table td { border: 1px solid black; padding: 8px; }
.doc-table th { background: #eee; text-align: center; font-weight: bold; }

/* 서명란 */
.signature-section { margin-top: 80px; }
.declaration-box { text-align: center; margin-bottom: 50px; }
.signatures-wrapper { display: flex; flex-direction: column; align-items: flex-end; padding-right: 20px; }
.sig-row { display: flex; align-items: center; margin-bottom: 15px; width: 350px; justify-content: flex-end; }
.role { font-size: 18px; margin-right: 20px; width: 60px; text-align: right; }
.name { font-size: 20px; font-weight: bold; margin-right: 10px; min-width: 80px; text-align: right; }
.sig-area { width: 80px; display: flex; justify-content: center; }
.sig-img { height: 40px; }

/* ★★★ 인쇄 시 설정 ★★★ */
@media print {
  /* 모든 요소 숨김 */
  body * { visibility: hidden; }
  
  /* 인쇄 영역만 보임 & 위치 초기화 */
  #print-section, #print-section * { visibility: visible; }
  #print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
  
  /* UI 숨김 */
  .no-print, .print-overlay { display: none !important; background: none; }
  
  /* 배경색 강제 출력 */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  
  @page { size: A4; margin: 20mm; }
}
</style>