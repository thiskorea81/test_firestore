<script setup>
import { ref, computed } from 'vue';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Send, BookOpen } from 'lucide-vue-next';

// 하위 컴포넌트 임포트
import TabMenu from './dashboard/TabMenu.vue';
import ProfileCard from './dashboard/ProfileCard.vue';
import AbsenceForm from './forms/AbsenceForm.vue';
import StudentHistory from './dashboard/StudentHistory.vue';

// [중요] 이름이 변경된 컴포넌트 임포트
import ClassDocumentManager from './teacher/ClassDocumentManager.vue';

const props = defineProps({
  user: { type: Object, required: true },
  userData: { type: Object, default: null }
});

const activeTab = ref('profile');
const safeRole = computed(() => props.userData?.role || 'unknown');

// [상태] 수정할 데이터
const editTargetData = ref(null);

const handleLogout = async () => {
  if(confirm("로그아웃 하시겠습니까?")) await signOut(auth);
};

// 학생 히스토리에서 [수정] 버튼 클릭 시
const handleEditRequest = (data) => {
  editTargetData.value = data;
  if (data.type === '결석신고서') {
    activeTab.value = 'absence'; // 작성 폼으로 이동
  } else {
    alert("현재 '결석신고서'만 수정 가능합니다.");
  }
};

// 폼 닫기 (저장 완료 or 취소)
const handleFormClose = () => {
  editTargetData.value = null; // 수정 데이터 초기화
  activeTab.value = 'history'; // 목록으로 복귀
};
</script>

<template>
  <div class="dashboard-wrapper">
    <nav class="navbar">
      <div class="brand" @click="activeTab = 'profile'">
        <div class="logo">T</div><span>Teacher Diary</span>
      </div>
      <button @click="handleLogout" class="btn-logout">
        <LogOut class="w-4 h-4 mr-1" /> 로그아웃
      </button>
    </nav>

    <main class="main-content">
      <TabMenu 
        v-model:activeTab="activeTab" 
        :userRole="safeRole" 
      />

      <ProfileCard 
        v-if="activeTab === 'profile'" 
        :user="user" 
        :userData="userData" 
      />

      <template v-if="safeRole !== 'teacher'">
        
        <StudentHistory 
          v-if="activeTab === 'history'"
          :user="user"
          @edit="handleEditRequest"
        />

        <AbsenceForm 
          v-if="activeTab === 'absence'" 
          :user="user" 
          :userData="userData" 
          :editData="editTargetData"
          @close="handleFormClose"
          @submitted="handleFormClose"
        />

        <div v-if="activeTab === 'trip_app'" class="card placeholder">
          <Send class="icon-lg text-blue-200" />
          <h2>체험학습 신청서</h2><p>준비 중입니다.</p>
        </div>

        <div v-if="activeTab === 'trip_report'" class="card placeholder">
          <BookOpen class="icon-lg text-green-200" />
          <h2>체험학습 보고서</h2><p>준비 중입니다.</p>
        </div>
      </template>

      <ClassDocumentManager 
        v-if="activeTab === 'class_docs' && safeRole === 'teacher'"
        :teacherData="userData"
      />
    </main>
  </div>
</template>

<style scoped>
.dashboard-wrapper { min-height: 100vh; background-color: #f3f4f6; display: flex; flex-direction: column; }
.navbar { background: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.brand { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 1.25rem; color: #1f2937; cursor: pointer; }
.logo { width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.btn-logout { display: flex; align-items: center; border: none; background: none; color: #6b7280; cursor: pointer; font-weight: 600; padding: 0.5rem; border-radius: 0.5rem; }
.btn-logout:hover { background-color: #fee2e2; color: #dc2626; }
.main-content { flex: 1; width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
.card.placeholder { background: white; border-radius: 1rem; padding: 4rem 1rem; text-align: center; border: 1px solid #e5e7eb; }
.icon-lg { width: 3rem; height: 3rem; margin: 0 auto 1rem; display: block; }
</style>