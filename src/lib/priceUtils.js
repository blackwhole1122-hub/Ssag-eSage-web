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
// 가격 등급을 계산해주는 함수
export function calculateGrade(currentPrice, minPrice, avgPrice) {
  if (!currentPrice || !minPrice || !avgPrice) return '핫딜';
  if (currentPrice <= minPrice) return '역대급';
  if (currentPrice <= avgPrice * 0.95) return '대박';
  if (currentPrice <= avgPrice) return '중박';
  return '평범';
}