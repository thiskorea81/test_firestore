import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useAbsenceStore = defineStore('absence', () => {
  const submissions = ref([]);
  const loading = ref(false);

  // DB에서 내 신청 내역 가져오기
  const fetchSubmissions = async (userId) => {
    if (!userId) return;
    loading.value = true;
    const appId = getAppId();
    
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'submissions'),
        where('userId', '==', userId),
        // '승인'된 것만 칠 것인지, '제출완료'도 칠 것인지 정책에 따라 다름.
        // 여기서는 일단 모든 제출 내역을 기준으로 계산합니다.
      );
      
      const snapshot = await getDocs(q);
      submissions.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Store Fetch Error:", e);
    } finally {
      loading.value = false;
    }
  };

  // [계산 1] 이번 달 생리결석 사용 여부 (True: 사용가능, False: 이미씀)
  const isMenstrualAvailable = computed(() => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // "2025-12"

    // 이번 달에 '생리결석'으로 제출된 문서가 있는지 확인
    const used = submissions.value.some(sub => 
      sub.absenceType === '생리결석' && 
      sub.period?.start?.startsWith(currentMonth) &&
      sub.status !== '반려' // 반려된 건은 사용 안 한 것으로 간주
    );
    return !used;
  });

  // [계산 2] 체험학습 사용 일수 (국내/국외)
  // 가정: 체험학습 신청서는 type: '체험학습신청서', tripType: 'domestic' or 'overseas' 로 저장된다고 가정
  const tripUsage = computed(() => {
    let domestic = 0;
    let overseas = 0;

    submissions.value.forEach(sub => {
      if (sub.status === '반려') return; // 반려 제외

      // type 체크 (체험학습신청서 양식이 구현되면 이 이름으로 저장해야 함)
      if (sub.type === '체험학습신청서' || sub.type === '체험학습신청') {
        const days = Number(sub.period?.days || 0);
        
        // tripType 필드가 있다고 가정 (없으면 국내로 기본 처리)
        if (sub.tripType === 'overseas') {
          overseas += days;
        } else {
          domestic += days;
        }
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