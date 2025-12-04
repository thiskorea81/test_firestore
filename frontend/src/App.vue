<script setup>
import { ref, onMounted } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, getAppId } from './firebase';

import LoadingSpinner from './components/LoadingSpinner.vue';
import Dashboard from './components/Dashboard.vue';
import AuthForm from './components/AuthForm.vue';
import AdminDashboard from './components/admin/AdminDashboard.vue'; // [추가]

const user = ref(null);
const loading = ref(true);
const userData = ref(null);
const appId = getAppId();

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    
    if (currentUser) {
      try {
        // 1. 프로필 정보 가져오기
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          userData.value = docSnap.data();
        } else {
          // 2. [예외처리] 만약 관리자 이메일이라면 강제로 admin 권한 부여 (초기 세팅용)
          if (currentUser.email === 'admin@admin.com') {
             const adminData = { name: '관리자', email: currentUser.email, role: 'admin' };
             userData.value = adminData;
             // 필요하다면 여기서 DB에 admin 정보를 setDoc으로 저장해도 됨
          } else {
             userData.value = { name: currentUser.displayName, email: currentUser.email, role: 'unknown' };
          }
        }
      } catch (e) {
        console.error("DB Load Error:", e);
        userData.value = null;
      }
    } else {
      userData.value = null;
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