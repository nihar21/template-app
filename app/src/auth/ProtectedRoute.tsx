import { useMsalAuthentication, useIsAuthenticated } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import { Outlet } from 'react-router-dom';
import { loginRequest } from './msalConfig';
import { AUTH_ENABLED } from '../config/constants';

const MsalProtectedRoute = () => {
  const isAuthenticated = useIsAuthenticated();

  const { error } = useMsalAuthentication(
    InteractionType.Redirect,
    loginRequest,
  );

  if (error) {
    return <p>Authentication error: {error.message}</p>;
  }

  if (!isAuthenticated) {
    return <p>Redirecting to login...</p>;
  }

  return <Outlet />;
};

export const ProtectedRoute = () => {
  if (!AUTH_ENABLED) {
    return <Outlet />;
  }

  return <MsalProtectedRoute />;
};
