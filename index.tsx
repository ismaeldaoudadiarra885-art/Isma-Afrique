import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
// FIX: Corrected import path for ProjectContext
import { ProjectProvider } from './contexts/ProjectContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ProjectProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ProjectProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);