/**
 * Levenshtein Distance Algorithm
 * Calculates the number of single-character edits required to change one word into another.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Fuzzy Filter Utility
 * Ranks results based on distance.
 */
export function fuzzyMatch(query: string, target: string, threshold = 2): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // Standard include check first (instant)
  if (t.includes(q)) return true;
  
  // If no match, check distance
  const words = t.split(' ');
  return words.some(word => getLevenshteinDistance(q, word) <= threshold);
}
