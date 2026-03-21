<script setup>
import { reactive, ref } from 'vue'
import api from '@/api/user'
import { useRouter } from 'vue-router'
import useAuthStore from '@/stores/useAuthStore'

// 👇 이 필수 선언들이 지워졌을 확률이 높습니다!
const router = useRouter()
const authStore = useAuthStore()

const loginForm = reactive({
  email: '',
  password: '',
})

// 병원 모드인지 확인하는 토글 변수
const isHospitalMode = ref(false) 

const login = async () => {
  if (!loginForm.email || !loginForm.password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  try {
    let res;
    // 모드에 따라 호출하는 API 주소가 다름
    if (isHospitalMode.value) {
      res = await api.hospitalLogin(loginForm); // 병원 로그인 API 호출
    } else {
      res = await api.login(loginForm); // 일반 로그인 API 호출
    }

    if (res.status == 200) {
      authStore.login(JSON.stringify(res.data))
      router.push('/') 
    } 
  } catch (error) {
    console.log(error);
    alert('아이디와 비밀번호를 확인해보세요.')
  }
}

const kakaoLogin = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/kakao";
}
</script>

<template>
    <div class="bg-white flex items-center justify-center min-h-screen">
    <div class="w-full max-w-md p-6">
        <div class="text-center mb-8">
            <RouterLink to="/" class="inline-block mb-6">
                <img src="@/assets/image/mediQ_logo.png" alt="MediQ Logo" class="w-16 h-16 object-contain mx-auto">
            </RouterLink>
            <h1 class="text-2xl font-bold mb-2">로그인</h1>
            <p class="text-sm text-slate-400">서비스 이용을 위해 로그인해주세요.</p>
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

        <form @submit.prevent="login" class="space-y-4 mb-8">
            <div class="bg-slate-50 rounded-2xl flex items-center px-4 py-3 border border-slate-100">
                <i class="fa-solid fa-envelope text-slate-300 mr-3"></i>
                <input v-model="loginForm.email" type="email" :placeholder="isHospitalMode ? '병원 담당자 이메일' : '이메일'" class="bg-transparent w-full outline-none text-sm" required>
            </div>
            <div class="bg-slate-50 rounded-2xl flex items-center px-4 py-3 border border-slate-100">
                <i class="fa-solid fa-lock text-slate-300 mr-3"></i>
                <input v-model="loginForm.password" type="password" placeholder="비밀번호" class="bg-transparent w-full outline-none text-sm" required>
            </div>
            
            <button type="submit" id="login-btn" 
                    :class="isHospitalMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'"
                    class="w-full py-4 text-white rounded-2xl font-bold transition shadow-lg mb-2">
                로그인
            </button>
            
            <button v-show="!isHospitalMode" type="button" @click="kakaoLogin" class="w-full py-4 bg-[#FEE500] text-[#000000] rounded-2xl font-bold hover:bg-[#e6cf00] transition shadow-lg flex justify-center items-center">
                <i class="fa-solid fa-comment mr-2"></i> 카카오로 로그인
            </button>
        </form>

        <div class="flex justify-center gap-4 mt-8 text-xs font-bold">
                <RouterLink to="/signup" class="text-slate-400 hover:text-slate-600">회원가입</RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/UserFindId" class="text-slate-400 hover:text-slate-600">아이디 찾기</RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/UserFindpassword" class="text-slate-400 hover:text-slate-600">비밀번호 찾기</RouterLink>
        </div>
    </div>
    </div>
</template>