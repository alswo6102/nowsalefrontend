// 예약 관련 API 함수들
const REST_API_BASE_URL = 'https://buynow2.o-r.kr';

/**
 * 사용자의 예약 목록 조회
 * @param {string} accessToken - 액세스 토큰
 * @returns {Promise<Array>} 예약 목록
 */
export const fetchUserReservations = async (accessToken) => {
  try {
    console.log('사용자 예약 목록 조회 시작...');
    
    const response = await fetch(`${REST_API_BASE_URL}/v1/reservations/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('사용자 예약 목록 조회 성공:', data.length, '개');
    
    return data;
  } catch (error) {
    console.error('사용자 예약 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 예약 취소
 * @param {number} reservationId - 예약 ID
 * @param {string} accessToken - 액세스 토큰
 * @returns {Promise<Object>} 취소 응답
 */
export const cancelReservation = async (reservationId, accessToken) => {
  try {
    console.log('예약 취소 시작...', reservationId);
    
    const response = await fetch(`${REST_API_BASE_URL}/v1/reservations/${reservationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // 구체적인 에러 처리
      switch (response.status) {
        case 400:
          if (errorData.errorCode === 'CANCELLATION_NOT_ALLOWED') {
            throw new Error('예약시간이 만료됐습니다');
          }
          throw new Error(errorData.message || '예약 취소에 실패했습니다.');
        case 403:
          throw new Error('본인의 예약만 취소할 수 있습니다.');
        case 404:
          throw new Error('예약을 찾을 수 없습니다.');
        case 401:
          throw new Error('인증이 필요합니다.');
        default:
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    }

    // 204 No Content 응답 처리
    if (response.status === 204) {
      console.log('예약 취소 성공 (204 No Content)');
      return { success: true, message: '예약이 성공적으로 취소되었습니다.' };
    }

    // JSON 응답이 있는 경우
    const data = await response.json();
    console.log('예약 취소 성공:', data);
    
    return data;
  } catch (error) {
    console.error('예약 취소 실패:', error);
    throw error;
  }
}; 
