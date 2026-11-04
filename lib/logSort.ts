export function sortLogsByQueue<T extends { createdAt?: string; _id: string }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    if (tA !== tB) return tA - tB;
    return a._id.localeCompare(b._id);
  });
}

export function sortLogsByCreatedDesc<T extends { createdAt?: string; _id: string }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    if (tB !== tA) return tB - tA;
    return b._id.localeCompare(a._id);
  });
}

export function sortLogsByRecent<T extends { updatedAt?: string; createdAt?: string; _id: string }>(
  logs: T[]
): T[] {
  return [...logs].sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (tB !== tA) return tB - tA;
    return b._id.localeCompare(a._id);
  });
}
