/**
 * Generates a collision-resistant id without native crypto dependencies.
 * Sufficient for locally-created reminder records.
 */
export const generateId = (): string => {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
};
