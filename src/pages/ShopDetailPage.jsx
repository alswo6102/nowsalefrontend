/**
 * 가게 상세 페이지 구현
 * 와이어프레임에 따라 두 가지 case를 처리:
 * 1. hasDesigners=true: 디자이너 목록 표시 후, 디자이너 선택 시 메뉴 표시
 * 2. hasDesigners=false: 바로 메뉴 표시
 * mockShopList.js의 STORES_DATA에서 데이터 동적 로드
 * 예약 페이지 및 개인정보 동의서 표시 추가
 */

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import useStore from '../hooks/store/useStore';
import useUserInfo from '../hooks/user/useUserInfo';
import MenuCard from '../components/sections/shop-detail/MenuCard/MenuCard';
import ShopInfo from '../components/sections/shop-detail/ShopInfo/ShopInfo';
import MenuList from '../components/sections/shop-detail/MenuList/MenuList';
import styled from 'styled-components';
import SpaceCard from '../components/sections/shop-detail/SpaceCard/SpaceCard';
import placeholderImage from "../assets/images/placeholder.svg";
import DesignerInfo from '../components/sections/shop-detail/DesignerInfo/DesignerInfo';
import ReservationPage from './ReservationPage';
import Layout from '../components/layout/Layout';
import TopNavBar from '../components/layout/TopNavBar/TopNavBar';
import Spinner from '../components/ui/Spinner/Spinner';
import { 
  fetchStoreSpacesCount, 
  fetchStoreMenus, 
  fetchStoreSpacesList, 
  fetchSpaceDetails,
  convertTimeToParam
} from '../apis/storeAPI';
import ScrollContainer from '../components/layout/ScrollContainer';

const ShopDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { 
        stores,
        time,
        selectedMenu,
        showPiAgreement,
        startReservation,
        cancelReservation,
        togglePiAgreement,
        toggleLikeWithAPI,
        restoreReservationState,
        fromFavoritePage,
        fromSchedulePage,
    } = useStore();

    const { accessToken } = useUserInfo();

    // URL에서 shop-detail 상태 파악 함수 추가
    const getShopDetailStateFromUrl = () => {
        const pathParts = location.pathname.split('/');
        const storeId = pathParts[2]; // /shop/:id
        
        if (pathParts.length === 3) {
            return { type: 'entry-point', storeId }; // 기본 진입점
        }
        if (pathParts.length === 4 && pathParts[3] === 'menu') {
            return { type: 'single-space-menu', storeId }; // Space가 1개인 메뉴 페이지
        }
        if (pathParts.length === 4 && pathParts[3] === 'spaces') {
            return { type: 'spaces-list', storeId }; // Space 목록 페이지
        }
        if (pathParts.length === 5 && pathParts[3] === 'space') {
            return { type: 'space-menu', storeId, spaceId: pathParts[4] }; // 특정 Space의 메뉴 페이지
        }
        if (pathParts.length === 4 && pathParts[3] === 'reservation') {
            return { type: 'reservation', storeId }; // 예약 페이지
        }
        if (pathParts.length === 5 && pathParts[3] === 'reservation' && pathParts[4] === 'agreement') {
            return { type: 'agreement', storeId }; // 개인정보 동의서 페이지
        }
        return { type: 'entry-point', storeId };
    };

    // 상태 관리
    const [storeData, setStoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceCount, setSpaceCount] = useState(null);
    const [selectedSpaceId, setSelectedSpaceId] = useState(null);
    
    // 브라우저 히스토리 상태 추적 함수
    const logHistoryState = (context = '') => {
        // localStorage 상태 확인
        const reservationData = localStorage.getItem('reservationData');
        if (reservationData) {
            try {
                const data = JSON.parse(reservationData);
            } catch (error) {
                console.log('localStorage 데이터 파싱 실패:', error);
            }
        }
    };
    
    // 이전 URL 추적을 위한 ref
    const previousPathnameRef = useRef(location.pathname);
    const isBackNavigationRef = useRef(false);
    const isNavigatingToHomeRef = useRef(false);

    // 브라우저 뒤로가기/앞으로가기 감지 및 상태 동기화
    useEffect(() => {
        const handlePopState = () => {
            // URL 상태에 따라 selectedSpaceId 동기화
            const urlState = getShopDetailStateFromUrl();
            
            // 데이터 로딩을 기다린 후 상태 변경 (즉시 변경하지 않음)
            if (urlState.type === 'space-menu' && urlState.spaceId) {
                if (selectedSpaceId !== urlState.spaceId) {
                    // Space 상세 페이지로 이동하는 경우는 즉시 변경
                    setSelectedSpaceId(urlState.spaceId);
                }
            }
            // Space 목록으로 이동하는 경우는 데이터 로딩 후 변경하도록 제거
            
            // 브라우저 뒤로가기로 entry-point 상태가 되었을 때
            if (urlState.type === 'entry-point') {
                // 홈페이지로 이동 중임을 표시
                isNavigatingToHomeRef.current = true;
                
                // 출발 페이지에 따라 조건부 처리
                if (fromFavoritePage) {
                    // 찜페이지에서 온 경우 찜페이지로 이동
                    console.log(fromFavoritePage, "체크건");
                    setTimeout(() => {
                        navigate('/favorites', { replace: true });
                    }, 50);
                } 
                else if (fromSchedulePage) {
                    // 일정페이지에서 온 경우 일정페이지로 이동
                    setTimeout(() => {
                        navigate('/history', { replace: true });
                    }, 50);
                } 
                else {
                    // 다른 페이지에서 온 경우 홈페이지로 이동
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 50);
                }
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate, fromFavoritePage, fromSchedulePage]); // fromFavoritePage, fromSchedulePage 의존성 추가

    // URL 변경 감지 및 브라우저 뒤로가기 처리
    useEffect(() => {
        
        // URL이 변경되었을 때
        if (previousPathnameRef.current !== location.pathname) {
            const urlState = getShopDetailStateFromUrl();
            
            // URL 기반으로 showPiAgreement 상태 동기화 (브라우저 뒤로가기/앞으로가기 시에만)
            if (urlState.type === 'agreement') {
                if (!showPiAgreement) {
                    console.log('🔍 브라우저 네비게이션 - showPiAgreement true로 설정');
                    togglePiAgreement();
                }
            } else if (showPiAgreement) {
                console.log('🔍 브라우저 네비게이션 - showPiAgreement false로 설정');
                togglePiAgreement();
            }
            
            // Space 목록 페이지에서 entry-point로 이동한 경우 (브라우저 뒤로가기로 추정)
            if (previousPathnameRef.current.includes('/spaces') && urlState.type === 'entry-point') {
                // 홈페이지로 이동 중임을 표시
                isNavigatingToHomeRef.current = true;
                
                // 출발 페이지에 따라 조건부 처리
                if (fromFavoritePage) {
                    setTimeout(() => {
                        navigate('/favorites', { replace: true });
                    }, 50);
                } 
                // 출발 페이지에 따라 조건부 처리
                if (fromSchedulePage) {
                    setTimeout(() => {
                        navigate('/history', { replace: true });
                    }, 50);
                } 
                else {
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 50);
                }
            }
            
            // 단일 메뉴 페이지에서 entry-point로 이동한 경우 (브라우저 뒤로가기로 추정)
            if (previousPathnameRef.current.includes('/menu') && urlState.type === 'entry-point') {
                // 홈페이지로 이동 중임을 표시
                isNavigatingToHomeRef.current = true;
                
                // 출발 페이지에 따라 조건부 처리
                if (fromFavoritePage) {
                    setTimeout(() => {
                        navigate('/favorites', { replace: true });
                    }, 50);
                } 
                // 출발 페이지에 따라 조건부 처리
                if (fromSchedulePage) {
                    setTimeout(() => {
                        navigate('/history', { replace: true });
                    }, 50);
                } 
                else {
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 50);
                }
            }
            
            // Space 메뉴 페이지에서 예약 페이지로 이동한 경우 (앞으로가기)
            if (previousPathnameRef.current.includes('/space/') && urlState.type === 'reservation') {
                // selectedMenu가 없으면 복원 시도
                if (!selectedMenu) {
                    const restored = restoreReservationState();
                    if (!restored) {
                        console.log('예약 상태 복원 실패 - Space 메뉴 페이지로 리다이렉트');
                        setTimeout(() => {
                            navigate(`/shop/${id}/space/${selectedSpaceId}`, { replace: true });
                        }, 100);
                    }
                } else {
                    console.log('selectedMenu가 있음');
                }
            }
            
            // 단일 메뉴 페이지에서 예약 페이지로 이동한 경우 (앞으로가기)
            if (previousPathnameRef.current.includes('/menu') && urlState.type === 'reservation') {
                // selectedMenu가 없으면 복원 시도
                if (!selectedMenu) {
                    const restored = restoreReservationState();
                    if (!restored) {
                        console.log('예약 상태 복원 실패 - 단일 메뉴 페이지로 리다이렉트');
                        setTimeout(() => {
                            navigate(`/shop/${id}/menu`, { replace: true });
                        }, 100);
                    }
                }
            }
            
            // 예약 페이지로 이동하는 경우 (앞으로가기)
        if (urlState.type === 'reservation') {
            // selectedMenu가 없는데 예약 페이지로 이동하려는 경우
            if (!selectedMenu) {
                // localStorage에서 예약 상태 복원 시도
                const restored = restoreReservationState();
                if (restored) {
                    // 복원 후 히스토리 상태 재추적
                    setTimeout(() => {
                        logHistoryState('예약 상태 복원 후');
                    }, 100);
                } else {
                    // 예약 상태 복원이 실패한 경우 Space 목록으로 리다이렉트
                    setTimeout(() => {
                        const storeId = urlState.storeId;
                        if (spaceCount >= 2) {
                            navigate(`/shop/${storeId}/spaces`, { replace: true });
                        } else {
                            navigate(`/shop/${storeId}/menu`, { replace: true });
                        }
                    }, 100);
                    return;
                }
            }
        }
            // 이전 URL 업데이트
            previousPathnameRef.current = location.pathname;
        }
    }, [location.pathname, navigate, selectedSpaceId, storeData, fromFavoritePage, fromSchedulePage]);

    // 현재 가게의 Zustand 상태에서 좋아요 상태 가져오기
    const currentStore = stores.find(store => store.id === parseInt(id));
    const isLiked = currentStore?.isLiked || false;

    // 현재 시간과 메뉴 시간 비교 (이전 시간대는 예약 불가능)
    const isTimeExpired = () => {
        if (!time) {
            return false;
        }
        
        const currentHour = new Date().getHours();
        const menuHour = convertTimeToParam(time);
        
        return menuHour < currentHour;
    };

    // 초기 데이터 로드
    useEffect(() => {
        const loadStoreData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const storeId = parseInt(id);
                const urlState = getShopDetailStateFromUrl();
                console.log('🔍 loadStoreData 시작 - URL 상태:', urlState);
                
                // 1. Space 개수 조회
                const spacesData = await fetchStoreSpacesCount(storeId);
                setSpaceCount(spacesData.count);
                console.log('🔍 Space 개수:', spacesData.count);
                
                const timeParam = convertTimeToParam(time);
                
                if (spacesData.count === 1) {
                    // Space가 1개인 경우
                    if (urlState.type === 'entry-point') {
                        // /shop/:id로 접근한 경우
                        
                        // 홈페이지로 이동 중인지 확인
                        if (isNavigatingToHomeRef.current) {
                            isNavigatingToHomeRef.current = false; // 플래그 초기화
                            return;
                        }
                        
                        // 일반적인 entry-point 접근인 경우
                        navigate(`/shop/${storeId}/menu`);
                    } else if (urlState.type === 'single-space-menu') {
                        // /shop/:id/menu로 접근한 경우 - 정상 처리
                        try {
                            const menuData = await fetchStoreMenus(storeId, timeParam, accessToken);
                            setStoreData(menuData);
                        } catch (error) {
                            setError(error.message || '메뉴 조회에 실패했습니다.');
                        }
                    } else if (urlState.type === 'reservation') {
                        // /shop/:id/reservation으로 접근한 경우 - 예약 상태 복원 후 데이터 로드

                        // localStorage에서 예약 상태 복원 시도
                        const restored = restoreReservationState();
                        if (!restored) {
                            setTimeout(() => {
                                navigate(`/shop/${storeId}/menu`, { replace: true });
                            }, 100);
                            return;
                        }
                        
                        // 예약 상태가 복원되었거나 이미 예약 중인 경우 데이터 로드
                        if (!storeData) {
                            try {
                                const menuData = await fetchStoreMenus(storeId, timeParam, accessToken);
                                setStoreData(menuData);
                            } catch (error) {
                                setError(error.message || '메뉴 조회에 실패했습니다.');
                            }
                        }
                    } else {
                        // 다른 URL로 접근한 경우 - /shop/:id/menu로 리다이렉트
                        navigate(`/shop/${storeId}/menu`);
                    }
                } else if (spacesData.count >= 2) {
                    // Space가 2개 이상인 경우
                    if (urlState.type === 'entry-point') {
                        // /shop/:id로 접근한 경우
                        
                        // 홈페이지로 이동 중인지 확인
                        if (isNavigatingToHomeRef.current) {
                            isNavigatingToHomeRef.current = false; // 플래그 초기화
                            return;
                        }
                        
                        // 일반적인 entry-point 접근인 경우 /shop/:id/spaces로 리다이렉트
                        navigate(`/shop/${storeId}/spaces`);
                    } else if (urlState.type === 'spaces-list') {
                        // /shop/:id/spaces로 접근한 경우 - 정상 처리
                        const spacesListData = await fetchStoreSpacesList(storeId, timeParam, accessToken);
                        
                        // 각 Space의 메뉴 정보를 확인하여 is_possible 계산
                        const spacesWithCorrectedInfo = spacesListData.spaces.map(space => {
                            
                                                         // 시간 만료 체크
                              const timeExpired = isTimeExpired();
                            
                            // 해당 Space의 메뉴들 중 하나라도 예약 불가능한지 확인
                            const hasUnavailableMenu = space.menus && space.menus.some(menu => !menu.is_available);
                            
                            // 최종 is_possible 계산
                            const finalIsPossible = space.is_possible && !timeExpired && !hasUnavailableMenu;
                            
                            return {
                                ...space,
                                is_possible: finalIsPossible
                            };
                        });
                        
                        // 수정된 Space 목록으로 storeData 설정
                        setStoreData({
                            ...spacesListData,
                            spaces: spacesWithCorrectedInfo
                        });
                        
                        // 데이터 로딩 완료 후 selectedSpaceId를 null로 설정
                        setSelectedSpaceId(null);
                    } else if (urlState.type === 'space-menu') {
                        // /shop/:id/space/:spaceId로 접근한 경우 - 정상 처리
                        const spaceData = await fetchSpaceDetails(urlState.spaceId, timeParam, accessToken);
                        setStoreData(spaceData);
                        setSelectedSpaceId(urlState.spaceId);
                    } else if (urlState.type === 'reservation') {
                        // /shop/:id/reservation으로 접근한 경우 - 예약 상태 복원 후 데이터 로드
                        // 새로고침으로 인한 상태 초기화 확인
                            
                            // localStorage에서 예약 상태 복원 시도
                            const restored = restoreReservationState();
                            if (restored) {
                                const { selectedMenu } = useStore.getState();
                                if (selectedMenu && selectedMenu.space_id) {
                                    const spaceData = await fetchSpaceDetails(selectedMenu.space_id, timeParam, accessToken);
                                    setStoreData(spaceData);
                                    setSelectedSpaceId(selectedMenu.space_id);
                                } else {
                                    const spacesListData = await fetchStoreSpacesList(storeId, timeParam, accessToken);
                                    setStoreData(spacesListData);
                                }
                                return;
                            } else {
                                setTimeout(() => {
                                    navigate(`/shop/${storeId}/spaces`, { replace: true });
                                }, 100);
                                return;
                            }
                    } else if (urlState.type === 'agreement') {
                        // /shop/:id/reservation/agreement로 접근한 경우 - 예약 상태 복원 후 데이터 로드
                        console.log('🔍 Agreement URL 감지됨:', urlState);
                        
                        // loadStoreData에서는 showPiAgreement 상태 변경하지 않음 (의존성 배열에서 제거했으므로)
                        
                        const restored = restoreReservationState();
                        console.log('🔍 예약 상태 복원 결과:', restored);
                        if (restored) {
                            const { selectedMenu } = useStore.getState();
                            console.log('🔍 selectedMenu:', selectedMenu);
                            if (selectedMenu && selectedMenu.space_id) {
                                console.log('🔍 Space ID로 데이터 로드:', selectedMenu.space_id);
                                const spaceData = await fetchSpaceDetails(selectedMenu.space_id, timeParam, accessToken);
                                setStoreData(spaceData);
                                setSelectedSpaceId(selectedMenu.space_id);
                            } else {
                                console.log('🔍 예약 페이지용 메뉴 데이터 로드');
                                const menuData = await fetchStoreMenus(storeId, timeParam, accessToken);
                                setStoreData(menuData);
                            }
                            console.log('🔍 Agreement 데이터 로드 완료');
                            return;
                        } else {
                            console.log('🔍 예약 상태 복원 실패 - spaces로 리다이렉트');
                            setTimeout(() => {
                                navigate(`/shop/${storeId}/spaces`, { replace: true });
                            }, 100);
                            return;
                        }
                    } else {
                        // 다른 URL로 접근한 경우 - /shop/:id/spaces로 리다이렉트
                        console.log('🔍 알 수 없는 URL 상태 - spaces로 리다이렉트:', urlState);
                        navigate(`/shop/${storeId}/spaces`);
                    }
                }
                
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id && time !== null) {
            loadStoreData();
        }
    }, [id, time, accessToken, location.pathname, navigate, fromFavoritePage, fromSchedulePage]); // showPiAgreement 제거

    // 특정 Space 선택 시 상세 데이터 로드
    const handleSpaceSelect = async (spaceId) => {
        // 이동할 URL 생성
        const targetUrl = `/shop/${id}/space/${spaceId}`;
        // URL 변경으로 Space 선택
        navigate(targetUrl);
    };

    // 좋아요 토글 처리 - Zustand 스토어만 업데이트
    const handleLikeToggle = async () => {
        if (!storeData) return;
        
        try {
            await toggleLikeWithAPI(parseInt(id));
            // API 재호출 제거 - Zustand 스토어가 자동으로 상태를 업데이트함
        } catch (error) {
            console.error('좋아요 토글 실패', error);
        }
    };

    // 이미지 처리 함수
    const getImageSrc = (imageUrl) => {
        
        if (imageUrl && imageUrl !== '') {
            return imageUrl;
        }
        // 이미지가 없을 경우 기본 이미지 사용
        return placeholderImage;
    };

    // 대표 메뉴 선택 (최대 할인율 기준)
    const getFeaturedMenu = () => {
        
        if (!storeData || !storeData.menus) {
            return null;
        }
        
        const featured = storeData.menus.reduce((prev, curr) => 
            prev.discount_rate > curr.discount_rate ? prev : curr
        );
        return featured;
    };

    // 나머지 메뉴 목록
    const getOtherMenus = () => {
        if (!storeData || !storeData.menus) {
            return [];
        }
        
        const featured = getFeaturedMenu();
        if (!featured) {
            return storeData.menus;
        }
        
        const otherMenus = storeData.menus.filter(menu => menu.menu_id !== featured.menu_id);
        return otherMenus;
    };

    // 뒤로 가기 처리 (URL 기반 네비게이션)
    const handleBack = () => {
        const urlState = getShopDetailStateFromUrl();
        
        if (urlState.type === 'agreement') {
            togglePiAgreement(); // false로 설정
            navigate(`/shop/${id}/reservation`)
        } else if (urlState.type === 'reservation') {
            // 예약 페이지에서 뒤로가기: 메뉴 페이지로
            //cancelReservation(); // 예약 상태 초기화
            
            if (spaceCount >= 2 && selectedSpaceId) {
                navigate(`/shop/${id}/space/${selectedSpaceId}`);
            } else if (spaceCount === 1) {
                navigate(`/shop/${id}/menu`);
            } else {
                navigate(`/shop/${id}/spaces`);
            }
        } else if (spaceCount >= 2 && selectedSpaceId) {
            // 특정 Space 메뉴 페이지에서 뒤로가기: Space 목록으로
            setSelectedSpaceId(null);
            navigate(`/shop/${id}/spaces`);
        } else if (spaceCount >= 2 && !selectedSpaceId) {
            if (fromFavoritePage) {
                // 찜페이지에서 온 경우 찜페이지로 이동
                navigate('/favorites');
            }
            else if (fromSchedulePage) {
                // 스케줄 페이지에서 온 경우 스케줄 페이지로 이동
                navigate('/history');
            }
            else navigate('/');

        } else if (spaceCount === 1) {
            // 출발 페이지에 따라 조건부 처리
            if (fromFavoritePage) {
                // 찜페이지에서 온 경우 찜페이지로 이동
                navigate('/favorites');
            }
            else if (fromSchedulePage) {
                // 스케줄 페이지에서 온 경우 스케줄 페이지로 이동
                navigate('/history');
            }
            else navigate('/');
        } else {
                // 기본: 브라우저 히스토리 뒤로가기
                navigate(-1);
        }
    };

    // 예약 버튼 클릭 시
    const handleReserve = (menu) => {
        
        // 기존 예약 상태 초기화 후 새로운 예약 시작
        cancelReservation();
        startReservation(menu, null);
        
        // 예약 페이지로 URL 변경
        navigate(`/shop/${id}/reservation`);
    };

    // Space 선택 (디자이너 선택과 동일한 역할)
    const handleSelectSpace = (spaceId) => {
        handleSpaceSelect(spaceId);
    };

    // 대표 메뉴 이름 (전문 분야로 사용)
    const getSpecialty = () => {
        const featured = getFeaturedMenu();
        
        if (featured) {
            const specialty = `${featured.menu_name}`;
            return specialty;
        }
        return 'N/A';
    };

    // 페이지 제목 결정
    const getPageTitle = () => {
        const urlState = getShopDetailStateFromUrl();
        
        if (urlState.type === 'agreement') {
            return '개인정보 제3자 제공 동의서';
        }
        if (urlState.type === 'reservation') {
            return '예약하기';
        }
        if (spaceCount >= 2 && selectedSpaceId && storeData) {
            // Space 상세 페이지인 경우
            if (storeData.space_name) {
                const title = `${storeData.store_name} / ${storeData.space_name}`;
                return title;
            } else {
                // space_name이 없는 경우 (Space 목록 데이터에서 특정 Space 찾기)
                const selectedSpace = storeData.spaces?.find(space => space.space_id === parseInt(selectedSpaceId));
                if (selectedSpace) {
                    const title = `${storeData.store_name} / ${selectedSpace.space_name}`;
                    return title;
                } else {
                    return storeData.store_name;
                }
            }
        }
        if (storeData) {
            return storeData.store_name;
        }
        return '가게 상세';
    };

  return (
    <Layout currentPage="shop-detail">
        <PageContainer>
            {/* 네브 바 영역 */}
            <NavBarContainer>
                {(() => {
                    console.log('🔍 렌더링 조건 확인 - showPiAgreement:', showPiAgreement);
                    console.log('🔍 렌더링 조건 확인 - location.pathname:', location.pathname);
                    console.log('🔍 렌더링 조건 확인 - urlState.type:', getShopDetailStateFromUrl().type);
                    return (
                        <TopNavBar
                            onBack={handleBack}
                            title={getPageTitle()}
                            showLike={!location.pathname.includes('/reservation') && !showPiAgreement && !(spaceCount >= 2 && selectedSpaceId)}
                            storeId={parseInt(id)}
                            isLiked={isLiked}
                            onLikeToggle={handleLikeToggle}
                        />
                    );
                })()}
            </NavBarContainer>
    
            <ScrollContainer offsettop={72}>
                {/* 콘텐츠 영역 */}
                <ContentContainer>
                    {loading ? (
                        <LoadingContainer>
                            <Spinner />
                        </LoadingContainer>
                    ) : error ? (
                        <ErrorContainer>
                            <ErrorText>데이터를 불러오는데 실패했습니다.</ErrorText>
                            <ErrorSubText>{error}</ErrorSubText>
                        </ErrorContainer>
                    ) : location.pathname.includes('/reservation') ? (
                        <ReservationPage shop={storeData} />
                    ) : (
                        <>
                        {/* Space가 1개이거나(메뉴목록) Space space 화면일 때(디자이너목록)만 이미지 표시 */}
                        {(spaceCount === 1 || (spaceCount >= 2 && !selectedSpaceId)) && !location.pathname.includes('/reservation') ? (
                            <IntroductionSection>
                                {(() => {
                                    const imageUrl = getImageSrc(storeData?.store_image_url || storeData?.space_image_url);
                                    const imageAlt = storeData?.store_name || storeData?.space_name;
                                    
                                    return (
                                        <ShopImage 
                                            src={imageUrl} 
                                            alt={imageAlt}
                                            onError={(e) => {
                                                console.warn('가게 이미지 로드 실패, placeholder 이미지로 대체');
                                                e.target.src = placeholderImage;
                                            }}
                                        />
                                    );
                                })()}
                                <ShopInfo
                                    name={storeData?.store_name}
                                    address={storeData?.store_address}
                                    distance={`${storeData?.distance}m`}
                                    reservationTime={`${time} 예약`}
                                    walkTime={storeData?.on_foot}
                                />
                            </IntroductionSection>
                        ) : null}
                        
                        {/* Space가 1개인 경우: 가게 정보 표시 */}
                        {spaceCount === 1 ? (
                            <></>
                        ) : spaceCount >= 2 && selectedSpaceId ? (
                            /* Space 상세 화면: Space 정보 표시 */
                            <DesignerInfo
                                name={storeData?.space_name}
                                specialty={`${getSpecialty()} 전문`}
                                reservationTime={`${time} 방문`}
                                designerImage={storeData?.space_image_url}
                            />
                        ) : null}
                        
                        {/* Space가 2개 이상인 경우 */}
                        {spaceCount >= 2 ? (
                            !selectedSpaceId && storeData?.spaces ? (
                                /* Space 목록 화면 */
                                <>
                                    <Line />
                                    <DesignerSection>
                                        {storeData.spaces.map(space => (
                                            <SpaceCard
                                                key={space.space_id}
                                                space={{
                                                    id: space.space_id,
                                                    name: space.space_name,
                                                    image: space.space_image_url,
                                                    maxDiscountRate: space.max_discount_rate,
                                                    isPossible: space.is_possible
                                                }}
                                                onSelect={handleSelectSpace}
                                            />
                                        ))}
                                    </DesignerSection>
                                </>
                            ) : selectedSpaceId && storeData?.menus ? (
                                /* Space 상세 화면: 메뉴 목록 */
                                (() => {
                                    const featuredMenu = getFeaturedMenu();
                                    const otherMenus = getOtherMenus();
                                    return (
                                        <>
                                            <Line />
                                            <MenuSection>
                                                <SectionTitle>가장 할인율이 큰 대표 메뉴!</SectionTitle>
                                                {featuredMenu ? (
                                                    <MenuCard
                                                        menu={featuredMenu}
                                                        onReserve={() => handleReserve(featuredMenu)}
                                                    />
                                                ) : (
                                                    <div>메뉴를 불러오는 중...</div>
                                                )}
                                            </MenuSection>
                                            <Line />
                                            <MenuSection>
                                                <SectionTitle>다른 할인 메뉴</SectionTitle>
                                                <MenuList menus={otherMenus} onReserve={handleReserve} />
                                            </MenuSection>
                                        </>
                                    );
                                })()
                            ) : (
                                /* 로딩 상태 */
                                <LoadingContainer>
                                    <Spinner />
                                </LoadingContainer>
                            )
                        ) : (
                            /* Space가 1개인 경우: 바로 메뉴 목록 */
                            (() => {
                                const featuredMenu = getFeaturedMenu();
                                const otherMenus = getOtherMenus();
                                return (
                                    <>
                                        <Line />
                                        <MenuSection>
                                            <SectionTitle>가장 할인율이 큰 대표 메뉴!</SectionTitle>
                                            {featuredMenu ? (
                                                <MenuCard
                                                    menu={featuredMenu}
                                                    onReserve={() => handleReserve(featuredMenu)}
                                                />
                                            ) : (
                                                <div>메뉴를 불러오는 중...</div>
                                            )}
                                        </MenuSection>
                                        <Line />
                                        <MenuSection>
                                            <SectionTitle>다른 할인 메뉴</SectionTitle>
                                            <MenuList menus={otherMenus} onReserve={handleReserve} />
                                        </MenuSection>
                                    </>
                                );
                            })()
                        )}
                    </>
                )}
                </ContentContainer>
            </ScrollContainer>
        </PageContainer>
    </Layout>
  );
};

export default ShopDetailPage;

// ===== Styled Components ===== //

/* 페이지 전체 컨테이너 */
const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100vh;
    background: #fff;
`;

/* 네브 바 영역 */
const NavBarContainer = styled.div`
`;

/* 콘텐츠 영역 (스크롤 가능) */
const ContentContainer = styled.div`
    overflow-y: visible;
    position: relative;
    min-height: calc(100vh - 72px);
`;

/* 가게 이미지 */
const ShopImage = styled.img`
    width: 100%;
    height: 120px;
    padding: 0 16px;
    object-fit: cover;
    opacity: 0.65;
`;

const IntroductionSection = styled.div`
    display: flex;
    flex-direction: column;
`;

/* 디자이너 선택 섹션 */
const DesignerSection = styled.div`
    padding: 16px 16px 0px 16px;
`;

/* 섹션 제목 (대표 메뉴, 다른 메뉴) */
const SectionTitle = styled.h2`
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    color: #000;
    margin-bottom: 8px;
`;

/* 메뉴 섹션 */
const MenuSection = styled.div`
    padding: 12px 16px 0px 16px;
`;

/* 구분선 */
const Line = styled.div`
    width: 100% - 32px;
    height: 1px;
    background: #e2e4e9;
    margin: 0px 16px;
`;

/* 로딩 컨테이너 */
const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
`;

/* 에러 컨테이너 */
const ErrorContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 200px;
    text-align: center;
`;

const ErrorText = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
`;

const ErrorSubText = styled.div`
    font-size: 14px;
    color: #999;
`;