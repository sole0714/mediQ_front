import { createRouter, createWebHistory } from 'vue-router'

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
      meta: { title: '문진표 작성 페이지' },
      component: () => import('@/views/user/Precheck.vue'),
    },

    {
      name: 'Reservation',
      path: '/reservation',
      meta: { title: '병원 예약하기' },
      component: () => import('@/views/user/Reservation.vue'),
    },

    {
      name: 'MyPage',
      path: '/mypage',
      meta: { title: '마이페이지' },
      component: () => import('@/views/user/MyPage.vue'),
    },
  ],
})

export default router