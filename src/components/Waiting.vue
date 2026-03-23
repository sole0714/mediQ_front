<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import api from '@/plugins/axiosinterceptor'
import useAuthStore from '@/stores/useAuthStore'

const authStore = useAuthStore()

// --- 상태 관리 ---
const reservedInfo = ref({ isReserved: false, waitingNumber: null, hospitalName: '', hospitalIdx: null }); 
const loading = ref(true); 
const registeredHospitals = ref([]); 
const myWaitingDetail = ref(null); 
const searchKeyword = ref('')
const isSearching = ref(false)
const processStep = ref('review') 
const isNotificationEnabled = ref(false) 

const hospital = reactive({
  id: null,
  name: '',
  queue: [] 
})

const currentNickname = computed(() => {
  return authStore.isLogin ? authStore.getUsername() : '사용자'
})

// --- 웹소켓 (백그라운드 유지) ---
const wsUri = "wss://.mediq.kro.kr/ws/chat";
let websocket = null

function connectWebSocket() {
  websocket = new WebSocket(wsUri)
  websocket.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data)
      const data = payload.payload ? JSON.parse(payload.payload) : payload
      if (data.action === 'sync' && data.queue) {
        hospital.queue = Array.isArray(data.queue) ? data.queue : [];
      }
    } catch (err) { console.error("WS 에러:", err) }
  }
}

// --- 알림 구독 기능 ---
async function toggleNotifications() {
  if (isNotificationEnabled.value) {
    alert("이미 알림이 설정되어 있습니다.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    isNotificationEnabled.value = true;
    alert('방문 알림이 설정되었습니다.');
  }
}

async function fetchHospitalQueue(idx, name) {
  try {
    isSearching.value = true;
    const listRes = await api.get(`/waiting/queue/list/${idx}`);
    hospital.name = name;
    hospital.id = idx;
    hospital.queue = Array.isArray(listRes.data.result) ? listRes.data.result : [];
  } catch (error) {
    console.error("대기열 로드 실패:", error);
  } finally {
    isSearching.value = false;
  }
}

onMounted(async () => {
  await authStore.checkLogin();
  connectWebSocket();

  if ('Notification' in window && Notification.permission === 'granted') {
    isNotificationEnabled.value = true;
  }
  
  try {
    const listRes = await api.get('/api/hospitals/list');
    registeredHospitals.value = listRes.data;

    if (authStore.isLogin) {
      const response = await api.get('/waiting/queue/waiting/mine');
      if (response.data && response.data.hospitalIdx) {
        reservedInfo.value = response.data;
        processStep.value = 'registered';
        await fetchHospitalQueue(response.data.hospitalIdx, response.data.hospitalName);
      }
    }
  } catch (error) {
    console.error('초기 로딩 실패:', error);
  } finally {
    loading.value = false;
  }
});

async function searchHospital() {
  if (!searchKeyword.value) {
    alert("병원 이름을 입력해주세요");
    return;
  }

  const normalizedInput = searchKeyword.value.replace(/\s/g, '');
  const targetHospital = registeredHospitals.value.find(h => 
    h.name.replace(/\s/g, '').includes(normalizedInput)
  );

  if (!targetHospital) {
    alert("MediQ 제휴 병원이 아닙니다.");
    return;
  }

  try {
    isSearching.value = true;
    const [listRes, checkRes] = await Promise.all([
      api.get(`/waiting/queue/list/${targetHospital.idx}`),
      api.get(`/waiting/queue/${targetHospital.idx}`)
    ]);

    hospital.name = targetHospital.name;
    hospital.id = targetHospital.idx;
    hospital.queue = Array.isArray(listRes.data.result) ? listRes.data.result : [];

    const myStatus = checkRes.data.result || checkRes.data;
    if (myStatus && myStatus.idx !== -1) {
      myWaitingDetail.value = myStatus; 
      processStep.value = 'registered'; 
    } else {
      myWaitingDetail.value = null;
      processStep.value = 'review'; 
    }
  } catch (error) {
    console.error("검색 오류:", error);
  } finally {
    isSearching.value = false;
  }
}

// 내 대기 상태를 서버에서 다시 가져와 화면을 갱신하는 공통 함수
async function fetchMyWaitingStatus() {
  try {
    loading.value = true; // 로딩 스피너 표시 (새로고침 느낌)
    const response = await api.get('/waiting/queue/waiting/mine');
    
    if (response.data && response.data.hospitalIdx) {
      // 1. 예약 정보 업데이트
      reservedInfo.value = response.data;
      // 2. 단계 변경 (티켓 화면으로)
      processStep.value = 'registered';
      // 3. 해당 병원의 전체 대기열 목록도 새로고침
      await fetchHospitalQueue(response.data.hospitalIdx, response.data.hospitalName);
    } else {
      processStep.value = 'review';
    }
  } catch (error) {
    console.error("상태 갱신 실패:", error);
  } finally {
    loading.value = false; // 로딩 종료
  }
}

async function confirmRegistration() {
  if (!hospital.id) return;
  try {
    const res = await api.post('/waiting/register', { hospitalIdx: hospital.id });
    
    if (res.data.result?.idx !== -1) {
      alert("온라인 대기 신청이 완료되었습니다.");
      
      // 페이지 이동 대신, 현재 페이지의 상태를 다시 로드합니다.
      await fetchMyWaitingStatus(); 
    }
  } catch (e) { 
    alert("접수 중 오류가 발생했습니다."); 
  }
}

// 취소 시에도 동일하게 적용 가능합니다.
// async function cancelQueue() {
//   if (!confirm('대기를 취소하시겠습니까?')) return;
//   const targetIdx = reservedInfo.value.hospitalIdx || hospital.id;
//   try {
//     await api.delete(`/waiting/register`, { data: { hospitalIdx: targetIdx } });
    
//     // 상태 초기화 후 다시 로드
//     hospital.id = null;
//     hospital.name = '';
//     hospital.queue = [];
//     await fetchMyWaitingStatus();
    
//     alert("취소가 완료되었습니다.");
//   } catch (error) { 
//     alert("취소 중 오류가 발생했습니다."); 
//   }
// }

// async function confirmRegistration() {
//   if (!hospital.id) return;
//   try {
//     const res = await api.post('/waiting/register', { hospitalIdx: hospital.id });
    
//     // 서버 응답이 성공(idx가 -1이 아님)일 경우
//     if (res.data.result?.idx !== -1) {
//       alert("온라인 대기 신청이 완료되었습니다.");
      
//       // 브라우저를 새로고침합니다.
//       // 새로고침 후 onMounted 로직이 실행되면서 
//       // 서버에서 내 예약 정보를 다시 가져와 'registered' 화면을 보여주게 됩니다.
//       window.location.reload(); 
//     } else {
//       alert("이미 대기 중이거나 접수가 불가능한 상태입니다.");
//     }
//   } catch (e) { 
//     alert("접수 중 오류가 발생했습니다."); 
//     console.error(e);
//   }
// }

async function cancelQueue() {
  if (!confirm('대기를 취소하시겠습니까?')) return;
  const targetIdx = reservedInfo.value.hospitalIdx || hospital.id;
  try {
    await api.delete(`/waiting/register`, { data: { hospitalIdx: targetIdx } });
    
    // 1. 예약 관련 상태 초기화
    reservedInfo.value = { isReserved: false, waitingNumber: null, hospitalName: '', hospitalIdx: null };
    myWaitingDetail.value = null;
    
    // 2. 단계 변경 (검색 화면으로 즉시 전환)
    processStep.value = 'review';
    
    // 3. 선택했던 병원 정보도 초기화하고 싶다면:
    hospital.id = null;
    hospital.name = '';
    hospital.queue = [];
    
    alert("취소가 완료되었습니다.");
  } catch (error) { 
    alert("취소 중 오류가 발생했습니다."); 
  }
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo-icon"><i class="fa-solid fa-stethoscopes"></i></div>
          <h1 class="app-title">MediQ Waiting</h1>
        </div>
      </div>
    </header>

    <main v-if="!loading" class="main-layout animate-fade-in">
      <div class="center-content">
        <div v-if="processStep === 'registered'" class="mb-6">
          <button @click="toggleNotifications" :class="isNotificationEnabled ? 'enabled' : 'disabled'" class="btn-noti">
            <i :class="isNotificationEnabled ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash'"></i>
            {{ isNotificationEnabled ? '방문 알림 활성화됨' : '방문 알림 받기 설정' }}
          </button>
        </div>

        <div v-if="processStep === 'review'" class="glass-card animate-slide-up mb-6">
          <div class="hospital-search-box">
            <label class="search-label">제휴 병원 검색</label>
            <div class="search-input-group">
              <input v-model="searchKeyword" @keyup.enter="searchHospital" list="hospital-options" placeholder="병원명을 입력하세요" />
              <datalist id="hospital-options">
                <option v-for="h in registeredHospitals" :key="h.idx" :value="h.name"></option>
              </datalist>
              <button @click="searchHospital" class="btn-search" :disabled="isSearching">
                <i v-if="isSearching" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else class="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
          </div>

          <div v-if="hospital.id" class="hospital-display flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div class="h-icon text-2xl text-blue-600"><i class="fa-solid fa-hospital"></i></div>
            <div class="h-info">
              <span class="text-xs font-bold text-blue-500 uppercase">MediQ Partner</span>
              <h2 class="text-xl font-bold text-slate-800">{{ hospital.name }}</h2>
            </div>
          </div>
        </div>

        <div class="content-area">
          <div v-if="processStep === 'registered'" class="ticket-card animate-slide-up">
            <div class="ticket-header">
              <span class="ticket-title">진료 대기 순번표</span>
              <span>{{ new Date().toLocaleDateString() }}</span>
            </div>
            <div class="ticket-body">
              <p class="wait-label">나의 대기 번호</p>
              <h2 class="ticket-number">{{ reservedInfo.waitingNumber || myWaitingDetail?.waitingNumber }}</h2>
              <div class="ticket-status">
                <span class="wait-time">현재 병원 대기: {{ hospital.queue.length }}팀</span>
              </div>
            </div>
            <div class="ticket-footer">
              <span class="user font-bold">{{ currentNickname }} 님</span>
              <span class="status-badge">&nbsp;&nbsp;접수완료</span>
            </div>
            <button @click="cancelQueue" class="btn-secondary">대기 취소하기</button>
          </div>

          <div v-else-if="hospital.id" class="glass-card animate-slide-up">
            <h3 class="text-lg font-bold mb-4">접수 정보 확인</h3>
            <div class="info-grid">
              <div class="info-row"><span class="label">방문 병원</span><span class="val">{{ hospital.name }}</span></div>
              <div class="info-row"><span class="label">신청인</span><span class="val">{{ currentNickname }}</span></div>
              <div class="info-row highlight"><span class="label">현재 대기 팀</span><span class="val">{{ hospital.queue.length }}팀</span></div>
            </div>
            <button @click="confirmRegistration" class="btn-primary-lg">실시간 대기 신청하기</button>
          </div>
        </div>
      </div>
    </main>

    <div v-else class="loading-screen">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap');

.app-container {
  font-family: 'Pretendard', sans-serif;
  background: radial-gradient(circle at top right, #f8fafc, #eff6ff);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #1e293b;
}

.app-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  height: 70px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: center; /* 로고 중앙 정렬 */
  z-index: 50;
}

.brand { display: flex; align-items: center; gap: 12px; }
.logo-icon {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.app-title { font-size: 22px; font-weight: 800; color: #0f172a; }

.main-layout {
  flex: 1;
  display: flex;
  justify-content: center; /* 가로 중앙 */
  align-items: flex-start; /* 세로 상단 */
  padding: 40px 20px;
  overflow-y: auto;
}

.center-content {
  width: 100%;
  max-width: 480px; /* 카드 최대 너비 제한 */
}

.glass-card {
  background: white;
  border-radius: 28px;
  padding: 32px;
  border: 1px solid rgba(241, 245, 249, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);
}

.search-input-group {
  display: flex;
  background: #f8fafc;
  padding: 6px;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: 0.3s;
}
.search-input-group:focus-within {
  border-color: #3b82f6;
  background: white;
}
.search-input-group input {
  flex: 1; padding: 12px; border: none; background: transparent; outline: none; font-weight: 500;
}

.btn-search {
  width: 48px; height: 48px;
  background: #0f172a; color: white;
  border: none; border-radius: 12px; cursor: pointer;
}

.ticket-card {
  background: linear-gradient(165deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-radius: 32px;
  padding: 40px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.4);
}

.ticket-header {
  display: flex; justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 20px; font-size: 14px; color: #94a3b8;
}

.ticket-body { text-align: center; padding: 40px 0; }
.ticket-number {
  font-size: 84px; font-weight: 800;
  background: linear-gradient(to bottom, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 10px 0;
}

.ticket-status {
  display: inline-block; padding: 8px 20px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 50px; color: #60a5fa; font-weight: 600;
}

.btn-primary-lg {
  width: 100%; padding: 20px;
  background: #3b82f6; color: white;
  border-radius: 18px; font-weight: 700; border: none; cursor: pointer; transition: 0.3s;
}

.btn-secondary {
  width: 100%; margin-top: 24px; padding: 16px;
  background: transparent; color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 14px; cursor: pointer; transition: 0.2s;
}
.btn-secondary:hover { background: rgba(248, 113, 113, 0.1); }

.btn-noti {
  width: 100%; padding: 16px; border-radius: 20px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  cursor: pointer; border: none; transition: 0.3s;
}
.btn-noti.disabled { background: #0f172a; color: white; }
.btn-noti.enabled { background: white; color: #10b981; border: 2px solid #10b981; }

.info-grid { background: #f8fafc; border-radius: 20px; padding: 24px; margin: 24px 0; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
.info-row:last-child { border: none; }
.info-row.highlight .val { color: #3b82f6; font-size: 20px; font-weight: 800; }

.loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: white; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.animate-slide-up { animation: slideUp 0.6s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>