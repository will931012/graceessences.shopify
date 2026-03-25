document.addEventListener("alpine:init", () => {
  Alpine.data("xProductForm", (formId, variantId, available, btnText, atcButtonLabel, sectionId, optionId, preorderTypeShow, preorderLabel, isApplyPreorder, initIsShowPreorder = false) => ({
    isFirstLoading: true,
    variantId: variantId,
    currentVariant: false,
    isOptionAvailable: available,
    isOptionExist: true,
    isAvailableButton: available,
    btnText: btnText,
    atcButtonLabel: atcButtonLabel,
    visible: false,
    isLoading: false,
    errorMessage: false,
    isShowPreorder: initIsShowPreorder,
    giftCardWrapperEle: document.querySelector(`#GiftCardRecipient__${sectionId}`),
    handleInitProductForm() {
      const currentVariantInfoElement = this.$el.querySelector(`[type="application/json"][data-type="init-current-variant"]`);
      if (currentVariantInfoElement) {
        this.currentVariant = JSON.parse(currentVariantInfoElement.textContent);
      }

      const additionalVariantInfoElement = document.querySelector(`#AdditionalVariantInfo__${sectionId}`);
      if (additionalVariantInfoElement) {
        const jsonText = additionalVariantInfoElement?.textContent?.trim();

        if (jsonText) {
          try {
            this.currentVariantAdditionalInfo = JSON.parse(jsonText);
          } catch (error) {
            console.warn('Invalid JSON in additionalVariantInfoElement:', error);
            this.currentVariantAdditionalInfo = {};
          }
        } else {
          this.currentVariantAdditionalInfo = {};
        }
      }

      this.visible = true;

      document.addEventListener(`${PRODUCT_EVENT.updatedVariant}${sectionId}`, (event) => {
        const {currentVariant} = event.detail;
        this.currentVariant = currentVariant;
      });
      document.addEventListener(`${PRODUCT_EVENT.swatchChange}${sectionId}`, (event) => {
        const {currentVariant} = event.detail;
        this.currentVariant = currentVariant;
      });
      if (this.giftCardWrapperEle) {
        document.addEventListener(`${PRODUCT_EVENT.giftCardRecipientChange}${sectionId}`, (event) => {
          const {isValidated} = event.detail;
          const isValidatedGiftCard = isValidated;
          this.__updateStatus(PRODUCT_FORM_SOURCE_CHANGE.giftCardRecipient, isValidatedGiftCard);
        });
      }

      if (optionId) {
        let additionalVariantsInfoElement = this.$el.closest(".product-card__wrapper")?.querySelector(`.variant-inventory`);
        if (additionalVariantsInfoElement) {
          this.currentVariantAdditionalInfo = JSON.parse(additionalVariantsInfoElement.textContent);
        }
        document.addEventListener(`${PRODUCT_EVENT.swatchChange}${optionId}`, (event) => {
          const {currentVariant} = event.detail;
          this.currentVariant = currentVariant;
        });
      }

      if (this.$el.classList.contains('product-card__form-wrapper')) {
        let additionalVariantsInfoElement = this.$el.closest(".product-card__wrapper")?.querySelector(`.product-card-variant-inventory`);
        if (additionalVariantsInfoElement) {
          this.currentVariantAdditionalInfo = JSON.parse(additionalVariantsInfoElement.textContent);
        }
      }

      this.$watch('currentVariant', () => {
        this.__updateStatus(PRODUCT_FORM_SOURCE_CHANGE.variantPicker);
      })

      if (this.$refs.error_message) {
        this.$watch('errorMessage', (newValueError) => {
          if (newValueError) {
            this.$refs.error_message.parentElement.classList.remove('hidden');
            this.$refs.error_message.parentElement.classList.add('flex');
          } else {
            this.$refs.error_message.parentElement.classList.add('hidden');
            this.$refs.error_message.parentElement.classList.remove('flex');
          }
        })
      }
      this.isFirstLoading = false;
    },
    formDataToObject(formData) {
      const object = {};
      formData.forEach((value, key) => {
        if (key.includes('[')) {
          const [mainKey, subKey] = key.split('[');
          const cleanSubKey = subKey.replace(']', '');
          
          if (!object[mainKey]) {
            object[mainKey] = {};
          }
          object[mainKey][cleanSubKey] = value;
        } else {
          object[key] = value;
        }
      });
  
      return object;
    },
    async handleAddAdditionalFeeItems(additionalFeePropertyValue, additionalFeeData, sectionsToRender, isAddError) {
      if (additionalFeePropertyValue != '') {
        if (isAddError) {
          await fetch(Shopify.routes.root + "cart.js", {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          })
            .then(responseCart => responseCart.json())
            .then( async (responseCart) => {
              if (responseCart.item_count != Alpine.store('xCartHelper').currentItemCount) {
                let newQty = responseCart.item_count - Alpine.store('xCartHelper').currentItemCount;

                additionalFeeData.items.map(item => {
                  item.quantity = newQty
                })
                
                await window.fetch("/cart/add.js", {
                  method: "POST",
                  headers: {
                    Accept: "application/javascript",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(additionalFeeData),
                })
                  .then(responseAdditionalFee => responseAdditionalFee.json())
                  .then((responseAdditionalFee) => {
                    sectionsToRender.forEach((section) => {
                      const sectionElement = document.querySelector(section.selector);
                      if (sectionElement) {
                        if (responseAdditionalFee.sections[section.id]) sectionElement.innerHTML = getSectionInnerHTML(responseAdditionalFee.sections[section.id], section.selector);
                      }
                    });
                  })
                  .finally(() => Alpine.store("xCartHelper").updateCurrentCountItem())
              }
            });
        } else {
          return await window.fetch("/cart/add.js", {
            method: "POST",
            headers: {
              Accept: "application/javascript",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(additionalFeeData),
          })
            .then(responseAdditionalFee => responseAdditionalFee.json())
        }
      }
    },
    handleAddToCart: async function (e, isCheckRequired = false) {
      if (isCheckRequired) {
        let productInfo = this.$el.closest(".product-template__wrapper");
        if (productInfo) {
          let propertiesInput = productInfo.querySelectorAll(`.customizable-option`);
          this.stopAction = false;
          let isScroll = false;
          propertiesInput.length && propertiesInput.forEach((input) => {
            if ((input.required && input.value === "") || input.classList.contains("validate-checkbox")) {
              if (!isScroll) {
                const inputWrapper = input.closest(`.customizable-option__wrapper`);
                if (inputWrapper) inputWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                isScroll = true;
              }
              input.classList.add("required-picker");
              this.stopAction = true;
            }
          });
        }
        if (this.stopAction) {
          return true;
        }
      }
      this.isLoading = true;

      const addGiftWrapping = await this.__addGiftWrapping();
      if (!addGiftWrapping) return;

      let cartSectionElement = document.querySelector("#CartDrawer");
      let cartSectionElementId = cartSectionElement && cartSectionElement.dataset.sectionId ? cartSectionElement.dataset.sectionId : false;
      if (window.Maximize.isCartPage) {
        cartSectionElement = document.querySelector("#MainCart__Items");
        cartSectionElementId = cartSectionElement && cartSectionElement.dataset.sectionId
      }
      const sectionsToRender = Alpine.store("xCartHelper").getSectionsToRender(cartSectionElementId);

      const formData = new FormData(this.$refs.product_form)
      formData.append(
        "sections",
        sectionsToRender.map((section) => section.id)
      );
      formData.append("sections_url", window.location.pathname);

      
      // Preprocess data additional fee
      let formDataObject = this.formDataToObject(formData);
      const additionalFeeData = {
        items: [],
        sections: formDataObject.sections,
        sections_url: window.location.pathname,
        'section-id': formDataObject['section-id']
      }
      const productContent = this.$el.closest('.product-template__content__container')
      let additionalFeePropertyValue = ''
      if (productContent) {
        const arrayAdditionalFeeEl = Array.from(productContent.querySelectorAll('.additional-fee__card.checked'));
        if (arrayAdditionalFeeEl.length > 0) {
          const listIdVariants = []
          let quantity = parseInt(formDataObject.quantity || 1)
          additionalFeePropertyValue = formDataObject.id
  
          arrayAdditionalFeeEl.forEach(item => {
            additionalFeePropertyValue += `_${item.querySelector('.additional-fee-selected').innerHTML}`
            listIdVariants.push(item.querySelector('.additional-fee-selected').innerHTML)
          })

          listIdVariants.sort((a, b) => a.index - b.index);
          listIdVariants.forEach(item => {
            const additionalFeeItem = {
              id: item,
              quantity: quantity,
              properties: {[window.Maximize.cartProperties.additionalFee]: additionalFeePropertyValue}
            }
            additionalFeeData.items.push(additionalFeeItem)
          })
          additionalFeeData.items = [...new Map(additionalFeeData.items.map((item) => [JSON.stringify(item), item])).values()];

          formData.append(`properties[${window.Maximize.cartProperties.additionalFee}]`, additionalFeePropertyValue);
        }
      }

      await window.fetch(`${window.Maximize.routes.addToCart}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {Accept: "application/javascript", "X-Requested-With": "XMLHttpRequest"},
        body: formData,
      })
        .then((response) => {
          return response.json();
        })
        .then(async (response) => {
          if (response.status === 422) {
            if (typeof response.errors == "object") {
              this.errorMessage = false;
              document.querySelector(".recipient-error-message").classList.remove("hidden");
            } else {
              this.errorMessage = true;
              const errorMessageEl = this.$refs.error_message
              if (errorMessageEl) {
                errorMessageEl.textContent = response.description;
                if (errorMessageEl.dataset?.autoHideMessage) {
                  setTimeout(() => this.errorMessage = false, 5000);
                }
              } else {
                setTimeout(() => this.errorMessage = false, 5000);
              }
            }

            await this.handleAddAdditionalFeeItems(additionalFeePropertyValue, additionalFeeData, sectionsToRender, true)

            if (Alpine.store("xMiniCart")) {
              Alpine.store("xMiniCart").reLoad();
            }
          } else {
            const finalResponse = await this.handleAddAdditionalFeeItems(additionalFeePropertyValue, additionalFeeData, sectionsToRender, false) || response

            document.querySelector(".recipient-error-message") ? document.querySelector(".recipient-error-message").classList.add("hidden") : "";

            sectionsToRender.forEach((section) => {
              const sectionElement = document.querySelector(section.selector);
              if (sectionElement) {
                if (finalResponse.sections[section.id]) {
                  sectionElement.innerHTML = getSectionInnerHTML(finalResponse.sections[section.id], section.selector);
                  // sectionElement.innerHTML = '';
                }
              }
            });

            if (Alpine.store("xQuickView") && Alpine.store("xQuickView").show) {
              if (window.Maximize.isCartPage) {
                Alpine.store("xQuickView").close();
              } else {
                Alpine.store("xQuickView").show = false;
              }
            }

            Alpine.store("xMiniCart").handleOpen();

            Alpine.store("xCartHelper").updateCurrentCountItem();
            document.dispatchEvent(new CustomEvent(`${CART_EVENT.cartUpdate}`, {
              bubbles: true,
              detail: {
                isItemCountChanged: true,
              }
            }));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        })
        .finally(() => {
          this.isLoading = false;
          if (this.$refs.gift_wrapping_checkbox) this.$refs.gift_wrapping_checkbox.checked = false;
        });
    },
    updatePickUpAvailability(isFirstLoading = true) {
      const pickupAvailabilityEle = document.querySelector(`#PickupAvailability__${sectionId}`);
      if (!pickupAvailabilityEle) return;
      const isHidePickupWhenPreorder = !!(pickupAvailabilityEle.dataset.hideWhenPreorder && pickupAvailabilityEle.dataset.hideWhenPreorder === 'true');

      if (this.isShowPreorder && isHidePickupWhenPreorder) {
        pickupAvailabilityEle.innerHTML = '';
        return;
      }

      if (isFirstLoading) this.__initCurrentVariant();
      if (this.currentVariant && this.currentVariant.available) {
        fetch(`${window.Shopify.routes.root}variants/${this.currentVariant.id}/?section_id=pickup-availability`)
          .then(response => response.text())
          .then(text => {
            const pickupAvailabilityHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
            if (pickupAvailabilityHTML) {
              pickupAvailabilityEle.innerHTML = pickupAvailabilityHTML.innerHTML;
            }
          })
          .catch(e => {
            console.error(e);
          });
      } else {
        pickupAvailabilityEle.innerHTML = '';
      }
    },
    __updateStatus: async function (updateSource, isValidatedGiftCard){
      if (this.currentVariant) {
        this.variantId = this.currentVariant.id;
        this.isOptionAvailable = this.currentVariant.available;
        this.isOptionExist = true;
        const additionalVariantInfoElement = document.querySelector(`#AdditionalVariantInfo__${sectionId}`);
        if (additionalVariantInfoElement) {
          this.currentVariantAdditionalInfo = JSON.parse(additionalVariantInfoElement.textContent);
        }

        let additionalVariantsInfoElement = this.$el.closest(".product-card__wrapper")?.querySelector(`.variant-inventory`);
        if (additionalVariantsInfoElement) {
          this.currentVariantAdditionalInfo = JSON.parse(additionalVariantsInfoElement.textContent);
        }

        this.isAvailableButton = !!(this.currentVariant.available && this.currentVariant.available && this.__validateGiftCard(updateSource, isValidatedGiftCard));

        if (this.currentVariant.available) {
          this.btnText = this.atcButtonLabel ? this.atcButtonLabel : window.Maximize.variantStrings.addToCart;
        } else {
          this.btnText = window.Maximize.variantStrings.soldOut;
        }
        let isShowPreorder = false;

        if (isApplyPreorder) {
          if (preorderTypeShow === PREORDER_TYPE_SHOW.yes) {
            if (this.currentVariantAdditionalInfo?.inventory_quantity < 1) {
              if (this.currentVariantAdditionalInfo.inventory_policy === 'continue' || this.currentVariantAdditionalInfo.inventory_management === '') {
                isShowPreorder = true;
              }
            } else {
              isShowPreorder = true
            }
          } else if (preorderTypeShow === PREORDER_TYPE_SHOW.onBackOrder) {
            if (this.currentVariantAdditionalInfo.inventory_policy === 'continue' && this.currentVariantAdditionalInfo.inventory_quantity < 1 && this.currentVariantAdditionalInfo.inventory_management !== '') {
              isShowPreorder = true
            }
          }
        }
        this.isShowPreorder = isShowPreorder;
        if (isShowPreorder) {
          if (this.__validateGiftCard(updateSource, isValidatedGiftCard)) {
            this.isAvailableButton = true;
          }
          this.btnText = preorderLabel;
          this.isShowPreorder = true;
        }
      } else {
        this.variantId = false;
        this.isOptionExist = false;
        this.isAvailableButton = false;
        this.btnText = window.Maximize.variantStrings.unavailable;
      }

      this.updatePickUpAvailability(false);
    },
    __addGiftWrapping: async function () {
      let isSuccessAddGiftWrapping = true;
      const giftWrappingInput = document.querySelector(`#GiftWrappingInput__${formId}`);

      if (giftWrappingInput && giftWrappingInput.checked && window.Maximize.giftWrappingVariantId && this.currentVariant && this.currentVariant.available) {
        const giftData = {
          items: [
            {
              id: window.Maximize.giftWrappingVariantId,
              quantity: 1,
            },
          ],
        };

        const giftRequest = await window.fetch("/cart/add.js", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(giftData),
        });

        const giftResponse = await giftRequest.json();
        if (!giftRequest.ok) {
          if (giftRequest.status === 422) {
            const giftWrappingError = document.querySelector(`#GiftWrappingError__${formId}`)
            if (giftWrappingError) {
              giftWrappingError.textContent = giftResponse.description;
              this.isLoading = false;
              setTimeout(() => {
                giftWrappingError.textContent = "";
              }, 5000);
            }
          }
          isSuccessAddGiftWrapping = false;
        }
      }
      return isSuccessAddGiftWrapping;
    },
    __validateGiftCard: function (updateSource, isValidatedGiftCard) {
      let isValidated = true;

      if (updateSource === PRODUCT_FORM_SOURCE_CHANGE.giftCardRecipient) {
        isValidated = isValidatedGiftCard;
      } else if (updateSource === PRODUCT_FORM_SOURCE_CHANGE.variantPicker) {
        this.giftCardWrapperEle = document.querySelector(`#GiftCardRecipient__${sectionId}`);
        if (!this.giftCardWrapperEle) return isValidated;

        isValidated = this.giftCardWrapperEle.dataset.validated === 'true';
      }

      return isValidated;
    },
    __initCurrentVariant: function () {
      if (!this.currentVariant) {
        let currentVariantInfoElement = document.querySelector(`#CurrentVariantInfo__${sectionId}`);
        if (currentVariantInfoElement) {
          this.currentVariant = JSON.parse(currentVariantInfoElement.textContent);
        }
      }
    },
    handleClickButtonCartUpSell: async function (event, hasOnlyDefaultVariant, currentVariantId, productId, productUrl) {
      if (hasOnlyDefaultVariant || !Alpine.store('xQuickView')) {
        const loadingEl = document.querySelector(`#CartUpSellItem_Loading_${productId}`);
        if (loadingEl) {
          loadingEl.classList.remove('hidden');
        }
        await this.handleAddToCart(event, false, currentVariantId);
        if (loadingEl) {
          loadingEl.classList.add('hidden');
        }
      } else {
        if (Alpine.store('xQuickView')) {
          Alpine.store('xQuickView').load(productId, productUrl, this.$el);
          Alpine.store('xQuickView').open('cart_drawer_upsell');
        }
      }
    },
    handleClickButtonAtcInCompareSection: async function (event, hasOnlyDefaultVariant, currentVariantId, productId, productUrl) {
      if (hasOnlyDefaultVariant || !Alpine.store('xQuickView')) {
        await this.handleAddToCart(event, false);
      } else {
        if (Alpine.store('xQuickView')) {
          Alpine.store('xQuickView').load(productId, productUrl, this.$el);
          Alpine.store('xQuickView').open();
        }
      }
    }
  }));
});
