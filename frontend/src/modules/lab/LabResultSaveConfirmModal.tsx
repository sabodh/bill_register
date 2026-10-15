import { Button, Modal, Typography } from 'antd';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type SaveConfirmFocus = 'cancel' | 'ok';

type LabResultSaveConfirmModalProps = {
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LabResultSaveConfirmModal({
  open,
  saving,
  onCancel,
  onConfirm,
}: LabResultSaveConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const [focusTarget, setFocusTarget] = useState<SaveConfirmFocus>('ok');

  useEffect(() => {
    if (!open) {
      return;
    }
    setFocusTarget('ok');
    const timer = window.setTimeout(() => okRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const focusButton = (target: SaveConfirmFocus) => {
    setFocusTarget(target);
    (target === 'ok' ? okRef : cancelRef).current?.focus();
  };

  const handleDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusButton('cancel');
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusButton('ok');
      return;
    }
    if (event.key === 'Enter' && !saving) {
      const active = document.activeElement;
      if (active === cancelRef.current) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (active === okRef.current) {
        event.preventDefault();
        onConfirm();
      }
    }
  };

  return (
    <Modal
      title="Save results?"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      footer={null}
      maskClosable={!saving}
      closable={!saving}
      keyboard
      modalRender={(node) => (
        <div className="lab-result-save-confirm-wrap" onKeyDown={handleDialogKeyDown}>
          {node}
        </div>
      )}
    >
      <p className="lab-result-save-confirm-message">
        You are on the last result field. Save this bill&apos;s results now?
      </p>
      <div className="lab-result-save-confirm-actions" role="group" aria-label="Save confirmation">
        <Button
          ref={cancelRef}
          disabled={saving}
          onClick={onCancel}
          className={focusTarget === 'cancel' ? 'lab-result-save-confirm-btn--focused' : undefined}
        >
          Not now
        </Button>
        <Button
          ref={okRef}
          type="primary"
          loading={saving}
          onClick={onConfirm}
          className={focusTarget === 'ok' ? 'lab-result-save-confirm-btn--focused' : undefined}
        >
          Save result
        </Button>
      </div>
      <Typography.Text type="secondary" className="lab-result-save-confirm-hint">
        Use ← → arrow keys to choose, Enter to confirm.
      </Typography.Text>
    </Modal>
  );
}
