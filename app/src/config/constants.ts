export const VITE_API_URL = import.meta.env.VITE_API_URL;
export const VITE_CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
export const VITE_TENANT_ID = import.meta.env.VITE_TENANT_ID;
export const VITE_API_IDENTIFIER_URI = import.meta.env.VITE_API_IDENTIFIER_URI;

export const AUTH_ENABLED = !!(VITE_CLIENT_ID && VITE_TENANT_ID);
