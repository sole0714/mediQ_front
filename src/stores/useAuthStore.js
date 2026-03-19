import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/user'

const useAuthStore = defineStore('auth', () => {
  const userInfo = ref(null) 
  const isLogin = ref(false)

  const login = (userString) => {
    isLogin.value = true
    localStorage.setItem('USERINFO', userString) 
    try {
      userInfo.value = JSON.parse(userString)
    } catch (e) {
      console.error('파싱 에러', e)
    }
  }

  const checkLogin = () => {
    //  1. 소셜 로그인 토큰 낚아채기
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      try {
        const base64Url = urlToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);

        const socialUser = {
          idx: payload.idx,
          email: payload.email,
          // 카카오 이름이 없으면 '카카오유저'로 강제 세팅
          name: payload.name || '카카오유저', 
          role: payload.role
        };

        localStorage.setItem('USERINFO', JSON.stringify(socialUser));
        localStorage.setItem('ATOKEN', urlToken); 
        document.cookie = `ATOKEN=${urlToken}; path=/; max-age=86400;`;
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('토큰 변환 에러', error);
      }
    }

    //  2. 로컬스토리지 확인해서 로그인 상태 유지
    const storedUser = localStorage.getItem('USERINFO');
    if (storedUser) {
      isLogin.value = true;
      try {
        userInfo.value = JSON.parse(storedUser);
      } catch (e) {
        userInfo.value = null;
      }
    } else {
      isLogin.value = false;
    }
    
    return isLogin.value;
  }

  const logout = async () => {
    try {
      if (api.logout) await api.logout();
    } catch (error) {
      console.error('로그아웃 에러:', error);
    } finally {
      localStorage.removeItem('USERINFO');
      localStorage.removeItem('ATOKEN'); 
      document.cookie = "ATOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      isLogin.value = false;
      userInfo.value = null;
    }
  }

  const getUsername = () => {
    // 💡 백엔드가 주는 'name'을 제일 먼저 찾도록 수정했습니다!
    if (userInfo.value?.name) return userInfo.value.name;
    
    const stored = localStorage.getItem('USERINFO')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // 로컬스토리지에서도 'name'을 가장 먼저 찾습니다.
        return parsed.name || parsed.userName || parsed.username || '사용자';
      } catch (e) {}
    }
    return '사용자'
  }

  return { isLogin, userInfo, checkLogin, login, logout, getUsername }
})

export default useAuthStore