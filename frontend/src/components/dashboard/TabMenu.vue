<script setup>
import { 
  FileText, Send, ClipboardList, BookOpen, CheckCircle, List 
} from 'lucide-vue-next';

defineProps({
  activeTab: String,
  userRole: String
});

defineEmits(['update:activeTab']);
</script>

<template>
  <div class="tabs-container">
    <button @click="$emit('update:activeTab', 'profile')" 
      :class="['tab-btn', activeTab === 'profile' ? 'active' : '']">
      <CheckCircle class="w-4 h-4" /> 내 정보
    </button>
    
    <template v-if="userRole !== 'teacher'">
      <button @click="$emit('update:activeTab', 'history')" 
        :class="['tab-btn', activeTab === 'history' ? 'active' : '']">
        <List class="w-4 h-4" /> 내 신청 현황
      </button>

      <button @click="$emit('update:activeTab', 'absence')" 
        :class="['tab-btn', activeTab === 'absence' ? 'active' : '']">
        <FileText class="w-4 h-4" /> 결석신고서
      </button>
      <button @click="$emit('update:activeTab', 'trip_app')" 
        :class="['tab-btn', activeTab === 'trip_app' ? 'active' : '']">
        <Send class="w-4 h-4" /> 체험학습신청
      </button>
      <button @click="$emit('update:activeTab', 'trip_report')" 
        :class="['tab-btn', activeTab === 'trip_report' ? 'active' : '']">
        <BookOpen class="w-4 h-4" /> 체험학습보고
      </button>
    </template>

    <button v-if="userRole === 'teacher'"
      @click="$emit('update:activeTab', 'class_docs')" 
      :class="['tab-btn', activeTab === 'class_docs' ? 'active' : 'teacher-tab']">
      <ClipboardList class="w-4 h-4" /> 학급 문서함
    </button>
  </div>
</template>

<style scoped>
.tabs-container { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: none; }
.tabs-container::-webkit-scrollbar { display: none; }

.tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border: none; background: white; border-radius: 0.75rem; font-size: 0.95rem; font-weight: 600; color: #6b7280; cursor: pointer; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; }
.tab-btn:hover { background: #f9fafb; color: #374151; }
.tab-btn.active { background: #eff6ff; color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }

/* 교사 탭 스타일 */
.tab-btn.teacher-tab { background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.tab-btn.teacher-tab.active { background-color: #15803d; color: white; border: 1px solid #15803d; }
</style>