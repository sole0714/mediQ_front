<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-50">
    <LeftSideBar @change-tab="changeMode" :current-tab="mode" />

    <div class="flex-1 flex flex-col h-full relative">
      <Header @search="handleSearch" />
      
      <main class="flex-1 flex relative overflow-hidden">
        
        <template v-if="mode === 'hospital' || mode === 'pharmacy'">
          <div class="flex-1 bg-slate-100 relative z-0 transition-all duration-300">
            <MainMap
              ref="mapRef" :favorites="favorites" :mode="mode"
              @update-hospitals="updateList" 
              @toggle-favorite="handleToggleFavorite"
              @switch-mode-to-pharmacy="mode = 'pharmacy'"
              @switch-mode-to-hospital="mode = 'hospital'"
              @select-hospital="handleSelectPlace" 
            />

            <button v-if="!isListOpen" 
                    @click="isListOpen = true"
                    class="absolute top-4 right-12 z-[50] bg-white border border-slate-200 text-slate-700 
                           px-4 py-2.5 rounded-xl shadow-lg font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2">
              <i class="fa-solid fa-list-ul text-indigo-600"></i> 목록 보기
            </button>
          </div>
          
          <transition name="slide-fade">
            <MainList 
              v-show="isListOpen"
              :hospitals="places" 
              :favorites="favorites"
              :mode="mode"
              :selected-place="selectedPlace"
              @item-click="focusPlace" 
              @toggle-favorite="handleToggleFavorite" 
              @close-list="isListOpen = false"
              @close-detail="clearSelection"
            />
          </transition>
        </template>

        <div v-else-if="mode === 'reservation'" class="flex-1 bg-white p-10 overflow-y-auto z-10 md:pl-72">
           <div class="space-y-4">
              <Booking />  
             </div>
           </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LeftSideBar from '@/components/layout/LeftSideBar.vue';
import Header from '@/components/layout/Header.vue';
import MainMap from '@/components/MainMap.vue';
import MainList from '@/components/MainList.vue';
import Booking from '@/components/Waiting.vue';




const route = useRoute()
const router = useRouter()
const mode = ref('hospital')

onMounted(() => {
  // URL 쿼리로 모드 설정
  if (route.query.mode) {
    mode.value = route.query.mode;
    router.replace({ path: '/' });
  }

  const saved = localStorage.getItem('myFavorites');
  if (saved) favorites.value = JSON.parse(saved);
});




const mapRef = ref(null);
const places = ref([]);
const isListOpen = ref(true);
const selectedPlace = ref(null);
const favorites = ref([]);

const handleSearch = (keyword) => {
  if (mapRef.value) mapRef.value.searchPlaces(keyword);
};

const updateList = (data) => {
  places.value = data;
};

const focusPlace = (place) => {
  if (mapRef.value) mapRef.value.openCard(place);
};

const handleSelectPlace = (place) => {
  selectedPlace.value = place;
  if (place) isListOpen.value = true;
};

const clearSelection = () => {
  selectedPlace.value = null;
  if (mapRef.value) mapRef.value.closeCard();
};

const handleToggleFavorite = (item) => {
  const idx = favorites.value.findIndex(f => f.id === item.id);
  if (idx > -1) favorites.value.splice(idx, 1);
  else favorites.value.push(item);
  localStorage.setItem('myFavorites', JSON.stringify(favorites.value));
};

const changeMode = (newMode) => {
  mode.value = newMode;
  places.value = []; 
  isListOpen.value = true;
  selectedPlace.value = null; 
};

watch(isListOpen, () => {
  setTimeout(() => {
    if (mapRef.value) {
      mapRef.value.resizeMap();
    }
  }, 350);
});
</script>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(100%); opacity: 0; }
</style>