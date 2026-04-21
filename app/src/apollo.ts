import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { VITE_API_URL } from './config/constants';

export const client = new ApolloClient({
  link: new HttpLink({ uri: VITE_API_URL }),
  cache: new InMemoryCache(),
});
