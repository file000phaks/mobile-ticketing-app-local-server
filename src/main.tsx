import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './components/AppRouter';
import { AppProvider } from './contexts/AppContext';
import OfflineQueueProvider from './components/OfflineQueueProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <OfflineQueueProvider>
          <AppRouter />
        </OfflineQueueProvider>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
