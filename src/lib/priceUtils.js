export const getUnitPrice = (item, productName = "") => {
  if (item.price_per_100g) return { price: Number(item.price_per_100g), label: "100g당" };
  if (item.price_per_100ml) return { price: Number(item.price_per_100ml), label: "100ml당" };
  if (item.price_per_unit) return { price: Number(item.price_per_unit), label: "단위당" };

  // 데이터가 없을 때만 무게 추출 산식 사용
  const weightMatch = productName.match(/(\d+(?:\.\d+)?)\s*(g|ml|kg|l)/i);
  let weight = 100;
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]);
    if (['kg', 'l'].includes(weightMatch[2].toLowerCase())) weight *= 1000;
  }
  
  const priceNum = Number(item.price_raw?.replace(/[^0-9]/g, "")) || item.price_num || 0;
  return { price: (priceNum / weight) * 100, label: "100g당" };
};

/**
 * 2. 통합 등급 판별 로직 (킴님의 1.03 오차범위 적용)
 */
export const calculateGrade = (currentUnitPrice, minUnitPrice, avgUnitPrice) => {
  if (!currentUnitPrice || currentUnitPrice <= 0) return "평범";

  // 1순위: 역대급 (역대 최저 단가의 1.03배 이하)
  if (minUnitPrice > 0 && currentUnitPrice <= minUnitPrice * 1.03) {
    return "역대급";
  }

  // 2순위: 대박 (3개월 평균 단가의 90% 이하)
  if (avgUnitPrice > 0 && currentUnitPrice <= avgUnitPrice * 0.90) {
    return "대박";
  }

  // 3순위: 중박 (3개월 평균 단가의 95% 이하)
  if (avgUnitPrice > 0 && currentUnitPrice <= avgUnitPrice * 0.95) {
    return "중박";
  }

  return "평범";
};