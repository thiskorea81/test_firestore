<script setup>
import { onMounted } from 'vue';
import { useExamStore } from '../../stores/examStore'; // 경로 확인 필요
import { Trophy, BookOpen, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  user: Object,     // 현재 로그인한 Auth 유저
  userData: Object  // Firestore의 사용자 정보 (studentId 포함)
});

const store = useExamStore();

onMounted(() => {
  // 학생 정보에 studentId가 있어야만 조회 시도 (예: '10925')
  if (props.userData && props.userData.studentId) {
    store.fetchMyGrades(props.userData.studentId);
  }
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
    
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <Trophy class="w-7 h-7 mr-3 text-yellow-500"/> 내 성적 조회
        </h2>
        <p class="text-sm text-gray-500 mt-1 pl-10">
          {{ userData?.grade }}학년 {{ userData?.class }}반 {{ userData?.name }} ({{ userData?.studentId }})
        </p>
      </div>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p>성적 데이터를 불러오는 중입니다...</p>
    </div>

    <div v-else-if="!store.myExamResults || store.myExamResults.length === 0" class="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <BookOpen class="w-12 h-12 text-gray-300 mx-auto mb-3"/>
      <h3 class="text-lg font-bold text-gray-600">등록된 성적 내역이 없습니다.</h3>
      <p class="text-sm text-gray-400 mt-1">시험 결과가 업로드되면 이곳에서 확인할 수 있습니다.</p>
    </div>

    <div v-else class="space-y-10">
      <div v-for="exam in store.myExamResults" :key="exam.examId" class="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        
        <div class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 class="font-bold text-lg tracking-tight">{{ exam.title }}</h3>
          <span class="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
            {{ exam.subjects ? exam.subjects.length : 0 }}개 과목 응시
          </span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-center whitespace-nowrap">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider border-b">
              <tr>
                <th class="px-4 py-3 text-left w-32">과목명</th>
                <th class="px-4 py-3">원점수</th>
                <th class="px-4 py-3">성취도</th>
                <th class="px-4 py-3">석차등급</th>
                <th class="px-4 py-3 text-gray-400">석차 / 수강자수</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="subject in exam.subjects" :key="subject" class="hover:bg-blue-50/30 transition-colors">
                
                <td class="px-4 py-3.5 text-left font-bold text-gray-800 bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {{ subject }}
                </td>

                <template v-if="exam.scores && exam.scores[subject]">
                  
                  <td class="px-4 py-3.5 text-gray-700 font-medium">
                    {{ exam.scores[subject].raw || '-' }}
                  </td>
                  
                  <td class="px-4 py-3.5 font-bold">
                    <span :class="{
                      'text-blue-600': exam.scores[subject].achievement === 'A',
                      'text-red-500': exam.scores[subject].achievement === 'E',
                      'text-gray-700': !['A', 'E'].includes(exam.scores[subject].achievement)
                    }">
                      {{ exam.scores[subject].achievement || '-' }}
                    </span>
                  </td>
                  
                  <td class="px-4 py-3.5">
                    <span v-if="exam.scores[subject].rank" 
                          :class="['px-2.5 py-0.5 rounded-full text-xs font-bold border', 
                            Number(exam.scores[subject].rank) === 1 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                            Number(exam.scores[subject].rank) <= 3 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200']">
                      {{ exam.scores[subject].rank }}등급
                    </span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                  
                  <td class="px-4 py-3.5 text-gray-500 text-xs">
                    <span v-if="exam.scores[subject].rankStr">
                      <strong class="text-gray-700">{{ exam.scores[subject].rankStr }}</strong> 
                      <span class="text-gray-400"> / {{ exam.scores[subject].totalCount || '?' }}</span>
                    </span>
                    <span v-else>-</span>
                  </td>
                </template>

                <template v-else>
                  <td colspan="4" class="px-4 py-3 text-gray-300 text-xs italic bg-gray-50/50">
                    데이터 없음 / 미응시
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded">
        <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0"/>
        <p>
          위 성적 데이터는 참고용이며, 실제 생활기록부 기재 내용과 차이가 있을 수 있습니다.<br>
          성적에 이상이 있을 경우 담당 교과 선생님 또는 담임 선생님께 문의해주세요.
        </p>
      </div>

    </div>
  </div>
</template>