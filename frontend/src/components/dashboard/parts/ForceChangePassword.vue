<script setup>
import { ref } from 'vue';
import { updatePassword } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db, getAppId } from '../../../firebase';
import { Lock, Check, Loader2, AlertTriangle } from 'lucide-vue-next';

const props = defineProps({ user: Object });

const newPassword = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);
const error = ref('');

const handleChange = async () => {
  error.value = '';
  // 유효성 검사
  if (newPassword.value.length < 6) {
    error.value = '비밀번호는 최소 6자 이상이어야 합니다.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  isSubmitting.value = true;
  try {
    const appId = getAppId();
    
    // 1. Firebase Auth 비밀번호 변경
    await updatePassword(props.user, newPassword.value);
    
    // 2. DB 플래그 해제 (올바른 경로: users/{uid})
    const userRef = doc(db, 'artifacts', appId, 'users', props.user.uid);
    await updateDoc(userRef, {
      mustChangePassword: false
    });

    alert("비밀번호가 안전하게 변경되었습니다.\n새 비밀번호로 다시 로그인해주세요.");
    window.location.reload(); 
  } catch (e) {
    console.error(e);
    // 보안상 재로그인이 필요한 경우(requires-recent-login)가 많음
    error.value = "변경에 실패했습니다. 로그아웃 후 다시 시도해주세요.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="overlay">
    
    <div class="modal-card animate-pop-in">
      
      <div class="card-header">
        <div class="icon-wrapper">
          <Lock class="w-8 h-8 text-white" />
        </div>
        <h2 class="title">보안 설정 안내</h2>
        <p class="subtitle">계정 보호를 위해 비밀번호 변경이 필요합니다.</p>
      </div>

      <div class="card-body">
        <form @submit.prevent="handleChange" class="space-y-5">
          
          <div>
            <label class="label">새 비밀번호</label>
            <div class="relative">
              <input 
                type="password" 
                v-model="newPassword" 
                class="input-field"
                placeholder="6자 이상 입력" 
                required 
              />
            </div>
          </div>

          <div>
            <label class="label">비밀번호 확인</label>
            <div class="relative">
              <input 
                type="password" 
                v-model="confirmPassword" 
                class="input-field"
                placeholder="한 번 더 입력" 
                required 
              />
            </div>
          </div>

          <div v-if="error" class="error-box">
            <AlertTriangle class="w-4 h-4 mr-2 flex-shrink-0" />
            {{ error }}
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting" 
            class="submit-btn"
          >
            <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
            <span v-else class="flex items-center justify-center">
              변경 완료 및 시작하기 <Check class="w-4 h-4 ml-2" />
            </span>
          </button>
        </form>
      </div>
      
      <div class="card-footer">
        <p>초기 비밀번호는 보안에 취약하므로<br>반드시 본인만 알 수 있는 비밀번호로 변경해주세요.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 오버레이: 화면 전체를 덮고 흐리게 처리 */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.6); /* 어두운 배경 */
  backdrop-filter: blur(4px); /* 흐림 효과 */
  padding: 1rem;
}

/* 모달 카드 */
.modal-card {
  background-color: white;
  width: 100%;
  max-width: 440px; /* 적당한 너비 */
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  transform: scale(1);
}

/* 등장 애니메이션 */
@keyframes pop-in {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-pop-in {
  animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 헤더 스타일 */
.card-header {
  background: linear-gradient(135deg, #2563eb, #4f46e5); /* 파란색 그라데이션 */
  padding: 1.5rem;
  text-align: center;
}
.icon-wrapper {
  margin: 0 auto 0.75rem auto;
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
}
.title {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.025em;
  margin: 0;
}
.subtitle {
  color: #dbeafe; /* 연한 파란색 텍스트 */
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* 본문 스타일 */
.card-body {
  padding: 2rem;
}
.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.25rem;
  margin-left: 0.25rem;
}
.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  color: #1f2937;
  outline: none;
  transition: all 0.2s;
}
.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: white;
}
.input-field::placeholder {
  color: #9ca3af;
}

/* 에러 박스 */
.error-box {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #dc2626;
  background-color: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fee2e2;
}

/* 제출 버튼 */
.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background-color: #2563eb;
  color: white;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
  margin-top: 0.5rem;
}
.submit-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 푸터 */
.card-footer {
  background-color: #f9fafb;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #f3f4f6;
}
.card-footer p {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}
</style>