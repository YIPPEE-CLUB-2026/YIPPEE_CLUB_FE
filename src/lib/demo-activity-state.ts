import { useState } from 'react';

interface DemoState {
  saved?: boolean;
  cart?: boolean;
}
const storageKey = 'yippee.demo.activities';

// Demo state is separate from real favourites, orders and payments.
export function useDemoActivityState(owner: number | undefined) {
  const [rows, setRows] = useState<Record<string, DemoState>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || '{}') || {};
    } catch {
      return {};
    }
  });
  const key = (slug: string) => `${owner ?? 'guest'}:${slug}`;
  const state = (slug: string) => rows[key(slug)] || {};
  function update(slug: string, values: DemoState) {
    setRows((previous) => {
      const next = {
        ...previous,
        [key(slug)]: { ...previous[key(slug)], ...values },
      };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* Keep current-tab state. */
      }
      return next;
    });
  }
  return { state, update };
}
