import styled from 'styled-components';

// ===== Styled Components ===== //

/* 디자이너 카드 컨테이너 */
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
`;

export const Div = styled.div`
    display: flex;
    align-items: center;
`;

/* 디자이너 이미지 */
export const DesignerImage = styled.img`
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

/* 디자이너 이름 */
export const DesignerName = styled.h3`
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    color: #000;
`;

/* 최대 할인율 텍스트 */
export const DiscountText = styled.p`
    font-size: 14px;
    color: #da2538;
    font-weight: 600;
    line-height: 14px;
`;

export const StyledSpan = styled.span`
    color: #000;
    font-size: 14px;
    line-height: 14px;
    font-weight: 500;
`;

export const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 16px;
`; 