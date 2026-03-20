import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from '@/stores/useAuthStore'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'home',
      path: '/',
      meta: { title: 'home' },
      component: () => import('@/views/user/HomeView.vue'),
    },
    {
      name: 'login',
      path: '/login', 
      meta: { title: '로그인' },
      component: () => import('@/views/user/Login.vue'),
    },
    {
      name: 'UserFindId',
      path: '/UserFindId',
      meta: { title: '아이디 찾기' },
      component: () => import('@/views/user/FindId.vue'),
    },
    {
      name: 'UserFindPassword',
      path: '/UserFindPassword',
      meta: { title: '비밀번호 찾기' },
      component: () => import('@/views/user/FindPassword.vue'),
    },
    {
      name: 'signup',
      path: '/signup',
      meta: { title: '회원가입' },
      component: () => import('@/views/user/Signup.vue'),
    },
    {
      name: 'HomeView',
      path: '/HomeView',
      meta: { title: 'MEDI-Q : 메인 페이지' },
      component: () => import('@/views/user/HomeView.vue'),
    },
    {
      name: 'Precheck',
      path: '/precheck',
      meta: { title: '문진표 작성 페이지', requiresAuth: true }, // 로그인 필요
      component: () => import('@/views/user/Precheck.vue'),
    },
    {
      name: 'Reservation',
      path: '/reservation',
      meta: { title: '병원 예약하기', requiresAuth: true }, // 로그인 필요
      component: () => import('@/views/user/Reservation.vue'),
    },
    {
      name: 'MyPage',
      path: '/mypage',
      meta: { title: '마이페이지', requiresAuth: true }, // 로그인 필요
      component: () => import('@/views/user/MyPage.vue'),
    },
    
    {
      name: 'notify',
      path: '/notify',
      meta: { title: '알림 등록' },
      component: () => import('@/views/notify.vue'),
    },
  ],
})

//  네비게이션 가드
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore();
    
    // 만약 새로고침해서 정보가 날아갔다면 백엔드에 쿠키 검증을 요청함
    if (!authStore.isLogin) {
      await authStore.checkLogin();
    }
    
    // 검증 후에도 로그인이 안 되어 있다면 튕겨냄
    if (!authStore.isLogin) {
      alert('로그인이 필요한 서비스입니다.');
      next('/login');
    } else {
      next(); // 쿠키 정상 통과
    }
  } else {
    next();
  }
})

export default router