/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.js';

export type MantleShopIdentityQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type MantleShopIdentityQuery = { shop: Pick<AdminTypes.Shop, 'id' | 'name' | 'email' | 'myshopifyDomain'> };

interface GeneratedQueryTypes {
  "#graphql\n  query MantleShopIdentity {\n    shop {\n      id\n      name\n      email\n      myshopifyDomain\n    }\n  }\n": {return: MantleShopIdentityQuery, variables: MantleShopIdentityQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
