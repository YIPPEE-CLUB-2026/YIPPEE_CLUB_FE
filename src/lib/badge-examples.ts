// Display examples only, until the badge API is available.
export const badgeExampleProfiles = [
  { earned: [0, 1, 2, 3, 6, 10], representative: 1 },
  { earned: [0, 2, 4, 5, 7, 11, 13], representative: 5 },
  { earned: [0, 2, 3, 8, 9, 12, 13, 14], representative: 12 },
  { earned: [0, 1, 2, 4, 6], representative: 1 },
  { earned: [0, 2, 3, 5, 6, 7, 8, 10, 11], representative: 5 },
  { earned: [0, 2, 4, 7, 9, 10, 11, 12, 13, 14], representative: 12 },
] as const;

export function badgeExample(
  child: { id: number; name: string } | undefined,
  children: { id: number; name?: string }[],
): { earned: readonly number[]; representative: number | undefined } {
  if (!child || child.name.trim() === '오승주') return badgeExampleProfiles[0];
  if (child.name.trim() === '최율도') return badgeExampleProfiles[1];
  const otherChildren = children.filter((row) => {
    return !['오승주', '최율도'].includes(row.name?.trim() ?? '');
  });
  const index = Math.max(
    0,
    otherChildren.findIndex((row) => row.id === child.id),
  );
  return badgeExampleProfiles[2 + (index % (badgeExampleProfiles.length - 2))];
}
