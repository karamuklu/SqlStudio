export function numericFilter(value: number, rawFilter: string): boolean {
  const filter = rawFilter.trim();
  if (!filter) return true;

  const match = filter.match(/^(>=|<=|>|<|=)?\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!match) return String(value).includes(filter);

  const operator = match[1] ?? "=";
  const target = Number(match[2].replace(",", "."));

  if (operator === ">") return value > target;
  if (operator === ">=") return value >= target;
  if (operator === "<") return value < target;
  if (operator === "<=") return value <= target;
  return value === target;
}
