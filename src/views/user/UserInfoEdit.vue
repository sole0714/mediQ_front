<template>
  <div class="user-info-container">
    <h2>추가 의료 정보 관리</h2>
    <p class="description">원활한 병원 예약 및 진료를 위해 정확한 정보를 입력해 주세요.</p>

    <form @submit.prevent="saveUserInfo" class="info-form">
      
      <div class="form-group">
        <label for="age">나이</label>
        <input 
          type="number" 
          id="age" 
          v-model="userInfo.age" 
          placeholder="나이를 입력하세요 (예: 25)" 
          min="0"
          max="150"
        />
      </div>

      <div class="form-group">
        <label>성별</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="userInfo.gender" value="MALE" /> 남성
          </label>
          <label class="radio-label">
            <input type="radio" v-model="userInfo.gender" value="FEMALE" /> 여성
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="phoneNumber">전화번호</label>
        <input 
          type="tel" 
          id="phoneNumber" 
          v-model="userInfo.phoneNumber" 
          placeholder="010-0000-0000" 
        />
      </div>

      <div class="form-group">
        <label for="medicalHistory">기저질환 및 알러지</label>
        <textarea 
          id="medicalHistory" 
          v-model="userInfo.medicalHistory" 
          rows="5" 
          placeholder="앓고 있는 기저질환이나 약물/음식 알러지가 있다면 상세히 적어주세요. 없다면 '없음'으로 적어주세요."
        ></textarea>
      </div>

      <div class="button-group">
        <button type="button" class="cancel-button" @click="goBack">취소</button>
        <button type="submit" class="save-button">정보 저장하기</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// 폼에 바인딩할 데이터 객체
const userInfo = ref({
  age: null,
  gender: '',
  phoneNumber: '',
  medicalHistory: ''
});

// 백엔드 API 기본 주소 (환경에 맞게 수정)
const API_URL = 'http://localhost:8080/api/mypage/info';

/**
 * 1. 초기 데이터 불러오기 (GET)
 */
const fetchUserInfo = async () => {
  try {
    const response = await axios.get(API_URL, {
      withCredentials: true // JWT 쿠키 전송을 위해 필수
    });
    
    // BaseResponse 규격에 맞춰 result 안의 데이터를 꺼내옴
    if (response.data.success && response.data.result) {
      userInfo.value = response.data.result;
    }
  } catch (error) {
    console.error('사용자 정보를 불러오는데 실패했습니다.', error);
  }
};

/**
 * 2. 수정한 데이터 저장하기 (POST)
 */
const saveUserInfo = async () => {
  try {
    const response = await axios.post(API_URL, userInfo.value, {
      withCredentials: true
    });
    
    if (response.data.success) {
      alert(response.data.message || '의료 및 개인 정보가 성공적으로 업데이트되었습니다.');
      // router.push('/mypage') 대신 아래 코드로 변경!
      window.location.href = '/mypage'; 
    } else {
      alert('정보 저장에 실패했습니다: ' + response.data.message);
    }
  } catch (error) {
    console.error('정보 수정에 실패했습니다.', error);
    alert('정보 저장 중 오류가 발생했습니다.');
  }
};

/**
 * 3. 취소 버튼 클릭 시 마이페이지로 이동
 */
const goBack = () => {
  router.push('/mypage');
};

// 컴포넌트가 화면에 마운트될 때 자동으로 기존 데이터를 불러옵니다.
onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
/* 화면을 깔끔하게 보여주기 위한 기본 CSS */
.user-info-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.description {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 30px;
}

.info-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
}

input[type="number"],
input[type="tel"],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

textarea {
  resize: vertical;
}

.radio-group {
  display: flex;
  gap: 20px;
  padding: 10px 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
}

/* 버튼 그룹을 좌우로 배치 */
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.cancel-button {
  flex: 1; /* 버튼 너비 동일하게 */
  padding: 14px;
  background-color: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.save-button {
  flex: 2; /* 저장 버튼을 조금 더 넓게 */
  padding: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #45a049;
}
</style>