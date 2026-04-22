import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { SetContextLink } from '@apollo/client/link/context';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './auth/msalConfig';
import { VITE_API_URL, AUTH_ENABLED } from './config/constants';

const msalInstance = AUTH_ENABLED
  ? new PublicClientApplication(msalConfig)
  : null;

const httpLink = new HttpLink({
  uri: VITE_API_URL,
});

const authLink = new SetContextLink(async ({ headers }) => {
  if (!msalInstance) return { headers };

  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      return {
        headers: {
          ...headers,
          authorization: response.accessToken
            ? `Bearer ${response.accessToken}`
            : '',
        },
      };
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('interaction_required')
    ) {
      try {
        await msalInstance.acquireTokenRedirect(loginRequest);
      } catch (redirectError: unknown) {
        if (
          !(redirectError instanceof Error) ||
          !redirectError.message?.includes('interaction_in_progress')
        ) {
          console.error('Token redirect failed:', redirectError);
        }
      }
    }
    console.error('Token acquisition failed:', error);
  }
  return { headers };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export { msalInstance };
