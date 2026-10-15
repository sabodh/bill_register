export const LAB_RESULT_FIELD_SELECTOR =
  '.billing-tab-panel:not([hidden]) .lab-results-detail-panel textarea.lab-result-preview-input:not([disabled])';

export function listLabResultFields(): HTMLTextAreaElement[] {
  return Array.from(document.querySelectorAll<HTMLTextAreaElement>(LAB_RESULT_FIELD_SELECTOR));
}

export function focusFirstLabResultField(): boolean {
  const first = listLabResultFields()[0];
  if (!first) {
    return false;
  }
  first.focus();
  const len = first.value.length;
  first.setSelectionRange(len, len);
  return true;
}

/** Focus first result field after the bill panel has painted (e.g. after selecting a bill). */
export function focusFirstLabResultFieldWhenReady(attemptsLeft = 8): void {
  if (focusFirstLabResultField()) {
    return;
  }
  if (attemptsLeft <= 0) {
    return;
  }
  window.setTimeout(() => focusFirstLabResultFieldWhenReady(attemptsLeft - 1), 50);
}

export function focusNextLabResultField(
  current: HTMLElement,
  onLastField?: () => void,
): void {
  const fields = listLabResultFields();
  const active =
    current instanceof HTMLTextAreaElement
      ? current
      : current.querySelector<HTMLTextAreaElement>('textarea.lab-result-preview-input');
  if (!active) {
    return;
  }
  const index = fields.indexOf(active);
  if (index < 0) {
    return;
  }
  if (index >= fields.length - 1) {
    onLastField?.();
    return;
  }
  const next = fields[index + 1];
  next.focus();
  const len = next.value.length;
  next.setSelectionRange(len, len);
}
