import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKeys?: any[];
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  private prevKeys: any[] = [];

  constructor(props: Props) {
    super(props);
    this.prevKeys = props.resetKeys || [];
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  public componentDidUpdate() {
    const { resetKeys = [] } = this.props;
    
    // Check if any reset keys have changed
    if (this.state.hasError && resetKeys.length > 0) {
      const hasKeyChanged = resetKeys.some(
        (key, index) => key !== this.prevKeys[index]
      );

      if (hasKeyChanged) {
        this.handleReset();
      }
    }

    this.prevKeys = resetKeys;
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unknown error occurred';

    // Handle map initialization error specifically
    if (error.message.includes('Map container is already initialized')) {
      return 'Map failed to initialize properly. This can happen during page refresh.';
    }

    return error.message;
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600">
            {this.getErrorMessage(this.state.error)}
          </p>
          <button
            className="mt-2 px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-100"
            onClick={this.handleReset}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}