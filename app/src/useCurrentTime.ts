import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

export const CURRENT_TIME = gql`
  query CurrentTime {
    currentTime
  }
`;

export function useCurrentTime() {
  return useQuery<{ currentTime: string }>(CURRENT_TIME);
}
