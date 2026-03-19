<template>
  <div class="text-slate-900 pb-32">
    <nav class="sticky top-0 z-50 glass-nav">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <button @click="goBack" class="text-slate-400 hover:text-slate-600 transition">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-lg font-bold tracking-tight">진료 예약</span>
        <div class="w-6"></div>
      </div>
    </nav>

    <main class="max-w-2xl mx-auto px-6 py-8">
      <div class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm mb-8 flex items-center gap-4">
        <div class="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl">
          <i class="fa-solid fa-hospital"></i>
        </div>
        <div>
          <h2 class="text-lg font-bold">세브란스 병원</h2>
          <p class="text-sm text-slate-500">내과 · 김메디 전문의</p>
        </div>
      </div>

      <section class="mb-10">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-regular fa-calendar text-indigo-500"></i> 날짜 선택
        </h3>

        <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button
            v-for="date in dates"
            :key="date.day"
            type="button"
            @click="selectedDate = date.day"
            :class="[
              'date-card min-w-[70px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition',
              selectedDate === date.day
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                : 'border-slate-100 bg-white text-slate-600'
            ]"
          >
            <span
              class="text-[10px] font-bold"
              :class="selectedDate === date.day ? 'text-indigo-600' : 'text-slate-400'"
            >
              {{ date.label }}
            </span>
            <span class="text-xl font-bold">{{ date.day }}</span>
          </button>
        </div>
      </section>

      <section class="mb-10">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-regular fa-clock text-indigo-500"></i> 시간 선택
        </h3>

        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="time in times"
            :key="time.label"
            type="button"
            :disabled="time.disabled"
            @click="selectedTime = time.label"
            :class="[
              'time-slot py-3 rounded-xl border text-sm font-bold transition',
              time.disabled
                ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                : selectedTime === time.label
                  ? 'selected'
                  : 'bg-white text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
            ]"
          >
            {{ time.label }}
          </button>
        </div>



        <!-- 즉시 대기 등록 -->
        <div class="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <i class="fa-solid fa-bolt text-white"></i>
              </div>
              <div>
                <p class="font-bold text-slate-800">즉시 대기 등록</p>
                <p class="text-xs text-slate-500">가장 빠른 시간에 진료받기</p>
              </div>
            </div>
            <button
              @click="goToReservationHome"
              class="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition"
            >
              등록하기
            </button>
          </div>
          </div>


      </section>

      <section class="mb-10">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-user-doctor text-indigo-500"></i> 의료진 선택
        </h3>

        <div class="space-y-3">
          <label
            v-for="doctor in doctors"
            :key="doctor.id"
            class="flex items-center gap-4 p-4 rounded-2xl cursor-pointer relative transition"
            :class="selectedDoctor === doctor.id
              ? 'border-2 border-indigo-600 bg-indigo-50'
              : 'border border-slate-200 bg-white hover:border-indigo-300'"
          >
            <input
              type="radio"
              class="hidden"
              :value="doctor.id"
              v-model="selectedDoctor"
            />

            <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
              <img v-if="doctor.img" :src="doctor.img" class="w-full h-full object-cover" />
              <div v-else class="text-slate-400 text-xs font-bold text-center">
                빠른<br />진료
              </div>
            </div>

            <div>
              <p class="font-bold" :class="selectedDoctor === doctor.id ? 'text-indigo-900' : 'text-slate-700'">
                {{ doctor.name }}
              </p>
              <p class="text-xs" :class="selectedDoctor === doctor.id ? 'text-indigo-500' : 'text-slate-400'">
                {{ doctor.desc }}
              </p>
            </div>

            <i
              class="absolute right-4 text-xl"
              :class="selectedDoctor === doctor.id
                ? 'fa-solid fa-circle-check text-indigo-600'
                : 'fa-regular fa-circle text-slate-300'"
            ></i>
          </label>
        </div>
      </section>

      <section>
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-address-card text-indigo-500"></i> 예약자 정보
        </h3>

        <div class="space-y-3">
          <inputField label="이름" v-model="user.name" />
          <inputField label="전화번호" v-model="user.phone" />
          <inputField label="증상 메모 (선택)" v-model="user.memo" placeholder="어디가 불편하신가요?" />
        </div>
      </section>
    </main>

    <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50">
      <div class="max-w-2xl mx-auto">
        <RouterLink
            to="/"
            class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2"
            >
            예약 확정하기 <i class="fa-solid fa-check"></i>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 메인 페이지로 이동한 후 reservation 이 보이도록
import { useRouter } from 'vue-router'

const router = useRouter()

const goToReservationHome = () => {
  router.push({
    path: '/',
    query: { mode: 'reservation' }
  })
}
const selectedDate = ref(14)
const selectedTime = ref(null)
const selectedDoctor = ref(1)


const dates = [
  { label: '오늘', day: 14 },
  { label: '화', day: 15 },
  { label: '수', day: 16 },
  { label: '목', day: 17 },
  { label: '금', day: 18 },
]

const times = [
  { label: '09:00', disabled: true },
  { label: '09:30', disabled: true },
  { label: '10:00' },
  { label: '10:30' },
  { label: '11:00' },
  { label: '11:30' },
  { label: '12:00', disabled: true },
  { label: '14:00' },
  { label: '14:30' },
]

const doctors = [
  {
    id: 1,
    name: '김메디 전문의',
    desc: '호흡기 내과 전문',
    img: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 2,
    name: '진료 가능한 원장님',
    desc: '대기 시간이 가장 짧습니다'
  }
]

const user = ref({
  name: '홍길동',
  phone: '010-1234-5678',
  memo: ''
})

function goBack() {
  history.back()
}

function confirmBooking() {
  if (confirm('이 내용으로 예약을 확정하시겠습니까?')) {
    alert('예약이 완료되었습니다!')
  }
}
</script>

<style scoped>
.glass-nav {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.time-slot.selected {
  background-color: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>