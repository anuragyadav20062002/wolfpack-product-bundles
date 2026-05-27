export type CategoryBundleType = "full_page" | "product_page";

export interface CategoryConditionContract {
  type: string;
  condition: string;
  value: string;
}

export interface CategoryProductContract {
  id: string;
  productId?: string;
  graphqlId?: string;
  handle?: string;
  variants?: unknown[];
  hasOnlyDefaultVariant?: boolean;
  images?: unknown[];
  title?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface CategoryCollectionContract {
  id: string;
  handle?: string;
  title?: string;
  [key: string]: unknown;
}

export interface CategoryContractInput {
  bundleType: CategoryBundleType;
  categoryId: string;
  name: string;
  title?: string;
  subTitle?: string;
  rank?: number;
  products?: CategoryProductContract[];
  collectionsData?: CategoryCollectionContract[];
  collectionsSelectedData?: CategoryCollectionContract[];
  selectedProducts?: CategoryProductContract[];
  conditions?: CategoryConditionContract[];
  categoryBanner?: string;
  categoryImg?: string;
  autoNextStepOnConditionMet?: boolean;
  multiLangData?: Record<string, unknown>;
  displayVariantsAsIndividualProducts?: boolean;
  displayVariantsAsSwatches?: boolean;
}

export function buildCategoryContract(input: CategoryContractInput) {
  const products = input.products ?? [];
  const collectionsData = input.collectionsData ?? [];
  const collectionsSelectedData = input.collectionsSelectedData ?? [];
  const conditions = input.conditions ?? [];
  const subTitle = input.subTitle ?? "";
  const categoryBanner = input.categoryBanner ?? "";
  const multiLangData = input.multiLangData ?? {};
  const autoNextStepOnConditionMet = input.autoNextStepOnConditionMet === true;

  if (input.bundleType === "full_page") {
    return {
      categoryId: input.categoryId,
      title: input.title ?? input.name,
      subTitle,
      categoryImg: input.categoryImg ?? "",
      conditions,
      autoNextStepOnConditionMet,
      products,
      selectedProducts: input.selectedProducts ?? [],
      collectionsData,
      collectionsSelectedData,
      categoryBanner,
      multiLangData,
    };
  }

  return {
    categoryId: input.categoryId,
    ...(input.title ? { title: input.title } : {}),
    subTitle,
    name: input.name,
    categoryRank: input.rank ?? 1,
    conditions,
    autoNextStepOnConditionMet,
    products,
    collectionsData,
    collectionsSelectedData,
    categoryBanner,
    displayVariantsAsIndividualProducts: input.displayVariantsAsIndividualProducts === true,
    displayVariantsAsSwatches: input.displayVariantsAsSwatches === true,
    multiLangData,
  };
}
