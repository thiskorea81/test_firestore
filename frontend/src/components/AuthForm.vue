<script setup>
import { ref } from 'vue';
import { LogIn, UserPlus } from 'lucide-vue-next';
import LoginForm from './auth/LoginForm.vue';
import SignupForm from './auth/SignupForm.vue';

const authMode = ref('login');
const toggleMode = () => {
  authMode.value = authMode.value === 'login' ? 'signup' : 'login';
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      
      <div class="px-8 pt-8 pb-6 text-center">
        <div class="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
          <LogIn v-if="authMode === 'login'" class="w-6 h-6 text-white"/>
          <UserPlus v-else class="w-6 h-6 text-white"/>
        </div>
        <h2 class="text-2xl font-bold text-gray-800">
          {{ authMode === 'login' ? 'Teacher Diary 로그인' : '새 계정 만들기' }}
        </h2>
      </div>

      <LoginForm v-if="authMode === 'login'" @switch-mode="toggleMode" />
      <SignupForm v-else @switch-mode="toggleMode" />

    </div>
  </div>
</template>