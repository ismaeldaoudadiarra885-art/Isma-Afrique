
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
// FIX: Corrected import path for ProjectContext
import { ProjectProvider } from './contexts/ProjectContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

// --- Service Worker Registration for Offline Support ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

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
