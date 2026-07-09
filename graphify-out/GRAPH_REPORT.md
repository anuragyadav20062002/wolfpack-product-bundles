# Graph Report - .  (2026-07-09)

## Corpus Check
- 857 files · ~6,873,500 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3128 nodes · 4897 edges · 284 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `VariantSelectorComponent` - 28 edges
2. `VariantSelectorComponent` - 28 edges
3. `VariantSelectorComponent` - 28 edges
4. `VariantSelectorComponent` - 28 edges
5. `run_cart_transform()` - 25 edges
6. `BundleProductModal` - 18 edges
7. `BundleProductModal` - 18 edges
8. `TemplateManager` - 17 edges
9. `TemplateManager` - 17 edges
10. `TemplateManager` - 17 edges

## Surprising Connections (you probably didn't know these)
- `loader()` --calls--> `queueProductHandleBackfill()`  [EXTRACTED]
  app/routes/root/_index/route.tsx → app/routes/app/app.dashboard/route.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (102): buildBundleBootstrapPayload(), filterFields(), getNormalizedEtag(), isFreshByCacheHeaders(), loader(), parseFieldsParam(), getDb(), mockFindFirst() (+94 more)

### Community 1 - "Community 1"
Cohesion: 0.01
Nodes (39): addonTierToDraft(), createDefaultAddonDraftTier(), normalizeAddonPickerProduct(), toNumericShopifyId(), toProductGid(), handleAdminSaveLockedEvent(), shouldBlockAdminConfigInteraction(), buildDefaultProductEntryFromPicker() (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.02
Nodes (51): addSelectedProduct(), appendBannerImage(), buildProductPageCartFormData(), BundleDataManager, BundleProductModal, BundleWidgetFullPage, clearStepSelection(), cloneSelectedProducts() (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (44): addSelectedProduct(), appendBannerImage(), buildProductPageCartFormData(), BundleDataManager, BundleWidgetProductPage, clearStepSelection(), cloneSelectedProducts(), ComponentGenerator (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (22): asVisibilityArray(), compactVisibilityCollectionPageReference(), compactVisibilityCollectionReference(), compactVisibilityImages(), compactVisibilityProductPageReference(), compactVisibilityProductReference(), getVisibilityDisplayTarget(), getVisibilityImageUrl() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (36): action(), errorResponse(), filenameFromUrl(), loader(), has_fixed_price_display_only_marker(), non_empty(), process_merge_operations(), select_you_save_value() (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (35): addBundleToCart(), addItem(), _bootstrap(), buildBundleDetailsDisplayProperties(), buildCartItems(), _buildCartLineSourceProperties(), _buildNoOp(), buildProductPageCartFormData() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (26): makeDiscountData(), makeFormData(), makeStepsData(), makeStepWithProduct(), calculateBundleInventory(), calculateMinInventory(), setInventoryLevel(), syncBundleInventory() (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (20): calculate_buy_x_get_y_discount_percentage(), calculate_discount_percentage(), condition_is_met(), condition_threshold(), canUseSavedBundleQuantitySubtext(), containsPercentageValue(), getCompatibility(), getDefaultDiscountRuleSuccessMessage() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (10): changeAdminI18nLanguage(), cloneLocaleCatalog(), isSupportedLocale(), loadAdminLocaleResources(), normalizeAdminLocale(), refreshEnglishResourceBundle(), decideDashboardPreviewAction(), normalizeShop() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (4): CurrencyManager, PricingCalculator, TemplateManager, VariantSelectorComponent

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (21): addonProductId(), addonVariantId(), collectAddonComponentVariants(), normalizeGid(), parsePriceCents(), collectCachedStepVariants(), collectStepProductReferences(), ensureBundleParentVariantRequiresComponents() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (29): dedupeProductsById(), formatBundleForWidget(), getCategorySourceProducts(), getProductId(), getProductIdFromSource(), getStepSourceProducts(), resolveBundleDesignPresetId(), resolveBundleDesignTemplate() (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (9): loadAttributionDashboardData(), loader(), formatDateLabel(), formatRangeLabel(), handleApply(), navigateTo(), backfillOrderAttribution(), extractOrderNumber() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (17): calculateCheckoutTotalSavings(), getBundleAttributeSavings(), getCurrencyCode(), getLineAttributeValue(), sumDiscountAllocations(), TotalSavingsExtension(), buildBadgePositionVars(), cssPx() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (13): getCheckoutIntegrationProvider(), isDiscountCodeCheckoutIntegrationProvider(), isSupportedCheckoutIntegrationProvider(), normalizeCheckoutIntegrationProvider(), buildSettingsControlsResponse(), buildSettingsControlsRuntime(), checked(), getDiscountFormat() (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (3): CurrencyManager, PricingCalculator, TemplateManager

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (33): attr_value(), merge_attributes(), messaging_merge_input(), parent_match_count(), parse_component_parents(), run_cart_transform(), runtime_merge_payload(), select_parent_for_group() (+25 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (23): action(), buildCorsHeaders(), isNonEmptyString(), loader(), sanitizeEventName(), sanitizeOptionalString(), getDb(), mockCreateMany() (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (1): VariantSelectorComponent

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (19): getPreviewReadinessStorageKey(), markBundlePreviewComplete(), asArray(), asRecord(), compactCategories(), compactCategory(), compactCollection(), compactCollections() (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (1): VariantSelectorComponent

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (4): generateThemeEditorLink(), handleOpenThemeEditor(), handleStepAction(), markStepComplete()

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (14): processCss(), sanitizeCss(), validateCssSyntax(), bool(), int(), jsonObject(), normalizeIndividualSellingPlanSelection(), normalizeSellingPlanSelectionShowFor() (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (10): checkAppEmbedEnabled(), getThemeSettingsContent(), getThemeSettingsFileContent(), isDisabledAppEmbedSetting(), isWolfpackEmbedBlock(), parseThemeSettingsData(), stripJsonComments(), buildThemeAppEmbedEditorUrl() (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.1
Nodes (2): FakeClassList, FakeElement

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (4): read(), readFullPageWidgetSources(), readMethodSources(), readProductPageWidgetSources()

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (3): createSharedProductCard(), FakeClassList, FakeElement

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (4): CachedSessionStorage, isOfflineCredentialUnusable(), isTransientPrismaConnectionError(), sleep()

### Community 29 - "Community 29"
Cohesion: 0.2
Nodes (1): BundleProductModal

### Community 30 - "Community 30"
Cohesion: 0.23
Nodes (18): build_addon_candidate(), build_automatic_addon_candidates(), build_checkout_integration_candidates(), calculate_parent_discount_percentage(), cart_lines_discounts_generate_run(), decimal_to_f64(), extract_json_number(), extract_json_number_any() (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (6): extractFullPageId(), normalizeFullPageDirectDefaultProduct(), normalizeProductDescription(), normalizeProductDescriptionHtml(), productLookupKey(), variantLookupKey()

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (1): TemplateManager

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (1): BundleDataManager

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (12): applyMapping(), buildSettingsDesignRuntime(), flattenRuntimeSettings(), getField(), imageRadiusFromBase(), normalizeImageFit(), normalizePx(), normalizeRadiusStyle() (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (9): calculateP75(), getRouteKey(), getRouteLoadId(), installAdminWebVitalsDiagnostics(), installDebugConsoleApi(), isDebugEnabled(), readLcpSamples(), recordDebugLcpSample() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (1): BundleDataManager

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (13): adj(), adj_with_condition(), condition_met_applies_discount(), condition_not_met_returns_zero(), fixed_amount_off_basic(), fixed_amount_off_exceeds_total(), fixed_bundle_price_basic(), fixed_bundle_price_uses_highest_qualified_rule() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.3
Nodes (13): buildFpbLanguage(), buildFpbTextOverrides(), buildPpbCustomTextSettings(), buildPpbLanguage(), buildPpbTextOverrides(), buildSettingsLanguageResponse(), buildSettingsLanguageRuntime(), buildSharedCartFields() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (3): buildBundleTrendSeries(), getWeekStart(), toDateKey()

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (10): addUnique(), asArray(), buildProductPageThemeEditorDeepLink(), deriveCommonSellingPlanGroups(), extractSellingPlanValidationSources(), normalizeCollectionId(), normalizeProductId(), resolveProductPageTemplateSuffix() (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.48
Nodes (14): buildBanner(), buildFullPageBundle(), buildProductPageBundle(), buildSdkBundle(), main(), readFile(), readFullPageModules(), readModalModules() (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.26
Nodes (1): TestRunner

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (1): ServerTiming

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (1): BundleWidgetProductPage

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (12): addBundleToCart(), buildBundleDetailsDisplayProperties(), buildCartItems(), _buildCartLineSourceProperties(), buildProductPageCartFormData(), _formatCartAmount(), _generateBundleInstanceId(), _generateBundleSessionKey() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.35
Nodes (1): PricingCalculator

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (0):

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (4): addon_runtime_payload(), emits_addon_discount_only_when_runtime_token_authorizes_line(), ignores_unsigned_addon_discount_markers(), test_runtime_secret()

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (5): canNavigateToStep(), getFreeGiftRemainingCount(), getFreeGiftStep(), getPaidSteps(), isFreeGiftUnlocked()

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (1): FakeElement

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (1): FakeElement

### Community 52 - "Community 52"
Cohesion: 0.38
Nodes (9): escapeAttribute(), escapeHtml(), formatPrice(), getDisplayTitle(), getProductImageUrls(), getVariantDisplayText(), renderAddButton(), renderImageNavButton() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.27
Nodes (1): BillingService

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (1): FakeElement

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (3): FakeButton, FakeCard, FakeClassList

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (1): FakeElement

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (1): FakeElement

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (3): formatCompactCountAxisTick(), formatCompactCurrencyAxisTick(), formatCompactNumber()

### Community 59 - "Community 59"
Cohesion: 0.38
Nodes (1): AppLogger

### Community 60 - "Community 60"
Cohesion: 0.36
Nodes (1): CurrencyManager

### Community 61 - "Community 61"
Cohesion: 0.27
Nodes (4): getSelectedEntries(), getSelectedProductEntries(), getSelectedQuantity(), getSelectedSubtotalCents()

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (1): CartTransformService

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (6): action(), mergeBundleDetailsValue(), normalizeCartId(), postStorefrontGraphql(), sanitizeDisplayProperties(), validateBundleDetailsKey()

### Community 64 - "Community 64"
Cohesion: 0.2
Nodes (0):

### Community 65 - "Community 65"
Cohesion: 0.31
Nodes (1): LoaderCache

### Community 66 - "Community 66"
Cohesion: 0.28
Nodes (1): ComponentGenerator

### Community 67 - "Community 67"
Cohesion: 0.36
Nodes (1): MetafieldCleanupService

### Community 68 - "Community 68"
Cohesion: 0.22
Nodes (1): FakeElement

### Community 69 - "Community 69"
Cohesion: 0.25
Nodes (2): collectRouteSourceFiles(), readPpbConfigureRouteFamilySource()

### Community 70 - "Community 70"
Cohesion: 0.39
Nodes (6): buildBundleProductMediaFileUpdates(), buildBundleProductPlaceholderMediaInput(), buildStaleBundleProductMediaReferenceRemovals(), getBundleProductPlaceholderAlt(), hasBundleProductPlaceholderMedia(), isBundleProductPlaceholderMedia()

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (1): FakeElement

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (2): collectRouteSourceFiles(), readFpbConfigureRouteFamilySource()

### Community 73 - "Community 73"
Cohesion: 0.36
Nodes (4): makeDiscountData(), makeFormData(), makeStep(), makeStepWithProduct()

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (2): normalizeProductPageAutoNextId(), shouldAutoAdvanceProductPageStep()

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (6): escapeAttribute(), escapeHtml(), normalizePercent(), renderDiscountProgress(), renderMilestones(), renderMilestoneSubtitleList()

### Community 76 - "Community 76"
Cohesion: 0.62
Nodes (6): escapeAttribute(), escapeHtml(), renderBadges(), renderEmptyRow(), renderSelectedProductRow(), renderTrashIcon()

### Community 77 - "Community 77"
Cohesion: 0.48
Nodes (2): getSubscriptionInfoWithCache(), SubscriptionGuard

### Community 78 - "Community 78"
Cohesion: 0.43
Nodes (5): buildCompliantOfflineSession(), buildSession(), makeCompliantOfflineRow(), makeExpiringRow(), makeRow()

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (1): ProductPageWidget

### Community 80 - "Community 80"
Cohesion: 0.29
Nodes (1): FakeLink

### Community 81 - "Community 81"
Cohesion: 0.6
Nodes (5): asObjectArray(), buildStepCategoryCreateInput(), numberValue(), objectRecord(), stringValue()

### Community 82 - "Community 82"
Cohesion: 0.4
Nodes (1): BundleWidgetFullPage

### Community 83 - "Community 83"
Cohesion: 0.53
Nodes (4): addItem(), clearStep(), _findStep(), removeItem()

### Community 84 - "Community 84"
Cohesion: 0.47
Nodes (3): getAddonTierCandidatesWithState(), getAddonTiersForStep(), hasConfiguredAddonRule()

### Community 85 - "Community 85"
Cohesion: 0.6
Nodes (1): ToastManager

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (5): escapeAttribute(), escapeHtml(), getStatusClasses(), renderSelectedProductSlots(), renderSlot()

### Community 87 - "Community 87"
Cohesion: 0.53
Nodes (1): BundleAnalyticsService

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (0):

### Community 89 - "Community 89"
Cohesion: 0.4
Nodes (2): bsFindNextIncompleteStep(), validateFn()

### Community 90 - "Community 90"
Cohesion: 0.33
Nodes (0):

### Community 91 - "Community 91"
Cohesion: 0.33
Nodes (1): FakeElement

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (0):

### Community 93 - "Community 93"
Cohesion: 0.6
Nodes (5): minifyJS(), readQuoted(), removeJSBlockComments(), removeJSSingleLineComments(), stripLineComment()

### Community 94 - "Community 94"
Cohesion: 0.7
Nodes (4): _bootstrap(), _buildNoOp(), _buildSdk(), _findContainer()

### Community 95 - "Community 95"
Cohesion: 0.7
Nodes (4): addSelectedProduct(), clearStepSelection(), ensureStep(), removeSelectedProduct()

### Community 96 - "Community 96"
Cohesion: 0.7
Nodes (1): AddOnDiscountFunctionService

### Community 97 - "Community 97"
Cohesion: 0.5
Nodes (1): MetafieldValidationService

### Community 98 - "Community 98"
Cohesion: 0.4
Nodes (1): ProductPageWidget

### Community 99 - "Community 99"
Cohesion: 0.5
Nodes (2): createClassList(), createModalForPopulate()

### Community 100 - "Community 100"
Cohesion: 0.4
Nodes (2): FakeCard, FakeWrapper

### Community 101 - "Community 101"
Cohesion: 0.4
Nodes (0):

### Community 102 - "Community 102"
Cohesion: 0.5
Nodes (0):

### Community 103 - "Community 103"
Cohesion: 0.5
Nodes (0):

### Community 104 - "Community 104"
Cohesion: 0.5
Nodes (0):

### Community 105 - "Community 105"
Cohesion: 0.5
Nodes (0):

### Community 106 - "Community 106"
Cohesion: 0.83
Nodes (3): _stepIsCategoryRuleMode(), validateBundle(), validateStep()

### Community 107 - "Community 107"
Cohesion: 0.67
Nodes (2): initDebugMode(), isDebugMode()

### Community 108 - "Community 108"
Cohesion: 0.5
Nodes (0):

### Community 109 - "Community 109"
Cohesion: 0.5
Nodes (0):

### Community 110 - "Community 110"
Cohesion: 0.67
Nodes (2): appendBannerImage(), createBundleBannerElement()

### Community 111 - "Community 111"
Cohesion: 1.0
Nodes (3): escapeAttribute(), escapeHtml(), renderStepTimelineEntry()

### Community 112 - "Community 112"
Cohesion: 0.83
Nodes (1): CheckoutIntegrationDiscountCodeService

### Community 113 - "Community 113"
Cohesion: 0.5
Nodes (1): ThemeTemplateService

### Community 114 - "Community 114"
Cohesion: 0.5
Nodes (0):

### Community 115 - "Community 115"
Cohesion: 0.5
Nodes (0):

### Community 116 - "Community 116"
Cohesion: 0.5
Nodes (0):

### Community 117 - "Community 117"
Cohesion: 0.5
Nodes (0):

### Community 118 - "Community 118"
Cohesion: 0.5
Nodes (0):

### Community 119 - "Community 119"
Cohesion: 0.83
Nodes (3): call(), callCanProceed(), callIsUnlocked()

### Community 120 - "Community 120"
Cohesion: 0.5
Nodes (0):

### Community 121 - "Community 121"
Cohesion: 0.67
Nodes (2): buildReqRes(), makeHmac()

### Community 122 - "Community 122"
Cohesion: 0.83
Nodes (3): main(), processFile(), runGroup()

### Community 123 - "Community 123"
Cohesion: 0.67
Nodes (0):

### Community 124 - "Community 124"
Cohesion: 0.67
Nodes (0):

### Community 125 - "Community 125"
Cohesion: 0.67
Nodes (0):

### Community 126 - "Community 126"
Cohesion: 0.67
Nodes (0):

### Community 127 - "Community 127"
Cohesion: 0.67
Nodes (0):

### Community 128 - "Community 128"
Cohesion: 0.67
Nodes (0):

### Community 129 - "Community 129"
Cohesion: 0.67
Nodes (0):

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (2): escapeHtml(), renderQuantityControl()

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (2): buildProductPageCartFormData(), extractBundleDetailsSourceProperties()

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (2): cloneSelectedProducts(), createBundleState()

### Community 133 - "Community 133"
Cohesion: 0.67
Nodes (0):

### Community 134 - "Community 134"
Cohesion: 0.67
Nodes (0):

### Community 135 - "Community 135"
Cohesion: 0.67
Nodes (0):

### Community 136 - "Community 136"
Cohesion: 0.67
Nodes (0):

### Community 137 - "Community 137"
Cohesion: 0.67
Nodes (0):

### Community 138 - "Community 138"
Cohesion: 0.67
Nodes (0):

### Community 139 - "Community 139"
Cohesion: 0.67
Nodes (0):

### Community 140 - "Community 140"
Cohesion: 0.67
Nodes (0):

### Community 141 - "Community 141"
Cohesion: 0.67
Nodes (0):

### Community 142 - "Community 142"
Cohesion: 0.67
Nodes (0):

### Community 143 - "Community 143"
Cohesion: 0.67
Nodes (0):

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (2): getDiscountValueFromRule(), updateModalDiscountBar()

### Community 145 - "Community 145"
Cohesion: 0.67
Nodes (0):

### Community 146 - "Community 146"
Cohesion: 1.0
Nodes (2): fmtBytes(), printSummary()

### Community 147 - "Community 147"
Cohesion: 1.0
Nodes (0):

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (0):

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (0):

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (0):

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (0):

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (0):

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (0):

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (0):

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (0):

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (0):

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (0):

### Community 158 - "Community 158"
Cohesion: 1.0
Nodes (0):

### Community 159 - "Community 159"
Cohesion: 1.0
Nodes (0):

### Community 160 - "Community 160"
Cohesion: 1.0
Nodes (0):

### Community 161 - "Community 161"
Cohesion: 1.0
Nodes (0):

### Community 162 - "Community 162"
Cohesion: 1.0
Nodes (0):

### Community 163 - "Community 163"
Cohesion: 1.0
Nodes (0):

### Community 164 - "Community 164"
Cohesion: 1.0
Nodes (0):

### Community 165 - "Community 165"
Cohesion: 1.0
Nodes (0):

### Community 166 - "Community 166"
Cohesion: 1.0
Nodes (0):

### Community 167 - "Community 167"
Cohesion: 1.0
Nodes (0):

### Community 168 - "Community 168"
Cohesion: 1.0
Nodes (0):

### Community 169 - "Community 169"
Cohesion: 1.0
Nodes (0):

### Community 170 - "Community 170"
Cohesion: 1.0
Nodes (0):

### Community 171 - "Community 171"
Cohesion: 1.0
Nodes (0):

### Community 172 - "Community 172"
Cohesion: 1.0
Nodes (0):

### Community 173 - "Community 173"
Cohesion: 1.0
Nodes (0):

### Community 174 - "Community 174"
Cohesion: 1.0
Nodes (0):

### Community 175 - "Community 175"
Cohesion: 1.0
Nodes (0):

### Community 176 - "Community 176"
Cohesion: 1.0
Nodes (0):

### Community 177 - "Community 177"
Cohesion: 1.0
Nodes (0):

### Community 178 - "Community 178"
Cohesion: 1.0
Nodes (0):

### Community 179 - "Community 179"
Cohesion: 1.0
Nodes (0):

### Community 180 - "Community 180"
Cohesion: 1.0
Nodes (0):

### Community 181 - "Community 181"
Cohesion: 1.0
Nodes (0):

### Community 182 - "Community 182"
Cohesion: 1.0
Nodes (0):

### Community 183 - "Community 183"
Cohesion: 1.0
Nodes (0):

### Community 184 - "Community 184"
Cohesion: 1.0
Nodes (0):

### Community 185 - "Community 185"
Cohesion: 1.0
Nodes (0):

### Community 186 - "Community 186"
Cohesion: 1.0
Nodes (0):

### Community 187 - "Community 187"
Cohesion: 1.0
Nodes (0):

### Community 188 - "Community 188"
Cohesion: 1.0
Nodes (0):

### Community 189 - "Community 189"
Cohesion: 1.0
Nodes (0):

### Community 190 - "Community 190"
Cohesion: 1.0
Nodes (0):

### Community 191 - "Community 191"
Cohesion: 1.0
Nodes (0):

### Community 192 - "Community 192"
Cohesion: 1.0
Nodes (0):

### Community 193 - "Community 193"
Cohesion: 1.0
Nodes (0):

### Community 194 - "Community 194"
Cohesion: 1.0
Nodes (0):

### Community 195 - "Community 195"
Cohesion: 1.0
Nodes (0):

### Community 196 - "Community 196"
Cohesion: 1.0
Nodes (0):

### Community 197 - "Community 197"
Cohesion: 1.0
Nodes (0):

### Community 198 - "Community 198"
Cohesion: 1.0
Nodes (0):

### Community 199 - "Community 199"
Cohesion: 1.0
Nodes (0):

### Community 200 - "Community 200"
Cohesion: 1.0
Nodes (0):

### Community 201 - "Community 201"
Cohesion: 1.0
Nodes (0):

### Community 202 - "Community 202"
Cohesion: 1.0
Nodes (0):

### Community 203 - "Community 203"
Cohesion: 1.0
Nodes (0):

### Community 204 - "Community 204"
Cohesion: 1.0
Nodes (0):

### Community 205 - "Community 205"
Cohesion: 1.0
Nodes (0):

### Community 206 - "Community 206"
Cohesion: 1.0
Nodes (0):

### Community 207 - "Community 207"
Cohesion: 1.0
Nodes (0):

### Community 208 - "Community 208"
Cohesion: 1.0
Nodes (0):

### Community 209 - "Community 209"
Cohesion: 1.0
Nodes (0):

### Community 210 - "Community 210"
Cohesion: 1.0
Nodes (0):

### Community 211 - "Community 211"
Cohesion: 1.0
Nodes (0):

### Community 212 - "Community 212"
Cohesion: 1.0
Nodes (0):

### Community 213 - "Community 213"
Cohesion: 1.0
Nodes (0):

### Community 214 - "Community 214"
Cohesion: 1.0
Nodes (0):

### Community 215 - "Community 215"
Cohesion: 1.0
Nodes (0):

### Community 216 - "Community 216"
Cohesion: 1.0
Nodes (0):

### Community 217 - "Community 217"
Cohesion: 1.0
Nodes (0):

### Community 218 - "Community 218"
Cohesion: 1.0
Nodes (0):

### Community 219 - "Community 219"
Cohesion: 1.0
Nodes (0):

### Community 220 - "Community 220"
Cohesion: 1.0
Nodes (0):

### Community 221 - "Community 221"
Cohesion: 1.0
Nodes (0):

### Community 222 - "Community 222"
Cohesion: 1.0
Nodes (0):

### Community 223 - "Community 223"
Cohesion: 1.0
Nodes (0):

### Community 224 - "Community 224"
Cohesion: 1.0
Nodes (0):

### Community 225 - "Community 225"
Cohesion: 1.0
Nodes (0):

### Community 226 - "Community 226"
Cohesion: 1.0
Nodes (0):

### Community 227 - "Community 227"
Cohesion: 1.0
Nodes (0):

### Community 228 - "Community 228"
Cohesion: 1.0
Nodes (0):

### Community 229 - "Community 229"
Cohesion: 1.0
Nodes (0):

### Community 230 - "Community 230"
Cohesion: 1.0
Nodes (0):

### Community 231 - "Community 231"
Cohesion: 1.0
Nodes (0):

### Community 232 - "Community 232"
Cohesion: 1.0
Nodes (0):

### Community 233 - "Community 233"
Cohesion: 1.0
Nodes (0):

### Community 234 - "Community 234"
Cohesion: 1.0
Nodes (0):

### Community 235 - "Community 235"
Cohesion: 1.0
Nodes (0):

### Community 236 - "Community 236"
Cohesion: 1.0
Nodes (0):

### Community 237 - "Community 237"
Cohesion: 1.0
Nodes (0):

### Community 238 - "Community 238"
Cohesion: 1.0
Nodes (0):

### Community 239 - "Community 239"
Cohesion: 1.0
Nodes (0):

### Community 240 - "Community 240"
Cohesion: 1.0
Nodes (0):

### Community 241 - "Community 241"
Cohesion: 1.0
Nodes (0):

### Community 242 - "Community 242"
Cohesion: 1.0
Nodes (0):

### Community 243 - "Community 243"
Cohesion: 1.0
Nodes (0):

### Community 244 - "Community 244"
Cohesion: 1.0
Nodes (0):

### Community 245 - "Community 245"
Cohesion: 1.0
Nodes (0):

### Community 246 - "Community 246"
Cohesion: 1.0
Nodes (0):

### Community 247 - "Community 247"
Cohesion: 1.0
Nodes (0):

### Community 248 - "Community 248"
Cohesion: 1.0
Nodes (0):

### Community 249 - "Community 249"
Cohesion: 1.0
Nodes (0):

### Community 250 - "Community 250"
Cohesion: 1.0
Nodes (0):

### Community 251 - "Community 251"
Cohesion: 1.0
Nodes (0):

### Community 252 - "Community 252"
Cohesion: 1.0
Nodes (0):

### Community 253 - "Community 253"
Cohesion: 1.0
Nodes (0):

### Community 254 - "Community 254"
Cohesion: 1.0
Nodes (0):

### Community 255 - "Community 255"
Cohesion: 1.0
Nodes (0):

### Community 256 - "Community 256"
Cohesion: 1.0
Nodes (0):

### Community 257 - "Community 257"
Cohesion: 1.0
Nodes (0):

### Community 258 - "Community 258"
Cohesion: 1.0
Nodes (0):

### Community 259 - "Community 259"
Cohesion: 1.0
Nodes (0):

### Community 260 - "Community 260"
Cohesion: 1.0
Nodes (0):

### Community 261 - "Community 261"
Cohesion: 1.0
Nodes (0):

### Community 262 - "Community 262"
Cohesion: 1.0
Nodes (0):

### Community 263 - "Community 263"
Cohesion: 1.0
Nodes (0):

### Community 264 - "Community 264"
Cohesion: 1.0
Nodes (0):

### Community 265 - "Community 265"
Cohesion: 1.0
Nodes (0):

### Community 266 - "Community 266"
Cohesion: 1.0
Nodes (0):

### Community 267 - "Community 267"
Cohesion: 1.0
Nodes (0):

### Community 268 - "Community 268"
Cohesion: 1.0
Nodes (0):

### Community 269 - "Community 269"
Cohesion: 1.0
Nodes (0):

### Community 270 - "Community 270"
Cohesion: 1.0
Nodes (0):

### Community 271 - "Community 271"
Cohesion: 1.0
Nodes (0):

### Community 272 - "Community 272"
Cohesion: 1.0
Nodes (0):

### Community 273 - "Community 273"
Cohesion: 1.0
Nodes (0):

### Community 274 - "Community 274"
Cohesion: 1.0
Nodes (0):

### Community 275 - "Community 275"
Cohesion: 1.0
Nodes (0):

### Community 276 - "Community 276"
Cohesion: 1.0
Nodes (0):

### Community 277 - "Community 277"
Cohesion: 1.0
Nodes (0):

### Community 278 - "Community 278"
Cohesion: 1.0
Nodes (0):

### Community 279 - "Community 279"
Cohesion: 1.0
Nodes (0):

### Community 280 - "Community 280"
Cohesion: 1.0
Nodes (0):

### Community 281 - "Community 281"
Cohesion: 1.0
Nodes (0):

### Community 282 - "Community 282"
Cohesion: 1.0
Nodes (0):

### Community 283 - "Community 283"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **15 isolated node(s):** `WidgetInstallationService`, `ComponentParent`, `PriceAdjustmentConfig`, `PricingMethod`, `Condition` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 147`** (2 nodes): `graphql.config.js`, `getExtensionProjects()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `FunnelHero.tsx`, `FunnelStepBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (2 nodes): `events.js`, `emit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (2 nodes): `get-display-price.js`, `getDisplayPrice()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (2 nodes): `config-loader.js`, `loadBundleConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (2 nodes): `product-grid-methods.js`, `shouldCategoryTabActivateProducts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (2 nodes): `clear-cart-confirmation-methods.js`, `createIconButtonSvg()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (2 nodes): `summary-pricing-display.js`, `shouldDisplayClassicFixedBundleRawTotal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (2 nodes): `mixin-descriptors.js`, `applyMethodMixins()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `default-loading-animation.js`, `createDefaultLoadingAnimation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (2 nodes): `variant-selector-policy.js`, `shouldRenderInlineVariantSelector()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (2 nodes): `webhook-subscriptions.test.ts`, `readTopics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (2 nodes): `shared-admin-copy-i18n.test.ts`, `readSource()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (2 nodes): `billing-plan-cards-i18n.test.ts`, `readSource()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 161`** (2 nodes): `billing-feedback-i18n.test.ts`, `readSource()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (2 nodes): `full-page-preset.test.ts`, `makeContainer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (2 nodes): `pricing-calculator-bxy.test.ts`, `makeBxyBundle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (2 nodes): `fpb-discount-progress-milestones.test.ts`, `makeContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (2 nodes): `fpb-full-page-metafield-cache.test.ts`, `makeWidgetContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (2 nodes): `fpb-standard-step-timeline-entries.test.ts`, `makeContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 167`** (2 nodes): `fpb-card-cta-mode.test.ts`, `makeRuntime()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (2 nodes): `loading-overlay.test.ts`, `createOverlay()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 169`** (2 nodes): `bundle-widget-full-page-category-hydration.test.ts`, `categoryContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (2 nodes): `fpb-tier-api-source.test.ts`, `resolveTierConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 171`** (2 nodes): `sdk-cart.test.ts`, `makeState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 172`** (2 nodes): `shared-bundle-banners.test.ts`, `createFakeDocument()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 173`** (2 nodes): `bundle-session-key.test.ts`, `makeSdkState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 174`** (2 nodes): `fpb-fixed-price-sidebar-cta.test.ts`, `makeContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 175`** (2 nodes): `fpb-title-flash.test.ts`, `createContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 176`** (2 nodes): `preview-button-loading.test.ts`, `readRouteFile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 177`** (2 nodes): `app-events.test.ts`, `getDb()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 178`** (2 nodes): `cart-transform-list-route-removal.test.ts`, `exists()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 179`** (2 nodes): `main.rs`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 180`** (2 nodes): `targets.js`, `createTargets()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 181`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 182`** (1 nodes): `jest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 183`** (1 nodes): `env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 184`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 185`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 186`** (1 nodes): `wolfpack-bundles.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 187`** (1 nodes): `routes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 188`** (1 nodes): `globals.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 189`** (1 nodes): `admin.types.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 190`** (1 nodes): `admin.generated.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 191`** (1 nodes): `UpgradeSuccessBanner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 192`** (1 nodes): `TopCampaigns.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 193`** (1 nodes): `bundle-widget-components.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 194`** (1 nodes): `discount-modal-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 195`** (1 nodes): `runtime-cart-settings-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 196`** (1 nodes): `side-panel-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 197`** (1 nodes): `tier-floating-runtime-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 198`** (1 nodes): `modal-product-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 199`** (1 nodes): `footer-selection-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 200`** (1 nodes): `initial-render-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 201`** (1 nodes): `box-selection-sidebar-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 202`** (1 nodes): `product-card-footer-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 203`** (1 nodes): `timeline-banner-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 204`** (1 nodes): `analytics-config-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 205`** (1 nodes): `search-category-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 206`** (1 nodes): `compact-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 207`** (1 nodes): `horizontal-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 208`** (1 nodes): `standard-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 209`** (1 nodes): `compact.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 210`** (1 nodes): `classic-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 211`** (1 nodes): `horizontal.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 212`** (1 nodes): `standard.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 213`** (1 nodes): `classic.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 214`** (1 nodes): `variant-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 215`** (1 nodes): `config-lifecycle-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 216`** (1 nodes): `dom-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 217`** (1 nodes): `widget-misc-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 218`** (1 nodes): `footer-modal-state-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 219`** (1 nodes): `selection-data-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 220`** (1 nodes): `default-product-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 221`** (1 nodes): `modal-state-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 222`** (1 nodes): `layout-shell-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 223`** (1 nodes): `product-data-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 224`** (1 nodes): `cart-methods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 225`** (1 nodes): `cognive-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 226`** (1 nodes): `vertical-slots.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 227`** (1 nodes): `list.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 228`** (1 nodes): `cascade-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 229`** (1 nodes): `modal-slot-template.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 230`** (1 nodes): `horizontal-slots.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 231`** (1 nodes): `grid.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 232`** (1 nodes): `constants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 233`** (1 nodes): `full-page-preset.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 234`** (1 nodes): `condition-validator.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 235`** (1 nodes): `styleMock.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 236`** (1 nodes): `client.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 237`** (1 nodes): `cart-transform-run-query.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 238`** (1 nodes): `checkout-ui-eb-native-parity.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 239`** (1 nodes): `settings-controls-runtime.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 240`** (1 nodes): `billing-route-i18n.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 241`** (1 nodes): `create-bundle-wizard-i18n.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 242`** (1 nodes): `shared-selected-summary.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 243`** (1 nodes): `ppb-auto-next-rules.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 244`** (1 nodes): `fpb-discount-display-toggles.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 245`** (1 nodes): `variant-selector-policy.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 246`** (1 nodes): `fpb-horizontal-shared-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 247`** (1 nodes): `mixin-descriptors.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 248`** (1 nodes): `fpb-standard-shared-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 249`** (1 nodes): `fpb-standard-mobile-variant-drawer.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 250`** (1 nodes): `fpb-compact-shared-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 251`** (1 nodes): `shared-product-card.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 252`** (1 nodes): `shared-step-timeline-state.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 253`** (1 nodes): `template-manager.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 254`** (1 nodes): `fpb-auto-next-rules.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 255`** (1 nodes): `fpb-category-collection-rule-validation.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 256`** (1 nodes): `fpb-runtime-config-surface.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 257`** (1 nodes): `fpb-summary-current-step-removal.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 258`** (1 nodes): `template-installer-methods.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 259`** (1 nodes): `ppb-list-selected-entries.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 260`** (1 nodes): `fpb-addon-active-tier-products.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 261`** (1 nodes): `currency-manager.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 262`** (1 nodes): `fpb-template-registry.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 263`** (1 nodes): `shared-discount-progress.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 264`** (1 nodes): `widget-build-shared-modules.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 265`** (1 nodes): `fpb-classic-shared-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 266`** (1 nodes): `bundle-widget-product-slots-enabled.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 267`** (1 nodes): `product-page-card-copy.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 268`** (1 nodes): `bundle-data-manager.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 269`** (1 nodes): `fpb-checkout-line-properties.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 270`** (1 nodes): `ppb-template-registry.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 271`** (1 nodes): `shared-product-card-button.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 272`** (1 nodes): `admin-root-link-warnings.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 273`** (1 nodes): `settings-controls-runtime-route-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 274`** (1 nodes): `app-mantle-provider.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 275`** (1 nodes): `modal-utils-close-contract.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 276`** (1 nodes): `create-wizard-contextual-savebar.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 277`** (1 nodes): `app.attribution.route-shell.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 278`** (1 nodes): `mantle-provider.server.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 279`** (1 nodes): `shopify-after-auth-offline-admin.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 280`** (1 nodes): `vitest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 281`** (1 nodes): `default.test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 282`** (1 nodes): `shopify.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 283`** (1 nodes): `lib.rs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CachedSessionStorage` connect `Community 28` to `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `BillingService` connect `Community 53` to `Community 0`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `AppLogger` connect `Community 59` to `Community 0`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `WidgetInstallationService`, `ComponentParent`, `PriceAdjustmentConfig` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._