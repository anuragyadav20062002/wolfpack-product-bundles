export function installModalSlotTemplate(BundleWidgetProductPage) {
  const prototype = BundleWidgetProductPage.prototype;

  prototype._isProductPageModalSlotTemplate = function() {
    return this._getProductPageTemplateType() === 'PDP_MODAL';
  };

  prototype._usesVerticalModalSlotLayout = function() {
    if (this._getProductPageTemplateType() !== 'PDP_MODAL') return false;

    const stackedSetting = this.selectedBundle?.renderFilledSlotsAsHorizontalStacked;
    if (typeof stackedSetting === 'boolean') return stackedSetting !== true;

    return this._getProductPageDesignPreset() === 'SIMPLIFIED';
  };

  prototype.syncProductPagePrimaryCtaStyle = function() {
    const button = this.elements?.addToCartButton;
    if (!button) return;

    button.classList.toggle(
      'bw-ppb-primary-cta--modal-vertical',
      this._getProductPageTemplateType() === 'PDP_MODAL' && this._usesVerticalModalSlotLayout()
    );
  };

  prototype._createModalSlotStepSection = function(step) {
    const section = document.createElement('div');
    const isVertical = this._usesVerticalModalSlotLayout();

    section.className = `bw-ppb-modal-slot-section${isVertical ? ' bw-ppb-modal-slot-section--simplified' : ''}`;

    const title = document.createElement('div');
    title.className = 'bw-ppb-modal-slot-title';
    title.textContent = step.pageTitle || step.name || '';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = `bw-ppb-modal-slot-grid${isVertical ? ' bw-ppb-modal-slot-grid--simplified' : ''}`;
    section.appendChild(grid);

    return section;
  };

  // Create an empty state card for a step (shown when no products selected)
  prototype.createEmptyStateCard = function(step, stepIndex, instanceIndex = 0) {
    const stepBox = document.createElement('div');
    stepBox.dataset.stepIndex = stepIndex;

    stepBox.className = 'step-box bw-slot-card bw-slot-card--empty';

    const imgUrl = step.categoryImageUrl || null;
    const isModalSlotTemplate = this._isProductPageModalSlotTemplate();
    if (imgUrl && !isModalSlotTemplate) {
      stepBox.style.backgroundImage = `url('${imgUrl}')`;
      stepBox.style.backgroundSize = 'contain';
      stepBox.style.backgroundRepeat = 'no-repeat';
      stepBox.style.backgroundPosition = 'center';
    }

    if (isModalSlotTemplate) {
      const visual = document.createElement('div');
      visual.className = 'bw-slot-card__empty-visual';
      if (imgUrl) {
        visual.style.backgroundImage = `url('${imgUrl}')`;
      }
      stepBox.appendChild(visual);
    } else {
      // Circular background wrapper for the plus icon
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'bw-slot-card__plus-icon';
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
      iconWrapper.style.setProperty('--bw-slot-icon-color', primaryColor);
      this._appendSlotIcon(iconWrapper);
      stepBox.appendChild(iconWrapper);
    }

    // Step name label below icon
    const slotNumber = instanceIndex + 1;
    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = isModalSlotTemplate ? `Product ${slotNumber}` : step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(label);

    // Click handler to open modal
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  };

  prototype._appendSlotIcon = function(iconWrapper) {
    const productSlotIconUrl = this.selectedBundle?.productSlotIconUrl || null;
    if (productSlotIconUrl) {
      const slotIconImg = document.createElement('img');
      slotIconImg.src = productSlotIconUrl;
      slotIconImg.alt = '';
      slotIconImg.className = 'bw-slot-card__slot-icon-img';
      iconWrapper.appendChild(slotIconImg);
      return;
    }

    iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
    </svg>`;
  };
}
