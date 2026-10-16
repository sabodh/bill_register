import { useState } from 'react';
import { Button, Card, Modal, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { PageHeader } from '../../components/PageHeader';
import { LabResultPrintFormatPreviewModal } from './pdf/LabResultPrintFormatPreviewModal';
import { labResultPdfFontPresetLabel } from './pdf/labResultPdfFonts';
import {
  getLabResultPrintFormat,
  getStoredLabResultPrintFormatId,
  LAB_RESULT_PRINT_FORMATS,
  setStoredLabResultPrintFormatId,
  type LabResultPrintFormat,
} from './pdf/labResultPrintFormats';

export function LabResultPrintFormatsPage() {
  const [defaultFormatId, setDefaultFormatId] = useState(getStoredLabResultPrintFormatId);
  const [previewFormat, setPreviewFormat] = useState<LabResultPrintFormat | null>(null);

  const defaultFormat = getLabResultPrintFormat(defaultFormatId);

  const confirmSetDefault = (format: LabResultPrintFormat) => {
    Modal.confirm({
      title: 'Set default print format?',
      content: `Use "${format.label}" as the default when opening result report previews?`,
      okText: 'Set as default',
      cancelText: 'Cancel',
      onOk: () => {
        setStoredLabResultPrintFormatId(format.id);
        setDefaultFormatId(format.id);
      },
    });
  };

  const columns: ColumnsType<LabResultPrintFormat> = [
    {
      title: 'Format',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{label}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Font',
      key: 'font',
      width: 140,
      render: (_, row) => labResultPdfFontPresetLabel(row.renderOptions.fontPreset),
    },
    {
      title: 'Default',
      key: 'default',
      width: 100,
      render: (_, row) => (row.id === defaultFormatId ? <Tag color="blue">Default</Tag> : null),
    },
    {
      title: '',
      key: 'actions',
      width: 220,
      render: (_, row) => {
        const isDefault = row.id === defaultFormatId;
        return (
          <Space size="middle" wrap>
            <Button type="link" size="small" onClick={() => setPreviewFormat(row)}>
              Show preview
            </Button>
            {!isDefault ? (
              <Button type="link" size="small" onClick={() => confirmSetDefault(row)}>
                Set as default
              </Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Result print formats"
        breadcrumbs={[{ title: 'Lab' }, { title: 'Result print formats' }]}
      />
      <Card>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Use <Typography.Text strong>Set as default</Typography.Text> for which print format opens first
          after save. Font, text size, layout checkboxes, and fine-tuned pt sizes are also remembered in
          this browser and apply the next time you open any result preview. Use{' '}
          <Typography.Text strong>Show preview</Typography.Text> to try a format before setting it as
          default.
        </Typography.Paragraph>
        <Typography.Text>
          Current default: <Typography.Text strong>{defaultFormat.label}</Typography.Text>
        </Typography.Text>
        <Table
          style={{ marginTop: 16 }}
          rowKey="id"
          columns={columns}
          dataSource={LAB_RESULT_PRINT_FORMATS}
          pagination={false}
          size="middle"
        />
      </Card>

      <LabResultPrintFormatPreviewModal
        open={previewFormat != null}
        format={previewFormat}
        onClose={() => setPreviewFormat(null)}
      />
    </>
  );
}
