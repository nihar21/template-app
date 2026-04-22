import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { MsalProvider } from '@azure/msal-react';
import { BrowserRouter } from 'react-router-dom';
import { client, msalInstance } from './apollo';
import { AUTH_ENABLED } from './config/constants';
import App from './App';
import './index.css';

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  if (AUTH_ENABLED && msalInstance) {
    return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
  }
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApolloProvider>
    </AppProviders>
  </React.StrictMode>,
);
