<script setup>
import { ref } from 'vue';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, getAppId } from '../../firebase';
import { useSystemStore } from '../../stores/systemStore';
import { 
  UserPlus, GraduationCap, Baby, School, 
  Phone, Mail, Lock, AlertCircle, CheckCircle, Loader2, User
} from 'lucide-vue-next';

const emit = defineEmits(['switch-mode']);
const systemStore = useSystemStore();

const email = ref('');
const password = ref('');
const name = ref('');
const role = ref('student');

// 상세 정보
const grade = ref('');
const cls = ref('');
const num = ref('');
const userPhone = ref('');
const childName = ref('');
const parentName = ref('');
const parentPhone = ref('');
const gender = ref('male');

const isSubmitting = ref(false);
const error = ref('');
const successMsg = ref('');
const appId = getAppId();

const getKoreanErrorMessage = (code) => {
  if (code === 'auth/email-already-in-use') return '이미 가입된 이메일입니다.';
  if (code === 'auth/invalid-email') return '유효하지 않은 이메일 형식입니다.';
  if (code === 'auth/weak-password') return '비밀번호는 6자 이상이어야 합니다.';
  return '오류: ' + code;
};

const handleSignUp = async () => {
  error.value = '';
  if (!name.value.trim()) { error.value = '이름을 입력해주세요.'; return; }
  
  if (role.value === 'student' && (!grade.value || !cls.value || !num.value || !userPhone.value || !parentName.value || !parentPhone.value)) {
     error.value = '모든 정보를 입력해주세요.'; return;
  }

  isSubmitting.value = true;

  try {
    // 이메일 도메인 자동 완성
    let signupEmail = email.value.trim();
    if (!signupEmail.includes('@')) {
       const domain = systemStore.config.domain || 'school.kr';
       signupEmail = `${signupEmail}@${domain}`;
    }

    // 1. 대기 명단 확인
    const preUserRef = doc(db, 'artifacts', appId, 'pre_users', signupEmail);
    const preUserSnap = await getDoc(preUserRef);
    const isPreRegistered = preUserSnap.exists();
    const preData = isPreRegistered ? preUserSnap.data() : null;

    // 2. 계정 생성
    const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, password.value);
    const newUser = userCredential.user;
    
    const finalName = preData?.name || name.value;
    await updateProfile(newUser, { displayName: finalName });

    // 3. 데이터 구성
    let userProfile = {
      email: signupEmail,
      name: finalName,
      role: preData?.role || role.value, 
      joinedAt: new Date().toISOString(),
      mustChangePassword: isPreRegistered ? true : false,
      isNewUser: isPreRegistered ? true : false 
    };

    if (userProfile.role === 'student') {
      const fGrade = preData?.grade || String(grade.value);
      const fClass = preData?.class || String(cls.value).padStart(2,'0');
      const fNum = preData?.number || String(num.value).padStart(2,'0');
      
      userProfile = { 
        ...userProfile, 
        studentId: preData?.studentId || `${fGrade}${fClass}${fNum}`,
        grade: fGrade, class: fClass, number: fNum, 
        phone: userPhone.value,
        parentName: parentName.value, parentPhone: parentPhone.value,
        gender: preData?.gender || gender.value 
      };
    } else if (userProfile.role === 'parent') {
      userProfile = { ...userProfile, childName: childName.value, phone: userPhone.value };
    } else if (userProfile.role === 'teacher') {
      userProfile = { ...userProfile, assignedGrade: String(grade.value), assignedClass: String(cls.value).padStart(2,'0') };
    }

    // 4. 저장 (신규 경로 + 구버전 경로)
    await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid), userProfile);
    await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid, 'profile', 'info'), userProfile);

    // 5. 대기 명단 정리
    if (isPreRegistered) {
      await deleteDoc(preUserRef);
    }
    
    setSuccessMsg.value = '가입 완료! 잠시 후 로그인됩니다...';
    setTimeout(() => { window.location.reload(); }, 1500);

  } catch (err) {
    console.error(err);
    error.value = getKoreanErrorMessage(err.code);
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="auth-body">
    <div class="role-tabs">
      <button type="button" @click="role = 'student'" :class="{ active: role === 'student' }"><GraduationCap class="tab-icon"/> 학생</button>
      <button type="button" @click="role = 'parent'" :class="{ active: role === 'parent' }"><Baby class="tab-icon"/> 학부모</button>
      <button type="button" @click="role = 'teacher'" :class="{ active: role === 'teacher' }"><School class="tab-icon"/> 교사</button>
    </div>

    <form @submit.prevent="handleSignUp" class="form-content">
      
      <div class="input-group"><label>이름</label><input type="text" required v-model="name" placeholder="본인 성함" /></div>

      <div v-if="role === 'student'" class="sub-form student-form">
        <p class="sub-title">학생 필수 정보</p>
        <div class="gender-box">
          <label class="radio-label"><input type="radio" v-model="gender" value="male"> 남학생</label>
          <label class="radio-label"><input type="radio" v-model="gender" value="female"> 여학생</label>
        </div>
        <div class="row-inputs">
          <input type="number" v-model="grade" placeholder="학년" />
          <input type="number" v-model="cls" placeholder="반" />
          <input type="number" v-model="num" placeholder="번호" />
        </div>
        <div class="icon-input mb-3"><Phone class="field-icon"/><input type="tel" v-model="userPhone" placeholder="학생 연락처"/></div>
        <p class="sub-title mt-4" style="color:#4b5563">보호자 정보</p>
        <div class="icon-input mb-2"><User class="field-icon"/><input type="text" v-model="parentName" placeholder="보호자 성함"/></div>
        <div class="icon-input"><Phone class="field-icon"/><input type="tel" v-model="parentPhone" placeholder="보호자 연락처"/></div>
      </div>

      <div v-if="role === 'parent'" class="sub-form parent-form">
         <input type="text" v-model="childName" placeholder="자녀 이름" class="mb-2 w-full border p-2 rounded"/>
         <input type="tel" v-model="userPhone" placeholder="연락처" class="w-full border p-2 rounded"/>
      </div>
      
      <div v-if="role === 'teacher'" class="sub-form teacher-form">
         <div class="row-inputs"><input type="number" v-model="grade" placeholder="학년"/><input type="number" v-model="cls" placeholder="반"/></div>
      </div>

      <div class="input-group">
        <label>아이디 (이메일)</label>
        <div class="icon-input">
          <Mail class="field-icon" />
          <input type="text" required v-model="email" placeholder="예: 10101" />
        </div>
      </div>

      <div class="input-group">
        <label>비밀번호</label>
        <div class="icon-input">
          <Lock class="field-icon" />
          <input type="password" required v-model="password" placeholder="••••••••" />
        </div>
      </div>

      <div v-if="error" class="message error"><AlertCircle class="msg-icon"/> {{ error }}</div>
      <div v-if="successMsg" class="message success"><CheckCircle class="msg-icon"/> {{ successMsg }}</div>

      <button type="submit" :disabled="isSubmitting" class="btn-submit">
        <Loader2 v-if="isSubmitting" class="spinner"/>
        <span v-else>가입하기</span>
      </button>
    </form>

    <div class="form-footer">
      <button type="button" @click="$emit('switch-mode')" class="btn-link">
        이미 계정이 있으신가요? 로그인하기
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 공통 스타일 복사 또는 별도 css 파일 사용 추천 */
.auth-body { padding: 0 2rem 2rem; }
.role-tabs { display: flex; background: #f3f4f6; padding: 4px; border-radius: 0.5rem; margin-bottom: 1.5rem; }
.role-tabs button { flex: 1; border: none; background: transparent; padding: 0.5rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; }
.role-tabs button.active { background: white; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.form-content { display: flex; flex-direction: column; gap: 1rem; }
.input-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #111827; }
input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.25rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.icon-input { position: relative; }
.field-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6b7280; }
.row-inputs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.row-inputs input { flex: 1; min-width: 0; padding-left: 1rem; }
.sub-form { padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; }
.student-form { background: #e0e7ff; border: 1px solid #c7d2fe; }
.parent-form { background: #fce7f3; border: 1px solid #fbcfe8; }
.teacher-form { background: #dcfce7; border: 1px solid #bbf7d0; }
.sub-title { margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.student-form .sub-title { color: #3730a3; }
.parent-form .sub-title { color: #831843; }
.teacher-form .sub-title { color: #14532d; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.btn-submit { width: 100%; padding: 0.75rem; background-color: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: background 0.2s; }
.btn-submit:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.message { padding: 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
.message.error { background: #fef2f2; color: #dc2626; }
.message.success { background: #f0fdf4; color: #16a34a; }
.msg-icon, .icon, .tab-icon { width: 1.25rem; height: 1.25rem; }
.icon { color: white; width: 1.5rem; height: 1.5rem; }
.spinner { animation: spin 1s linear infinite; width: 1.25rem; height: 1.25rem; }
.form-footer { text-align: center; margin-top: 1.5rem; }
.btn-link { background: none; border: none; color: #2563eb; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
.btn-link:hover { text-decoration: underline; }
.gender-box { display: flex; gap: 1rem; margin-bottom: 1rem; background: white; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #c7d2fe; }
.radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; font-weight: 500; color: #3730a3; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>