if (!window.Maximize.loadedScript.includes('product-bundle.js')) {
  window.Maximize.loadedScript.push('product-bundle.js');
  
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data('xBundleSection', (sectionId, firstBlockId) => ({
        activeBlock: firstBlockId,
        initBundle() {
          if (Shopify.designMode) {
            document.addEventListener('shopify:block:select', (event) => {
              if (event.detail && event.detail.sectionId === sectionId) {
                this.activeBlock = event.detail.blockId;
              }
            });
          }
        }
      }));

      Alpine.data('xBundleBlock', (
        minimumItems,
        moneyFormat,
        productOnlyAddedOnce,
        discountType,
        discountValue,
        applyDiscountOncePerOrder,
        atbButtonText
      ) => ({
        productsBundle: [],
        loading: false,
        addToCartButton: "",
        bundleSummary: "",
        totalPrice: 0,
        errorMessage: false,
        showBundleContent: false,
        discountPrice: 0,
        viewBundle: false,
        loadedChooseOptions: {},
        productOnlyAddedOnce: productOnlyAddedOnce,
        atbButtonText: atbButtonText,
        init() {
          this.addToCartButton = this.$el.querySelector(".button-atc");
          this.bundleSummary = this.$el.getElementsByClassName("bundle__summary__details")[0] || this.$el.closest(".bundle__summary__details ");
          this.totalPrice = formatMoney(0, moneyFormat);
        },
        async loadChooseOptions(url, el, index) {
          const productCardWrapper = el.closest(".product-card-bundle")
          if (!productCardWrapper) return;

          let listOptionValuesIdSelected = productCardWrapper.dataset.listOptionValuesIdSelected ? productCardWrapper.dataset.listOptionValuesIdSelected.split(",") : "";
          let urlProduct = `${url}?option_values=${listOptionValuesIdSelected}&section_id=choose-option-product-bundle&page=${index}`;
  
          let destinationElm = productCardWrapper.querySelector(".choose-option");
          let loadingEl = productCardWrapper.querySelector(".icon-loading");
          if (this.loadedChooseOptions[urlProduct]) {
            destinationElm.innerHTML = this.loadedChooseOptions[urlProduct];
            setTimeout(() => {
              this.focusChooseOption(destinationElm);
            }, 500);
            return true;
          }
  
          try {
            if (loadingEl) {
              loadingEl.classList.remove("hidden");
            }
            const response = await fetch(urlProduct);
            const content = await response.text();
  
            const parser = new DOMParser();
            const parsedContent = parser.parseFromString(content, "text/html").getElementsByClassName("choose-option-content")[0].innerHTML;
             if (parsedContent) {
              if (destinationElm) {
                destinationElm.innerHTML = parsedContent;
              }
              if (!Shopify.designMode) {
                this.loadedChooseOptions[urlProduct] = parsedContent;
              }
              this.handleChooseOptionElements(destinationElm);
            }
            if (loadingEl) {
              loadingEl.classList.add("hidden");
            }
          } catch (error) {
            console.error(error);
          }
          this.focusChooseOption(destinationElm);
        },
        focusChooseOption(el) {
          const closeButton = el.querySelector(".btn-close-choose-option");
          if (closeButton) {
            closeButton.focus({ preventScroll: true });
          }
        },
        checkDisabledButton(productId) {
          return (this.productOnlyAddedOnce && this.productsBundle.some(item => item.product_id == productId)) || !this.isAvailableButton
        },
        handleAddToBundle(el, hasOptions = false) {
          let newProduct = this.getCurrentProduct(el, hasOptions);
          let existingProduct = this.productsBundle.find(item => item.id == newProduct.id);
          if (existingProduct) {
            existingProduct.quantity += 1;
          } else {
            this.productsBundle = [...this.productsBundle, newProduct];
          }
          this.errorMessage = false;
          this.updateBundleContent(this.productsBundle);
        },
        getCurrentProduct(el, hasOptions) {
          return hasOptions ? 
            JSON.parse(el.closest(".choose-options-content")?.querySelector('[type="application/json"][data-type="current-bundle-item"]')?.textContent) :
            JSON.parse(el.closest('.product-info__form-wrapper')?.querySelector('[type="application/json"][data-type="current-bundle-item"]')?.textContent);
        },
        handleAddToCart(el) {
          this.errorMessage = false;
          let items = maximizeParseJSON(JSON.stringify(this.productsBundle));
          items = items.reduce((data, product) => {
            data[product.id] ? data[product.id].quantity += product.quantity : data[product.id] = product;
            return data;
          }, {});
  
          this.loading = true;

          let cartSectionElement = document.querySelector("#CartDrawer");
          let cartSectionElementId = cartSectionElement && cartSectionElement.dataset.sectionId ? cartSectionElement.dataset.sectionId : false;
          if (window.Maximize.isCartPage) {
            cartSectionElement = document.querySelector("#MainCart__Items");
            cartSectionElementId = cartSectionElement && cartSectionElement.dataset.sectionId
          }
          const sectionsToRender = Alpine.store("xCartHelper").getSectionsToRender(cartSectionElementId);

          fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body:  JSON.stringify({ "items": items, "sections": sectionsToRender.map((section) => section.id) })
          }).then((response) => {
            return response.json();
          }).then((response) => {  
            if (response.status == '422') {
              const error_message = el.closest('.bundle__summary__wrapper')?.querySelector('.cart-warning');
              this.errorMessage = true;
              if (error_message) {
                error_message.textContent = response.description;
                setTimeout(() => this.errorMessage = false, 5000);
              } 

              if (Alpine.store("xMiniCart")) {
                Alpine.store("xMiniCart").reLoad();
              }
            } 

            sectionsToRender.forEach((section => {
              const sectionElement = document.querySelector(section.selector);
              if (sectionElement) {
                if (response.sections[section.id])
                  sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
              }
            }));

            Alpine.store("xMiniCart").handleOpen();
            Alpine.store("xCartHelper").updateCurrentCountItem();
            document.dispatchEvent(new CustomEvent(`${CART_EVENT.cartUpdate}`, {
              bubbles: true,
              detail: {
                isItemCountChanged: true,
              }
            }));
          })
          .catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
            this.productsBundle = [];
            this.totalPrice = formatMoney(0, moneyFormat);
            this.discountPrice = formatMoney(0, moneyFormat);
            this.addToCartButton.setAttribute('disabled', 'disabled');
            this.updateBundleContent(this.productsBundle);
          })
        },
        updateBundleContent(productsBundle) {
          let {total, totalQuantity} = productsBundle.reduce((accumulator, item) => {
            accumulator.total += item.price * item.quantity;
            accumulator.totalQuantity += item.quantity;
            return accumulator;
          }, {total: 0, totalQuantity: 0});
          
          if (totalQuantity >= minimumItems) {
            this.addToCartButton?.removeAttribute('disabled');
            let discount = 0;
            let discountPrice = 0;
            if (!Number.isNaN(discountValue)) {
              discount = Number(discountValue);
  
              if (discountType == 'percentage' && Number.isInteger(discount) && discount >= 0 && discount <= 100) {
                discountPrice = Math.ceil(total - total * discount / 100);
              }
  
              if (discountType == 'amount' && discount >= 0) {
                discount = (Number.parseFloat(discountValue)).toFixed(2);
                if (applyDiscountOncePerOrder) {
                  discountPrice = total - discount * Shopify.currency.rate * 100;
                } else {
                  discountPrice = total - totalQuantity * discount * Shopify.currency.rate * 100;
                }
              }
  
              if (discountPrice > 0) {
                this.discountPrice = formatMoney(discountPrice, moneyFormat);
              }
            } else {
              this.discountPrice = 0;
            }
          } else {
            this.discountPrice = 0;
            this.addToCartButton?.setAttribute('disabled', 'disabled');
          }
          this.totalPrice = formatMoney(total, moneyFormat);
          this.updateProgressBar(totalQuantity);
        },
        removeBundle(indexItem) {
          let newProductsBundle = this.productsBundle.filter((item, index) => index != indexItem)
          this.productsBundle = newProductsBundle;
          this.updateBundleContent(this.productsBundle);
        },
        updateProgressBar(bundleLength) {
          let activeWidth = 0;
          if (this.bundleSummary) {
            activeWidth = bundleLength / minimumItems * 100;
            if(activeWidth > 100) activeWidth = 100;
          }
          this.bundleSummary.style.setProperty("--progress-bar-active-width", `${activeWidth}%`)
        },
        updateQty(bundleItemIndex, action = 'input') {
          const item = this.productsBundle[bundleItemIndex];
          if (!item) return;

          let newQty = item.quantity;

          switch (action) {
            case 'plus':
              newQty += 1;
              break;

            case 'minus':
              newQty -= 1;
              break;

            case 'input':
              newQty = parseInt(this.$el.value);
              break;
          }

          if (isNaN(newQty) || newQty < 1) newQty = 1;

          this.productsBundle[bundleItemIndex] = {
            ...item,
            quantity: newQty
          };

          this.updateBundleContent(this.productsBundle);
        },
        handleChooseOptionElements(destinationElm) {
          const chooseOptionElement = destinationElm.querySelector("choose-option");

          chooseOptionElement.reRenderChooseOption = async function() {
            const variantPickerEle = chooseOptionElement.closest('.variant-picker__wrapper');
            const indexParam = variantPickerEle?.dataset?.indexParam;
            const chooseOptionWrapper = chooseOptionElement.closest(".choose-option");
            const buyButton = chooseOptionWrapper.querySelector(".product-form__btn-add-to-cart");
            if (buyButton) {
              buyButton.disabled = true
            }
            const url = `${chooseOptionElement.productUrl}?option_values=${chooseOptionElement.optionsSelectedValues.join(",")}&section_id=choose-option-product-bundle&page=${indexParam}`;
            let dataHTML = chooseOptionElement.constructor.cacheData[url];
            if (!dataHTML) {
              try {
                const response = await fetch(url);
                const text = await response.text();
                dataHTML = new DOMParser().parseFromString(text, "text/html");
                chooseOptionElement.constructor.cacheData[url] = dataHTML;
              } catch (error) {
                console.error(error);
              }
            }

            chooseOptionElement.updateElements(chooseOptionWrapper, dataHTML, ".choose-option__price-wrapper");
            chooseOptionElement.updateElements(chooseOptionWrapper, dataHTML, ".choose-options-content .choose-option__properties-group");

            let newCurrentVariantInfoEle = dataHTML.querySelector('[type="application/json"][data-type="current-variant-info"]');
            if (newCurrentVariantInfoEle) {
              chooseOptionElement.currentVariant = JSON.parse(newCurrentVariantInfoEle?.textContent);
              chooseOptionElement.currentVariantInfoEle.textContent = newCurrentVariantInfoEle?.textContent
            }

            let newCurrentVariantAdditionalInfoEle = dataHTML.querySelector('[type="application/json"][data-type="current-variant-additional-info"]');
            if (chooseOptionElement.currentVariantAdditionalInfoEle && newCurrentVariantAdditionalInfoEle) {
              chooseOptionElement.currentVariantAdditionalInfoEle.textContent = newCurrentVariantAdditionalInfoEle.textContent;
            }

            let newCurrentBundleItemEle = dataHTML.querySelector('[type="application/json"][data-type="current-bundle-item"]');
            let currentBundleItemEle = chooseOptionElement.querySelector('[type="application/json"][data-type="current-bundle-item"]');
            if (currentBundleItemEle && newCurrentBundleItemEle) {
              currentBundleItemEle.textContent = newCurrentBundleItemEle.textContent;
            }

            chooseOptionElement.renderSwatchOptionStyle(dataHTML, chooseOptionWrapper);
            if (buyButton && !buyButton.ariaDisabled) {
              buyButton.disabled = false
            }
            chooseOptionElement.dispatchChangeVariantEvent();
          }
        }
      }));
    });
  });
}
