import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useSystemStore = defineStore('system', () => {
  const appId = getAppId();
  
  const config = ref({
    limits: {
      menstrual: 1, 
      domesticTrip: 5,
      overseasTrip: 30
    },
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
  const userList = ref([]);

  // 1. 설정 불러오기
  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'config', 'system');
      const snap = await getDoc(docRef);
      if (snap.exists()) config.value = snap.data();
      else await setDoc(docRef, config.value);
    } catch (e) { console.error("Config Load Error:", e); }
  };

  // 2. 설정 저장
  const saveConfig = async (newConfig) => {
    try {
      loading.value = true;
      await setDoc(doc(db, 'artifacts', appId, 'config', 'system'), newConfig);
      config.value = newConfig;
      alert("설정이 저장되었습니다.");
    } catch (e) { alert("저장 실패"); }
    finally { loading.value = false; }
  };

  // 3. 사용자 일괄 등록
  const bulkCreateUsers = async (users) => {
    try {
      loading.value = true;
      const batch = writeBatch(db);
      
      users.forEach((user) => {
        const preUserRef = doc(db, 'artifacts', appId, 'pre_users', user.email);
        
        const baseData = {
          email: user.email,
          name: user.name,
          role: user.role,
          initialPassword: user.password,
          isNewUser: true,
          mustChangePassword: true,
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
      alert(`${users.length}명이 등록되었습니다.\n목록 탭에서 확인하세요.`);
      await fetchAllUsers();
    } catch (e) {
      console.error(e);
      alert("일괄 등록 중 오류가 발생했습니다.");
    } finally {
      loading.value = false;
    }
  };

  // 4. 전체 사용자 목록 조회
  const fetchAllUsers = async () => {
    loading.value = true;
    try {
      userList.value = [];
      
      // A. 활성 사용자 (users 컬렉션)
      const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'users'));
      const activeUsers = usersSnap.docs.map(d => ({
        id: d.id, // uid
        ...d.data(),
        status: 'active'
      }));

      // B. 대기 사용자 (pre_users 컬렉션)
      const preSnap = await getDocs(collection(db, 'artifacts', appId, 'pre_users'));
      const pendingUsers = preSnap.docs.map(d => ({
        id: d.id, // email
        ...d.data(),
        status: 'pending'
      }));

      userList.value = [...activeUsers, ...pendingUsers];
      
    } catch (e) {
      console.error("List Fetch Error:", e);
    } finally {
      loading.value = false;
    }
  };

  // 5. [수정됨] 사용자 삭제 (구버전/신버전 경로 모두 대응)
  const deleteUser = async (user) => {
    if (!confirm(`'${user.name}' 사용자를 영구 삭제하시겠습니까?\n(이 작업은 되돌릴 수 없습니다)`)) return;
    
    try {
      loading.value = true;

      if (user.status === 'pending') {
        // [대기자 삭제]
        await deleteDoc(doc(db, 'artifacts', appId, 'pre_users', user.id));
      } else {
        // [활성 사용자 삭제]
        // 1. 신규 경로 삭제 시도 (users/{uid})
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id));
        
        // 2. 구버전 경로 삭제 시도 (users/{uid}/profile/info) - 혹시 남아있을 경우를 대비
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
        
        // *참고: Auth 계정은 클라이언트 SDK로 삭제 불가 (관리자 콘솔에서 삭제 필요)
        alert("데이터가 삭제되었습니다.\n(참고: 사용자가 다시 같은 이메일로 가입하려면 Firebase Console > Authentication에서 해당 계정을 직접 삭제해야 합니다.)");
      }
      
      await fetchAllUsers(); // 목록 새로고침
    } catch (e) {
      console.error(e);
      alert("삭제 실패: " + e.message);
    } finally {
      loading.value = false;
    }
  };

  // 6. 비밀번호 초기화
  const resetUserPassword = async (user) => {
    if (!confirm(`'${user.name}' 님의 비밀번호를 초기화하시겠습니까?\n계정이 '가입 대기' 상태로 변경됩니다.`)) return;

    try {
      loading.value = true;
      const defaultPW = user.role === 'student' ? '123456' : '654321';
      
      // 대기 명단에 다시 추가 (덮어쓰기)
      await setDoc(doc(db, 'artifacts', appId, 'pre_users', user.email), {
        ...user,
        initialPassword: defaultPW,
        isNewUser: false,
        mustChangePassword: true,
        registeredAt: new Date().toISOString()
      });

      // 기존 활성 데이터 삭제 (로그인 차단)
      if (user.status === 'active') {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id));
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info')); // 구버전 경로도 정리
      }

      alert(`초기화 완료.\n사용자는 [${user.email} / ${defaultPW}] 로 로그인하면 됩니다.`);
      await fetchAllUsers();
    } catch (e) {
      console.error(e);
      alert("초기화 실패");
    } finally {
      loading.value = false;
    }
  };

  // 7. 일괄 삭제
  const bulkDeleteUsers = async (targetUsers) => {
    if (targetUsers.length === 0) return;
    try {
      loading.value = true;
      const batch = writeBatch(db);
      
      targetUsers.forEach(user => {
        if (user.status === 'pending') {
          batch.delete(doc(db, 'artifacts', appId, 'pre_users', user.id));
        } else {
          // 활성 유저는 두 경로 모두 삭제 큐에 추가
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id));
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
        }
      });

      await batch.commit();
      alert(`${targetUsers.length}명이 삭제되었습니다.`);
      await fetchAllUsers();
    } catch (e) {
      console.error(e);
      alert("일괄 삭제 중 오류가 발생했습니다.");
    } finally {
      loading.value = false;
    }
  };

  // 8. 일괄 보관
  const bulkArchiveUsers = async (targetUsers) => {
    if (targetUsers.length === 0) return;
    try {
      loading.value = true;
      const batch = writeBatch(db);
      
      targetUsers.forEach(user => {
        // 보관소로 이동
        const archiveRef = doc(db, 'artifacts', appId, 'archived_users', user.email);
        batch.set(archiveRef, { ...user, archivedAt: new Date().toISOString() });

        // 기존 삭제
        if (user.status === 'pending') {
          batch.delete(doc(db, 'artifacts', appId, 'pre_users', user.id));
        } else {
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id));
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
        }
      });

      await batch.commit();
      alert(`${targetUsers.length}명이 보관함으로 이동되었습니다.`);
      await fetchAllUsers();
    } catch (e) {
      console.error(e);
      alert("일괄 보관 중 오류가 발생했습니다.");
    } finally {
      loading.value = false;
    }
  };

  return {
    config,
    loading,
    userList,
    fetchConfig,
    saveConfig,
    bulkCreateUsers,
    fetchAllUsers,
    deleteUser,
    resetUserPassword,
    bulkDeleteUsers,
    bulkArchiveUsers
  };
});