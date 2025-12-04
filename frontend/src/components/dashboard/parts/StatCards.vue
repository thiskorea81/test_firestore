<script setup>
import { onMounted, watch } from 'vue';
import { useAbsenceStore } from '../../../stores/absenceStore';
import { useSystemStore } from '../../../stores/systemStore'; // [추가]
import { CalendarClock, MapPin, Plane } from 'lucide-vue-next';

const props = defineProps({ user: Object, userData: Object });

const store = useAbsenceStore();
const systemStore = useSystemStore(); // 시스템 설정 스토어

const loadData = () => {
  if (props.user?.uid) store.fetchSubmissions(props.user.uid);
  systemStore.fetchConfig(); // 관리자 설정값 로드
};

onMounted(loadData);
watch(() => props.user?.uid, loadData);
</script>

<template>
  <div class="stat-container">
    <h4 class="section-sub-title"><CalendarClock class="w-4 h-4 mr-1"/> 잔여 일수 현황</h4>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      
      <div v-if="userData?.gender === 'female'" class="stat-card pink">
        <span class="stat-label">인정결석(생리통) (월 {{ systemStore.config.limits.menstrual }}회)</span>
        <div class="stat-value-box">
          <span v-if="store.isMenstrualAvailable" class="text-green-600 font-bold">사용 가능</span>
          <span v-else class="text-red-500 font-bold">이번 달 사용함</span>
        </div>
      </div>
      <div v-else class="stat-card gray">
        <span class="stat-label">인정결석(생리통)</span>
        <span class="text-gray-400 text-sm mt-1">해당 없음</span>
      </div>

      <div class="stat-card blue">
        <div class="flex justify-between items-center mb-1">
          <span class="stat-label"><MapPin class="w-3 h-3 inline mr-1"/>국내 체험학습</span>
          <span class="text-xs font-bold text-blue-600">
            {{ systemStore.config.limits.domesticTrip - store.tripUsage.domestic }}일 남음
          </span>
        </div>
        <div class="w-full bg-blue-100 rounded-full h-2.5">
          <div class="bg-blue-500 h-2.5 rounded-full" 
               :style="`width: ${(store.tripUsage.domestic / systemStore.config.limits.domesticTrip) * 100}%`"></div>
        </div>
        <div class="text-right text-xs text-gray-500 mt-1">
          사용: {{ store.tripUsage.domestic }} / {{ systemStore.config.limits.domesticTrip }}일
        </div>
      </div>

      <div class="stat-card purple">
        <div class="flex justify-between items-center mb-1">
          <span class="stat-label"><Plane class="w-3 h-3 inline mr-1"/>국외 체험학습</span>
          <span class="text-xs font-bold text-purple-600">
            {{ systemStore.config.limits.overseasTrip - store.tripUsage.overseas }}일 남음
          </span>
        </div>
        <div class="w-full bg-purple-100 rounded-full h-2.5">
          <div class="bg-purple-500 h-2.5 rounded-full" 
               :style="`width: ${(store.tripUsage.overseas / systemStore.config.limits.overseasTrip) * 100}%`"></div>
        </div>
        <div class="text-right text-xs text-gray-500 mt-1">
          사용: {{ store.tripUsage.overseas }} / {{ systemStore.config.limits.overseasTrip }}일
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일 유지 */
.stat-container { grid-column: 1 / -1; margin-top: 1rem; margin-bottom: 0.5rem; }
.section-sub-title { font-size: 0.875rem; font-weight: 700; color: #6b7280; margin-bottom: 0.75rem; display: flex; align-items: center; }
.stat-card { padding: 1rem; border-radius: 0.75rem; border: 1px solid; display: flex; flex-direction: column; justify-content: center; background: white; }
.stat-card.pink { background: #fdf2f8; border-color: #fbcfe8; }
.stat-card.gray { background: #f9fafb; border-color: #e5e7eb; opacity: 0.6; }
.stat-card.blue { background: #eff6ff; border-color: #bfdbfe; }
.stat-card.purple { background: #f5f3ff; border-color: #ddd6fe; }
.stat-label { font-size: 0.75rem; font-weight: 700; color: #4b5563; }
.stat-value-box { font-size: 1.1rem; margin-top: 0.25rem; }
</style>