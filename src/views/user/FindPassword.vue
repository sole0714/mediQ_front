<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// 처리 중임을 나타내는 로딩 상태 (버튼 연타 방지)
const isLoading = ref(false)

const state = reactive({
  email: ''
})

const sendResetEmail = async () => {
    if (!state.email) {
        alert("이메일을 입력해주세요.");
        return;
    }

    try {
        isLoading.value = true;
        const response = await axios.post('http://localhost:8080/api/find/password/reset', {
            email: state.email
        });

        if (response.data.success) {
            alert("입력하신 이메일로 임시 비밀번호가 발송되었습니다.\n메일함을 확인해주세요!");
            router.push('/login');
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        alert(error.response?.data?.message || "메일 전송에 실패했습니다. 가입된 이메일인지 확인해주세요.");
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
<div class="flex items-center justify-center min-h-screen p-6">
    <div class="w-full max-w-md">
        <div class="text-center mb-10">
            <RouterLink to="/" class="inline-block">
                <img src="@/assets/image/mediQ_logo.png" alt="MediQ Logo" class="w-16 h-16 object-contain mx-auto">
            </RouterLink>
            <h2 class="text-xl font-bold text-slate-900 mt-6">비밀번호 재설정</h2>
            <p class="text-sm text-slate-500 mt-2">가입하신 이메일 주소로 임시 비밀번호를 보내드립니다.</p>
        </div>

        <div class="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100 border border-slate-100">
            <form @submit.prevent="sendResetEmail" class="space-y-5">
                <div>
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">이메일(아이디)</label>
                    <div class="relative">
                        <input v-model="state.email" type="email" placeholder="example@mediq.com" class="w-full mt-1.5 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
                        <i class="fa-regular fa-envelope absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 mt-0.5"></i>
                    </div>
                </div>
                
                <button type="submit" :disabled="isLoading" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg disabled:bg-slate-400">
                    {{ isLoading ? '메일 발송 중...' : '임시 비밀번호 받기' }}
                </button>
            </form>

            <div class="justify-center text-center mt-8 text-xs font-bold">
             <RouterLink to="/UserFindId" class="block text-slate-400 hover:text-slate-600 mb-4">이메일이 기억나지 않으시나요? 아이디 찾기</RouterLink>
             <RouterLink to="/login" class="block text-slate-400 hover:text-slate-600">로그인으로 돌아가기</RouterLink>
            </div>
        </div>
    </div>
</div>
</template>