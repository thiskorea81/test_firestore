<script setup>
import { computed, ref } from 'vue';
import { CheckCircle, GraduationCap, School, Edit } from 'lucide-vue-next';

// 분리된 컴포넌트들
import StatCards from './parts/StatCards.vue';
import ParentInfo from './parts/ParentInfo.vue';
import EditProfileModal from './parts/EditProfileModal.vue';

const props = defineProps({
  user: Object,
  userData: Object
});

const roleLabel = { student: '학생', parent: '학부모', teacher: '교사', unknown: '회원' };
const safeRole = computed(() => props.userData?.role || 'unknown');
const isEditing = ref(false);
</script>

<template>
  <div class="card profile-card">
    <div class="card-header">
      <div class="header-content">
        <h1 class="welcome-text">반갑습니다, {{ userData?.name || user.displayName }}님!</h1>
        <div class="flex items-center gap-2">
          <span class="role-badge" :class="safeRole">{{ roleLabel[safeRole] || '회원' }}</span>
          <button @click="isEditing = true" class="edit-btn" title="정보 수정">
            <Edit class="w-4 h-4" />
          </button>
        </div>
      </div>
      <p class="email-text">{{ user.email }}</p>
    </div>
    
    <div class="card-body">
      <h2 class="section-title"><CheckCircle class="icon-check" /> 내 정보 확인</h2>
      
      <div class="info-grid">
        <div class="info-box">
          <span class="label">이름</span>
          <span class="value">
            {{ userData?.name }}
            <span v-if="safeRole === 'student'" class="text-xs font-normal text-gray-500 ml-1">
              ({{ userData?.gender === 'female' ? '여' : '남' }})
            </span>
          </span>
        </div>
        
        <template v-if="safeRole === 'student'">
          <div class="info-box highlight">
            <span class="label">학번</span>
            <span class="value lg">{{ userData.studentId }}</span>
            <p class="sub-text">{{ userData.grade }}학년 {{ userData.class }}반 {{ userData.number }}번</p>
          </div>
          <div class="info-box"><span class="label">학생 연락처</span><span class="value">{{ userData.phone }}</span></div>

          <StatCards :user="user" :userData="userData" />

          <ParentInfo :userData="userData" />
        </template>

        <template v-if="safeRole === 'parent'">
          <div class="info-box col-span-full">
            <span class="label">자녀 정보</span>
            <div class="flex-row"><GraduationCap class="icon-gray"/><span class="value">{{ userData.childName }}</span></div>
            <p class="sub-text">자녀 학번: {{ userData.childStudentId }}</p>
          </div>
          <div class="info-box"><span class="label">연락처</span><span class="value">{{ userData.phone }}</span></div>
        </template>

        <div v-if="safeRole === 'teacher'" class="info-box col-span-full">
          <span class="label">담당 학급</span>
          <div class="flex-row"><School class="icon-green"/><span class="value lg">{{ userData.assignedGrade }}학년 {{ userData.assignedClass }}반</span></div>
        </div>
      </div>
    </div>

    <EditProfileModal 
      v-if="isEditing" 
      :user="user" 
      :userData="userData" 
      :safeRole="safeRole" 
      @close="isEditing = false" 
    />
  </div>
</template>

<style scoped>
.card { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e5e7eb; }
.card-header { background: #2563eb; color: white; padding: 2rem; }
.header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.welcome-text { margin: 0; font-size: 1.5rem; font-weight: 700; }
.email-text { margin: 0; opacity: 0.8; font-size: 0.9rem; }
.role-badge { padding: 0.35rem 0.85rem; border-radius: 999px; font-size: 0.875rem; font-weight: 700; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: white; }
.role-badge.student { background: white; color: #2563eb; }
.role-badge.parent { background: #fce7f3; color: #db2777; }
.role-badge.teacher { background: #dcfce7; color: #15803d; }
.card-body { padding: 2rem; }
.section-title { display: flex; align-items: center; font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-bottom: 1.5rem; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.info-box { background: #f9fafb; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.info-box.highlight { border-left: 4px solid #2563eb; }
.col-span-full { grid-column: 1 / -1; }
.label { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
.value { font-size: 1.125rem; font-weight: 500; color: #111827; }
.value.lg { font-weight: 700; font-size: 1.25rem; color: #4f46e5; }
.sub-text { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
.flex-row { display: flex; align-items: center; gap: 0.5rem; }
.icon-check { width: 20px; height: 20px; color: #16a34a; margin-right: 0.5rem; }
.icon-gray { color: #9ca3af; width: 18px; height: 18px; }
.icon-green { color: #15803d; width: 20px; height: 20px; }
.edit-btn { background: rgba(255,255,255,0.2); border:none; color:white; padding: 6px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.edit-btn:hover { background: rgba(255,255,255,0.4); }

@media (max-width: 640px) { .header-content { flex-direction: column; align-items: flex-start; gap: 0.5rem; } .card-header, .card-body { padding: 1.5rem; } }
</style>