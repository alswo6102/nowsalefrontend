import styled from 'styled-components';

// ===== Styled Components ===== //

/* 메뉴 카드 컨테이너 */
export const Card = styled.div`
    background: #fff;
    border-radius: 16px;
    border: 1px solid #CCC;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    background-color: #fff;
    border-color: #CCC;
`;

export const Div = styled.div`
    display: flex;
    align-items: center;
`;

/* 메뉴 이미지 */
export const MenuImage = styled.img`
  width: 68px;
  height: 68px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 10px;
  margin: 16px;
`;

export const Detail = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

/* 메뉴 이름 (긴 이름은 ... 처리) */
export const MenuName = styled.h3`
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    color: #000;
    overflow: hidden;
    text-overflow: ellipsis;
`;

/* 가격 정보 (할인율과 원래 가격) */
export const PriceInfo = styled.div`
    display: flex;
    gap: 2px;
    align-items: center;
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
`;

/* 할인율 표시 */
export const DiscountRate = styled.span`
    color: #f00;
    font-size: 12px;
`;

/* 원래 가격 (취소선 처리) */
export const OriginalPrice = styled.span`
    font-size: 12px;
    color: #737373;
    text-decoration: line-through;
`;

/* 할인 가격 */
export const DiscountPrice = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: #000;
    line-height: 14px;
`;

export const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 16px;
`; 