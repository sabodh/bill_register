import { Button, Divider, Empty, Typography, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, HolderOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/client';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import type {
  LabResultBillDetail,
  LabResultWorkItem,
  LabTestCategory,
} from '../../api/types/models';
import {
  BillVisitContextFields,
  billVisitContextFromDetail,
  billVisitContextToLabSessionPayload,
  defaultBillVisitContext,
  type BillVisitContextState,
} from '../../components/BillVisitContextFields';
import { ErrorBlock, LoadingBlock } from '../../components/QueryState';
import { LabTestResultEntryPreview } from './LabTestResultEntryPreview';
import {
  collectResultPayload,
  hydrateResultValuesFromBill,
  resultNoteValueKey,
  resultValueKey,
} from './labResultValues';
import { LabResultWorkItemNotesModal } from './LabResultWorkItemNotesModal';
import {
  reorderWorkItemKeys,
  workItemOrderFromItems,
  workItemOrderKey,
  workItemOrderPayload,
  workItemsInOrder,
} from './labResultWorkOrder';
import { focusFirstLabResultFieldWhenReady } from './labResultFieldFocus';
import { LabResultSaveConfirmModal } from './LabResultSaveConfirmModal';

type LabResultBillWorkspaceProps = {
  billId: number | null;
  onDirtyChange?: (dirty: boolean) => void;
  onBillNumberChange?: (billNumber: string) => void;
};

function snapshot(
  ctx: BillVisitContextState,
  values: Record<string, string>,
  workItemOrderKeys: string[],
): string {
  return JSON.stringify({
    ctx: billVisitContextToLabSessionPayload(ctx),
    values,
    workItemOrderKeys,
  });
}

export function LabResultBillWorkspace({
  billId,
  onDirtyChange,
  onBillNumberChange,
}: LabResultBillWorkspaceProps) {
  const queryClient = useQueryClient();
  const savedSnapshotRef = useRef<string>('');
  const hydratedBillId = useRef<number | null>(null);
  const onDirtyChangeRef = useRef(onDirtyChange);
  const onBillNumberChangeRef = useRef(onBillNumberChange);
  onDirtyChangeRef.current = onDirtyChange;
  onBillNumberChangeRef.current = onBillNumberChange;

  const [visitContext, setVisitContext] = useState<BillVisitContextState>(() => defaultBillVisitContext());
  const [resultValues, setResultValues] = useState<Record<string, string>>({});
  const [workItemOrderKeys, setWorkItemOrderKeys] = useState<string[]>([]);
  const [focusResultsToken, setFocusResultsToken] = useState(0);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['lab', 'result-bill', billId],
    enabled: billId != null,
    queryFn: async () =>
      (await apiClient.get<LabResultBillDetail>(`/lab/result-bills/${billId}/`)).data,
  });

  useEffect(() => {
    hydratedBillId.current = null;
    if (billId == null) {
      setVisitContext(defaultBillVisitContext());
      setResultValues({});
      setWorkItemOrderKeys([]);
      savedSnapshotRef.current = '';
      onDirtyChangeRef.current?.(false);
    }
  }, [billId]);

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail || detail.id !== billId) {
      return;
    }
    if (hydratedBillId.current !== detail.id) {
      hydratedBillId.current = detail.id;
      onBillNumberChangeRef.current?.(detail.bill_number);
      const ctx = billVisitContextFromDetail(detail);
      const values = hydrateResultValuesFromBill(detail);
      const orderKeys = workItemOrderFromItems(detail.work_items);
      setVisitContext(ctx);
      setResultValues(values);
      setWorkItemOrderKeys(orderKeys);
      savedSnapshotRef.current = snapshot(ctx, values, orderKeys);
      onDirtyChangeRef.current?.(false);
      setFocusResultsToken((token) => token + 1);
    }
  }, [detailQuery.data, billId]);

  useEffect(() => {
    if (focusResultsToken === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      focusFirstLabResultFieldWhenReady();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusResultsToken, billId]);

  const markDirtyIfNeeded = (
    nextCtx: BillVisitContextState,
    nextValues: Record<string, string>,
    nextOrderKeys: string[] = workItemOrderKeys,
  ) => {
    onDirtyChangeRef.current?.(
      snapshot(nextCtx, nextValues, nextOrderKeys) !== savedSnapshotRef.current,
    );
  };

  const orderedWorkItems = useMemo(() => {
    if (!detailQuery.data) {
      return [];
    }
    return workItemsInOrder(detailQuery.data.work_items, workItemOrderKeys);
  }, [detailQuery.data, workItemOrderKeys]);

  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      if (billId == null || !detailQuery.data) {
        throw new Error('No bill selected');
      }
      const payload = {
        ...billVisitContextToLabSessionPayload(visitContext),
        results: collectResultPayload(orderedWorkItems, resultValues),
        work_item_order: workItemOrderPayload(orderedWorkItems),
      };
      return (
        await apiClient.post<LabResultBillDetail>(
          `/lab/result-bills/${billId}/save-results/`,
          payload,
        )
      ).data;
    },
    onSuccess: (data) => {
      message.success('Results saved');
      const values = hydrateResultValuesFromBill(data);
      const ctx = billVisitContextFromDetail(data);
      const orderKeys = workItemOrderFromItems(data.work_items);
      setResultValues(values);
      setVisitContext(ctx);
      setWorkItemOrderKeys(orderKeys);
      savedSnapshotRef.current = snapshot(ctx, values, orderKeys);
      onDirtyChange?.(false);
      void queryClient.setQueryData(['lab', 'result-bill', data.id], data);
      void queryClient.invalidateQueries({ queryKey: ['lab', 'result-bills'] });
    },
    onError: (error) => message.error(apiErrorMessage(error, 'Could not save results')),
  });

  if (billId == null) {
    return (
      <Empty description="Choose a bill on the right to open it in this tab, or use + for another tab." />
    );
  }

  if (detailQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <ErrorBlock message="Could not load bill" />;
  }

  const bill = detailQuery.data;

  return (
    <>
      <div className="billing-form-section lab-results-visit-context">
        <Typography.Text strong className="billing-form-section-title">Visit details</Typography.Text>
        <BillVisitContextFields
          value={visitContext}
          onChange={(patch) => {
            setVisitContext((prev) => {
              const next = { ...prev, ...patch };
              markDirtyIfNeeded(next, resultValues);
              return next;
            });
          }}
        />
      </div>
      <Divider className="lab-results-section-divider" />
      <LabResultBillDetailPanel
        bill={bill}
        workItems={orderedWorkItems}
        resultValues={resultValues}
        onLastResultFieldEnter={() => {
          if (!saveResultsMutation.isPending) {
            setSaveConfirmOpen(true);
          }
        }}
        onResultValueChange={(billLineId, labTestId, resultKey, value) => {
          setResultValues((prev) => {
            const next = {
              ...prev,
              [resultValueKey(billLineId, labTestId, resultKey)]: value,
            };
            markDirtyIfNeeded(visitContext, next);
            return next;
          });
        }}
        onWorkItemOrderChange={(nextOrderKeys) => {
          setWorkItemOrderKeys(nextOrderKeys);
          markDirtyIfNeeded(visitContext, resultValues, nextOrderKeys);
        }}
      />
      <div className="lab-results-save-footer">
        <Button
          type="primary"
          size="large"
          loading={saveResultsMutation.isPending}
          onClick={() => saveResultsMutation.mutate()}
        >
          Save result
        </Button>
      </div>
      <LabResultSaveConfirmModal
        open={saveConfirmOpen}
        saving={saveResultsMutation.isPending}
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={() => {
          saveResultsMutation.mutate(undefined, {
            onSuccess: () => setSaveConfirmOpen(false),
          });
        }}
      />
    </>
  );
}

function LabResultBillDetailPanel({
  bill,
  workItems,
  resultValues,
  onResultValueChange,
  onWorkItemOrderChange,
  onLastResultFieldEnter,
}: {
  bill: LabResultBillDetail;
  workItems: LabResultWorkItem[];
  resultValues: Record<string, string>;
  onResultValueChange: (
    billLineId: number,
    labTestId: number,
    resultKey: string,
    value: string,
  ) => void;
  onWorkItemOrderChange: (orderKeys: string[]) => void;
  onLastResultFieldEnter?: () => void;
}) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const orderKeys = workItems.map(workItemOrderKey);

  const moveItem = (fromIndex: number, toIndex: number) => {
    onWorkItemOrderChange(reorderWorkItemKeys(orderKeys, fromIndex, toIndex));
  };
  const [notesModalItem, setNotesModalItem] = useState<LabResultWorkItem | null>(null);

  const valuesForWorkItem = (billLineId: number, labTestId: number) => {
    const prefix = `${billLineId}:${labTestId}:`;
    const scoped: Record<string, string> = {};
    for (const [key, value] of Object.entries(resultValues)) {
      if (key.startsWith(prefix)) {
        const resultKey = key.slice(prefix.length);
        if (resultKey === 'note') {
          continue;
        }
        scoped[resultKey] = value;
      }
    }
    return scoped;
  };

  const resultNoteForItem = (billLineId: number, labTestId: number) =>
    (resultValues[resultNoteValueKey(billLineId, labTestId)] ?? '').trim();

  return (
    <div className="lab-results-detail-panel">
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {bill.bill_number}
      </Typography.Title>
      {workItems.length === 0 ? (
        <Empty description="No lab tests on this bill" />
      ) : (
        <div className="lab-all-tests-scroll">
          {workItems.length > 1 ? (
            <Typography.Text type="secondary" className="lab-results-reorder-hint">
              Drag the handle or use the arrows to change test order on this result.
            </Typography.Text>
          ) : null}
          {workItems.map((item, index) => (
            <div
              key={`${item.bill_line_id}-${item.lab_test_id}`}
              className={`lab-test-full-form-card lab-test-full-form-card--reorderable${
                dragOverIndex === index ? ' lab-test-full-form-card--drag-over' : ''
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverIndex(index);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverIndex(null);
                const fromRaw = event.dataTransfer.getData('text/plain');
                const fromIndex = Number.parseInt(fromRaw, 10);
                if (!Number.isNaN(fromIndex)) {
                  moveItem(fromIndex, index);
                }
              }}
            >
              <div className="lab-results-test-top-toolbar">
                {workItems.length > 1 ? (
                  <div className="lab-results-test-reorder-toolbar">
                    <span
                      className="lab-results-drag-handle"
                      draggable
                      title="Drag to reorder"
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(index));
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDragOverIndex(null)}
                    >
                      <HolderOutlined />
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      aria-label="Move test up"
                      onClick={() => moveItem(index, index - 1)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === workItems.length - 1}
                      aria-label="Move test down"
                      onClick={() => moveItem(index, index + 1)}
                    />
                  </div>
                ) : (
                  <span />
                )}
                <Button
                  type="link"
                  size="small"
                  className={
                    resultNoteForItem(item.bill_line_id, item.lab_test_id)
                      ? 'lab-results-interpretations-link--filled'
                      : undefined
                  }
                  onClick={() => setNotesModalItem(item)}
                >
                  Interpretations
                </Button>
              </div>
              {item.from_package && item.package_name ? (
                <Typography.Text type="secondary" className="lab-results-package-tag">
                  Package: {item.package_name}
                </Typography.Text>
              ) : null}
              {item.result_entry_layout.layout === 'billing_only' ? (
                <Typography.Text>{item.test_name} (billing only)</Typography.Text>
              ) : (
                <LabTestResultEntryPreview
                  editable
                  layout={item.result_entry_layout}
                  testCategory={item.test_category as LabTestCategory}
                  title={item.test_name}
                  methodName={item.method_name}
                  departmentName={item.department_name}
                  patientGender={bill.patient_detail?.gender ?? null}
                  draftRanges={[]}
                  values={valuesForWorkItem(item.bill_line_id, item.lab_test_id)}
                  onValueChange={(resultKey, value) =>
                    onResultValueChange(item.bill_line_id, item.lab_test_id, resultKey, value)
                  }
                  onLastResultFieldEnter={onLastResultFieldEnter}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <LabResultWorkItemNotesModal
        open={notesModalItem != null}
        item={notesModalItem}
        value={
          notesModalItem
            ? (resultValues[resultNoteValueKey(notesModalItem.bill_line_id, notesModalItem.lab_test_id)] ??
              '')
            : ''
        }
        onChange={(text) => {
          if (!notesModalItem) {
            return;
          }
          onResultValueChange(
            notesModalItem.bill_line_id,
            notesModalItem.lab_test_id,
            'note',
            text,
          );
        }}
        onClose={() => setNotesModalItem(null)}
      />
    </div>
  );
}
