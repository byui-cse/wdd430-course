const STORAGE_KEY = "wdd430_semester";

export type SemesterOption = {
  code: string;
  label: string;
};

function getSeasonCode(monthIndex: number) {
  if (monthIndex <= 3) return "W";
  if (monthIndex <= 7) return "S";
  return "F";
}

export function getCurrentSemesterCode(date = new Date()) {
  const season = getSeasonCode(date.getMonth());
  const yearCode = String(date.getFullYear()).slice(-2);
  return `${season}${yearCode}`;
}

export function getSemesterOptions(rangeYears = 4) {
  const now = new Date();
  const startYear = now.getFullYear() - 1;

  /** @type {SemesterOption[]} */
  const options: SemesterOption[] = [];
  for (let year = startYear; year < startYear + rangeYears; year += 1) {
    const yearCode = String(year).slice(-2);
    options.push(
      { code: `W${yearCode}`, label: `Winter ${year}` },
      { code: `S${yearCode}`, label: `Spring ${year}` },
      { code: `F${yearCode}`, label: `Fall ${year}` }
    );
  }

  return options.reverse();
}

export function getStoredSemesterCode() {
  if (typeof window === "undefined") return getCurrentSemesterCode();
  return localStorage.getItem(STORAGE_KEY) || getCurrentSemesterCode();
}

export function storeSemesterCode(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, code);
}
