// Original Figma artwork, including the lettering (481:4973).
const artwork: Record<string, string> = {
  '그림/색칠': 'drawing',
  만들기: 'making',
  한글: 'korean',
  숫자: 'numbers',
  역할: 'roleplay',
  영어: 'english',
  음악: 'music',
  체육: 'sports',
};

export function PlayCategoryIcon({ category }: { category: string }) {
  return (
    <img
      className="play-category-artwork"
      src={`/assets/design/play-type-${artwork[category]}.png`}
      alt={category}
      width={307}
      height={300}
    />
  );
}
