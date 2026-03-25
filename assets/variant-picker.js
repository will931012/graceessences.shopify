if (!window.Maximize.loadedScript.includes('variant-picker.js')) {
  window.Maximize.loadedScript.push("variant-picker.js");

  class VariantPicker extends HTMLElement {
    static cacheData = {};
    constructor() {
      super();
      this.pickerType = this.dataset.pickerType || 'swatch';
      this.productId = this.dataset.productId;
      this.sectionId = this.dataset.sectionId;
      this.productUrl = this.dataset.url;
      this.isMainProduct = this.dataset.mainProduct === 'true';
      this.optionElements = this.querySelectorAll(`.variant-option`);
      this.optionLabelElements = Array.from(this.querySelectorAll(`.variant-option__label`));
      this.optionsSelectedValues = [];
      this.isEnableStickyATC = this.dataset.enableStickyAtc === 'true';
      this.currentVariantInfoElement = document.querySelector(`#CurrentVariantInfo__${this.sectionId}`);
      this.addtionalCurrentVariantInfoElement = document.querySelector(`#AdditionalVariantInfo__${this.sectionId}`);
      this.currentVariant = JSON.parse(this.currentVariantInfoElement.textContent);
      this.sectionWrapper = document.getElementById(`shopify-section-${this.sectionId}`);
      if (this.currentVariant) {
        this.isOptionExist = true;
        this.isOptionAvailable = this.currentVariant.available;
      } else {
        this.isOptionExist = false;
      }
    }

    connectedCallback() {
      this.optionElements.forEach(el => {
        el.addEventListener('click', this.handleChangedOption.bind(this));
      })

      this.optionLabelElements.forEach(el => {
        el.addEventListener('keyup', el => {
          if (el.key === 'Enter' || el.key === ' ') {
            let optionInput = el.target.previousElementSibling;
            optionInput.click();
          }
        })
      })

      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', (event) => {
          if (event.detail.sectionId == this.sectionId) {
            VariantPicker.cacheData = {};
          };
        });
      }

      this.updateOptionSelectedValues();

      if (this.isEnableStickyATC) {
        this.__initEventSticky();
      }
    }

    handleChangedOption(event) {
      const targetOption = event.currentTarget;
      let position = targetOption.dataset.optionPosition;
      let listOptionSamePosition = this.querySelectorAll(`.variant-option[data-option-position='${position}']`);
      listOptionSamePosition.forEach(optionEle => {
        optionEle.classList[optionEle === targetOption ? 'add' : 'remove']('selected');
        optionEle.setAttribute("aria-selected", String(optionEle === targetOption));
      });
      const selectedOptionEle = this.querySelector(`.variant-option__selected-value[data-position='${position}']`);
      if (selectedOptionEle) {
        selectedOptionEle.innerHTML = targetOption.dataset.value;
      }

      this.updateOptionSelectedValues();
      this.__renderProductInfo();
    }

    updateOptionSelectedValues() {
      this.optionElements.forEach((optionEle) => {
        const optionPosition = optionEle.dataset.optionPosition;
        const idx = Number(optionPosition) - 1;
        if (optionEle.classList.contains('selected')) {
          this.optionsSelectedValues[idx] = optionEle.dataset.optionValueId;
        }
      });
    }

    async __renderProductInfo() {
      const buyButtonList = this.sectionWrapper.querySelectorAll(".product-info__buy-buttons-wrapper button")
      buyButtonList.forEach(button => {
        button.disabled = true
      });
      const url = `${this.productUrl}?option_values=${this.optionsSelectedValues.join(',')}&section_id=${this.sectionId}`;
      let productInfoHTML = VariantPicker.cacheData[url];
      if (!productInfoHTML) {
        try {
          const response = await fetch(url);
          const text = await response.text();
          productInfoHTML = new DOMParser().parseFromString(text, "text/html")
          VariantPicker.cacheData[url] = productInfoHTML;
        } catch (error) {
          console.error(error)
        }
      }

      const newVariantPickerEle = productInfoHTML.querySelector(`.section--${this.sectionId} variant-picker.variant-picker__wrapper`);
      this.dataset.currentVariantId = newVariantPickerEle?.dataset.currentVariantId || '';
      const variantId = this.dataset.currentVariantId;

      if (this.isMainProduct) {
        if (variantId.length > 0){
          window.history.replaceState({}, "", `${this.productUrl}?variant=${variantId}`);
        } else {
          window.history.replaceState({}, "", `${this.productUrl}`);
        }
      }

      this.__updateCurrentVariantInfo(productInfoHTML);

      if (this.currentVariant) {
        const selectors = [
          // ".product-info__variant-picker", // update price
          // ".product-info__price-wrapper", // update price
          // ".product-info__identifier-wrapper", // update sku, barcode
          // ".product-info__estimate-delivery-wrapper", // update estimate delivery
          // ".product-info__quantity-wrapper", // update quantity selector
          ".product-info__label-wrapper", // update labels
          // ".product-info__inventory-status-wrapper", // update inventory status
          // ".product-info__back-in-stock-alert-wrapper", // handled via blockSelectors below
          ".product-template__properties", // update properties of the product
          ".product-info__volume-pricing"
        ];

        const selectorsUpdateWhenAvailable = [
          '.product-info__estimate-delivery-wrapper',
          '.product-info__rating',
          '.product-info__label-wrapper',
          '.product-form__dynamic-checkout',
          `#PickupAvailability__${this.sectionId}`
        ]

        selectors.forEach(selector => {
          this.__updateElements(productInfoHTML, selector);
        });

        const blockSelectors = [
          ".product-info__estimate-delivery-wrapper",
          ".product-info__price-wrapper", // update price
          ".product-info__identifier-wrapper", // update sku, barcode
          ".product-info__inventory-status-wrapper",
          ".product-info__back-in-stock-alert-wrapper",
          ".product-info__quantity-wrapper"
        ];

        blockSelectors.forEach(selector => {
          this.__updateBlockElements(productInfoHTML, selector);
        });

        this.__updateTableOfInformation(productInfoHTML)

        selectorsUpdateWhenAvailable.forEach(selector => {
          const element = document.querySelector(`.section--${this.sectionId} ${selector}`);
          if (element) {
            element.classList.remove('is-unavailable');
          }
        })
      } else {
        this.__renderProductInfoWhenUnavailable();
      }

      this.__updateVariantPickerWhenChange(productInfoHTML);

      buyButtonList.forEach(button => {
        if (!button.ariaDisabled) {
          button.disabled = false;
        }
      });
      
      this.__dispatchChangeVariantEvent(productInfoHTML);

      if (this.isEnableStickyATC) {
        this.__renderStickyATC(productInfoHTML);
      }
    }

    __updateElements(productInfoHTML, selector) {
      const oldElement = document.querySelector(`.section--${this.sectionId} ${selector}`);
      const newElement = productInfoHTML.querySelector(`.section--${this.sectionId} ${selector}`);
      if (oldElement && newElement) {
        oldElement.innerHTML = newElement.innerHTML;
        if (oldElement.classList.contains('is-unavailable')) {
          oldElement.classList.remove('is-unavailable');
        }
      }
    }

    __updateBlockElements(productInfoHTML, selector) {
      const oldElements = document.querySelectorAll(`.section--${this.sectionId} ${selector}`);
      oldElements.forEach(oldEl => {
        const blockId = oldEl.dataset.blockId;
        const newEl = productInfoHTML.querySelector(
          `.section--${this.sectionId} ${selector}[data-block-id="${blockId}"]`
        );
        if (oldEl && newEl) {
          oldEl.innerHTML = newEl.innerHTML;
          oldEl.classList.remove('is-unavailable');
        }
      });
    }

    __updateTableOfInformation(productInfoHTML) {
      const selector = ".table-content__row__last";
      const oldElements = document.querySelectorAll(`.section--${this.sectionId} ${selector}`);
      const newElements = productInfoHTML.querySelectorAll(`.section--${this.sectionId} ${selector}`);
      oldElements.forEach((oldEle, index) => {
        if (newElements[index]) {
          oldEle.innerHTML = newElements[index].innerHTML;
        }
      });
    }

    __updateVariantPickerWhenChange(productInfoHTML) {
      this.optionElements.forEach(el => {
        const optionValueId = el.dataset.optionValueId;
        const newOptionEle = productInfoHTML.querySelector(`variant-picker.variant-picker__wrapper .variant-option[data-option-value-id="${optionValueId}"]`);
        if (newOptionEle) {
          el.classList[newOptionEle.classList.contains('disabled') ? 'add' : 'remove']('disabled');
          el.classList[newOptionEle.classList.contains('selected') ? 'add' : 'remove']('selected');
          el.checked = newOptionEle.classList.contains('selected');

          el.innerHTML = newOptionEle.innerHTML;
          el.dataset.selectValue = newOptionEle.dataset.selectValue;
        }
      })

      this.optionLabelElements.forEach(el => {
        const optionValueId = el.dataset.optionValueId;
        const newOptionEle = productInfoHTML.querySelector(`variant-picker.variant-picker__wrapper .variant-option__label[data-option-value-id="${optionValueId}"]`);
        if (newOptionEle) {
          el.classList[newOptionEle.classList.contains('disabled') ? 'add' : 'remove']('disabled');
          el.classList[newOptionEle.classList.contains('selected') ? 'add' : 'remove']('selected');
        }
      })

      // fix for the dropdown type
      const listSelectElementLabels = this.querySelectorAll(`.select-button__label.variant-option__select-button__label`);
      listSelectElementLabels.forEach(el => {
        const position = el.dataset.optionPosition;
        const newEl = productInfoHTML.querySelector(`variant-picker.variant-picker__wrapper .select-button__label.variant-option__select-button__label[data-option-position="${position}"]`);
        if (newEl) {
          el.innerHTML = newEl.innerHTML.trim();
        }
      })

      const oldListSwatch = document.querySelectorAll(`.section--${this.sectionId} .swatch-option__label`);
      if (oldListSwatch.length > 0) {
        oldListSwatch.forEach((swatch) => {
          const optionId = swatch.getAttribute('for');

          const newSwatchLabel = productInfoHTML.querySelector(`.swatch-option__label[for=${optionId}]`)

          if (newSwatchLabel) {
            if (newSwatchLabel.dataset.swatchStyle === 'image') {
              swatch.style.setProperty('--swatch-image-value', newSwatchLabel.dataset.swatchValue);
            } else if (newSwatchLabel.dataset.swatchStyle === 'color') {
              swatch.style.setProperty('--swatch-color-value', newSwatchLabel.dataset.swatchValue);
            }
          }
        });
      }
    }

    __renderStickyATC (productInfoHTML) {
      const selectors = [
        `#StickyAddToCart__Image__${this.sectionId}`,
        `#StickyAddToCart__Variant__${this.sectionId}`,
        `#StickyAddToCart__Price__${this.sectionId}`,
        `.sticky-add-to-cart__form`
      ];

      selectors.forEach(selector => {
        this.__updateElements(productInfoHTML, selector);
      });
    }

    __initEventSticky() {
      document.addEventListener(`${STICKY_ATC_EVENT.optionChange}-${this.sectionId}`, (event) => {
        if (event.detail.optionsSelectedValues) {
          this.optionsSelectedValues = event.detail.optionsSelectedValues;
          this.__renderProductInfo();
        }
      })
    }

    __updateCurrentVariantInfo(productInfoHTML) {
      const newCurrentVariantInfoElement = productInfoHTML.querySelector(`#CurrentVariantInfo__${this.sectionId}`);
      if (newCurrentVariantInfoElement) {
        this.currentVariantInfoElement.textContent = newCurrentVariantInfoElement.textContent;
        this.currentVariant = JSON.parse(newCurrentVariantInfoElement.textContent);
      }

      const newAdditionalCurrentVariantInfoElement = productInfoHTML.querySelector(`#AdditionalVariantInfo__${this.sectionId}`);
      if (newAdditionalCurrentVariantInfoElement) {
        this.addtionalCurrentVariantInfoElement.textContent = newAdditionalCurrentVariantInfoElement.textContent;
      }

      if (this.currentVariant) {
        this.isOptionExist = true;
        this.isOptionAvailable = this.currentVariant.available;
      } else {
        this.isOptionExist = false;
      }
    }

    __renderProductInfoWhenUnavailable() {
      const selectors = [
        // ".product-info__variant-picker", // update price
        ".product-info__price-wrapper", // update price
        ".product-info__identifier-wrapper", // update sku, barcode
        ".product-info__estimate-delivery-wrapper", // update estimate delivery
        ".product-info__label-wrapper", // update labels
        ".product-info__inventory-status-wrapper", // update inventory status
        ".product-info__rating", // update rating
        `#PickupAvailability__${this.sectionId}`,
        ".product-info__volume-pricing"
      ];

      selectors.forEach(selector => {
        const element = document.querySelector(`.section--${this.sectionId} ${selector}`);
        if (element) {
          element.classList.add('is-unavailable');
        }
      });
    }

    __dispatchChangeVariantEvent(updatedHTML) {
      document.dispatchEvent(
        new CustomEvent(`${PRODUCT_EVENT.updatedVariant}${this.sectionId}`, {
          bubbles: true,
          detail: {
            productId: this.productId,
            currentVariant: this.currentVariant,
            sectionId: this.sectionId,
            isOptionAvailable: this.isOptionAvailable,
            isOptionExist: this.isOptionExist,
            previewMediaId: this.dataset.mediaId,
            optionsSelectedValues: this.optionsSelectedValues,
            updatedHTML: updatedHTML
          },
        })
      );
    }
  }

  if (!customElements.get('variant-picker')) {
    customElements.define('variant-picker', VariantPicker);
  }
}
