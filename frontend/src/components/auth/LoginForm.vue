<script setup>
import { ref, onMounted } from 'vue';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, getAppId } from '../../firebase';
import { useSystemStore } from '../../stores/systemStore';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-vue-next';

const emit = defineEmits(['switch-mode']);
const systemStore = useSystemStore();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const error = ref('');

// 도메인 설정 로드
onMounted(() => systemStore.fetchConfig());

const getKoreanErrorMessage = (code) => {
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return '이메일 또는 비밀번호가 잘못되었습니다.';
  if (code === 'auth/wrong-password') return '비밀번호가 올바르지 않습니다.';
  if (code === 'auth/email-already-in-use') return '이미 가입된 이메일입니다.';
  return '오류: ' + code;
};

const handleLogin = async () => {
  error.value = ''; 
  isSubmitting.value = true;

  // 이메일 도메인 자동 완성
  let loginEmail = email.value.trim();
  if (!loginEmail.includes('@')) {
    const domain = systemStore.config.domain || 'school.kr';
    loginEmail = `${loginEmail}@${domain}`;
  }

  try {
    // 1. 일반 로그인 시도
    await signInWithEmailAndPassword(auth, loginEmail, password.value);
    // 성공 시 App.vue의 onAuthStateChanged가 반응함
  } catch (err) {
    // 2. 계정이 없는 경우 -> 대기자 명단(pre_users) 확인하여 활성화 시도
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      await tryActivateAccount(loginEmail);
    } else {
      error.value = getKoreanErrorMessage(err.code);
      isSubmitting.value = false;
    }
  }
};

const tryActivateAccount = async (targetEmail) => {
  try {
    const appId = getAppId();
    const preUserRef = doc(db, 'artifacts', appId, 'pre_users', targetEmail);
    const preUserSnap = await getDoc(preUserRef);

    if (preUserSnap.exists()) {
      const preData = preUserSnap.data();
      
      // 초기 비밀번호 확인
      if (preData.initialPassword === password.value) {
        // 계정 생성 (가입)
        const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password.value);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: preData.name });

        // 프로필 DB 저장 (대기 데이터 승계)
        const userProfile = {
          ...preData,
          initialPassword: null, 
          joinedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid), userProfile);
        // 구버전 경로 호환 (필요시)
        await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid, 'profile', 'info'), userProfile);

        // 대기 명단 삭제
        await deleteDoc(preUserRef);

        // 상태 강제 갱신 (비밀번호 변경 모달 즉시 띄우기 위함)
        await systemStore.fetchCurrentUser(newUser.uid);

        return; 
      }
    }
    error.value = "등록되지 않은 사용자거나 비밀번호가 틀렸습니다.";
    isSubmitting.value = false;

  } catch (e) {
    console.error(e);
    if (e.code === 'auth/email-already-in-use') error.value = "이미 가입된 계정입니다. 비밀번호를 확인하세요.";
    else error.value = "계정 활성화 오류: " + e.message;
    isSubmitting.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin" class="form-content">
    <div class="input-group">
      <label>아이디 (이메일)</label>
      <div class="icon-input">
        <Mail class="field-icon" />
        <input 
          type="text" 
          required 
          v-model="email" 
          :placeholder="`예: 10101 (자동으로 @${systemStore.config.domain || 'school.kr'} 추가)`" 
        />
      </div>
    </div>

    <div class="input-group">
      <label>비밀번호</label>
      <div class="icon-input">
        <Lock class="field-icon" />
        <input type="password" required v-model="password" placeholder="••••••••" />
      </div>
    </div>

    <div v-if="error" class="message error">
      <AlertCircle class="msg-icon" /> {{ error }}
    </div>

    <button type="submit" :disabled="isSubmitting" class="btn-submit">
      <Loader2 v-if="isSubmitting" class="spinner" />
      <span v-else>로그인</span>
    </button>
    
    <div class="form-footer">
      <button type="button" @click="$emit('switch-mode')" class="btn-link">
        계정이 없으신가요? 회원가입하기
      </button>
    </div>
  </form>
</template>

<style scoped>
/* 공통 스타일은 부모나 전역 CSS에서 관리하거나, 필요한 부분만 복사 */
.form-content { display: flex; flex-direction: column; gap: 1rem; }
.input-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #111827; }
input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.25rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.icon-input { position: relative; }
.field-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6b7280; }
.btn-submit { width: 100%; padding: 0.75rem; background-color: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: background 0.2s; }
.btn-submit:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.message { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
.message.error { background: #fef2f2; color: #dc2626; }
.msg-icon { width: 1.25rem; height: 1.25rem; }
.spinner { animation: spin 1s linear infinite; width: 1.25rem; height: 1.25rem; }
.form-footer { text-align: center; margin-top: 1.5rem; }
.btn-link { background: none; border: none; color: #2563eb; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
.btn-link:hover { text-decoration: underline; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>