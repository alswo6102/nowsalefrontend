/**
 * 애플리케이션의 루트 컴포넌트
 * React Router를 사용한 라우팅과 인증 상태 관리
 * Zustand 스토어를 사용하여 전역 상태를 관리
 */

import './App.css';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPageApp from './pages/MainPageApp';
import useUserInfo from './hooks/user/useUserInfo';
import ShopDetailPage from './pages/ShopDetailPage';

import NoticePage from './pages/mypageDescription/NoticePage';
import FAQPage from './pages/mypageDescription/FAQPage';
import TermsPage from './pages/mypageDescription/TermsPage';
import GlobalStyle from './styles/GlobalStyle';

function App() {
  // useUserInfo에서 사용자 상태 가져오기
  const { authUser, logoutUser, refreshTokens, isTokenValid } = useUserInfo();

    useEffect(() => {
    const checkTokenAndRefresh = async () => {
        if (authUser && !isTokenValid()) {
        console.log('토큰 만료 5분 전, 자동 갱신 시도');
        const success = await refreshTokens();
        if (!success) {
            console.log('토큰 갱신 실패로 자동 로그아웃');
            alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
            logoutUser();
        }
        }
    };
    
    checkTokenAndRefresh();
    }, [authUser, isTokenValid, refreshTokens, logoutUser]);


  
  return (
    <>
      <GlobalStyle />
        <Router>
          <Routes>
            {/* 모든 페이지를 MainPageApp으로 통합 */}
            <Route path="/" element={<MainPageApp />} />
            {/* MainPageApp 세부 라우트들 */}
            <Route path="/favorites" element={<MainPageApp />} />
            <Route path="/history" element={<MainPageApp />} />
            <Route path="/mypage" element={<MainPageApp />} />
            <Route path="/search-address" element={<MainPageApp />} />
            <Route path="/login" element={<MainPageApp />} />
            { /* 가게 상세 페이지: 디자이너 유무에 따라 동적 렌더링 */}
            <Route path="/shop/:id" element={<ShopDetailPage />} />
            {/* 가게 상세 페이지 세부 라우트들 */}
            <Route path="/shop/:id/menu" element={<ShopDetailPage />} />
            <Route path="/shop/:id/spaces" element={<ShopDetailPage />} />
            <Route path="/shop/:id/space/:spaceId" element={<ShopDetailPage />} />
            <Route path="/shop/:id/reservation" element={<ShopDetailPage />} />
            <Route path="/shop/:id/reservation/agreement" element={<ShopDetailPage />} />
            {/* 마이페이지 관련 페이지들 */}
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
    </>
  );
}

export default App;
