<script setup>
import { Download } from 'lucide-vue-next';

const props = defineProps({
  doc: Object,
  teacherData: Object
});

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일`;
};
</script>

<template>
  <div class="content-wrapper">
    
    <table class="info-table">
      <colgroup>
        <col style="width: 20%">
        <col style="width: 30%">
        <col style="width: 20%">
        <col style="width: 30%">
      </colgroup>
      <tbody>
        <tr>
          <th>학생명</th>
          <td colspan="3">
            <span class="font-bold text-gray-800">{{ doc.studentName }}</span> 
            <span class="text-sm text-gray-500 ml-1">({{ doc.grade }}학년 {{ doc.class }}반 {{ doc.number }}번)</span>
          </td>
        </tr>
        <tr>
          <th>문서 종류</th>
          <td>{{ doc.type }} <span class="text-gray-400">/</span> {{ doc.absenceType }}</td>
          <th>제출일</th>
          <td>{{ formatDate(doc.submittedAt) }}</td>
        </tr>
        
        <tr>
          <th>구 분</th>
          <td colspan="3">
            <span class="font-bold text-gray-800">{{ doc.absenceDetail || '-' }}</span>
          </td>
        </tr>

        <tr>
          <th>결석 기간</th>
          <td colspan="3">
            <div>
              {{ doc.period?.start }} ~ {{ doc.period?.end }}
              <span v-if="doc.period?.days" class="ml-2 font-bold text-blue-600">
                (총 {{ doc.period.days }}일)
              </span>
            </div>
            <div v-if="doc.period?.startPeriod" class="text-sm text-gray-500 mt-1">
              ({{ doc.period.startPeriod }}교시 ~ {{ doc.period.endPeriod }}교시)
            </div>
          </td>
        </tr>
        <tr>
          <th>증빙 종류</th>
          <td>{{ doc.proofDocType || '미지정' }}</td>
          <th>비상연락</th>
          <td>{{ doc.parentPhone || '-' }}</td>
        </tr>
        <tr>
          <th>보호자</th>
          <td colspan="3">{{ doc.signatures?.parentName }}</td>
        </tr>
      </tbody>
    </table>

    <div class="section mt-6">
      <h4 class="section-title">사유 / 상세 내용</h4>
      <div class="reason-box">
        <div class="mb-2">
          <span class="text-xs font-bold text-gray-500 block mb-1">[학생 사유]</span>
          {{ doc.reason }}
        </div>
        <div v-if="doc.parentOpinion" class="mt-4 pt-4 border-t border-gray-200">
          <span class="text-xs font-bold text-gray-500 block mb-1">[학부모 의견]</span>
          {{ doc.parentOpinion }}
        </div>
      </div>
    </div>

    <div class="section mt-6">
      <h4 class="section-title">증빙 서류 확인</h4>
      
      <div v-if="doc.proofFileUrl" class="evidence-box">
        <div class="img-wrapper">
          <img :src="doc.proofFileUrl" alt="증빙서류 미리보기" />
        </div>
        <div class="link-wrapper">
          <a :href="doc.proofFileUrl" target="_blank" class="download-link">
            <Download class="w-4 h-4 mr-2"/> 원본 이미지 새 창으로 보기
          </a>
        </div>
      </div>
      
      <div v-else class="no-file-box">
        첨부된 증빙 파일이 없습니다.
      </div>
    </div>

    <div class="section mt-8 pt-6 border-t border-gray-100">
      <div class="grid grid-cols-2 gap-8">
        <div class="text-center">
          <span class="block text-xs font-bold text-gray-400 mb-2 uppercase">학생 서명</span>
          <div class="sig-box">
            <img v-if="doc.signatures?.studentSig" :src="doc.signatures?.studentSig" class="h-10 mx-auto" />
            <span v-else class="text-gray-300 text-sm">(서명 없음)</span>
          </div>
          <p class="text-sm font-bold text-gray-700 mt-2">{{ doc.studentName }}</p>
        </div>
        <div class="text-center">
          <span class="block text-xs font-bold text-gray-400 mb-2 uppercase">학부모 서명</span>
          <div class="sig-box">
            <img v-if="doc.signatures?.parentSig" :src="doc.signatures?.parentSig" class="h-10 mx-auto" />
            <span v-else class="text-gray-300 text-sm">(서명 없음)</span>
          </div>
          <p class="text-sm font-bold text-gray-700 mt-2">{{ doc.signatures?.parentName }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.info-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.info-table th { background: #f8fafc; padding: 0.75rem 0.5rem; text-align: left; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 15%; }
.info-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #f1f5f9; color: #334155; }

.section-title { font-size: 0.9rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; display: flex; align-items: center; }
.section-title::before { content: ''; display: inline-block; width: 4px; height: 14px; background-color: #3b82f6; margin-right: 8px; border-radius: 2px; }

.reason-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; min-height: 80px; white-space: pre-wrap; color: #1e293b; line-height: 1.5; }

.evidence-box { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
.img-wrapper { background-color: #f1f5f9; padding: 1rem; display: flex; justify-content: center; }
.img-wrapper img { max-height: 300px; max-width: 100%; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.link-wrapper { background-color: white; padding: 0.75rem; text-align: center; border-top: 1px solid #e2e8f0; }
.download-link { display: inline-flex; align-items: center; color: #2563eb; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: color 0.2s; }
.download-link:hover { color: #1d4ed8; text-decoration: underline; }

.no-file-box { padding: 2rem; text-align: center; color: #9ca3af; border: 1px dashed #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; background-color: #f8fafc; }

.sig-box { height: 60px; display: flex; align-items: center; justify-content: center; background-color: #fff; border-bottom: 1px solid #e2e8f0; }
</style>