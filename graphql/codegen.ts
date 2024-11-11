import type { CodegenConfig } from '@graphql-codegen/cli';

const schema = process.env.NODE_ENV !== 'production' 
  ? "http://localhost:3010/api/graphql" 
  : "https://api-v1.inkverse.co";

const config: CodegenConfig = {
  overwrite: true,
  schema,
  documents: "src/shared/graphql/**/*.graphql",
  generates: {
    "src/shared/graphql/types.ts": {
      config: {
        useIndexSignature: true,
        useTypeImports: true,
      },
      plugins: ["typescript", "typescript-resolvers"]
    },
    "src/shared/graphql/operations.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-document-nodes"
      ]
    }
  }
};

export default config;