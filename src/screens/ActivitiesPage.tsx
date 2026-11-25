import { useEffect } from 'react';
import { ActivityCatalog } from '../components/ActivityCatalog';
import { useAuth } from '../context/AuthContext';
import type { CatalogProps } from './HomePage';
export function ActivitiesPage(props: CatalogProps) {
  const { user, ready, requestLogin } = useAuth();
  useEffect(() => {
    if (ready && !user) requestLogin();
  }, [ready, user]);

  return <ActivityCatalog {...props} />;
}
