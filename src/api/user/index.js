import api from '@/plugins/axiosinterceptor'

const login = async (req) => {
  const res = await api.post('/user/login', req)

  return res
}

const hospitalLogin = async (req) => {
  const res = await api.post('/hospitaluser/login', req)
  return res
}

const signup = async (req) => {
  const res = await api.post('/user/signup', req)

  return res
}

const hospitalSignup = async (req) => {
  const res = await api.post('/hospitaluser/signup', req)
  return res
}

const profile = async (req) => {
  const res = await api.get('/user/profile', {
    withCredentials: true,
  })

  return res
}

const logout = async () => {
  const res = await api.post('/user/logout')
  return res
}

const addfamily = async () => {
  const res = await api.post('/mypage/addfamily');
  return res
}
        

export default { login, hospitalLogin, hospitalSignup, signup, profile, logout, addfamily }
