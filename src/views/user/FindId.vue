<script setup>
import { reactive, ref } from 'vue';
import axios from 'axios';

const state = reactive({
  name: ''
});

const foundEmail = ref('');

const findId = async () => {
    // 앞뒤 공백(띄어쓰기) 자동 제거
    const trimmedName = state.name.trim();

    if (!trimmedName) {
        alert("이름을 입력해주세요.");
        return;
    }
    
    try {
        const response = await axios.post('http://localhost:8080/api/find/id', {
            name: trimmedName
        });

        if (response.data.success) {
            foundEmail.value = response.data.result;
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        // 백엔드에서 보내준 구체적인 에러 메시지를 우선적으로 출력
        alert(error.response?.data?.result || error.response?.data?.message || "일치하는 회원 정보가 없습니다.");
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
            <h2 class="text-xl font-bold text-slate-900 mt-6">아이디 찾기</h2>
            <p class="text-sm text-slate-500 mt-2">가입 시 등록한 이름을 입력해 주세요.</p>
        </div>

        <div class="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100 border border-slate-100">
            
            <div v-if="!foundEmail" class="space-y-5">
                <div>
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">이름</label>
                    <input v-model="state.name" @keyup.enter="findId" type="text" placeholder="홍길동" class="w-full mt-1.5 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
                </div>
                
                <button @click="findId" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg mt-4">
                    아이디 확인
                </button>
            </div>

            <div v-else class="text-center py-6">
                <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 text-2xl">
                    <i class="fa-solid fa-check"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">회원님의 아이디입니다.</h3>
                <p class="text-xl font-black text-indigo-600 mb-8">{{ foundEmail }}</p> 
                
                <RouterLink to="/login" class="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg">
                    로그인 하러가기
                </RouterLink>
            </div>

            <div class="flex justify-center gap-4 mt-8 text-xs font-bold">
                <RouterLink to="/signup" class="text-slate-400 hover:text-slate-600">회원가입</RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/login" class="text-slate-400 hover:text-slate-600">로그인</RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/UserFindpassword" class="text-slate-400 hover:text-slate-600">비밀번호 찾기</RouterLink>
            </div>
        </div>
    </div>
</div>
</template>