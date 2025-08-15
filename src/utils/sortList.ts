export function sortList<T, U extends string | number>(
  list: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc',
  getValue?: (item: T) => U
): T[] {
  return [...list].sort((a, b) => {
    const aVal = getValue ? getValue(a) : (a[key] as U);
    const bVal = getValue ? getValue(b) : (b[key] as U);

    let result: number;
    if (typeof aVal === 'string' && typeof bVal === 'string') result = aVal.localeCompare(bVal);
    else if (typeof aVal === 'number' && typeof bVal === 'number') result = aVal - bVal;
    else result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;

    return order === 'asc' ? result : -result;
  });
}
