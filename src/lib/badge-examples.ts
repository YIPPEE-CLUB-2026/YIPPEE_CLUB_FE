// 배지 API가 명세에 없으므로 획득 이력이나 대표 배지를 임의 생성하지 않습니다.
export function badgeExample(
  _child: { id: number; name: string } | undefined,
  _children: { id: number; name?: string }[],
): { earned: readonly number[]; representative: number | undefined } {
  return { earned: [], representative: undefined };
}
