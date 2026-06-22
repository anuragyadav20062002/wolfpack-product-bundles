export interface FilterDef {
  id: string;
  label: string;
  collectionHandle: string;
}

export interface CustomFieldDef {
  id: string;
  dbId: string | null;
  label: string;
  fieldType: "text" | "select" | "checkbox" | "number";
  required: boolean;
  options: string[];
}

export interface ConditionDef {
  id: string;
  conditionType: string;
  conditionOperator: string;
  conditionValue: string;
}

export interface StepCategoryState {
  id: string;
  name: string;
  sortOrder: number;
  products: any[];
  collections: any[];
}

export interface WizardStepState {
  tempId: string;
  dbId: string | null;
  name: string;
  pageTitle: string;
  iconUrl: string | null;
  products: any[];
  collections: any[];
  StepCategory: StepCategoryState[];
  conditions: ConditionDef[];
  filters: FilterDef[];
  preSelectAll: boolean;
  activeTab: "products" | "collections";
}

export type WizardStepLike = Partial<WizardStepState> & {
  tempId?: string;
  dbId?: string | null;
};
