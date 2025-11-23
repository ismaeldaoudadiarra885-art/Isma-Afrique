import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any; // Allow any type to be caught
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorString: string;
      const { error } = this.state;

      if (error instanceof Error) {
        errorString = `${error.toString()}\n${error.stack || ''}`;
      } else if (typeof error === 'string') {
        errorString = error;
      } else {
        try {
          // Try to stringify, which is better than .toString() for plain objects
          errorString = JSON.stringify(error, null, 2);
        } catch {
          // Fallback for circular objects or other stringify errors
          errorString = String(error);
        }
      }

      return (
        <div style={{ padding: '20px', margin: '20px', textAlign: 'center', backgroundColor: '#fdecec', color: '#7f1d1d', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <h1>Une erreur est survenue.</h1>
          <p>L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', fontSize: '12px', textAlign: 'left', maxHeight: '300px', overflowY: 'auto' }}>
            <summary>Détails de l'erreur</summary>
            <pre><code style={{ color: '#c93434' }}>{errorString}</code></pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
