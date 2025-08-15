// 將輸入字串進行清理，移除不必要的字元。
export const sanitize = (input: string): string => {
  return input
    .replace(/[`"*[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};
