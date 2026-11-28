import { useEffect, useState } from 'react';
import { queryActivities, type Category } from '../services/activities';
import type { Filters } from './CatalogFilters';
import type { Activity } from '../types';

export function useCatalogQuery(filters: Filters, query: string, category: string, page: number, enabled = true) {
  const key = JSON.stringify([filters, query, category, page, enabled]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; results: Activity[]; categories: Category[]; count: number; loading: boolean; error: string }>({ key: '', results: [], categories: [], count: 0, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    if (!enabled) return () => controller.abort();
    setState(previous => ({ ...previous, key, results: [], count: 0, loading: true, error: '' }));
    const timer = setTimeout(() => {
      queryActivities(filters, query, category, page, controller.signal)
        .then(result => { if (!controller.signal.aborted) setState({ ...result, key, loading: false, error: '' }); })
        .catch(cause => { if (!controller.signal.aborted) setState(previous => ({ ...previous, key, loading: false, error: (cause as Error).message })); });
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, attempt]);
  return { ...state, results: state.key === key ? state.results : [], count: state.key === key ? state.count : 0, loading: enabled && (state.key !== key || state.loading), retry: () => setAttempt(value => value + 1) };
}
