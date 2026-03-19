<script setup>
import { reactive, ref, computed, onMounted, defineProps, watch } from 'vue'

const props = defineProps(['initialData'])
const wsUri = "wss://www.mediq.kro.kr/ws/chat";

let websocket = null

const connected = ref(false)
const processStep = ref('input') 
const currentNickname = ref('')
const searchKeyword = ref('')
const isSearching = ref(false)

const hospital = reactive({
  id: 'hospital1',
  name: '병원을 검색해주세요',
  queue: []
})

const AVG_MIN_PER_PERSON = 7 

function connectWebSocket() {
  websocket = new WebSocket(wsUri)

  websocket.onopen = () => {
    connected.value = true
    console.log("웹소켓 연결 성공")
  }
  
  websocket.onclose = () => {
    connected.value = false
    console.log("웹소켓 연결 종료")
  }

  websocket.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data)
      const data = payload.payload ? JSON.parse(payload.payload) : payload
      handleQueueUpdate(data)
    } catch (err) {
      console.error("메시지 파싱 에러:", err)
    }
  }
}

function handleQueueUpdate({ action, nickname, queue }) {
  if (action === 'join') addToQueue(nickname)
  if (action === 'cancel') removeFromQueue(nickname)
  if (action === 'sync' && queue) {
    hospital.queue = queue
    updatePositions()
  }
}

function addToQueue(nickname) {
  if (hospital.queue.some(q => q.nickname === nickname)) return

  hospital.queue.push({
    nickname,
    timestamp: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    position: hospital.queue.length + 1
  })
}

function removeFromQueue(nickname) {
  const idx = hospital.queue.findIndex(q => q.nickname === nickname)
  if (idx === -1) return
  hospital.queue.splice(idx, 1)
  updatePositions()
}

function updatePositions() {
  hospital.queue.forEach((q, i) => (q.position = i + 1))
}

const myQueue = computed(() =>
  hospital.queue.find(q => q.nickname === currentNickname.value)
)

const estimatedWaitTime = computed(() => {
  const count = myQueue.value ? (myQueue.value.position - 1) : hospital.queue.length
  return count * AVG_MIN_PER_PERSON
})

// 문진표 데이터 연동 함수
function initFromProps() {
  if (props.initialData && props.initialData.hospital) {
    const data = props.initialData.hospital
    
    hospital.name = data.name
    hospital.id = data.id || 'hospital1'
    searchKeyword.value = data.name
    
    // 문진표에서 넘어왔을 땐 바로 input 단계 유지하되, 병원 정보가 채워져 있음
    console.log("문진표 연동 완료:", hospital.name)
  }
}

function searchHospital() {
  if (!searchKeyword.value) {
    alert('병원 이름을 입력해주세요')
    return
  }
  isSearching.value = true
  setTimeout(() => {
    hospital.name = searchKeyword.value
    isSearching.value = false
  }, 500)
}

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
}

function joinQueue() {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    alert('서버와 연결되지 않았습니다.')
    return
  }

  websocket.send(JSON.stringify({
    action: 'join',
    hospital: hospital.id,
    nickname: currentNickname.value
  }))
  
  addToQueue(currentNickname.value)
  processStep.value = 'registered'
}

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

function setNickname() {
  if (currentNickname.value.trim().length < 2) {
    alert('이름은 두 글자 이상 입력하세요')
    return
  }
  nicknameConfirmed.value = true
}


onMounted(() => {
  initFromProps()
  connectWebSocket()
})

// 데이터가 늦게 들어올 경우 대비
watch(() => props.initialData, () => {
  initFromProps()
}, { deep: true })
</script>

<template>
    <main class="main-layout md:pl-96 ">
      <section class="left-panel">
        
        <div class="hospital-card">
          <div class="hospital-search-box">
             <label class="search-label">방문할 병원</label>
             <div class="search-input-group">
               <input 
                 v-model="searchKeyword" 
                 @keyup.enter="searchHospital"
                 placeholder="병원 이름 검색..." 
                 :disabled="processStep === 'registered'"
               />
               <button @click="searchHospital" :disabled="processStep === 'registered'" class="btn-search">
                 <i v-if="isSearching" class="fa-solid fa-spinner fa-spin"></i>
                 <i v-else class="fa-solid fa-magnifying-glass"></i>
               </button>
             </div>
          </div>
          
          <div class="hospital-display mt-4">
             <div class="h-icon"><i class="fa-solid fa-hospital"></i></div>
             <div class="h-info">
               <span class="badge" v-if="hospital.name !== '병원을 검색해주세요'">진료중</span>
               <h2>{{ hospital.name }}</h2>
             </div>
          </div>

          <div class="queue-stat-row mt-4">
            <div class="stat-item">
              <span class="label">현재 대기</span>
              <span class="value">{{ hospital.queue.length }}명</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">예상 대기</span>
              <span class="value">{{ hospital.queue.length * AVG_MIN_PER_PERSON }}분</span>
            </div>
          </div>
        </div>

        <div class="user-action-area">
          
          <div v-if="processStep === 'input'" class="input-box animate-fade-in">
            <h3>접수자 정보</h3>
            <p class="desc">진료를 받으실 환자분의 성함을 입력해주세요.</p>
            <div class="input-wrapper">
              <input
                v-model="currentNickname"
                placeholder="이름 (예: 홍길동)"
                @keyup.enter="checkInfo"
              />
              <button @click="checkInfo" class="btn-next">
                확인
              </button>
            </div>
          </div>

          <div v-else-if="processStep === 'review'" class="review-card animate-slide-up">
            <div class="review-header">
              <h3>접수 정보 확인</h3>
              <button @click="backToInput" class="text-xs text-slate-400 underline">수정</button>
            </div>
            
            <div class="info-grid">
              <div class="info-row">
                <span class="label">병원</span>
                <span class="val">{{ hospital.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">환자명</span>
                <span class="val">{{ currentNickname }}</span>
              </div>
              <div class="info-row">
                <span class="label">접수일시</span>
                <span class="val">{{ new Date().toLocaleDateString() }} {{ new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
              </div>
              <div class="info-row highlight">
                <span class="label">예상대기</span>
                <span class="val text-amber-500">{{ estimatedWaitTime }}분</span>
              </div>
            </div>

            <button @click="joinQueue" class="btn-primary-lg">
              대기 접수하기
            </button>
          </div>

          <div v-else-if="processStep === 'registered'" class="my-ticket-wrapper animate-slide-up">
            <div class="ticket-card">
              <div class="ticket-hole left"></div>
              <div class="ticket-hole right"></div>
              
              <div class="ticket-header">
                <span class="ticket-title">나의 예약 내역</span>
                <span class="ticket-date">{{ new Date().toLocaleDateString() }}</span>
              </div>
              
              <div class="ticket-body">
                <div class="ticket-number">{{ myQueue?.position || '-' }}</div>
                <div class="ticket-status">
                  <span class="wait-label">번째 순서</span>
                  <span class="wait-time">약 {{ estimatedWaitTime }}분 대기</span>
                </div>
              </div>

              <div class="ticket-footer">
                <span class="user">{{ currentNickname }}님</span>
                <span class="status-badge">접수완료</span>
              </div>
            </div>

            <button class="btn-secondary" @click="cancelQueue">
              접수 취소하기
            </button>
          </div>
        </div>
      </section>

      <section class="right-panel">
        <div class="panel-header">
          <h3>실시간 대기열 <span class="count">{{ hospital.queue.length }}</span></h3>
        </div>
        
        <div class="queue-grid-container">
          <ul v-if="hospital.queue.length > 0" class="queue-grid">
            <li
              v-for="q in hospital.queue"
              :key="q.nickname"
              class="queue-item"
              :class="{ 'is-me': q.nickname === currentNickname }"
            >
              <div class="rank">{{ q.position }}</div>
              <div class="info">
                <span class="name">{{ q.nickname }}</span>
                <span class="time">{{ q.timestamp }} 접수</span>
              </div>
              <div v-if="q.nickname === currentNickname" class="me-tag">나</div>
            </li>
          </ul>
          
          <div v-else class="empty-state">
             <i class="fa-solid fa-mug-hot"></i>
             <p>현재 대기중인 환자가 없습니다.</p>
          </div>
        </div>
      </section>

    </main>
  
</template>

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