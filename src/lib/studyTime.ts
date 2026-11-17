/** Estimates active study, including worked examples and practice, in five-minute steps. */
export function estimateStudyMinutes(text: string, objectives = 1, difficulty = 1, practiceMinutes = 10) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const displays = (text.match(/\$\$/g) || []).length / 2;
  return Math.max(
    10,
    Math.ceil((words / 120 + displays * 2 + objectives * 3 + difficulty * 4 + practiceMinutes) / 5) * 5
  );
}

export function formatStudyTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${minutes} min`;
}
