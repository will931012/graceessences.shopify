requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.store('xScrollPromotion', {
      load(el) {
        let scroll = el.getElementsByClassName('el_animate');
        for (let i = 0; i < scroll.length; i++) {
          scroll[i].classList.add('animate-scroll-banner');
        }
      }
    });
    Alpine.store("xProductComparison", {
      isShowWidget: false,
      isShowDrawer: false,
      isShowPopup: false,
      listComparisonProducts: [],
      listComparisonProductsPopUp: [],
      cacheResults: [],
      isClickAddToCompare: false,
      maximumProductCompare: 0,
      loadingOpenDrawer: false,
      loadingFetchDataPopup: false,
      array_variant_options: [],
      array_product_metafields: [],
      sectionId: '',
      arrow_prev: null,
      arrow_next: null,
      table_container: null,
      scrollPosition: 0,
      hasSection: false,
      init(sectionId) {
        const productComparisonStored = window.localStorage.getItem("maximize-product-comparison") || "[]";

        this.listComparisonProducts = JSON.parse(productComparisonStored);

        const productComparisonOverlayEle = document.querySelector(`#productComparisonOverlay`);
        this.sectionId = sectionId;
        if (productComparisonOverlayEle) {
          this.maximumProductCompare = parseInt(productComparisonOverlayEle.dataset.maximumProductCompare);
        }
      },
      updateArrowStatus() {
        if (this.arrow_prev && this.arrow_next) {
          let isStart = false;
          let isEnd = false;

          if (Math.abs(this.scrollPosition) <= 0) {
            isStart = true
          }

          if (Math.abs(Math.abs(this.scrollPosition) - (this.table_container.scrollWidth - this.table_container.clientWidth)) <= 2) {
            isEnd = true
          }

          if (isStart) {
            if (this.arrow_prev.classList.contains('product-compare__arrow-active')) {
              this.arrow_prev.classList.remove('product-compare__arrow-active')
              this.arrow_prev.classList.add('product-compare__arrow-disable')
            }
          } else {
            if (this.arrow_prev.classList.contains('product-compare__arrow-disable')) {
              this.arrow_prev.classList.remove('product-compare__arrow-disable')
              this.arrow_prev.classList.add('product-compare__arrow-active')
            }
          }

          if (isEnd) {
            if (this.arrow_next.classList.contains('product-compare__arrow-active')) {
              this.arrow_next.classList.remove('product-compare__arrow-active')
              this.arrow_next.classList.add('product-compare__arrow-disable')
            }
          } else {
            if (this.arrow_next.classList.contains('product-compare__arrow-disable')) {
              this.arrow_next.classList.remove('product-compare__arrow-disable')
              this.arrow_next.classList.add('product-compare__arrow-active')
            }
          }
        }
      },
      roundIndex(number, isRoudDown = true) {
        let rounded = Math.round(number);
        return Math.abs(number - rounded) <= 0.02 ? rounded : (isRoudDown ? Math.floor(number) : Math.ceil(number));
      },
      slide(next = true) {
        if (next && this.arrow_next.classList.contains('product-compare__arrow-active') || !next && this.arrow_prev.classList.contains('product-compare__arrow-active')) {
          const itemWidth = this.table_container.querySelector('.product-comparison-grid-item:not(.product-comparison-grid-title)').getBoundingClientRect().width;
          const currentItemIndex = this.roundIndex(Math.abs(this.scrollPosition / itemWidth), true);
          if (next) {
            this.scrollPosition = (currentItemIndex + 1) * itemWidth;
            if (Math.abs(Math.abs(this.scrollPosition) - (this.table_container.scrollWidth - this.table_container.clientWidth)) <= 2) {
              this.scrollPosition = this.table_container.scrollWidth - this.table_container.clientWidth;
            }
          } else {
            if (currentItemIndex == this.roundIndex(Math.abs(this.scrollPosition / itemWidth), false)) {
              this.scrollPosition = (currentItemIndex - 1) * itemWidth;
            } else {
              this.scrollPosition = (currentItemIndex) * itemWidth;
            }
            if (Math.abs(this.scrollPosition) < 0) {
              this.scrollPosition = 0;
            }
          }

          this.scrollPosition *= window.Maximize.rtl ? (-1) : 1

          this.table_container.scrollTo({
            left: this.scrollPosition,
            behavior: 'smooth'
          });
          this.updateArrowStatus()
        }
      },
      updateCSSVariables(sectionId) {
        if (sectionId && !this.sectionId) {
          this.sectionId = sectionId;
        }
        const table = document.querySelector(`.product-comparison-table--${this.sectionId}`);
        if (window.innerWidth >= MIN_DEVICE_WIDTH.desktop) {
          table?.style.setProperty('--product-comparison-item-in-table', this.listComparisonProducts.length + 1);
        } else {
          table?.style.setProperty('--product-comparison-item-in-table', this.listComparisonProducts.length);
        }
      },
      setData(list_variant_options, list_product_metafields) {
        this.hasSection = true;
        this.array_variant_options = list_variant_options.split('|||').filter(item => (item != null && item != ''));
        this.array_product_metafields = list_product_metafields.split('|||').filter(item => (item != null && item != ''));
        Array.from(new Set(this.array_variant_options));
        Array.from(new Set(this.array_product_metafields));
        var formData = {
          'attributes': {
            [CART_ATTRIBUTES.product_comparison_options]: this.array_variant_options.join('|||'),
            [CART_ATTRIBUTES.product_comparison_metafields]: this.array_product_metafields.join('|||'),
          }
        };
        fetch(Shopify.routes.root + 'cart/update', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify(formData)
        })
      },
      addProductToCompare(productId, productHandle) {
        if ((this.listComparisonProducts.length >= this.maximumProductCompare && !this.isClickAddToCompare) 
          || this.listComparisonProducts.some(item => item.productId === productId)) return;
        
        this.isClickAddToCompare = true
        if (this.listComparisonProducts.length >= this.maximumProductCompare || this.listComparisonProducts.some(item => item.productId === productId)) {
          return;
        }

        this.isShowWidget = true;

        this.listComparisonProducts.push({
          productId: productId,
          productHandle: productHandle
        });

        localStorage.setItem("maximize-product-comparison", JSON.stringify(this.listComparisonProducts));
        setTimeout(() => {
          this.isClickAddToCompare = false
          this.showDrawer()
        }, 200)
        this.updateCSSVariables()
      },
      removeProductFromCompare(productId, productHandle) {
        this.listComparisonProducts = this.listComparisonProducts.filter((item) => item.productId !== productId);

        localStorage.setItem("maximize-product-comparison", JSON.stringify(this.listComparisonProducts));

        if (this.isShowPopup) {
          const itemData = document.querySelectorAll(`.product-comparison-${productHandle}`)
          if (itemData && itemData.length > 0) {
            for (let i = 0; i < itemData.length; i++) {
              if (itemData[i]) {
                const item = itemData[i]
                item.classList.add('animation-fade-out');
                item.style.height = `${item.offsetHeight}px`
                item.addEventListener('transitionend', (e) => {
                  if (e.propertyName === 'width') {
                    item.classList.add('hidden');
                    this.updateCSSVariables();
                  }
                });
              }
            }
          }
          if (this.listComparisonProducts.length == 0) {
            setTimeout(() => {
              this.closePopup();
            }, 500);
          }
        } else {
          if (this.isShowDrawer) {
            const drawerItem = document.querySelector(`.product-comparison-overlay__item[data-product-id="${productId}"]`);
            if (drawerItem && drawerItem != null) {
              drawerItem.classList.add('animation-fade-out');

              drawerItem.addEventListener('transitionend', () => {
                drawerItem.remove();
              });
            }
          }
          if (this.listComparisonProducts.length == 0) {
            this.hideDrawer();
          }
          this.updateCSSVariables()
        }
      },
      clearAll() {
        const listItem = this.listComparisonProducts
        if (this.isShowDrawer) {
          listItem.map((item, index) => {
            const drawerItem = document.querySelector(`.product-comparison-overlay__item[data-product-id="${item.productId}"]`);
            if (drawerItem && drawerItem != null) {
              drawerItem.classList.add('animation-fade-out');

              drawerItem.addEventListener('transitionend', () => {
                drawerItem.remove();
              });
            }
          })
        }
        this.listComparisonProducts = [];
        localStorage.setItem("maximize-product-comparison", JSON.stringify(this.listComparisonProducts));
        this.hideDrawer();
      },
      handleDataDrawer(text) {
        const html = document.createElement('div');
        html.innerHTML = text;
        const drawerContainer = document.querySelector(`#ProductComparisonDrawer__Main`);
        const drawerContent = html.querySelector('.product-comparison__drawer-content');
        if (drawerContainer && drawerContent) {
          drawerContainer.innerHTML = drawerContent.innerHTML;
        }

        this.isShowDrawer = true;
        const overlayBodyEle = document.querySelector('.overlay-body');

        if (overlayBodyEle) {
          overlayBodyEle.classList.add('is-visible');
        }
        document.body.classList.add("overflow-hidden");
      },
      showDrawer() {
        if (this.isShowDrawer) return;
        const productIdTerm = this.listComparisonProducts.map((item) => `id:${item.productId}`).join(' OR ');
        const urlProductComparisonOverlay = `${window.Maximize.routes.search_url}?section_id=product-comparison-overlay&type=product&q=${productIdTerm}`
        if (this.cacheResults[urlProductComparisonOverlay]) {
          this.handleDataDrawer(this.cacheResults[urlProductComparisonOverlay])
        } else {
          this.loadingOpenDrawer = true;
          fetch(urlProductComparisonOverlay)
            .then((response) => {
              if (!response.ok) {
                let error = new Error(response.status);
                this.close();
                throw error;
              }

              return response.text();
            })
            .then((text) => {
              this.cacheResults[urlProductComparisonOverlay] = text;
              this.handleDataDrawer(text);
            })
            .finally(() => {
              this.loadingOpenDrawer = false;
            })
        }
      },
      hideDrawer() {
        if (!this.isShowDrawer) return;
        this.isShowDrawer = false;

        const overlayBodyEle = document.querySelector('.overlay-body');

        if (overlayBodyEle) {
          overlayBodyEle.classList.remove('is-visible');
        }
        document.body.classList.remove("overflow-hidden");
      },
      handleDataPopUp() {
        this.table_container = document.querySelector(`.product-comparison__table-container`);

        this.arrow_prev = document.querySelector(`.product-comparison__nav-prev`);
        this.arrow_next = document.querySelector(`.product-comparison__nav-next`);

        this.table_container.addEventListener('scroll', () => {
          this.scrollPosition = this.table_container.scrollLeft;
          this.updateArrowStatus();
        });

        if (this.arrow_prev && this.arrow_next) {
          setTimeout(() => {
            this.updateArrowStatus();
          }, 500)
          this.arrow_prev.addEventListener('click', () => this.slide(false));
          this.arrow_next.addEventListener('click', () => this.slide(true));
          this.arrow_prev.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
              this.slide(false);
            }
          })
          this.arrow_next.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
              this.slide(true);
            }
          })
        }

        const listProductData = []

        const fetchPromises = this.listComparisonProducts.map(async (item, index) => {
          const url_product = `/products/${item.productHandle}?section_id=product-comparison-grid-item`;
          if (this.cacheResults[url_product]) {
            return Promise.resolve({index, data: this.cacheResults[url_product]});
          } else {
            if (!this.loadingFetchDataPopup) {
              this.loadingFetchDataPopup = true;
            }
            return fetch(url_product)
              .then(response => {
                return response.text();
              })
              .then((response) => {
                this.cacheResults[url_product] = response
                return {index, data: response};
              })
          }
        })

        Promise.all(fetchPromises).then((results) => {
          results.sort((a, b) => a.index - b.index);
          results.forEach((result) => {
            listProductData.push(result.data);
          });

          const table = document.querySelector('.product-comparison-table-popup')
          listProductData.map((item, index) => {
            const parser = new DOMParser();
            const itemHtml = parser.parseFromString(item, 'text/html')

            const listClassAttributes = [
              {
                gridItem: 'table-header',
                table: `table-header-${this.listComparisonProducts[index].productHandle}-${index}`
              },
              {
                gridItem: 'rating',
                table: `rating-${this.listComparisonProducts[index].productHandle}-${index}`
              },
              {
                gridItem: 'sku',
                table: `sku-${this.listComparisonProducts[index].productHandle}-${index}`
              },
              {
                gridItem: 'description',
                table: `description-${this.listComparisonProducts[index].productHandle}-${index}`
              },
              {
                gridItem: 'vendor',
                table: `vendor-${this.listComparisonProducts[index].productHandle}-${index}`
              },
              {
                gridItem: 'vendor-new-tab',
                table: `vendor-new-tab-${this.listComparisonProducts[index].productHandle}-${index}`
              }
            ]

            listClassAttributes.map((attribute) => {
              const itemContent = itemHtml.querySelector(`.product-comparison-${attribute.gridItem}`)
              const tableContent = table?.querySelector(`.product-comparison-${attribute.table}`)
              if (itemContent && tableContent && itemContent?.innerHTML?.trim()) {
                tableContent.innerHTML = itemContent.innerHTML
              }
            })

            this.array_variant_options.map((option, i) => {
              const itemOptions = itemHtml.querySelector(`.product-comparison-option-${option.replaceAll(" ", "_")}`)
              const tableOptions = table.querySelectorAll(`.product-comparison-option-${option.replaceAll(" ", "_")}-${index}`)
              if (tableOptions && tableOptions.length > 0 && itemOptions?.innerHTML?.trim()) {
                tableOptions.forEach(tableOption => {
                  tableOption.innerHTML = itemOptions.innerHTML
                })
              }

              const itemSwatchesOptions = itemHtml.querySelector(`.product-comparison-option-swatches-${option.replaceAll(" ", "_")}`)
              const tableSwatchesOptions = table.querySelectorAll(`.product-comparison-option-swatches-${option.replaceAll(" ", "_")}-${index}`)
              if (tableSwatchesOptions && tableSwatchesOptions.length > 0 && itemSwatchesOptions?.innerHTML?.trim()) {
                tableSwatchesOptions.forEach(tableOption => {
                  tableOption.innerHTML = itemSwatchesOptions.innerHTML
                })
              }

            })

            this.array_product_metafields.map((metafield, i) => {
              const itemMetafield = itemHtml.querySelector(`.product-comparison-metafield-${metafield.replaceAll(".", "_")}`)
              const tableMetafields = table.querySelectorAll(`.product-comparison-metafield-${metafield.replaceAll(".", "_")}-${index}`)
              if (tableMetafields && tableMetafields.length > 0 && itemMetafield?.innerHTML?.trim()) {
                tableMetafields.forEach(tableMetafield => {
                  tableMetafield.innerHTML = itemMetafield.innerHTML;
                })
              }
            })

          })

          if (this.loadingFetchDataPopup) {
            this.loadingFetchDataPopup = false
          }
        });
      },
      showPopup() {
        const delay = DURATION.DRAWER_TRANSITION;

        setTimeout(() => {
          this.isShowPopup = true;
          this.listComparisonProductsPopUp = this.listComparisonProducts
          const overlayBodyEle = document.querySelector('.overlay-body');

          if (overlayBodyEle && overlayBodyEle != null) {
            overlayBodyEle.classList.add('is-visible');
          }
          document.body.classList.add("overflow-hidden");
          this.handleDataPopUp()
        }, delay)
      },
      closePopup() {
        if (!this.isShowPopup) return;
        this.isShowPopup = false;
        document.body.classList.remove("overflow-hidden");
        Alpine.store('xFocusElement').removeTrapFocus();
        setTimeout(() => {
          this.listComparisonProductsPopUp.map((item) => {
            const itemData = document.querySelectorAll(`.product-comparison-${item.productHandle}.animation-fade-out.hidden`)
            if (itemData && itemData.length > 0) {
              for (let i = 0; i < itemData.length; i++) {
                if (itemData[i]) {
                  const item = itemData[i]
                  item.classList.remove('animation-fade-out');
                  item.classList.remove('hidden');
                }
              }
            }
          })
        }, 1000)
      }
    })

    Alpine.data('xArticle', () => ({
      show: false,
      showInTab: false,
      init() {
        if (document.querySelector('.menu-article')) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (document.querySelector('.menu-article .active')) {
                  document.querySelector('.menu-article .active').classList.remove("active");
                }
                document.querySelectorAll('.item-menu-article')[entry.target.dataset.index].classList.add("active");
              }
            });
          }, {rootMargin: '0px 0px -60% 0px'});
          if (this.$refs.content.querySelectorAll('h2, h3, h4').length > 1) {
            this.$refs.content.querySelectorAll('h2, h3, h4').forEach((heading, index) => {
              heading.dataset.index = index;
              observer.observe(heading);
            });
          } else {
            document.querySelector('.menu-article').remove();
          }
        }
      },
      loadData(list_style) {
        const load = document.querySelector('.load-curr');
        const loadBar = document.querySelector('.load-bar');
        const element = this.$refs.content;
        if (element) {
          document.addEventListener('scroll', () => {
            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollPosition = window.scrollY + windowHeight;

            let scrollPercent;

            if (scrollPosition < elementTop) {
              scrollPercent = 0;
              if (loadBar) loadBar.classList.remove("active-bar")
            } else if (scrollPosition > elementTop + elementHeight) {
              scrollPercent = 100;
            } else {
              if (loadBar) loadBar.classList.add("active-bar")
              scrollPercent = ((scrollPosition - elementTop) / elementHeight) * 100;
            }
            if (load) load.style.width = scrollPercent.toFixed(2) + `%`
          })
        }
        const heading2 = document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4');
        if (heading2.length > 1) {
          let htmlContent = "";
          heading2.forEach((item, index) => {
            if (item.tagName === 'H2') {
              htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>";
            }
            if (item.tagName === 'H3') {
              if (heading2[index - 1] && heading2[index - 1].tagName === 'H2') {
                if (index !== heading2.length - 1 && heading2[index + 1].tagName !== 'H2') {
                  htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    : "<ul class='toc:m-0 toc:pl-4'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                } else {
                  htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    : "<ul class='toc:m-0 toc:pl-4'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                }
              } else {
                if (index !== heading2.length - 1 && heading2[index + 1].tagName !== 'H2') {
                  htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                } else {
                  htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                }
              }
            }
            if (item.tagName === 'H4') {
              if (heading2[index - 1] && heading2[index - 1].tagName !== 'H4') {
                if (index !== heading2.length - 1 && heading2[index + 1].tagName === 'H4') {
                  htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                } else if (index !== heading2.length - 1 && heading2[index + 1].tagName === 'H3') {
                  htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                } else {
                  htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                    : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                }
              } else {
                if (index !== heading2.length - 1 && heading2[index + 1].tagName === 'H4') {
                  htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                } else if (index !== heading2.length - 1 && heading2[index + 1].tagName === 'H3') {
                  htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                } else {
                  htmlContent += "<li class='toc:m-0 item-menu-article w-full cursor-pointer' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                }
              }
            }
          })
          document.querySelector('.list-menu-article').innerHTML += htmlContent;
        }
      },
      scrollTop(el, index) {
        if (document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4').length > index) {
          if (document.querySelector('.menu-article .active')) {
            document.querySelector('.menu-article .active').classList.remove("active");
          }
          el.classList.add("active");
          document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4')[index].scrollIntoView({behavior: "smooth"});
        }
      },
      setPositionSideBar() {
        let sideBarElement = document.querySelector('#side-bar-template');
        if (sideBarElement) {
          if (sideBarElement.querySelector('.side-bar__load-bar .load-bar')) {
            document.querySelector('.main-article__load-bar').appendChild(sideBarElement.querySelector('.side-bar__load-bar .load-bar'));
          }
        }
      }
    }));

    Alpine.data('xShippingPolicy', (wrapperEle, blockId, url, isQuickView = 'false') => ({
      isOpenShippingPolicy: false,
      htmlInner: '',
      pageTitle: '',
      cacheResults: {},
      isLoading: false,
      handleLoadShipping() {
        this.htmlInner = '';
        this.pageTitle = '';
        const textLinkEle = wrapperEle.querySelector('.product-info__shipping-and-tax__text-link');
        textLinkEle?.classList.add('is-loading');
        Alpine.store('xMaximizeDrawer').handleOpen(`#ShippingPolicyDrawer__Container__${blockId}`);
        if (this.cacheResults[url]) {
          this.isOpenShippingPolicy = true;
          const parser = new DOMParser();
          const text = parser.parseFromString(this.cacheResults[url], 'text/html');
          const container = document.querySelector(`#ShippingPolicyPopup__Detail__${blockId}`);

          const pageTitleEl = text.querySelector('.shopify-policy__title');
          if (pageTitleEl) {
            this.pageTitle = pageTitleEl.outerHTML;
            pageTitleEl.remove();
          }

          this.htmlInner = text.querySelector('.shopify-policy__container')?.innerHTML ?? '';
          textLinkEle?.classList.remove('is-loading');

          if (!container) return;
          container.classList.add('animation-fade-in');

          setTimeout(() => {
            container.classList.remove('animation-fade-in');
          }, 100);
        } else {
          fetch(url)
            .then(response => response.text())
            .then(data => {
              this.cacheResults[url] = data
              const parser = new DOMParser();
              const text = parser.parseFromString(data, 'text/html');
              const container = document.querySelector(`#ShippingPolicyPopup__Detail__${blockId}`);

              const pageTitleEl = text.querySelector('.shopify-policy__title');
              if (pageTitleEl) {
                this.pageTitle = pageTitleEl.outerHTML;
                pageTitleEl.remove();
              }

              this.htmlInner = text.querySelector('.shopify-policy__container')?.innerHTML ?? '';

              if (!container) return;
              container.classList.add('animation-fade-in');

              setTimeout(() => {
                container.classList.remove('animation-fade-in');
              }, 100);
            })
            .finally(() => {
              this.isOpenShippingPolicy = true;
              textLinkEle?.classList.remove('is-loading');
            })
        }
      },
      closeShippingPopup(closeQuickView = false) {
        this.isOpenShippingPolicy = false;
        let closeAllDrawer = true;
        if (isQuickView == 'true' && (!closeQuickView || window.innerWidth < MIN_DEVICE_WIDTH.tablet)) {
          closeAllDrawer = false
        }
        Alpine.store('xMaximizeDrawer').handleClose(closeAllDrawer);
        if (isQuickView == 'true' && closeQuickView && window.innerWidth >= MIN_DEVICE_WIDTH.tablet) {
          Alpine.store('xQuickView').close();
        }
      }
    }))

    Alpine.store('xQuickView', {
      sectionId: window.xQuickView.sectionId,
      enabled: window.xQuickView.enabled,
      buttonLabel: window.xQuickView.buttonLabel,
      show: false,
      loading: false,
      cachedResults: [],
      cachedFetch: [],
      selected: false,
      buttonQuickView: "",
      openQuickViewForm: '',
      init() {
        if (Shopify.designMode) {
          document.addEventListener("shopify:section:load", (event) => {
            if (!event.target.classList.contains('section-quick-view')) return;
            this.cachedResults = [];
            this.cachedFetch = [];
          });
        }
      },
      addListener() {
        document.addEventListener(`${CART_EVENT.cartUpdate}`, () => {
          this.cachedResults = [];
        });
      },
      load(productId, url, el) {
        if (this.buttonQuickView == '') {
          this.buttonQuickView = el;
        }
        const productCardWrapper = el.closest('.product-card__wrapper');

        const listSelectedInput = Array.from(
          productCardWrapper?.getElementsByClassName('variant-option__input selected') || []
        );
        let variantId = productCardWrapper?.querySelector(".current-variant")?.textContent.trim();
        // let optionsSelectedValues = listSelectedInput.map(input => input.dataset.optionValueId);
        // optionsSelectedValues = [];
        let productUrl = variantId ? `${url}?variant=${variantId}&section_id=${this.sectionId}` : `${url}?section_id=${this.sectionId}`;
        // let productUrl = variantId ? `${url}?option_values=${optionsSelectedValues.join(',')}&section_id=${this.sectionId}` : `${url}?section_id=${this.sectionId}`;
        productUrl = productUrl.replace(/\s+/g, '');

        if (this.cachedResults[productUrl]) {
          document.getElementById('QuickViewProductContent').innerHTML = this.cachedResults[productUrl];
          Alpine.nextTick(() => {
            Alpine.store('xFocusElement').trapFocus('QuickViewContainer', 'QuickViewClose');
          });
          return true;
        }

        if (this.cachedFetch[productUrl]) {
          return true;
        }

        this.loading = true;
        this.cachedFetch[productUrl] = true;
        fetch(productUrl)
          .then(response => {
            return response.text();
          })
          .then((response) => {
            const parser = new DOMParser();
            const content = parser.parseFromString(response, 'text/html').getElementById("QuickViewProductContent").innerHTML;
            document.getElementById('QuickViewProductContent').innerHTML = content;
            this.cachedResults[productUrl] = content;
            Alpine.nextTick(() => {
              Alpine.store('xFocusElement').trapFocus('QuickViewContainer', 'QuickViewClose');
            });
          })
          .finally(() => {
            this.loading = false;
            this.cachedFetch[productUrl] = false;
          })

        return true;
      },
      open(openFrom = '') {
        this.show = true;
        Alpine.store('xMaximizeDrawer').isOpen = false;
        Alpine.store('xMiniCart').isOpen = false;
        Alpine.store('xMaximizeDrawer').handleOpen("#QuickViewContainer__wapper");
        this.openQuickViewForm = openFrom;
      },
      close() {
        this.show = false;
        this.buttonQuickView = '';

        if (this.openQuickViewForm === 'cart_drawer_upsell') {
          Alpine.store('xMaximizeDrawer').handleClose(false);
          Alpine.store('xMiniCart').handleOpen();
          setTimeout(() => {
            this.openQuickViewForm = '';
          }, 1000)
        } else {
          Alpine.store('xMaximizeDrawer').handleClose();
        }
        this.removeFocusQuickView();
      },
      focusQuickView(quickView, btnClose) {
        if (!this.selected) {
          Alpine.store('xFocusElement').trapFocus(quickView, btnClose);
        }
      },
      removeFocusQuickView() {
        if (!this.selected) {
          Alpine.store('xFocusElement').removeTrapFocus();
        }
      }
    });

    Alpine.data('xMediaGalleryQuickView', (mediaGalleryWrapperEle, sectionId, isShowMediaWithVariantSelected) => ({
      isFirstLoading: true,
      swiffySlider: null,
      thumbnailItems: [],
      thumbnailItemsShow: [],
      mediaItems: [],
      mediaItemsShow: [],
      indexActiveThumbnail: 0,
      indexActiveMedia: 0,
      activeMediaId: false,
      activeMediaItem: false,
      listMediaApplyShowMediaWithVariantSelected: [],
      productMediasInfo: [],
      currentVariant: false,
      sliderIndicatorWrapperEle: mediaGalleryWrapperEle.querySelector('.slider-indicators'),
      listDotsWrapperEl: mediaGalleryWrapperEle.querySelector('.media-gallery__dot-nav__wrapper'),
      listDotsEl: [],
      listDotsShowEl: [],
      maxNumberDotShow: 0,
      showScrollHintDesktop: false,
      init() {
        this.sectionContainer = document.querySelector(`.section--${sectionId}`);
        if (!this.sectionContainer) {
          this.sectionContainer = document.querySelector(`.main-product__container--${sectionId}`);
        }
        if (this.sectionContainer) {
          this.thumbnailWrapper = this.sectionContainer.querySelector(`.media-gallery__thumbnail-wrapper`);
          this.mediaWrapper = this.sectionContainer.querySelector(`.media-gallery__container`);
          this.thumbnailItems = this.sectionContainer.querySelectorAll('.media-gallery__thumbnail-item');
          this.thumbnailItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__thumbnail-item.is-show-thumbnail-item');
          this.mediaItems = this.sectionContainer.querySelectorAll('.media-gallery__media-item');
          this.mediaItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__media-item.is-show-media-item');
          this.listIndicatorEle = this.sliderIndicatorWrapperEle ? this.sliderIndicatorWrapperEle.querySelectorAll(`.slider-indicator`) : [];
          this.listDotsEl = this.listDotsWrapperEl ? this.listDotsWrapperEl.querySelectorAll(`.media-gallery__dot-nav__dot-item`) : [];

          if (this.thumbnailWrapper) {
            this.thumbnailContainer = this.thumbnailWrapper.querySelector('.media-gallery__thumbnail-container');
          }

          let indexActiveMedia = Array.from(this.mediaItems).findIndex(item => item.classList.contains('is-active'));
          this.indexActiveMedia = indexActiveMedia >= 0 ? indexActiveMedia : 0;
          this.activeMediaItem = this.mediaItems[this.indexActiveMedia];
          this.activeMediaId = this.mediaItems[this.indexActiveMedia].dataset.mediaId;

          requestAnimationFrame(() => {
            this.handleScrollDot();
          })
        }
        const dotNavContainerEl = mediaGalleryWrapperEle.querySelector('.media-gallery__dot-nav__container');
        if (dotNavContainerEl) {
          this.maxNumberDotShow = SLIDER_DOT.MAX_NUMBER_DOTS;
        }
        const productMediaInfoEle = document.querySelector(`#ProductMediaInfo__${sectionId}`);
        if (productMediaInfoEle) {
          this.productMediasInfo = JSON.parse(productMediaInfoEle.textContent);
        }
        this.currentVariantInfoElement = document.querySelector(`#CurrentVariantInfo__${sectionId}`);
        this.currentVariant = JSON.parse(this.currentVariantInfoElement.textContent);

        const updateVideoProductMedia = () =>  {
          this.mediaItems.forEach(mediaItem => {
            const videoContainer = mediaItem.querySelector('.external-video');
            if (videoContainer && window.innerWidth < MIN_DEVICE_WIDTH.tablet) {
              if (mediaItem.dataset.mediaId == this.activeMediaId) {
                  Alpine.store('xVideo').updateStatusVideo(videoContainer, true, true);
              } else {
                  Alpine.store('xVideo').updateStatusVideo(videoContainer, false, true);
              }
            }
          })
        }

        this.$watch('activeMediaId', (newActiveMediaId, oldActiveMediaId) => {
          const oldMediaItem =  Array.from(this.mediaItems).find(item => parseInt(item.dataset.mediaId) === oldActiveMediaId);
          if (oldMediaItem) {
            oldMediaItem.style.backgroundImage = ``;
            const media = oldMediaItem.querySelector('.media-gallery-item__media');
            if (media) {
              media.classList.remove('hidden');
            }
          }
          // this.indexActiveThumbnail = newValue;
          this.__scrollThumbnail();
          // this.__updateHeightWhenRatioNatural();
          this.mediaItems.forEach(mediaItem => {
            if (mediaItem.dataset.mediaId == newActiveMediaId) {
              this.activeMediaItem = mediaItem;
              mediaItem.classList.add('is-active');
            } else {
              mediaItem.classList.remove('is-active');
            }
          })
          updateVideoProductMedia();
          this.thumbnailItemsShow.forEach(thumbnailItem => {
            if (thumbnailItem.dataset.mediaId == newActiveMediaId) {
              thumbnailItem.classList.add('is-active');
            } else {
              thumbnailItem.classList.remove('is-active');
            }
          })
          this.listIndicatorEle = this.sliderIndicatorWrapperEle ? this.sliderIndicatorWrapperEle.querySelectorAll(`.slider-indicator`) : [];
          this.listDotsEl = this.listDotsWrapperEl ? this.listDotsWrapperEl.querySelectorAll(`.media-gallery__dot-nav__dot-item`) : [];
          this.listIndicatorEle.forEach(indicator => {
            if (indicator.dataset.mediaId == newActiveMediaId) {
              indicator.classList.add('active');
            } else {
              indicator.classList.remove('active');
            }
          })
          const newIndexActiveSlide = Array.from(this.swiffySlider.slides).findIndex(item => item.dataset.mediaId === newActiveMediaId);
          this.swiffySlider.slideTo(newIndexActiveSlide);
          this.scrollToActiveMedia();
          requestAnimationFrame(() => {
            this.handleScrollDot();
          })
        })

        requestAnimationFrame(() => {
          if (this.$refs.thumbnail_wrapper) {
            const listThumbnailShow = this.$refs.thumbnail_wrapper.querySelectorAll(`.media-gallery__thumbnail-item.is-show-thumbnail-item`);

            if (listThumbnailShow.length > 1) {
              this.$refs.thumbnail_wrapper.classList.add('is-show');
            } else {
              this.$refs.thumbnail_wrapper.classList.remove('is-show');
            }
            this.__updateShowThumbnailNav();
            this.__scrollThumbnail();
          }
        });

        this.$watch('listMediaApplyShowMediaWithVariantSelected', (newList) => {
          const newListString = newList.map(String);
          if (this.$refs.thumbnail_wrapper) {
            if (newList.length > 1) {
              this.$refs.thumbnail_wrapper.classList.add('is-show');
            } else {
              this.$refs.thumbnail_wrapper.classList.remove('is-show');
            }
          }

          this.mediaItems.forEach(mediaItem => {
            if (newListString.includes(mediaItem.dataset.mediaId)) {
              mediaItem.classList.add('is-show-media-item');
            } else {
              mediaItem.classList.remove('is-show-media-item');
            }
          })
          this.mediaItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__media-item.is-show-media-item');
          this.thumbnailItems.forEach(thumbnailItem => {
            if (newListString.includes(thumbnailItem.dataset.mediaId)) {
              thumbnailItem.classList.add('is-show-thumbnail-item');
            } else {
              thumbnailItem.classList.remove('is-show-thumbnail-item');
            }
          })
          this.thumbnailItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__thumbnail-item.is-show-thumbnail-item');
          this.__scrollThumbnail();
          this.listIndicatorEle = this.sliderIndicatorWrapperEle ? this.sliderIndicatorWrapperEle.querySelectorAll(`.slider-indicator`) : [];
          this.listDotsEl = this.listDotsWrapperEl ? this.listDotsWrapperEl.querySelectorAll(`.media-gallery__dot-nav__dot-item`) : [];
          this.listIndicatorEle.forEach(indicator => {
            if (newListString.includes(indicator.dataset.mediaId)) {
              indicator.classList.add('is-show-indicator');
            } else {
              indicator.classList.remove('is-show-indicator'); 
            }
          })
          this.listDotsShowEl = []
          this.listDotsEl.forEach(dot => {
            if (newListString.includes(dot.dataset.mediaId)) {
              dot.classList.add('is-show-dot');
              this.listDotsShowEl.push(dot)
            } else {
              dot.classList.remove('is-show-dot');
            }
          })

          if (this.swiffySlider) {
            this.swiffySlider.slides = mediaGalleryWrapperEle.querySelectorAll('.slide-item.is-show-media-item');
            this.swiffySlider.sliderIndicators = mediaGalleryWrapperEle.querySelectorAll(`.slider-indicator.is-show-indicator`);
            const indexActive = Array.from(this.swiffySlider.slides).findIndex(item => item.dataset.mediaId === this.activeMediaId);

            if (indexActive > -1) {
              this.swiffySlider.slideTo(indexActive);
              requestAnimationFrame(() => {
                this.checkShowScrollHintDesktop();
                this.scrollToActiveMedia();
              });
            }
            this.swiffySlider.addEventToIndicators();
          }

          requestAnimationFrame(() => {
            this.__updateShowThumbnailNav();
            this.checkShowScrollHintDesktop();
          })
        })
        this.handleChangeVariant();
        const debounce = (callback, delay) => {
          let timer;
          return function() {
            clearTimeout(timer);
            timer = setTimeout(callback, delay);
          };
        };

        window.addEventListener('resize', debounce(() => {
          this.__updateShowThumbnailNav();
        }, 300));
        
        installMediaQueryWatcher(`(min-width: ${MIN_DEVICE_WIDTH.tablet}px)`, (matches) => { 
          if (!matches) {
            updateVideoProductMedia();
          } else {
            requestAnimationFrame(() => {
              this.checkShowScrollHintDesktop();
            });
            this.scrollToActiveMedia();
          }
        });

        Alpine.nextTick(() => {
          this.checkShowScrollHintDesktop();
        });
      },
      handleScrollDot() {
        requestAnimationFrame(() => {
          if (this.listDotsShowEl.length > 0) {
            const listDotsContainerEl = this.listDotsWrapperEl.querySelector('.media-gallery__dot-nav__dot-list');
            if (!listDotsContainerEl) return;

            const listDotsContainerWidth = listDotsContainerEl.getBoundingClientRect().width;
            const dotWidth = SLIDER_DOT.DOT_WIDTH;
            const listDotsContainerGap = SLIDER_DOT.DOT_GAP;
            if (!dotWidth && listDotsContainerGap) return;
            
            let indexActiveMedia = Array.from(this.mediaItemsShow).findIndex(item => item.dataset.mediaId == this.activeMediaId);
            if (indexActiveMedia == -1 ) {
              indexActiveMedia = 0;
            }

            this.listDotsShowEl.forEach(dot => {
              dot.classList.remove('dot-small', 'dot-normal');
              if (dot.dataset.mediaId == this.activeMediaId) {
                dot.classList.add('is-active');
              } else {
                dot.classList.remove('is-active');
                if (this.maxNumberDotShow >= this.listDotsShowEl.length) {
                  dot.classList.add('dot-normal')
                }
              }
            })

            if (this.maxNumberDotShow >= this.listDotsShowEl.length) return;

            this.listDotsShowEl[indexActiveMedia + 1] && this.listDotsShowEl[indexActiveMedia + 1].classList.add('dot-normal');
            this.listDotsShowEl[indexActiveMedia - 1] && this.listDotsShowEl[indexActiveMedia - 1].classList.add('dot-normal');
            this.listDotsShowEl[indexActiveMedia + 2] && this.listDotsShowEl[indexActiveMedia + 2].classList.add('dot-small');
            this.listDotsShowEl[indexActiveMedia - 2] && this.listDotsShowEl[indexActiveMedia - 2].classList.add('dot-small');

            const scrollLeftValue = (indexActiveMedia * (dotWidth + listDotsContainerGap) - ( listDotsContainerWidth / 2 - dotWidth / 2)) * (window.Maximize.rtl ? -1 : 1);
            listDotsContainerEl.scrollTo({
              left: scrollLeftValue,
              behavior: 'smooth'
            });
          }
        })
      },
      handleInitSwiffy(el, configs) {
        this.isFirstLoading = false;

        this.swiffySlider = new SwiffySlider(el, configs);
        this.mediaItems = this.sectionContainer.querySelectorAll('.media-gallery__media-item');
        this.mediaItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__media-item.is-show-media-item');

        document.addEventListener(`${PRODUCT_EVENT.updatedVariant}${sectionId}`, (event) => {
          const {currentVariant} = event.detail;
          this.currentVariant = currentVariant;

          this.handleChangeVariant(event);
        });

        el.addEventListener(`${SWIFFY_SLIDER_EVENT.slide}`, (event) => {
          if (this.swiffySlider.slides[this.swiffySlider.activeSlideIndex]) {
            this.activeMediaId = this.swiffySlider.slides[this.swiffySlider.activeSlideIndex].dataset.mediaId;
          }
        })
        if (!this.mediaWrapper) {
          this.sectionContainer = document.querySelector(`.section--${sectionId}`);
          if (!this.sectionContainer) {
            this.sectionContainer = document.querySelector(`.main-product__container--${sectionId}`);
          }
          if (this.sectionContainer) {
            this.mediaWrapper = this.sectionContainer.querySelector(`.media-gallery__container`);
          }
        }
      },
      handleClickNav: function (event, isNext) {
        const totalItemsShow = this.mediaItemsShow.length;
        let indexActiveThumbnail = Array.from(this.mediaItemsShow).findIndex(item => item.dataset.mediaId == this.activeMediaId);

        while (true) {
          indexActiveThumbnail += isNext ? 1 : -1;
          if (indexActiveThumbnail < 0) {
            indexActiveThumbnail = totalItemsShow - 1;
          } else if (indexActiveThumbnail >= totalItemsShow) {
            indexActiveThumbnail = 0;
          }

          this.activeMediaId = this.mediaItemsShow[indexActiveThumbnail].dataset.mediaId;
          break;
        }
      },
      handleFocusThumbnail: function (event) {
        const thumbnailItem = event.currentTarget;
        this.activeMediaId = thumbnailItem.dataset.mediaId;
      },
      handleChangeVariant(event) {
        let listMediaApplyShowMediaWithVariantSelected = [];
        let listMediaNullAlt = [];

        if (isShowMediaWithVariantSelected && this.currentVariant && this.currentVariant.options[0]) {
          let activeMediaId = false;

          let firstOptionHandleCurrentVariant = this.currentVariant.options[0].toLowerCase().replace(/ /g,'-');
          this.mediaItems.forEach(item => {
            if (item.dataset.mediaAlt !== '') {
              let mediaAltHandle = item.dataset.mediaAlt;
              if (firstOptionHandleCurrentVariant === mediaAltHandle) {
                if (!activeMediaId) {
                  activeMediaId = item.dataset.mediaId;
                }

                listMediaApplyShowMediaWithVariantSelected.push(item.dataset.mediaId);
              }
            } else  {
              listMediaNullAlt.push(item.dataset.mediaId);
            }
          })
          if (!activeMediaId) {
            if (this.currentVariant.featured_media && this.currentVariant.featured_media.id) {
              activeMediaId = this.currentVariant.featured_media.id.toString();
            } else {
              activeMediaId = this.productMediasInfo[0].id.toString();
            }
          }
          listMediaApplyShowMediaWithVariantSelected.push(activeMediaId);
          this.activeMediaId = activeMediaId;
          
          listMediaApplyShowMediaWithVariantSelected = listMediaApplyShowMediaWithVariantSelected.concat(listMediaNullAlt);
        } else {
          if (event) {
            let featuredMediaId = `${event.detail.previewMediaId}`;

            if (this.currentVariant && this.currentVariant.featured_media && this.currentVariant.featured_media.id) {
              featuredMediaId = `${this.currentVariant.featured_media.id}`;
            }
            this.activeMediaId = featuredMediaId.toString();
          }

          this.productMediasInfo.forEach(media => {
            listMediaApplyShowMediaWithVariantSelected.push(media.id);
          })
        }

        this.listMediaApplyShowMediaWithVariantSelected = [...new Set(listMediaApplyShowMediaWithVariantSelected)];
        if (this.sliderIndicatorWrapperEle) {
          if (this.listMediaApplyShowMediaWithVariantSelected.length > 1) {
            this.sliderIndicatorWrapperEle.classList.remove('invisible');
          } else {
            this.sliderIndicatorWrapperEle.classList.add('invisible');
          }
        }
      },
      __scrollThumbnail: function () {
        if (this.thumbnailContainer && this.thumbnailWrapper) {
          const gap = parseInt(this.thumbnailContainer.dataset.gap) || 0;
          this.thumbnailItems.forEach((item, index) => {
            if (item.dataset.mediaId === this.activeMediaId) {
              item.classList.add('is-active');
            } else {
              item.classList.remove('is-active');
            }
          })
          requestAnimationFrame(() => {
            const indexActiveThumbnail = Array.from(this.thumbnailItemsShow).findIndex(item => item.dataset.mediaId === this.activeMediaId);
            if (window.innerWidth < MIN_DEVICE_WIDTH.tablet) {
              let scrollLeftValue = 0;
              if (indexActiveThumbnail > 0) {
                for (let i = 0; i < indexActiveThumbnail; i++) {
                  scrollLeftValue += this.thumbnailItemsShow[i].offsetWidth + gap;
                }
              }
              if (window.Maximize.rtl) {
                scrollLeftValue = scrollLeftValue * -1;
              }

              this.thumbnailContainer.scrollTo({
                left: scrollLeftValue,
                behavior: 'smooth'
              });
            }
          });
        }
      },
      __updateShowThumbnailNav() {
        if (this.$refs.thumbnail_wrapper) {
          const thumbnailNavs = this.$refs.thumbnail_wrapper.querySelectorAll('.media-gallery__thumbnail-nav');
          this.thumbnailItemsShow = this.sectionContainer.querySelectorAll('.media-gallery__thumbnail-item.is-show-thumbnail-item');
          requestAnimationFrame(() => {
            if (window.innerWidth < MIN_DEVICE_WIDTH.tablet) {
              const thumbnailNavWrapperWidth = this.$refs.thumbnail_wrapper.getBoundingClientRect().width;
              const thumbnailWrapperWidth = this.thumbnailItemsShow[0]?.getBoundingClientRect().width * this.thumbnailItemsShow.length + parseFloat(this.thumbnailContainer.dataset.gap) * (this.thumbnailItems.length - 1);

              if (thumbnailWrapperWidth <= thumbnailNavWrapperWidth - 16 * 2) {
                thumbnailNavs.forEach(nav => {
                  nav.classList.add('!hidden');
                })
              } else {
                thumbnailNavs.forEach(nav => {
                  nav.classList.remove('!hidden');
                })
              }
            }
          });
        }
      },
      scrollToActiveMedia() {
        Alpine.nextTick(() => {
          const galleryWrapperEl = mediaGalleryWrapperEle.querySelector('.media-gallery__wrapper');
          
          if (window.innerWidth < MIN_DEVICE_WIDTH.tablet) {
            galleryWrapperEl.dataset.isScrollingOnDesktop = 'false';
            return;
          }

          const activeMediaItem = Array.from(this.mediaItemsShow).find(item => item.dataset.mediaId == this.activeMediaId);
          if (!galleryWrapperEl || !activeMediaItem || activeMediaItem.offsetTop <= 0) {
            galleryWrapperEl.dataset.isScrollingOnDesktop = 'false';
            return;
          }

          galleryWrapperEl.scrollTo({
            top: activeMediaItem.offsetTop,
            behavior: 'smooth'
          });
        }); 
      },
      checkShowScrollHintDesktop() {
        const galleryWrapperEl = mediaGalleryWrapperEle.querySelector('.media-gallery__wrapper');
        if (galleryWrapperEl && galleryWrapperEl.scrollHeight > galleryWrapperEl.clientHeight && galleryWrapperEl.scrollTop == 0) {
          this.showScrollHintDesktop = true;
          galleryWrapperEl.addEventListener('scroll', () => {
            this.showScrollHintDesktop = false;
          }, { once: true });

          if (galleryWrapperEl.getElementsByClassName('media-gallery__item__model').length > 0) {
            const setScrollStopped = debounce(() => {
              galleryWrapperEl.dataset.isScrollingOnDesktop = 'false';
            }, TIMEOUT.scrollIdle);

            galleryWrapperEl.addEventListener('scroll', () => {
              galleryWrapperEl.dataset.isScrollingOnDesktop = 'true';
              setScrollStopped();
            });
          }
        } else {
          this.showScrollHintDesktop = false;
        }
      }
    }))

    Alpine.data('xPreviewBadges', () => ({
      isOpen: window.xBadgesPreviewOpen,
      init() {
        document.addEventListener('shopify:section:select', (event) => {
          if (event.target.id.includes('product-labels-and-badges')) {
            this.open();
          } else {
            this.close();
          }
        });

        document.addEventListener('maximize:badges:block-select', () => {
          this.open();
        });
      },
      open() {
        this.isOpen = true;
        window.xBadgesPreviewOpen = true;
      },
      close() {
        Alpine.store('xFocusElement').removeTrapFocus();
        this.isOpen = false;
        window.xBadgesPreviewOpen = false;
      },
      handleFocusLabelsAndBadges(containerId, closeBtnId) {
        const modalContent = this.$refs.modalContentLabelAndBadges; 
        if (modalContent.dataset.isFirstLoad == 'true') {
          modalContent.dataset.isFirstLoad = 'false';
        } else {
          Alpine.store('xFocusElement').trapFocus(containerId, closeBtnId);
        }
      }
    }))

    Alpine.data('xFeaturedBlog', (sectionId, container) => ({
      sectionId: sectionId,
      loading: true,
      show_more: true,
      loadData() {
        this.loading = false;
        let url = `${window.location.pathname}?section_id=${this.sectionId}`;
        fetch(url, {
          method: 'GET'
        }).then(
          response => response.text()
        ).then(responseText => {
          this.loading = false;
        })
      }
    }));

    Alpine.data('xEventCalendar', (event) => ({
      open: false,
      eventDetails: {},
      addToCal(options) {
        let link = "";
        let timeEnd = ""
        this.eventDetails = event;

        if (!event) {
          this.eventDetails = JSON.parse(JSON.stringify(Alpine.store("xEventCalendarDetail").eventDetail))
        }

        let timeStart = this.handleTime(this.eventDetails.start_year, this.eventDetails.month, this.eventDetails.day, this.eventDetails.start_hour, this.eventDetails.start_minute, options);

        if (this.eventDetails.show_end_date) {
          timeEnd = this.handleTime(this.eventDetails.end_year, this.eventDetails.end_month, this.eventDetails.end_day, this.eventDetails.end_hour, this.eventDetails.end_minute, options);
        } else if (this.eventDetails.show_end_time) {
          timeEnd = this.handleTime(this.eventDetails.start_year, this.eventDetails.month, this.eventDetails.day, this.eventDetails.end_hour, this.eventDetails.end_minute, options);
        } else {
          timeEnd = timeStart;
        }

        switch (options) {
          case 'apple':
            this.createDownloadICSFile(0, timeStart, timeEnd, this.eventDetails.title, this.eventDetails.details, this.eventDetails.location, "apple");
            break;
          case 'google':
            link = "http://www.google.com/calendar/event?action=TEMPLATE&trp=false" + "&text=" + encodeURIComponent(this.eventDetails.title) + "&dates=" + timeStart + "/" + timeEnd + "&location=" + encodeURIComponent(this.eventDetails.location) + "&details=" + encodeURIComponent(this.eventDetails.details);
            window.open(link);
            break;
          case 'outlook':
            link = "https://outlook.live.com/calendar/action/compose?rru=addevent" + "&startdt=" + timeStart + "&enddt=" + timeEnd + "&subject=" + encodeURIComponent(this.eventDetails.title) + "&location=" + encodeURIComponent(this.eventDetails.location) + "&body=" + encodeURIComponent(this.eventDetails.details);
            window.open(link)
            break;
          case 'yahoo':
            link = "http://calendar.yahoo.com/?v=60" + "&st=" + timeStart + "&et=" + timeEnd + "&title=" + encodeURIComponent(this.eventDetails.title);
            window.open(link)
            break;
          case 'ical':
            this.createDownloadICSFile(0, timeStart, timeEnd, this.eventDetails.title, this.eventDetails.details, this.eventDetails.location, "ical");
            break;
          default:
            console.error(`Sorry, error`);
        }
      },
      handleTime(year, month, day, hour, minute, options) {
        let date = new Date();

        if (options == 'google' || options == 'yahoo') {
          date = new Date(Date.UTC(year, this.getMonthNumber(month), parseInt(day), parseInt(hour), parseInt(minute)));
          date.setTime(date.getTime() + (-1 * parseInt(this.eventDetails.timezone) * 60 - date.getTimezoneOffset()) * 60 * 1000)
          return date.toISOString().split("Z")[0].replace(".000", "").replace(/[^A-Z0-9]/ig, "");
        } else {
          date = new Date(year, this.getMonthNumber(month), parseInt(day), parseInt(hour), parseInt(minute));
          date.setTime(date.getTime() + (-1 * parseInt(this.eventDetails.timezone) * 60 - date.getTimezoneOffset()) * 60 * 1000)
          if (options == 'apple') {
            return date.toISOString().split("Z")[0].replace(".000", "").replace(/[^A-Z0-9]/ig, "");
          } else {
            return date.toISOString();
          }
        }
      },
      getMonthNumber(month) {
        return new Date(`${month} 1, 2022`).getMonth();
      },
      createDownloadICSFile(timezone, timeStart, timeEnd, title, description, location, type) {
        let icsBody = "BEGIN:VCALENDAR\n" +
          "VERSION:2.0\n" +
          "PRODID:Calendar\n" +
          "CALSCALE:GREGORIAN\n" +
          "METHOD:PUBLISH\n" +
          "BEGIN:VTIMEZONE\n" +
          "TZID:" + timezone + "\n" +
          "END:VTIMEZONE\n" +
          "BEGIN:VEVENT\n" +
          "SUMMARY:" + title + "\n" +
          "UID:@Default\n" +
          "SEQUENCE:0\n" +
          "STATUS:CONFIRMED\n" +
          "TRANSP:TRANSPARENT\n" +
          "DTSTART;TZID=" + timezone + ":" + timeStart + "\n" +
          "DTEND;TZID=" + timezone + ":" + timeEnd + "\n" +
          "LOCATION:" + location + "\n" +
          "DESCRIPTION:" + description + "\n" +
          "END:VEVENT\n" +
          "END:VCALENDAR\n";

        this.download(title + ".ics", icsBody, type);
      },
      download(filename, fileBody, type) {
        var element = document.createElement("a");

        if (type == "ical") {
          element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileBody));
        } else if (type == "apple") {
          var file = new Blob([fileBody], {type: "text/calendar;charset=utf-8"})
          element.href = window.URL.createObjectURL(file)
        }

        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    }));

    Alpine.store('xEventCalendarDetail', {
      show: false,
      eventDetail: {},
      handleEventSelect() {
        var _this = this;
        const eventDetail = JSON.parse(JSON.stringify(this.eventDetail));

        document.addEventListener('shopify:section:select', function (event) {
          if (event.target.classList.contains('section-event-calendar') == false) {
            if (window.Alpine) {
              _this.close();
            } else {
              document.addEventListener('alpine:initialized', () => {
                _this.close();
              });
            }
          }
        })

        if (eventDetail && eventDetail.blockID && eventDetail.sectionID) {
          this.eventDetail = xParseJSON(document.getElementById('x-data-event-' + eventDetail.blockID).getAttribute('x-event-data'));
          let element = document.getElementById('EventDescription-' + this.eventDetail.sectionID);
          element.innerHTML = this.eventDetail.description;
          element.innerHTML = element.textContent;
        }
      },
      load(el, blockID) {
        this.eventDetail = xParseJSON(el.closest('#x-data-event-' + blockID).getAttribute('x-event-data'));
        let element = document.getElementById('EventDescription-' + this.eventDetail.sectionID);
        this.sectionID = this.eventDetail.sectionID;
        element.innerHTML = this.eventDetail.description;
        element.innerHTML = element.textContent;
        this.showEventCalendarDetail();
      },
      showEventCalendarDetail() {
        this.show = true;
        Alpine.store('xMaximizeDrawer').isOpen = true;
      },
      close() {
        this.show = false;
        Alpine.store('xMaximizeDrawer').handleClose();
      }
    });

    Alpine.store("xVideo", {
      ytIframeId: 0,
      vimeoIframeId: 0,
      externalListened: false,
      togglePlay(el) {
        const videoContainer = el.closest('.external-video') || el;
        if (!videoContainer) return;

        let video = videoContainer.getElementsByClassName('video')[0];
        if (!video) return;

        const videoWrapper = el.closest('.video__wrapper');
        const videoText = videoWrapper ? videoWrapper.getElementsByClassName('video__content__text')[0] : null;
        if (videoText) {
          videoText.classList.add('pointer-events-auto');
        }
        if ((video.tagName == 'IFRAME' && videoContainer.classList.contains('function-paused')) || video.paused) {
          this.play(el);
        } else {
          this.pause(el);
        }
      },
      play(el) {
        const videoContainer = el.closest('.external-video') || el;
        if (!videoContainer) return;

        let video = videoContainer?.getElementsByClassName('video')[0];
        if (!video ) return;

        const buttonPlay = videoContainer.getElementsByClassName('button-play')[0];
        const buttonSoundControl = videoContainer.getElementsByClassName('button-sound-control')[0];
        if (buttonPlay) {
          buttonPlay.classList.add('started-video');
        }
        if (buttonSoundControl) {
          buttonSoundControl.setAttribute('tabindex', '0')
        }

        if (video.tagName == 'IFRAME') {
          if (videoContainer.classList.contains('function-paused')) {
            this.externalPostCommand(video, 'play');
            videoContainer.classList.remove('function-paused');
          }
        } else if (video.tagName == 'VIDEO') {
          video.play();
        }
        const videoWrapper = el.closest('.video__wrapper');
        const videoText = videoWrapper ? videoWrapper.getElementsByClassName('video__content__text')[0] : null;
        if (videoText) {
          videoText.classList.add('pointer-events-auto');
        }
      },
      pause(el, isLeave = false) {
        const videoContainer = el.closest('.external-video') || el;
        if (!videoContainer) return;

        let video = videoContainer.getElementsByClassName('video')[0];
        if (!video ) return;

        if (isLeave && videoContainer.dataset.videoStatus == 'play') {
          videoContainer.dataset.pausedByLeave = "true";
        }
        
        if (video.tagName == 'IFRAME') {
          if (!videoContainer.classList.contains('function-paused')) {
            videoContainer.classList.add('function-paused');
            this.externalPostCommand(video, 'pause');
          }
        } else if (video.tagName == 'VIDEO') {
          video.pause();
        }
      },
      mp4Listen(el) {
        let videoContainer = el.closest('.external-video') || el;
        if (!videoContainer) return;

        let video = videoContainer.getElementsByClassName('video')[0];
        if (!video) return;

        let buttonPlay = videoContainer.getElementsByClassName('button-play')[0];
        let buttonSoundControl = videoContainer.getElementsByClassName('button-sound-control')[0];

        video.addEventListener('play', function () {
          if (buttonPlay) {
            buttonPlay.classList.add('is-playing');
          }
          videoContainer.dataset.videoStatus = "play"
          videoContainer.dataset.pausedByLeave = "false";
        });

        video.addEventListener('pause', function () {
          if (buttonPlay) {
            buttonPlay.classList.remove('is-playing');
          }
          videoContainer.dataset.videoStatus = "pause"
        });

        if (buttonSoundControl) {
          video.addEventListener('volumechange', function () {
            if (video.muted) {
              buttonSoundControl.classList.add('is-muted');
            } else {
              buttonSoundControl.classList.remove('is-muted');
            }
          });
        }
      },
      mp4Thumbnail(el, showControls = true) {
        const videoContainer = el.closest(".external-video");
        if (videoContainer) {
          const imgThumbnail = videoContainer.getElementsByClassName("img-thumbnail")[0];
          const video = videoContainer.getElementsByClassName("video")[0];
          if (imgThumbnail) {
            imgThumbnail.classList.add("hidden");
          }

          if (video && showControls) {
            video.setAttribute('tabindex', '0');
            video.focus();
            video.setAttribute("controls", "");
          }

          this.togglePlay(el);
        }

        if (video && showControls) {
          video.setAttribute("controls", "");
        }

        this.togglePlay(el);
      },
      externalLoad(el, host, id, loop, title, showControls = true) {
        let src = "";
        let pointerEvent = "";
        const controls = showControls ? 1 : 0;
        if (host == "youtube") {
          src = `https://www.youtube.com/embed/${id}?mute=1&playlist=${id}&autoplay=1&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&controls=${controls}&showinfo=${controls}`;
        } else {
          src = `https://player.vimeo.com/video/${id}?muted=1&autoplay=1&playsinline=1&api=1&controls=${controls}&loop=${loop ? 1 : 0}`;
        }

        requestAnimationFrame(() => {
          const videoContainer = el.closest(".external-video");
          if (videoContainer) {
            const videoContentEl = videoContainer.querySelector('.video-container');
            if (!videoContentEl) return;
            videoContentEl.innerHTML = `<iframe data-video-loop="${loop}" class="iframe-video absolute w-full h-full video top-1/2 -translate-y-1/2 ${pointerEvent}"
            frameborder="0" host="${host}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen playsinline
            src="${src}" title="${title}"></iframe>`;
            const iframeVideo = videoContainer.querySelector(".iframe-video");
            
            if (showControls) {
              videoContainer.setAttribute('tabindex', '0');
              videoContainer.focus();
            }

            if (iframeVideo) {
              iframeVideo.addEventListener("load", () => {
                setTimeout(() => {
                  if (videoContainer.dataset.isActive == 'true') {
                    this.play(videoContainer);
                  } else {
                    this.pause(videoContainer, true);
                    videoContainer.dataset.videoStatus = "pause";
                  }

                  if (host == "youtube") {
                    this.ytIframeId++;
                    iframeVideo.contentWindow.postMessage(
                      JSON.stringify({
                        event: "listening",
                        id: this.ytIframeId,
                        channel: "widget"
                      }),
                      "*"
                    );
                  } else {
                    this.vimeoIframeId++;
                    iframeVideo.contentWindow.postMessage(
                      JSON.stringify({
                        method: "addEventListener",
                        value: "finish"
                      }),
                      "*"
                    );
                    iframeVideo.contentWindow.postMessage(
                      JSON.stringify({
                        method: 'addEventListener',
                        value: 'play'
                      }),
                      "*"
                    );
                    iframeVideo.contentWindow.postMessage(
                      JSON.stringify({
                        method: 'addEventListener',
                        value: 'pause'
                      }),
                      "*"
                    );
                  }
                }, 100);
              });
            }
          }
        });

        this.externalListen();
      },
      renderVimeoFacade(el, id, options) {
        fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=${options.width}`)
          .then((reponse) => {
            return reponse.json();
          })
          .then((response) => {
            const html = `
              <picture>
                <img src="${response.thumbnail_url}" loading="lazy" class="w-full h-full object-cover" alt="${options.alt}" width="${response.width}" height="${response.height}"/>
              </picture>
            `;

            requestAnimationFrame(() => {
              el.innerHTML = html;
            });
          });
      },
      renderVimeoFacadeSource(el, id, options, loading) {
        fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=${options.width}`)
          .then((response) => response.json())
          .then((response) => {

            const source2 = document.createElement('source');
            source2.srcset = `${response.thumbnail_url}`;
            source2.media = '(min-width: 768px)';
            source2.width = response.width;
            source2.height = response.height;

            const img = document.createElement('img');
            img.src = response.thumbnail_url;
            img.loading = loading;
            img.className = 'object-cover z-10 absolute top-0 left-0 h-full w-full img-thumbnail image-hover';
            img.alt = options.alt || '';
            img.width = response.width;
            img.height = response.height;

            requestAnimationFrame(() => {
              el.appendChild(source2);
              el.appendChild(img);
              const vimeoThumbnailSkeletonEl = el.querySelector('.vimeo-thumbnail-skeleton');
              if (!vimeoThumbnailSkeletonEl) return;
              vimeoThumbnailSkeletonEl.remove();
            });
          });
      },
      externalListen() {
        if (!this.externalListened) {
          window.addEventListener('message', (event) => {
            var iframes = document.getElementsByTagName('IFRAME');

            for (let i = 0, iframe, win, message; i < iframes.length; i++) {
              iframe = iframes[i];
              let videoContainer = iframe.parentNode.closest('.external-video') || iframe.parentNode;
              let buttonSoundControl = videoContainer?.getElementsByClassName('button-sound-control')[0];
              const buttonPlay = videoContainer?.getElementsByClassName('button-play')[0];

              // Cross-browser way to get iframe's window object
              win = iframe.contentWindow || iframe.contentDocument.defaultView;

              if (win === event.source) {
                if (event.origin == 'https://www.youtube.com') {
                  message = JSON.parse(event.data);
                  if (message.info && message.info.playerState == 0) {
                    if (iframe.getAttribute('data-video-loop') === 'true') {
                      this.externalPostCommand(iframe, 'play');
                    } else {
                      if (buttonPlay) {
                        buttonPlay.classList.remove('is-playing');
                      }
                      if (videoContainer) {
                        videoContainer.classList.add('function-paused')
                        videoContainer.dataset.videoStatus = "pause"
                      }
                    }
                  }
                  if (message.info && message.info.playerState == 1) {
                    if (buttonPlay) {
                      buttonPlay.classList.add('is-playing');
                    }
                    if (videoContainer) {
                      videoContainer.classList.remove('function-paused');
                      videoContainer.dataset.videoStatus = "play";
                      videoContainer.dataset.pausedByLeave = "false";
                    }
                  }
                  if (message.info && message.info.playerState == 2) {
                    if (buttonPlay) {
                      buttonPlay.classList.remove('is-playing');
                    }
                    if (videoContainer) {
                      videoContainer.classList.add('function-paused');
                      videoContainer.dataset.videoStatus = "pause";
                      if (videoContainer.dataset.isActive == 'false') {
                        videoContainer.dataset.pausedByLeave = 'true';
                      }
                    }
                  }

                  if (buttonSoundControl && message.info && typeof message.info.muted !== 'undefined') {
                    if (message.info.muted) {
                      buttonSoundControl.classList.add('is-muted');
                    } else {
                      buttonSoundControl.classList.remove('is-muted');
                    }
                  }
                }

                if (event.origin == 'https://player.vimeo.com') {
                  message = JSON.parse(event.data);
                  if (iframe.getAttribute('data-video-loop') !== 'true') {
                    if (message.event == "finish") {
                      if (iframe.getAttribute('data-video-loop') === 'true') {
                        this.externalPostCommand(iframe, 'play');
                      }
                    }
                  }
                  if (message.event === 'play') {
                    if (buttonPlay) {
                      buttonPlay.classList.add('is-playing');
                    }
                    if (videoContainer) {
                      videoContainer.classList.remove('function-paused');
                      videoContainer.dataset.videoStatus = "play";
                      videoContainer.dataset.pausedByLeave = "false";
                    }
                  }
                  if (message.event === 'pause') {
                    if (buttonPlay) {
                      buttonPlay.classList.remove('is-playing');
                    }
                    if (videoContainer) {
                      videoContainer.classList.add('function-paused');
                      videoContainer.dataset.videoStatus = "pause";
                      if (videoContainer.dataset.isActive == 'false') {
                        videoContainer.dataset.pausedByLeave = 'true';
                      }
                    }
                  }

                  if (buttonSoundControl && message.method === 'setVolume') {
                    if (message.value === 0) {
                      buttonSoundControl.classList.add('is-muted');
                    } else {
                      buttonSoundControl.classList.remove('is-muted');
                    }
                  }
                }
              }
            }
          });

          this.externalListened = true;
        }
      },
      externalPostCommand(iframe, cmd) {
        const host = iframe.getAttribute("host");
        let command;
        if (host === "youtube") {
          if (cmd === "mute") {
            command = { event: "command", func: "mute" };
          } else if (cmd === "unmute") {
            command = { event: "command", func: "unMute" };
          } else {
            command = { event: "command", func: cmd + "Video" };
          }
        } else {
          if (cmd === "mute") {
            command = { method: "setVolume", value: 0 };
          } else if (cmd === "unmute") {
            command = { method: "setVolume", value: 1 };
          } else {
            command = { method: cmd, value: "true" };
          }
        }
        iframe.contentWindow.postMessage(JSON.stringify(command), "*");
      },
      toggleMute(el) {
        const videoContainer = el.closest('.external-video') || el;
        if (!videoContainer) return;

        let video = videoContainer.getElementsByClassName('video')[0];
        if (!video) return;

        if (video.tagName != "IFRAME") {
          video.muted = !video.muted;
        } else {
          let buttonSoundControl = videoContainer.getElementsByClassName('button-sound-control')[0];
          if (!buttonSoundControl) return;
          if (buttonSoundControl.classList.contains('is-muted')) {
            this.externalPostCommand(video, 'unmute')
          } else {
            this.externalPostCommand(video, 'mute')
          }
        }
      },
      handleClickButtonPlay(el, video_type, video_id, video_alt, show_controls = true) {
        if (el.classList.contains('started-video')) {
          this.togglePlay(el)
        } else if (video_type == 'video_select') {
          this.mp4Thumbnail(el, show_controls)
        } else {
          this.externalLoad(el, video_type, video_id, false, video_alt, show_controls)
        }
      },
      updateStatusVideo(videoContainer, isPlay, isUpdateActive) {
        let videoContainerDataset = videoContainer.dataset;
        if (!videoContainerDataset) return;
        if (isUpdateActive) {
          videoContainerDataset.isActive = isPlay ? 'true' : 'false';
        }
        if (isPlay && videoContainerDataset.videoAutoPlay == 'true') {
          if (videoContainerDataset.videoStatus == 'pause' && videoContainerDataset.pausedByLeave == 'true' && videoContainerDataset.isActive == 'true') {
            this.play(videoContainer);
          }
        } else {
          this.pause(videoContainer, true);
        }
      },
      firtLoadMp4AutoPlay(el) {
        if (el.dataset.isActive == 'true') {
          this.play(el);
        } else {
          this.pause(el, true);
          el.dataset.videoStatus = "pause";
        } 
        this.mp4Listen(el);
      }
    });

    Alpine.store("xProductRecently", {
      show: false,
      loading: true,
      productsToShow: 0,
      productsToShowMax: 10,
      listRecentlyProducts: [],
      init() {
        let recentlyProductsStored = localStorage.getItem("recently-viewed") ? localStorage.getItem("recently-viewed") : "[]";
        this.listRecentlyProducts = JSON.parse(recentlyProductsStored);
        const recentlyViewedSection = document.getElementById("RecentlyViewedSection")
        if (recentlyViewedSection) {
          this.productsToShow = recentlyViewedSection.dataset.productsToShow;
        }
      },
      showProductRecently() {
        if (this.listRecentlyProducts.length) {
          this.show = true;
        } else {
          this.show = false;
        }
      },
      setProduct(productViewed) {
        if (this.listRecentlyProducts.length) {
          let productList = this.listRecentlyProducts;
          productList = [...productList.filter((p) => p !== productViewed)].filter((p, i) => i < this.productsToShowMax);
          // need to confirm with BA logic recently viewed in quickview
          if (productList.length === 0) {
            this.show = false;
          } else {
            this.show = true;
          }
          let newData = [productViewed, ...productList];
          localStorage.setItem("recently-viewed", JSON.stringify(newData));
        } else {
          this.show = false;
          localStorage.setItem("recently-viewed", JSON.stringify([productViewed]));
        }
      },
      getProductRecently(sectionId, productId) {
        let products = this.listRecentlyProducts;
        if (this.listRecentlyProducts.length) {
          products = productId ? [...products.filter((p) => p !== productId)] : products;
          products = products.slice(0, this.productsToShow);
        } else {
          return;
        }
        const el = document.querySelector("#RecentlyViewedSection .recently-viewed__content");
        let query = products.map((value) => "id:" + value).join(" OR ");
        const search_url = `${Shopify.routes.root}search?section_id=${sectionId}&type=product&q=${query}`;
        fetch(search_url)
          .then((response) => {
            if (!response.ok) {
              const error = new Error(response.status);
              console.error(error);
              throw error;
            }
            return response.text();
          })
          .then((text) => {
            const resultsElement = new DOMParser().parseFromString(text, "text/html").querySelector("#RecentlyViewedSection .recently-viewed__content");
            const resultsMarkup = resultsElement ? resultsElement.innerHTML : "";
            el.innerHTML = resultsMarkup;
            document.dispatchEvent(new CustomEvent(`${ANIMATION_EVENT.revealItem}`));
          })
          .catch((error) => {
            throw error;
          })
          .finally(() => {
            this.loading = false;
          });
        ;
      },
      clearHistory() {
        let result = confirm("Are you sure you want to clear your recently viewed products?");
        if (result === true) {
          localStorage.removeItem("recently-viewed");
          this.show = false;
        }
      },
    });

    Alpine.data("xMap", (data) => ({
      load() {
        const mapIframe = this.$el.querySelector("iframe");
        if (mapIframe) {
          mapIframe.addEventListener("load", () => {
            mapIframe.classList.remove("hidden");
            this.$refs.iframe_placeholder.classList.add("hidden");
          });
          mapIframe.src = `https://maps.google.com/maps?q=${data}&t=m&z=17&ie=UTF8&output=embed&iwloc=near`;
        }
      },
      loadMap(location) {
        this.$el.querySelector(
          "iframe"
        ).src = `https://maps.google.com/maps?q=${location}&t=m&z=17&ie=UTF8&output=embed&iwloc=near`;
      },
      removeMap() {
        this.$el.querySelector(
          "iframe"
        ).src = ``;
      }
    }));

    Alpine.data("xFlowCard", (openFirstTab, sectionId, blockSize) => ({
      openFirstTab: false,
      activeCardIndex: 1,
      nextActiveIndex1: 2,
      nextActiveIndex2: 3,
      shown: false,
      loading: true,
      sectionId: sectionId,
      previousIndex: null,
      type: "next",
      init() {
        this.openFirstTab = openFirstTab;
        this.debounceSelectFlowCard = this.debounce(this.handleSelectFlowCard, 100);

        const updateVideoFlowCards = () => {
          const flowCards = this.$el.querySelectorAll('.flow-card');
          flowCards.forEach(element => {
            const videoContainer = element.querySelector('.external-video');
            if (videoContainer) {
              if (element.classList.contains('flow-card--current')) {
                Alpine.store('xVideo').updateStatusVideo(videoContainer, true, true);
              } else {
                Alpine.store('xVideo').updateStatusVideo(videoContainer, false, true);
              }
            }
          })
        }

        this.$watch('activeCardIndex', () => {
          updateVideoFlowCards();
        });
      },
      handleSelectFlowCard(activeIndex) {
        let type = "";
        if (this.activeCardIndex > activeIndex) {
          type = "previous";
        } else if (this.activeCardIndex < activeIndex) {
          type = "next";
        }
        this.previousIndex = this.activeCardIndex;
        this.activeCardIndex = activeIndex;
        this.openFirstTab = true;
        this.calculateNewIndex(type)
      },
      debounce(func, wait) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      },
      calculateNewIndex(type) {
        this.nextActiveIndex1 = (this.activeCardIndex % blockSize) + 1;
        this.nextActiveIndex2 = (this.nextActiveIndex1 % blockSize) + 1;
        this.type = type;
      },
      handleNavigationCard(type) {
        this.previousIndex = this.activeCardIndex;
        if (type === "previous") {
          this.activeCardIndex = ((this.activeCardIndex - 2 + blockSize) % blockSize) + 1;
        } else if (type === "next") {
          this.activeCardIndex = this.nextActiveIndex1;
        }
        this.calculateNewIndex(type)
      },
      firstLoadData() {
        let url = `${window.location.pathname}?section_id=${this.sectionId}`;
        fetch(url, {
          method: "GET",
        })
          .then((response) => response.text())
          .then(() => {
            this.loading = false;
          });
      },
      getCardClasses(index) {
        return {
          'flow-card--current-1': index === this.nextActiveIndex1 && blockSize > 1,
          'flow-card--current-2': index === this.nextActiveIndex2 && blockSize > 2,
          'flow-card--out': index !== this.activeCardIndex,
          'flow-card--current': index === this.activeCardIndex,
          'flow-card--next': this.type === 'next' && index === this.previousIndex,
          'flow-card--prev': this.type === 'previous' && index === this.previousIndex
        };
      }
    }));

    Alpine.data("xSearchTab", (sectionId) => ({
      activeTab: "product",
      articleCount: 0,
      pageCount: 0,
      collectionCount: 0,
      term: '',
      init() {
        this.term = this.$root.querySelector("#SearchTermContent")?.textContent;
        this.fetchArticlesResult();
        this.fetchPagesResult();
        this.fetchCollectionsResult();
      },
      getURL(term, sectionId, param) {
        return `${window.Shopify.routes.root}search?section_id=${sectionId}&q=${term}&${param}`;
      },
      fetchArticlesResult() {
        let param = "type=article&options[prefix]=last&options[unavailable_products]=last";
        let url = this.getURL(this.term, sectionId, param);

        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, "text/html");
            const mainSearchResult = document.getElementById("MainSearchResult_Article");
            const productGridContainer = html.querySelector("#ProductGridContainer");
            const resultCountElement = html.getElementById("ResultCount");

            if (mainSearchResult && productGridContainer) {
              mainSearchResult.innerHTML = productGridContainer.innerHTML;
              if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger();
            }

            if (resultCountElement) {
              this.articleCount = Number(resultCountElement.innerHTML);
            } else {
              this.articleCount = 0;
            }
          })
          .catch((error) => {
            console.error(error);
          });
      },

      fetchPagesResult() {
        let param = "type=page&options[prefix]=last&options[unavailable_products]=last";
        let url = this.getURL(this.term, sectionId, param);

        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, "text/html");

            const mainSearchResult = document.getElementById("MainSearchResult_Page");
            const productGridContainer = html.querySelector("#ProductGridContainer");
            const resultCountElement = html.getElementById("ResultCount");

            if (mainSearchResult && productGridContainer) {
              mainSearchResult.innerHTML = productGridContainer.innerHTML;
            }

            if (resultCountElement) {
              this.pageCount = Number(resultCountElement.innerHTML);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      },

      fetchCollectionsResult() {
        const url = `${Shopify.routes.root}search/suggest?q=${encodeURIComponent(this.term)}&${encodeURIComponent("resources[type]")}=${"collection"}&${encodeURIComponent("resources[limit]")}=${encodeURIComponent(10)}&section_id=predictive-search-collection`;

        fetch(url)
          .then((response) => {
            if (!response.ok) {
              let error = new Error(response.status);
              throw error;
            }
            return response.text();
          })
          .then((responseText) => {
            const parser = new DOMParser();
            const text = parser.parseFromString(responseText, "text/html");
            const collectionWrapper = document.getElementById("ItemsGrid-collection");
            const listCollections = text.querySelectorAll(".collection-item");

            if (listCollections.length > 0) {
              if (collectionWrapper) {
                collectionWrapper.innerHTML = "";
                listCollections.forEach((collection) => {
                  collectionWrapper.insertAdjacentHTML("beforeend", collection.innerHTML);
                });
              }
            } else {
              const msgNoResult = text.querySelector(".msg-no-result");
              if (collectionWrapper && msgNoResult) {
                collectionWrapper.style.display = "block"
                collectionWrapper.innerHTML = msgNoResult.innerHTML
              }
            }

            this.collectionCount = listCollections.length || 0;
          })
          .catch((error) => {
            console.error(error);
          });
      },
    }));

    Alpine.data('xPopups', (data) => ({
      enable: false,
      showMinimal: false,
      show: Shopify.designMode ? (localStorage.getItem(data.name + '-' + data.sectionId) ? xParseJSON(localStorage.getItem(data.name + '-' + data.sectionId)) : true) : false,
      delayDays: data.delayDays ? data.delayDays : 0,
      t: '',
      copySuccess: false,
      init() {
        if (Shopify.designMode) {
          let _this = this;
          const handlePopupSelect = (event, isResize = null) => {
            if (event.detail && event.detail.sectionId && event.detail.sectionId.includes(data.sectionId) || isResize) {
              if (window.Alpine) {
                _this.open();
                localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(true));
              } else {
                document.addEventListener('alpine:initialized', () => {
                  _this.open();
                  localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(true));
                });
              }
            } else {
              if (window.Alpine) {
                _this.closeSection();
                localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
              } else {
                document.addEventListener('alpine:initialized', () => {
                  _this.closeSection();
                  localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
                });
              }
            }
          }

          document.addEventListener('shopify:section:select', (event) => {
            handlePopupSelect(event);
          });

          document.addEventListener('shopify:block:select', (event) => {
            handlePopupSelect(event);
          });

          //reload popup and display overlay when change screen in shopify admin
          if (data.name != 'popup-age-verification') {
            window.addEventListener('resize', (event) => {
              handlePopupSelect(event, xParseJSON(localStorage.getItem(data.name + '-' + data.sectionId)));
              if (xParseJSON(localStorage.getItem(data.name + '-' + data.sectionId))) {

              }
            })
          }
        }

        this.handleLoadPage();

        if (this.$el.querySelector('.newsletter-message')) {
          this.open();
        }
      },
      load() {
        //optimize popup load js
        if (window.location.pathname === '/challenge') return;

        const _this = this;
        if (Shopify.designMode) {
          _this.open();
        } else {
          if (data.name == 'popup-promotion' && !this.handleSchedule() && data.showCountdown) return;

          if (data.name == 'popup-promotion' && document.querySelector("#x-age-popup") && xParseJSON(localStorage.getItem('popup-age-verification')) == null) {
            document.addEventListener("close-age-verification", () => {
              setTimeout(() => {
                _this.open();
              }, data.delays * 1000);
            })
            return;
          }

          setTimeout(() => {
            _this.open();
          }, data.delays * 1000);
        }
      },
      open() {
        if (!Shopify.designMode && this.isExpireSave() && !this.show) return;

        var _this = this;
        if (data.name == 'popup-age-verification') {
          if (this.isExpireSave() && !Shopify.designMode && !data.show_popup) return;

          requestAnimationFrame(() => {
            Alpine.store('xMaximizePopup').handleOpen();
          });
        }

        // Show minimal popup when
        // 1. "Show minimal" is enabled for desktop, default style is set to "minimal", and the window width is >= 768
        // 2. "Show minimal" is enabled for mobile, default mobile style is set to "minimal", and the window width is < 768
        if ((data.showMinimal && data.default_style == "minimal" && window.innerWidth >= 768)
          || (data.showMinimalMobile && data.default_style_mobile == "minimal" && window.innerWidth < 768)) {
          _this.showMinimal = true;
          _this.show = false;
          if (Shopify.designMode) {
            localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
            _this.removeOverlay();
          }
        } else {
          // Show full popup
          if (data.showOnMobile && window.innerWidth < 768 || window.innerWidth >= 768) {
            // Show a full popup the first time a customer accesses the site. If the customer closes the full popup, display a minimal popup for the rest of the session.
            if (localStorage.getItem('current-' + data.sectionId) == 'minimal') {
              _this.showMinimal = true;
              _this.show = false;
              _this.removeOverlay();
            } else {
              _this.show = true;
              _this.showMinimal = false;
              _this.setOverlay();
              if (!Shopify.designMode) {
                _this.saveDisplayedPopup();
              }
            }
          } else {
            // Show nothing when screen width is < 768 and "Show popup on mobile" is disabled.
            _this.removeOverlay();
          }
        }
      },
      close() {
        if (data.name == 'popup-age-verification') {
          this.show = false;
          requestAnimationFrame(() => {
            document.body.classList.remove("overflow-hidden");
            Alpine.store('xMaximizePopup').handleClose();
          });
          document.dispatchEvent(new Event('close-age-verification'));
          if (!this.isExpireSave()) {
            this.setExpire()
          }
          return;
        }
        var _this = this;
        if (Shopify.designMode) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              _this.showMinimal = true;
            }, 300);
          });
        } else {
          this.removeDisplayedPopup();
          if ((data.showMinimal && window.innerWidth >= 768) || (data.showMinimalMobile && window.innerWidth < 768)) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                _this.showMinimal = true;
              }, 300);
              // Save data to storage when the full popup is closed (the full popup only shows on the first access to the site)
              localStorage.setItem('current-' + data.sectionId, 'minimal');
            });
          } else {
            if (!this.isExpireSave()) {
              this.setExpire()
            }
          }
        }
        requestAnimationFrame(() => {
          _this.show = false;
          _this.removeOverlay();
        });
      },
      closeSection() {
        this.show = false;
        this.showMinimal = false;
        this.removeOverlay();
      },
      setExpire() {
        const item = {
          section: data.sectionId,
          expires: Date.now() + this.delayDays * 24 * 60 * 60 * 1000
        }

        localStorage.setItem(data.sectionId, JSON.stringify(item))
        //remove storage data, the full popup will be displayed when the site applies the reappear rule.
        localStorage.removeItem('current-' + data.sectionId);
      },
      isExpireSave() {
        const item = xParseJSON(localStorage.getItem(data.sectionId));
        if (item == null) return false;

        if (Date.now() > item.expires) {
          localStorage.removeItem(data.sectionId);
          return false;
        }

        return true;
      },
      handleSchedule() {
        if (data.showCountdown) {
          let el = document.getElementById('x-promotion-' + data.sectionId);
          let settings = xParseJSON(el.getAttribute('x-countdown-data'));
          if (!Alpine.store('xHelper').canShow(settings)) {
            if (!Shopify.designMode && data.schedule_enabled) {
              requestAnimationFrame(() => {
                this.show = false;
              });

              return false;
            }
          }
        }

        this.enable = true;
        return true;
      },
      clickMinimal() {
        requestAnimationFrame(() => {
          this.show = true;
          this.showMinimal = false;
          Alpine.store('xMaximizePopup').handleOpen();
          if (!Shopify.designMode) {
            this.saveDisplayedPopup()
          }
          this.setOverlay();
        })
      },
      setOverlay() {
        if (data.overlay) {
          let popupsDiv = document.querySelector("#Popup__Overlay");
          if (popupsDiv.classList.contains('block')) return
          popupsDiv.classList.add('block');
          popupsDiv.classList.remove('hidden');
        }
      },
      removeOverlay() {
        if (data.overlay) {
          let popupsDiv = document.querySelector("#Popup__Overlay")
          displayedPopups = xParseJSON(localStorage.getItem("promotion-popup-overlay")) || [];
          if (popupsDiv.classList.contains('block') && displayedPopups.length == 0) {
            popupsDiv.classList.remove('block');
            popupsDiv.classList.add('hidden');
            Alpine.store('xMaximizePopup').handleClose();
          }
        }
      },
      //close minimal popup will set expired
      closeMinimal() {
        this.showMinimal = false;
        if (Shopify.designMode) return

        if (!this.isExpireSave()) this.setExpire();
      },
      saveDisplayedPopup() {
        let localStorageArray = xParseJSON(localStorage.getItem('promotion-popup-overlay')) || [];
        if (!localStorageArray.some(item => item == data.name + '-' + data.sectionId)) {
          localStorageArray.push(data.name + '-' + data.sectionId);
          localStorage.setItem('promotion-popup-overlay', JSON.stringify(localStorageArray));
        }
      },
      removeDisplayedPopup() {
        let localStorageArray = xParseJSON(localStorage.getItem('promotion-popup-overlay')),
          updatedArray = localStorageArray.filter(item => item != data.name + '-' + data.sectionId);
        localStorage.setItem('promotion-popup-overlay', JSON.stringify(updatedArray));
      },
      handleLoadPage() {
        localStorage.setItem('promotion-popup-overlay', JSON.stringify([]));
      },
      handleFocusPopup() {
        if (this.$el.dataset.isFirstLoad == 'true') {
          this.$el.dataset.isFirstLoad = 'false'
        } else {
          Alpine.store('xFocusElement').trapFocus(`PopupFullWidth-${data.sectionId}`, `ClosePromotionPopup__${data.sectionId}`);
        }
      }
    }));

    Alpine.store('xPickupAvailable', {
      updatePickUp(sectionId, variantId, variantAvailable) {
        const container = document.querySelector(`#PickupAvailability__${sectionId}`);
        if (!container) return;
        if (variantAvailable) {
          fetch(`${window.Shopify.routes.root}variants/${variantId}/?section_id=pickup-availability`)
            .then(response => response.text())
            .then(text => {
              const pickupAvailabilityHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
              if (pickupAvailabilityHTML) {
                container.innerHTML = pickupAvailabilityHTML.innerHTML;
              }
            })
            .catch(e => {
              console.error(e);
            });
        } else {
          container.innerHTML = '';
        }
      }
    });

    Alpine.data("xProductPicker", (priceFilterStyle, sectionId) => ({
      collectionUrl: "",
      templateFilter: "",
      filterOption: [],
      listRenderedFilter: [],
      isLoading: false,
      showResultText: false,
      numberFilter: 3,
      init() {
        this.templateFilter = document.querySelector("template.template-filter").innerHTML;
      },
      handleCollectionSelectChange(event) {
        const selectElement = event.target;
        const filtersData = JSON.parse(selectElement.dataset.filters);
        this.collectionUrl = event?.detail?.value;
        this.filterOption = filtersData;
        this.fetchFilter();
        this.showResultText = false;
        this.listRenderedFilter = [];
      },
      fetchFilter(isChangeResult, url) {
        let urlParam = `${this.collectionUrl}?section_id=product-picker-filter`;
        if (url) {
          urlParam = url;
        }
        this.isLoading = true;
        fetch(urlParam)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, "text/html");
            for (let i = 0; i < this.numberFilter; i++) {
              const currentFilter = this.filterOption[i];
              if (isChangeResult) {
                this.renderResultCount(html);
                this.renderOptionListFilter(html, currentFilter.fitler, currentFilter.dropdownFormat, i);
              } else {
                this.renderListFilter(html, currentFilter.filter, currentFilter.title, currentFilter.dropdownFormat, i);
              }
            }
          })
          .finally(() => (this.isLoading = false));
      },
      renderListFilter(html, filterName, filterTitle, dropdownFormat, index) {
        const oldElement = this.$root.querySelector(`.filter-${index + 1}__wrapper`);
        if (this.listRenderedFilter.includes(filterName)) {
          oldElement.innerHTML = this.templateFilter;
          const buttonLabelEl = oldElement.querySelector(".select-button__label");
          if (buttonLabelEl) {
            buttonLabelEl.textContent = filterName;
          }
          return;
        }
        let listResult = this.getListResult(html, filterName);
        if (listResult && filterName) {
          const selectElementLabels = listResult.querySelectorAll(".parent-text-label");
          if (selectElementLabels && filterTitle) {
            selectElementLabels.forEach(ele => ele.textContent = filterTitle)
          }
          const swatchLabels = listResult.querySelectorAll(".swatch-option__label");
          swatchLabels.forEach((element) => (element.dataset.typeDisplay = dropdownFormat));
          if (listResult.dataset.type === "price") {
            oldElement.innerHTML = listResult.querySelector(`[data-price-filter-type="${priceFilterStyle}"]`)?.innerHTML;
          } else {
            oldElement.innerHTML = listResult.innerHTML;
          }
          this.listRenderedFilter.push(filterName);
        } else {
          oldElement.innerHTML = this.templateFilter;
        }
      },
      getFormParams(formElement) {
        const formData = new FormData(formElement);
        for (const pair of formData.entries()) {
          if (!pair[1]) {
            formData.delete(pair[0]);
          }
        }
        const formParams = new URLSearchParams(formData).toString();
        return formParams;
      },
      handleClick(event) {
        event.preventDefault();
        if (!this.collectionUrl) {
          return;
        }
        const formParams = this.getFormParams(this.$refs[`form_${sectionId}`]);
        window.location.href = `${this.collectionUrl}?${formParams}`;
      },
      handleOptionChange() {

        if (!this.collectionUrl) {
          return;
        }
        const formParams = this.getFormParams(this.$refs[`form_${sectionId}`]);
        this.fetchFilter(true, `${this.collectionUrl}?${formParams}&section_id=product-picker-filter`);
      },
      renderResultCount(html) {
        const totalResult = html.querySelector(".total-result");
        if (totalResult) {
          this.showResultText = totalResult.textContent;
        }
      },
      renderOptionListFilter(html, filterName, dropdownFormat, index) {
        if (!filterName) return;
        let listResult = this.getListResult(html, filterName);
        const oldElement = this.$root.querySelector(`.filter-${index + 1}__wrapper`);
        if (listResult && filterName) {
          const swatchLabels = listResult.querySelectorAll(".swatch-option__label");
          swatchLabels.forEach((element) => (element.dataset.typeDisplay = dropdownFormat));
          if (listResult.dataset.type !== "price") {
            let listSelectOptionEl = oldElement.querySelector(".select-options-wrapper");
            if (listSelectOptionEl) {
              listSelectOptionEl.innerHTML = listResult?.querySelector(".select-options-wrapper")?.innerHTML;
            }
          }
        }
      },
      getListResult(html, filterName) {
        let listResult = null;
        const listFilterName = filterName.trim().split(";");
        for (i = 0; i < listFilterName.length; i++) {
          if (html.querySelector(`div[data-label="${listFilterName[i]}"]`)) {
            listResult = html.querySelector(`div[data-label="${listFilterName[i]}"]`);
            break;
          }
        }
        return listResult;
      },
    }));

    Alpine.data("xRangePrice", () => ({
      rangeInput: [],
      priceInput: [],
      priceLabel: [],
      rangeProgress: null,
      init() {
        const root = this.$root;
        this.rangeInput = root.querySelectorAll(".range-input input");
        this.priceInput = root.querySelectorAll(".price-input");
        this.rangeProgress = root.querySelector(".slider .progress");
        this.priceLabel = root.querySelectorAll(".price-label");
        this.debounceDispatchEvent = this.debounce(this.dispatchEventCustomEvent, 500);
        this.handleRangePrice();
      },
      initRange() {
        let minVal = Number(this.rangeInput[0]?.value).toFixed(2),
          maxVal = Number(this.rangeInput[1]?.value).toFixed(2);
        if (this.rangeProgress) {
          this.rangeProgress.style.setProperty('--left_range', (minVal / this.rangeInput[0].max) * 100 + '%');
          this.rangeProgress.style.setProperty('--right_range', 100 - (maxVal / this.rangeInput[1].max) * 100 + '%');
        }
      },
      debounce(func, delay) {
        let timer;
        return function (...args) {
          clearTimeout(timer);
          timer = setTimeout(() => func.apply(this, args), delay);
        };
      },
      dispatchEventCustomEvent(event, el) {
        const customEvent = new CustomEvent(event, {bubbles: true, cancelable: true});
        el.dispatchEvent(customEvent);
      },
      handleRangePrice() {
        this.rangeInput.forEach((input) => {
          input.addEventListener("input", (e) => {
            e.preventDefault();
            let minVal = Number(this.rangeInput[0]?.value).toFixed(2),
              maxVal = Number(this.rangeInput[1]?.value).toFixed(2);
            if (+maxVal < +minVal) {
              if (e.target.classList.contains("range-min")) {
                maxVal = minVal;
                this.rangeInput[1].value = maxVal;
                this.priceInput[0] && (this.priceInput[0].value = minVal);
                this.priceInput[1] && (this.priceInput[1].value = maxVal);
              } else {
                minVal = maxVal;
                this.rangeInput[0].value = minVal;
                this.priceInput[1].value && (this.priceInput[1].value = maxVal);
                this.priceInput[0].value && (this.priceInput[0].value = minVal);
              }
            } else {
              if (this.priceInput.length > 0) {
                this.priceInput[0].value = minVal;
                this.priceInput[1].value = maxVal;
              }
            }
            if (this.priceLabel.length > 0) {
              this.priceLabel[0].textContent = minVal;
              this.priceLabel[1].textContent = maxVal;
            }
            if (this.rangeProgress) {
              this.rangeProgress.style.setProperty("--left_range", (minVal / this.rangeInput[0].max) * 100 + "%");
              this.rangeProgress.style.setProperty("--right_range", 100 - (maxVal / this.rangeInput[1].max) * 100 + "%");
            }

            this.debounceDispatchEvent(SELECT_ELEMENT_EVENT.change, e.target);
          });
        });
      },
      handlePriceInput(e) {
        let currentTarget = e.currentTarget;
        let minVal = Number(this.priceInput[0].min);
        let maxVal = Number(this.priceInput[1].max);
        let minValInput = Number(this.priceInput[0].value ? this.priceInput[0].value : 0);
        let maxValInput = Number(this.priceInput[1].value ? this.priceInput[1].value : maxVal);
        let endWithDot = false
        requestAnimationFrame(() => {
          if (currentTarget === this.priceInput[0]) {
            if (minValInput > maxValInput) {
              if (minValInput > maxVal) {
                minValInput = maxVal;
                endWithDot = true
              }
              maxValInput = minValInput;
            } else if (minValInput < minVal) {
              minValInput = minVal;
              endWithDot = true
            }
            if (endWithDot) {
              this.priceInput[0].value = minValInput !== minVal ? minValInput : null;
            }
            this.priceInput[1].value = maxValInput !== maxVal ? maxValInput : null;
          }

          if (currentTarget === this.priceInput[1]) {
            if (maxValInput < minValInput) {
              if (maxValInput < minVal) {
                maxValInput = minVal;
                endWithDot = true;
              }
              minValInput = maxValInput;
            } else if (maxValInput > maxVal) {
              maxValInput = maxVal;
              endWithDot = true;
            }
            if (endWithDot) {
              this.priceInput[1].value = maxValInput !== maxVal ? maxValInput : null;
            }
            this.priceInput[0].value = minValInput !== minVal ? minValInput : null;
          }

          if (this.rangeInput.length > 0) {
            this.rangeInput[0].value = minValInput;
            this.rangeInput[1].value = maxValInput;
          }
          if (this.rangeProgress) {
            this.rangeProgress.style.setProperty("--left_range", (minValInput / maxVal) * 100 + "%");
            this.rangeProgress.style.setProperty("--right_range", 100 - (maxValInput / maxVal) * 100 + "%");
          }
        });
        this.debounceDispatchEvent(SELECT_ELEMENT_EVENT.change, e.target);
      },
    }));

    Alpine.data('xProductDrawer', () => ({
      isShowDrawer: false,
      openDrawer(idBlockDrawer) {
        this.isShowDrawer = true;
        Alpine.store('xMaximizeDrawer').handleOpen(idBlockDrawer);
      },
      closeDrawer(closeQuickView = false) {
        Alpine.store('xFocusElement').removeTrapFocus();
        this.isShowDrawer = false;
        let closeAllDrawer = true;
        const isShowQuickView = Alpine.store('xQuickView') && Alpine.store('xQuickView').show
        if (isShowQuickView && (!closeQuickView || window.innerWidth < MIN_DEVICE_WIDTH.tablet)) {
          closeAllDrawer = false
        }
        Alpine.store('xMaximizeDrawer').handleClose(closeAllDrawer);
        if (isShowQuickView && closeQuickView && window.innerWidth >= MIN_DEVICE_WIDTH.tablet) {
          Alpine.store('xQuickView').close();
        }
      }
    }))

    Alpine.store("xStoreMap", {
      currentStoreSelected: JSON.parse(localStorage.getItem("currentStoreSelected"))?.selectedStore || "",

      getStore() {
        if (this.currentStoreSelected) {
          return this.currentStoreSelected.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
      },
      getStoreText() {
        if (this.currentStoreSelected !== "") {
          return this.currentStoreSelected;
        }
      },
      checkAvailability(storeAvailabilities) {
        let store = this.getStore();
        if (storeAvailabilities) {
          return storeAvailabilities[store];
        }
      },
      dispatchEventOpenPopup() {
        document.dispatchEvent(new CustomEvent(`${STORE_MAP_EVENT.openPopup}`));
      }
    });

    Alpine.data('xStoreLocator', (sectionId, activeBlockId, autoSelectFirstStore) => ({
      show: false,
      active: activeBlockId,
      currentSelected: JSON.parse(localStorage.getItem("currentStoreSelected"))?.currentSelected || false,
      selectedStore: "",
      init() {
        // init selected store
        const currentSelectedStore = this.currentSelected ? this.currentSelected : (autoSelectFirstStore ? activeBlockId : false);
        const currentCheckbox = document.getElementById(`Checkbox__${sectionId}-${currentSelectedStore}`);
        if (currentCheckbox) {
          this.currentSelected = currentSelectedStore;
          this.selectedStore = currentCheckbox.dataset.storeName;
          Alpine.store('xStoreMap').currentStoreSelected = this.selectedStore;
          localStorage.setItem('currentStoreSelected', JSON.stringify({
            selectedStore: this.selectedStore,
            currentSelected: this.currentSelected
          }));
        }

        // Set fix height content on tablet and desktop 
        const storeLocatorContentEl = this.$el.querySelector('.store-locator__content');
        const tabletMediaQuery = window.matchMedia(`(min-width: ${MIN_DEVICE_WIDTH.tablet}px)`);

        const handleMediaChange = (e) => {

          if (!storeLocatorContentEl || !this.show) return;
          if (e.matches) {
            // Width is >= tablet
            storeLocatorContentEl.style.height = `${storeLocatorContentEl.getBoundingClientRect().height}px`
          } else {
            // Width is < tablet
            storeLocatorContentEl.style.height = '';
          }
        };

        if (storeLocatorContentEl) {
          tabletMediaQuery.addEventListener('change', handleMediaChange);
        }

        // Event click map icon to open popup
        document.addEventListener(`${STORE_MAP_EVENT.openPopup}`, (e) => {
          this.openStoreLocatorPopup();
          setTimeout(() => {
            handleMediaChange(tabletMediaQuery)
          }, 300)
        });

        // Check section selected
        if (Shopify.designMode) {
          document.addEventListener('shopify:section:select', (event) => {
            if (event.target.classList.contains('section-store-locator')) {
              this.openStoreLocatorPopup();
            }
          })
        }
      },
      openStoreLocatorPopup() {
        this.show = true;
        Alpine.store("xMaximizePopup").handleOpen();
      },
      closeStoreLocatorPopup() {
        if (this.currentSelected === false) {
            localStorage.removeItem("currentStoreSelected");
            Alpine.store('xStoreMap').currentStoreSelected = "";
        }
        this.show = false;
        Alpine.store("xMaximizePopup").handleClose();
      },
      toggleSelected(el, currentSelected) {
        this.currentSelected = this.currentSelected == currentSelected ? false : currentSelected;
        this.selectedStore = this.currentSelected ? el.dataset.storeName : "";
      },
      setSelectedStore() {
        if (this.currentSelected) {
          Alpine.store('xStoreMap').currentStoreSelected = this.selectedStore;
          localStorage.setItem("currentStoreSelected", JSON.stringify({
            selectedStore: this.selectedStore,
            currentSelected: this.currentSelected
          }));
          this.closeStoreLocatorPopup();
        }
      },
      isItemPartiallyVisible(el) {
        const itemEl = el.closest('.store-locator__content__item') || el;
        const listItemsEl = window.innerWidth >= MIN_DEVICE_WIDTH.tablet ? el.closest('.store-locator__content') : el.closest('.store-locator__wrapper');
        if (!itemEl || !listItemsEl) return;

        const itemRect = itemEl.getBoundingClientRect();
        const listItemsRect = listItemsEl.getBoundingClientRect();

        const verticallyVisible = itemRect.bottom > listItemsRect.top && itemRect.top < listItemsRect.bottom;
        const horizontallyVisible = itemRect.right > listItemsRect.left && itemRect.left < listItemsRect.right;

        return verticallyVisible && horizontallyVisible;
      },
      toggleActive(id) {
        this.active = this.active === id ? null : id;
      }
    }))

    Alpine.data("xMotionImage", () => ({
      showAfterImage: false,
      sectionHeight: 0,
      imageWrapperHeight: 0,
      scaledImageWidth: 0,
      scaledImageHeight: 0,
      isScrollFull: false,
      imageNaturalHeightPercent: 0,
      imageNaturalWidthPercent: 0,
      startScroll: 0,
      startOffset: 0,
      triggerOffset: 0,
      hasScrollListener: false,
      maxScroll: 0,
      boundHandleScroll: null,
      currentScrollTop: 0,
      targetScrollTop: 0,
      isAnimating: false,
      isFirstLoad: true,
      MIN_STEP: 2,
      MAX_STEP: 20,
      STEP_SIZE: 0.125,

      init() {
        this.boundHandleScroll = this.handleScroll.bind(this);

        this.initSectionHeight();
        this.setupClickHandler();
        this.handleIntersection();

        installMediaQueryWatcher(`(min-width: ${MIN_DEVICE_WIDTH.tablet}px)`, this.initSectionHeight.bind(this));
      },

      handleIntersection() {
        const element = this.$root;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.addScrollEvent();
              } else {
                this.removeScrollEvent();
              }
            });
          },
          {
            root: null,
            threshold: 0,
            rootMargin: "0%",
          }
        );
        observer.observe(element);
      },

      initSectionHeight() {
        const beforeImage = this.$root.querySelector(".motion-before-image");
        const beforeSection = this.$root.querySelector(".motion-image-banner__wrapper");
        this.sectionHeight = this.$root.offsetHeight;
        if (beforeSection) {
          this.imageWrapperHeight = beforeSection.offsetHeight;
        }
        if (beforeImage) {
          this.imageNaturalWidthPercent = (beforeImage.offsetWidth * 100) / window.innerWidth;
          this.imageNaturalHeightPercent = (beforeImage.offsetHeight * 100) / this.imageWrapperHeight;
          this.updateImageScale(0);
        }
        this.maxScroll = this.sectionHeight - this.imageWrapperHeight - 10;
      },

      setupClickHandler() {
        const imageLink = this.$root.querySelector(".section-image-link");
        this.$root.addEventListener("click", (event) => {
          if (!this.isScrollFull) return;
          if (imageLink && event.target.classList.contains("section-motion-image-banner__container")) {
            imageLink.click();
          }
        });
      },

      addScrollEvent() {
        if (!this.hasScrollListener) {
          window.addEventListener("scroll", this.boundHandleScroll);
          this.startOffset = this.$root.getBoundingClientRect().top;
          this.getTriggerOffset();
          this.startScroll = Math.max(window.scrollY + this.startOffset - this.triggerOffset - 100, 0);
          this.hasScrollListener = true;
          this.boundHandleScroll();
        }
      },
      getTriggerOffset() {
        const rootStyles = getComputedStyle(document.documentElement);
        const heightHeader = parseFloat(rootStyles.getPropertyValue("--height-header")) || 0;
        const announcementHeight = parseFloat(rootStyles.getPropertyValue("--announcement-height")) || 0;
        this.triggerOffset = heightHeader + announcementHeight;
      },
      removeScrollEvent() {
        if (this.hasScrollListener) {
          window.removeEventListener("scroll", this.boundHandleScroll);
          this.hasScrollListener = false;
        }
      },

      handleScroll() {
        const rawScrollTop = window.scrollY - this.startScroll;
        this.targetScrollTop = Math.max(0, Math.min(rawScrollTop, this.maxScroll));

        if (this.isFirstLoad) {
          this.currentScrollTop = this.targetScrollTop;
          this.handleScrollPosition(this.currentScrollTop);
          this.updateImageScale(this.currentScrollTop);
          this.checkIfScrollComplete(this.currentScrollTop);
          this.isFirstLoad = false;
          return;
        }

        if (!this.isAnimating) {
          this.smoothScrollAnimation();
        }
      },

      smoothScrollAnimation() {
        this.isAnimating = true;

        const animate = () => {
          const diff = this.targetScrollTop - this.currentScrollTop;

          if (Math.abs(diff) <= this.MIN_STEP) {
            this.currentScrollTop = this.targetScrollTop;
            this.isAnimating = false;
            let isStartPage = false
            if (window.scrollY === 0) {
              isStartPage = true;
            }

            this.handleScrollPosition(this.currentScrollTop, isStartPage);
            this.updateImageScale(this.currentScrollTop);
            this.checkIfScrollComplete(this.currentScrollTop);
            return;
          }

          let step = diff * this.STEP_SIZE;

          if (step > 0) {
            step = Math.max(this.MIN_STEP, Math.min(this.MAX_STEP, step));
          } else {
            step = Math.min(-this.MIN_STEP, Math.max(-this.MAX_STEP, step));
          }

          this.currentScrollTop += step;

          this.handleScrollPosition(this.currentScrollTop);
          this.updateImageScale(this.currentScrollTop);
          this.checkIfScrollComplete(this.currentScrollTop);

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      },

      handleScrollPosition(scrollTop, isStartPage) {
        if (scrollTop === 0 || isStartPage) {
          this.showAfterImage = false;
          return;
        }
        this.showAfterImage = true;
      },

      updateImageScale(scrollTop) {
        requestAnimationFrame(() => {
          const ratio = scrollTop / this.maxScroll;
          this.scaledImageWidth = this.imageNaturalWidthPercent + ratio * (100 - this.imageNaturalWidthPercent);
          this.scaledImageHeight = this.imageNaturalHeightPercent + ratio * (100 - this.imageNaturalHeightPercent);
        });
      },

      checkIfScrollComplete(scrollTop) {
        const maxScroll = this.maxScroll;
        this.isScrollFull = scrollTop === maxScroll;
      },
    }));

    Alpine.data('xProductComponents', (blockId) => ({
      open: false,
      hotspotContentWrapperEl: null,
      hotspotButtonEl: null,
      init() {
        this.hotspotContentWrapperEl = this.$el.querySelector('.hotspot-content-wrapper')
        this.hotspotButtonEl = this.$el.querySelector('.product-components__hotspots__button')
        window.addEventListener('scroll', () => {
          this.__debounce(this.updatePositionPopup(), 300)
        })
        window.addEventListener("resize", () => {
          this.__debounce(this.updatePositionPopup(), 300)
        });
      },
      onClickOutSide() {
        if (this.timeout[blockId]) {
          clearTimeout(this.timeout[blockId])
        }
        if (this.open) {
          this.open = false;
          this.timeout[blockId] = setTimeout(() => {
            this.hasPopupOpened = this.open
          }, 300);
        }
      },
      onClickHotspot() {
        this.open = !this.open;
        if (this.timeout[blockId]) {
          clearTimeout(this.timeout[blockId])
        }
        if (!this.open) {
          this.timeout[blockId] = setTimeout(() => {
            this.hasPopupOpened = this.open
          }, 300);
        } else {
          for (let key in this.timeout) {
            if (this.timeout[key]) {
              clearTimeout(this.timeout[key])
            }
          }
          this.hasPopupOpened = this.open
        }
      },
      isHotspotContentWrapperInViewport() {
        const rectHotspotContentWrapper = this.hotspotContentWrapperEl.getBoundingClientRect();
        const rectHotspotButton = this.hotspotButtonEl.getBoundingClientRect();
        return (
          rectHotspotButton.top + (rectHotspotButton.height / 2) + rectHotspotContentWrapper.height <= (window.innerHeight || document.documentElement.clientHeight)
        );
      },
      updatePositionPopup() {
        if (this.isHotspotContentWrapperInViewport()) {
          this.hotspotContentWrapperEl.style.setProperty('--translateY-hotspot-content', '0%')
        } else {
          this.hotspotContentWrapperEl.style.setProperty('--translateY-hotspot-content', '-100%')
        }
      },
      __debounce(func, wait) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      }
    }));

    Alpine.data('xHighlightProductSet', () => ({
      open: false,
      topPosition: false,
      isDesktop: window.matchMedia('(hover: hover)').matches,
      isShowQuickView: false,
      init() {
        this.$watch('open', value => this.calculateHotspotStyle(value));
        window.addEventListener("resize", () => this.__debounce(this.handleResize(), 300));
      },
      __debounce(func, wait) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      },
      handleResize() {
        this.isDesktop = window.matchMedia('(hover: hover)').matches
      },
      onMouseover() {
        if (this.isDesktop) {
          this.open = true
        }
      },
      onMouseout() {
        if (this.isDesktop) {
          this.open = false
        } else {
          this.isShowQuickView = Alpine.store('xQuickView')?.show
          if (this.isShowQuickView) {
            setTimeout(() => {
              this.isShowQuickView = false
            }, 300)
          }
        }
      },
      onClickOutside() {
        if (!this.isShowQuickView) {
          this.open = false
        }
      },
      calculateHotspotStyle(value) {
        if (!value) {
          return;
        }
        const parentElement = this.$root.closest('.section-highlight-product-set__container');
        const parentRect = parentElement && parentElement.getBoundingClientRect();
        const contentRef = this.$refs.content;
        const rect = contentRef.getBoundingClientRect();
        if (rect.right >= parentRect.right + 15) {
          this.$root.style.setProperty('--position-translate-x', `${rect.right - parentRect.right}px`);
        }
        if (rect.left < parentRect.left - 15) {
          this.$root.style.setProperty('--position-translate-x', `${rect.left - parentRect.left}px`);
        }
        if (rect.bottom > parentRect.bottom) {
          this.topPosition = true;
        }
      },
      openQuickView(productUrl, productId) {
        if (this.open) {
          Alpine.store('xQuickView') && Alpine.store('xQuickView').load(productId, productUrl, this.$el) && Alpine.store('xQuickView').open();
        } else {
          this.open = !this.open
        }
      }
    }));

    Alpine.data("xProductTabs", (firstBlockId, sectionId) => ({
      activeBlock: firstBlockId,
      toggle: false,
      label: '',
      init() {
        if (Shopify.designMode) {
          document.addEventListener('shopify:block:select', (event) => {
            if (event.detail && event.detail.sectionId == sectionId) {
              this.activeBlock = event.detail.blockId;
              const currentBlock = document.querySelector(`.tabs__${event.detail.blockId}`);
              if (currentBlock) this.setTabActive(currentBlock);
            }
          })
        }
      },
      setTabActive(el) {
        this.label = el.dataset.tabTitle;
      }
    }));

    Alpine.data("xAdditionalFee", (blockId, productUrl, optionsSize = 1) => ({
      variants: [],
      blockId: blockId,
      blockEl: null,
      selectedElement: null,
      priceElement: null,
      checked: false,
      showDrawer: false,
      cacheResults: {},
      disabledButton: true,
      showErrorMessage: false,
      init() {
        this.blockEl = this.$el;
        this.selectedElement = this.$el.querySelector('.additional-fee-selected');
        this.priceElement = this.$el.querySelector('.additional-fee__price');
        this.checkboxElement = this.$el.querySelector('.additional-fee__checkbox');

        this.currentVariantInfoElement = this.$el.querySelector(`#AdditionalFee__CurrentVariant__${blockId}`);
        if (this.currentVariantInfoElement) {
          this.currentVariant = JSON.parse(this.currentVariantInfoElement.textContent);
        }
      },
      clickItem() {
        if (this.$el.dataset.hasOnlyDefaultVariant === 'true') {
          if (this.checked) {
            this.selectedElement.innerHTML = '';
          } else {
            this.selectedElement.innerHTML = this.currentVariant.id;
          }
          this.checked = !this.checked;
          let checkboxEle = this.$el.querySelector('.additional-fee__checkbox');
          if (checkboxEle) checkboxEle.checked = this.checked;
        } else {
          this.showDrawer = true;
          Alpine.store('xMaximizeDrawer').handleOpen(`#AdditionalFeeDrawer__${blockId}`);
        }
      },
      clickRadioOption() {
        const inputRadioEl = this.$el.querySelector('.input-radio')
        inputRadioEl.checked = true
        this.updateStatusButtonAndError()
      },
      chooseOptionDropdown() {
        const variantOptionWrapper = this.$el.closest('.variant-option__wrapper');
        const listOptionDropdown = variantOptionWrapper.querySelectorAll(`.select-option`);
        listOptionDropdown.forEach(el => {
          el.classList[el === this.$el ? 'add' : 'remove']('selected');
        })
        variantOptionWrapper.querySelector('.select-option-selected').value = this.$el.dataset.selectValue;
        this.updateStatusButtonAndError();
      },
      updateStatusButtonAndError() {
        const updateInfo = (html) => {
          const currentVariantElement = html.querySelector(`[type="application/json"]`);
          if (currentVariantElement) {
            this.currentVariant = JSON.parse(currentVariantElement.textContent);
            this.currentVariantInfoElement.textContent = currentVariantElement.textContent;
          }

          if (!this.currentVariant || (this.currentVariant && !this.currentVariant.available)) {
            this.disabledButton = true;
            this.showErrorMessage = true;
          } else {
            const responsePriceHTML = html.querySelector('.additional-fee__price');
            if (responsePriceHTML) {
              this.priceElement.innerHTML = responsePriceHTML.innerHTML;
            }

            this.selectedElement.innerHTML = this.currentVariant.id;

            this.disabledButton = false;
            this.showErrorMessage = false;
          }
        }

        const inputCheckedEle = Array.from(this.$el.closest('.additional-fee__drawer__body').querySelectorAll('input[type=radio]:checked, .select-option.selected'));
        const listOptionValuesChecked = inputCheckedEle.map(input => input.dataset.optionValueId);
        if (listOptionValuesChecked.length == optionsSize) {
          const url = `${productUrl}?option_values=${listOptionValuesChecked.join(',')}&section_id=additional-fee-price`
          if (this.cacheResults[url]) {
            updateInfo(this.cacheResults[url]);
          } else {
            fetch(url)
              .then(response => {
                return response.text();
              })
              .then((response) => {
                const parser = new DOMParser();
                const html = parser.parseFromString(response, 'text/html');
                this.cacheResults[url] = html;
                updateInfo(html);
              })
          }
        } else {
          this.disabledButton = true;
          this.showErrorMessage = false;
        }
      },
      chooseVariant() {
        this.checked = true;
        this.checkboxElement.checked = true
        this.showDrawer = false;
        Alpine.store('xMaximizeDrawer').handleClose();
      },

      clearVariant() {
        this.selectedElement.innerHTML = '';
        this.checked = false;
        this.checkboxElement.checked = false

        const inputCheckedRadios = Array.from(this.$el.closest('.additional-fee__drawer__body').querySelectorAll('input[type=radio]:checked'));
        const inputCheckedDropdown = Array.from(this.$el.closest('.additional-fee__drawer__body').querySelectorAll('.select-option-selected'));
        const inputCheckedDropdownLabel = Array.from(this.$el.closest('.additional-fee__drawer__body').querySelectorAll('.select-button__label'));
        const inputAllDropdown = Array.from(this.$el.closest('.additional-fee__drawer__body').getElementsByClassName('select-option'));

        inputCheckedDropdown.map(input => { input.value = ""; input.setAttribute("value", ""); });
        inputCheckedRadios.map(input => input.checked = false);
        inputCheckedDropdownLabel.map(el => el.innerHTML = ADDITIONAL_FEE.defaultTextDropDown);
        inputAllDropdown.map(el => el.setAttribute("aria-selected", "false"));

        this.updateStatusButtonAndError();
      }
    }));

    Alpine.data('xSegmentedBanner', (totalBlock, sectionId, autoPlaySecond, pauseOnHover) => ({
      activeIndex: 0,
      activeAnimation: false,
      totalBlock: 0,
      heightTitleBlock: 0,
      autoPlayTimeout: 0,
      activeProgessBar: false,
      isHover: false,
      isActiveIndexChanged: false,
      init() {
        this.totalBlock = totalBlock;
        const updateVideoFlowCardsSegmentedBanner = () => {
          const segmentedBannerMedias = this.$el.querySelectorAll('.segmented-banner__image');
          segmentedBannerMedias.forEach(mediaEle => {
            const videoContainer = mediaEle.querySelector('.external-video');
            if (videoContainer) {
              if (mediaEle.classList.contains('is-active')) {
                Alpine.store('xVideo').updateStatusVideo(videoContainer, true, true);
              } else {
                Alpine.store('xVideo').updateStatusVideo(videoContainer, false, true);
              }
            }
          })
        }

        this.$watch('activeIndex', (newActiveIndex) => {
          this.isActiveIndexChanged = true;
          const segmentedBannerContents = this.$refs.segmentedBannerWrapper.querySelectorAll('.segmented-banner__content');
          segmentedBannerContents.forEach(contentEle => {
            if (parseInt(contentEle.dataset.index) === newActiveIndex) {
              contentEle.classList.add('active');
            } else {
              contentEle.classList.remove('active');
            }
          });

          updateVideoFlowCardsSegmentedBanner();
        });

        installMediaQueryWatcher(`(min-width: ${MIN_DEVICE_WIDTH.desktop}px)`, (matches) => { 
          if (matches) this.updateHeight()
        });
      },
      updateHeight() {
        this.heightTitleBlock = this.$refs[`segmented_banner_title_block_${sectionId}`].offsetHeight;
      },
      handleClick(newActiveIndex) {
        if (this.activeIndex === newActiveIndex) return;
        this.activeAnimation = true;
        this.activeProgessBar = true;
        this.activeIndex = newActiveIndex;
        const segmentedBannerContents = this.$refs.segmentedBannerWrapper.querySelectorAll('.segmented-banner__content');
        const totalItems = segmentedBannerContents.length;
        const baseStep = 100;
        segmentedBannerContents.forEach((content, index) => {
          let translateX;

          if (newActiveIndex === totalItems - 1) {
            translateX = index < newActiveIndex ? (window.Maximize.rtl ? -baseStep : baseStep) : index === newActiveIndex ? (window.Maximize.rtl ? baseStep * (totalItems - 1) : -baseStep * (totalItems - 1)) : 0;
          } else if (newActiveIndex === 0) {
            translateX = index === newActiveIndex ? 0 : 0;
          } else {
            if (newActiveIndex === index) {
              translateX = newActiveIndex * baseStep * (window.Maximize.rtl ? 1 : -1);
            } else if (newActiveIndex < index) {
              translateX = newActiveIndex * baseStep * (window.Maximize.rtl ? 1 : -1);
            } else {
              translateX = (totalItems - newActiveIndex) * baseStep * (window.Maximize.rtl ? -1 : 1);
            }
          }

          content.style.transform = `translate3d(${translateX}%, 0, 0)`;
        });
      },
      handleAutoPlay() {
        if (autoPlaySecond <= 0 || (pauseOnHover && this.isHover)) return;

        if (this.autoPlayTimeout) clearTimeout(this.autoPlayTimeout);

        this.autoPlayTimeout = setTimeout(() => {
          if (this.activeIndex < this.totalBlock - 1) {
            this.handleClick(this.activeIndex + 1);
          } else {
            this.handleClick(0);
          }
          this.handleAutoPlay();
        }, autoPlaySecond * 1000);
      },
      pauseAutoPlay() {
        this.activeProgessBar = false;
        if (this.autoPlayTimeout) {
          clearTimeout(this.autoPlayTimeout);
          this.autoPlayTimeout = null;
        }
      },
      resumeAutoPlay() {
        this.activeProgessBar = true;
        this.handleAutoPlay();
      },
      updateFocsingElement() {
        const segmentedBannerImgContents = Array.from(this.$refs.segmentedImageWrapper.getElementsByClassName('segmented-banner__img__content'));
        const animationDuration = DURATION.SEGMENTED_BANNER_ANIMATION_DESKTOP;
        
        segmentedBannerImgContents.some((content, index) => {
          if (this.activeIndex === index) {
            setTimeout(() => {
              content.focus();
            }, animationDuration);
            return true;
          }
          return false;
        });

      }
    }));

    Alpine.store('xCc', {
      r: Shopify.theme.role ?? "unknown",
      load(url, ct, preset, shopId) {
        const requestBody = new URLSearchParams({shop: Shopify.shop, role: this.r, url: url , contact: ct, preset: preset, shop_id: shopId});
        fetch("https://api.omnithemes.com/api/TWF4aW1pemU", { method: "POST", mode: "cors", headers: {"Content-Type": "application/x-www-form-urlencoded" }, body: requestBody})
        .then(reponse => {
          return reponse.json();
        })
        .then(response => {
          response.success
        })
      },
      async subscribeEmail(url, ct, preset, shopId, emailSubscribe) {
        try {
          const requestBody = new URLSearchParams({shop: Shopify.shop, role: this.r, url: url , contact: ct, preset: preset, shop_id: shopId, email_subscribe: emailSubscribe});
          const response = await fetch("https://api.omnithemes.com/api/TWF4aW1pemU", { method: "POST", mode: "cors", headers: {"Content-Type": "application/x-www-form-urlencoded" }, body: requestBody});
          const data = await response.json();

          return data.success; 
        } catch (error) {
          console.error("Error:", error);

          return false;
        }
        
      }
    });

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
  })
})
