import type { CodegenConfig } from '@graphql-codegen/cli';
import appConfig from '../../config.js';

const config: CodegenConfig = {
  overwrite: true,
  schema: appConfig.SERVER_URL,
  documents: "shared/graphql/**/*.graphql",
  generates: {
    "shared/graphql/types.ts": {
      config: {
        useIndexSignature: true,
        useTypeImports: true,
        namingConvention: {
          enumValues: 'upper-case#upperCase'
        }
      },
      plugins: ["typescript", "typescript-resolvers"]
    },
    "shared/graphql/operations.ts": {
      config: {
        namingConvention: {
          enumValues: 'upper-case#upperCase'
        }
      },
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-document-nodes"
      ]
    }
  }
};

export default config;