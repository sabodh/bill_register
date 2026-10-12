import { Button, Result } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

export class ErrorBoundary extends Component<
  Props,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error.message}
          extra={
            <Button type="primary" onClick={() => window.location.assign('/login')}>
              Go to login
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
