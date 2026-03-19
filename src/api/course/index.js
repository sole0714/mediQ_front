import api from '@/plugins/axiosinterceptor'

const list = async (req) => {
  const res = await api.get('/course/list.json', req)

  return res.data
}

export default { list }
