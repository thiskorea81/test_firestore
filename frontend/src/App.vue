<script setup>
import { ref, onMounted, computed } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useSystemStore } from './stores/systemStore'; // [추가]

import LoadingSpinner from './components/LoadingSpinner.vue';
import Dashboard from './components/Dashboard.vue';
import AuthForm from './components/AuthForm.vue';
import AdminDashboard from './components/admin/AdminDashboard.vue';

const user = ref(null);
const loading = ref(true);
const store = useSystemStore();

// store의 데이터를 computed로 연결
const userData = computed(() => store.currentUserData);

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    
    if (currentUser) {
      // [수정] 스토어를 통해 데이터 로드
      await store.fetchCurrentUser(currentUser.uid);
      
      // 관리자 예외 처리 (초기 설정용)
      if (currentUser.email === 'admin@admin.com' && !store.currentUserData) {
        store.currentUserData = { name: '관리자', email: currentUser.email, role: 'admin' };
      }
    } else {
      store.currentUserData = null;
    }
    
    loading.value = false;
  });
});
</script>

<template>
  <LoadingSpinner v-if="loading" />
  
  <AdminDashboard 
    v-else-if="user && userData?.role === 'admin'" 
  />
  
  <Dashboard 
    v-else-if="user" 
    :user="user" 
    :userData="userData" 
  />
  
  <AuthForm v-else />
</template>