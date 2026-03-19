<template>
  <div class="hidden md:flex w-80 md:w-96 lg:w-[400px] flex-col bg-white border-l border-slate-200 shadow-xl z-10 h-full shrink-0 transition-all duration-300 relative">
    
    <div v-if="selectedPlace" class="flex flex-col h-full animate-fade-in">
      
      <div class="p-5 border-b border-slate-100 bg-white flex items-center gap-3">
        <button @click="$emit('close-detail')" class="w-8 h-8 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h2 class="text-lg font-black text-slate-900 truncate flex-1">{{ selectedPlace.name }}</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-6">
        
        <div class="flex justify-between items-start">
           <div>
             <span class="inline-block px-2 py-1 rounded-md text-xs font-black mb-2" 
                   :style="{ color: selectedPlace.statusColor, backgroundColor: selectedPlace.statusColor + '20' }">
               {{ selectedPlace.status }}
             </span>
             <p class="text-sm text-slate-500 font-medium">{{ selectedPlace.dept }}</p>
           </div>
           <button @click="$emit('toggle-favorite', selectedPlace)" class="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition">
              <i class="text-2xl" :class="isFavorite(selectedPlace) ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart'"></i>
              <span>찜하기</span>
           </button>
        </div>

        <div v-if="selectedPlace.subjects && selectedPlace.subjects.length > 0">
           <h4 class="text-xs font-black text-slate-900 mb-2">진료 과목</h4>
           <div class="flex flex-wrap gap-1.5">
             <span v-for="sub in selectedPlace.subjects" :key="sub" 
                   class="px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg">
               {{ sub }}
             </span>
           </div>
        </div>

        <div v-if="selectedPlace.doctors && selectedPlace.doctors.length > 0">
           <h4 class="text-xs font-black text-slate-900 mb-2">의료진 정보</h4>
           <div class="space-y-2">
             <div v-for="(doc, idx) in selectedPlace.doctors" :key="idx" 
                  class="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl">
               <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                 <i class="fa-solid fa-user-doctor text-lg"></i>
               </div>
               <div>
                 <p class="text-sm font-bold text-slate-800">{{ doc.name }}</p>
                 <p class="text-[11px] text-indigo-500 font-semibold">{{ doc.field }}</p>
               </div>
             </div>
           </div>
        </div>

        <div v-if="mode === 'hospital'" class="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4 text-center">
          <div>
            <p class="text-xs text-slate-500 mb-1">예상 대기</p>
            <p class="text-2xl font-black text-slate-900">{{ selectedPlace.waitTime }}<span class="text-sm font-normal text-slate-500 ml-1">분</span></p>
          </div>
          <div class="border-l border-slate-200">
             <p class="text-xs text-slate-500 mb-1">대기 인원</p>
             <p class="text-2xl font-black text-slate-900">{{ selectedPlace.waitCount }}</p>
          </div>
        </div>

        <div>
           <div class="flex items-center justify-between mb-2">
             <h4 class="text-xs font-black text-slate-900">최근 방문 리뷰</h4>
             <a @click.prevent="openKakaoLink" href="#" class="text-[10px] text-slate-400 underline hover:text-indigo-600 cursor-pointer">
               전체 리뷰 보기 <i class="fa-solid fa-external-link-alt"></i>
             </a>
           </div>

           <div v-if="selectedPlace.reviews && selectedPlace.reviews.length > 0" class="space-y-3">
             <div v-for="(rev, idx) in selectedPlace.reviews" :key="idx" class="bg-slate-50 p-3 rounded-xl">
               <div class="flex justify-between items-center mb-1">
                 <span class="text-xs font-bold text-slate-700">{{ rev.user }}</span>
                 <div class="flex items-center gap-1">
                   <i class="fa-solid fa-star text-[10px] text-yellow-400"></i>
                   <span class="text-[10px] font-bold text-slate-600">{{ rev.rate }}</span>
                 </div>
               </div>
               <p class="text-xs text-slate-600 leading-relaxed">{{ rev.text }}</p>
               <p class="text-[9px] text-slate-400 mt-1 text-right">{{ rev.date }}</p>
             </div>
           </div>
           <p v-else class="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
             아직 등록된 리뷰가 없습니다.
           </p>
        </div>

        <div class="space-y-4 text-sm text-slate-600 border-t border-slate-100 pt-4">
          <div class="flex gap-3">
            <i class="fa-solid fa-location-dot mt-1 text-slate-400 w-4"></i>
            <div>
              <p>{{ selectedPlace.address }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ selectedPlace.distance }}</p>
            </div>
          </div>
          <div class="flex gap-3">
             <i class="fa-solid fa-phone mt-1 text-slate-400 w-4"></i>
             <p>{{ selectedPlace.phone }}</p>
          </div>
          <div class="flex gap-3">
             <i class="fa-solid fa-clock mt-1 text-slate-400 w-4"></i>
             <p :class="selectedPlace.isOpen ? 'text-emerald-600 font-bold' : 'text-slate-400'">
               {{ selectedPlace.isOpen ? '영업 중' : '영업 종료' }}
               <span v-if="selectedPlace.closingSoon" class="text-rose-500 text-xs ml-2">(곧 마감)</span>
             </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
           <button @click="openKakaoLink" class="bg-[#FEE500] text-[#191919] py-3 rounded-xl font-black hover:bg-yellow-400 flex items-center justify-center gap-2 transition">
              <i class="fa-solid fa-route"></i> 길찾기
           </button>
           <a :href="`tel:${selectedPlace.phone}`" class="bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 flex items-center justify-center gap-2 transition">
              <i class="fa-solid fa-phone"></i> 전화하기
           </a>
        </div>

      </div>
    </div>


    <div v-else class="flex flex-col h-full animate-fade-in">
      
      <div class="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <button @click="$emit('close-list')" class="p-1.5 -ml-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition">
              <i class="fa-solid fa-list-ul text-lg"></i>
            </button>
            <h2 class="text-lg font-black text-slate-900">{{ mode === 'pharmacy' ? '약국 목록' : '병원 목록' }}</h2>
          </div>
          <span class="text-xs font-black text-slate-500">{{ hospitals?.length || 0 }}개 결과</span>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-100 mb-2 overflow-hidden">
          <button @click="isFavOpen = !isFavOpen" class="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition text-left">
            <h3 class="text-xs font-bold text-slate-700 flex items-center gap-1">
              <i class="fa-solid fa-heart text-rose-500"></i> 즐겨찾기
              <span v-if="filteredFavorites.length" class="ml-1 text-[10px] text-slate-400 font-normal">({{ filteredFavorites.length }})</span>
            </h3>
            <i class="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': isFavOpen }"></i>
          </button>
          
          <transition name="slide-down">
            <div v-show="isFavOpen" class="px-3 pb-3">
              <div v-if="filteredFavorites.length" class="space-y-1 pt-1">
                <div v-for="fav in filteredFavorites" :key="fav.id" 
                     @click="$emit('item-click', fav)" 
                     class="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition group">
                  <div class="flex flex-col min-w-0 flex-1 mr-2">
                    <span class="text-xs font-bold text-slate-700 truncate">{{ fav.name }}</span>
                    <span class="text-[10px] text-slate-400 truncate mt-0.5"><i class="fa-solid fa-location-dot text-[9px] mr-0.5 opacity-50"></i>{{ getSimpleLoc(fav.address) }}</span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span v-if="mode === 'hospital'" class="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">대기 {{ fav.waitTime }}분</span>
                    <button @click.stop="$emit('toggle-favorite', fav)" class="text-slate-300 hover:text-rose-500 p-1 transition"><i class="fa-solid fa-xmark text-xs"></i></button>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-slate-400 py-2 text-center">즐겨찾기한 {{ mode === 'pharmacy' ? '약국' : '병원' }}이 없습니다.</p>
            </div>
          </transition>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        <div v-if="!hospitals || hospitals.length === 0" class="text-center py-12 text-slate-400 text-sm">
          <i class="fa-solid fa-map-location-dot text-2xl mb-2 block"></i>
          지도에서 {{ mode === 'pharmacy' ? '약국' : '병원' }}을 검색해보세요.
        </div>

        <div v-else v-for="h in hospitals" :key="h.id"
             @click="$emit('item-click', h)"
             class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group">
          
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 class="font-black text-slate-900 text-sm truncate group-hover:text-indigo-600 transition">{{ h.name }}</h3>
              <p class="text-xs text-slate-500 mt-1 truncate">{{ h.dept }}</p>
              <p class="text-[11px] text-slate-400 mt-1 truncate">{{ h.distance }} · {{ h.address }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span v-if="h.isOpen" class="badge bg-emerald-50 text-emerald-700 border-emerald-100">{{ h.closingSoon ? '곧 마감' : '영업 중' }}</span>
              <span v-else class="badge bg-slate-100 text-slate-500">영업 종료</span>
              <button @click.stop="$emit('toggle-favorite', h)" class="mt-1">
                <i class="fa-heart text-lg transition" :class="isFavorite(h) ? 'fa-solid text-rose-500' : 'fa-regular text-slate-300 hover:text-rose-400'"></i>
              </button>
            </div>
          </div>
          <div class="pt-3 border-t border-slate-50 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs">
              <template v-if="mode === 'hospital'">
                <span class="w-2.5 h-2.5 rounded-full" :class="{'bg-emerald-500': h.status==='원활', 'bg-amber-400': h.status==='보통', 'bg-rose-500': h.status==='혼잡'}"></span>
                <span class="font-black text-slate-700">{{ h.status }}</span>
                <span class="text-slate-400">·</span>
                <span class="text-slate-500 font-semibold">대기 {{ h.waitTime }}분</span>
              </template>
              <template v-else>
                 <i class="fa-solid fa-clock text-slate-400"></i>
                 <span class="text-slate-500 font-semibold">{{ h.isOpen ? '지금 방문 가능' : '오픈 시간 확인 필요' }}</span>
              </template>
            </div>
            <div class="flex gap-2">
               <a :href="`tel:${h.phone}`" class="btn-icon" title="전화"><i class="fa-solid fa-phone"></i></a>
               <button class="btn-icon text-indigo-600 bg-indigo-50" title="길찾기"><i class="fa-solid fa-route"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  hospitals: { type: Array, default: () => [] },
  favorites: { type: Array, default: () => [] },
  mode: { type: String, default: 'hospital' },
  selectedPlace: { type: Object, default: null } 
});

defineEmits(['item-click', 'toggle-favorite', 'close-list', 'close-detail']);

const isFavOpen = ref(true);

const isFavorite = (h) => {
  return props.favorites?.some(f => f.id === h.id) || false;
};

const getSimpleLoc = (addr) => {
  if (!addr) return '';
  return addr.split(' ').slice(0, 2).join(' ');
};

const openKakaoLink = () => {
    if(props.selectedPlace) {
        const p = props.selectedPlace;
        // place_url이 있으면 그걸 쓰고, 없으면 검색 링크 사용
        const url = p.place_url || `https://map.kakao.com/link/to/${p.name},${p.lat},${p.lng}`;
        window.open(url, '_blank');
    }
};

const filteredFavorites = computed(() => {
  return props.favorites.filter(item => {
    const isPharmacyItem = item.name.includes('약국') || (item.dept && item.dept.includes('약국'));
    if (props.mode === 'pharmacy') {
      return isPharmacyItem;
    } else {
      return !isPharmacyItem;
    }
  });
});
</script>

<style scoped>
.badge { font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 6px; border: 1px solid transparent; }
.btn-icon { width: 32px; height: 32px; border-radius: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; display: flex; align-items: center; justify-content: center; transition: all .2s; }
.btn-icon:hover { background: #e2e8f0; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; max-height: 300px; opacity: 1; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { max-height: 0; opacity: 0; padding-bottom: 0; }

.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>