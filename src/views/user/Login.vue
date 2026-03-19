<script setup>
import { reactive } from 'vue'
import api from '@/api/user'
import { useRouter } from 'vue-router'
import useAuthStore from '@/stores/useAuthStore'

const router = useRouter()

const loginForm = reactive({
  email: '',
  password: '',
})

const authStore = useAuthStore()

const login = async () => {
  if (!loginForm.email || !loginForm.password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  try {
    const res = await api.login(loginForm)

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
        <div class="text-center mb-10">
            <RouterLink to="/" class="inline-block mb-6">
                <img src="@/assets/image/mediQ_logo.png" alt="MediQ Logo" class="w-16 h-16 object-contain mx-auto">
            </RouterLink>
            <h1 class="text-2xl font-bold mb-2">로그인</h1>
            <p class="text-sm text-slate-400">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        <form @submit.prevent="login" class="space-y-4 mb-8">
            <div class="bg-slate-50 rounded-2xl flex items-center px-4 py-3 border border-slate-100">
                <i class="fa-solid fa-envelope text-slate-300 mr-3"></i>
                <input v-model="loginForm.email" type="email" placeholder="이메일" class="bg-transparent w-full outline-none text-sm" required>
            </div>
            <div class="bg-slate-50 rounded-2xl flex items-center px-4 py-3 border border-slate-100">
                <i class="fa-solid fa-lock text-slate-300 mr-3"></i>
                <input v-model="loginForm.password" type="password" placeholder="비밀번호" class="bg-transparent w-full outline-none text-sm" required>
            </div>
            <button type="submit" id="login-btn" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg mb-2">로그인</button>
            
            <button type="button" @click="kakaoLogin" class="w-full py-4 bg-[#FEE500] text-[#000000] rounded-2xl font-bold hover:bg-[#e6cf00] transition shadow-lg flex justify-center items-center">
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

<style scoped>

</style>
