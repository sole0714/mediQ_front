<script setup>
import { reactive, computed, onMounted, ref } from 'vue' // ref 추가
import api from '@/api/user'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 병원 모드 토글 변수 추가
const isHospitalMode = ref(false)

// kakaoPlaceId 필드 추가
const signupForm = reactive({
  name: '',
  email: '',
  password: '',
  kakaoPlaceId: '', 
})

const signupInputError = reactive({
  name: { errorMessage: '', isValid: false },
  email: { errorMessage: '', isValid: false },
  password: { errorMessage: '', isValid: false },
  kakaoPlaceId: { errorMessage: '', isValid: false },
})

onMounted(() => {
  if (route.query.email) {
    signupForm.email = route.query.email;
    signupInputError.email.isValid = true;
  }
  if (route.query.name) {
    signupForm.name = route.query.name;
    signupInputError.name.isValid = true;
  }
})

const passwordStrength = computed(() => {
  const pw = signupForm.password
  if (!pw) return { score: 0, label: '', color: 'text-slate-400', bg: 'bg-slate-200' }

  const hasLength = pw.length >= 8
  const hasUpperLetter = /[A-Z]/.test(pw)
  const hasLowerLetter = /[a-z]/.test(pw)
  const hasNumber = /[0-9]/.test(pw)
  const hasSpecial = /[!@$]/.test(pw)

  let score = 0
  if (hasLength) score++
  if (hasUpperLetter) score++
  if (hasLowerLetter) score++
  if (hasNumber) score++
  if (hasSpecial) score++

  if (score <= 1) return { score: 1, label: '하 (약함)', color: 'text-red-500', bg: 'bg-red-500' }
  if (score <= 3) return { score: 2, label: '중 (보통)', color: 'text-yellow-500', bg: 'bg-yellow-500' }
  return { score: 3, label: '상 (강함)', color: 'text-green-500', bg: 'bg-green-500' }
})

const nameRules = () => {
  if (signupForm.name.length < 2) { 
    signupInputError.name.errorMessage = '이름은 2글자 이상 입력해야 합니다.'
    signupInputError.name.isValid = false
    return false
  }
  signupInputError.name.errorMessage = ''
  signupInputError.name.isValid = true
  return true
}

const emailRules = () => {
  const email = signupForm.email
  if (!email) {
    signupInputError.email.errorMessage = '이메일을 입력해주세요.'
    signupInputError.email.isValid = false
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    signupInputError.email.errorMessage = '이메일 형식이 올바르지 않습니다.'
    signupInputError.email.isValid = false
    return false
  }
  signupInputError.email.errorMessage = ''
  signupInputError.email.isValid = true
  return true
}

const passwordRules = () => {
  if (signupForm.password.length < 8) {
    signupInputError.password.errorMessage = '비밀번호는 8글자 이상 입력해야 합니다.'
    signupInputError.password.isValid = false
    return false
  }

  const hasUpperLetter = /[A-Z]/.test(signupForm.password)
  const hasLowerLetter = /[a-z]/.test(signupForm.password)
  const hasNumber = /[0-9]/.test(signupForm.password)
  const hasSpecial = /[!@$]/.test(signupForm.password)

  if (!(hasUpperLetter && hasLowerLetter && hasNumber && hasSpecial)) {
    signupInputError.password.errorMessage = '영문 대/소문자, 숫자, 특수문자(!@$)를 모두 포함해야 합니다.'
    signupInputError.password.isValid = false
    return false
  }

  signupInputError.password.errorMessage = ''
  signupInputError.password.isValid = true
  return true
}

// 병원 ID 검증 로직 추가
const kakaoPlaceRules = () => {
  if (isHospitalMode.value && !signupForm.kakaoPlaceId) {
    signupInputError.kakaoPlaceId.errorMessage = '카카오맵 ID를 입력해주세요.'
    signupInputError.kakaoPlaceId.isValid = false
    return false
  }
  signupInputError.kakaoPlaceId.errorMessage = ''
  signupInputError.kakaoPlaceId.isValid = true
  return true
}

const isFormValid = () => {
  let valid = signupInputError.name.isValid && 
              signupInputError.email.isValid && 
              signupInputError.password.isValid
  
  // 병원 모드일 때는 병원 ID도 유효해야 함
  if (isHospitalMode.value) {
    valid = valid && signupInputError.kakaoPlaceId.isValid
  }
  return valid
}

const signup = async () => {
  const isNameValid = nameRules()
  const isEmailValid = emailRules()
  const isPwValid = passwordRules()
  const isKakaoPlaceValid = kakaoPlaceRules()

  if (!isNameValid || !isEmailValid || !isPwValid || (isHospitalMode.value && !isKakaoPlaceValid)) {
    alert("입력 정보를 다시 확인해주세요.")
    return
  }

  if (passwordStrength.value.score < 2) {
    alert("비밀번호 보안 수준을 '중' 이상으로 설정해주세요.")
    return
  }

  try {
    let res;
    // 토글 상태에 따라 호출하는 API가 다름
    if (isHospitalMode.value) {
      res = await api.hospitalSignup(signupForm)
    } else {
      res = await api.signup(signupForm)
    }

    if (res.status === 200) {
      alert("가입 성공!")
      router.push({ name: 'login' })
    }
  } catch (error) {
    console.error(error)
    alert("회원가입 중 오류가 발생했습니다.")
  }
}
</script>

<template>
  <div class="bg-slate-50 flex items-center justify-center min-h-screen py-10">
    <div class="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200">
      <div class="flex items-center gap-3 mb-6">
        <RouterLink to="/login" class="text-slate-400 hover:text-slate-600">
          <i class="fa-solid fa-arrow-left"></i>
        </RouterLink>
        <h1 class="text-2xl font-bold">회원가입</h1>
      </div>

      <div class="flex bg-slate-100 p-1 rounded-2xl mb-8">
          <button 
              type="button" 
              @click="isHospitalMode = false" 
              :class="!isHospitalMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'" 
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          >
              일반 환자
          </button>
          <button 
              type="button" 
              @click="isHospitalMode = true" 
              :class="isHospitalMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'" 
              class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          >
              병원 관계자
          </button>
      </div>
      
      <form @submit.prevent="signup" class="space-y-5 mb-10">
        
        <div v-if="isHospitalMode">
          <label for="kakaoPlaceId" class="block text-xs font-bold text-indigo-500 uppercase mb-2 ml-1">카카오맵 장소 ID (병원 식별자)</label>
          <input
            @blur="kakaoPlaceRules()" 
            v-model="signupForm.kakaoPlaceId"
            type="text" id="kakaoPlaceId" placeholder="예: 123456789"
            class="bg-indigo-50 w-full rounded-2xl px-4 py-3 border border-indigo-100 outline-none text-sm focus:border-indigo-400"
          />
          <p v-if="signupInputError.kakaoPlaceId.errorMessage" class="text-red-500 text-xs mt-1 ml-1">
            {{ signupInputError.kakaoPlaceId.errorMessage }}
          </p>
        </div>

        <div>
          <label for="name" class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">이름 (담당자명)</label>
          <input
            @blur="nameRules()" 
            v-model="signupForm.name"
            type="text" id="name" :placeholder="isHospitalMode ? '담당자 이름을 입력해주세요' : '실명을 입력해주세요'"
            class="bg-slate-50 w-full rounded-2xl px-4 py-3 border border-slate-100 outline-none text-sm"
          />
          <p v-if="signupInputError.name.errorMessage" class="text-red-500 text-xs mt-1 ml-1">
            {{ signupInputError.name.errorMessage }}
          </p>
        </div>

        <div>
          <label for="email" class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">이메일</label>
          <input
            @blur="emailRules()" 
            v-model="signupForm.email"
            type="email" id="email" placeholder="example@gmail.com"
            class="bg-slate-50 w-full rounded-2xl px-4 py-3 border border-slate-100 outline-none text-sm"
          />
          <p v-if="signupInputError.email.errorMessage" class="text-red-500 text-xs mt-1 ml-1">
            {{ signupInputError.email.errorMessage }}
          </p>
        </div>

        <div>
          <label for="password" class="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">비밀번호</label>
          <input
            @blur="passwordRules()"
            v-model="signupForm.password"
            type="password" id="password" placeholder="영문 대/소문자, 숫자, 특수문자(!@$) 포함"
            class="bg-slate-50 w-full rounded-2xl px-4 py-3 border border-slate-100 outline-none text-sm"
          />
          <p v-if="signupInputError.password.errorMessage" class="text-red-500 text-xs mt-1 ml-1">
            {{ signupInputError.password.errorMessage }}
          </p>
        </div>

        <div v-if="signupForm.password" class="mt-2 ml-1 flex items-center gap-3">
          <div class="flex gap-1">
             <div :class="['h-1 w-6 rounded-full transition-colors', passwordStrength.score >= 1 ? passwordStrength.bg : 'bg-slate-200']"></div>
             <div :class="['h-1 w-6 rounded-full transition-colors', passwordStrength.score >= 2 ? passwordStrength.bg : 'bg-slate-200']"></div>
             <div :class="['h-1 w-6 rounded-full transition-colors', passwordStrength.score >= 3 ? passwordStrength.bg : 'bg-slate-200']"></div>
          </div>
          <span :class="['text-[10px] font-bold uppercase tracking-tighter', passwordStrength.color]">
            보안도: {{ passwordStrength.label }}
          </span>
        </div>

        <button 
          type="submit" 
          :disabled="!isFormValid()" 
          :class="[
            'w-full py-4 rounded-2xl font-bold transition shadow-lg text-white', 
            isFormValid() 
              ? (isHospitalMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800') 
              : 'bg-slate-300 cursor-not-allowed'
          ]"
        >
          계정 생성
        </button>
            
      </form>
    </div>
  </div>
</template>

<style scoped>
</style>