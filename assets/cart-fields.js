if (!window.Maximize.loadedScript.includes('cart-fields.js')) {
  window.Maximize.loadedScript.push('cart-fields.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xCartFields', (el, customFieldLabel, customFieldRequired) => ({
        customField: '',
        customFieldLabel: '',
        customFieldRequired: false,
        customFieldError: false,
        openField: false,
        init() {
          const data = maximizeParseJSON(el.dataset.cartCustomField);
          this.customFieldLabel = data.custom_field_label;
          this.customFieldRequired = data.custom_field_required;
          this.customFieldPattern = new RegExp(data.custom_field_pattern);

          this.customField = localStorage.getItem(`${LOCAL_STORAGE.maximize_cart_custom_field}`) ? localStorage.getItem(`${LOCAL_STORAGE.maximize_cart_custom_field}`) : '';

          // this.__updateCartFields();
          this.__validateEvent();
        },
        __validateEvent: function () {
          document.addEventListener(`${CART_EVENT.validate}`, () => {
            this.customField = localStorage.getItem(`${LOCAL_STORAGE.maximize_cart_custom_field}`) ? localStorage.getItem(`${LOCAL_STORAGE.maximize_cart_custom_field}`) : '';
            let isValid;
            if (this.customFieldRequired) {
              if (this.customField.length > 0) {
                isValid = this.customFieldPattern.test(this.customField);
              } else {
                isValid = false;
              }
            } else {
              if (this.customField.length > 0) {
                isValid = this.customFieldPattern.test(this.customField);
              } else {
                isValid = true;
              }
            }

            this.customFieldError = !isValid;
            if (this.customFieldError) {
              Alpine.store('xCartHelper').openField = "custom_field";
              document.dispatchEvent(new CustomEvent(`${CART_EVENT.showCustomFiled}`));
            }
            Alpine.store('xCartHelper').validated = isValid;
          });
        },
        handleChangeInput(event) {
          this.customField = event.target.value;
          this.__updateCartFields();
        },
        __updateCartFields() {
          let attributes = {attributes: {}}
          attributes.attributes[this.customFieldLabel] = this.customField;
          Alpine.store('xCartHelper').updateCart(attributes, true);
          localStorage.setItem(`${LOCAL_STORAGE.maximize_cart_custom_field}`, this.customField);
        }
      }));
    })
  });
}
