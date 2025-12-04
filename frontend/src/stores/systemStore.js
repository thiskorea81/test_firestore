import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useSystemStore = defineStore('system', () => {
  const appId = getAppId();
  
  // 기본 설정
  const config = ref({
    limits: { menstrual: 1, domesticTrip: 5, overseasTrip: 30 },
    approvalLine: [
      { role: '담임', label: '담임', isFinal: false },
      { role: '학년계', label: '학년계', isFinal: false },
      { role: '학생부계', label: '학생부계', isFinal: false },
      { role: '부장', label: '부장', isFinal: true },
      { role: '교감', label: '교감', isFinal: true },
      { role: '교장', label: '교장', isFinal: true }
    ]
  });
  
  const loading = ref(false);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'config', 'system');
      const snap = await getDoc(docRef);
      if (snap.exists()) config.value = snap.data();
      else await setDoc(docRef, config.value);
    } catch (e) { console.error(e); }
  };

  const saveConfig = async (newConfig) => {
    try {
      loading.value = true;
      await setDoc(doc(db, 'artifacts', appId, 'config', 'system'), newConfig);
      config.value = newConfig;
      alert("설정이 저장되었습니다.");
    } catch (e) { console.error(e); alert("저장 실패"); }
    finally { loading.value = false; }
  };

  // 3. 사용자 일괄 등록 (가입 대기 명단 생성)
  const bulkCreateUsers = async (users) => {
    try {
      loading.value = true;
      const batch = writeBatch(db);
      
      users.forEach((user) => {
        // [중요] 'pre_users' 컬렉션에 이메일을 키(Key)로 저장
        // 사용자가 실제 가입할 때 이 데이터를 참조함
        const preUserRef = doc(db, 'artifacts', appId, 'pre_users', user.email);
        
        const baseData = {
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: true, // [필수] 첫 로그인 시 비번 변경 강제
          registeredAt: new Date().toISOString()
        };

        if (user.role === 'student') {
          const sId = user.studentId || '';
          Object.assign(baseData, {
            studentId: sId,
            grade: sId.substring(0, 1),
            class: sId.substring(1, 3),
            number: sId.substring(3, 5),
            gender: user.gender || 'male',
          });
        }

        batch.set(preUserRef, baseData);
      });

      await batch.commit();
      alert(`${users.length}명이 등록 대기 명단에 추가되었습니다.\n사용자는 '회원가입'을 통해 계정을 활성화해야 합니다.`);
    } catch (e) {
      console.error(e);
      alert("일괄 등록 오류");
    } finally {
      loading.value = false;
    }
  };

  return { config, loading, fetchConfig, saveConfig, bulkCreateUsers };
});