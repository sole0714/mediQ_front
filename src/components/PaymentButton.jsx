import React from 'react';
import * as PortOne from "@portone/browser-sdk/v2";
import axios from "axios";

// 부모 페이지에서 병원 번호(hospitalIdx)와 예약금(depositAmount)을 전달받습니다.
const PaymentButton = ({ hospitalIdx, depositAmount }) => {

    const handlePayment = async () => {
        try {
            // 1. 백엔드에 주문서 생성 요청 (쿠키 토큰을 보내기 위해 withCredentials 필수!)
            const createRes = await axios.post("http://localhost:8080/orders/create", {
                hospitalIdx: hospitalIdx
            }, { withCredentials: true });

            const ordersIdx = createRes.data.result.ordersIdx;
            const paymentId = `payment-${crypto.randomUUID()}`; 
            
            // 2. 포트원 결제창 띄우기
            const paymentResponse = await PortOne.requestPayment({
                storeId: "store-6a6cd778-6da3-441b-802b-7c280be780d3", // 포트원 관리자 페이지에서 복사
                channelKey: "channel-key-523a0e21-c106-41b7-a3ad-7d1132fcea03",      // 포트원 관리자 페이지에서 복사
                paymentId: paymentId,
                orderName: "메디큐 병원 예약금",
                totalAmount: depositAmount,      
                currency: "CURRENCY_KRW",
                payMethod: "CARD",               
                customData: {
                    ordersIdx: ordersIdx 
                }
            });

            if (paymentResponse.code !== undefined) {
                alert("결제 실패: " + paymentResponse.message);
                return;
            }

            // 3. 결제 성공 시 백엔드에 검증 요청
            await axios.post("http://localhost:8080/orders/verify", {
                paymentId: paymentResponse.paymentId
            }, { withCredentials: true });

            alert("예약금 결제가 완료되었습니다!");
            
            // 결제 완료 후 결제 내역 페이지(마이페이지)로 이동
            window.location.href = "/mypage/billing";

        } catch (error) {
            console.error(error);
            alert("결제 처리 중 오류가 발생했습니다. 로그인을 다시 확인해 주세요.");
        }
    };

    return (
        <button 
            onClick={handlePayment}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
        >
            예약금 결제하기 ({depositAmount}원)
        </button>
    );
};

export default PaymentButton;