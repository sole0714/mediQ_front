
import { ref } from 'vue'
import { defineStore } from 'pinia'
import userApi from '@/api/user' // profile api 사용

const useAuthStore = defineStore('auth', () => {
  const userInfo = ref(null) 
  const isLogin = ref(false)

  // 로그인 성공 시 (프론트엔드 메모리에만 저장)
  const login = (userData) => {
    isLogin.value = true
    userInfo.value = typeof userData === 'string' ? JSON.parse(userData) : userData;
  }

  // 새로고침 시 무조건 백엔드에 쿠키 던져서 물어보기
  const checkLogin = async () => {
    try {
      const res = await userApi.profile();
      // 백엔드가 "너 쿠키 정상이야!" 하고 정보를 주면 로그인 인정
      if (res.status === 200 && res.data.success) {
        isLogin.value = true;
        userInfo.value = res.data.result;
      }
    } catch (error) {
      // 401 에러 나면 쿠키 만료/없음 -> 깔끔하게 로그아웃 처리
      isLogin.value = false;
      userInfo.value = null;
    }
  }

const logout = async () => {
    try {
      // 백엔드에 '쿠키 수명 0으로 요청
      if (userApi.logout) await userApi.logout();
    } catch (error) {
      console.error('로그아웃 에러:', error);
    } finally {
      // 프론트엔드 메모리 비우기
      isLogin.value = false;
      userInfo.value = null;
      window.location.href = '/';
    }
  }

  const getUsername = () => {
    return userInfo.value?.name || '사용자'
  }

  return { isLogin, userInfo, checkLogin, login, logout, getUsername }
})

export default useAuthStore