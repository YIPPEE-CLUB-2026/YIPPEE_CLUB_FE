import type { Activity } from '../types';

export interface DemoActivity extends Activity {
  slug: string;
  previewImages?: [string, string];
  difficultyLabel?: string;
}

export const demoActivities: DemoActivity[] = [
  {
    id: -103,
    slug: 'lines',
    title: '실선이랑 점선이랑',
    subtitle: '신체&자연탐구',
    category: '탐구',
    price: 1900,
    duration: 30,
    durationMin: 30,
    durationMax: 30,
    difficulty: 'easy',
    ageYears: 3,
    ageMinMonths: 30,
    ageMaxMonths: 35,
    difficultyLabel: '하·중·상',
    description:
      '선의 생김새를 관찰하고 차이를 구분할 수 있어요. 손가락과 색연필로 선을 따라가고, 접거나 오리며 눈과 손의 협응과 소근육 조절 능력을 길러요.',
    materials: ['가위', '색연필'],
    developmentDomains: ['신체건강', '자연탐구'],
    previewImages: [
      '/activities/lines/activity-preview.png',
      '/activities/lines/guide-preview.png',
    ],
  },
  {
    id: -102,
    slug: 'puzzle',
    title: '나만의 퍼즐 만들기',
    subtitle: '신체&인지',
    category: '미술 놀이',
    price: 990,
    duration: 10,
    durationMin: 5,
    durationMax: 10,
    difficulty: 'easy',
    ageYears: 3,
    ageMinMonths: 36,
    ageMaxMonths: 47,
    description:
      '좋아하는 그림을 그리고 조각을 맞춰 나만의 퍼즐을 만들어요. 모양과 위치를 살펴보며 손의 움직임과 생각하는 힘을 길러요.',
    materials: ['색연필', '안전가위', '풀'],
    developmentDomains: ['신체', '인지'],
  },
  {
    id: -101,
    slug: 'transport',
    title: '어디서 탈까요?',
    subtitle: '관찰&정서',
    category: '탐구',
    price: 1900,
    duration: 10,
    durationMin: 5,
    durationMax: 10,
    difficulty: 'easy',
    ageYears: 3,
    ageMinMonths: 36,
    ageMaxMonths: 47,
    description:
      '자동차, 배, 비행기는 어디에서 움직일까요? 탈것과 어울리는 장소를 연결하며 관찰하고, 아이의 경험과 느낌을 함께 이야기해요.',
    materials: ['색연필', '풀'],
    developmentDomains: ['관찰', '정서'],
  },
];

export function demoActivityGuide(slug: string): string[] {
  if (slug === 'lines')
    return [
      '실선과 점선을 손가락으로 따라가요.',
      '색연필로 점선은 콕콕, 실선은 손 떼지 않고 그려요.',
      '점선은 접어 보고, 실선은 가위로 오려요.',
      '미로를 따라 아기 별이 엄마 별을 만날 수 있게 도와줘요.',
    ];
  return slug === 'transport'
    ? [
        '아이가 타 본 탈것을 함께 떠올려요.',
        '각 탈것이 움직이는 장소를 이야기해요.',
        '탈것과 어울리는 장소를 연결해요.',
        '가장 타 보고 싶은 탈것을 색칠하면 완성!',
      ]
    : [
        '좋아하는 그림을 자유롭게 그려요.',
        '보호자와 함께 그림을 조각으로 잘라요.',
        '모양과 위치를 살펴 퍼즐을 맞춰요.',
        '조각 수를 바꿔 한 번 더 도전해요.',
      ];
}
