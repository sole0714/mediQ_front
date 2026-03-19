<template>
  <div class="w-full h-full relative overflow-hidden md:pl-64">
    <div ref="mapContainer" class="w-full h-full bg-slate-100"></div>
    
    <div v-if="!isLoaded" class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <span class="text-slate-400 font-semibold animate-pulse">지도 로딩 중...</span>
    </div>

    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-[70] transition-transform duration-300 ease-out pointer-events-none"
         :class="mode === 'hospital' ? 'w-[95%] md:w-[680px]' : 'w-max'">
      
      <div class="ml-40 glass rounded-[24px] px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 relative pointer-events-auto">
  
        <div class="flex items-center gap-2 shrink-0">
          
          <button v-if="mode === 'pharmacy' && previousHospital" 
                  @click="returnToHospital"
                  class="px-3 py-2 rounded-xl bg-indigo-600 text-white border border-indigo-600 shadow-sm text-xs font-black hover:bg-indigo-700 whitespace-nowrap flex items-center gap-1 animate-pulse-slow">
            <i class="fa-solid fa-arrow-left"></i> 병원으로
          </button>
          
          <button @click="reSearch" class="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition whitespace-nowrap flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-right text-slate-400"></i> 재검색
          </button>
          
          <label class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-700 cursor-pointer whitespace-nowrap hover:bg-slate-50 hover:border-slate-300 transition select-none">
            <input type="checkbox" v-model="filterOpenOnly" @change="applyFilters" class="accent-indigo-600 scale-90">
            영업 중
          </label>
        </div>
        
        <template v-if="mode === 'hospital'">
            
            <div class="w-px h-4 bg-slate-300 shrink-0 mx-1 hidden md:block"></div>

            <div class="flex items-center gap-2 shrink-0">
            
              <div class="relative">
                  <select v-model="sortMode" @change="applyFilters"
                          class="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-black text-slate-700 outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition">
                    <option value="distance">거리순</option>
                    <option value="wait">대기순</option>
                    <option value="status">혼잡순</option>
                  </select>
                  <i class="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
              </div>
              
              <div class="relative">
                  <button @click="isDeptMenuOpen = !isDeptMenuOpen" 
                          class="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 shadow-sm whitespace-nowrap"
                          :class="currentDept === 'all' 
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300' 
                              : 'bg-indigo-50 border-indigo-200 text-indigo-700'">
                    <span class="text-xs font-black">
                        {{ currentDept === 'all' ? '진료과목' : currentDept }}
                    </span>
                    <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-300 text-slate-400" 
                        :class="{ 'rotate-180': isDeptMenuOpen, 'text-indigo-500': currentDept !== 'all' }"></i>
                  </button>

                  <div v-if="isDeptMenuOpen" 
                      class="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-[60] grid grid-cols-3 gap-2 animate-fade-in-down origin-top-right">
                    
                    <button @click="setDept('all')" 
                            class="col-span-3 py-2.5 rounded-xl text-xs font-black transition-colors"
                            :class="currentDept === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'">
                        전체 보기
                    </button>
                    
                    <button v-for="dept in depts.filter(d => d !== 'all')" :key="dept" 
                            @click="setDept(dept)" 
                            class="py-2 rounded-xl text-xs font-bold transition-colors truncate px-1 border border-transparent"
                            :class="currentDept === dept ? 'bg-indigo-50 text-indigo-700 border-indigo-100 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'">
                        {{ dept }}
                    </button>
                  </div>
              </div>
            
            </div>
        </template>
      </div>
    </div>

    <button @click="panToMyLocation"
            :class="selectedCard ? 'bottom-[360px] md:bottom-6 md:right-[460px]' : 'bottom-6 right-6'"
            class="absolute z-[70] w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-300 ease-in-out">
      <i class="fa-solid fa-location-crosshairs text-xl"></i>
    </button>

    <div class="sheet absolute left-0 right-0 bottom-0 md:left-auto md:right-6 md:bottom-6 md:w-[430px] z-[60]"
         :class="{ open: selectedCard }">
       <div class="glass-strong md:rounded-[28px] rounded-t-[28px] p-5 md:p-6 relative shadow-2xl">
         
        <button @click="closeCard" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 z-10">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <div v-if="selectedCard" class="fade-in">
          <div class="flex justify-between items-start mb-4 pr-8">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-black uppercase tracking-wider mb-1" 
                 :style="{ color: getColorByStatus(selectedCard.status) }">
                {{ selectedCard.status }}
              </p>
              
              <div class="flex items-center gap-2 mt-1 mb-1">
                <h4 class="text-xl font-black text-slate-900 leading-tight truncate">
                  {{ selectedCard.name }}
                </h4>
                
                <button @click.stop="toggleFavorite(selectedCard)" 
                        class="shrink-0 px-3 py-1.5 rounded-full border transition flex items-center gap-1.5"
                        :class="isFavorite(selectedCard) 
                          ? 'bg-rose-50 border-rose-200 text-rose-500' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'">
                  <i class="text-sm" :class="isFavorite(selectedCard) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
                  <span class="text-xs font-bold">찜</span>
                </button>
              </div>

              <p class="text-xs text-slate-500 mt-1">
                <span class="text-indigo-600 font-bold">{{ selectedCard.dept.split(',')[0] }}</span> | {{ selectedCard.distance }}
              </p>
            </div>
            
            <div class="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center min-w-[80px]">
              <p class="text-[10px] text-slate-500 font-black">대기</p>
              <p class="text-xl font-black text-slate-900">{{ selectedCard.waitTime }}<span class="text-xs">분</span></p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-slate-50 px-3 py-2 rounded-2xl flex items-center gap-2 border border-slate-100">
              <i class="fa-solid fa-users text-slate-400 text-xs"></i>
              <p class="text-xs font-black text-slate-700">{{ selectedCard.waitCount }} 대기</p>
            </div>
            <div class="bg-slate-50 px-3 py-2 rounded-2xl flex items-center gap-2 border border-slate-100">
              <i class="fa-solid fa-square-parking text-slate-400 text-xs"></i>
              <p class="text-xs font-black text-slate-700">{{ selectedCard.parking }}</p>
            </div>
            <button @click="callHospital(selectedCard.phone)" class="bg-indigo-600 text-white px-3 py-2 rounded-2xl font-black text-xs hover:bg-indigo-700 flex items-center justify-center gap-2">
              <i class="fa-solid fa-phone"></i> 전화
            </button>
          </div>

<div class="space-y-2">
            
            <button v-if="mode === 'hospital'" 
                    @click="searchNearbyPharmacies(selectedCard)" 
                    class="w-full bg-emerald-100 text-emerald-700 py-3 rounded-2xl font-black hover:bg-emerald-200 flex items-center justify-center gap-2 text-sm transition">
              <i class="fa-solid fa-pills"></i> 이 병원 주변 약국 보기
            </button>

            <button @click="openKakaoWay(selectedCard)" class="w-full bg-[#FEE500] text-[#191919] py-3 rounded-2xl font-black hover:bg-yellow-400 flex items-center justify-center gap-2 text-sm">
              <i class="fa-solid fa-route"></i> 길찾기
            </button>
            
            <button v-if="mode === 'hospital'" 
                    @click="goToPrecheck" 
                    class="w-full bg-slate-900 text-white py-3 rounded-2xl font-black hover:bg-slate-800 flex items-center justify-center gap-2 text-sm">
              <span>접수/ 예약</span> <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
       </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, defineExpose, defineEmits, watch } from 'vue';
import { useRouter } from 'vue-router';


// props로 mode 받기
const props = defineProps(['favorites', 'mode']);
const emit = defineEmits(['update-hospitals', 'toggle-favorite', 'switch-mode-to-pharmacy', 'switch-mode-to-hospital', 'select-hospital']);

const mapContainer = ref(null);
const map = ref(null);
const ps = ref(null);
const isLoaded = ref(false);
const overlayList = ref([]);
const currentPlaces = ref([]);
const selectedCard = ref(null);
const previousHospital = ref(null);
const myLocationOverlay = ref(null); 

const isMarkerClicked = ref(false);
const isDeptMenuOpen = ref(false);

const filterOpenOnly = ref(false);
const sortMode = ref('distance');
const currentDept = ref('all');



const rawData = ref([]);

const router = useRouter();

const depts = ['all', '내과', '이비인후과', '정형외과', '소아청소년과', '피부과', '치과', '산부인과', '안과', '가정의학과', '비뇨의학과', '한의원'];

const symptomDB = [
  { dept: "내과", keywords: ["배", "복통", "설사", "구토", "체했", "속쓰림", "소화불량", "위염", "장염", "변비", "메스꺼움", "울렁", "명치", "가슴통증", "혈압", "당뇨", "몸살", "오한", "열", "감기기운"] },
  { dept: "이비인후과", keywords: ["코", "목", "귀", "감기", "비염", "독감", "기침", "가래", "콧물", "코막힘", "재채기", "편도", "목아픔", "인후통", "중이염", "이명", "축농증", "어지러움"] },
  { dept: "정형외과", keywords: ["뼈", "골절", "허리", "디스크", "관절", "무릎", "어깨", "손목", "발목", "인대", "접질", "삠", "근육통", "담", "타박상", "물리치료", "거북목", "손가락"] },
  { dept: "치과", keywords: ["이", "치통", "잇몸", "사랑니", "충치", "스케일링", "임플란트", "시린", "교정", "턱관절", "발치", "신경치료", "치아"] },
  { dept: "피부과", keywords: ["피부", "여드름", "두드러기", "아토피", "습진", "가려움", "점", "사마귀", "티눈", "탈모", "화상", "무좀", "대상포진", "뾰루지", "알레르기"] },
  { dept: "안과", keywords: ["눈", "시력", "다래끼", "충혈", "안구건조", "눈물", "따가움", "렌즈", "라식", "라섹", "백내장", "녹내장", "눈병", "결막염"] },
  { dept: "소아청소년과", keywords: ["아이", "아기", "접종", "영유아", "신생아", "육아", "발열", "성장", "수족구"] },
  { dept: "산부인과", keywords: ["임신", "생리", "여성", "질염", "방광염", "피임", "자궁", "출산", "산모", "갱년기", "월경", "부정출혈"] },
  { dept: "신경과", keywords: ["두통", "편두통", "어지럼증", "치매", "손떨림", "마비", "저림"] },
  { dept: "정신건강의학과", keywords: ["우울", "불면", "잠", "스트레스", "공황", "불안", "상담", "기억력"] },
  { dept: "비뇨의학과", keywords: ["소변", "요로결석", "전립선", "혈뇨", "성병", "포경"] }
];

const getDepartmentBySymptom = (inputText) => {
  for (let item of symptomDB) {
    for (let key of item.keywords) {
      if (inputText.includes(key)) return item.dept;
    }
  }
  return inputText;
};

onMounted(() => {
  if (!window.kakao || !window.kakao.maps) return;
  window.kakao.maps.load(() => {
    const options = { center: new window.kakao.maps.LatLng(37.5598, 126.9425), level: 4 };
    map.value = new window.kakao.maps.Map(mapContainer.value, options);
    map.value.setMaxLevel(8); map.value.setMinLevel(1); 
    ps.value = new window.kakao.maps.services.Places();
    
    const zoomControl = new window.kakao.maps.ZoomControl();
    map.value.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    isLoaded.value = true;

    window.kakao.maps.event.addListener(map.value, 'dragend', () => reSearch());
    window.kakao.maps.event.addListener(map.value, 'zoom_changed', () => { if(currentPlaces.value.length > 0) displayMarkers(currentPlaces.value); });
    window.kakao.maps.event.addListener(map.value, 'click', () => {
      if (isMarkerClicked.value) { isMarkerClicked.value = false; return; }
      closeCard(); 
    });

    setTimeout(() => { if(map.value) { map.value.relayout(); panToMyLocation(); } }, 380);
  });
});

watch(() => props.mode, (newMode) => {
  if (map.value && isLoaded.value) {
    selectedCard.value = null;
    emit('select-hospital', null); 
    isDeptMenuOpen.value = false;
    currentDept.value = 'all';
    sortMode.value = 'distance';
    filterOpenOnly.value = false;
    
    if (newMode === 'pharmacy' && previousHospital.value) {
      performSearchAroundHospital(previousHospital.value);
      return; 
    }

    if (newMode === 'hospital') previousHospital.value = null;
    reSearch();
  }
});

const isFavorite = (h) => props.favorites?.some(f => f.id === h.id) || false;
const toggleFavorite = (h) => emit('toggle-favorite', h);

const searchPlaces = (keyword) => {
  if (!ps.value) return;
  selectedCard.value = null;
  emit('select-hospital', null);
  isDeptMenuOpen.value = false;

  const isPharmacyMode = props.mode === 'pharmacy';
  let finalKeyword = keyword;
  if (!isPharmacyMode) {
    const converted = getDepartmentBySymptom(keyword);
    if (converted !== keyword) finalKeyword = converted;
  }

  const searchOption = {
    location: map.value.getCenter(), radius: 2000, sort: window.kakao.maps.services.SortBy.DISTANCE, size: 15
  };

  let allData = [];
  const placesSearchCB = (data, status, pagination) => {
    if (status === window.kakao.maps.services.Status.OK) {
      allData = [...allData, ...data];
      if (pagination.hasNextPage && pagination.currentPage < 3) pagination.nextPage();
      else processFinalData(allData, isPharmacyMode);
    } else {
      if (allData.length > 0) processFinalData(allData, isPharmacyMode);
      else { rawData.value = []; applyFilters(); }
    }
  };
  ps.value.keywordSearch(finalKeyword, placesSearchCB, searchOption);
};

const reSearch = () => {
  const keyword = props.mode === 'pharmacy' ? '약국' : '병원';
  searchPlaces(keyword);
};

const processFinalData = (data, isPharmacyMode) => {
  const filteredData = data.filter(place => {
    if (isPharmacyMode) return place.category_group_code === 'PM9' || place.place_name.includes('약국');
    else return place.category_group_code === 'HP8' && !place.place_name.includes('동물') && !place.category_name.includes('동물');
  });

  if (filteredData.length === 0) { rawData.value = []; applyFilters(); return; }
  rawData.value = filteredData.map(place => generateRandomData(place));
  applyFilters();
};

const applyFilters = () => {
  let result = [...rawData.value];
  if (props.mode !== 'pharmacy' && currentDept.value !== 'all') {
    result = result.filter(h => h.dept.includes(currentDept.value));
  }
  if (filterOpenOnly.value) result = result.filter(h => h.isOpen);
  
  if (sortMode.value === 'distance') result.sort((a,b) => a.distanceValue - b.distanceValue);
  else if (sortMode.value === 'wait') result.sort((a,b) => a.waitTime - b.waitTime);
  else if (sortMode.value === 'status') { const rank = { "원활": 0, "보통": 1, "혼잡": 2 }; result.sort((a,b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)); }
  
  displayMarkers(result);
  emit('update-hospitals', result);
};

const setDept = (d) => { currentDept.value = d; isDeptMenuOpen.value = false; applyFilters(); };

const displayMarkers = (places) => {
  currentPlaces.value = places;
  overlayList.value.forEach(o => o.setMap(null));
  overlayList.value = [];

  const level = map.value.getLevel();
  const isSimpleMode = level >= 6;
  const isPharmacyMode = props.mode === 'pharmacy';

  places.forEach(place => {
    const position = new window.kakao.maps.LatLng(place.lat, place.lng);
    const color = getColorByStatus(place.status); 
    const content = document.createElement('div');
    content.className = 'overlay-group cursor-pointer'; content.style.pointerEvents = 'auto'; 
    const iconClass = isPharmacyMode ? 'fa-pills' : 'fa-hospital';

    if (isSimpleMode) {
      content.innerHTML = `<div style="width: 14px; height: 14px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
    } else {
      content.innerHTML = `<div class="info-bubble">${!isPharmacyMode ? `<span>대기 ${place.waitCount}</span><span class="text-slate-300 mx-1">|</span>` : ''}<span>${place.distance}</span></div>
        <div class="custom-div-icon"><div class="pin-marker" style="background:${color}"><i class="fa-solid ${iconClass}" style="color:#ffffff"></i></div></div>`;
    }  
    
    content.addEventListener('click', (e) => {
       e.stopPropagation();
       isMarkerClicked.value = true; openCard(place);
       if(isSimpleMode) map.value.setLevel(4, {animate: true});
    });

    const overlay = new window.kakao.maps.CustomOverlay({ map: map.value, position, content, yAnchor: isSimpleMode ? 0.5 : 1, zIndex: 3, clickable: true });
    overlayList.value.push(overlay);
  });
};

const generateRandomData = (place) => {
  const isPharmacy = props.mode === 'pharmacy';
  const isOpen = Math.random() > 0.3;
  let statusText = !isOpen ? "영업 종료" : (isPharmacy ? "영업 중" : ["원활", "보통", "혼잡"][Math.floor(Math.random() * 3)]);

  const categoryName = (place.category_name || '').split(' > ').pop() || "장소";
  let detailDept = categoryName;
  let subjects = [detailDept];
  if (!isPharmacy && (categoryName.includes("종합") || categoryName === "병원" || categoryName.includes("내과"))) {
    detailDept = "내과 전문"; subjects = ["소화기내과", "호흡기내과", "내분비내과", "건강검진"];
  } else if (!isPharmacy && categoryName.includes("이비인후과")) {
    subjects = ["비염클리닉", "난청/이명", "감기/독감"];
  }

  const doctors = [];
  if (!isPharmacy) {
    const familyNames = ["김", "이", "박", "최", "정", "강", "조", "윤"]; const givenNames = ["서준", "민준", "지우", "서윤", "하윤", "지호"];
    for(let i=0; i< Math.floor(Math.random() * 3) + 1; i++) {
       const name = familyNames[Math.floor(Math.random()*familyNames.length)] + givenNames[Math.floor(Math.random()*givenNames.length)];
       doctors.push({ name: name + " 원장", field: subjects[i % subjects.length] || "전문의" });
    }
  }

  const reviews = [];
  const reviewTexts = ["선생님이 정말 친절하세요! 설명도 꼼꼼함.", "대기가 좀 길었지만 진료는 만족합니다.", "시설이 깔끔하고 간호사분들도 상냥해요.", "주차장이 협소해서 조금 불편했어요 ㅠ", "과잉진료 없이 딱 필요한 것만 봐주심."];
  for(let i=0; i<Math.floor(Math.random() * 4); i++) {
    reviews.push({ user: "방문자" + (i+1), text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)], date: "2024.01." + (10 + i), rate: (Math.random() * 2 + 3).toFixed(1) });
  }

  return {
    id: place.id, name: place.place_name, lat: place.y, lng: place.x, address: place.road_address_name || place.address_name, phone: place.phone || "02-0000-0000",
    distance: place.distance ? place.distance + "m" : "-", distanceValue: Number(place.distance || 999999), place_url: place.place_url,
    isOpen: isOpen, status: statusText, waitTime: (!isOpen || isPharmacy) ? 0 : Math.floor(Math.random() * 30) + 5,
    waitCount: (!isOpen || isPharmacy) ? 0 : (Math.floor(Math.random() * 10) + 1) + "명", parking: Math.random() > 0.5 ? "여유" : "만차",
    dept: detailDept, subjects: subjects, doctors: doctors, reviews: reviews, closingSoon: isOpen && Math.random() > 0.8
  };
};

const getColorByStatus = (status) => {
  if (!status) return "#6366f1"; if (status === "원활") return "#10b981"; if (status === "보통") return "#f59e0b"; if (status === "혼잡") return "#f43f5e"; return "#64748b";
};

const panToMyLocation = () => {
  if (!navigator.geolocation) { reSearch(); return; }
  navigator.geolocation.getCurrentPosition((pos) => {
    const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    map.value.setCenter(latlng);
    if (!myLocationOverlay.value) {
      const content = document.createElement('div'); content.className = 'my-location-pulse';
      myLocationOverlay.value = new window.kakao.maps.CustomOverlay({ map: map.value, position: latlng, content: content, yAnchor: 0.5, zIndex: 3 });
    } else { myLocationOverlay.value.setPosition(latlng); myLocationOverlay.value.setMap(map.value); }
   reSearch();
  }, (err) => { console.error(err); reSearch(); });
};

const openKakaoWay = (h) => window.open(`https://map.kakao.com/link/to/${h.name},${h.lat},${h.lng}`);
const callHospital = (phone) => window.location.href = `tel:${phone}`;
const goToPrecheck = () => router.push('/precheck');

const openCard = (place) => { selectedCard.value = place; if(map.value) map.value.panTo(new window.kakao.maps.LatLng(place.lat, place.lng)); displayMarkers([place]); emit('select-hospital', place); };
const closeCard = () => { 
  selectedCard.value = null; 
  applyFilters(); 
  emit('select-hospital', null);
  
  if (props.mode === 'pharmacy' && previousHospital.value) {
    returnToHospital();
  }
};
const resizeMap = () => { if(map.value) { map.value.relayout(); map.value.setCenter(map.value.getCenter()); } };
const resetToGeneralMode = () => { previousHospital.value = null; selectedCard.value = null; reSearch(); };

defineExpose({ searchPlaces, openCard, resizeMap, closeCard, resetToGeneralMode });

const searchNearbyPharmacies = (hospital) => {
  if (!hospital) return;
  
  previousHospital.value = hospital;
  selectedCard.value = null; 
  emit('select-hospital', null);
  emit('switch-mode-to-pharmacy');   
};

const performSearchAroundHospital = (hospital) => {
  const center = new window.kakao.maps.LatLng(hospital.lat, hospital.lng);
  map.value.setCenter(center); 
  map.value.setLevel(4);
  const searchOption = { location: center, radius: 500, sort: window.kakao.maps.services.SortBy.DISTANCE };
  
  ps.value.categorySearch('PM9', (data, status) => {
    if (status === window.kakao.maps.services.Status.OK) {
       processFinalData(data, true); 
    } else {
       alert('주변에 약국이 없습니다.');
    }
  }, searchOption);
};

const returnToHospital = () => {
  if (!previousHospital.value) return;
  const h = previousHospital.value;
  const center = new window.kakao.maps.LatLng(h.lat, h.lng);
  map.value.setCenter(center);
  emit('switch-mode-to-hospital');
  previousHospital.value = null;
};
</script>

<style scoped>
.glass { background: rgba(255,255,255,.90); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.65); }
.glass-strong { background: rgba(255,255,255,.98); backdrop-filter: blur(16px); border: 1px solid rgba(15,23,42,.08); }
.sheet { transform: translateY(110%); opacity: 0; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.sheet.open { transform: translateY(0); opacity: 1; }

@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-down {
  animation: fade-in-down 0.2s ease-out forwards;
}

.overlay-group { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; transform: translateY(0); transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
.overlay-group:hover { transform: translateY(-4px) scale(1.05); z-index: 10; }
.info-bubble { background: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 800; color: #334155; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 4px; display: flex; align-items: center; white-space: nowrap; border: 1px solid rgba(0,0,0,0.05); }
.custom-div-icon { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
.pin-marker { width: 34px; height: 34px; border-radius: 50% 50% 50% 0; background: #6366f1; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99,102,241,0.4); border: 2px solid white; transition: background 0.3s; }
.pin-marker i { transform: rotate(45deg); font-size: 14px; }
.my-location-pulse { width: 16px; height: 16px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(59,130,246,0.3); animation: pulse-ring 1.5s infinite; }
@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); } 70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
</style>