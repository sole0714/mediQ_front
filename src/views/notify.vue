<script setup>
import { ref } from 'vue'
import axios from 'axios'

const userId = ref('')

const subscribePush = async () => {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log("권한 없음")

    return
  }
  await navigator.serviceWorker.register('/service-worker.js')
  const VAPID_PUBLIC_KEY = 'BEyaCMDqIkd76kJ-WmsXJd2eI2JQEt-Ilx3kzRF-4Sgzu0_2zZkVY3Iesc3DoL5FDZ2MkEGsMhYAA85Q92HvOcw'

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY

    })

    console.log(JSON.stringify(subscription))
    await axios.post(`http://localhost:8080/push/sub/${userId.value}`, subscription)
  }

}
</script>

<template>
  <input type="text" v-model="userId" placeholder="아이디입력">
  <button @click="subscribePush">알림 구독</button>

</template>

<style scoped></style>
