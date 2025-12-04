<script setup>
import { FileText, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-vue-next';

defineProps({
  documents: Array,
  loading: Boolean
});

defineEmits(['select', 'delete']);

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getMonth()+1}/${date.getDate()}`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case '승인': return { class: 'bg-blue-50 text-blue-700 border-blue-200', label: '승인완료', icon: CheckCircle };
    case '반려': return { class: 'bg-red-50 text-red-700 border-red-200', label: '반려됨', icon: XCircle };
    default: return { class: 'bg-gray-50 text-gray-600 border-gray-200', label: '결재대기', icon: Clock };
  }
};
</script>

<template>
  <div class="list-wrapper">
    <table class="doc-table">
      <thead>
        <tr>
          <th class="w-[10%]">날짜</th>
          <th class="w-[15%]">학생명</th>
          <th class="w-[20%]">문서 종류</th>
          <th class="w-[30%]">내용 요약</th>
          <th class="w-[15%]">상태</th>
          <th class="w-[10%]">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documents" :key="doc.id" @click="$emit('select', doc)" class="cursor-pointer group hover:bg-blue-50">
          <td class="text-center text-gray-500 font-medium">{{ formatDate(doc.submittedAt) }}</td>
          <td class="text-center">
            <div class="font-bold text-gray-800">{{ doc.studentName }}</div>
            <div class="text-xs text-gray-400">{{ doc.number }}번</div>
          </td>
          <td class="text-center">
            <span class="font-bold text-sm text-gray-700">{{ doc.type }}</span>
            <div v-if="doc.absenceType === '인정결석(생리통)'" class="mt-1">
              <span class="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded border border-pink-200">생리인정</span>
            </div>
          </td>
          <td class="text-left">
            <div class="truncate max-w-[200px] text-gray-600 group-hover:text-blue-600">{{ doc.reason }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ doc.period?.start }} ~ {{ doc.period?.end }}</div>
          </td>
          <td class="text-center">
            <div :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border', getStatusConfig(doc.status).class]">
              <component :is="getStatusConfig(doc.status).icon" class="w-3 h-3 mr-1" />
              {{ getStatusConfig(doc.status).label }}
            </div>
          </td>
          <td class="text-center" @click.stop>
            <div class="flex justify-center gap-2">
              <button @click="$emit('select', doc)" class="p-1.5 rounded hover:bg-blue-100 text-blue-600" title="상세보기"><FileText class="w-4 h-4"/></button>
              <button @click="$emit('delete', doc.id)" class="p-1.5 rounded hover:bg-red-100 text-red-500" title="삭제"><Trash2 class="w-4 h-4"/></button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && documents.length === 0">
          <td colspan="6" class="py-12 text-center text-gray-400">
            <AlertCircle class="w-8 h-8 mx-auto mb-2 opacity-50"/> 제출된 문서가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.list-wrapper { border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
.doc-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; background: white; }
.doc-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.doc-table th { padding: 1rem 0.5rem; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
.doc-table td { padding: 1rem 0.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.doc-table tr:last-child td { border-bottom: none; }
</style>