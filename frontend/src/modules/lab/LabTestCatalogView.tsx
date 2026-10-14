import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../api/client';
import type { LabTestRecord } from '../../api/types/models';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { LabTestFullFormDisplay } from './LabTestFullFormDisplay';

export function LabTestCatalogView({ testId, highlighted }: { testId: number; highlighted?: boolean }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-test', testId],
    queryFn: async () => (await apiClient.get<LabTestRecord>(`/lab/tests/${testId}/`)).data,
  });

  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError || !data) {
    return <ErrorBlock message="Could not load test" />;
  }

  return (
    <div className="lab-catalog-view lab-test-catalog-view">
      <LabTestFullFormDisplay test={data} highlighted={highlighted} />
    </div>
  );
}
