const aliases: Record<string, string> = {
  '숫자': '수학', 'number': '수학', '역할': '역할놀이', 'role': '역할놀이',
  '그림/색칠': '미술놀이', 'painting': '미술놀이', '영어': '영어', 'english': '영어',
  'korean': '한글', 'craft': '만들기', '음악': '노래하고춤추기',
};
export function categoryKey(value: string) {
  const compact = value.replace(/\s/g, '');
  return aliases[compact] || compact;
}
export function categoryMatches(left: string, right: string) { return categoryKey(left) === categoryKey(right); }
