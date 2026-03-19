<script setup>
import { reactive } from 'vue';

const state = reactive({
  name: '',
  email: '',
  placeholder: '',
  phone: ''
});
const sanitizePhoneNumber = (event) => {
  let value = event.target.value.replace(/[^0-9]/g, '');
  
  // 11자리 넘으면 자르기
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  
  state.phone = value;
}

const findId = () => {
    if (!state.name || !state.email || !state.phone) {
        alert("모든 정보를 입력해주세요.");
        return;
    }
    console.log("아이디 찾기 요청:", state);
    // axios 요청 코드넣어야 함
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
            <p class="text-sm text-slate-500 mt-2">가입 시 등록한 정보를 입력해 주세요.</p>
        </div>

        <div class="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-100 border border-slate-100">
            <div class="space-y-5">
                <div>
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">이름</label>
                    <input v-model="state.name" type="text" placeholder="홍길동" class="w-full mt-1.5 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
                </div>
                <div>
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">이메일</label>
                    <input v-model="state.email" type="email" placeholder="홍길동" class="w-full mt-1.5 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
                </div>
                <div>
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">휴대폰 번호</label>
                    <input type="tel" v-model="state.phone" @input="sanitizePhoneNumber"maxlength="11"placeholder="숫자만 입력 (예: 01012345678)" class="w-full mt-1.5 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-medium">
                </div>
                
                
                <button @click="findId" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg">
                    아이디 확인
                </button>
            </div>

            <div class="flex justify-center gap-4 mt-8 text-xs font-bold">
                <RouterLink to="/signup" class="text-slate-400 hover:text-slate-600">회원가입</RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/login" class="text-slate-400 hover:text-slate-600">로그인으로 돌아가기 </RouterLink>
                <span class="text-slate-200">|</span>
                <RouterLink to="/UserFindpassword" class="text-slate-400 hover:text-slate-600">비밀번호 찾기 </RouterLink>
            </div>
        </div>
    </div>

</div>
</template>

<style scoped>

</style>