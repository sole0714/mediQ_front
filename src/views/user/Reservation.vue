<template>
  <div class="text-slate-900 pb-32 min-h-screen bg-slate-50">
    <nav class="sticky top-0 z-50 glass-nav">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <button @click="goBack" class="text-slate-400 hover:text-slate-600 transition">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-lg font-bold tracking-tight">예약 확정 및 결제</span>
        <div class="w-6"></div>
      </div>
    </nav>

    <main class="max-w-2xl mx-auto px-6 py-8">
      <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm mb-8 flex items-center gap-4">
        <div class="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl">
          <i class="fa-solid fa-hospital"></i>
        </div>
        <div>
          <h2 class="text-lg font-bold">{{ hospitalInfo.name }}</h2>
          <p class="text-sm text-slate-500">진료 예약 확정</p>
        </div>
      </div>

      <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm mb-8">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-regular fa-calendar-check text-indigo-500"></i> 방문 일정 선택
        </h3>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-2">날짜</label>
                <input type="date" v-model="selectedDate" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-500 mb-2">시간</label>
                <input type="time" v-model="selectedTime" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700" />
            </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm mb-8">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-credit-card text-indigo-500"></i> 결제 정보
        </h3>
        <div class="flex justify-between items-center py-3 border-b border-slate-50">
          <span class="text-slate-500">예약금</span>
          <span class="font-bold text-indigo-600">{{ hospitalInfo.deposit }}원</span>
        </div>
        <p class="text-xs text-slate-400 mt-4 leading-relaxed">
          * 노쇼 방지를 위해 예약금 결제가 필요합니다.<br>
          * 진료 완료 시 예약금은 자동으로 환불 처리되거나 진료비에서 차감됩니다.
        </p>
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50">
      <div class="max-w-2xl mx-auto">
        <button
            @click="handlePayment"
            class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2 cursor-pointer"
        >
            예약금 결제하기 ({{ hospitalInfo.deposit }}원) <i class="fa-solid fa-check"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as PortOne from "@portone/browser-sdk/v2"
import api from '@/plugins/axiosinterceptor'

const router = useRouter()

// 1. MainMap에서 저장했던 실제 병원 정보 불러오기
const savedInfo = JSON.parse(localStorage.getItem('selectedHospital')) || { 
  idx: 1, name: "알 수 없는 병원", deposit: 1 
};
const hospitalInfo = ref(savedInfo);

// 💡 날짜와 시간을 저장할 변수
const selectedDate = ref('');
const selectedTime = ref('');

function goBack() {
  history.back()
}

// 2. 포트원 결제 흐름 (주문서 생성 -> 결제 -> 검증)
const handlePayment = async () => {
  // 💡 날짜와 시간을 선택하지 않으면 결제를 막음
  if (!selectedDate.value || !selectedTime.value) {
      alert("방문하실 날짜와 시간을 먼저 선택해주세요!");
      return;
  }

  try {
    // 1단계: 백엔드에 주문서(1원짜리) 생성 요청 (+ 날짜, 시간 데이터도 함께 전송)
    const createRes = await api.post("/orders/create", {
      hospitalIdx: hospitalInfo.value.idx,
      reservationDate: selectedDate.value,
      reservationTime: selectedTime.value
    });
    
    const ordersIdx = createRes.data.result.ordersIdx;
    const paymentId = `payment-${crypto.randomUUID()}`;

    // 2단계: 포트원 결제창 띄우기
    const paymentResponse = await PortOne.requestPayment({
      storeId: "store-6a6cd778-6da3-441b-802b-7c280be780d3", // 사용자님의 가맹점 식별코드
      channelKey: "channel-key-523a0e21-c106-41b7-a3ad-7d1132fcea03", // 채널 키
      paymentId: paymentId,
      orderName: `${hospitalInfo.value.name} 예약금`,
      totalAmount: hospitalInfo.value.deposit, // 백엔드에서 가져온 1원
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
      customData: {
        ordersIdx: ordersIdx // ⭐️ 백엔드 검증을 위해 무조건 필요!
      }
    });

    // 결제창 닫거나 실패했을 때
    if (paymentResponse.code !== undefined) {
      alert("결제가 취소되었거나 실패했습니다: " + paymentResponse.message);
      return;
    }

    // 3단계: 결제 성공 시 백엔드에 검증 요청
    await api.post("/orders/verify", {
      paymentId: paymentResponse.paymentId
    });

    alert("예약금 결제가 완료되어 예약이 확정되었습니다!");
    
    // 결제 완료 후 마이페이지의 결제 내역 탭으로 이동!
    router.push('/mypage');

  } catch (error) {
    console.error("결제 에러:", error);
    alert("결제 처리 중 문제가 발생했습니다. 로그인 상태를 확인해주세요.");
  }
}
</script>

<style scoped>
.glass-nav {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
</style>