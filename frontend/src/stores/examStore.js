import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  collection, addDoc, writeBatch, doc, getDocs, query, orderBy, getDoc 
} from 'firebase/firestore';
import { db, getAppId } from '../firebase';

export const useExamStore = defineStore('exam', () => {
  const appId = getAppId();
  const loading = ref(false);
  const myExamResults = ref([]); // 내 성적 목록

  // 1. 성적 파일 파싱 및 업로드 (교사용)
  const uploadExamResults = async (title, csvText, grade, classNum) => {
    loading.value = true;
    try {
      const lines = csvText.split('\n');
      const students = [];
      let subjects = [];
      
      let currentStudent = null;
      let headerFound = false;

      for (let i = 0; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim());
        
        // A. 헤더 찾기 ("번호"로 시작하는 줄)
        if (!headerFound) {
          if (row[0] === '번호') {
            subjects = row.slice(3).filter(s => s && s !== ''); 
            headerFound = true;
          }
          continue;
        }

        // B. 학생 데이터 파싱
        if (row[0] && !isNaN(row[0])) {
          if (currentStudent) students.push(currentStudent); // 이전 학생 저장
          
          currentStudent = {
            number: row[0].padStart(2, '0'),
            name: row[1],
            studentId: `${grade}${classNum.padStart(2,'0')}${row[0].padStart(2,'0')}`,
            scores: {} 
          };

          subjects.forEach((subj, idx) => {
             if (!currentStudent.scores[subj]) currentStudent.scores[subj] = {};
             currentStudent.scores[subj].raw = row[idx + 3];
          });
        } 
        // 추가 정보 (성취도, 등급 등)
        else if (currentStudent && row[2]) {
           const type = row[2];
           subjects.forEach((subj, idx) => {
             let key = 'etc';
             if (type === '성취도') key = 'achievement';
             else if (type === '석차등급') key = 'rank';
             else if (type === '석차') key = 'rankStr';
             else if (type === '수강자수') key = 'totalCount';
             
             if (currentStudent.scores[subj]) {
               currentStudent.scores[subj][key] = row[idx + 3];
             }
           });
        }
      }
      if (currentStudent) students.push(currentStudent);

      // Firestore 저장
      const examRef = await addDoc(collection(db, 'artifacts', appId, 'exams'), {
        title: title,
        grade: grade,
        class: classNum,
        createdAt: new Date().toISOString(),
        subjectList: subjects
      });

      const batch = writeBatch(db);
      students.forEach(std => {
        const stdRef = doc(db, 'artifacts', appId, 'exams', examRef.id, 'results', std.studentId);
        batch.set(stdRef, std);
      });
      await batch.commit();
      
      alert(`${students.length}명의 성적 처리가 완료되었습니다.`);

    } catch (e) {
      console.error(e);
      alert('성적 업로드 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      loading.value = false;
    }
  };

  // 2. 내 성적 목록 불러오기 (학생용)
  const fetchMyGrades = async (studentId) => {
    loading.value = true;
    myExamResults.value = [];
    try {
      const examsSnap = await getDocs(query(collection(db, 'artifacts', appId, 'exams'), orderBy('createdAt', 'desc')));
      
      const results = [];
      for (const examDoc of examsSnap.docs) {
        const examData = examDoc.data();
        const myResultRef = doc(db, 'artifacts', appId, 'exams', examDoc.id, 'results', studentId);
        const myResultSnap = await getDoc(myResultRef);
        
        if (myResultSnap.exists()) {
          results.push({
            examId: examDoc.id,
            title: examData.title,
            subjects: examData.subjectList,
            ...myResultSnap.data()
          });
        }
      }
      myExamResults.value = results;
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    myExamResults,
    uploadExamResults,
    fetchMyGrades
  };
});