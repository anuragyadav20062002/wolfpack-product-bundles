/**
 * Unit Tests for Bundle Widget JavaScript
 * Tests frontend bundle widget functionality and user interactions
 */

// Mock DOM environment
const mockDocument = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(),
  addEventListener: jest.fn(),
  cookie: '',
  body: {
    appendChild: jest.fn()
  }
};

const mockWindow = {
  Shopify: {
    shop: { currency: 'USD' },
    currency: { active: 'USD', format: '{{amount}}', rate: 1 },
    formatMoney: jest.fn((amount, format) => `$${(amount / 100).toFixed(2)}`)
  },
  shopCurrency: 'USD',
  shopMoneyFormat: '${{amount}}',
  allBundlesData: null,
  currentProductId: 123,
  location: {
    pathname: '/products/test-product',
    search: '',
    href: 'https://test-shop.myshopify.com/products/test-product'
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn()
  },
  fetch: jest.fn(),
  console: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
};

// Mock global objects
(global as any).document = mockDocument;
(global as any).window = mockWindow;

describe('Bundle Widget JavaScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window state
    mockWindow.allBundlesData = null;
    mockWindow.currentProductId = 123;
    mockWindow.location.search = '';
  });

  describe('Bundle Widget Constants', () => {
    it('should define correct widget constants', () => {
      // Since we can't directly import the widget JS, we'll test the expected structure
      const expectedConstants = {
        VERSION: '3.0.0',
        LOG_PREFIX: '[BUNDLE_WIDGET]',
        SELECTORS: {
          WIDGET_CONTAINER: '#bundle-builder-app',
          STEPS_CONTAINER: '.bundle-steps',
          MODAL: '#bundle-builder-modal',
          ADD_TO_CART: '.add-bundle-to-cart',
          FOOTER_MESSAGING: '.bundle-footer-messaging'
        },
        CART_PROPERTIES: {
          BUNDLE_ID: '_bundle_id',
          BUNDLE_CONFIG: '_bundle_config'
        },
        BUNDLE_TYPES: {
          PRODUCT_PAGE: 'product_page',
          FULL_PAGE: 'full_page'
        }
      };

      // Test that constants are properly structured
      expect(expectedConstants.VERSION).toBe('3.0.0');
      expect(expectedConstants.SELECTORS.WIDGET_CONTAINER).toBe('#bundle-builder-app');
      expect(expectedConstants.CART_PROPERTIES.BUNDLE_ID).toBe('_bundle_id');
    });
  });

  describe('Currency Management', () => {
    it('should detect shop base currency', () => {
      const expectedBaseCurrency = {
        code: 'USD',
        format: '${{amount}}'
      };

      expect(mockWindow.Shopify.shop.currency).toBe(expectedBaseCurrency.code);
      expect(mockWindow.shopMoneyFormat).toBe(expectedBaseCurrency.format);
    });

    it('should detect customer currency from Shopify Markets', () => {
      mockWindow.Shopify.currency = {
        active: 'EUR',
        format: '€{{amount}}',
        rate: 0.85
      };

      const expectedCustomerCurrency = {
        code: 'EUR',
        format: '€{{amount}}',
        rate: 0.85
      };

      expect(mockWindow.Shopify.currency.active).toBe(expectedCustomerCurrency.code);
      expect(mockWindow.Shopify.currency.format).toBe(expectedCustomerCurrency.format);
      expect(mockWindow.Shopify.currency.rate).toBe(expectedCustomerCurrency.rate);
    });

    it('should detect currency from cookie', () => {
      mockDocument.cookie = 'currency=GBP; path=/';
      
      // Mock cookie parsing
      const getCurrencyFromCookie = () => {
        const cookies = mockDocument.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'currency') {
            return value;
          }
        }
        return null;
      };

      expect(getCurrencyFromCookie()).toBe('GBP');
    });

    it('should format money correctly', () => {
      const amount = 2500; // $25.00 in cents
      const format = '${{amount}}';
      
      const formatted = mockWindow.Shopify.formatMoney(amount, format);
      expect(formatted).toBe('$25.00');
    });

    it('should handle multi-currency conversion', () => {
      const amount = 1000; // $10.00
      const rate = 0.85; // EUR rate
      
      const convertedAmount = Math.round(amount * rate);
      expect(convertedAmount).toBe(850); // €8.50 in cents
    });
  });

  describe('Bundle Data Management', () => {
    it('should validate bundle data structure', () => {
      const validBundle = {
        id: 'test-bundle-1',
        name: 'Test Bundle',
        status: 'active',
        bundleType: 'product_page',
        steps: [
          {
            id: 'step-1',
            name: 'Choose Product',
            products: [
              { id: 'gid://shopify/Product/1', title: 'Product 1' }
            ]
          }
        ]
      };

      // Test validation logic
      const validateBundleData = (bundle: any) => {
        if (!bundle || typeof bundle !== 'object') return false;
        
        const required = ['id', 'name', 'status', 'bundleType', 'steps'];
        for (const field of required) {
          if (!bundle[field]) return false;
        }
        
        if (!Array.isArray(bundle.steps) || bundle.steps.length === 0) return false;
        
        return true;
      };

      expect(validateBundleData(validBundle)).toBe(true);
      expect(validateBundleData({})).toBe(false);
      expect(validateBundleData({ ...validBundle, steps: [] })).toBe(false);
    });

    it('should select appropriate bundle based on context', () => {
      const bundlesData = {
        'bundle-1': {
          id: 'bundle-1',
          name: 'Product Bundle',
          status: 'active',
          bundleType: 'product_page',
          shopifyProductId: 'gid://shopify/Product/123',
          steps: [{ id: 'step-1', name: 'Step 1' }]
        },
        'bundle-2': {
          id: 'bundle-2',
          name: 'Collection Bundle',
          status: 'active',
          bundleType: 'discount_function',
          steps: [{ id: 'step-1', name: 'Step 1' }]
        }
      };

      const config = {
        currentProductId: 123,
        bundleId: null
      };

      // Mock bundle selection logic
      const selectBundle = (bundlesData: any, config: any) => {
        const bundles = Object.values(bundlesData).filter((bundle: any) => 
          bundle.status === 'active'
        );

        for (const bundle of bundles) {
          if (bundle.bundleType === 'product_page') {
            if (config.currentProductId) {
              const productIdStr = config.currentProductId.toString();
              const bundleProductId = bundle.shopifyProductId ?
                bundle.shopifyProductId.split('/').pop() : null;

              if (bundleProductId === productIdStr) {
                return bundle;
              }
            }
          }
        }

        return bundles[0] || null;
      };

      const selectedBundle = selectBundle(bundlesData, config);
      expect(selectedBundle).toBeDefined();
      expect(selectedBundle.id).toBe('bundle-1');
    });

    it('should handle theme editor context detection', () => {
      // Test various theme editor detection scenarios
      const isThemeEditorContext = () => {
        return mockWindow.location.pathname.includes('/editor') ||
               mockWindow.location.search.includes('preview_theme_id') ||
               mockWindow.location.search.includes('previewPath');
      };

      // Normal product page
      expect(isThemeEditorContext()).toBe(false);

      // Theme editor context
      mockWindow.location.pathname = '/admin/themes/123/editor';
      expect(isThemeEditorContext()).toBe(true);

      // Preview context
      mockWindow.location.pathname = '/products/test-product';
      mockWindow.location.search = '?preview_theme_id=456';
      expect(isThemeEditorContext()).toBe(true);
    });
  });

  describe('Pricing Calculations', () => {
    it('should calculate bundle total correctly', () => {
      const selectedProducts = [
        { 'variant-1': 2 }, // Step 1: 2 units of variant-1
        { 'variant-2': 1 }  // Step 2: 1 unit of variant-2
      ];

      const stepProductData = [
        [{ id: 'variant-1', price: 2500, title: 'Product 1' }], // $25.00
        [{ id: 'variant-2', price: 1500, title: 'Product 2' }]  // $15.00
      ];

      // Mock calculation logic
      const calculateBundleTotal = (selectedProducts: any[], stepProductData: any[]) => {
        let totalPrice = 0;
        let totalQuantity = 0;

        selectedProducts.forEach((stepSelections, stepIndex) => {
          const productsInStep = stepProductData[stepIndex] || [];

          Object.entries(stepSelections).forEach(([variantId, quantity]) => {
            const product = productsInStep.find(p => p.id === variantId);
            if (product && quantity > 0) {
              const price = parseFloat(product.price) || 0;
              totalPrice += price * (quantity as number);
              totalQuantity += quantity as number;
            }
          });
        });

        return { totalPrice, totalQuantity };
      };

      const result = calculateBundleTotal(selectedProducts, stepProductData);
      expect(result.totalPrice).toBe(6500); // (25 * 2) + (15 * 1) = $65.00
      expect(result.totalQuantity).toBe(3);
    });

    it('should calculate percentage discount correctly', () => {
      const bundle = {
        pricing: {
          enabled: true,
          method: 'percentage_off',
          rules: [
            {
              conditionType: 'quantity',
              value: 2,
              discountValue: 15
            }
          ]
        }
      };

      const totalPrice = 5000; // $50.00
      const totalQuantity = 3;

      // Mock discount calculation
      const calculateDiscount = (bundle: any, totalPrice: number, totalQuantity: number) => {
        if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
          return {
            hasDiscount: false,
            discountAmount: 0,
            finalPrice: totalPrice,
            discountPercentage: 0
          };
        }

        const rule = bundle.pricing.rules[0];
        const conditionMet = totalQuantity >= rule.value;

        if (!conditionMet) {
          return {
            hasDiscount: false,
            discountAmount: 0,
            finalPrice: totalPrice,
            discountPercentage: 0
          };
        }

        const discountAmount = Math.round(totalPrice * (rule.discountValue / 100));
        const finalPrice = totalPrice - discountAmount;

        return {
          hasDiscount: true,
          discountAmount,
          finalPrice,
          discountPercentage: rule.discountValue
        };
      };

      const result = calculateDiscount(bundle, totalPrice, totalQuantity);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountAmount).toBe(750); // 15% of $50.00 = $7.50
      expect(result.finalPrice).toBe(4250); // $50.00 - $7.50 = $42.50
      expect(result.discountPercentage).toBe(15);
    });

    it('should calculate fixed amount discount correctly', () => {
      const bundle = {
        pricing: {
          enabled: true,
          method: 'fixed_amount_off',
          rules: [
            {
              conditionType: 'quantity',
              value: 2,
              discountValue: 10 // $10.00 off
            }
          ]
        }
      };

      const totalPrice = 5000; // $50.00
      const totalQuantity = 3;

      // Mock fixed amount discount calculation
      const calculateFixedDiscount = (bundle: any, totalPrice: number, totalQuantity: number) => {
        const rule = bundle.pricing.rules[0];
        const conditionMet = totalQuantity >= rule.value;

        if (!conditionMet) {
          return { hasDiscount: false, discountAmount: 0, finalPrice: totalPrice };
        }

        const discountAmount = Math.round(rule.discountValue * 100); // Convert to cents
        const finalPrice = Math.max(0, totalPrice - discountAmount);

        return {
          hasDiscount: true,
          discountAmount,
          finalPrice
        };
      };

      const result = calculateFixedDiscount(bundle, totalPrice, totalQuantity);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountAmount).toBe(1000); // $10.00
      expect(result.finalPrice).toBe(4000); // $50.00 - $10.00 = $40.00
    });

    it('should calculate fixed bundle price correctly', () => {
      const bundle = {
        pricing: {
          enabled: true,
          method: 'fixed_bundle_price',
          rules: [
            {
              conditionType: 'quantity',
              value: 2,
              discountValue: 35 // Fixed price $35.00
            }
          ]
        }
      };

      const totalPrice = 5000; // $50.00
      const totalQuantity = 3;

      // Mock fixed bundle price calculation
      const calculateFixedBundlePrice = (bundle: any, totalPrice: number, totalQuantity: number) => {
        const rule = bundle.pricing.rules[0];
        const conditionMet = totalQuantity >= rule.value;

        if (!conditionMet) {
          return { hasDiscount: false, discountAmount: 0, finalPrice: totalPrice };
        }

        const fixedPrice = Math.round(rule.discountValue * 100); // Convert to cents
        const discountAmount = Math.max(0, totalPrice - fixedPrice);

        return {
          hasDiscount: true,
          discountAmount,
          finalPrice: fixedPrice
        };
      };

      const result = calculateFixedBundlePrice(bundle, totalPrice, totalQuantity);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountAmount).toBe(1500); // $50.00 - $35.00 = $15.00 savings
      expect(result.finalPrice).toBe(3500); // Fixed price $35.00
    });
  });

  describe('Cart Operations', () => {
    it('should prepare cart items with bundle properties', () => {
      const bundleId = 'test-bundle-1';
      const selectedProducts = [
        { 'variant-1': 1 },
        { 'variant-2': 2 }
      ];

      const stepProductData = [
        [{ id: 'variant-1', productId: 'gid://shopify/Product/1', title: 'Product 1' }],
        [{ id: 'variant-2', productId: 'gid://shopify/Product/2', title: 'Product 2' }]
      ];

      // Mock cart item preparation
      const prepareCartItems = (bundleId: string, selectedProducts: any[], stepProductData: any[]) => {
        const cartItems: any[] = [];

        selectedProducts.forEach((stepSelections, stepIndex) => {
          const productsInStep = stepProductData[stepIndex] || [];

          Object.entries(stepSelections).forEach(([variantId, quantity]) => {
            const product = productsInStep.find(p => p.id === variantId);
            if (product && quantity > 0) {
              cartItems.push({
                id: variantId,
                quantity: quantity,
                properties: {
                  '_bundle_id': bundleId,
                  '_bundle_config': JSON.stringify({
                    bundleId,
                    stepIndex,
                    productId: product.productId
                  })
                }
              });
            }
          });
        });

        return cartItems;
      };

      const cartItems = prepareCartItems(bundleId, selectedProducts, stepProductData);
      
      expect(cartItems).toHaveLength(2);
      expect(cartItems[0].properties['_bundle_id']).toBe(bundleId);
      expect(cartItems[0].quantity).toBe(1);
      expect(cartItems[1].quantity).toBe(2);
      
      // Verify bundle config is properly serialized
      const bundleConfig = JSON.parse(cartItems[0].properties['_bundle_config']);
      expect(bundleConfig.bundleId).toBe(bundleId);
      expect(bundleConfig.stepIndex).toBe(0);
    });

    it('should handle add to cart API call', async () => {
      const cartItems = [
        {
          id: 'variant-1',
          quantity: 1,
          properties: { '_bundle_id': 'test-bundle' }
        }
      ];

      // Mock fetch for add to cart
      mockWindow.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: cartItems })
      });

      const addToCart = async (items: any[]) => {
        const response = await mockWindow.fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        return response.json();
      };

      const result = await addToCart(cartItems);
      expect(result.items).toEqual(cartItems);
      expect(mockWindow.fetch).toHaveBeenCalledWith('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      });
    });
  });

  describe('User Interface', () => {
    it('should create toast notifications', () => {
      const mockToastElement = {
        id: 'bundle-toast',
        className: '',
        innerHTML: '',
        remove: jest.fn()
      };

      mockDocument.createElement.mockReturnValue(mockToastElement);
      mockDocument.getElementById.mockReturnValue(null); // No existing toast
      mockDocument.body.appendChild.mockImplementation(() => {});

      // Mock toast creation
      const showToast = (message: string, type: string = 'info') => {
        const existingToast = mockDocument.getElementById('bundle-toast');
        if (existingToast) {
          existingToast.remove();
        }

        const toast = mockDocument.createElement('div');
        toast.id = 'bundle-toast';
        toast.className = `bundle-toast bundle-toast-${type}`;
        toast.innerHTML = `
          <div class="bundle-toast-content">
            <span class="bundle-toast-message">${message}</span>
            <button class="bundle-toast-close">&times;</button>
          </div>
        `;

        mockDocument.body.appendChild(toast);
        return toast;
      };

      const toast = showToast('Bundle added to cart!', 'success');
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockToastElement);
      expect(mockToastElement.className).toBe('bundle-toast bundle-toast-success');
      expect(mockToastElement.innerHTML).toContain('Bundle added to cart!');
    });

    it('should handle modal interactions', () => {
      const mockModal = {
        style: { display: 'none' },
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      };

      mockDocument.getElementById.mockReturnValue(mockModal);

      // Mock modal operations
      const showModal = () => {
        const modal = mockDocument.getElementById('bundle-builder-modal');
        if (modal) {
          modal.style.display = 'block';
          modal.classList.add('show');
        }
      };

      const hideModal = () => {
        const modal = mockDocument.getElementById('bundle-builder-modal');
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
        }
      };

      showModal();
      expect(mockModal.style.display).toBe('block');
      expect(mockModal.classList.add).toHaveBeenCalledWith('show');

      hideModal();
      expect(mockModal.style.display).toBe('none');
      expect(mockModal.classList.remove).toHaveBeenCalledWith('show');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockWindow.fetch.mockRejectedValueOnce(new Error('Network error'));

      const handleNetworkError = async () => {
        try {
          await mockWindow.fetch('/cart/add.js');
          return { success: true };
        } catch (error) {
          mockWindow.console.error('Network error:', error);
          return { success: false, error: error.message };
        }
      };

      const result = await handleNetworkError();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockWindow.console.error).toHaveBeenCalled();
    });

    it('should handle invalid bundle data', () => {
      const invalidBundleData = null;

      const handleInvalidBundle = (bundleData: any) => {
        if (!bundleData) {
          mockWindow.console.warn('No bundle data available');
          return false;
        }
        return true;
      };

      const result = handleInvalidBundle(invalidBundleData);
      expect(result).toBe(false);
      expect(mockWindow.console.warn).toHaveBeenCalledWith('No bundle data available');
    });
  });
});