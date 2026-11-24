export interface NavigationEntry {
  key: string;
  path: string;
}
export type NavigationEntries = Record<number, NavigationEntry>;
const storageKey = 'yippee.navigation.entries';

export function readNavigation(): NavigationEntries {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}
export function recordNavigation(
  index: number,
  entry: NavigationEntry,
  action: string,
) {
  try {
    const entries = index === 0 ? {} : readNavigation();
    if (action === 'PUSH')
      for (const key of Object.keys(entries)) {
        if (Number(key) >= index) delete entries[Number(key)];
      }
    entries[index] = entry;
    sessionStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    /* 저장소를 사용할 수 없으면 화면별 기본 경로를 사용합니다. */
  }
}

function pathname(path: string) {
  return path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
}
function parentScreen(path: string): string | undefined {
  const activity = path.match(
    /^\/activities\/([^/]+)\/(reviews|record)(?:\/new)?$/,
  );
  if (activity)
    return activity[2] === 'record'
      ? '/saved'
      : path.endsWith('/new')
        ? `/activities/${activity[1]}/reviews`
        : `/activities/${activity[1]}`;
  const viewer = path.match(/^\/viewer\/([^/]+)$/);
  if (viewer) return `/activities/${viewer[1]}`;
  if (/^\/children\/.+/.test(path)) return '/children';
  if (/^\/settings\/.+/.test(path)) return '/settings';
  if (/^\/profile\/.+/.test(path)) return '/profile';
  if (/^\/cards\/.+/.test(path)) return '/cards';
  if (/^\/cash\/.+/.test(path)) return '/cash';
  if (/^\/coupons\/.+/.test(path)) return '/coupons';
  const order = path.match(/^\/orders\/([^/]+)(?:\/(cancel|receipt))?$/);
  if (order) return order[2] ? `/orders/${order[1]}` : '/orders';
  if (/^\/support\/inquiries\/.+/.test(path)) return '/support/inquiries';
  if (/^\/support\/.+/.test(path)) return '/support';
  if (/^\/notices\/.+/.test(path)) return '/notices';
  if (path === '/notices') return '/support';
  if (/^\/guides\/.+/.test(path)) return '/guides';
  if (/^\/activities\/.+/.test(path)) return '/activities';
  if (path === '/checkout' || path.startsWith('/checkout/')) return '/cart';
  if (path === '/signup/child' || path === '/login' || path === '/onboarding')
    return '/';
  if (
    [
      '/children',
      '/settings',
      '/cards',
      '/cash',
      '/coupons',
      '/points',
      '/orders',
      '/reports/growth',
      '/badges',
      '/support',
    ].includes(path)
  )
    return '/profile';
  return undefined;
}
function isChildScreen(candidate: string, current: string) {
  const visited = new Set<string>();
  let path = pathname(candidate);
  while (!visited.has(path)) {
    visited.add(path);
    const parent = parentScreen(path);
    if (!parent) return false;
    if (parent === current) return true;
    path = parent;
  }
  return false;
}

// 같은 화면이 중복된 이력은 건너뛰고, 확인되지 않은 이력 밖으로 나가지 않습니다.
export function backOffset(
  entries: NavigationEntries,
  index: number,
  current: NavigationEntry,
): number | null {
  if (
    !Number.isInteger(index) ||
    index < 1 ||
    entries[index]?.key !== current.key
  )
    return null;
  for (let previous = index - 1; previous >= 0; previous--) {
    const entry = entries[previous];
    if (!entry || !entry.path.startsWith('/') || entry.path.startsWith('//'))
      return null;
    // 목록으로 돌아온 뒤 그 목록의 입력·상세 화면을 다시 열지 않습니다.
    if (
      pathname(entry.path) !== pathname(current.path) &&
      !isChildScreen(entry.path, pathname(current.path))
    )
      return previous - index;
  }
  return null;
}
