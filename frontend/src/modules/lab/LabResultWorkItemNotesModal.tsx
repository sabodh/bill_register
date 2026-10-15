import { Input, Modal, Typography } from 'antd';

import type { LabResultWorkItem } from '../../api/types/models';

type LabResultWorkItemNotesModalProps = {
  open: boolean;
  item: LabResultWorkItem | null;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
};

export function LabResultWorkItemNotesModal({
  open,
  item,
  value,
  onChange,
  onClose,
}: LabResultWorkItemNotesModalProps) {
  const masterNotes = (item?.default_notes ?? []).filter((line) => line.trim());

  return (
    <Modal
      title={item ? `Interpretations — ${item.test_name}` : 'Interpretations'}
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Done"
      cancelButtonProps={{ style: { display: 'none' } }}
      destroyOnHidden
      width={680}
    >
      {masterNotes.length > 0 ? (
        <div className="lab-result-notes-modal-master">
          <Typography.Text type="secondary" className="lab-result-notes-modal-label">
            Test master interpretations (reference only)
          </Typography.Text>
          <ul className="lab-result-notes-modal-master-list">
            {masterNotes.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Typography.Text type="secondary" className="lab-result-notes-modal-label">
        Interpretation for this result
      </Typography.Text>
      <Typography.Paragraph type="secondary" className="lab-result-notes-modal-hint">
        Changes here apply only to this bill&apos;s result. They do not update the test master.
      </Typography.Paragraph>
      <Input.TextArea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Add interpretation text to print on this result when saved…"
        className="lab-result-notes-modal-textarea"
      />
    </Modal>
  );
}
