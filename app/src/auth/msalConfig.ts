import { type Configuration, LogLevel } from '@azure/msal-browser';
import {
  VITE_CLIENT_ID,
  VITE_TENANT_ID,
  VITE_API_IDENTIFIER_URI,
} from '../config/constants';

export const msalConfig: Configuration = {
  auth: {
    clientId: VITE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${VITE_TENANT_ID}/v2.0`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Info,
    },
  },
};

export const loginRequest = {
  scopes: [`${VITE_API_IDENTIFIER_URI}/access_as_user`],
};
