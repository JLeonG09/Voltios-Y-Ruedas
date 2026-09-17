import { Component, ErrorInfo, Fragment, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  intento: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, intento: 0 };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  private reintentar = () => {
    this.setState((s) => ({ hasError: false, error: null, intento: s.intento + 1 }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50 dark:bg-surface-900">
          <div className="max-w-md w-full bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-danger-600 dark:text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Algo salió mal</h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Ha ocurrido un error inesperado. Puedes reintentar o recargar la página.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.reintentar}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Recargar página
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left p-4 bg-surface-100 dark:bg-surface-800 rounded-xl text-xs">
                <summary className="cursor-pointer text-surface-500 mb-2">Detalles del error (solo desarrollo)</summary>
                <pre className="whitespace-pre-wrap text-danger-600 dark:text-danger-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return <Fragment key={this.state.intento}>{this.props.children}</Fragment>;
  }
}
