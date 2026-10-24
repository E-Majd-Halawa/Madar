import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Class-based error boundary for catching React component errors.
 * Logs errors and displays a user-friendly fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = useTranslation();
      return (
        <div className={cn('glass rounded-2xl p-6 text-center', 'min-h-[200px] flex flex-col items-center justify-center')}>
          <AlertTriangle className="size-12 text-danger/80 mb-4" aria-hidden />
          <h2 className="text-lg font-semibold mb-2">{t('errors.somethingWrong')}</h2>
          <p className="text-sm text-muted mb-4 max-w-md">
            {t('errors.caughtError', { message: this.state.error?.message ?? t('errors.unknown') })}
          </p>
          <Button variant="primary" onClick={this.handleRetry}>
            <RefreshCw className="size-4 me-2" aria-hidden />
            {t('common.retry')}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;