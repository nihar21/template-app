import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist/graphql', { recursive: true });
cpSync('src/graphql/schema.graphql', 'dist/graphql/schema.graphql');
