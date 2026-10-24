export function formatDuration(minutes: number, lang: string): string {
  const m = Math.max(0, Math.round(minutes));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const isAr = lang.startsWith('ar');

  if (hh === 0) {
    return isAr ? `${mm}د` : `${mm}m`;
  }
  if (mm === 0) {
    return isAr ? `${hh}س` : `${hh}h`;
  }
  return isAr ? `${hh}س ${mm}د` : `${hh}h ${mm}m`;
}
