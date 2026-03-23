<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import useAuthStore from '@/stores/useAuthStore'; 
import { storeToRefs } from 'pinia';
import api from '@/plugins/axiosinterceptor';

const router = useRouter();
const authStore = useAuthStore();
const { userInfo } = storeToRefs(authStore);

const goToMain = () => {
    router.push('/');
};

const logout = async () => {
    alert("로그아웃 되었습니다.");
    await authStore.logout();    
    window.location.href = '/';
};

const currentTab = ref('medical-history');

const tabs = [
    { id: 'medical-history', label: '진료 기록', icon: 'fa-heart-pulse', color: 'rose' },
    { id: 'prescriptions', label: '처방전', icon: 'fa-file-prescription', color: 'indigo' },
    { id: 'billing', label: '결제/영수증', icon: 'fa-file-invoice-dollar', color: 'emerald' },
    { id: 'results', label: '검사 결과', icon: 'fa-square-poll-vertical', color: 'amber' }
];

const medicalHistoryData = ref([]);
const prescriptionsData = ref([]);
const billingData = ref([]);
const resultsData = ref([]);

const selectTab = async (tabId) => {
    currentTab.value = tabId;
    updateArrowPosition();

    if (!authStore.isLogin) return;

    try {
        if (tabId === 'medical-history' && medicalHistoryData.value.length === 0) {
            const res = await api.get('/mypage/medical');
            if (res.data.success) medicalHistoryData.value = res.data.result;
        } 
        else if (tabId === 'prescriptions' && prescriptionsData.value.length === 0) {
            const res = await api.get('/mypage/prescriptions');
            if (res.data.success) prescriptionsData.value = res.data.result;
        } 
        else if (tabId === 'billing' && billingData.value.length === 0) {
            const res = await api.get('/mypage/billing');
            if (res.data.success) billingData.value = res.data.result;
        } 
        else if (tabId === 'results' && resultsData.value.length === 0) {
            const res = await api.get('/mypage/results');
            if (res.data.success) resultsData.value = res.data.result;
        }
    } catch (error) {
        console.error(`${tabId} 데이터를 불러오는데 실패했습니다:`, error);
    }
};

// 💡 백엔드에서 받아올 진짜 일정 데이터 배열 (빈 배열로 초기화)
const hospitalSchedule = ref([]);

// 💡 백엔드(/orders/schedule)에서 결제 완료된 내 일정을 가져오는 함수
const fetchSchedule = async () => {
    try {
        const res = await api.get('/orders/schedule');
        if (res.data.success) {
            hospitalSchedule.value = res.data.result;
        }
    } catch (error) {
        console.error('일정 불러오기 실패:', error);
    }
};

const familyMembers = ref([
    {
        name: '어머니',
        icon: '👩',
        iconBg: 'bg-rose-100',
        status: '등록됨',
        statusClass: 'bg-rose-50 text-rose-500',
        hospital: '최근 진료: 내과 (2주 전)'
    }
]);

const showModal = ref(false); 
const newMemberName = ref(''); 

const openAddModal = () => {
    newMemberName.value = ''; 
    showModal.value = true;
};

const closeAddModal = () => {
    showModal.value = false;
};

const saveFamilyMember = () => {
    if (!newMemberName.value.trim()) {
        alert("이름을 입력해주세요!");
        return;
    }

    const newMember = {
        name: newMemberName.value,
        icon: '🙂', 
        iconBg: 'bg-indigo-100',
        status: '등록됨',
        statusClass: 'bg-slate-100 text-slate-500',
        hospital: '진료 기록 없음'
    };

    familyMembers.value.push(newMember); 
    closeAddModal(); 
};

const arrowPosition = ref('12.5%');

const updateArrowPosition = () => {
    const index = tabs.findIndex(t => t.id === currentTab.value) + 1;
    if (window.innerWidth < 768) {
        if (index === 1 || index === 3) arrowPosition.value = "25%";
        else arrowPosition.value = "75%";
    } else {
        arrowPosition.value = (index * 25 - 12.5) + "%";
    }
};

const showDateModal = ref(false);
const editingIndex = ref(null); 
const selectedDate = ref('');   

const openDateModal = (index) => {
    editingIndex.value = index; 
    showDateModal.value = true;
};

const saveNewDate = () => {
    if (!selectedDate.value) return;
    const [year, month, day] = selectedDate.value.split('-'); 
    hospitalSchedule.value[editingIndex.value].month = `${parseInt(month)}월`;
    hospitalSchedule.value[editingIndex.value].day = day;
    showDateModal.value = false;
    selectedDate.value = '';
};

onMounted(() => {
    window.addEventListener('resize', updateArrowPosition);
    updateArrowPosition();
    
    authStore.checkLogin(); 

    if (authStore.isLogin) {
        selectTab('medical-history');
        // 💡 로그인 되어있으면 일정 불러오기 함수 즉시 실행!
        fetchSchedule(); 
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', updateArrowPosition);
});
</script>

<template>
    <main class="w-full h-full overflow-y-auto bg-slate-50">
        <div class="max-w-7xl mx-auto px-6 py-10">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <button @click="router.back()" class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition shadow-sm cursor-pointer">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <h1 class="text-2xl font-bold">마이페이지</h1>
                </div>
                <button @click="goToMain" class="text-slate-400 hover:text-indigo-600 transition cursor-pointer">
                    <i class="fa-solid fa-house text-xl"></i>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <div class="relative flex flex-col items-center">
                            <div class="w-24 h-24 rounded-full bg-white p-1 mb-4 shadow-lg">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-full h-full rounded-full bg-slate-100" alt="profile">
                            </div>
                            
                            <h2 class="text-xl font-bold"> 
                                {{ authStore.isLogin ? authStore.getUsername() : '게스트' }} 
                                <span class="text-sm font-normal text-slate-400">님</span>
                            </h2>
                            
                            <p class="text-sm text-slate-500 mb-6">{{ userInfo?.email || '로그인이 필요합니다' }}</p>
                            
                            <div class="grid grid-cols-3 gap-2 w-full text-center mb-6">
                                <div class="bg-slate-50 p-3 rounded-2xl">
                                    <p class="text-[10px] text-slate-400 uppercase font-bold">나이</p>
                                    <p class="font-bold text-slate-700">{{ userInfo ? '28세' : '-' }}</p>
                                </div>
                                <div class="bg-slate-50 p-3 rounded-2xl">
                                    <p class="text-[10px] text-slate-400 uppercase font-bold">혈액형</p>
                                    <p class="font-bold text-slate-700">{{ userInfo ? 'A+' : '-' }}</p>
                                </div>
                                <div class="bg-slate-50 p-3 rounded-2xl">
                                    <p class="text-[10px] text-slate-400 uppercase font-bold">성별</p>
                                    <p class="font-bold text-slate-700">{{ userInfo ? '남성' : '-' }}</p>
                                </div>
                            </div>
                            
                            <button v-if="userInfo" class="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition cursor-pointer">내 정보 수정</button>
                            <button v-else @click="router.push('/login')" class="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition cursor-pointer">로그인 하기</button>
                        </div>
                    </div>

                    <div v-if="userInfo" class="bg-rose-50 rounded-[32px] p-6 border border-rose-100">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-notes-medical text-rose-500"></i>
                            <h3 class="font-bold text-rose-800">기저질환 및 알러지</h3>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <span class="px-3 py-1 bg-white text-rose-500 text-xs font-bold rounded-full border border-rose-100 shadow-sm">페니실린 알러지</span>
                            <span class="px-3 py-1 bg-white text-slate-500 text-xs font-bold rounded-full border border-slate-100 shadow-sm">천식(경미)</span>
                        </div>
                    </div>

                    <button v-if="userInfo" @click="logout" class="w-full py-4 text-slate-400 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-rose-500 transition cursor-pointer">
                        <i class="fa-solid fa-right-from-bracket mr-2"></i> 로그아웃
                    </button>
                </div>

                <div class="lg:col-span-8 space-y-10">
                    
                    <section>
                        <h3 class="text-lg font-bold mb-5 px-2 text-slate-800">내 의료 지갑</h3>
                        
                        <div v-if="userInfo">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <button 
                                    v-for="tab in tabs" 
                                    :key="tab.id"
                                    @click="selectTab(tab.id)"
                                    :class="[
                                        'tab-btn p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md flex flex-col items-center gap-3 group transition-all duration-300 cursor-pointer',
                                        currentTab === tab.id ? 'active-btn bg-white' : 'bg-white',
                                        `text-${tab.color}-600`
                                    ]"
                                >
                                    <div :class="`w-12 h-12 rounded-2xl bg-${tab.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`">
                                        <i :class="['fa-solid text-xl', tab.icon]"></i>
                                    </div>
                                    <span class="text-sm font-bold text-slate-600">{{ tab.label }}</span>
                                </button>
                            </div>

                            <div class="speech-bubble border border-slate-100 p-8 min-h-[350px]" :style="{ '--arrow-left': arrowPosition }">
                                <div v-show="currentTab === 'medical-history'">
                                    <div class="flex items-center justify-between mb-6">
                                        <h4 class="text-xl font-bold flex items-center gap-2 text-rose-600">
                                            <i class="fa-solid fa-heart-pulse"></i> 나의 진료 기록
                                        </h4>
                                        <span class="text-xs text-slate-400">최근 1년 기준</span>
                                    </div>
                                    <div class="space-y-4">
                                        <div v-if="medicalHistoryData.length === 0" class="text-center py-10 text-slate-400 text-sm">
                                            진료 기록이 없습니다.
                                        </div>
                                        <div v-else v-for="(item, index) in medicalHistoryData" :key="index" 
                                             class="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors">
                                            <div class="flex justify-between items-start mb-3">
                                                <div>
                                                    <span class="text-[10px] font-bold text-rose-500 bg-rose-100/50 px-2 py-1 rounded-md mr-2">{{ item.department }}</span>
                                                    <h5 class="inline font-bold text-slate-800">{{ item.hospital }}</h5>
                                                </div>
                                                <span class="text-xs text-slate-400 font-medium">{{ item.date }}</span>
                                            </div>
                                            <div class="grid grid-cols-2 gap-y-2 text-sm">
                                                <div class="text-slate-500">진단명</div>
                                                <div class="text-slate-800 font-medium">{{ item.diagnosis }}</div>
                                                <div class="text-slate-500">처방</div>
                                                <div class="text-slate-800 font-medium text-xs">{{ item.prescription }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-show="currentTab === 'prescriptions'">
                                    <h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-600">
                                        <i class="fa-solid fa-capsules"></i> 발행된 처방전
                                    </h4>
                                    <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                        <p class="text-slate-600 text-sm leading-relaxed">
                                            현재 보관된 처방전이 <strong class="text-indigo-600">{{ prescriptionsData.length }}건</strong> 있습니다.<br>
                                            약국 제출용 QR 코드를 확인하거나 PDF로 다운로드할 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                                <div v-show="currentTab === 'billing'">
                                    <h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-600">
                                        <i class="fa-solid fa-receipt"></i> 결제 내역
                                    </h4>
                                    
                                    <div v-if="!billingData || billingData.length === 0" class="text-slate-600 text-sm bg-slate-50 p-6 rounded-2xl text-center">
                                        최근 결제 내역이 없습니다.
                                    </div>
                                    
                                    <div v-else class="space-y-4">
                                        <div v-for="(bill, index) in billingData" :key="index" 
                                             class="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-emerald-200 transition-colors">
                                            
                                            <div>
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-[10px] font-bold text-emerald-500 bg-emerald-100/50 px-2 py-1 rounded-md">
                                                        {{ bill?.paymentStatus || '상태없음' }}
                                                    </span>
                                                    <span class="text-xs text-slate-400">{{ bill?.paymentMethod || '결제수단' }}</span>
                                                </div>
                                                <h5 class="font-bold text-slate-800">{{ bill?.paymentName || '예약금 결제' }}</h5>
                                                <p class="text-xs text-slate-500 mt-1">{{ bill?.paymentDate ? String(bill.paymentDate).substring(0, 10) : '날짜없음' }}</p>
                                            </div>
                                            
                                            <div class="text-right">
                                                <div class="text-lg font-black text-slate-900">{{ bill?.amount ? Number(bill.amount).toLocaleString() : 0 }}원</div>
                                                <button class="text-[10px] text-slate-400 underline hover:text-emerald-600 mt-1">영수증 보기</button>
                                            </div>
                                            
                                        </div>
                                    </div>
                                </div>
                                <div v-show="currentTab === 'results'">
                                    <h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-amber-600">
                                        <i class="fa-solid fa-chart-line"></i> 검사 결과 보고서
                                    </h4>
                                    <div v-if="!resultsData || resultsData.length === 0" class="text-slate-600 text-sm">최근 검사 결과가 없습니다.</div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="bg-white border border-slate-100 rounded-[32px] p-10 text-center space-y-4 shadow-sm">
                            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl">
                                <i class="fa-solid fa-lock"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900">로그인이 필요합니다</h4>
                                <p class="text-xs text-slate-500 mt-1">나의 진료 기록과 지갑 정보를 확인하려면 로그인해주세요.</p>
                            </div>
                            <button @click="router.push('/login')" class="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg cursor-pointer">
                                로그인 하러가기
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-lg font-bold mb-4 px-2 flex items-center justify-between">
                            <span>내 다음 병원 일정</span>
                            <a v-if="userInfo" href="#" class="text-xs text-slate-400 hover:text-indigo-600 transition">전체보기</a>
                        </h3>
                        
                        <div v-if="userInfo" class="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
                            <div v-if="hospitalSchedule.length === 0" class="text-center py-6 text-slate-400 text-sm">
                                확정된 예약 일정이 없습니다.
                            </div>

                            <div v-else v-for="(schedule, index) in hospitalSchedule" :key="index" 
                                 class="flex items-center gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div :class="['flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0', schedule.bgClass]">
                                    <span class="text-[10px] font-bold uppercase">{{ schedule.month }}</span>
                                    <span class="text-xl font-bold">{{ schedule.day }}</span>
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-slate-900">{{ schedule.hospital }}</h4>
                                    <p class="text-xs text-slate-500">{{ schedule.description }}</p>
                                </div>
                                <button @click="openDateModal(index)" class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer">
                                    <i class="fa-regular fa-calendar-check"></i>
                                </button>
                            </div>
                        </div>

                        <div v-else class="bg-white border border-slate-100 rounded-[32px] p-8 text-center space-y-3 shadow-sm">
                             <div class="text-slate-300 text-xl"><i class="fa-solid fa-calendar-xmark"></i></div>
                             <p class="text-sm font-bold text-slate-400">예약된 일정을 보려면 로그인해주세요.</p>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-lg font-bold mb-4 px-2">가족 구성원 관리</h3>
                        
                        <div v-if="userInfo" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="(member, index) in familyMembers" :key="index" 
                                 class="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition cursor-pointer group">
                                <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform', member.iconBg]">
                                    {{ member.icon }}
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <h4 class="font-bold text-slate-900">{{ member.name }}</h4>
                                        <span :class="['px-2 py-0.5 text-[10px] font-bold rounded-full', member.statusClass]">{{ member.status }}</span>
                                    </div>
                                    <p class="text-xs text-slate-500">{{ member.hospital }}</p>
                                </div>
                                <i class="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                            </div>

                            <button @click="openAddModal" 
                                class="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition min-h-[88px] cursor-pointer"
                            >
                                <i class="fa-solid fa-plus"></i>
                                <span class="text-sm font-bold">가족 추가하기</span>
                            </button>
                        </div>

                         <div v-else class="bg-white border border-slate-100 rounded-[32px] p-8 text-center space-y-3 shadow-sm">
                            <div class="text-slate-300 text-xl"><i class="fa-solid fa-users-slash"></i></div>
                             <p class="text-sm font-bold text-slate-400">가족 정보를 관리하려면 로그인해주세요.</p>
                        </div>

                        <div v-if="showDateModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
                            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showDateModal = false"></div>
                             <div class="relative bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
                                <h3 class="text-xl font-bold text-slate-900 mb-4 text-center">일정 변경</h3>
                                <div class="mb-6">
                                    <label class="block text-xs font-bold text-slate-500 mb-1 ml-2">날짜 선택</label>
                                    <input type="date" v-model="selectedDate" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-slate-800">
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <button @click="showDateModal = false" class="py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100">취소</button>
                                    <button @click="saveNewDate" class="py-3.5 rounded-xl font-bold text-white bg-indigo-600">변경하기</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
        
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeAddModal"></div>
            <div class="relative bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100">
                <button @click="closeAddModal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 text-2xl">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900">가족 구성원 추가</h3>
                    <p class="text-sm text-slate-500 mt-2">등록할 가족의 정보를 입력해주세요.</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1 ml-2">이름</label>
                        <input v-model="newMemberName" @keyup.enter="saveFamilyMember" type="text" placeholder="예: 홍길동" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-bold text-slate-800" autoFocus>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1 ml-2">나이</label>
                        <input v-model="newMemberName" @keyup.enter="saveFamilyMember" type="text" placeholder="예: 만 2세" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-bold text-slate-800" autoFocus>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1 ml-2">혈액형</label>
                        <input v-model="newMemberName" @keyup.enter="saveFamilyMember" type="text" placeholder="예: A형" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-bold text-slate-800" autoFocus>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1 ml-2">관계</label>
                        <input v-model="newMemberName" @keyup.enter="saveFamilyMember" type="text" placeholder="예: 어머니" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-bold text-slate-800" autoFocus>
                    </div>
                    <div class="grid grid-cols-2 gap-3 pt-2">
                        <button @click="closeAddModal" class="py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">취소</button>
                        <button @click="saveFamilyMember" class="py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">등록하기</button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
.speech-bubble {
    position: relative;
    background: white;
    border-radius: 2rem;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05));
    transition: all 0.3s ease;
}
.speech-bubble::before {
    content: '';
    position: absolute;
    top: -10px;
    left: var(--arrow-left, 12.5%);
    transform: translateX(-50%);
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid white;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.active-btn {
    border-color: currentColor !important;
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
}
</style>