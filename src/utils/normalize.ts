// 將輸入字串標準化
export const normalize = (s?: string): string => {
  if (!s) return '';

  const trimmed = s.trim().toLowerCase();
  return trimmed
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ');
};
