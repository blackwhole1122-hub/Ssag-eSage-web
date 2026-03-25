export const getUnitPrice = (item, productName = "") => {
  // 1. DB에 이미 계산된 단가가 있다면 그대로 사용 (우선순위)
  if (item.price_per_100ml) return { price: Number(item.price_per_100ml), label: "100ml당" };
  if (item.price_per_100g) return { price: Number(item.price_per_100g), label: "100g당" };

  // 2. 제목에서 정보 추출
  // (1) 수량 추출: 60캔, 24입 등
  const qtyMatch = productName.match(/(\d+)\s*(캔|개|입|팩|병|봉|세트)/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

  // (2) 개당 용량 추출: 210ml, 500g 등
  const volMatch = productName.match(/(\d+(?:\.\d+)?)\s*(ml|g|l|kg)/i);
  
  const priceNum = Number(item.price_raw?.replace(/[^0-9]/g, "")) || item.price_num || 0;
  if (priceNum === 0) return { price: 0, label: "가격미정" };

  // 3. 100ml(또는 100g)당 단가 계산 핵심 로직
  if (volMatch) {
    let unitVol = parseFloat(volMatch[1]);
    const unitStr = volMatch[2].toLowerCase();
    
    // kg나 l는 g나 ml로 단위 통일
    if (['kg', 'l'].includes(unitStr)) unitVol *= 1000;
    
    // 🔥 전체 용량 = 개당 용량(210) * 수량(60) = 12,600ml
    const totalVolume = unitVol * quantity;
    
    // 🔥 100ml당 가격 = (전체 가격 / 전체 용량) * 100
    const pricePer100 = (priceNum / totalVolume) * 100;
    
    const label = ['ml', 'l'].includes(unitStr) ? "100ml당" : "100g당";

    return { 
      price: pricePer100, 
      label: label 
    };
  }

  // 4. 용량 정보가 전혀 없을 경우에만 '개당'으로 리턴
  return { 
    price: priceNum / quantity, 
    label: quantity > 1 ? "1개당" : "개당" 
  };
};

/**
 * 등급 판독 로직 (기존과 동일)
 */
export function calculateGrade(currentPrice, minPrice, avgPrice) {
  if (!currentPrice || !minPrice || !avgPrice || currentPrice <= 0) return null;

  const ratio = currentPrice / avgPrice;

  if (currentPrice <= minPrice) return '역대급';
  if (ratio <= 0.90) return '대박';
  if (ratio <= 0.95) return '중박';
  if (ratio <= 1.05) return '평범';
  return '구매금지';
}