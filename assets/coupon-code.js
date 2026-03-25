if (!window.Maximize.loadedScript.includes('coupon-code.js')) {
  window.Maximize.loadedScript.push('coupon-code.js');
  
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xCouponCodeList", (sectionId) => ({
        loading: true,
        load() {
          this.loading = true;
          let url = `${window.location.pathname}?section_id=${sectionId}`;
          fetch(url, {
            method: 'GET'
          }).then(
            response => response.text()
          ).then(responseText => {
            const html = (new DOMParser()).parseFromString(responseText, 'text/html');
            const contentId = `x-promo-code-list-${sectionId}`;
            const newContent = html.getElementById(contentId);
            if (newContent && !document.getElementById(contentId)) {
              container.appendChild(newContent);
            }
            this.loading = false;
          })
        }
      }));
      
      Alpine.data("xCouponCode", () => ({
        copySuccess: false,
        loading: false,
        disableCoupon: false,
        disableComing: false,
        discountCode: "",
        errorMessage: false,
        appliedDiscountCode: false,
        load(discountCode) {
          this.setAppliedButton(discountCode);
          document.addEventListener(`${CART_EVENT.discountCodeChange}`, (e) => {
            this.setAppliedButton(discountCode);
          });
        },
        copyCode() {
          if (this.copySuccess) return;

          const discountCode = this.$refs.code_value.textContent.trim();
          navigator.clipboard.writeText(discountCode).then(
            () => {
              this.copySuccess = true;

              setTimeout(() => {
                this.copySuccess = false;
              }, 5000);
            },
            () => {
              alert("Copy fail");
            }
          );
        },
        applyCouponCode(sectionId, discountCode) {
          Alpine.store("xCouponCodeDetail").discountFailed = false;
          Alpine.store("xCouponCodeDetail").discountApplied = false;
          Alpine.store("xCouponCodeDetail").discountCorrect = false;
          Alpine.store("xCouponCodeDetail").getDiscountCode();
          let appliedDiscountCodes = JSON.parse(JSON.stringify(Alpine.store("xCouponCodeDetail").appliedDiscountCodes));
          const appliedDiscount = document.querySelectorAll(".discount-title");
          let checkedDiscount = false;
          if (appliedDiscount.length > 0) {
            appliedDiscount.forEach((discount) => {
              if (discount.dataset.discountTitle.toLowerCase() == discountCode.toLowerCase()) checkedDiscount = true;
            });
          }
          if (checkedDiscount) {
            Alpine.store("xCouponCodeDetail").discountApplied = true;
            document.querySelector("#Cart__DiscountField") && (document.querySelector("#Cart__DiscountField").value = "");
            this.discountCode = "";
            setTimeout(() => {
              Alpine.store("xCouponCodeDetail").discountApplied = false;
            }, 3000);
            return true;
          }
          if (discountCode) {
            let listDiscountCodes = appliedDiscountCodes.length > 0 ? [...appliedDiscountCodes, discountCode].join(",") : discountCode;

            document.cookie = `maximize_discount_code=${listDiscountCodes}; path=/`;
            let sectionsToRender ;
            if (window.Maximize.isCartPage) {
              sectionsToRender = Alpine.store("xCartHelper").getSectionsToRender(sectionId);
            } else {
              let carDrawerElement = document.querySelector("#CartDrawer");
              const cartDrawerSectionId = carDrawerElement && carDrawerElement.dataset.sectionId ? carDrawerElement.dataset.sectionId : false;
              sectionsToRender = Alpine.store("xCartHelper").getSectionsToRender(cartDrawerSectionId);
            }
            const sections = sectionsToRender.map((section) => section.id);

            this.loading = true;
            let cartDrawer = false;
            let mainCartItems = false;

            fetch(`/checkout?skip_shop_pay=true&discount=${encodeURIComponent(listDiscountCodes)}`)
              .then((response) => {
                fetch("/cart/update.js", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sections: sections
                  })
                })
                  .then((response) => {
                    return response.json();
                  })
                  .then((response) => {
                    if (response.status !== 422) {
                      sectionsToRender.forEach((section) => {
                        const sectionElement = document.querySelector(section.selector);
                        if (sectionElement) {
                          if (response.sections[section.id]) {
                            const sectionInnerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
                            sectionElement.innerHTML = sectionInnerHTML;
                            if (section.selector === "#CartDrawer") {
                              cartDrawer = sectionInnerHTML;
                            }
                            if (section.selector === "#MainCart__Items") {
                              mainCartItems = sectionInnerHTML;
                            }
                          }
                        }
                      });
                      checkedDiscount = false;
                      const parser = new DOMParser();

                      if (mainCartItems) {
                        const mainCartHTML = parser.parseFromString(mainCartItems, "text/html");
                        const discountTitleCartPage = mainCartHTML.querySelectorAll(".discount-title");
                        if (discountTitleCartPage.length > 0) {
                          discountTitleCartPage.forEach((discount) => {
                            if (discount.dataset.discountTitle.toLowerCase() === discountCode.toLowerCase()) checkedDiscount = true;
                          });
                        }
                      }
                      if (cartDrawer) {
                        const cartDrawerHtml = parser.parseFromString(cartDrawer, "text/html");
                        const discountTitle = cartDrawerHtml.querySelectorAll(".discount-title");
                        if (discountTitle.length > 0) {
                          discountTitle.forEach((discount) => {
                            if (discount.dataset.discountTitle.toLowerCase() === discountCode.toLowerCase()) checkedDiscount = true;
                          });
                        }
                      }
                      
                      if (checkedDiscount) {
                        Alpine.store("xCouponCodeDetail").discountCorrect = true;
                        setTimeout(() => {
                          Alpine.store("xCartHelper").openField = false;
                          Alpine.store("xCartHelper").isOpenDiscountCodeMainCart = false;
                        }, 3000);
                      } else {
                        Alpine.store("xCouponCodeDetail").discountFailed = true;
                      }
                      Alpine.store("xCouponCodeDetail").appliedDiscountCodes.push(discountCode);
                      Alpine.store("xCartHelper").updateCurrentCountItem();
                      document.dispatchEvent(new CustomEvent(`${CART_EVENT.discountCodeChange}`));
                      if (window.Maximize.isCartPage) {

                      } else {
                        Alpine.store("xMiniCart").reLoad(true);
                      }
                    }
                  })
                  .finally(() => {
                    this.loading = false;
                    setTimeout(() => {
                      Alpine.store("xCouponCodeDetail").discountFailed = false;
                    }, 5000);
                    setTimeout(() => {
                      Alpine.store("xCouponCodeDetail").discountCorrect = false;
                    }, 3000);
                  });
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          }
        },
        handleScheduleCoupon(el) {
          let settings = xParseJSON(el.getAttribute("x-countdown-data"));
          let timeSettings = Alpine.store("xHelper").handleTime(settings);
          if (timeSettings.distance < 0 && settings.set_end_date) {
            this.disableCoupon = true;
          } else if (timeSettings.startTime > timeSettings.now) {
            this.disableCoupon = true;
            this.disableComing = true;
          }
        },
        onChange() {
          this.discountCode = this.$el.value;
        },
        applyDiscountToCart(sectionId) {
          this.applyCouponCode(sectionId, this.discountCode);
        },
        setAppliedButton(discountCode) {
          let appliedDiscountCodes = JSON.parse(JSON.stringify(Alpine.store("xCouponCodeDetail").appliedDiscountCodes));
          this.appliedDiscountCode = discountCode && appliedDiscountCodes.indexOf(discountCode) !== -1;
        },
      }));

      Alpine.store('xCouponCodeDetail', {
        show: false,
        promoCodeDetail: {},
        sectionID: "",
        discountCodeApplied: "",
        appliedDiscountCodes: [],
        cachedResults: [],
        loading: false,
        cartEmpty: true,
        discountFailed: false,
        discountApplied: false,
        discountCorrect: false,
        handleCouponSelect(shopUrl) {
          let _this = this;
          const promoCodeDetail = JSON.parse(JSON.stringify(this.promoCodeDetail));
  
          document.addEventListener('shopify:section:select', function(event) {
            if (!event.target.classList.contains('section-promo-code')) {
              if (window.Alpine) {
                _this.close();
              } else {
                document.addEventListener('alpine:initialized', () => {
                  _this.close();
                });
              }
            }
          })

          if(promoCodeDetail && promoCodeDetail.blockID && promoCodeDetail.sectionID) {
            this.promoCodeDetail = xParseJSON(document.getElementById('x-data-promo_code-' + promoCodeDetail.blockID).getAttribute('x-data-promo_code'));
            let contentContainer = document.getElementById('PromoCodeContent-' + this.promoCodeDetail.sectionID);
            if (this.cachedResults[this.promoCodeDetail.blockID]) {
              contentContainer.innerHTML = this.cachedResults[this.promoCodeDetail.blockID];
              return true;
            }
            if (this.promoCodeDetail.page !== '') {
              let url = `${shopUrl}/pages/${this.promoCodeDetail.page}`;
              fetch(url, {
                method: 'GET'
              }).then(
                response => response.text()
              ).then(responseText => {
                const html = (new DOMParser()).parseFromString(responseText, 'text/html');
                contentContainer.innerHTML = html.querySelector(".page__container .page__body").innerHTML;
              })
            } else if (this.promoCodeDetail.details !== '') {
              contentContainer.innerHTML = this.promoCodeDetail.details;
              contentContainer.innerHTML = contentContainer.textContent;
            }
          }
        },
        load(el, blockID, shopUrl) {
          this.promoCodeDetail = xParseJSON(el.closest('#x-data-promo_code-' + blockID).getAttribute('x-data-promo_code'));
          let contentContainer = document.getElementById('PromoCodeContent-' + this.promoCodeDetail.sectionID);
          this.sectionID = this.promoCodeDetail.sectionID;
          if (this.cachedResults[blockID]) {
            contentContainer.innerHTML = this.cachedResults[blockID];
            return true;
          }
          if (this.promoCodeDetail.page !== '') {
            this.loading = true;
            let url = `${shopUrl}/pages/${this.promoCodeDetail.page}`;
            fetch(url, {
              method: 'GET'
            }).then(
              response => response.text()
            ).then(responseText => {
              const html = (new DOMParser()).parseFromString(responseText, 'text/html');
              const content = html.querySelector(".page__container .page__body").innerHTML;
              contentContainer.innerHTML = content;
              this.cachedResults[blockID] = content;
            }).finally(() => {
              this.loading = false;
            })
          } else if (this.promoCodeDetail.details !== '') {
            contentContainer.innerHTML = this.promoCodeDetail.details;
            contentContainer.innerHTML = contentContainer.textContent;
          }
        },
        showPromoCodeDetail() {
          this.show = true;
          Alpine.store('xMaximizePopup').handleOpen();
        },
        close() {
          this.show = false;
          Alpine.store('xMaximizePopup').handleClose();
        },
        getDiscountCode() {
          let cookieValue = document.cookie.match('(^|;)\\s*' + 'maximize_discount_code' + '\\s*=\\s*([^;]+)');
          let appliedDiscountCodes = cookieValue ? cookieValue.pop() : '';
          if (appliedDiscountCodes) {
            this.appliedDiscountCodes = appliedDiscountCodes.split(",");
          }
        }
      });
    });
  });
}
