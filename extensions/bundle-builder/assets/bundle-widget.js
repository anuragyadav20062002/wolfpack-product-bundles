class BundleBuilder {
  constructor(container) {
    this.container = container
    this.bundleId = container.dataset.bundleId || this.generateBundleId()
    this.steps = container.querySelectorAll(".bundle-builder__step")
    this.modal = container.querySelector(".bundle-builder__modal")
    this.modalContent = this.modal?.querySelector(".bundle-builder__modal-content")
    this.modalSubtitle = this.modal?.querySelector(".bundle-builder__modal-subtitle-main")
    this.modalSubtitleSub = this.modal?.querySelector(".bundle-builder__modal-subtitle-sub")
    this.modalProductsContainer = this.modal?.querySelector(".bundle-builder__products-row")
    this.selectedProducts = new Map()
    this.bundleName = container.dataset.bundleName || "Custom Bundle"
    this.currentStep = null
    this.currentStepIndex = 0
    this.shopifyMoneyFormat = window.Shopify?.money_format || "Rs. {{amount}}"
    this.defaultImageUrl = "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
    this.productImages = new Map() // Cache for product images
    this.totalPrice = 0
    this.selectionCounter = this.modal?.querySelector(".bundle-builder__selection-counter span")
    this.prevButton = this.modal?.querySelector(".bundle-builder__nav-button--prev")
    this.nextButton = this.modal?.querySelector(".bundle-builder__nav-button--next")

    console.log("Bundle Builder initialized with bundle ID:", this.bundleId)
    this.init()
  }

  // Generate a unique bundle ID if none provided
  generateBundleId() {
    return "bundle_" + Math.random().toString(36).substring(2, 10)
  }

  init() {
    // Step toggle buttons open modal
    this.steps.forEach((step, index) => {
      const toggle = step.querySelector(".bundle-builder__step-toggle")
      toggle?.addEventListener("click", () => {
        this.currentStepIndex = index
        this.openModal(step)
      })
    })

    // Modal close button
    const closeBtn = this.modal?.querySelector(".bundle-builder__modal-close")
    closeBtn?.addEventListener("click", () => this.closeModal())

    // Modal cancel button
    const cancelBtn = this.modal?.querySelector(".bundle-builder__modal-cancel")
    cancelBtn?.addEventListener("click", () => this.closeModal())

    // Modal confirm button
    const confirmBtn = this.modal?.querySelector(".bundle-builder__modal-confirm")
    confirmBtn?.addEventListener("click", () => this.confirmSelection())

    // Close modal on outside click
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })

    // Add cart button listener
    const addToCartBtn = this.container.querySelector(".bundle-builder__add-cart")
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => this.addToCart())
    }

    // Step tabs in modal
    const stepTabs = this.modal?.querySelectorAll(".bundle-builder__step-tab")
    if (stepTabs) {
      stepTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
          const stepId = tab.dataset.stepId
          const step = this.getStepByID(stepId)
          if (step) {
            // Update current step index
            this.currentStepIndex = index

            // Update active tab
            stepTabs.forEach((t) => t.classList.remove("active"))
            tab.classList.add("active")

            // Open the selected step in the modal
            this.openModal(step)
          }
        })
      })
    }

    // Navigation buttons
    if (this.prevButton) {
      this.prevButton.addEventListener("click", () => this.navigateStep(-1))
    }

    if (this.nextButton) {
      this.nextButton.addEventListener("click", () => this.navigateStep(1))
    }
  }

  // Navigate between steps
  navigateStep(direction) {
    const newIndex = this.currentStepIndex + direction

    // Check if the new index is valid
    if (newIndex >= 0 && newIndex < this.steps.length) {
      this.currentStepIndex = newIndex
      const step = this.steps[this.currentStepIndex]
      this.openModal(step)
    }
  }

  // Update the openModal method to include step tabs and navigation
  openModal(step) {
    if (!this.modal || !this.modalProductsContainer) return

    this.currentStep = step
    const stepId = step.dataset.stepId
    const stepTitle = step.querySelector(".bundle-builder__step-title")?.textContent
    const stepProducts = step.querySelector(".bundle-builder__step-products")
    const minQuantity = Number.parseInt(step.dataset.minQuantity || "1", 10)
    const maxQuantity = Number.parseInt(step.dataset.maxQuantity || "1", 10)

    console.log("Opening modal for step:", stepId, "with", stepProducts?.children.length || 0, "products")

    // Update active tab
    const stepTabs = this.modal?.querySelectorAll(".bundle-builder__step-tab")
    if (stepTabs) {
      stepTabs.forEach((tab, index) => {
        if (tab.dataset.stepId === stepId) {
          tab.classList.add("active")
        } else {
          tab.classList.remove("active")
        }
      })
    }

    // Set modal subtitle
    if (this.modalSubtitle) {
      const stepName = stepTitle || "Products"
      this.modalSubtitle.textContent = `Select ${stepName}`
    }

    if (this.modalSubtitleSub) {
      if (minQuantity === maxQuantity) {
        this.modalSubtitleSub.textContent = `Add ${minQuantity} product(s) to get the bundle`
      } else {
        this.modalSubtitleSub.textContent = `Add ${minQuantity}-${maxQuantity} product(s) to get the bundle`
      }
    }

    // Store current step ID
    this.modal.dataset.currentStepId = stepId

    // Clear previous products
    this.modalProductsContainer.innerHTML = ""

    // Move products to modal
    if (stepProducts) {
      const products = stepProducts.querySelectorAll(".bundle-builder__product")
      console.log(`Found ${products.length} products in step ${stepId}`)

      products.forEach((product, index) => {
        const productId = product.dataset.productId
        console.log(`Processing product ${index + 1}:`, productId)

        // Log the full HTML to debug
        console.log("Product HTML:", product.outerHTML)

        const clone = this.createProductCard(product, minQuantity, maxQuantity)
        this.modalProductsContainer.appendChild(clone)
      })
    }

    // Update navigation buttons
    this.updateNavigationButtons()

    // Update selection counter
    this.updateSelectionCounter()

    // Initialize "Add to Cart" buttons state
    this.updateAddButtonsState()

    // Show modal
    this.modal.classList.add("is-open")
    document.body.style.overflow = "hidden"
  }

  // Update navigation buttons based on current step
  updateNavigationButtons() {
    if (this.prevButton && this.nextButton) {
      // Disable prev button if we're on the first step
      this.prevButton.disabled = this.currentStepIndex === 0

      // Disable next button if we're on the last step
      this.nextButton.disabled = this.currentStepIndex === this.steps.length - 1
    }
  }

  // Update the selection counter
  updateSelectionCounter() {
    if (this.selectionCounter && this.currentStep) {
      const stepId = this.currentStep.dataset.stepId
      const step = this.getStepByID(stepId)

      if (step) {
        const selectedProducts = this.modalProductsContainer?.querySelectorAll(".bundle-builder__product.is-selected")

        // Calculate total quantity across all selected products
        let totalQuantity = 0
        selectedProducts?.forEach((product) => {
          const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
          totalQuantity += quantity
        })

        this.selectionCounter.textContent = totalQuantity.toString()
      }
    }
  }

  // Format money according to Shopify's format
  formatMoney(cents, format) {
    if (typeof cents === "string") {
      cents = cents.replace(".", "")
    }

    let value = ""
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
    const formatString = format || this.shopifyMoneyFormat

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ","
      decimal = decimal || "."

      if (isNaN(number) || number === null) {
        return 0
      }

      number = (number / 100.0).toFixed(precision)

      const parts = number.split(".")
      const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands)
      const centsAmount = parts[1] ? decimal + parts[1] : ""

      return dollarsAmount + centsAmount
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2)
        break
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0)
        break
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",")
        break
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",")
        break
      case "amount_with_space_separator":
        value = formatWithDelimiters(cents, 2, " ", ".")
        break
    }

    return formatString.replace(placeholderRegex, value)
  }

  // Update the createProductCard method for a cleaner design
  createProductCard(product, minQuantity, maxQuantity) {
    // Create a new product card element
    const clone = document.createElement("div")
    clone.className = "bundle-builder__product"

    // Copy all data attributes
    for (const attr of product.attributes) {
      if (attr.name.startsWith("data-")) {
        clone.setAttribute(attr.name, attr.value)
      }
    }

    const productId = product.dataset.productId
    const productTitle = product.querySelector(".bundle-builder__product-title")?.textContent || "Product"
    const cleanProductId = product.dataset.cleanProductId || this.cleanProductId(productId)

    // Get image URL from data attribute
    let imageUrl = product.dataset.imageUrl

    // If no image URL is found, use default placeholder
    if (!imageUrl || imageUrl.trim() === "") {
      imageUrl = this.defaultImageUrl
      console.log(`No image URL for product ${cleanProductId}, using default placeholder`)
    } else {
      console.log(`Using image URL for product ${cleanProductId}: ${imageUrl}`)

      // Store in cache for future use
      this.productImages.set(cleanProductId, imageUrl)
    }

    console.log("Creating product card for:", productId, productTitle)

    // Get variants data
    let variantsData = []
    try {
      const variantsAttr = product.dataset.variants
      if (variantsAttr) {
        variantsData = JSON.parse(variantsAttr)
        console.log("Parsed variants data:", variantsData)
      }
    } catch (error) {
      console.error("Error parsing variants data:", error)
    }

    // Determine if product has multiple variants
    const hasMultipleVariants = Array.isArray(variantsData) && variantsData.length > 1

    // Get the default variant
    let defaultVariant = null
    const defaultVariantId = product.dataset.variantId

    if (variantsData.length > 0) {
      defaultVariant =
        variantsData.find((v) => this.cleanVariantId(v.id) === this.cleanVariantId(defaultVariantId)) || variantsData[0]
    }

    // Get price display
    let priceDisplay = ""
    if (defaultVariant) {
      console.log("Default variant price:", defaultVariant.price)
      // Multiply by 100 to convert dollars to cents for the formatMoney function
      const priceInCents = Number.parseFloat(defaultVariant.price) * 100
      priceDisplay = this.formatMoney(priceInCents)

      // Add compare at price if available
      if (defaultVariant.compareAtPrice) {
        const compareAtPriceInCents = Number.parseFloat(defaultVariant.compareAtPrice) * 100
        priceDisplay = `<span class="bundle-builder__product-compare-price">${this.formatMoney(compareAtPriceInCents)}</span> ${priceDisplay}`
      }
    }

    // Create variant selector options if needed
    let variantOptions = ""
    if (hasMultipleVariants) {
      variantsData.forEach((variant) => {
        const variantId = this.cleanVariantId(variant.id)
        const isSelected = variantId === this.cleanVariantId(defaultVariantId)
        const priceInCents = Number.parseFloat(variant.price) * 100
        variantOptions += `<option value="${variantId}" ${isSelected ? "selected" : ""}>${variant.title}</option>`
      })
    }

    // Build variant selector HTML if needed
    const variantSelectorHtml = hasMultipleVariants
      ? `<div class="bundle-builder__variant-selector">
      <select class="bundle-builder__variant-select">
        ${variantOptions}
      </select>
    </div>`
      : ""

    // Build the HTML structure - cleaner, more compact design
    clone.innerHTML = `
  <div class="bundle-builder__product-image-container">
    <div class="bundle-builder__product-image">
      <img src="${imageUrl}" 
           alt="${productTitle}" 
           loading="lazy"
           data-product-id="${cleanProductId}"
           onerror="this.onerror=null; this.src='${this.defaultImageUrl}';">
    </div>
  </div>
  <div class="bundle-builder__product-info">
    <h4 class="bundle-builder__product-title">${productTitle}</h4>
    <div class="bundle-builder__product-price">${priceDisplay}</div>
    ${variantSelectorHtml}
    <div class="bundle-builder__product-actions">
      <button type="button" class="bundle-builder__product-add">Add to Cart</button>
      <div class="bundle-builder__quantity-selector" style="display: none;">
        <button type="button" class="bundle-builder__quantity-btn bundle-builder__quantity-decrease">-</button>
        <input type="number" class="bundle-builder__quantity-value" value="1" min="1" max="${maxQuantity}" readonly>
        <button type="button" class="bundle-builder__quantity-btn bundle-builder__quantity-increase">+</button>
      </div>
    </div>
  </div>
`

    // Store the current variant ID
    if (defaultVariant) {
      clone.dataset.currentVariantId = this.cleanVariantId(defaultVariant.id)
    }

    // Add event listeners
    const addButton = clone.querySelector(".bundle-builder__product-add")
    if (addButton) {
      addButton.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        this.selectProduct(clone)
      })
    }

    // Add variant selector event listener
    const variantSelect = clone.querySelector(".bundle-builder__variant-select")
    if (variantSelect) {
      variantSelect.addEventListener("change", (e) => {
        e.stopPropagation() // Prevent event bubbling
        this.updateVariant(clone, e.target.value, variantsData)
      })
    }

    // Make the product image and container clickable for selection/deselection
    const productImageContainer = clone.querySelector(".bundle-builder__product-image-container")
    if (productImageContainer) {
      productImageContainer.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        if (clone.classList.contains("is-selected")) {
          this.deselectProduct(clone)
        } else {
          this.selectProduct(clone)
        }
      })
    }

    const productTitleEl = clone.querySelector(".bundle-builder__product-title")
    if (productTitleEl) {
      productTitleEl.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        if (clone.classList.contains("is-selected")) {
          this.deselectProduct(clone)
        } else {
          this.selectProduct(clone)
        }
      })
    }

    const decreaseBtn = clone.querySelector(".bundle-builder__quantity-decrease")
    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        this.changeQuantity(clone, -1)
      })
    }

    const increaseBtn = clone.querySelector(".bundle-builder__quantity-increase")
    if (increaseBtn) {
      increaseBtn.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent event bubbling
        this.changeQuantity(clone, 1)
      })
    }

    // Restore selected state if product was previously selected
    if (product.classList.contains("is-selected")) {
      clone.classList.add("is-selected")
      const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
      const quantityInput = clone.querySelector(".bundle-builder__quantity-value")
      if (quantityInput) {
        quantityInput.value = quantity
      }

      // Show quantity selector and hide add button for selected products
      const quantitySelector = clone.querySelector(".bundle-builder__quantity-selector")
      if (quantitySelector) {
        quantitySelector.style.display = "flex"
      }
      if (addButton) {
        addButton.style.display = "none"
      }

      this.updateQuantityButtons(clone)
    }

    return clone
  }

  // Clean product ID from various formats
  cleanProductId(productId) {
    if (!productId) return null

    // Convert to string if it's not already
    productId = String(productId)

    // Handle different ID formats
    if (productId.includes("gid://shopify/Product/")) {
      // GraphQL ID format: gid://shopify/Product/12345
      return productId.split("/").pop()
    } else if (productId.includes("/")) {
      // Another possible GraphQL format
      return productId.split("/").pop()
    } else if (productId.includes(":")) {
      // Another possible format: shopify:product:12345
      return productId.split(":").pop()
    }

    return productId
  }

  // Add method to update variant
  updateVariant(product, variantId, variantsData) {
    // Find the variant in the data
    const variant = variantsData.find((v) => this.cleanVariantId(v.id) === variantId)
    if (!variant) return

    console.log("Updating variant to:", variant)

    // Update the current variant ID
    product.dataset.currentVariantId = variantId

    // Update price display
    const priceElement = product.querySelector(".bundle-builder__product-price")
    if (priceElement) {
      let priceHtml = ""

      // Add compare at price if available
      if (variant.compareAtPrice) {
        const compareAtPriceInCents = Number.parseFloat(variant.compareAtPrice) * 100
        priceHtml += `<span class="bundle-builder__product-compare-price">${this.formatMoney(compareAtPriceInCents)}</span> `
      }

      const priceInCents = Number.parseFloat(variant.price) * 100
      priceHtml += this.formatMoney(priceInCents)
      priceElement.innerHTML = priceHtml
    }

    // Update the original product's variant ID
    const stepId = this.modal?.dataset.currentStepId
    if (stepId) {
      const step = this.getStepByID(stepId)
      const productId = product.dataset.productId
      const originalProduct = step?.querySelector(
        `.bundle-builder__step-products .bundle-builder__product[data-product-id="${productId}"]`,
      )
      if (originalProduct) {
        originalProduct.dataset.variantId = variant.id
        originalProduct.dataset.currentVariantId = variantId
      }
    }
  }

  // Update the selectProduct method to enforce selection limits
  selectProduct(product) {
    const stepId = this.modal?.dataset.currentStepId
    if (!stepId) return

    const step = this.getStepByID(stepId)
    if (!step) return

    const minQuantity = Number.parseInt(step.dataset.minQuantity || "1", 10)
    const maxQuantity = Number.parseInt(step.dataset.maxQuantity || "1", 10)

    // Check if this product is already selected
    if (product.classList.contains("is-selected")) {
      // If already selected, deselect it
      this.deselectProduct(product)
      return
    }

    // Calculate current total quantity across all selected products
    const selectedProducts = this.modalProductsContainer?.querySelectorAll(".bundle-builder__product.is-selected")
    let currentTotalQuantity = 0
    selectedProducts?.forEach((selectedProduct) => {
      const quantity = Number.parseInt(selectedProduct.dataset.quantity || "1", 10)
      currentTotalQuantity += quantity
    })

    // STRICT ENFORCEMENT: Check if we've reached the maximum allowed total quantity
    if (currentTotalQuantity >= maxQuantity) {
      alert(`You can only select a total of ${maxQuantity} product(s) for this step.`)
      return
    }

    // Add selected class
    product.classList.add("is-selected")
    product.dataset.quantity = "1"

    // Show quantity selector and hide add button
    const addButton = product.querySelector(".bundle-builder__product-add")
    const quantitySelector = product.querySelector(".bundle-builder__quantity-selector")

    if (addButton) {
      addButton.style.display = "none"
    }

    if (quantitySelector) {
      quantitySelector.style.display = "flex"
    }

    // Update quantity buttons
    this.updateQuantityButtons(product)

    // Update the original product's selected state
    const productId = product.dataset.productId
    const currentVariantId = product.dataset.currentVariantId || product.dataset.variantId
    const originalProduct = step.querySelector(
      `.bundle-builder__step-products .bundle-builder__product[data-product-id="${productId}"]`,
    )
    if (originalProduct) {
      originalProduct.classList.add("is-selected")
      originalProduct.dataset.quantity = "1"
      if (currentVariantId) {
        originalProduct.dataset.currentVariantId = currentVariantId
      }
    }

    // Update selection counter
    this.updateSelectionCounter()

    // Update "Add to Cart" buttons state after selection
    this.updateAddButtonsState()

    console.log(`Selected product: ${productId} with variant: ${currentVariantId}`)
  }

  // Add a new method to update the state of all "Add to Cart" buttons based on selection limit
  updateAddButtonsState() {
    if (!this.currentStep || !this.modalProductsContainer) return

    const maxQuantity = Number.parseInt(this.currentStep.dataset.maxQuantity || "1", 10)

    // Calculate current total quantity across all selected products
    const selectedProducts = this.modalProductsContainer.querySelectorAll(".bundle-builder__product.is-selected")
    let currentTotalQuantity = 0
    selectedProducts.forEach((product) => {
      const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
      currentTotalQuantity += quantity
    })

    // If we've reached the maximum total quantity, disable all non-selected product "Add to Cart" buttons
    if (currentTotalQuantity >= maxQuantity) {
      const nonSelectedProducts = this.modalProductsContainer.querySelectorAll(
        ".bundle-builder__product:not(.is-selected)",
      )
      nonSelectedProducts.forEach((product) => {
        const addButton = product.querySelector(".bundle-builder__product-add")
        if (addButton) {
          addButton.disabled = true
          addButton.textContent = "Maximum reached"
        }
      })
    } else {
      // Otherwise, enable all "Add to Cart" buttons
      const allProducts = this.modalProductsContainer.querySelectorAll(".bundle-builder__product:not(.is-selected)")
      allProducts.forEach((product) => {
        const addButton = product.querySelector(".bundle-builder__product-add")
        if (addButton) {
          addButton.disabled = false
          addButton.textContent = "Add to Cart"
        }
      })
    }

    // Also update quantity increase buttons for selected products
    selectedProducts.forEach((product) => {
      const quantityInput = product.querySelector(".bundle-builder__quantity-value")
      const increaseBtn = product.querySelector(".bundle-builder__quantity-increase")

      if (quantityInput && increaseBtn) {
        const currentQuantity = Number.parseInt(quantityInput.value, 10)
        // Disable increase button if adding one more would exceed the maximum
        increaseBtn.disabled = currentTotalQuantity - currentQuantity + (currentQuantity + 1) > maxQuantity
      }
    })
  }

  // Update the deselectProduct method to re-enable "Add to Cart" buttons when a product is deselected
  deselectProduct(product) {
    const stepId = this.modal?.dataset.currentStepId
    if (!stepId) return

    const step = this.getStepByID(stepId)
    if (!step) return

    product.classList.remove("is-selected")
    delete product.dataset.quantity

    // Hide quantity selector and show add button
    const addButton = product.querySelector(".bundle-builder__product-add")
    const quantitySelector = product.querySelector(".bundle-builder__quantity-selector")

    if (addButton) {
      addButton.style.display = "block"
    }

    if (quantitySelector) {
      quantitySelector.style.display = "none"
    }

    // Update the original product's selected state
    const productId = product.dataset.productId
    const originalProduct = step.querySelector(
      `.bundle-builder__step-products .bundle-builder__product[data-product-id="${productId}"]`,
    )
    if (originalProduct) {
      originalProduct.classList.remove("is-selected")
      delete originalProduct.dataset.quantity
    }

    // Update selection counter
    this.updateSelectionCounter()

    // Update "Add to Cart" buttons state after deselection
    this.updateAddButtonsState()
  }

  // Update the changeQuantity method to handle deselection when quantity is 0
  changeQuantity(product, change) {
    const quantityInput = product.querySelector(".bundle-builder__quantity-value")
    if (!quantityInput) return

    const currentQuantity = Number.parseInt(quantityInput.value, 10)
    const minQuantity = Number.parseInt(quantityInput.min, 10) || 1

    // If decreasing to 0, deselect the product
    if (currentQuantity + change < 1) {
      this.deselectProduct(product)
      return
    }

    // Get the maximum allowed from the step
    const stepId = this.modal?.dataset.currentStepId
    const step = this.getStepByID(stepId)
    const maxStepQuantity = Number.parseInt(step?.dataset.maxQuantity || "1", 10)

    // Calculate current total quantity across all selected products
    const selectedProducts = this.modalProductsContainer?.querySelectorAll(".bundle-builder__product.is-selected")
    let totalQuantity = 0
    selectedProducts?.forEach((selectedProduct) => {
      if (selectedProduct !== product) {
        // Don't count the current product
        const qty = Number.parseInt(selectedProduct.dataset.quantity || "1", 10)
        totalQuantity += qty
      }
    })

    // Check if new quantity would exceed the maximum for the step
    const newQuantity = currentQuantity + change
    if (totalQuantity + newQuantity > maxStepQuantity) {
      alert(`You can only select a total of ${maxStepQuantity} product(s) for this step.`)
      return
    }

    // Enforce min constraint
    const finalQuantity = Math.max(minQuantity, newQuantity)

    // Update quantity
    quantityInput.value = finalQuantity
    product.dataset.quantity = finalQuantity.toString()

    // Update the original product
    if (stepId) {
      const productId = product.dataset.productId
      const originalProduct = step?.querySelector(
        `.bundle-builder__step-products .bundle-builder__product[data-product-id="${productId}"]`,
      )
      if (originalProduct) {
        originalProduct.dataset.quantity = finalQuantity.toString()
      }
    }

    this.updateQuantityButtons(product)

    // Update selection counter and add button states
    this.updateSelectionCounter()
    this.updateAddButtonsState()
  }

  updateQuantityButtons(product) {
    const quantityInput = product.querySelector(".bundle-builder__quantity-value")
    const decreaseBtn = product.querySelector(".bundle-builder__quantity-decrease")
    const increaseBtn = product.querySelector(".bundle-builder__quantity-increase")

    if (!quantityInput || !decreaseBtn || !increaseBtn) return

    const currentQuantity = Number.parseInt(quantityInput.value, 10)
    const minQuantity = Number.parseInt(quantityInput.min, 10) || 1
    const maxQuantity = Number.parseInt(quantityInput.max, 10) || 99

    decreaseBtn.disabled = currentQuantity <= minQuantity
    increaseBtn.disabled = currentQuantity >= maxQuantity
  }

  // Also update the confirmSelection method to enforce minimum selection
  confirmSelection() {
    const stepId = this.modal?.dataset.currentStepId
    if (!stepId) return

    const step = this.getStepByID(stepId)
    if (!step) return

    const selectedProducts = this.modalProductsContainer?.querySelectorAll(".bundle-builder__product.is-selected")
    const countBadge = step.querySelector(".bundle-builder__selected-count")
    const stepToggle = step.querySelector(".bundle-builder__step-toggle")
    const stepIcon = step.querySelector(".bundle-builder__step-icon")

    // Calculate total quantity across all selected products
    let totalQuantity = 0
    selectedProducts?.forEach((product) => {
      const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
      totalQuantity += quantity
    })

    // Check if we have the minimum required selections
    const minQuantity = Number.parseInt(step.dataset.minQuantity || "1", 10)
    const maxQuantity = Number.parseInt(step.dataset.maxQuantity || "1", 10)

    if (totalQuantity < minQuantity) {
      alert(`Please select a total of at least ${minQuantity} product(s) for this step.`)
      return
    }

    if (totalQuantity > maxQuantity) {
      alert(`You can only select a total of ${maxQuantity} product(s) for this step.`)
      return
    }

    if (countBadge) {
      countBadge.textContent = totalQuantity.toString()
      countBadge.style.display = totalQuantity > 0 ? "block" : "none"
    }

    // Update the step icon to show the selected product image
    if (stepIcon && selectedProducts && selectedProducts.length > 0) {
      const firstSelectedProduct = selectedProducts[0]
      const productImage =
        firstSelectedProduct.querySelector(".bundle-builder__product-image img")?.src || this.defaultImageUrl
      const productTitle = firstSelectedProduct.querySelector(".bundle-builder__product-title")?.textContent || ""

      // Replace the plus icon with the product image
      stepIcon.innerHTML = `<img src="${productImage}" alt="${productTitle}" class="bundle-builder__step-selected-image">`

      // Add a selected class to the step
      step.classList.add("has-selection")
    } else if (stepIcon) {
      // Restore the original plus icon if no products are selected
      stepIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `
      step.classList.remove("has-selection")
    }

    this.updateSelection()

    // If there are more steps, navigate to the next one
    if (this.currentStepIndex < this.steps.length - 1) {
      this.navigateStep(1)
    } else {
      this.closeModal()
    }
  }

  getStepByID(stepId) {
    return this.container.querySelector(`.bundle-builder__step[data-step-id="${stepId}"]`)
  }

  updateSelection() {
    const addToCartBtn = this.container.querySelector(".bundle-builder__add-cart")
    const allStepsValid = Array.from(this.steps).every((step) => {
      const minQuantity = Number.parseInt(step.dataset.minQuantity || "1", 10)

      // Get all selected products in this step
      const selectedProducts = step.querySelectorAll(
        ".bundle-builder__step-products .bundle-builder__product.is-selected",
      )

      // Calculate total quantity
      let totalQuantity = 0
      selectedProducts.forEach((product) => {
        const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
        totalQuantity += quantity
      })

      // Show total quantity in the badge
      const countBadge = step.querySelector(".bundle-builder__selected-count")
      if (countBadge) {
        countBadge.textContent = totalQuantity.toString()
      }

      return totalQuantity >= minQuantity
    })

    if (addToCartBtn) {
      addToCartBtn.disabled = !allStepsValid

      // Calculate total price
      this.calculateTotalPrice()

      // Update the button text to include the price
      if (this.totalPrice > 0) {
        addToCartBtn.textContent = `Add Bundle to Cart • ${this.formatMoney(this.totalPrice)}`
      } else {
        addToCartBtn.textContent = "Add Bundle to Cart"
      }
    }
  }

  // Update the calculateTotalPrice method to account for quantity
  calculateTotalPrice() {
    this.totalPrice = 0

    // Loop through all steps and add up the prices of selected products
    this.steps.forEach((step) => {
      const selectedProducts = step.querySelectorAll(
        ".bundle-builder__step-products .bundle-builder__product.is-selected",
      )

      selectedProducts.forEach((product) => {
        try {
          // Get variant data
          const variantsAttr = product.dataset.variants
          if (variantsAttr) {
            const variantsData = JSON.parse(variantsAttr)
            const currentVariantId = product.dataset.currentVariantId || product.dataset.variantId
            const variant = variantsData.find(
              (v) => this.cleanVariantId(v.id) === this.cleanVariantId(currentVariantId),
            )

            if (variant && variant.price) {
              const quantity = Number.parseInt(product.dataset.quantity || "1", 10)
              const price = Number.parseFloat(variant.price) * 100 * quantity
              this.totalPrice += price
            }
          }
        } catch (error) {
          console.error("Error calculating price:", error)
        }
      })
    })
  }

  closeModal() {
    if (!this.modal) return

    this.modal.classList.remove("is-open")
    document.body.style.overflow = ""
    delete this.modal.dataset.currentStepId
    this.currentStep = null
  }

  // Add a new method to handle cart display
  async addToCart() {
    console.log("=== Adding bundle to cart ===")

    // Create items array for cart API
    const items = []
    let hasValidItems = false

    // Collect all selected products from each step
    this.steps.forEach((step) => {
      const stepId = step.dataset.stepId
      const selectedProducts = step.querySelectorAll(
        ".bundle-builder__step-products .bundle-builder__product.is-selected",
      )

      selectedProducts.forEach((product) => {
        try {
          const productId = product.dataset.productId
          console.log("Processing product:", productId)

          // Get variant ID - use currentVariantId if available, otherwise fall back to variantId
          let variantId = product.dataset.currentVariantId || product.dataset.variantId
          if (variantId) {
            variantId = this.cleanVariantId(variantId)
            console.log("Using variant ID:", variantId)

            // Get quantity
            const quantity = Number.parseInt(product.dataset.quantity || "1", 10)

            // Add to cart with minimal properties - no bundle information
            items.push({
              id: variantId,
              quantity: quantity,
            })

            hasValidItems = true
          } else {
            console.error("No variant ID found for product:", productId)
          }
        } catch (error) {
          console.error("Error processing product:", error, product)
        }
      })
    })

    if (!hasValidItems || items.length === 0) {
      console.error("No valid items to add to cart")
      alert("Please select products for all steps before adding to cart.")
      return
    }

    try {
      // Show loading state
      const addToCartBtn = this.container.querySelector(".bundle-builder__add-cart")
      if (addToCartBtn) {
        addToCartBtn.textContent = "Adding to cart..."
        addToCartBtn.disabled = true
      }

      console.log("Final items to add to cart:", items)

      // Add all items directly without parent/child relationship
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Cart error response:", errorData)
        throw new Error(errorData.description || "Failed to add items to cart")
      }

      const result = await response.json()
      console.log("Cart response:", result)

      // Redirect to cart page
      window.location.href = "/cart"
    } catch (error) {
      console.error("Error adding to cart:", error)

      // Reset button state
      const addToCartBtn = this.container.querySelector(".bundle-builder__add-cart")
      if (addToCartBtn) {
        this.calculateTotalPrice()
        if (this.totalPrice > 0) {
          addToCartBtn.textContent = `Add Bundle to Cart • ${this.formatMoney(this.totalPrice)}`
        } else {
          addToCartBtn.textContent = "Add Bundle to Cart"
        }
        addToCartBtn.disabled = false
      }

      // Show error message to user
      alert(`Failed to add items to cart: ${error.message}`)
    }
  }

  // Helper method to clean variant IDs
  cleanVariantId(variantId) {
    if (!variantId) return null

    // Convert to string if it's not already
    variantId = String(variantId)

    // Handle different ID formats
    if (variantId.includes("gid://shopify/ProductVariant/")) {
      // GraphQL ID format: gid://shopify/ProductVariant/12345
      return variantId.split("/").pop()
    } else if (variantId.includes("/")) {
      // Another possible GraphQL format
      return variantId.split("/").pop()
    } else if (variantId.includes(":")) {
      // Another possible format: shopify:variant:12345
      return variantId.split(":").pop()
    }

    return variantId
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  console.log("Bundle Builder script loaded")

  // Create a global object to store product data
  window.bundleBuilderData = window.bundleBuilderData || {}
  window.bundleBuilderData.products = window.bundleBuilderData.products || {}

  // Initialize bundle builders
  const containers = document.querySelectorAll(".bundle-builder")
  containers.forEach((container) => new BundleBuilder(container))
})

