<template>
  <header class="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-[100] sticky top-0 w-full">
    
    <button @click="$emit('toggle-sidebar')" class="md:hidden text-slate-500 mr-4 hover:text-indigo-600 transition">
      <i class="fa-solid fa-bars text-xl"></i>
    </button>

    <div class="hidden md:flex w-64 flex-col justify-center h-full border-r border-slate-100/50 -ml-6 pl-6 mr-6">
       <a href="/" class="flex items-center gap-2">
         <img src="@/assets/image/mediQ_logo.png" alt="Logo" class="w-8 h-8 object-contain" 
              @error="e => (e.target.style.display = 'none')">
         <span class="text-xl font-black tracking-tight text-slate-900">MediQ</span>
       </a>
    </div>

    <div class="flex-none pl-0 mr-80">

        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
          </div>

        <input 
          type="text" 
          v-model="keyword"
          @keyup.enter="onSearch"
          class="block w-[800px] pl-10 pr-28 py-2.5 border border-slate-200 rounded-2xl bg-white shadow-sm
                        text-slate-900 placeholder-slate-400 padding 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition
                 text-sm font-semibold"
          placeholder="증상, 병원명 검색 (예: 배아파, 세브란스)"
        >
        
        <button 
          @click="onSearch"
          class="absolute inset-y-0 right-1.5 my-1.5 px-4 rounded-xl
                 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm">
          검색
        </button>
      </div>
    </div>

    <div class="flex items-center gap-4 ml-4 shrink-0">
      <button class="text-slate-400 hover:text-slate-600 relative transition">
        <i class="fa-regular fa-bell text-xl"></i>
        <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
      </button>
      
      <RouterLink to="/mypage" class="md:hidden text-slate-400 hover:text-slate-600">
        <i class="fa-solid fa-circle-user text-xl"></i>
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

// 부모에게 보낼 이벤트 정의
const emit = defineEmits(['search', 'toggle-sidebar']);
const keyword = ref('');

const onSearch = () => {
  if (!keyword.value.trim()) {
    alert('검색어를 입력해주세요');
    return;
  }
  emit('search', keyword.value); // 부모 컴포넌트로 전달
};
</script>