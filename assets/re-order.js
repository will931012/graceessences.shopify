if (!window.Maximize.loadedScript.includes('re-order.js')) {
  window.Maximize.loadedScript.push('re-order.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.store('xReOrder', {
        show: false,
        orderName: '',
        itemsCart: '',
        itemsCartNew: [],
        errorMessage: false,
        loading: false,
        clearSuccess: false,
        loadingClearCart: false,
        disableReorder: false,
        cartDrawerId: null,
        formatJson(jsonString) {
          let newJsonString = String.raw`${jsonString}`;
          newJsonString = newJsonString.replaceAll('\\', '&#92;');
        
          return JSON.parse(newJsonString);
        },
        load(el, orderName) {
          this.errorMessage = false;
          this.showReorderPopup();
          let data = el.closest('.re-order-action').querySelector('.x-order-data').getAttribute('x-order-data');
          this.orderName = orderName;
          // check value of available 
          this.itemsCart = this.formatJson(data).map((product) => (product.variant_available && product.available ) ? product : { ...product, disable: true } );
          this.disableReorder = this.itemsCart.findIndex((element) => !element.disable) == -1 ? true : false;

          this.itemsCartNew = this.itemsCart;
          this.cartDrawerId = this.getCartDrawerId();
        },
        decodeHtmlEntities(str) {
          const textarea = document.createElement('textarea');
          textarea.innerHTML = str;
          return textarea.value;
        },
        setItemsCart(product) {
          let newItems = [];
          this.itemsCartNew.forEach((cartItem) => {
            if (cartItem.id == product.id && cartItem.variant_id == product.variant_id) {
              cartItem.quantity = product.quantity;
            }
            newItems.push(cartItem);
          });
          this.itemsCartNew = newItems;
        },
        handleAddToCart(el) {
          this.loading = true;
          this.clearSuccess = false;
          let items = [];

          JSON.parse(JSON.stringify(this.itemsCartNew)).filter(itemCart => !itemCart.disable && items.push({ "id": itemCart.variant_id, "quantity": itemCart.quantity }));

          const sectionsToRender = Alpine.store('xCartHelper').getSectionsToRender(this.cartDrawerId);
          const sections = sectionsToRender.map((s) => s.id);

          const formData = {
            'items': items,
            'sections': sections
          }

          fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }).then((response) => {
            return response.json();
          }).then((response) => {
            if (response.status == '422') {
              const error_message = el.closest('.reorder-popup').querySelector('.cart-warning');
              this.errorMessage = true;
              if (error_message) {
                error_message.textContent = response.description;
              }
              return;
            } 
            this.closeReorderPopup();
            if (Alpine.store("xMiniCart")) {
              Alpine.store("xMiniCart").reLoad();
            }
            Alpine.store('xCartHelper').getSectionsToRender(this.cartDrawerId).forEach((section => {
              const sectionElement = document.querySelector(section.selector);

              if (sectionElement) {
                if (response.sections[section.id])
                  sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
              }
            }));
            if (Alpine.store('xQuickView') && Alpine.store('xQuickView').show) {
              Alpine.store('xQuickView').show = false;
            }

            Alpine.store('xMiniCart').handleOpen();
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
          })
        },
        clearCart() {
          this.loadingClearCart = true;
          this.errorMessage = false;
          fetch(window.Shopify.routes.root + 'cart/clear.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "sections":  Alpine.store('xCartHelper').getSectionsToRender(this.cartDrawerId).map((section) => section.id) })
          })
          .then((response) => response.json())
          .then((response) => {
            this.clearSuccess = true;
            Alpine.store('xCartHelper').getSectionsToRender(this.cartDrawerId).forEach((section => {
              const sectionElement = document.querySelector(section.selector);
              if (sectionElement) {
                if (response.sections[section.id])
                  sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
              }
            }));
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
            this.loadingClearCart = false;
          })            
        },
        showReorderPopup() {
          this.show = true;
          Alpine.store('xMaximizePopup').handleOpen();
        },
        closeReorderPopup() {
          this.show = false;
          this.clearSuccess = false;
          this.errorMessage = false;
          Alpine.store('xMaximizePopup').handleClose();
        },
        getCartDrawerId() {
          const cartDrawer = document.getElementById('CartDrawer');
          if (cartDrawer) {
            return cartDrawer.getAttribute('data-section-id');
          }
          return null;
        }
      });
    });
  });
}
