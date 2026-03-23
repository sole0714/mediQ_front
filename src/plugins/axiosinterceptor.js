import axios from 'axios'
import router from '@/router'

const api = axios.create({
<<<<<<< HEAD
  baseURL: 'http://localhost:8080', 
=======
  baseURL: 'http://localhost:8080',
>>>>>>> origin/feat/queueSearch
  timeout: 5000,
  withCredentials: true 
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 로그인 확인용 API에서 난 401 에러는 무시합니다! (게스트 처리를 위해)
      if (error.config.url.includes('/user/profile')) {
        return Promise.reject(error);
      }

      // 그 외에 진짜 권한이 필요한 곳(예: 마이페이지 등)에서 401이 나면 튕겨냅니다.
      alert('세션이 만료되었거나 로그인이 필요합니다.');
      router.push('/login');
    }
    return Promise.reject(error)
  },
)

export default api