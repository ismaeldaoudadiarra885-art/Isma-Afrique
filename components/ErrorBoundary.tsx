
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  public state: ErrorBoundaryState = {
    hasError: false,
    error: undefined
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      let errorString: string;
      const { error } = this.state;

      if (error instanceof Error) {
        errorString = `${error.toString()}\n${error.stack || ''}`;
      } else if (typeof error === 'string') {
        errorString = error;
      } else {
        try {
          errorString = JSON.stringify(error, null, 2);
        } catch {
          errorString = String(error);
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl border-l-4 border-red-500 max-w-2xl w-full">
                <h1 className="text-xl font-bold text-red-600 mb-2">Une erreur inattendue est survenue</h1>
                <p className="text-gray-600 mb-4">L'application a rencontré un problème critique. Essayez de rafraîchir la page.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mb-4"
                >
                    Rafraîchir la page
                </button>
                <details className="mt-4 bg-gray-100 p-4 rounded overflow-auto max-h-64 text-xs font-mono text-red-800">
                    <summary className="cursor-pointer font-semibold mb-2">Détails techniques (pour le support)</summary>
                    <pre>{errorString}</pre>
                </details>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
