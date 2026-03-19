import api from '@/plugins/axiosinterceptor'

const login = async (req) => {
  const res = await api.post('/user/login', req)

  return res
}

const signup = async (req) => {
  const res = await api.post('/user/signup', req)

  return res
}

const profile = async (req) => {
  const res = await api.get('/user/profile', {
    withCredentials: true,
  })

  return res
}

export default { login, signup, profile }
