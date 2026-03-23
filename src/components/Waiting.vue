<script setup>
<<<<<<< HEAD
import { reactive, ref, computed, onMounted, defineProps } from 'vue'
import axios from 'axios'
import useAuthStore from '@/stores/useAuthStore';

const authStore = useAuthStore()

const currentNickname = computed(() => {
  return authStore.isLogin ? authStore.getUsername() : '사용자'
})
=======
import { reactive, ref, computed, onMounted, defineProps, watch } from 'vue'
import api from '@/plugins/axiosinterceptor' 
import useAuthStore from '@/stores/useAuthStore'
>>>>>>> origin/feat/queueSearch

const props = defineProps(['initialData'])
const wsUri = "http://localhost:8080/ws/chat";

const authStore = useAuthStore()

let websocket = null
const connected = ref(false)
const processStep = ref('review') 
const searchKeyword = ref('')
const isSearching = ref(false)
const myWaitingDetail = ref(null); 
const isNotificationEnabled = ref(false); // 알림 설정 상태 표시용

const hospital = reactive({
  id: 'hospital1',
  name: '병원을 검색해주세요',
  queue: [] 
})

const AVG_MIN_PER_PERSON = 7 

// --- 웹소켓 로직 ---
function connectWebSocket() {
  websocket = new WebSocket(wsUri)
  websocket.onopen = () => { connected.value = true; }
  websocket.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data)
      const data = payload.payload ? JSON.parse(payload.payload) : payload
      if (data.action === 'sync' && data.queue) {
        hospital.queue = Array.isArray(data.queue) ? data.queue : [];
        hospital.queue.forEach((q, i) => (q.position = i + 1));
      }
    } catch (err) { console.error("메시지 파싱 에러:", err) }
  }
}

const myQueue = computed(() => {
  if (!Array.isArray(hospital.queue)) return null;
  return hospital.queue.find(q => q.nickname === currentNickname.value)
})

const estimatedWaitTime = computed(() => {
  const count = myQueue.value ? (myQueue.value.position - 1) : hospital.queue.length
  return count * AVG_MIN_PER_PERSON
})


const subscribePush = async () => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      alert("알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
      return
    }

    await navigator.serviceWorker.register('/service-worker.js')
    const VAPID_PUBLIC_KEY = 'BEyaCMDqIkd76kJ-WmsXJd2eI2JQEt-Ilx3kzRF-4Sgzu0_2zZkVY3Iesc3DoL5FDZ2MkEGsMhYAA85Q92HvOcw'

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      })

      console.log("새 구독 생성:", JSON.stringify(subscription))
      
      await axios.post(`http://localhost:8080/push/sub`, subscription, { withCredentials: true })
      
      isNotificationEnabled.value = true;
      alert("진료 순서 알림 등록이 완료되었습니다.");
    } else {
      isNotificationEnabled.value = true;
      alert("이미 알림이 등록되어 있습니다.");
    }
  } catch (error) {
    console.error("푸시 구독 에러:", error);
    alert("알림 등록 중 오류가 발생했습니다.");
  }
}

<<<<<<< HEAD
async function searchHospital() {
  if (!searchKeyword.value) {
    alert("병원 이름을 입력해주세요");
    return
  }
  try {
    isSearching.value = true;
    const listRes = await axios.get(`http://localhost:8080/waiting/queue/list/${searchKeyword.value}`, { withCredentials: true });
    const checkRes = await axios.get(`http://localhost:8080/waiting/queue/${searchKeyword.value}`, { withCredentials: true });

    hospital.name = searchKeyword.value;
    hospital.queue = Array.isArray(listRes.data.result) ? listRes.data.result : [];

    const myStatus = checkRes.data.result || checkRes.data;
    
    if (myStatus && myStatus.idx !== -1) {
      myWaitingDetail.value = myStatus; 
      processStep.value = 'registered'; 
    } else {
      myWaitingDetail.value = null;
      processStep.value = 'review'; 
    }
=======
const registeredHospitals = ref([]); // 서버에서 받아온 제휴 병원 목록

onMounted(async () => {
  authStore.checkLogin();
  connectWebSocket();
  
  try {
    const res = await api.get('/api/hospitals/list');
    registeredHospitals.value = res.data;

    console.log("🔥서버에서 받아온 병원 목록:", registeredHospitals.value);
  
  } catch (error) {
    console.error('제휴 병원 목록 로딩 실패:', error);
  }
});


// 검색 시 서버 목록에 있는지 확인
async function searchHospital() {
  if (!searchKeyword.value) return;
  const normalizedInput = searchKeyword.value.replace(/\s/g, '');
  const targetHospital = registeredHospitals.value.find(h => 
    h.name.replace(/\s/g, '').includes(normalizedInput)
  );

  if (!targetHospital) {
    alert("MediQ 서비스 제휴 병원이 아닙니다. 이름을 다시 확인해주세요.");
    return;
  }

  try {
    isSearching.value = true;
    // 실제 서버 DB의 idx를 사용하여 대기열 조회 (병원 이름 대신 고유 ID 사용 권장)
    const listRes = await api.get(`/waiting/queue/list/${targetHospital.idx}`);

    hospital.name = targetHospital.name;
    hospital.id = targetHospital.idx; // hospital 객체에 ID 저장
    hospital.queue = Array.isArray(listRes.data.result) ? listRes.data.result : [];

>>>>>>> origin/feat/queueSearch
  } catch (error) {
    console.error('검색 실패:', error);
  } finally { isSearching.value = false; }
}

<<<<<<< HEAD
async function confirmRegistration() {
  if (!hospital.name || hospital.name === '병원을 검색해주세요') return;
  try {
    const response = await axios.post('http://localhost:8080/waiting/register', 
      { hospitalIdx: searchKeyword.value }, 
      { withCredentials: true }
    );
    const result = response.data.result || response.data;
    if (result && result.idx !== -1) {
      alert("대기 접수가 완료되었습니다.");
      myWaitingDetail.value = result; 
      processStep.value = 'registered';
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ action: 'join', hospital: hospital.id, nickname: currentNickname.value }))
      }
    }
    window.location.reload();
  } catch (error) { alert('접수 중 오류가 발생했습니다.'); }
=======

function checkInfo() {
  if (!hospital.name || hospital.name === '병원을 검색해주세요') {
    alert('먼저 병원을 검색하여 선택해주세요.')
    return
  }
  if (currentNickname.value.trim().length < 2) {
    alert('이름은 두 글자 이상 입력하세요')
    return
  }
  processStep.value = 'review'
>>>>>>> origin/feat/queueSearch
}

async function cancelQueue() {
  if (!confirm('대기를 취소하시겠습니까?')) return;
  try {
    await axios.delete(`http://localhost:8080/waiting/register`, { 
      data: { hospitalIdx: searchKeyword.value },
      withCredentials: true 
    });
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ action: 'cancel', hospital: hospital.id, nickname: currentNickname.value }))
    }
    processStep.value = 'review';
    myWaitingDetail.value = null;
    isNotificationEnabled.value = false;
  } catch (error) { alert("취소 중 오류 발생"); }
}

<<<<<<< HEAD
onMounted(() => { 
  authStore.checkLogin(); 
  connectWebSocket();
=======
function cancelQueue() {
  if (!confirm('대기를 취소하시겠습니까?')) return
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({
      action: 'cancel',
      hospital: hospital.id,
      nickname: currentNickname.value
    }))
  }

  removeFromQueue(currentNickname.value)
  processStep.value = 'input'
  currentNickname.value = ''
}

// 뒤로가기
function backToInput() {
  processStep.value = 'input'
}

watch(() => props.initialData, () => {
  initFromProps()
}, { deep: true })


onMounted(() => {
  initFromProps()
  connectWebSocket()
>>>>>>> origin/feat/queueSearch
})
</script>

<template>
  <main class="main-layout flex flex-col md:flex-row min-h-screen bg-slate-50">
    <section class="flex-1 p-6 md:p-12 border-r border-slate-200">
      <div class="max-w-md mx-auto">
        
<<<<<<< HEAD
        <div class="hospital-card bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div class="hospital-search-box mb-6">
            <label class="block text-sm font-bold text-slate-700 mb-2">방문할 병원</label>
            <div class="relative flex items-center">
              <input 
                v-model="searchKeyword" 
                @keyup.enter="searchHospital"
                class="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="병원을 검색하세요" 
                :disabled="processStep === 'registered'"
              />
              <button @click="searchHospital" class="absolute right-2 p-2 text-slate-500 hover:text-blue-600">
=======
        <div class="hospital-card">
          <div class="hospital-search-box">
             <label class="search-label">방문할 병원</label>
             <div class="relative flex items-center">
              <input 
                v-model="searchKeyword" 
                @keyup.enter="searchHospital"
                list="hospital-options"
                :disabled="processStep === 'registered'"
                class="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="제휴 병원 이름을 입력하세요" 
              />
              
              <datalist id="hospital-options">
                <option v-for="h in registeredHospitals" :key="h.idx" :value="h.name"></option>
              </datalist>

              <button 
                @click="searchHospital" 
                :disabled="processStep === 'registered'"
                class="absolute right-2 p-2 text-slate-500 hover:text-blue-600"
              >
>>>>>>> origin/feat/queueSearch
                <i v-if="isSearching" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
            <div class="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center text-xl">
              <i class="fa-solid fa-hospital"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Hospital Info</span>
              <h2 class="text-xl font-black text-slate-800">{{ hospital.name }}</h2>
            </div>
          </div>
        </div>

        <div class="user-action-area">
          <div v-if="processStep === 'review'" class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-slide-up">
            <h3 class="text-lg font-bold text-slate-800 mb-6">접수 정보 확인</h3>
            <div class="space-y-4 mb-8">
              <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span class="text-slate-500 text-sm">환자 성함</span>
                <span class="font-bold text-slate-900 text-lg">{{ currentNickname }}님</span>
              </div>
              
              <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span class="text-slate-500 text-sm">진료 순서 알림</span>
                <button @click="subscribePush" 
                  :class="[
                    'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                    isNotificationEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                  ]">
                  <i :class="isNotificationEnabled ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash'" class="mr-1"></i>
                  {{ isNotificationEnabled ? '등록됨' : '알림 등록' }}
                </button>
              </div>

              <div class="flex justify-between items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <span class="text-blue-600 text-sm font-semibold">예상 대기</span>
                <span class="font-bold text-blue-700">약 {{ estimatedWaitTime }}분</span>
              </div>
            </div>
            <button @click="confirmRegistration" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">
              지금 바로 대기 접수
            </button>
          </div>
          
          <div v-else-if="processStep === 'registered'" class="text-center p-8 bg-green-50 rounded-3xl border border-green-100">
            <div class="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
              <i class="fa-solid fa-check"></i>
            </div>
            <h3 class="font-bold text-green-800 text-lg">접수가 완료되었습니다!</h3>
            <p class="text-sm text-green-600 mt-2">{{ currentNickname }}님, 우측 티켓을 확인해 주세요.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="flex-1 p-6 md:p-12 bg-slate-50 flex flex-col items-center justify-center">
      <div v-if="processStep === 'registered'" class="w-full max-w-sm animate-slide-up">
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div class="bg-blue-600 p-6 text-white text-center">
            <h4 class="text-lg font-black">{{ hospital.name }}</h4>
          </div>
          <div class="p-10 text-center border-b-2 border-dashed border-slate-200">
            <span class="text-sm text-slate-400 font-bold uppercase">내 접수 번호</span>
            <div class="text-8xl font-black text-slate-900 mt-2 tracking-tighter">{{ myWaitingDetail?.idx || '-' }}</div>
            <div class="mt-6 text-5xl font-extrabold text-blue-600">
              {{ myWaitingDetail?.waitingNumber }}<span class="text-xl ml-1">번째</span>
            </div>
          </div>
          <div class="p-6 bg-slate-50 flex justify-between items-center">
            <div>
              <p class="text-xs text-slate-400">성함</p>
              <p class="font-bold text-slate-800">{{ currentNickname }}님</p>
            </div>
            <div class="text-right flex flex-col items-end gap-1">
              <span class="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-bold">정상접수</span>
              <span v-if="isNotificationEnabled" class="text-[10px] text-blue-500 font-bold animate-pulse">
                <i class="fa-solid fa-bell mr-0.5"></i>알림 활성화
              </span>
            </div>
          </div>
        </div>
        <button @click="cancelQueue" class="w-full mt-8 py-4 text-slate-400 font-bold hover:text-red-500 transition-colors">
          <i class="fa-solid fa-xmark mr-1"></i> 대기 취소하기
        </button>
      </div>
      <div v-else class="text-center opacity-20">
        <i class="fa-solid fa-ticket text-9xl text-slate-300 mb-6"></i>
        <p class="text-xl font-bold text-slate-400">병원을 검색해 주세요.</p>
      </div>
    </section>
  </main>
</template>


<style scoped>
.animate-slide-up { animation: slideUp 0.5s ease-out; }
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.app-container {
  font-family: 'Pretendard', sans-serif;
  background-color: #F1F5F9; 
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  color: #1E293B;
  overflow: hidden;
}

.app-header {
  background: white;
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 24px;
  z-index: 10;
  width: 100%;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #0F172A;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  white-space: nowrap;
}

.status-indicator {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F8FAFC;
  padding: 6px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-indicator.connected {
  color: #10B981;
  background: #ECFDF5;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column; 
  padding: 16px;
  gap: 16px;
  width: 100%; 
  height: calc(100vh - 60px); 
  overflow-y: auto; 
}

@media (min-width: 1024px) {
  .main-layout {
    flex-direction: row; 
    overflow: hidden; 
    padding: 24px;
    gap: 24px;
    max-width: none; 
  }

  .left-panel {
    width: 380px; 
    min-width: 380px;
    flex-shrink: 0;
    overflow-y: auto;
    padding-right: 4px;
  }

  .right-panel {
    flex: 1;
    overflow: hidden; 
  }
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hospital-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.hospital-search-box {
  margin-bottom: 16px;
}

.search-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  margin-bottom: 6px;
}

.search-input-group {
  display: flex;
  gap: 8px;
}

.search-input-group input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input-group input:focus {
  border-color: #0F172A;
}
.search-input-group input:disabled {
  background: #F1F5F9;
  color: #94A3B8;
}

.btn-search {
  width: 40px;
  background: #0F172A;
  color: white;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}
.btn-search:disabled {
  background: #94A3B8;
  cursor: not-allowed;
}

.hospital-display {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.h-icon {
  width: 48px;
  height: 48px;
  background: #EFF6FF;
  color: #3B82F6;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.h-info .badge {
  display: inline-block;
  font-size: 11px;
  color: #10B981;
  background: #ECFDF5;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  margin-bottom: 4px;
}

.h-info h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
  line-height: 1.3;
}

.queue-stat-row {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #CBD5E1;
}

.stat-item .label {
  font-size: 12px;
  color: #64748B;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 800;
  color: #0F172A;
}

.input-box {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #E2E8F0;
}

.input-box h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.input-box .desc {
  font-size: 13px;
  color: #94A3B8;
  margin-bottom: 16px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.input-wrapper input {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  min-width: 0; 
}

.input-wrapper input:focus {
  border-color: #0F172A;
}

.btn-next {
  width: 60px;
  background: #0F172A;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.review-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}

.review-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-row .label {
  color: #64748B;
  font-weight: 500;
}

.info-row .val {
  color: #0F172A;
  font-weight: 700;
  text-align: right;
}

.info-row.highlight .label {
  color: #0F172A;
  font-weight: 700;
}

.btn-primary-lg {
  width: 100%;
  padding: 16px;
  background: #0F172A;
  color: white;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: transform 0.1s;
}
.btn-primary-lg:active {
  transform: scale(0.98);
}

.ticket-card {
  background: #0F172A;
  color: white;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  margin-bottom: 16px;
  box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
}

.ticket-hole {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: #F1F5F9;
  border-radius: 50%;
  transform: translateY(-50%);
  z-index: 2;
}
.ticket-hole.left { left: -10px; }
.ticket-hole.right { right: -10px; }

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.ticket-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.ticket-body {
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px dashed rgba(255,255,255,0.2);
  margin-bottom: 16px;
}

.ticket-number {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}

.ticket-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wait-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.wait-time {
  font-size: 14px;
  font-weight: 700;
  color: #FBBF24;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-footer .user {
  font-weight: 700;
  font-size: 15px;
}

.status-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.btn-secondary {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: white;
  color: #EF4444;
  border: 1px solid #EF4444;
}

.right-panel {
  background: white;
  border-radius: 20px;
  height: 458px;
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.panel-header .count {
  background: #0F172A;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.queue-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #FAFAFA;
}

.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.queue-item {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.queue-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.05);
}

.queue-item.is-me {
  border: 2px solid #0F172A;
  background: #F8FAFC;
}

.queue-item .rank {
  font-size: 32px;
  font-weight: 800;
  color: #CBD5E1;
  line-height: 1;
  margin-bottom: 8px;
}

.queue-item.is-me .rank {
  color: #0F172A;
}

.queue-item .info .name {
  display: block;
  font-weight: 700;
  font-size: 15px;
  color: #1E293B;
  margin-bottom: 4px;
}

.queue-item .info .time {
  font-size: 12px;
  color: #94A3B8;
}

.me-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #0F172A;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  gap: 12px;
  min-height: 200px;
}

.empty-state i {
  font-size: 32px;
  opacity: 0.5;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>