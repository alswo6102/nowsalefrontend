/**
 * 메뉴 정보를 표시하는 공통 카드 컴포넌트
 * 대표 메뉴와 다른 메뉴 목록에 모두 사용
 */

//import menuImage from '../../../../assets/images/menu.png';
import useStore from '../../../../hooks/store/useStore';
import ReservationButton from '../../../ui/ReservationButton/ReservationButton';
import { Card, Div, MenuImage, Detail, MenuName, PriceInfo, DiscountRate, OriginalPrice, DiscountPrice, ButtonContainer } from './MenuCard.styles';

/**
 * MenuCard 컴포넌트
 * @param {Object} menu - 메뉴 정보 객체
 * @param {string} menu.name - 메뉴 이름
 * @param {number} menu.discountRate - 할인율 (%)
 * @param {number} menu.originalPrice - 원래 가격
 * @param {number} menu.discountPrice - 할인 가격
 * @param {boolean} menu.isReserved - 예약 여부
 * @param {Function} onReserve - 예약 버튼 클릭 시 호출
 */

const MenuCard = ({ menu, onReserve = false }) => {
    const { startReservation, selectedDesigner } = useStore();

    // menu가 없거나 필수 필드가 없을 경우 처리
    if (!menu) {
        console.warn('MenuCard: menu prop이 없습니다.');
        return null;
    }

    const handleReserve = (e) => {
        e.stopPropagation();
        startReservation(menu, selectedDesigner);
        onReserve();
    };

    // 예약 페이지에서 메뉴 카드 속 '예약하기' 버튼 숨김
    const hideButton = window.location.pathname.includes('/reservation');

    // API 응답 구조에 맞게 필드 매핑
    const menuName = menu.menu_name || menu.name || '메뉴명 없음';
    const menuImage = menu.menu_image_url  || menu.menuImage || '이미지없음';
    const discountRate = menu.discount_rate || menu.discountRate || 0;
    const originalPrice = menu.menu_price || menu.originalPrice || 0;
    const discountPrice = menu.discounted_price || menu.discountPrice || 0;
    const isReserved = !menu.is_available || menu.isReserved || false;

    // 예약 불가능 상태에 따른 버튼 텍스트 결정
    const getButtonText = () => {
        if (isReserved) {
            return "예약 마감";
        }
        return "예약하기";
    };

    // 이미지 로드 실패 시 임시 이미지로 대체
    const handleImageError = (e) => {
        console.warn(`메뉴 이미지 로드 실패: ${menuName}, using fallback`);
        e.target.src = menu.menu_image_url;
        e.target.alt = '임시 메뉴 이미지';
    };

  return (
    <Card>
        <Div>
            <MenuImage 
                src={menuImage} 
                alt={menuName}
                onError={handleImageError}
            />
            <Detail>
                <MenuName isReservationPage={menu.isReservationPage}>
                    {menu.isReservationPage
                        ? menuName
                        : menuName.length > 13
                        ? `${menuName.slice(0, 13)}...`
                        : menuName}
                </MenuName>
                <PriceInfo>
                    <DiscountRate>{discountRate}%</DiscountRate>
                    <OriginalPrice>{originalPrice.toLocaleString()}원</OriginalPrice>
                </PriceInfo>
                <DiscountPrice>{discountPrice.toLocaleString()}원</DiscountPrice>
            </Detail>
        </Div>
        <ButtonContainer>
            {!hideButton && (
                <ReservationButton onClick={handleReserve} disabled={isReserved}>
                    {getButtonText()}
                </ReservationButton>
            )}
        </ButtonContainer>
    </Card>
  );
};

export default MenuCard; 