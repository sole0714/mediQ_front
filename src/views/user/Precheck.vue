<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/plugins/axiosinterceptor' // 💡 Axios 가져오기

const router = useRouter()
const currentStep = ref(1)
const totalStep = 3

// 💡 [수정됨] 단계별 유효성 검사 로직이 추가된 nextStep 함수
const nextStep = () => {
  // 1단계 검사
  if (currentStep.value === 1) {
    if (symptoms.value.length === 0) {
      alert('현재 가장 불편한 증상을 최소 1개 이상 선택해 주세요.')
      return
    }
    if (takingMedicine.value === null) {
      alert('현재 복용 중인 약이 있는지 예/아니오를 선택해 주세요.')
      return
    }
  }

  // 2단계 검사
  if (currentStep.value === 2) {
    if (allergy.value === null) {
      alert('약물이나 음식에 대한 알레르기가 있는지 예/아니오를 선택해 주세요.')
      return
    }
    if (travel.value === null) {
      alert('최근 2주 이내 해외 방문 이력이 있는지 예/아니오를 선택해 주세요.')
      return
    }
  }

  // 검사 통과 시 다음 페이지로 이동
  if (currentStep.value < totalStep) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    history.back()
  }
}

// --- 1단계 데이터 ---
const symptoms = ref([])
const otherSymptom = ref('')
const showOtherInput = ref(false)
const symptomStartDate = ref('') // 날짜 바인딩

const toggleSymptom = (value) => {
  if (symptoms.value.includes(value)) {
    symptoms.value = symptoms.value.filter(v => v !== value)
    if (value === '기타') {
      otherSymptom.value = ''
      showOtherInput.value = false
    }
  } else {
    symptoms.value.push(value)
    if (value === '기타') {
      showOtherInput.value = true
    }
  }
}

const takingMedicine = ref(null)
const medicineDetail = ref('') // 약 상세내용 바인딩

// --- 2단계 데이터 ---
const diseases = ref([])

const toggleDisease = (value) => {
  if (diseases.value.includes(value)) {
    diseases.value = diseases.value.filter(v => v !== value)
  } else {
    diseases.value.push(value)
  }
}

const allergy = ref(null)
const allergyDetail = ref('') // 알러지 상세내용 바인딩
const travel = ref(null)

const showToast = ref(false)
const saveTemporarily = () => {
  showToast.value = true
  setTimeout(() => (showToast.value = false), 2000)
}

const headerTitle = computed(
  () => `모바일 문진표 (${currentStep.value}/${totalStep})`
)

// 💡 [핵심] 백엔드로 데이터 전송하는 함수
const submitSurveyForm = async () => {
  const payload = {
    symptoms: symptoms.value,
    otherSymptom: otherSymptom.value,
    symptomStartDate: symptomStartDate.value || null, // 빈 문자열이면 null로 처리
    takingMedicine: takingMedicine.value,
    medicineDetail: medicineDetail.value,
    diseases: diseases.value,
    allergy: allergy.value,
    allergyDetail: allergyDetail.value,
    travel: travel.value
  }

  try {
    const response = await api.post('/survey', payload)
    
    if (response.data.success) {
      alert('문진표가 성공적으로 전송되었습니다.')
      router.push('/reservation') // 완료 후 페이지 이동
    } else {
      alert('전송 실패: ' + response.data.message)
    }
  } catch (error) {
    console.error('문진표 전송 실패:', error)
    alert('문진표 전송에 실패했습니다. 빠진 항목이 없는지 확인해주세요.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <button @click="prevStep" class="text-slate-400 hover:text-slate-600">
        <i class="fa-solid fa-chevron-left text-lg"></i>
      </button>
      <h1 class="text-lg font-bold">{{ headerTitle }}</h1>
      <div class="w-6"></div>
    </nav>

    <main class="max-w-2xl mx-auto px-6 py-8 pb-40">
      <div class="flex items-center justify-center gap-3 mb-10">
        <div v-for="i in totalStep" :key="i" class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" :class="i <= currentStep ? 'step-active' : 'step-inactive'">
          {{ i }}
        </div>
      </div>

      <section v-show="currentStep === 1" class="space-y-10">
        <div>
          <h2 class="text-xl font-bold mb-2">현재 가장 불편한 증상은 무엇인가요?</h2>
          <p class="text-sm text-slate-500 mb-6">중복 선택이 가능합니다.</p>
          <div class="grid grid-cols-2 gap-3">
            <button v-for="symptom in ['발열 / 오한', '기침 / 가래', '두통 / 어지럼증']" :key="symptom" type="button" @click="toggleSymptom(symptom)" class="p-4 border-2 rounded-2xl font-bold text-sm text-left transition" :class="symptoms.includes(symptom) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'">
              {{ symptom }}
            </button>
            <button type="button" @click="toggleSymptom('기타')" class="p-4 border-2 rounded-2xl font-bold text-sm text-left transition flex items-center justify-between" :class="symptoms.includes('기타') ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'">
              기타 <i class="fa-solid fa-pen-to-square text-slate-300"></i>
            </button>
          </div>
          <div v-if="showOtherInput" class="mt-3">
            <input v-model="otherSymptom" type="text" placeholder="직접 증상을 입력해주세요 (예: 피부 발진)" class="w-full p-4 bg-slate-50 border border-indigo-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold mb-2">증상은 언제부터 시작되었나요?</h2>
          <div class="mt-4">
            <input v-model="symptomStartDate" type="date" class="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-medium">
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold mb-2">현재 복용 중인 약이 있으신가요?</h2>
          <div class="flex gap-3 mt-4">
            <button type="button" @click="takingMedicine = false" class="flex-1 py-4 rounded-2xl font-bold transition" :class="takingMedicine === false ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">아니오</button>
            <button type="button" @click="takingMedicine = true" class="flex-1 py-4 rounded-2xl font-bold transition" :class="takingMedicine === true ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">예</button>
          </div>
          <textarea v-model="medicineDetail" placeholder="복용 중인 약을 적어주세요 (생략 가능)" class="w-full mt-3 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-sm h-24 resize-none"></textarea>
        </div>
      </section>

      <section v-show="currentStep === 2" class="space-y-10">
        <div>
          <h2 class="text-xl font-bold mb-2">과거에 앓았거나 현재 앓고 있는 질환이 있나요?</h2>
          <p class="text-sm text-slate-500 mb-6">해당되는 항목을 모두 선택해 주세요.</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="disease in ['당뇨', '고혈압', '간질환', '심장질환']" :key="disease" type="button" @click="toggleDisease(disease)" class="px-5 py-3 rounded-full border text-sm font-semibold transition" :class="diseases.includes(disease) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'">
              {{ disease }}
            </button>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold mb-2">약물이나 음식에 대한 알레르기가 있나요?</h2>
          <div class="flex gap-3 mt-4">
            <button type="button" @click="allergy = false" class="flex-1 py-4 rounded-2xl font-bold transition" :class="allergy === false ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">아니오</button>
            <button type="button" @click="allergy = true" class="flex-1 py-4 rounded-2xl font-bold transition" :class="allergy === true ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">예</button>
          </div>
          <input v-model="allergyDetail" type="text" placeholder="알레르기 원인을 적어주세요 (예: 페니실린, 복숭아)" class="w-full mt-3 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-sm font-medium">
        </div>

        <div>
          <h2 class="text-xl font-bold mb-2">최근 2주 이내 해외 방문 이력이 있나요?</h2>
          <div class="flex gap-3 mt-4">
            <button type="button" @click="travel = false" class="flex-1 py-4 rounded-2xl font-bold transition" :class="travel === false ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">아니오</button>
            <button type="button" @click="travel = true" class="flex-1 py-4 rounded-2xl font-bold transition" :class="travel === true ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">예</button>
          </div>
        </div>
      </section>

      <section v-show="currentStep === 3">
        <div class="bg-indigo-600 rounded-[32px] p-8 text-white mb-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">전송 준비 완료</p>
            <h2 class="text-2xl font-bold mb-4 text-balance">모든 정보를 확인했습니다.<br>병원으로 전송할까요?</h2>
            <div class="space-y-2 opacity-80 text-sm">
              <p><i class="fa-solid fa-check mr-2"></i> 증상 입력 완료</p>
              <p><i class="fa-solid fa-check mr-2"></i> 과거 병력 확인 완료</p>
            </div>
          </div>
          <i class="fa-solid fa-paper-plane absolute -right-4 -bottom-4 text-9xl text-white/10 rotate-12"></i>
        </div>
        
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-slate-400 ml-1">약관 동의</h3>
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" class="w-5 h-5 rounded accent-indigo-600" checked>
              <span class="text-sm font-medium text-slate-600">개인정보 수집 및 이용 동의 (필수)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" class="w-5 h-5 rounded accent-indigo-600" checked>
              <span class="text-sm font-medium text-slate-600">민감정보 처리 동의 (필수)</span>
            </label>
          </div>
        </div>
      </section>
    </main>

    <div class="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
      <div class="max-w-2xl mx-auto flex gap-3">
        <button @click="saveTemporarily" class="w-14 h-14 bg-slate-100 rounded-2xl hover:bg-slate-200 transition">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>

        <button v-if="currentStep < totalStep" @click="nextStep" class="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition">
          다음 단계
        </button>

        <button v-else @click="submitSurveyForm" class="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition flex items-center justify-center">
            문진표 제출
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div v-show="showToast" class="fixed bottom-28 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-50">
        임시 저장되었습니다
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.step-active { background: #4f46e5; color: white; }
.step-inactive { background: #e2e8f0; color: #64748b; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
<style>
html, body { overflow-y: auto !important; height: auto !important; min-height: 100vh; }
#app { min-height: 100vh; overflow-y: auto; }
</style>