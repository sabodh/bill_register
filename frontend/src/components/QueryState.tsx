import { Alert, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';

export function LoadingBlock() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <Spin size="large" />
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return <Alert type="error" showIcon message={message} />;
}

export function EmptyBlock({ description }: { description: string }) {
  return <Empty description={description} />;
}

export function QueryGate({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyDescription,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyDescription?: string;
  children: ReactNode;
}) {
  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError) {
    return <ErrorBlock message={errorMessage ?? 'Something went wrong'} />;
  }
  if (isEmpty) {
    return <EmptyBlock description={emptyDescription ?? 'No data'} />;
  }
  return children;
}
