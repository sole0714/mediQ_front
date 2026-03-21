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
import api from '@/plugins/axiosinterceptor';
import useAuthStore from '@/stores/useAuthStore';

import LeftSideBar from '@/components/layout/LeftSideBar.vue';
import Header from '@/components/layout/Header.vue';
import MainMap from '@/components/MainMap.vue';
import MainList from '@/components/MainList.vue';
import Booking from '@/components/Waiting.vue';




const route = useRoute()
const router = useRouter()
const mode = ref('hospital')




const mapRef = ref(null);
const places = ref([]);
const isListOpen = ref(true);
const selectedPlace = ref(null);
const favorites = ref([]);

const authStore = useAuthStore();

const fetchBookmarks = async () => {
  if (!authStore.isLogin) {
    favorites.value = [];
    return;
  }

  try {
    const res = await api.get('/bookmark/list');

    favorites.value = res.data.map(bookmark => ({
      idx: bookmark.idx,  // bookmark DB의 idx
      id: bookmark.placeId, // 카카오맵 DB의 ID
      name: bookmark.name,
      address: bookmark.location,
      lat: bookmark.latitude,
      lng: bookmark.longitude
    }));
  } catch (error) {
    console.error('북마크 목록 불러오기 실패:', error);
  }
};

onMounted(() => {
  if (route.query.mode) {
    mode.value = route.query.mode;
    router.replace({ path: '/' });
  }
  
  authStore.checkLogin();
  fetchBookmarks();
});

const handleToggleFavorite = async (item) => {

  const existingIdx = favorites.value.findIndex(f => f.id === item.id);

  if (existingIdx > -1) {
    const targetIdx = favorites.value[existingIdx].idx;
    try {
      await api.delete(`/bookmark/delete/${targetIdx}`);
      favorites.value.splice(existingIdx, 1); 
    } catch (error) {
      console.error('북마크 삭제 실패:', error);
    }
  } else {
    const bookmarkData = {
      placeId: item.id,
      name: item.name,
      location: item.address,
      latitude: item.lat,
      longitude: item.lng
    };

    try {
      const res = await api.post('/bookmark/register', bookmarkData);
      
      favorites.value.push({
        idx: res.data.idx,
        id: item.id,
        name: item.name,
        address: item.address,
        lat: item.lat,
        lng: item.lng
      });
    } catch (error) {
      console.error('북마크 등록 실패:', error);
      alert('북마크 등록을 위해 로그인이 필요합니다.');
    }
  }
};
const handleSearch = (keyword) => {
  if (mapRef.value) mapRef.value.searchPlaces(keyword);
};

const updateList = (data) => {
  places.value = data;
};

const focusPlace = (place) => {
  // 불필요 시 더미 데이터 삭제
  const enrichedPlace = {
    ...place, 
    status: place.status || '보통',
    waitTime: place.waitTime || Math.floor(Math.random() * 30) + 5,
    waitCount: place.waitCount || (Math.floor(Math.random() * 10) + 1) + "명",
    dept: place.dept || '내과 전문',
    phone: place.phone || '02-0000-0000',
    parking: place.parking || (Math.random() > 0.5 ? "여유" : "만차"),
    isOpen: place.isOpen !== undefined ? place.isOpen : true,
    distance: place.distance || '저장된 장소',
    subjects: place.subjects || ['일반진료'],
    doctors: place.doctors || [{ name: '담당 원장', field: '전문의' }],
    reviews: place.reviews || []
  };
  
  // 여기까지

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