import { parseKeywordRules } from './keywordMatcher';

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
}

function buildRule(raw = {}) {
  const groupName = String(raw.group_name || '').trim();
  const normalizedGroupName = normalizeText(groupName);
  const category = String(raw.category || '').trim() || '기타';
  const { includeKeywords } = parseKeywordRules(Array.isArray(raw.keywords) ? raw.keywords : []);

  return {
    category,
    normalizedGroupName,
    includeKeywords: includeKeywords.map((kw) => normalizeText(kw)).filter(Boolean),
  };
}

export function classifyCoupangCategoryByKeywordGroups(productName, keywordGroups = []) {
  const normalizedName = normalizeText(productName);
  if (!normalizedName) return null;

  let best = null;

  for (const raw of keywordGroups) {
    const rule = buildRule(raw);
    if (!rule.category || rule.category === '기타') continue;

    let score = 0;
    if (rule.normalizedGroupName && normalizedName.includes(rule.normalizedGroupName)) {
      score += 3;
    }

    const matchedKeywords = rule.includeKeywords.filter((kw) => kw && normalizedName.includes(kw));
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length;
    }

    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { category: rule.category, score };
    }
  }

  return best?.category || null;
}

