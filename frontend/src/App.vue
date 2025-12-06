<script setup>
import { ref, onMounted } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, getAppId } from './firebase';

import LoadingSpinner from './components/LoadingSpinner.vue';
import Dashboard from './components/Dashboard.vue';
import AuthForm from './components/AuthForm.vue';
import AdminDashboard from './components/admin/AdminDashboard.vue';

const user = ref(null);
const loading = ref(true);
const userData = ref(null);
const appId = getAppId();

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    
    if (currentUser) {
      try {
        // [중요] 경로 수정: users/{uid}
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          userData.value = docSnap.data();
        } else {
          // 관리자 예외 처리 (필요시)
          if (currentUser.email === 'admin@admin.com') {
             userData.value = { name: '관리자', email: currentUser.email, role: 'admin' };
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