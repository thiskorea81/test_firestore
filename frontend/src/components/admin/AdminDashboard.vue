<script setup>
import { ref } from 'vue';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { LogOut, Settings, Users } from 'lucide-vue-next';

import SystemConfig from './parts/SystemConfig.vue';
import UserManagement from './parts/UserManagement.vue';

const activeTab = ref('config');

const handleLogout = async () => {
  if (confirm("관리자 로그아웃 하시겠습니까?")) await signOut(auth);
};
</script>

<template>
  <div class="admin-wrapper">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">A</div>
        <span>관리자 모드</span>
      </div>
      
      <nav class="nav-menu">
        <button @click="activeTab = 'config'" :class="{ active: activeTab === 'config' }">
          <Settings class="w-5 h-5 mr-2"/> 시스템 설정
        </button>
        <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">
          <Users class="w-5 h-5 mr-2"/> 사용자 관리
        </button>
      </nav>

      <button @click="handleLogout" class="logout-btn">
        <LogOut class="w-5 h-5 mr-2"/> 로그아웃
      </button>
    </aside>

    <main class="content-area">
      <SystemConfig v-if="activeTab === 'config'" />
      <UserManagement v-if="activeTab === 'users'" />
    </main>
  </div>
</template>

<style scoped>
.admin-wrapper { display: flex; min-height: 100vh; background: #f3f4f6; }
.sidebar { width: 250px; background: #1f2937; color: white; display: flex; flex-direction: column; padding: 1.5rem; }
.brand { display: flex; align-items: center; font-size: 1.25rem; font-weight: 800; margin-bottom: 3rem; gap: 0.75rem; }
.logo { width: 32px; height: 32px; background: #ef4444; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; }

.nav-menu { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.nav-menu button { display: flex; align-items: center; padding: 0.75rem 1rem; color: #9ca3af; background: none; border: none; cursor: pointer; text-align: left; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; }
.nav-menu button:hover { background: #374151; color: white; }
.nav-menu button.active { background: #2563eb; color: white; }

.logout-btn { display: flex; align-items: center; margin-top: auto; color: #9ca3af; background: none; border: none; cursor: pointer; padding: 0.75rem 1rem; }
.logout-btn:hover { color: #ef4444; }

.content-area { flex: 1; padding: 2rem; overflow-y: auto; }
</style>