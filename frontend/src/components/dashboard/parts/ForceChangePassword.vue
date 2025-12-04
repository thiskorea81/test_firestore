<script setup>
import { ref } from 'vue';
import { updatePassword } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db, getAppId } from '../../../firebase';
import { Lock, Save, Loader2 } from 'lucide-vue-next';

const props = defineProps({ user: Object });

const newPassword = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);
const error = ref('');

const handleChange = async () => {
  error.value = '';
  if (newPassword.value.length < 6) {
    error.value = '비밀번호는 6자 이상이어야 합니다.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  isSubmitting.value = true;
  try {
    // 1. Auth 비밀번호 변경
    await updatePassword(props.user, newPassword.value);
    
    // 2. DB 플래그 해제
    const appId = getAppId();
    await updateDoc(doc(db, 'artifacts', appId, 'users', props.user.uid, 'profile', 'info'), {
      mustChangePassword: false
    });

    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    window.location.reload(); // 재로그인 유도
  } catch (e) {
    console.error(e);
    error.value = "변경 실패: 다시 로그인 후 시도해주세요 (보안상 재인증 필요)";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
      <div class="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Lock class="w-6 h-6 text-red-600"/>
      </div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">비밀번호 변경 필요</h2>
      <p class="text-gray-600 mb-6 text-sm">
        관리자에 의해 등록된 계정입니다.<br>
        보안을 위해 <strong>새로운 비밀번호</strong>를 설정해주세요.
      </p>

      <form @submit.prevent="handleChange" class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">새 비밀번호</label>
          <input type="password" v-model="newPassword" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="6자 이상 입력" required />
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">비밀번호 확인</label>
          <input type="password" v-model="confirmPassword" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="한 번 더 입력" required />
        </div>

        <div v-if="error" class="text-red-500 text-sm font-bold">{{ error }}</div>

        <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center">
          <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin"/>
          <span v-else>비밀번호 변경하기</span>
        </button>
      </form>
    </div>
  </div>
</template>