if (!window.Maximize.loadedScript.includes("product-card.js")) {
  window.Maximize.loadedScript.push("product-card.js");

  class ProductCardSwatchOption extends HTMLElement {
    static cacheData = {}
    constructor() {
      super();
      this.productCardWrapperEle = this.closest(`.product-card__wrapper`);
      this.productId = this.dataset.productId;
      this.sectionId = this.dataset.sectionId;
      this.optionId = this.dataset.optionId;
      this.productCardId = this.dataset.productCardId;
      this.productUrl = this.dataset.productUrl;
      this.effectImage = this.dataset.effectImage;
      this.isShowEDT = this.hasAttribute('data-show-edt') && this.dataset.showEdt === 'true';
      this.optionsSelectedValues = [];

      this.optionValueInputElements = Array.from(this.querySelectorAll(`.variant-option__input`));
      this.optionLabelElements = Array.from(this.querySelectorAll(`.swatch-option__label`));
      const listSelectedOptionValue = this.optionValueInputElements.filter(ele => ele.classList.contains('selected'));
      listSelectedOptionValue.forEach((input) => {
        const position = input.dataset.optionPosition;
        this.optionsSelectedValues[position - 1] = input.dataset.optionValueId;
      })
    }

    connectedCallback() {
      this.optionLabelElements.forEach(el => {
        el.addEventListener('click', this.handleClickOptionLabel.bind(this));

        el.addEventListener('keyup', el => {
          if (el.key === 'Enter' || el.key === ' ') {
            this.handleClickOptionLabel.bind(this);
          }
        })
      })
    }

    handleClickOptionLabel(event) {
      event.preventDefault();
      const optionLabel = event.currentTarget;
      const option = optionLabel.previousElementSibling;
      const position = option.dataset.optionPosition;
      const idx = position - 1;
      let listInputSamePosition = this.optionValueInputElements.filter((el) => el.dataset.optionPosition === position);
      listInputSamePosition.forEach((el) => {
        if (el.dataset.optionValueId !== option.dataset.optionValueId) {
          el.checked = false;
          el.classList.remove("selected");
        } else {
          el.checked = true;
          el.classList.add("selected");
          this.optionsSelectedValues[idx] = el.dataset.optionValueId;
        }
      })
      this.reRenderProducSwatchs();
    }

    async reRenderProducSwatchs() {
      this.productCardWrapperEle.dataset.listOptionValuesIdSelected = this.optionsSelectedValues.join(',');
      const url = `${this.productUrl}?option_values=${this.optionsSelectedValues.join(",")}&section_id=product-swatch`;
      let dataHTML = ProductCardSwatchOption.cacheData[url];
      if (!dataHTML) {
        try {
          const response = await fetch(url);
          const text = await response.text();
          dataHTML = new DOMParser().parseFromString(text, "text/html");
          ProductCardSwatchOption.cacheData[url] = dataHTML;
        } catch (error) {
          console.error(error);
          return;
        }
      }

      this.updateElements(this.productCardWrapperEle, dataHTML, ".current-variant");
      if (this.isShowEDT) {
        this.updateElements(this.productCardWrapperEle, dataHTML, ".estimate-delivery-card-msg");
      }
      this.updateLabelData(this.productCardWrapperEle, dataHTML)
      this.renderSwatchOptionStyle(dataHTML, this.productCardWrapperEle);
      this.updateImage(dataHTML);
    }

    updateLabelData(rootEl, dataHTML) {
      const metafieldDataset = dataHTML.querySelector("#product-swatch")?.dataset.metafieldLabel;
      if (!metafieldDataset) return;

      const linkVariantEle = rootEl.querySelector(".link-product-variant");
      if (!linkVariantEle) return;

      const metafieldDataObj = xParseJSON(metafieldDataset);
      const currentLabelData = xParseJSON(linkVariantEle.getAttribute("x-labels-data"));

      currentLabelData.metafield_label = metafieldDataObj.metafield_label;

      linkVariantEle.setAttribute("x-labels-data", JSON.stringify(currentLabelData));
      Alpine.store("xLabelsAndBadges")?.load(linkVariantEle);
    }

    updateElements(rootEl, dataHTML, selector) {
      const oldElement = rootEl.querySelector(`${selector}`);
      const newElement = dataHTML.querySelector(`${selector}`);

      if (oldElement && newElement) {
        oldElement.innerHTML = newElement.innerHTML;
      }
    }

    renderSwatchOptionStyle(dataHTML, productCardWrapper) {
      const labels = productCardWrapper.querySelectorAll(".swatch-option__label");

      labels.forEach((label) => {
        const dataIndex = label.dataset.position;
        const sourceLabel = dataHTML.querySelector(`.swatch-option__label[data-position="${dataIndex}"]`);

        if (sourceLabel?.hasAttribute("style")) {
          const sourceStyle = sourceLabel.getAttribute("style");
          label.setAttribute("style", sourceStyle);
        }

        const input = label.previousElementSibling;
        const newInput = sourceLabel.previousElementSibling;

        if (input && newInput) {
          input.classList[newInput.classList.contains('disabled') ? 'add' : 'remove']('disabled');
          input.classList[newInput.classList.contains('selected') ? 'add' : 'remove']('selected');
          input.checked = newInput.classList.contains('selected');
        }
      });
    }

    updateImage(dataHTML) {
      const img = this.productCardWrapperEle.querySelector(".slide-item.is-active .product-card__image");
      let newImg = dataHTML?.querySelector(`.product-card__image`);
      const activeSlide = this.productCardWrapperEle.querySelector(".slide-item.is-active");
      let newMediaId = null;
      if (newImg) {
        newMediaId = newImg.dataset.mediaId;
      }
      if (this.effectImage == "carousel") {
        const slideToActive = this.productCardWrapperEle.querySelector(`.slide-item[data-media-id="${newMediaId}"]`);
        if (activeSlide && slideToActive) {
          activeSlide.classList.remove("is-active");
          slideToActive.classList.add("is-active")
          return;
        }
      }

      if (img && newImg) {
        img.setAttribute("srcset", newImg.getAttribute("srcset"));
        img.setAttribute("src", newImg.getAttribute("src"));
        if (activeSlide && this.effectImage == "carousel") {
          activeSlide.dataset.mediaId = newMediaId
        }
      }
    }
  }

  if (!customElements.get("product-card-swatch-option")) {
    customElements.define("product-card-swatch-option", ProductCardSwatchOption);
  }

  class ChooseOptionElement extends HTMLElement {
    static cacheData = {};
    constructor() {
      super();
      this.optionInputElements = Array.from(this.querySelectorAll(`.swatch-option__value`));
      this.optionLabelElements = Array.from(this.querySelectorAll(`.swatch-option__label`));
      this.optionsSelectedValues = [];
      this.productId = this.dataset.productId;
      this.productUrl = this.dataset.productUrl;
      this.chooseOptionElementId = this.dataset.chooseOptionElementId;
      const listSelectedOptionValue = this.optionInputElements.filter(ele => ele.classList.contains('selected'));
      listSelectedOptionValue.forEach((input) => {
        const position = input.dataset.optionPosition;
        this.optionsSelectedValues[position - 1] = input.dataset.optionValueId;
      })

      this.currentVariantInfoEle = this.querySelector('[type="application/json"][data-type="current-variant-info"]');
      this.currentVariantAdditionalInfoEle = this.querySelector('[type="application/json"][data-type="current-variant-additional-info"]');
      if (this.currentVariantInfoEle) {
        this.currentVariant = JSON.parse(this.currentVariantInfoEle?.textContent);
      }
    }

    connectedCallback() {
      this.optionLabelElements.forEach(el => {
        el.addEventListener('click', this.handleClickOptionLabel.bind(this));

        el.addEventListener('keyup', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            this.handleClickOptionLabel.call(this, e);
          }
        })
      })
    }


    handleClickOptionLabel(event) {
      event.preventDefault();
      const optionLabel = event.currentTarget;
      const option = optionLabel.previousElementSibling;
      const position = option.dataset.optionPosition;
      const idx = position - 1;
      let listInputSamePosition = this.optionInputElements.filter((el) => el.dataset.optionPosition === position);
      const selectedValue = this.querySelector(`.seclected-value-${position}`);
      if (selectedValue) {
        selectedValue.textContent = option.dataset.value;
      }

      listInputSamePosition.forEach((el) => {
        if (el.dataset.optionValueId !== option.dataset.optionValueId) {
          el.checked = false;
          el.classList.remove("selected");
        } else {
          el.checked = true;
          el.classList.add("selected");
          this.optionsSelectedValues[idx] = el.dataset.optionValueId;
        }
      })

      this.reRenderChooseOption();
    }

    async reRenderChooseOption() {
      const variantPickerEle = this.closest('.variant-picker__wrapper');
      const indexParam = variantPickerEle?.dataset?.indexParam;
      const chooseOptionWrapper = this.closest(".choose-option");
      const buyButton = chooseOptionWrapper.querySelector(".product-form__btn-add-to-cart");
      if (buyButton) {
        buyButton.disabled = true
      }
      const url = `${this.productUrl}?option_values=${this.optionsSelectedValues.join(",")}&section_id=choose-option&page=${indexParam}`;
      let dataHTML = ChooseOptionElement.cacheData[url];
      if (!dataHTML) {
        try {
          const response = await fetch(url);
          const text = await response.text();
          dataHTML = new DOMParser().parseFromString(text, "text/html");
          ChooseOptionElement.cacheData[url] = dataHTML;
        } catch (error) {
          console.error(error);
        }
      }

      this.updateElements(chooseOptionWrapper, dataHTML, ".choose-option__price-wrapper");
      this.updateElements(chooseOptionWrapper, dataHTML, ".choose-options-content .choose-option__properties-group");
      let newCurrentVariantInfoEle = dataHTML.querySelector('[type="application/json"][data-type="current-variant-info"]');
      if (newCurrentVariantInfoEle) {
        this.currentVariant = JSON.parse(newCurrentVariantInfoEle?.textContent);
        this.currentVariantInfoEle.textContent = newCurrentVariantInfoEle?.textContent
      }
      let newCurrentVariantAdditionalInfoEle =  dataHTML.querySelector('[type="application/json"][data-type="current-variant-additional-info"]');
      if (this.currentVariantAdditionalInfoEle && newCurrentVariantAdditionalInfoEle) {
        this.currentVariantAdditionalInfoEle.textContent = newCurrentVariantAdditionalInfoEle.textContent;
      }

      this.renderSwatchOptionStyle(dataHTML, chooseOptionWrapper);
      if (buyButton && !buyButton.ariaDisabled) {
        buyButton.disabled = false
      }
      this.dispatchChangeVariantEvent();
    }

    updateElements(rootEl, dataHTML, selector) {
      const oldElement = rootEl.querySelector(`${selector}`);
      const newElement = dataHTML.querySelector(`${selector}`);

      if (oldElement && newElement) {
        oldElement.innerHTML = newElement.innerHTML;
      }
    }

    renderSwatchOptionStyle(dataHTML, productCardWrapper) {
      const labels = productCardWrapper.querySelectorAll(".swatch-option__label");

      labels.forEach((label) => {
        const dataIndex = label.dataset.position;
        const sourceLabel = dataHTML.querySelector(`.swatch-option__label[data-position="${dataIndex}"]`);

        if (sourceLabel?.hasAttribute("style")) {
          const sourceStyle = sourceLabel.getAttribute("style");
          label.setAttribute("style", sourceStyle);
        }

        const input = label.previousElementSibling;
        const newInput = sourceLabel.previousElementSibling;

        if (input && newInput) {
          input.classList[newInput.classList.contains('disabled') ? 'add' : 'remove']('disabled');
          input.classList[newInput.classList.contains('selected') ? 'add' : 'remove']('selected');
          input.checked = newInput.classList.contains('selected');
        }
      });
    }
    dispatchChangeVariantEvent() {
      document.dispatchEvent(
        new CustomEvent(`${PRODUCT_EVENT.swatchChange}${this.chooseOptionElementId}`, {
          bubbles: true,
          detail: {
            productId: this.productId,
            currentVariant: this.currentVariant
          },
        })
      );
    }
  }

  if (!customElements.get("choose-option")) {
    customElements.define("choose-option", ChooseOptionElement);
  }
}
