export const resolvers = {
  Query: {
    currentTime: () => new Date().toISOString(),
  },
};
