<script setup>
import { ref } from 'vue';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, getAppId } from '../firebase';
import { LogIn, UserPlus, GraduationCap, Baby, School, Phone, Mail, Lock, AlertCircle, CheckCircle, Loader2, User } from 'lucide-vue-next';

const authMode = ref('login');
const email = ref('');
const password = ref('');
const name = ref('');
const role = ref('student');
const grade = ref(''); const cls = ref(''); const num = ref(''); const userPhone = ref('');
const childName = ref(''); const parentName = ref(''); const parentPhone = ref(''); const gender = ref('male');
const isSubmitting = ref(false); const error = ref(''); const successMsg = ref('');
const appId = getAppId();

const getKoreanErrorMessage = (code) => {
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return '이메일 또는 비밀번호가 잘못되었습니다.';
  if (code === 'auth/wrong-password') return '비밀번호가 올바르지 않습니다.';
  if (code === 'auth/email-already-in-use') return '이미 가입된 이메일입니다.';
  return '오류: ' + code;
};

const resetForm = () => { /* 변수 초기화 */ error.value = ''; successMsg.value = ''; };
const toggleMode = () => { authMode.value = authMode.value === 'login' ? 'signup' : 'login'; resetForm(); };

const handleLogin = async () => {
  error.value = ''; isSubmitting.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      await tryActivateAccount();
    } else {
      error.value = getKoreanErrorMessage(err.code);
      isSubmitting.value = false;
    }
  }
};

const tryActivateAccount = async () => {
  try {
    const preUserRef = doc(db, 'artifacts', appId, 'pre_users', email.value);
    const preUserSnap = await getDoc(preUserRef);

    if (preUserSnap.exists()) {
      const preData = preUserSnap.data();
      if (preData.initialPassword === password.value) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: preData.name });

        // [중요] 경로 변경: users/{uid}
        await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid), {
          ...preData, initialPassword: null, joinedAt: new Date().toISOString()
        });

        await deleteDoc(preUserRef);
        return; 
      }
    }
    error.value = "등록되지 않은 사용자거나 비밀번호가 틀렸습니다."; isSubmitting.value = false;
  } catch (e) { console.error(e); error.value = "활성화 오류: " + e.message; isSubmitting.value = false; }
};

const handleSignUp = async () => {
  error.value = '';
  if (!name.value.trim()) { error.value = '이름 입력 필수'; return; }
  // (유효성 검사 생략 - 기존과 동일)
  
  isSubmitting.value = true;
  try {
    const preUserRef = doc(db, 'artifacts', appId, 'pre_users', email.value);
    const preUserSnap = await getDoc(preUserRef);
    const isPreRegistered = preUserSnap.exists();
    const preData = isPreRegistered ? preUserSnap.data() : null;

    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const newUser = userCredential.user;
    const finalName = preData?.name || name.value;
    await updateProfile(newUser, { displayName: finalName });

    let userProfile = {
      email: email.value, name: finalName, role: preData?.role || role.value,
      joinedAt: new Date().toISOString(), mustChangePassword: isPreRegistered
    };

    if (userProfile.role === 'student') {
      const fGrade = preData?.grade || String(grade.value);
      const fClass = preData?.class || String(cls.value).padStart(2,'0');
      const fNum = preData?.number || String(num.value).padStart(2,'0');
      userProfile = { 
        ...userProfile, studentId: preData?.studentId || `${fGrade}${fClass}${fNum}`,
        grade: fGrade, class: fClass, number: fNum, phone: userPhone.value,
        parentName: parentName.value, parentPhone: parentPhone.value, gender: preData?.gender || gender.value 
      };
    } else if (userProfile.role === 'parent') {
      userProfile = { ...userProfile, childName: childName.value, phone: userPhone.value };
    } else if (userProfile.role === 'teacher') {
      userProfile = { ...userProfile, assignedGrade: String(grade.value), assignedClass: String(cls.value).padStart(2,'0') };
    }

    // [중요] 경로 변경: users/{uid}
    await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid), userProfile);

    if (isPreRegistered) await deleteDoc(preUserRef);
    
    setSuccessMsg.value = '가입 완료! 로그인 중...';
    setTimeout(() => { window.location.reload(); }, 1500);
  } catch (err) { console.error(err); error.value = getKoreanErrorMessage(err.code); isSubmitting.value = false; }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="icon-box"><LogIn v-if="authMode === 'login'" class="icon"/><UserPlus v-else class="icon"/></div>
        <h2>{{ authMode === 'login' ? 'Teacher Diary 로그인' : '새 계정 만들기' }}</h2>
      </div>
      <div class="auth-body">
        <div v-if="authMode === 'signup'" class="role-tabs">
          <button type="button" @click="role = 'student'" :class="{ active: role === 'student' }"><GraduationCap class="tab-icon"/> 학생</button>
          <button type="button" @click="role = 'parent'" :class="{ active: role === 'parent' }"><Baby class="tab-icon"/> 학부모</button>
          <button type="button" @click="role = 'teacher'" :class="{ active: role === 'teacher' }"><School class="tab-icon"/> 교사</button>
        </div>
        <form @submit.prevent="authMode === 'login' ? handleLogin() : handleSignUp()" class="form-content">
          <div v-if="authMode === 'signup'" class="input-group"><label>이름</label><input type="text" required v-model="name" placeholder="본인 성함" /></div>
          <div v-if="authMode === 'signup' && role === 'student'" class="sub-form student-form">
            <p class="sub-title">학생 필수 정보</p>
            <div class="gender-box"><label class="radio-label"><input type="radio" v-model="gender" value="male"> 남학생</label><label class="radio-label"><input type="radio" v-model="gender" value="female"> 여학생</label></div>
            <div class="row-inputs"><input type="number" v-model="grade" placeholder="학년" /><input type="number" v-model="cls" placeholder="반" /><input type="number" v-model="num" placeholder="번호" /></div>
            <div class="icon-input mb-3"><Phone class="field-icon"/><input type="tel" v-model="userPhone" placeholder="학생 연락처"/></div>
            <p class="sub-title mt-4" style="color:#4b5563">보호자 정보</p>
            <div class="icon-input mb-2"><User class="field-icon"/><input type="text" v-model="parentName" placeholder="보호자 성함"/></div>
            <div class="icon-input"><Phone class="field-icon"/><input type="tel" v-model="parentPhone" placeholder="보호자 연락처"/></div>
          </div>
          <div v-if="authMode === 'signup' && role === 'parent'" class="sub-form parent-form"><input type="text" v-model="childName" placeholder="자녀 이름" class="mb-2 w-full border p-2 rounded"/><input type="tel" v-model="userPhone" placeholder="연락처" class="w-full border p-2 rounded"/></div>
          <div v-if="authMode === 'signup' && role === 'teacher'" class="sub-form teacher-form"><div class="row-inputs"><input type="number" v-model="grade" placeholder="학년"/><input type="number" v-model="cls" placeholder="반"/></div></div>
          <div class="input-group"><label>이메일</label><div class="icon-input"><Mail class="field-icon"/><input type="email" required v-model="email" placeholder="name@school.com"/></div></div>
          <div class="input-group"><label>비밀번호</label><div class="icon-input"><Lock class="field-icon"/><input type="password" required v-model="password" placeholder="••••••••"/></div></div>
          <div v-if="error" class="message error"><AlertCircle class="msg-icon"/> {{ error }}</div>
          <div v-if="successMsg" class="message success"><CheckCircle class="msg-icon"/> {{ successMsg }}</div>
          <button type="submit" :disabled="isSubmitting" class="btn-submit"><Loader2 v-if="isSubmitting" class="spinner"/><span v-else>{{ authMode === 'login' ? '로그인' : '가입하기' }}</span></button>
        </form>
        <div class="form-footer"><button type="button" @click="toggleMode" class="btn-link">{{ authMode === 'login' ? '계정이 없으신가요? 회원가입하기' : '이미 계정이 있으신가요? 로그인하기' }}</button></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일 */
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background-color: #f3f4f6; }
.auth-card { width: 100%; max-width: 420px; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; }
.auth-header { padding: 2rem 2rem 1.5rem; text-align: center; }
.icon-box { width: 48px; height: 48px; background: #2563eb; border-radius: 12px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); }
.auth-header h2 { margin: 0; font-size: 1.5rem; color: #111827; }
.auth-body { padding: 0 2rem 2rem; }
.role-tabs { display: flex; background: #f3f4f6; padding: 4px; border-radius: 0.5rem; margin-bottom: 1.5rem; }
.role-tabs button { flex: 1; border: none; background: transparent; padding: 0.5rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; }
.role-tabs button.active { background: white; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.form-content { display: flex; flex-direction: column; gap: 1rem; }
.input-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #111827; }
input { width: 100%; padding: 0.625rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.icon-input { position: relative; }
.field-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6b7280; }
.icon-input input { padding-left: 2.25rem; }
.row-inputs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.row-inputs input { flex: 1; min-width: 0; }
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