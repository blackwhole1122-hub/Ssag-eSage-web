const VALID_UNITS = new Set(['100g', '100ml', 'unit']);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const extractBasePrice = (item) => {
  return toNumber(item?.price_raw?.replace?.(/[^0-9]/g, '')) || toNumber(item?.price_num);
};

const extractQuantity = (productName = '') => {
  const qtyMatch = productName.match(/(\d+)\s*(캔|개|입|병|봉|팩|세트|박스|ea)/i);
  return qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
};

const extractVolume = (productName = '') => {
  const volMatch = productName.match(/(\d+(?:\.\d+)?)\s*(ml|g|l|kg)/i);
  if (!volMatch) return null;

  let unitVol = parseFloat(volMatch[1]);
  const unitStr = volMatch[2].toLowerCase();
  if (unitStr === 'kg' || unitStr === 'l') unitVol *= 1000;

  return { unitVol, unitStr };
};

const calculatePer100 = (priceNum, productName) => {
  const quantity = extractQuantity(productName);
  const volume = extractVolume(productName);
  if (!volume) return null;

  const totalVolume = volume.unitVol * Math.max(quantity, 1);
  if (totalVolume <= 0) return null;

  const pricePer100 = (priceNum / totalVolume) * 100;
  const label = volume.unitStr === 'ml' || volume.unitStr === 'l' ? '100ml당' : '100g당';
  return { price: pricePer100, label };
};

const unitLabel = (quantity) => (quantity > 1 ? '1개당' : '개당');

export const getUnitPrice = (item, productName = '', preferredUnit = null) => {
  const pref = VALID_UNITS.has(preferredUnit) ? preferredUnit : null;

  const db100ml = toNumber(item?.price_per_100ml);
  const db100g = toNumber(item?.price_per_100g);
  const dbPerUnit = toNumber(item?.price_per_unit);
  const priceNum = extractBasePrice(item);

  if (!priceNum && !db100ml && !db100g) {
    return { price: 0, label: '가격없음' };
  }

  if (pref === '100g') {
    if (db100g > 0) return { price: db100g, label: '100g당' };
    const calc = calculatePer100(priceNum, productName);
    return calc?.label === '100g당' ? calc : { price: 0, label: '100g당' };
  }

  if (pref === '100ml') {
    if (db100ml > 0) return { price: db100ml, label: '100ml당' };
    const calc = calculatePer100(priceNum, productName);
    return calc?.label === '100ml당' ? calc : { price: 0, label: '100ml당' };
  }

  if (pref === 'unit') {
    const quantity = extractQuantity(productName);
    return { price: priceNum > 0 ? priceNum / quantity : 0, label: unitLabel(quantity) };
  }

  if (db100ml > 0) return { price: db100ml, label: '100ml당' };
  if (db100g > 0) return { price: db100g, label: '100g당' };
  if (dbPerUnit > 0) {
    const quantity = extractQuantity(productName);
    return { price: dbPerUnit, label: unitLabel(quantity) };
  }

  const calc = calculatePer100(priceNum, productName);
  if (calc) return calc;

  const quantity = extractQuantity(productName);
  return { price: priceNum / quantity, label: unitLabel(quantity) };
};

export function calculateGrade(currentPrice, minPrice, avgPrice) {
  if (!currentPrice || !minPrice || !avgPrice || currentPrice <= 0) return null;

  const ratio = currentPrice / avgPrice;
  if (currentPrice <= minPrice) return '역대급';
  if (ratio <= 0.9) return '대박';
  if (ratio <= 0.95) return '중박';
  if (ratio <= 1.05) return '평범';
  return '구매금지';
}
