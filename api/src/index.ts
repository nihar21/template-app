import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { resolvers } from './graphql/resolvers.js';
import { authMiddleware, type AuthContext } from './auth/middleware.js';

export interface Context {
  auth?: AuthContext;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typesArray = loadFilesSync(path.join(__dirname, 'graphql/**/*.graphql'));
const typeDefs = mergeTypeDefs(typesArray);

const app = express();
const server = new ApolloServer<Context>({ typeDefs, resolvers });
await server.start();

app.use(
  '/api/graphql',
  cors(),
  express.json(),
  authMiddleware,
  expressMiddleware(server, {
    context: async ({ req }) => ({ auth: req.authContext }),
  }),
);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`api ready on :${port}/api/graphql`);
});
