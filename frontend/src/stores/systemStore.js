import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, getDocs, updateDoc,
         query, where, orderBy, addDoc
} from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useSystemStore = defineStore('system', () => {
  const appId = getAppId();
  
  // --- State ---
  const config = ref({
    domain: 'school.kr',
    limits: { menstrual: 1, domesticTrip: 5, overseasTrip: 30 },
    approvalLine: [
      { role: '학년부계', label: '학년부계', isFinal: false },
      { role: '학생부계', label: '학생부계', isFinal: false },
      { role: '부장', label: '부장', isFinal: true },
      { role: '교감', label: '교감', isFinal: true },
      { role: '교장', label: '교장', isFinal: true }
    ]
  });
  
  const loading = ref(false);
  const userList = ref([]); 
  const consultations = ref([]);
  
  // [신규] 현재 로그인한 사용자 정보 (App 전역 관리)
  const currentUserData = ref(null);

  // --- Actions ---

  // [신규] 현재 사용자 정보 불러오기
  const fetchCurrentUser = async (uid) => {
    if (!uid) {
      currentUserData.value = null;
      return;
    }
    try {
      // 1. users/{uid} 경로 조회
      const docRef = doc(db, 'artifacts', appId, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        currentUserData.value = snap.data();
      } else {
        // (예외) 관리자 계정 등 DB에 없는 경우
        currentUserData.value = { role: 'unknown' }; 
      }
    } catch (e) {
      console.error("User Load Error:", e);
      currentUserData.value = null;
    }
  };

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'config', 'system');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        config.value = { ...config.value, ...snap.data() };
      } else {
        await setDoc(docRef, config.value);
      }
    } catch (e) { console.error("Config Error:", e); }
  };

  const saveConfig = async (newConfig) => {
    try {
      loading.value = true;
      await setDoc(doc(db, 'artifacts', appId, 'config', 'system'), newConfig);
      config.value = newConfig;
      alert("설정이 저장되었습니다.");
    } catch (e) { alert("저장 실패"); }
    finally { loading.value = false; }
  };

  const bulkCreateUsers = async (users) => {
    try {
      loading.value = true;
      const batch = writeBatch(db);
      users.forEach((user) => {
        const preUserRef = doc(db, 'artifacts', appId, 'pre_users', user.email);
        const baseData = {
          email: user.email, name: user.name, role: user.role,
          initialPassword: user.password, isNewUser: true, mustChangePassword: true,
          registeredAt: new Date().toISOString()
        };
        if (user.role === 'student') {
          const sId = user.studentId || '';
          Object.assign(baseData, {
            studentId: sId, grade: sId.substring(0, 1), class: sId.substring(1, 3), number: sId.substring(3, 5),
            gender: user.gender || 'male',
          });
        }
        batch.set(preUserRef, baseData);
      });
      await batch.commit();
      alert(`${users.length}명이 등록되었습니다.`);
    } catch (e) { console.error(e); alert("오류 발생"); }
    finally { loading.value = false; }
  };

  const fetchAllUsers = async () => {
    loading.value = true;
    try {
      userList.value = [];
      const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'users'));
      const activeUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data(), status: 'active' }));
      const preSnap = await getDocs(collection(db, 'artifacts', appId, 'pre_users'));
      const pendingUsers = preSnap.docs.map(d => ({ id: d.id, ...d.data(), status: 'pending' }));
      userList.value = [...activeUsers, ...pendingUsers];
    } catch (e) { console.error(e); } 
    finally { loading.value = false; }
  };

  const deleteUser = async (user) => {
    if (!confirm(`'${user.name}' 삭제?`)) return;
    try {
      loading.value = true;
      if (user.status === 'pending') {
        await deleteDoc(doc(db, 'artifacts', appId, 'pre_users', user.id));
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id));
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
      }
      alert("삭제되었습니다.");
      await fetchAllUsers();
    } catch (e) { alert("삭제 실패"); } 
    finally { loading.value = false; }
  };

  const resetUserPassword = async (user) => {
    if (!confirm(`비밀번호 초기화?`)) return;
    try {
      loading.value = true;
      const defaultPW = user.role === 'student' ? '123456' : '654321';
      await setDoc(doc(db, 'artifacts', appId, 'pre_users', user.email), {
        ...user, initialPassword: defaultPW, isNewUser: false, mustChangePassword: true, registeredAt: new Date().toISOString()
      });
      if (user.status === 'active') await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id));
      alert(`초기화 완료 (PW: ${defaultPW})`);
      await fetchAllUsers();
    } catch (e) { alert("실패"); } 
    finally { loading.value = false; }
  };

  const bulkDeleteUsers = async (targetUsers) => {
    if (targetUsers.length === 0) return;
    try {
      loading.value = true;
      const batch = writeBatch(db);
      targetUsers.forEach(user => {
        if (user.status === 'pending') batch.delete(doc(db, 'artifacts', appId, 'pre_users', user.id));
        else {
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id));
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
        }
      });
      await batch.commit();
      alert(`${targetUsers.length}명 삭제됨`);
      await fetchAllUsers();
    } catch (e) { alert("오류"); } 
    finally { loading.value = false; }
  };

  const bulkArchiveUsers = async (targetUsers) => {
    if (targetUsers.length === 0) return;
    try {
      loading.value = true;
      const batch = writeBatch(db);
      targetUsers.forEach(user => {
        const archiveRef = doc(db, 'artifacts', appId, 'archived_users', user.email);
        batch.set(archiveRef, { ...user, archivedAt: new Date().toISOString() });
        if (user.status === 'pending') batch.delete(doc(db, 'artifacts', appId, 'pre_users', user.id));
        else {
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id));
          batch.delete(doc(db, 'artifacts', appId, 'users', user.id, 'profile', 'info'));
        }
      });
      await batch.commit();
      alert(`${targetUsers.length}명 보관됨`);
      await fetchAllUsers();
    } catch (e) { alert("오류"); } 
    finally { loading.value = false; }
  };

  const fetchClassStudents = async (grade, cls) => {
    // [보완] 필수 정보 누락 시 중단
    if (!grade || !cls) {
      userList.value = [];
      return;
    }
    loading.value = true;
    userList.value = [];
    try {
      const qActive = query(collection(db, 'artifacts', appId, 'users'), where('grade', '==', String(grade)), where('class', '==', String(cls)), where('role', '==', 'student'));
      const activeSnap = await getDocs(qActive);
      const activeUsers = activeSnap.docs.map(d => ({ id: d.id, ...d.data(), status: 'active' }));
      const qPending = query(collection(db, 'artifacts', appId, 'pre_users'), where('grade', '==', String(grade)), where('class', '==', String(cls)), where('role', '==', 'student'));
      const pendingSnap = await getDocs(qPending);
      const pendingUsers = pendingSnap.docs.map(d => ({ id: d.id, ...d.data(), status: 'pending' }));
      userList.value = [...activeUsers, ...pendingUsers].sort((a,b) => Number(a.number) - Number(b.number));
    } catch (e) { console.error(e); } 
    finally { loading.value = false; }
  };

  const updateUser = async (user) => {
    try {
      loading.value = true;
      const col = user.status === 'active' ? 'users' : 'pre_users';
      await updateDoc(doc(db, 'artifacts', appId, col, user.id), user);
      alert("수정되었습니다.");
    } catch (e) { alert("수정 실패"); } 
    finally { loading.value = false; }
  };

  const fetchConsultations = async (studentId) => {
    try {
      const q = query(collection(db, 'artifacts', appId, 'consultations'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      consultations.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error(e); }
  };

  const addConsultation = async (log) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'consultations'), { ...log, createdAt: new Date().toISOString() });
      await fetchConsultations(log.studentId);
    } catch (e) { alert("기록 실패"); }
  };

  return {
    config, loading, userList, consultations, currentUserData, // [추가됨]
    fetchConfig, saveConfig, bulkCreateUsers, fetchAllUsers, 
    fetchCurrentUser, // [추가됨]
    deleteUser, resetUserPassword, bulkDeleteUsers, bulkArchiveUsers,
    fetchClassStudents, updateUser, fetchConsultations, addConsultation
  };
});