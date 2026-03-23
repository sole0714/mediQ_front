<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import api from '@/plugins/axiosinterceptor'
import useAuthStore from '@/stores/useAuthStore'
import axios from 'axios'

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

// --- 알림 구독 기능 (subscribePush 최우선) ---
const subscribePush = async () => {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    alert("알림 권한이 거부되었습니다.");
    return
  }

  const VAPID_PUBLIC_KEY = 'BEyaCMDqIkd76kJ-WmsXJd2eI2JQEt-Ilx3kzRF-4Sgzu0_2zZkVY3Iesc3DoL5FDZ2MkEGsMhYAA85Q92HvOcw'

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js')
    const readyReg = await navigator.serviceWorker.ready;
    let subscription = await readyReg.pushManager.getSubscription()

    if (!subscription) {
      subscription = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      })
    }

    console.log("전송할 구독 정보:", subscription);

    // 핵심 수정사항: 
    // 1. axios -> api (인증 토큰 자동 포함을 위해 인터셉터 적용된 인스턴스 사용)
    // 2. 백엔드 DTO 구조에 맞춰 subscription 객체를 그대로 전달
    const response = await api.post(`/push/sub`, subscription);

    if (response.status === 200) {
      isNotificationEnabled.value = true
      alert('방문 알림이 설정되었습니다.')
    }
  } catch (error) {
    console.error("푸시 구독 에러:", error)
    if (error.response?.status === 401) {
      alert("로그인이 필요한 서비스입니다.");
    } else {
      alert("서버 연결에 실패했습니다.");
    }
  }
}
// --- 공통: 내 상태 다시 불러오기 ---
async function refreshMyStatus() {
  try {
    loading.value = true;
    const response = await api.get('/waiting/queue/waiting/mine');
    
    if (response.data && response.data.hospitalIdx) {
      reservedInfo.value = response.data;
      processStep.value = 'registered';
      await fetchHospitalQueue(response.data.hospitalIdx, response.data.hospitalName);
    } else {
      reservedInfo.value = { isReserved: false, waitingNumber: null, hospitalName: '', hospitalIdx: null };
      processStep.value = 'review';
    }
  } catch (error) {
    console.error('상태 갱신 실패:', error);
  } finally {
    loading.value = false;
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

// --- 초기 실행 ---
onMounted(async () => {
  await authStore.checkLogin();
  
  if ('Notification' in window && Notification.permission === 'granted') {
    isNotificationEnabled.value = true;
  }
  
  try {
    const listRes = await api.get('/api/hospitals/list');
    registeredHospitals.value = listRes.data;

    if (authStore.isLogin) {
      await refreshMyStatus();
    } else {
      loading.value = false;
    }
  } catch (error) {
    console.error('초기 로딩 실패:', error);
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
  } catch (error) { console.error("검색 오류:", error); } finally { isSearching.value = false; }
}

async function confirmRegistration() {
  if (!hospital.id) return;
  try {
    const res = await api.post('/waiting/register', { hospitalIdx: hospital.id });
    if (res.data.result?.idx !== -1) {
      alert("온라인 대기 신청이 완료되었습니다.");
      await refreshMyStatus();
    }
  } catch (e) { alert("접수 중 오류가 발생했습니다."); }
}

async function cancelQueue() {
  if (!confirm('대기를 취소하시겠습니까?')) return;
  const targetIdx = reservedInfo.value.hospitalIdx || hospital.id;
  try {
    await api.delete(`/waiting/register`, { data: { hospitalIdx: targetIdx } });
    alert("취소가 완료되었습니다.");
    hospital.id = null;
    hospital.name = '';
    hospital.queue = [];
    await refreshMyStatus();
  } catch (error) { alert("취소 중 오류가 발생했습니다."); }
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
          <button @click="subscribePush" class="btn-blue-push">
            방문 알림 받기
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
          <div v-if="hospital.id" class="hospital-display flex items-center gap-4 p-4 mt-6 bg-blue-50 rounded-2xl border border-blue-100">
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
              <span class="status-badge">접수완료</span>
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
.btn-blue-push {
  width: 100%;
  padding: 16px;
  background-color: #2563eb; /* 신뢰감을 주는 파란색 */
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-blue-push:hover {
  background-color: #1d4ed8;
}

.btn-blue-push:active {
  transform: scale(0.98);
}
.app-container { font-family: 'Pretendard', sans-serif; background: radial-gradient(circle at top right, #f8fafc, #eff6ff); height: 100vh; display: flex; flex-direction: column; overflow: hidden; color: #1e293b; }
.app-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); height: 70px; border-bottom: 1px solid rgba(226, 232, 240, 0.8); padding: 0 32px; display: flex; align-items: center; justify-content: center; z-index: 50; }
.brand { display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.app-title { font-size: 22px; font-weight: 800; color: #0f172a; }
.main-layout { flex: 1; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto; }
.center-content { width: 100%; max-width: 480px; }
.glass-card { background: white; border-radius: 28px; padding: 32px; border: 1px solid rgba(241, 245, 249, 1); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04); }
.search-input-group { display: flex; background: #f8fafc; padding: 6px; border-radius: 16px; border: 2px solid transparent; transition: 0.3s; }
.search-input-group:focus-within { border-color: #3b82f6; background: white; }
.search-input-group input { flex: 1; padding: 12px; border: none; background: transparent; outline: none; font-weight: 500; }
.btn-search { width: 48px; height: 48px; background: #0f172a; color: white; border: none; border-radius: 12px; cursor: pointer; }
.ticket-card { background: linear-gradient(165deg, #0f172a 0%, #1e293b 100%); color: white; border-radius: 32px; padding: 40px; position: relative; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.4); }
.ticket-header { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; font-size: 14px; color: #94a3b8; }
.ticket-body { text-align: center; padding: 40px 0; }
.ticket-number { font-size: 84px; font-weight: 800; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 10px 0; }
.ticket-status { display: inline-block; padding: 8px 20px; background: rgba(59, 130, 246, 0.15); border-radius: 50px; color: #60a5fa; font-weight: 600; }
.btn-primary-lg { width: 100%; padding: 20px; background: #3b82f6; color: white; border-radius: 18px; font-weight: 700; border: none; cursor: pointer; transition: 0.3s; }
.btn-secondary { width: 100%; margin-top: 24px; padding: 16px; background: transparent; color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 14px; cursor: pointer; transition: 0.2s; }
.btn-noti { width: 100%; padding: 16px; border-radius: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; border: none; transition: 0.3s; }
.btn-noti.disabled { background: #0f172a; color: white; }
.btn-noti.enabled { background: white; color: #10b981; border: 2px solid #10b981; }
.info-grid { background: #f8fafc; border-radius: 20px; padding: 24px; margin: 24px 0; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
.info-row.highlight .val { color: #3b82f6; font-size: 20px; font-weight: 800; }
.loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: white; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.animate-slide-up { animation: slideUp 0.6s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>