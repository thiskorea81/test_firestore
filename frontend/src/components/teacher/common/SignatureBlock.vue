<script setup>
import { onMounted } from 'vue';
import { useSystemStore } from '../../../stores/systemStore';

// [추가] doc prop을 받아서 서명 정보를 확인해야 함
const props = defineProps({
  doc: Object 
});

const store = useSystemStore();

onMounted(() => {
  store.fetchConfig();
});
</script>

<template>
  <div class="sanction-wrapper">
    <table class="sanction-table" v-if="store.config.approvalLine.length > 0">
      <tbody>
        <tr>
          <th :rowspan="2" class="sanction-header">결<br>재</th>
          <th v-for="(step, index) in store.config.approvalLine" :key="index" class="role-header">
            {{ step.label }}
          </th>
        </tr>
        <tr>
          <td v-for="(step, index) in store.config.approvalLine" :key="index" class="stamp-box">
            
            <div v-if="index === 0 && doc?.teacherSignature" class="stamp-img-wrapper">
              <img :src="doc.teacherSignature" class="stamp-img" alt="담임서명" />
            </div>

            <span v-else-if="step.isFinal" class="proxy-mark">전결</span>
            
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.sanction-wrapper { display: flex; justify-content: flex-end; margin-bottom: 2rem; }
.sanction-table { border-collapse: collapse; text-align: center; font-size: 12px; border: 1px solid black; background: white; }
.sanction-table th, .sanction-table td { border: 1px solid black; padding: 0; vertical-align: middle; }
.sanction-header { background: #f3f4f6; width: 25px; font-weight: bold; }
.role-header { background: #f3f4f6; width: 70px; height: 30px; font-weight: normal; line-height: 1.2; }
.stamp-box { height: 60px; width: 70px; position: relative; padding: 0; }

/* 도장/서명 이미지 스타일 */
.stamp-img-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.stamp-img { max-width: 60px; max-height: 50px; object-fit: contain; }

.proxy-mark { font-weight: bold; font-size: 16px; font-family: serif; letter-spacing: 2px; color: #000; }

@media print {
  .sanction-header, .role-header { 
    background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}
</style>