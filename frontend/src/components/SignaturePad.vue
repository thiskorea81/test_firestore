<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Eraser } from 'lucide-vue-next';

const canvasRef = ref(null);
const isDrawing = ref(false);
const ctx = ref(null);

// 서명 데이터를 부모에게 전달하기 위한 expose
const getSignatureData = () => {
  return canvasRef.value.toDataURL('image/png');
};

const isEmpty = () => {
  const blank = document.createElement('canvas');
  blank.width = canvasRef.value.width;
  blank.height = canvasRef.value.height;
  return canvasRef.value.toDataURL() === blank.toDataURL();
};

const clear = () => {
  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
};

// 그리기 로직
const startDrawing = (e) => {
  isDrawing.value = true;
  draw(e);
};

const stopDrawing = () => {
  isDrawing.value = false;
  ctx.value.beginPath();
};

const draw = (e) => {
  if (!isDrawing.value) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  
  let clientX, clientY;
  
  if (e.type.includes('touch')) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  ctx.value.lineWidth = 2;
  ctx.value.lineCap = 'round';
  ctx.value.strokeStyle = '#000';

  ctx.value.lineTo(x, y);
  ctx.value.stroke();
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
};

onMounted(() => {
  const canvas = canvasRef.value;
  ctx.value = canvas.getContext('2d');
  
  // 캔버스 크기 조정 (반응형 대응)
  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = 160; // 높이 고정
  };
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
});

onUnmounted(() => window.removeEventListener('resize', () => {}));

defineExpose({ getSignatureData, isEmpty, clear });
</script>

<template>
  <div class="signature-wrapper">
    <canvas 
      ref="canvasRef"
      @mousedown="startDrawing" 
      @mousemove="draw" 
      @mouseup="stopDrawing" 
      @mouseleave="stopDrawing"
      @touchstart.prevent="startDrawing" 
      @touchmove.prevent="draw" 
      @touchend.prevent="stopDrawing"
      class="signature-canvas"
    ></canvas>
    <button type="button" @click="clear" class="clear-btn">
      <Eraser class="w-4 h-4 mr-1"/> 지우기
    </button>
  </div>
</template>

<style scoped>
.signature-wrapper {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: #fff;
  overflow: hidden;
}
.signature-canvas {
  display: block;
  width: 100%;
  height: 160px;
  cursor: crosshair;
  touch-action: none; /* 모바일 스크롤 방지 */
}
.clear-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #4b5563;
}
.clear-btn:hover { background: #e5e7eb; }
</style>