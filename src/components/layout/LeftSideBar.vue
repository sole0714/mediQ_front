<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import useAuthStore from '@/stores/useAuthStore';

const router = useRouter();
const authStore = useAuthStore();

const emit = defineEmits(['change-tab']);

const currentTab = ref('hospital');

const changeTab = (tabName) => {
  currentTab.value = tabName;
  emit('change-tab', tabName); 
};

// 💡 복잡했던 username computed 로직을 완전히 삭제했습니다!
// (이제 authStore.getUsername()이 모든 걸 알아서 해줍니다)

const handleLogout = () => {
  authStore.logout();
};

onMounted(() => {
  authStore.checkLogin();
});

</script>

<template>
  <div class="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 
            z-30 fixed top-16 left-0 
            h-[calc(100vh-4rem)]">

    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <p class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>

      <button 
        @click="changeTab('hospital')"
        :class="[
          'w-full group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all',
          currentTab === 'hospital' 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <i class="fa-solid fa-map-location-dot w-6 text-center text-lg mr-2 group-hover:scale-110 transition"></i>
        내 주변 병원
      </button>

      <button 
        @click="changeTab('pharmacy')"
        :class="[
          'w-full group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all',
          currentTab === 'pharmacy' 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <i class="fa-solid fa-pills w-6 text-center text-lg mr-2 group-hover:scale-110 transition"></i>
        주변 약국
      </button>

      <button 
        @click="changeTab('reservation')"
        :class="[
          'w-full group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all',
          currentTab === 'reservation' 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <i class="fa-solid fa-calendar-check w-6 text-center text-lg mr-2 group-hover:scale-110 transition"></i>
        나의 예약
        <span class="ml-auto bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs font-black">1</span>
      </button>

      <div class="pt-6 mt-6 border-t border-slate-100">
        <p class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</p>
        <RouterLink to="/mypage" class="w-full group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
          <i class="fa-solid fa-user-gear text-center text-lg mr-2"></i>
          마이페이지
        </RouterLink>
      </div>
    </nav>

    <div class="p-4 border-t border-slate-100 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
          <i class="fa-solid fa-user"></i>
        </div>

        <div v-if="authStore.isLogin">
          <p class="text-sm font-extrabold text-slate-900">
            {{ authStore.getUsername() }} 님 
          </p>
          <button
            @click="handleLogout"
            class="text-xs text-red-500 hover:underline"
          >로그아웃
          </button>
        </div>

        <div v-else>
          <p class="text-sm font-extrabold text-slate-900">게스트</p>
          <RouterLink to="/login" class="text-xs text-indigo-600 hover:underline">
            로그인하기
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>