import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useSystemStore = defineStore('system', () => {
  const appId = getAppId();
  
  // --- State ---
  const config = ref({
    limits: {
      menstrual: 1, // 월 인정결석(생리통) 가능 일수
      domesticTrip: 5,
      overseasTrip: 30
    },
    approvalLine: [
      { role: '담임', label: '담임', isFinal: false },
      { role: '학년계', label: '학년계', isFinal: false },
      { role: '학생부계', label: '학생부계', isFinal: false },
      { role: '부장', label: '부장', isFinal: true }, // 전결
      { role: '교감', label: '교감', isFinal: true }, // 전결
      { role: '교장', label: '교장', isFinal: true }
    ]
  });
  
  const loading = ref(false);

  // --- Actions ---
  
  // 1. 시스템 설정 불러오기
  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'config', 'system');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        config.value = snap.data();
      } else {
        // 초기값 저장
        await setDoc(docRef, config.value);
      }
    } catch (e) {
      console.error("Config Load Error:", e);
    }
  };

  // 2. 설정 저장하기
  const saveConfig = async (newConfig) => {
    try {
      loading.value = true;
      await setDoc(doc(db, 'artifacts', appId, 'config', 'system'), newConfig);
      config.value = newConfig;
      alert("설정이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    } finally {
      loading.value = false;
    }
  };

  // 3. 사용자 일괄 등록 (CSV 데이터 -> DB 저장)
  // *주의: 실제 Auth 계정 생성은 Cloud Functions가 필요하므로, 여기서는 DB에 프로필 정보만 미리 생성합니다.
  const bulkCreateUsers = async (users) => {
    try {
      loading.value = true;
      const batch = writeBatch(db);
      
      users.forEach((user) => {
        // 임시 ID 생성 (이메일 기반 또는 랜덤)
        // 실제로는 사용자가 이 이메일로 가입할 때 매칭되도록 설계해야 함
        const tempUid = user.email.replace(/[@.]/g, '_'); 
        
        const userRef = doc(db, 'artifacts', appId, 'users', tempUid, 'profile', 'info');
        
        const baseData = {
          email: user.email,
          name: user.name,
          role: user.role,
          joinedAt: new Date().toISOString(),
          isPreRegistered: true // 관리자가 미리 등록함 표시
        };

        if (user.role === 'student') {
          // 학번 파싱 (예: 10101 -> grade:1, class:01, number:01)
          // CSV에서 학번이 어떤 포맷인지에 따라 다르지만, 여기서는 단순 문자열로 저장
          Object.assign(baseData, {
            studentId: user.studentId,
            grade: user.studentId.substring(0, 1),
            class: user.studentId.substring(1, 3),
            number: user.studentId.substring(3, 5),
            gender: 'male' // 기본값 (CSV에 성별이 없다면)
          });
        }

        batch.set(userRef, baseData);
      });

      await batch.commit();
      alert(`${users.length}명의 사용자가 데이터베이스에 등록되었습니다.\n(비밀번호 설정은 서버 연동이 필요합니다)`);
    } catch (e) {
      console.error(e);
      alert("일괄 등록 중 오류가 발생했습니다.");
    } finally {
      loading.value = false;
    }
  };

  return {
    config,
    loading,
    fetchConfig,
    saveConfig,
    bulkCreateUsers
  };
});