import { ArrowDownOutlined, ArrowUpOutlined, HolderOutlined } from '@ant-design/icons';
import { Button, Empty, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import type { DepartmentRecord, LabTestRecord, Paginated } from '../../api/types/models';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { reorderWorkItemKeys } from './labResultWorkOrder';

const NO_DEPT_KEY = 'none';

type DeptGroup = {
  key: string;
  departmentId: number | null;
  name: string;
  testIds: number[];
};

function buildGroups(
  departments: DepartmentRecord[],
  tests: LabTestRecord[],
): { departmentOrder: string[]; groups: Map<string, DeptGroup> } {
  const groups = new Map<string, DeptGroup>();
  for (const dept of departments) {
    groups.set(String(dept.id), {
      key: String(dept.id),
      departmentId: dept.id,
      name: dept.name,
      testIds: [],
    });
  }
  groups.set(NO_DEPT_KEY, {
    key: NO_DEPT_KEY,
    departmentId: null,
    name: 'No department',
    testIds: [],
  });

  const sortedTests = [...tests].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
  );
  for (const test of sortedTests) {
    const key = test.department != null ? String(test.department) : NO_DEPT_KEY;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        departmentId: test.department,
        name: test.department_detail?.name ?? 'Other',
        testIds: [],
      });
    }
    groups.get(key)!.testIds.push(test.id);
  }

  const departmentOrder = [
    ...departments.map((d) => String(d.id)),
    ...(groups.has(NO_DEPT_KEY) && groups.get(NO_DEPT_KEY)!.testIds.length > 0 ? [NO_DEPT_KEY] : []),
  ];
  for (const [key, group] of groups) {
    if (!departmentOrder.includes(key) && group.testIds.length > 0) {
      departmentOrder.push(key);
    }
  }

  return { departmentOrder, groups };
}

export function LabReportCatalogOrderPanel() {
  const queryClient = useQueryClient();
  const [departmentOrder, setDepartmentOrder] = useState<string[]>([]);
  const [groups, setGroups] = useState<Map<string, DeptGroup>>(new Map());
  const [dirty, setDirty] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ['lab', 'report-catalog-order'],
    queryFn: async () => {
      const [deptRes, testRes] = await Promise.all([
        apiClient.get<Paginated<DepartmentRecord>>('/lab/test-departments/', {
          params: { page_size: 500, ordering: 'sort_order' },
        }),
        apiClient.get<Paginated<LabTestRecord>>('/lab/tests/', {
          params: { page_size: 500, ordering: 'sort_order' },
        }),
      ]);
      return { departments: deptRes.data.results, tests: testRes.data.results };
    },
  });

  useEffect(() => {
    if (!catalogQuery.data) {
      return;
    }
    const built = buildGroups(catalogQuery.data.departments, catalogQuery.data.tests);
    setDepartmentOrder(built.departmentOrder);
    setGroups(built.groups);
    setDirty(false);
  }, [catalogQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const department_ids = departmentOrder
        .filter((key) => key !== NO_DEPT_KEY)
        .map((key) => Number.parseInt(key, 10))
        .filter((id) => !Number.isNaN(id));
      const test_ids: number[] = [];
      for (const key of departmentOrder) {
        const group = groups.get(key);
        if (group) {
          test_ids.push(...group.testIds);
        }
      }
      await apiClient.post('/lab/tests/save-report-catalog-order/', {
        department_ids,
        test_ids,
      });
    },
    onSuccess: async () => {
      message.success('Report order saved');
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ['lab', 'report-catalog-order'] });
      await queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
    },
    onError: (error) => message.error(apiErrorMessage(error, 'Could not save report order')),
  });

  const moveDepartment = (index: number, toIndex: number) => {
    setDepartmentOrder((prev) => reorderWorkItemKeys(prev, index, toIndex));
    setDirty(true);
  };

  const moveTest = (deptKey: string, fromIndex: number, toIndex: number) => {
    setGroups((prev) => {
      const next = new Map(prev);
      const group = next.get(deptKey);
      if (!group) {
        return prev;
      }
      next.set(deptKey, {
        ...group,
        testIds: reorderWorkItemKeys(group.testIds.map(String), fromIndex, toIndex).map((id) =>
          Number.parseInt(id, 10),
        ),
      });
      return next;
    });
    setDirty(true);
  };

  if (catalogQuery.isLoading) {
    return <LoadingBlock />;
  }
  if (catalogQuery.isError) {
    return <ErrorBlock message="Could not load catalog" />;
  }

  const totalTests = catalogQuery.data?.tests.length ?? 0;
  if (totalTests === 0) {
    return <Empty description="Add lab tests first, then arrange departments and order here." />;
  }

  return (
    <div className="lab-report-catalog-order">
      <Typography.Paragraph type="secondary" className="lab-report-catalog-order-intro">
        Set department section order (Hematology, Biochemistry, etc.) and test order within each
        section. This is the default layout for result entry and patient reports. You can still
        reorder tests on an individual bill when entering results.
      </Typography.Paragraph>
      <div className="lab-report-catalog-order-actions">
        <Button
          type="primary"
          disabled={!dirty}
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save report order
        </Button>
      </div>
      <div className="lab-report-catalog-order-sections">
        {departmentOrder.map((deptKey, deptIndex) => {
          const group = groups.get(deptKey);
          if (!group) {
            return null;
          }
          const testsById = new Map((catalogQuery.data?.tests ?? []).map((t) => [t.id, t]));
          return (
            <section key={deptKey} className="lab-report-catalog-order-section">
              <div className="lab-report-catalog-order-section-header">
                <Typography.Text strong>{group.name}</Typography.Text>
                <div className="lab-report-catalog-order-section-tools">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={deptIndex === 0}
                    aria-label="Move department up"
                    onClick={() => moveDepartment(deptIndex, deptIndex - 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={deptIndex === departmentOrder.length - 1}
                    aria-label="Move department down"
                    onClick={() => moveDepartment(deptIndex, deptIndex + 1)}
                  />
                </div>
              </div>
              {group.testIds.length === 0 ? (
                <Typography.Text type="secondary" className="lab-report-catalog-order-empty-dept">
                  No tests in this department.
                </Typography.Text>
              ) : (
                <ul className="lab-report-catalog-order-test-list">
                  {group.testIds.map((testId, testIndex) => {
                    const test = testsById.get(testId);
                    if (!test) {
                      return null;
                    }
                    return (
                      <li key={testId} className="lab-report-catalog-order-test-row">
                        <HolderOutlined className="lab-report-catalog-order-drag-icon" aria-hidden />
                        <Typography.Text
                          type="secondary"
                          className="lab-report-catalog-order-test-code"
                        >
                          {test.code?.trim() || '—'}
                        </Typography.Text>
                        <span className="lab-report-catalog-order-test-name">{test.name}</span>
                        <div className="lab-report-catalog-order-test-tools">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={testIndex === 0}
                            aria-label="Move test up"
                            onClick={() => moveTest(deptKey, testIndex, testIndex - 1)}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={testIndex === group.testIds.length - 1}
                            aria-label="Move test down"
                            onClick={() => moveTest(deptKey, testIndex, testIndex + 1)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
