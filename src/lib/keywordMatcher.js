function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
}

const VALID_UNITS = new Set(['100g', '100ml', 'unit']);

export function extractPreferredUnitFromKeywords(keywords = []) {
  for (const raw of keywords) {
    const token = String(raw || '').trim().toLowerCase();
    if (!token) continue;

    if (token.startsWith('@unit:')) {
      const unit = token.split(':')[1]?.trim();
      if (VALID_UNITS.has(unit)) return unit;
      continue;
    }
  }
  return null;
}

export function parseKeywordRules(keywords = []) {
  const includeKeywords = [];
  const excludeKeywords = [];

  for (const raw of keywords) {
    const token = String(raw || '').trim();
    if (!token) continue;
    if (token.startsWith('@unit:')) continue;

    if (token.startsWith('!') || token.startsWith('-')) {
      const normalized = normalizeText(token.slice(1));
      if (normalized) excludeKeywords.push(normalized);
      continue;
    }

    const normalized = normalizeText(token);
    if (normalized) includeKeywords.push(normalized);
  }

  return {
    includeKeywords: [...new Set(includeKeywords)],
    excludeKeywords: [...new Set(excludeKeywords)],
  };
}

export function matchesGroupByTitle(title, keywords = []) {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) return false;

  const { includeKeywords, excludeKeywords } = parseKeywordRules(keywords);

  if (excludeKeywords.some((kw) => normalizedTitle.includes(kw))) {
    return false;
  }

  if (includeKeywords.length === 0) {
    return true;
  }

  return includeKeywords.some((kw) => normalizedTitle.includes(kw));
}
