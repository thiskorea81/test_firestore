import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, getAppId } from '../firebase';
import { useSystemStore } from './systemStore'; // 관리자 설정값(월 제한) 가져오기

export const useAbsenceStore = defineStore('absence', () => {
  const submissions = ref([]);
  const loading = ref(false);
  const systemStore = useSystemStore();

  const fetchSubmissions = async (userId) => {
    if (!userId) return;
    loading.value = true;
    const appId = getAppId();
    
    try {
      // 내 신청 내역 조회
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      submissions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Store Fetch Error:", e);
    } finally {
      loading.value = false;
    }
  };

  // [계산 1] 이번 달 생리결석 사용 여부 (지각/조퇴/결과/결석 모두 포함)
  const isMenstrualAvailable = computed(() => {
    // 관리자 설정 제한값 (기본 1회)
    const limit = systemStore.config.limits.menstrual || 1;
    
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM"

    // 이번 달에 '인정결석(생리통)'으로 신청된 건수 계산 (반려 제외)
    const usedCount = submissions.value.filter(sub => 
      sub.absenceType === '인정결석(생리통)' && 
      sub.period?.start?.startsWith(currentMonth) &&
      sub.status !== '반려'
    ).length;

    return usedCount < limit; // 사용 횟수가 제한보다 적으면 true(사용가능)
  });

  // [계산 2] 체험학습 사용 일수
  const tripUsage = computed(() => {
    let domestic = 0;
    let overseas = 0;

    submissions.value.forEach(sub => {
      if (sub.status === '반려') return;
      if (sub.type === '체험학습신청서' || sub.type === '체험학습신청') {
        const days = Number(sub.period?.days || 0);
        if (sub.tripType === 'overseas') overseas += days;
        else domestic += days;
      }
    });

    return { domestic, overseas };
  });

  return {
    submissions,
    loading,
    fetchSubmissions,
    isMenstrualAvailable,
    tripUsage
  };
});