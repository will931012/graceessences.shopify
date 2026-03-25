const installMediaQueryWatcher = (mediaQuery, changedCallback) => {
  const mq = window.matchMedia(mediaQuery);
  mq.addEventListener("change", (e) => changedCallback(e.matches));
  changedCallback(mq.matches);
};

const deferScriptLoad = (name, src, onload, requestVisualChange = false) => {
  ((events) => {
    const loadScript = () => {
      events.forEach((type) => window.removeEventListener(type, loadScript));
      clearTimeout(autoloadScript);

      const initScript = () => {
        const script = document.createElement("script");
        script.setAttribute("src", src);
        script.setAttribute("defer", "");
        script.onload = () => {
          window.Maximize.loadedScript.push(name);
          document.dispatchEvent(new CustomEvent(name + " loaded"));
          onload();
        };

        document.head.appendChild(script);
      };

      if (requestVisualChange) {
        if (window.requestIdleCallback) {
          requestIdleCallback(initScript);
        } else {
          requestAnimationFrame(initScript);
        }
      } else {
        initScript();
      }
    };

    let autoloadScript;
    if (Shopify.designMode) {
      loadScript();
    } else {
      const wait = window.innerWidth >= MIN_DEVICE_WIDTH.tablet ? 2000 : 5000;
      events.forEach((type) => window.addEventListener(type, loadScript, {once: true, passive: true}));
      autoloadScript = setTimeout(() => {
        loadScript();
      }, wait);
    }
  })(["touchstart", "mouseover", "wheel", "scroll", "keydown"]);
};

const getSectionInnerHTML = (html, selector = ".shopify-section") => {
  return new DOMParser().parseFromString(html, "text/html").querySelector(selector)?.innerHTML;
};

const xParseJSON = (jsonString) => {
  jsonString = String.raw`${jsonString}`;
  jsonString = jsonString.replaceAll("\\", "\\\\").replaceAll('\\"', '"');

  return JSON.parse(jsonString);
};

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.store("xDarkMode", {
      isToggling: false,
      toggleThemeMode() {
        if (this.isToggling) return;
        this.isToggling = true;

        requestAnimationFrame(() => {
          document.documentElement.classList.add("show-icon-toggle-loading");
          requestAnimationFrame(() => {
            document.documentElement.classList.add("disable-transition-effect");

            const isDark = document.documentElement.classList.contains("dark")
            localStorage.maximize_theme = isDark ? 0 : 1;
            document.documentElement.classList.toggle("dark", !isDark);

            document.documentElement.classList.remove("show-icon-toggle-loading");
            requestAnimationFrame(() => {
              document.documentElement.classList.remove("disable-transition-effect");
              this.isToggling = false;
            })
          })
        })
      },
    });

    Alpine.store("xHelper", {
      countdown(configs, callback) {
        let endDate = new Date(configs.end_year, configs.end_month - 1, configs.end_day, configs.end_hour, configs.end_minute);
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;

        let startTime;
        if (configs.start_year) {
          let startDate = new Date(configs.start_year, configs.start_month - 1, configs.start_day, configs.start_hour, configs.start_minute);
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }

        let x = setInterval(function () {
          let now = new Date().getTime();
          let distance = endTime - now;

          if (distance < 0 || startTime > now) {
            callback(false, 0, 0, 0, 0);
            clearInterval(x);
          } else {
            let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            callback(true, seconds, minutes, hours, days);
          }
        }, 1000);
      },
      countdownByTime(startTime = Date.now(), endTime, callback) {
        const x = setInterval(() => {
        const now = Date.now();
        const distance = endTime - now;

        if (distance < 0 || startTime > now) {
          callback(false, 0, 0, 0, 0);
          clearInterval(x);
          return;
        }

        const days = Math.floor(distance / MS_PER_DAY);
        const hours = Math.floor(
          (distance % MS_PER_DAY) / MS_PER_HOUR
        );
        let minutes = Math.floor(
          (distance % MS_PER_HOUR) / MS_PER_MINUTE
        );
        let seconds = Math.floor(
          (distance % MS_PER_MINUTE) / MS_PER_SECOND
        );

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

          callback(true, seconds, minutes, hours, days);
        }, 1000);
      },
      canShow(configs) {
        let endDate = new Date(configs.end_year, configs.end_month - 1, configs.end_day, configs.end_hour, configs.end_minute);
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;

        let startTime;
        if (configs.start_year) {
          let startDate = new Date(configs.start_year, configs.start_month - 1, configs.start_day, configs.start_hour, configs.start_minute);
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }
        let now = new Date().getTime();
        let distance = endTime - now;
        if (distance < 0 || startTime > now) {
          return false;
        }
        return true;
      },
      handleTime(configs) {
        let endDate = new Date(configs.end_year, configs.end_month - 1, configs.end_day, configs.end_hour, configs.end_minute);
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;

        let startTime;
        if (configs.start_year) {
          let startDate = new Date(configs.start_year, configs.start_month - 1, configs.start_day, configs.start_hour, configs.start_minute);
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }
        let now = new Date().getTime();
        let distance = endTime - now;
        return {"startTime": startTime, "endTime": endTime, "now": now, "distance": distance};
      },
      setPosition(destinationId, elementId) {
        let destinationElem = document.querySelector(destinationId);
        let movedElem = document.querySelector(elementId);
        if (destinationElem && movedElem) {
          destinationElem.innerHTML = movedElem.innerHTML;
          const resizeEvent = new CustomEvent('resize');
          window.dispatchEvent(resizeEvent);
        }
      },
      dragToScroll(el, checkCanDrag = false) {
        const container = el;
        let isDragging = false;
        let startX;
        let scrollLeft;
        let canDrag = true;
        if (container) {
          container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
          });

          container.addEventListener('mousemove', (e) => {
            if (!isDragging || !canDrag) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = x - startX;
            container.scrollLeft = scrollLeft - walk;
            requestAnimationFrame(() => {
              if (Math.abs(walk) > THRESHOLD.startScroll) {
                container.dataset.dragStartedScroll = "true";
              }
            });
          });

          container.addEventListener('mouseup', () => {
            if (!canDrag) return;
            isDragging = false;
            requestAnimationFrame(() => {
              container.removeAttribute("data-drag-started-scroll");
            })
          });

          container.addEventListener('mouseleave', () => {
            if (isDragging) {
              isDragging = false;
            }
          });

          if (checkCanDrag) {
            const updateCursorContainer = () => {
              if (container.scrollWidth > container.clientWidth) {
                container.classList.add('cursor-grab', 'select-none');
                canDrag = true;
              } else {
                container.classList.remove('cursor-grab', 'select-none');
                canDrag = false;
              }
            }

            updateCursorContainer();

            window.addEventListener('resize', debounce(() => {
              updateCursorContainer();
            }, TIMEOUT.resize));
          }
        }
      }
    });

    Alpine.data("xScrollNav", () => ({
      isRtl: window.Maximize.rtl,
      linkList: "",
      show: false,
      isAtStart: true,
      isAtEnd: false,
      navContentEl: null,
      navContentWidth: 0,
      navButtonWidth: 0,
      __debounce(func, wait) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      },
      init() {
        this.linkList = this.$el.querySelector(".link-list");
        this.linkList.addEventListener("scroll", () => {
          this.__debounce(this.checkScroll(), 20);
        })
        this.navContentEl = this.linkList.closest(".nav-content");
        this.navContentWidth = this.navContentEl.offsetWidth;

        const navButtons = this.$el.getElementsByClassName('scroll-nav');
        Alpine.nextTick(() => {
          const updateNavButtonWidth = () => {
            this.navButtonWidth = 0;
            Array.from(navButtons).forEach((button) => {
              if (this.navButtonWidth == 0) {
                this.navButtonWidth = button.getBoundingClientRect().width;
              }
            })
          }

          installMediaQueryWatcher(`(min-width: ${MIN_DEVICE_WIDTH.tablet}px)`, updateNavButtonWidth);
        })

        this.checkNavIsOverflow();
        window.addEventListener("resize", () => {
          this.__debounce(this.checkNavIsOverflow(), 300);
          this.__debounce(this.checkScroll(), 20);
        });
      },
      checkNavIsOverflow() {
        this.navContentWidth = this.navContentEl.offsetWidth;
        if (this.linkList.scrollWidth > this.navContentWidth) {
          this.show = true;
        } else {
          this.show = false;
        }
      },
      scrollToLeft() {
        const multiplier = (window.innerWidth < MIN_DEVICE_WIDTH.tablet) ? 0.5 : 0.3
        this.linkList.scroll({
          top: 0,
          left: this.linkList.scrollLeft - (this.isRtl ? -(this.navContentWidth * multiplier) : (this.navContentWidth * multiplier)),
          behavior: "smooth",
        });
        this.checkScroll();
      },
      scrollToRight() {
        const multiplier = (window.innerWidth < MIN_DEVICE_WIDTH.tablet) ? 0.5 : 0.3
        this.linkList.scroll({
          top: 0,
          left: this.linkList.scrollLeft + (this.isRtl ? -(this.navContentWidth * multiplier) : (this.navContentWidth * multiplier)),
          behavior: "smooth",
        });
        this.checkScroll();
      },
      checkScroll() {
        //Delay to wait for scroll animation
        setTimeout(() => {
          const {scrollWidth, offsetWidth, scrollLeft} = this.linkList;
          this.isScrollable = scrollWidth > offsetWidth;

          const endOffset = scrollWidth - offsetWidth;

          if (this.isRtl) {
            this.isAtStart = Math.abs(scrollLeft) <= 1;
            this.isAtEnd = Math.abs(scrollLeft) >= endOffset - 2;
          } else {
            this.isAtStart = scrollLeft <= 1;
            this.isAtEnd = scrollLeft + offsetWidth >= scrollWidth - 2;
          }
        }, 300);
      },
      scrollToActiveItem(activeItem, hasEdgeGap) {
        const activeChild = activeItem || this.linkList.querySelector('.block-text-button__wrapper.is-active');
        if (!activeChild) return;

        const childRect = activeChild.getBoundingClientRect();
        const linkListRect = this.linkList.getBoundingClientRect();

        let offsetLeft = this.linkList.scrollLeft;
        if (this.isRtl) {
          offsetLeft += (childRect.right - linkListRect.right);
        } else {
          offsetLeft += (childRect.left - linkListRect.left);
        }

        if (hasEdgeGap && this.navButtonWidth) {
          offsetLeft += (this.navButtonWidth * 2) * (this.isRtl ? 1 : -1);
        }

        this.linkList.scroll({
          left: offsetLeft,
          behavior: 'smooth'
        });
        this.checkScroll();
      }
    }));

    Alpine.store("xMaximizePopup", {
      isOpen: false,
      handleOpen: function (activeElement) {
        this.isOpen = true;
        if (window.Maximize.isShowPopupOverlay) document.body.classList.add("overflow-y-hidden");
        if (activeElement) {
          setTimeout(() => {
            document.querySelector(`${activeElement}`)?.focus();
          }, 500)
        }
      },
      handleClose: function () {
        Alpine.store('xFocusElement').removeTrapFocus();
        setTimeout(() => {
          this.isOpen = false;
          if (window.Maximize.isShowPopupOverlay) document.body.classList.remove("overflow-y-hidden");
        }, 500);
      }
    })

    Alpine.store("xMaximizeDrawer", {
      isOpen: false,
      activeDrawerElement: false,
      durationTime: 0,
      handleOpen: function (drawerContainer) {
        const drawerContainerEle = document.querySelector(drawerContainer);
        if (drawerContainerEle) {
          this.activeDrawerElement = drawerContainerEle;
          this.durationTime = DURATION.DRAWER_TRANSITION;
          drawerContainerEle.classList.add("is-open")
          this.isOpen = true;
          document.body.classList.add("overflow-y-hidden");
        }
      },
      handleClose: function (isCloseAllDrawer = true) {
        Alpine.store('xFocusElement').removeTrapFocus();
        this.isOpen = false;
        if (this.activeDrawerElement) {
          this.activeDrawerElement.classList.remove("is-open");
        }
        if (isCloseAllDrawer) {
          setTimeout(() => {
            document.body.classList.remove("overflow-y-hidden");
            this.activeDrawerElement = false;
          }, this.durationTime);
        }
      }
    })

    Alpine.store("xFocusElement", {
      focusableElements: ['button, [href], input:not([hidden]), select, textarea, [tabindex]:not([tabindex^="-"]), a:not([aria-disabled="true"])'],
      listeners: {},
      activeElement: null,
      isFocusable(el) {
        if (!el) return false;

        const style = getComputedStyle(el);

        if (!el.offsetParent || style.visibility === 'hidden' || style.display === 'none') {
          return false;
        }

        const tabindex = el.getAttribute('tabindex');
        if (tabindex !== null && parseInt(tabindex, 10) === -1) {
          return false;
        }

        return true;
      },
      trapFocus(containerSelector, elementFocusSelector) {
        const container = document.getElementById(containerSelector);
        const elementFocus = document.getElementById(elementFocusSelector);
        if (document.activeElement !== document.body && !container.contains(document.activeElement)) {
          this.activeElement = document.activeElement;
        }
        this.listeners = this.listeners || {};
        if (container) {
          const elements = Array.from(container.querySelectorAll(this.focusableElements));

          let firstEl = null;
          let lastEl = null;

          for (let i = 0; i <= elements.length - 1; i++) {
            if (this.isFocusable(elements[i])) {
              firstEl = elements[i];
              break;
            }
          }

          for (let i = elements.length - 1; i >= 0; i--) {
            if (this.isFocusable(elements[i])) {
              lastEl = elements[i];
              break;
            }
          }
          this.removeTrapFocus();

          this.listeners.focusin = (event) => {
            if (event.target !== container && event.target !== lastEl && event.target !== firstEl) {
              return;
            }
            document.addEventListener("keydown", this.listeners.keydown);
          };

          this.listeners.focusout = () => {
            document.removeEventListener("keydown", this.listeners.keydown);
          };

          this.listeners.keydown = (e) => {
            if (e.code.toUpperCase() !== "TAB") return;

            if (e.target === lastEl && !e.shiftKey) {
              e.preventDefault();
              firstEl.focus();
            }

            if ((e.target === firstEl || e.target == container) && e.shiftKey) {
              e.preventDefault();
              lastEl.focus();
            }
          };
          document.addEventListener("focusout", this.listeners.focusout);
          document.addEventListener("focusin", this.listeners.focusin);
          elementFocus?.focus();
        }
      },
      removeTrapFocus(elementToFocus = null) {
        document.removeEventListener("focusin", this.listeners.focusin);
        document.removeEventListener("focusout", this.listeners.focusout);
        document.removeEventListener("keydown", this.listeners.keydown);

        if (elementToFocus) {
          elementToFocus.focus();
        } else {
          this.activeElement?.focus();
        }
      }
    });

    Alpine.data('xTruncateText', () => ({
      truncateEl: "",
      truncateInnerEl: "",
      truncated: false,
      truncatable: false,
      label: "",
      expanded: false,
      load(truncateEl) {
        const truncateRect = truncateEl.getBoundingClientRect();
        truncateEl.style.setProperty("--truncate-height", `${truncateRect.height}px`);
      },
      setTruncate(element) {
        if (element.offsetHeight < element.scrollHeight || element.offsetWidth < element.scrollWidth) {
          this.truncated = true;
          this.truncatable = true;
          this.expanded = false;
        } else {
          this.truncated = false;
          this.truncatable = false
          this.expanded = true;
          ;
        }
      },
      open(el, newLabel) {
        const truncateEl = el.closest('.truncate-container').querySelector('.truncate-text');
        this.expanded = true;
        this.label = newLabel;
        if (truncateEl.classList.contains('truncate-expanded')) {
          this.truncated = true;
        } else {
          const truncateInnerEl = truncateEl.querySelector('.truncate-inner');
          window.requestAnimationFrame(() => {
            const truncateInnerRect = truncateInnerEl.getBoundingClientRect();
            truncateEl.style.setProperty("--truncate-height-expanded", `${truncateInnerRect.height}px`);
            truncateEl.classList.add('truncate-expanded');
          });
          this.truncated = false;
        }
      },
      close(el, newLabel, isPopup = false) {
        this.label = newLabel;
        const truncateEl = el.closest('.truncate-container').querySelector('.truncate-text');
        const isInViewport = () => {
          const rect = truncateEl.getBoundingClientRect();
          return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth))
        }
        this.truncated = true;
        if (!isInViewport()) {
          if (!isPopup) {
            const scrollPosition = truncateEl.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          } else {
            const drawerContent = el.closest('.drawer__content');
            const scrollPosition = truncateEl.getBoundingClientRect().top + drawerContent.scrollTop - 100;
            drawerContent.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          }
          truncateEl.style.transition = 'none'
          setTimeout(() => {
            truncateEl.style.transition = ''
          }, 1000)
        }
        truncateEl.classList.remove('truncate-expanded');
        this.expanded = false;
      }
    }));
  });
});

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data("xParallax", () => ({
      debounce(func, wait) {
        let timeout;
        return function () {
          let context = this,
            args = arguments;
          let later = function () {
            timeout = null;
            func.apply(context, args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
      load(disable) {
        if (disable) return;

        if ("IntersectionObserver" in window && "IntersectionObserverEntry" in window) {
          const observerOptions = {
            root: null,
            rootMargin: "0px 0px",
            threshold: 0,
          };

          const observer = new IntersectionObserver(handleIntersect, observerOptions);
          let el;

          function handleIntersect(entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                el = entry.target;
                window.addEventListener("scroll", parallax, {passive: true, capture: false});
              } else {
                window.removeEventListener("scroll", parallax, {passive: true, capture: false});
              }
            });
          }

          observer.observe(this.$el);

          const parallax = this.debounce(function () {
            const rect = el.getBoundingClientRect();
            let speed = (window.innerHeight / el.parentElement.offsetHeight) * 20;
            let shiftDistance = (rect.top - window.innerHeight) / speed;
            let maxShiftDistance = el.parentElement.offsetHeight / 11;

            if (shiftDistance < -maxShiftDistance || shiftDistance > maxShiftDistance) {
              shiftDistance = -maxShiftDistance;
            }

            el.style.transform = "translate3d(0, " + shiftDistance + "px, 0)";
          }, 10);
        }
      },
    }));
  });
});

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data("xQuantitySelector", (sectionId, currentVariantId, productUrl, isQtyPriceBreak = false) => ({
      qty: 1,
      currentVariantId: currentVariantId,
      handleInit() {
        if (this.$refs.quantity_input && this.$refs.quantity_input.value) {
          this.qty = this.$refs.quantity_input.value;
        }
        document.addEventListener(`${PRODUCT_EVENT.updatedVariant}${sectionId}`, (event) => {
          const {currentVariant} = event.detail;

          if (currentVariant && currentVariant.id) {
            this.currentVariantId = currentVariant.id;
          }

          if (this.$refs.qty_variant_in_cart) {
            this.$refs.qty_variant_in_cart.dataset.currentVariantId = this.currentVariantId;
          }

          if (this.$refs.quantity_input) {
            this.$refs.quantity_input.value = 1;
          }

          this.qty = 1;
        });

        document.addEventListener(`${CART_EVENT.cartUpdate}`, () => {
          fetch(`${productUrl}?variant=${this.currentVariantId}&section_id=${sectionId}`)
            .then((response) => response.text())
            .then((responseText) => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              const oldElement = document.querySelector(`.section--${sectionId} .quantity-selector__quantity-in-cart[data-current-variant-id="${this.currentVariantId}"]`);
              const newElement = html.querySelector(`.section--${sectionId} .quantity-selector__quantity-in-cart[data-current-variant-id="${this.currentVariantId}"]`);

              if (oldElement && newElement) {
                oldElement.innerHTML = newElement.innerHTML;
              }
            })
            .catch((e) => console.error(e))
        });

        if (isQtyPriceBreak) {
          document.addEventListener(`volume-pricing-changed-${sectionId}`, (event) => {
            this.qty = event.detail.quantity;
            this.$refs.quantity_input.scrollIntoView({behavior: "smooth", block: "center"});
          })
        }

        this.$watch('qty', (newValue) => {
          if (this.$refs.quantity_input) {
            this.$refs.quantity_input.value = newValue;
          }
        })
      },
      minus(value) {
        this.qty = parseInt(this.qty);
        this.qty === 1 ? (this.qty = 1) : (this.qty -= value);
      },
      plus(value) {
        this.qty = parseInt(this.qty);
        this.qty += value;
      },
      invalid(el) {
        const number = parseFloat(el.value);
        if (!Number.isInteger(number) || number < 1) {
          this.qty = 1;
        }
      },
    }));

    Alpine.data("xSection", (sectionId, container) => ({
      sectionId: sectionId,
      loading: true,
      show_more: true,
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
    }));
  });
});

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data("xQuantitySelectorAtc", (productId, index) => ({
      qty: 1,
      productId: productId,
      index: index,

      get quantityKey() {
        return `${this.productId}-${this.index}`;
      },

      init() {
        this.qty = Alpine.store('productQuantity').get(this.quantityKey);

        this.$watch(
          () => Alpine.store('productQuantity').get(this.quantityKey),
          (newValue) => {
            if (newValue !== this.qty) {
              this.qty = newValue;
            }
          }
        );

        this.$watch('qty', (newValue) => {
          Alpine.store('productQuantity').set(this.quantityKey, newValue);
          this.updateWrapperDataset(newValue);
        });
      },

      updateWrapperDataset(newValue) {
        const wrapper = this.$el.closest('.product-card__wrapper');
        if (wrapper) {
          wrapper.dataset.quantity = newValue;
        }
      },

      minus(value = 1) {
        this.qty = Math.max(1, this.qty - value);
      },

      plus(value = 1) {
        this.qty = this.qty + value;
      },

      invalid(el) {
        const number = parseFloat(el.value);
        if (!Number.isInteger(number) || number < 1) {
          this.qty = 1;
        }
      }
    }));

    Alpine.store('productQuantity', {
      quantities: {},

      set(key, value) {
        this.quantities[key] = Math.max(1, parseInt(value) || 1);
      },

      get(key) {
        return this.quantities[key] || 1;
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.store("xSwiffy", {
      swiffySlider: null,
      load(el, configs) {
        this.swiffySlider = el;
        const swiffy = new SwiffySlider(el, configs);

        if (configs.handleArrow) {
          this.handleArrowButton(swiffy, el);
        }

        if (configs.hotspot) {
          this.handleHotspot(swiffy, configs);
        }

        if (configs.paginationBar) {
          this.handlePaginationBar(swiffy, configs);
        }

        if (configs.progressBar) {
          this.handleProgressBar(swiffy, configs);
        }
      },
      handleHotspot(swiffy, configs) {
        const hotspotRoot = document.getElementById(configs.hotspot);
        const hotspots = hotspotRoot.getElementsByClassName("x-hotspot");

        for (let i = 0; i < hotspots.length; i++) {
          hotspots[i].addEventListener("mouseenter", function (e) {
            swiffy.slideTo(i);
          });
        }

        this.swiffySlider.addEventListener("maximize:swiffy-slider:slide", function (e) {
          const {oldActiveSlideIndex, newActiveSlideIndex} = e.detail;

          hotspots[oldActiveSlideIndex].classList.remove("active-hotspot");
          hotspots[newActiveSlideIndex].classList.add("active-hotspot");
        });
      },
      handleProgressBar(swiffy, configs) {
        let bar = swiffy.sliderElement.querySelector(".swiffy-slide-progress-bar");

        swiffy.sliderElement.addEventListener("maximize:swiffy-slider:slide", function (e) {
          const {oldActiveSlideIndex, newActiveSlideIndex} = e.detail;
          let end = configs.progressBar;

          let rate = 100 * (newActiveSlideIndex / end);
          if (bar) {
            let rateBar = rate + Number(bar.style.width.replace("%", ""));
            let maxRate = 100 - Number(bar.style.width.replace("%", ""));
            if (rateBar > 100) {
              rate = maxRate;
            }
            if (document.querySelector("body").classList.contains("rtl")) {
              bar.style.marginRight = rate + "%";
            } else {
              bar.style.marginLeft = rate + "%";
            }
          }
        });
      },
      handleArrowButton(swiffy, el) {
        const nextButton = el.querySelector(".arrow-next");
        const prevButton = el.querySelector(".arrow-prev");

        if (nextButton) {
          nextButton.addEventListener("click", function (e) {
            swiffy.slide();
          });
        }
        if (prevButton) {
          prevButton.addEventListener("click", function (e) {
            swiffy.slide(false);
          });
        }
      },
      handlePaginationBar(swiffy, configs) {
        swiffy.sliderElement.addEventListener("maximize:swiffy-slider:slide", (event) => {
          const newActiveSlideIndex = Number(event.detail.newActiveSlideIndex);
          if (configs.paginationBar == "number_bar") {
            if (event.detail.el.querySelector(".current-active-index")) {
              event.detail.el.querySelector(".current-active-index").textContent = newActiveSlideIndex + 1;
            }
          } else if (configs.paginationBar == "image") {
            try {
              let imagePaginationList = event.detail.el.querySelectorAll(".pagination-active-image");
              let newActivePagination = newActiveSlideIndex < imagePaginationList.length - 1 ? newActiveSlideIndex + 1 : 0;
              imagePaginationList.forEach((imagePagination, index) => {
                imagePagination.classList.toggle("active", index === newActivePagination);
              });
            } catch (e) {
              console.error(e);
            }
          }
          this.handleLoadingProgress(event.detail.el, configs);
        });
      },
      handleLoadingProgress(el, configs){
        if (configs.paginationBar == "image") {
          // let paginationWrapper = el.querySelector(".image-pagination-wrapper");
          // if (!paginationWrapper) return;
          // paginationWrapper.classList.remove("active");
          // setTimeout(() => {
          //   paginationWrapper.classList.add("active");
          // }, 300);

          const overlay = el.querySelector('.pagination-image-ovelay');
          if (!overlay) return;
          overlay.classList.remove("active");
          overlay.restartTimeout = setTimeout(() => {
            overlay.classList.add("active");
          }, 300);
        } else {
          const loadingEl = el.querySelector(".slider-autoplay-loading");
          if (!configs.autoPlay || !loadingEl) return;

          loadingEl.classList.remove("active");
          loadingEl.restartTimeout = setTimeout(() => {
            loadingEl.classList.add("active");
          }, 300);
        }
      }
    });
    Alpine.store("xProductCard", {
      loadedChooseOptions: {},
      async loadChooseOptions(url, el, optionId, index, isShowQuantity = false) {
        const productCardWrapper = el.closest(".product-card__wrapper")
        if (!productCardWrapper) return;

        let listOptionValuesIdSelected = productCardWrapper.dataset.listOptionValuesIdSelected ? productCardWrapper.dataset.listOptionValuesIdSelected.split(",") : "";
        let urlProduct = `${url}?option_values=${listOptionValuesIdSelected}&section_id=choose-option&page=${index}`;

        let destinationElm = productCardWrapper.querySelector(".choose-option");
        let loadingEl = productCardWrapper.querySelector(".icon-loading");

        const renderQuantity = () => {
          const quantityContainer = destinationElm.querySelector('#ChooseOptionQuantity');
          
          if (isShowQuantity) {
            if (quantityContainer) {
              quantityContainer.classList.remove('hidden');
            }
          } else {
            if (quantityContainer) {
              quantityContainer.remove();
            }
          }
        };
        
        if (this.loadedChooseOptions[urlProduct]) {
          destinationElm.innerHTML = this.loadedChooseOptions[urlProduct];
          renderQuantity();
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
          let parsedContent = parser.parseFromString(content, "text/html").getElementById("ChooseOptionContent").innerHTML;
          if (parsedContent) {
            if (destinationElm) {
              destinationElm.innerHTML = parsedContent;
              renderQuantity();
            }
            if (!Shopify.designMode) {
              this.loadedChooseOptions[urlProduct] = parsedContent;
            }
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
      handleCardHover(el) {
        const swiffy = new SwiffySlider(el, {});
        let cardImage = swiffy.sliderElement.querySelector(".slider-container");
        if (window.innerWidth >= MIN_DEVICE_WIDTH.desktop) {
          let mouseMoveRafId;
          const onMouseMove = (e) => {
            if (mouseMoveRafId) cancelAnimationFrame(mouseMoveRafId);
            mouseMoveRafId = requestAnimationFrame(() => {
              let left = e.offsetX;
              let width = cardImage.getBoundingClientRect().width;
              if (window.Maximize.rtl) {
                left = width - left;
              }
              let spacing = left / width;
              let index = Math.floor(spacing * swiffy.slides.length);
              swiffy.dispatchEventSlide(swiffy.activeSlideIndex);
              swiffy.updateActiveSlide(index);
            });
          };

          let mouseLeaveRafId;
          const onMouseLeave = () => {
            if (mouseLeaveRafId) cancelAnimationFrame(mouseLeaveRafId);
            mouseLeaveRafId = requestAnimationFrame(() => {
              swiffy.dispatchEventSlide(swiffy.activeSlideIndex);
              swiffy.updateActiveSlide(0);
            });
          };

          cardImage.addEventListener("mousemove", onMouseMove);
          cardImage.addEventListener("mouseleave", onMouseLeave);
        }
      }
    });
  });
});


class IntersectionElement extends HTMLElement {
  constructor() {
    super();
    this.isIntersecting = false;
    this.observer = null;
    this.isValidContext = false;
    this.observerElement = this;
  }

  connectedCallback() {
    this.handleInit();

    this.isValidContext = this.checkValidContext();
    if (!this.isValidContext) return;
    
    this.actionBeforeSetupObserver();
    this.setupObserver();
    this.actionAfterSetupObserver();
  }

  disconnectedCallback() {
    if (!this.isValidContext) return;

    if (this.isIntersecting) {
      this.handleLeave();
      this.isIntersecting = false;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  handleInit() {}

  checkValidContext() {
    return true;
  }

  setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isIntersecting) {
            this.isIntersecting = true;
            this.handleIntersect();
          }

          if (!entry.isIntersecting && this.isIntersecting) {
            this.isIntersecting = false;
            this.handleLeave();
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.01
      }
    );

    this.observer.observe(this.observerElement);
  }

  actionBeforeSetupObserver() {}
  actionAfterSetupObserver() {}
  handleIntersect() {}
  handleLeave() {}
}

class SelectElement extends HTMLElement {
  constructor() {
    super();

    this.button = this.querySelector(".select-button");
    this.label = this.querySelector(".select-label");
    this.labelButton = this.querySelector(".select-button__label");
    this.optionsListWrapper = this.querySelector(".select-options-wrapper");
    this.selectType = this.dataset.selectType;
    this.noRequire = this.dataset.noRequire;
    this.arrowDropdown = this.querySelector(".select-arrow");

    this.isOpen = false;
    this.optionSelected = this.querySelector('.select-option[aria-selected="true"]');
    this.focusOption = null;
    this.optionsList = this.querySelector(".select-options");
    this.listOptionsEle = this.querySelectorAll(".select-option");
  }

  connectedCallback() {
    this.button.addEventListener("keydown", this.handleKeydown);
    this.button.addEventListener("click", this.handleClickButton);
    window.addEventListener("scroll", this.handleScroll);
    this.optionsListWrapper.classList.add('h-0');

    this.handleAddEventItem();

    this.initObserver();
  }

  disconnectedCallback() {
    this.button.removeEventListener("keydown", this.handleKeydown);
    this.button.removeEventListener("click", this.handleClickButton);
    window.removeEventListener("scroll", this.handleScroll);

    this.optionsList.removeEventListener('click', this.handleOptionClick);
    this.optionsList.removeEventListener('mouseover', this.handleOptionMouseOver);
    this.optionsList.removeEventListener('mouseout', this.handleOptionMouseOut);
  }

  handleAddEventItem() {
    this.optionsList?.addEventListener('click', this.handleOptionClick);
    this.optionsList?.addEventListener('mouseover', this.handleOptionMouseOver);
    this.optionsList?.addEventListener('mouseout', this.handleOptionMouseOut);
  }

  handleKeydown = (evt) => {
    if (!this.isOpen) {
      if (evt.key === "Enter" || evt.key === "Spacebar" || evt.key === " ") {
        evt.preventDefault();
        this.handleOpen();
      }
    }
  }

  handleKeydownWhenOpened = (evt) => {
    if (evt.key === "Enter" || evt.key === "Spacebar" || evt.key === " ") {
      evt.preventDefault();
      this.handleClose();
    } else if (evt.key === "ArrowDown" || evt.key === "Down") {
      evt.preventDefault();
      this.selectedOptionIndex = 0;
      this.setOptionFocus(this.selectedOptionIndex);
    } else if (evt.key === "ArrowUp" || evt.key === "Up") {
      evt.preventDefault();
      this.selectedOptionIndex = this.listOptionsEle.length - 1;
      this.setOptionFocus(this.selectedOptionIndex);
    } else if (evt.key === "Tab") {
      this.handleClose();
    } else if (evt.key === "Escape" || evt.key === "Esc") {
      evt.preventDefault();
      evt.stopPropagation();
      this.handleClose();
    }
  }

  handleClickButton = (evt) => {
    evt.preventDefault();
    // let expanded = this.getAttribute("aria-expanded") === "false";
    // this.setAttribute("aria-expanded", expanded.toString());

    if (this.isOpen) {
      this.handleClose();
    } else {
      this.handleOpen();
    }
    evt.stopPropagation();
  }

  handleOpen() {
    this.listOptionsEle = Array.from(this.querySelectorAll(".select-option"));
    if (this.listOptionsEle.length === 0) return;

    this.optionSelected = this.querySelector('.select-option[aria-selected="true"]');
    this.optionSelectedEle = this.querySelector(".select-option-selected");
    if (!this.optionSelected && this.listOptionsEle.length > 0 && this.noRequire !== "true") {
      this.optionSelected = this.listOptionsEle[0];
    }

    this.button.addEventListener("keydown", this.handleKeydownWhenOpened);

    document.addEventListener("mousedown", this.handleClickBody);

    if (this.arrowDropdown) this.arrowDropdown.classList.add("rotate-180");

    requestAnimationFrame(() => {
      this.optionsListWrapper.classList.remove('h-0');
      this.isOpen = true;
      this.button.ariaExpanded = true;
      
      if (this.selectType !== "product-picker") {
        this.adjustPosition();
      } else {
        this.optionsListWrapper.classList.add("is-open");
      }

      this.optionsListWrapper.addEventListener("keydown", this.handleKeydownOptionList);
    });
  }

  handleClose() {
    this.isOpen = false;
    this.button.ariaExpanded = false;
    this.optionsListWrapper.classList.remove("is-open");
    if (this.arrowDropdown) this.arrowDropdown.classList.remove("rotate-180");

    if (this.optionSelected) this.optionSelected.classList.add("selected");

    this.optionsListWrapper.removeEventListener("keydown", this.handleKeydownOptionList);
    this.button.removeEventListener("keydown", this.handleKeydownWhenOpened);
    this.listOptionsEle = Array.from(this.listOptionsEle);
    this.listOptionsEle.forEach((opt) => {
      opt.tabIndex = -1;
      opt.classList.remove("focused");
    });

    this.button.focus();
    document.removeEventListener("mousedown", this.handleClickBody);

    setTimeout(() => {
      this.optionsListWrapper.classList.add('h-0');
    }, 100);
  }

  handleClickBody = (evt) => {
    if (!this.isOpen || (evt && evt.target && (this.optionsListWrapper.contains(evt.target) || this.button.contains(evt.target)))) return;

    evt.preventDefault();
    evt.stopPropagation();
    this.handleClose();
    if (evt?.target) {
      evt.target.focus();
    }
  }

  handleScroll = () => {
    if (this.isOpen && this.selectType !== "product-picker") {
      this.handleClose();
    }
  }

  handleOptionMouseOver = (evt) => {
    //this.optionSelected && this.optionSelected.classList.remove("selected");
    if (this.focusOption) {
      this.focusOption.classList.remove("focused");
    }

    if (!evt.target.closest(".select-option")) return;
    this.focusOption = evt.target.closest(".select-option");
    this.focusOption.classList.add("focused");
  }

  handleOptionMouseOut = () => {
    //this.optionSelected && this.optionSelected.classList.add("selected");
    if (this.focusOption) {
      this.focusOption.classList.remove("focused");
    }
  }

  handleOptionClick = (event) => {
    const newOptionSelected = event.target.closest(".select-option");
    if (newOptionSelected?.classList.contains("disabled") && this.selectType === "product-picker") return;
    this.setSelectedOption(newOptionSelected);
    this.handleClose(null, true);
  }

  handleKeydownOptionList = (evt) => {
    const key = evt.key;
    if (key === "ArrowDown") {
      evt.preventDefault();
      this.moveFocus(1);
    } else if (key === "ArrowUp") {
      evt.preventDefault();
      this.moveFocus(-1);
    } else if (key === "Escape" || key === "Esc" || key === "Tab") {
      evt.preventDefault();
      evt.stopPropagation();
      this.handleClose();
    } else if (evt.key === "Enter" || evt.key === "Spacebar" || evt.key === " ") {
      evt.preventDefault();
      this.setSelectedOption(evt.target.closest(".select-option"));
      this.handleClose();
    }
  }

  moveFocus(step) {
    const options = Array.from(this.listOptionsEle);
    if (!options.length) return;

    if (this.selectedOptionIndex == null) {
      this.selectedOptionIndex = 0;
    } else if (this.selectedOptionIndex < 0 ) {
      this.selectedOptionIndex = options.length;
    } else {
      this.selectedOptionIndex = (this.selectedOptionIndex + step + options.length) % options.length;
    }

    this.setOptionFocus(this.selectedOptionIndex);

    const currentOption = options[this.selectedOptionIndex];
    if (currentOption) currentOption.scrollIntoView({block: "nearest", inline: "nearest"});
  }

  setOptionFocus(index) {
    const options = Array.from(this.listOptionsEle);
    if (!options.length || index < 0 || index >= options.length) return;

    options.forEach((opt, i) => {
      opt.tabIndex = i === index ? 0 : -1;
      opt.classList.toggle("focused", i === index);
    });

    options[index].focus();
  }

  setSelectedOption(selectedOption) {
    if (this.optionSelected !== selectedOption) {
      if (this.optionSelected) {
        this.optionSelected.ariaSelected = false;
        this.optionSelected.classList.remove('selected');
      }

      selectedOption.ariaSelected = true;
      selectedOption.classList.add('selected');
      let optionSelectedValue = selectedOption.dataset.value;
      this.optionSelected = selectedOption;

      if (this.label) this.label.textContent = optionSelectedValue;
      if (this.labelButton) this.labelButton.textContent = selectedOption.dataset.selectValue;
      if (this.optionSelectedEle) this.optionSelectedEle.setAttribute("value", optionSelectedValue);
      this.dispatchEventChange(selectedOption);
    }
  }

  adjustPosition() {
    if (this.optionsListWrapper.dataset.adjustPosition === "false") {
      this.optionsListWrapper.classList.add("is-open");
    } else {
      const optionListPaddingByPx = 16;
  
      const { bottom: buttonBottom } = this.button.getBoundingClientRect();
  
      const optionListHeight = this.optionsListWrapper.getBoundingClientRect().height;
  
      const dropdownBottom = buttonBottom + optionListHeight + optionListPaddingByPx;
      const showAbove = dropdownBottom > window.innerHeight;
  
      this.optionsListWrapper.classList.toggle("show-above", showAbove);
      this.optionsListWrapper.classList.add("!transition-none");
      requestAnimationFrame(() => {
        this.optionsListWrapper.classList.remove("!transition-none");
        this.optionsListWrapper.classList.add("is-open");
      })
    }
  }

  initObserver() {
    if (!this.optionsList) return;

    this.observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const target = mutation.target;
          if (target.classList.contains("select-option") && target.classList.contains("selected")) {
            this.optionSelected = target;
            if (this.label) this.label.textContent = target.dataset.value;
            if (this.labelButton) this.labelButton.textContent = target.dataset.selectValue;
          }
        } else if (mutation.type === "childList") {
          this.listOptionsEle = this.querySelectorAll(".select-option");
        }
      }
    });

    this.observer.observe(this.optionsList, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class"]
    });
  }

  dispatchEventChange(newOptionSelected) {
    newOptionSelected.dispatchEvent(
      new CustomEvent(SELECT_ELEMENT_EVENT.change, {
        bubbles: true,
        cancelable: true,
        detail: {
          target: newOptionSelected,
          value: this.optionSelected.dataset.value,
        },
      })
    );
  }
}

if (!customElements.get("select-element")) {
  customElements.define("select-element", SelectElement);
}


class CustomToolTip extends HTMLElement {
  constructor() {
    super();
    this.tooltipEl = this.querySelector(".tooltip-popup-wrapper");
    this.tooltipTrigger = this.querySelector(".tooltip-trigger");
  }

  connectedCallback() {
    if (this.tooltipEl && this.tooltipTrigger) {
      this.tooltipTrigger.addEventListener("mouseenter", this.handleOpenTooltip.bind(this));
      this.tooltipTrigger.addEventListener("mouseleave", this.handleCloseTooltip.bind(this));
    }
  }

  disconnectedCallback() {
    if (this.tooltipEl && this.tooltipTrigger) {
      this.tooltipTrigger.removeEventListener("mouseenter", this.handleOpenTooltip.bind(this));
      this.tooltipTrigger.removeEventListener("mouseleave", this.handleCloseTooltip.bind(this));
    }
  }

  handleOpenTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.add("tooltip-visible");
    }
  }

  handleCloseTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove("tooltip-visible");
    }
  }
}

if (!customElements.get("custom-tooltip")) {
  customElements.define("custom-tooltip", CustomToolTip);
}

class CustomButton extends IntersectionElement {
  constructor() {
    super();
    this.domObserver = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.dataset.checkDomChange == 'true' && !this.button) {
      this.setupDomObserver();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupDomObserver();
  }

  setupDomObserver() {
    this.domObserver = new MutationObserver(() => {
      this.handleDomChange();
    });

    this.domObserver.observe(this, {
      childList: true,
      subtree: true
    });
  }

  cleanupDomObserver() {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
  }

  handleDomChange() {
    const newButton = this.querySelector(
      ".button, button, .anm-button-primary, .anm-button-secondary"
    );

    if (!newButton) return;
    this.cleanupDomObserver();
    this.handleInit();

    this.isValidContext = this.checkValidContext();
    if (!this.isValidContext) return;
    
    this.actionBeforeSetupObserver();
    this.setupObserver();
    this.actionAfterSetupObserver();
  }

  handleInit() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.button = this.querySelector(
      ".button, button,  .anm-button-primary, .anm-button-secondary"
    );
    this.onMouseEnter = this.handleMouseEnter.bind(this);
    this.onMouseLeave = this.handleMouseLeave.bind(this);
    this.observerElement = this.button;
  }

  checkValidContext() {
    if (!this.button || this.button.classList.contains("button-link")) return false;
    if (this.button.classList.contains('anm-btn-from-context') && !this.button.closest('.anm-btn-controller')) return false;

    if (!window.Maximize || (window.Maximize.buttonHoverAnm != BUTTON_HOVER_ANM.thicken)) return false;

    return true;
  }

  handleIntersect() {
    this.button.addEventListener("mouseenter", this.onMouseEnter);
    this.button.addEventListener("mouseleave", this.onMouseLeave);
  }

  handleLeave() {
    this.button.removeEventListener("mouseenter", this.onMouseEnter);
    this.button.removeEventListener("mouseleave", this.onMouseLeave);
  }

  handleMouseEnter(e) {
    if (window.innerWidth < MIN_DEVICE_WIDTH.desktop) return;

    const rect = this.button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.button.classList.remove('is-hover');

    this.button.style.setProperty('--mouse-in-button-x', `${x}px`);
    this.button.style.setProperty('--mouse-in-button-y', `${y}px`);

    this.button.offsetHeight;
    
    requestAnimationFrame(() => {
      this.button.classList.add('is-hover');
    });
  }

  handleMouseLeave(e) {
    if (window.innerWidth < MIN_DEVICE_WIDTH.desktop) return;
    
    const rect = this.button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.button.style.setProperty('--mouse-in-button-x', `${x}px`);
    this.button.style.setProperty('--mouse-in-button-y', `${y}px`);

    this.button.classList.remove('is-hover');
  }
}

if (!customElements.get("custom-button")) {
  customElements.define("custom-button", CustomButton);
}

class CustomToolTipContainer extends CustomToolTip {
  constructor() {
    super();
    this.listTooltipTrigger = this.querySelectorAll(".container__tooltip-trigger");
  }
  connectedCallback() {
    if (this.tooltipEl && this.listTooltipTrigger.length > 0) {
      this.sectionAnnouncementEl = document.getElementById("x-announcement");
      this.sectionHeaderEl = document.getElementsByClassName("section-header")[0];
      this.listTooltipTrigger.forEach((el) => {
        el.addEventListener("mouseenter", this.handleUpdateTooltip.bind(this, el));
        el.addEventListener("mouseleave", this.handleCloseTooltip.bind(this));
      });
    }
  }

  disconnectedCallback() {
    if (this.tooltipEl && this.listTooltipTrigger.length > 0) {
      this.listTooltipTrigger.forEach((el) => {
        el.removeEventListener("mouseenter", this.handleUpdateTooltip.bind(this, el));
        el.removeEventListener("mouseleave", this.handleCloseTooltip.bind(this));
      });
    }
  }

  handleUpdateTooltip(el) {
    if (this.tooltipEl) {
      const tooltipBoundary = this.tooltipEl.closest(".tooltip-boundary");
      const tooltipContentEl = this.tooltipEl.querySelector(".tooltip-content");
  
      if (!this.tooltipEl || !tooltipContentEl || el.dataset.isNoText == "true") return;
  
      this.tooltipEl.dataset.tooltipPosition = "top";
  
      const temp = document.createElement("div");
      temp.innerHTML = el.innerHTML;
      temp.querySelectorAll('[data-tooltip-exclude]')
        .forEach(el => el.remove());
        
      tooltipContentEl.innerHTML = temp.innerHTML;
        
      requestAnimationFrame(() => {
        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const boundaryRect = tooltipBoundary?.getBoundingClientRect();
  
        if (tooltipRect.top < (boundaryRect?.top || 0)) {
          this.tooltipEl.dataset.tooltipPosition = "bottom";
        } else {
          let heightHeaderAndAnnouncementBar = 0;
          if (this.sectionAnnouncementEl && this.sectionAnnouncementEl.classList.contains('announcement-sticky')) {
            heightHeaderAndAnnouncementBar += this.sectionAnnouncementEl.getBoundingClientRect().height;
          }
          
          if (this.sectionHeaderEl && this.sectionHeaderEl.classList.contains('sticky-header') && document.getElementById('x-header-content')) {
            heightHeaderAndAnnouncementBar += getValueCssVariable('--height-header', document.getElementById('x-header-content'), true);
          }

          if (tooltipRect.top < heightHeaderAndAnnouncementBar) {
            this.tooltipEl.dataset.tooltipPosition = "bottom";
          } else {
            this.tooltipEl.dataset.tooltipPosition = "top";
          }
        }
        this.tooltipEl.classList.add("tooltip-visible");
      });
    }
  }
}

if (!customElements.get("custom-tooltip-container")) {
  customElements.define("custom-tooltip-container", CustomToolTipContainer);
}

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data("xModalSearch", (type, desktopMaximumResults, mobileMaximumResults, productTypeSelected) => ({
      t: "",
      isFirstLoading: true,
      result: ``,
      query: "",
      cachedResults: [],
      openResults: false,
      isFocusedSearchForm: false,
      productTypeSelected: productTypeSelected,
      showSuggest: true,
      loading: false,
      loadingProductType: false,
      open() {
        if (this.isFirstLoading) this.isFirstLoading = false;

        this.isFocusedSearchForm = true;
        setTimeout(() => {
          this.$refs.input_search.focus();
        }, 50)
        this.$refs.close_button && this.$refs.close_button.classList.remove("hidden");
        this.setSearchBoxHeight();

        if (this.result.length > 0) this.openResults = true;
        document.body.classList.add("overflow-hidden");
        Alpine.store('xFocusElement').activeElement = this.$el
      },
      close() {
        if (this.$refs.close_button) {
          this.$refs.close_button.classList.add("hidden");
        }
        document.body.classList.remove("overflow-hidden");
        Alpine.store('xFocusElement').removeTrapFocus();
        this.isFocusedSearchForm = false;
        this.openResults = false;
      },
      handleChangeInput() {
        this.query = this.$el.value;
        if (this.query !== "") {
          this.showSuggest = false;
          this.getSearchResult(this.query);
        } else {
          this.showSuggest = true;
          this.openResults = false;
        }
      },
      handleChangeProductType() {
        this.getSearchResult(this.query);
      },
      getSearchResult(query) {
        if (!this.isFocusedSearchForm) this.isFocusedSearchForm = true;
        this.setSearchBoxHeight();
        this.openResults = true;
        const limit = window.innerWidth >= MIN_DEVICE_WIDTH.tablet ? desktopMaximumResults : mobileMaximumResults;
        let q = this.productTypeSelected !== productTypeSelected ? `${this.productTypeSelected} AND ${query}` : query;

        const queryKey = q.replace(" ", "-").toLowerCase() + "_" + limit;

        if (this.cachedResults[queryKey]) {
          this.result = this.cachedResults[queryKey];
          return;
        }

        this.loading = true;
        const field = "author,body,product_type,tag,title,variants.barcode,variants.sku,variants.title,vendor"
        fetch(`${Shopify.routes.root}search/suggest?q=${encodeURIComponent(q)}&${encodeURIComponent("resources[type]")}=${encodeURIComponent(type)}&${encodeURIComponent('resources[options][fields]')}=${encodeURIComponent(field)}&${encodeURIComponent("resources[limit]")}=${encodeURIComponent(limit)}&section_id=predictive-search`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("");
            }
            return response.text();
          })
          .then((response) => {
            const parser = new DOMParser();
            const text = parser.parseFromString(response, "text/html");
            this.result = text.querySelector("#shopify-section-predictive-search")?.innerHTML;
            this.cachedResults[queryKey] = this.result;
          })
          .catch((error) => {
            throw error;
          });
        this.loading = false;
      },
      fetchRefinedSearch() {
        if (this.loadingProductType === "loaded") return;
        this.loadingProductType = 'loading'
        fetch(`${Shopify.routes.root}?section_id=product-type`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("");
          }
          return response.text();
        })
        .then((responseText) => {
          const parser = new DOMParser();
          const dataHTML = parser.parseFromString(responseText, "text/html");

          const selectOptionWrapper = this.$root.querySelector(".select-options-wrapper");
          const selectElement = this.$root.querySelector("select-element");

          if (selectOptionWrapper) {
            selectOptionWrapper.innerHTML = dataHTML.querySelector(".select-options-wrapper")?.innerHTML;
          }
          if (selectElement) {
            selectElement.optionSelected = selectElement.querySelector('.select-option[aria-selected="true"]');
            selectElement.optionsList = selectElement.querySelector(".select-options");
            selectElement.handleAddEventItem();
          }
        }).finally(() => this.loadingProductType = 'loaded')
      },
      setSearchBoxHeight() {
        Alpine.nextTick(() => {
          if (this.$refs.search_content) {
            requestAnimationFrame(() => {
              const top = this.$refs.search_content.getBoundingClientRect().top;
              if (top > 0) {
                this.$refs.search_content.style.setProperty('--input-search-to-top', `${top}px`);
              }
            });
          }

        })
      },
      setProductType(el, defaultType) {
        this.productTypeSelected = defaultType ? productTypeSelected : el.textContent.trim();
        //document.getElementById(input).value = value;
        if (this.query != "") {
          this.getSearchResult(this.query);
        }
      },
      focusForm() {
        if (this.isFirstLoading) this.isFirstLoading = false;
        this.setSearchBoxHeight();

        if (this.$refs.close_button) {
          document.body.classList.add("overflow-hidden");
          this.$refs.close_button.classList.remove("hidden");
        }

        if (this.$el.value === "") {
          this.showSuggest = true;
          this.isFocusedSearchForm = true;
        } else {
          this.query = this.$el.value;
          this.getSearchResult(this.query)
          this.isFocusedSearchForm = true;
          this.openResults = true
          this.showSuggest = false;
        }
      },
      handleKeyUpModal(event) {
        if (event.key === "Escape" || event.key === "Esc") {
          event.preventDefault();
          return;
        }
        if (event.key === "Tab" || event.key === "Shift") {
          return;
        }
        this.query = this.$el.value;
        return () => {
          clearTimeout(this.t);
          this.t = setTimeout(() => {
            this.open();
            if (this.query != "") {
              this.showSuggest = false;
            } else {
              this.showSuggest = true;
              this.result = "";
            }
          }, 300);
        };
      },
    }));
    Alpine.data("xFreeShipping", (sectionId) => ({
      init() {
        document.addEventListener(`${CART_EVENT.cartUpdate}`, (e) => {
          fetch(`${window.location.pathname}?section_id=${sectionId}`)
            .then((response) => response.text())
            .then((response) => {
              const html = new DOMParser().parseFromString(response, "text/html");
              const newContent = html.getElementById("announcement-free-shipping");
              this.$el.innerHTML = newContent.innerHTML;
            });
        });
      },
    }));

    Alpine.data("xCollapsibleTab", (initIsOpen) => ({
      isOpenCollapsible: initIsOpen,
      init() {
        if (!initIsOpen) {
          let collapsibleContentEle = this.$el.querySelector(`.collapsible-tab__content`);
          if (collapsibleContentEle) {
            collapsibleContentEle.classList.remove(`hidden`);
          }
        }
      },
      handleToggleTab: function () {
        this.isOpenCollapsible = !this.isOpenCollapsible;
      }
    }));

    Alpine.data('xMediaModel', () => ({
      MAX_RETRIES_WAIT_SCROLL_END: 50,
      loaded: false,
      handleInit() {
        this.loaded = true;
        window.Shopify.loadFeatures([
          {
            name: 'shopify-xr',
            version: '1.0',
            onLoad: this.__setUpShopifyXR.bind(this),
          },
        ]);
      },
      handleLoadModel() {
        let container = this.$el.parentNode;
        const content = document.createElement('div');
        content.appendChild(container.querySelector('template').content.firstElementChild.cloneNode(true));

        this.$el.classList.add('hidden');
        container.appendChild(content.querySelector('model-viewer'));
        this.__loadViewerUI();
      },
      handlePauseViewer() {
        if (this.$el.modelViewerUI) this.$el.modelViewerUI.pause();
      },
      __setUpShopifyXR() {
        const setup = () => {
          document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
            window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
            modelJSON.remove();
          });
          window.ShopifyXR.setupXRElements();
        }

        if (!window.ShopifyXR) {
          document.addEventListener('shopify_xr_initialized', () => {
            setup();
          });
          return;
        }

        setup();
      },
      __loadViewerUI() {
        window.Shopify.loadFeatures([
          {
            name: 'model-viewer-ui',
            version: '1.0',
            onLoad: this.__setUpViewerUI.bind(this),
          },
        ]);
      },
      __setUpViewerUI(errors) {
        if (errors) return;

        this.$el.parentNode.modelViewerUI
          = new Shopify.ModelViewerUI(this.$el.parentNode.querySelector('model-viewer'));
      },
      waitScrollEndedOnDesktop(callback) {
        let count = 0;
        const isMobile = window.innerWidth < MIN_DEVICE_WIDTH.tablet ? true : false;
        const galleryWrapperDataset = this.$el.closest('.media-gallery__wrapper')?.dataset;

        const intervalId = setInterval(() => {
          if (
            isMobile ||
            galleryWrapperDataset?.isScrollingOnDesktop != 'true' ||
            count >= this.MAX_RETRIES_WAIT_SCROLL_END
          ) {
            if (galleryWrapperDataset) {
              galleryWrapperDataset.isScrollingOnDesktop = 'false';
            }
            clearInterval(intervalId);
            callback();
            return;
          }

          count++;
        }, TIMEOUT.scrollIdle);
      },
      initModelInSlideEffect() {
        this.waitScrollEndedOnDesktop(() => {
          const mediaitem = this.$el.closest('.media-gallery__media-item');
          if (this.loaded || !mediaitem.classList.contains('is-active-in-two-columns')) return;
          this.handleInit();
          this.handleLoadModel();
        });

        document.addEventListener(`${PRODUCT_MEDIA_EVENT.show_model}-${this.$el.dataset.mediaId}`, (event) => { 
          if (this.loaded) return;
          if (window.innerWidth >= MIN_DEVICE_WIDTH.tablet) {
            this.waitScrollEndedOnDesktop(() => {
              if (this.loaded) return;
              this.handleInit();
              this.handleLoadModel();
            })
          } else {
            this.handleInit();
            this.handleLoadModel();
          }
        });
      }
    }))
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xCustomerEvent', {
      fire(eventName, el, data) {
        if (Shopify.designMode) return;

        const formatedData = data ? data : xParseJSON(el.dataset.customEvent);
        Shopify.analytics.publish(eventName, formatedData);
      }
    });

    Alpine.store("xEstimateDelivery", {
      hour: 0,
      minute: 0,
      notification: '',
      countdownCutOffTime(cutOffTime, hrsText, minusText) {
        if (this.notification != '')
          return;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const cutOffHour = cutOffTime.length >= 3 ? parseInt(cutOffTime.slice(0, -2), 10) : 0;
        const cutOffMinute = cutOffTime.length >= 3 ? parseInt(cutOffTime.slice(-2), 10) : 0;

        const current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, currentMinute);
        const cutOff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutOffHour, cutOffMinute);

        if (current >= cutOff) {
          cutOff.setDate(cutOff.getDate() + 1);
        }

        const diffMs = cutOff - current;

        this.hour = Math.floor(diffMs / 1000 / 60 / 60);
        this.minute = Math.floor((diffMs / 1000 / 60) % 60);
        return this.hour > 0 ? this.notification = this.hour + ' ' + hrsText + ' ' + this.minute + ' ' + minusText : this.notification = this.minute + ' ' + minusText;
      },
      updateWidthAndPositionTooltipPopup(el, estimateDeliveryEl, isDrawerCart) {
        if (!isDrawerCart || (Alpine.store('xMiniCart') && Alpine.store('xMiniCart').isOpen)) {
          const tooltipPopupEl = el.querySelector('.tooltip-popup');
          let tooltipWidth = estimateDeliveryEl.offsetWidth * 2 / 3;

          const rectEstimateDelivery = estimateDeliveryEl.getBoundingClientRect();
          const rectTooltip = el.getBoundingClientRect();

          tooltipPopupEl.style.width = tooltipWidth + 'px';

          const originalStyle = tooltipPopupEl.getAttribute("style") || "";

          tooltipPopupEl.style.cssText += `
            position: absolute !important;
            visibility: hidden !important;
            display: block !important;
          `;

          requestAnimationFrame(() => {
            // check with tooltip popup
            const newTooltipWidth = tooltipPopupEl.querySelector('.flash-message').offsetWidth;
            tooltipPopupEl.setAttribute("style", originalStyle);

            if (newTooltipWidth < tooltipWidth) {
              tooltipPopupEl.style.width = `${newTooltipWidth}px`;
              tooltipWidth = newTooltipWidth;
            }
            // end check

            const minTooltipContentOffset = 4;
            const minTooltipMarginEDT = 10;

            if (window.Maximize.rtl) {
              const innerWidth = window.innerWidth
              if ((innerWidth - rectTooltip.right) - (innerWidth - rectEstimateDelivery.right) > (tooltipWidth - minTooltipContentOffset)) {
                tooltipPopupEl.style.right = '';
                tooltipPopupEl.style.left = `-${minTooltipContentOffset}px`;
              } else {
                tooltipPopupEl.style.right = `-${(innerWidth - rectTooltip.right) - (innerWidth - rectEstimateDelivery.right) - minTooltipMarginEDT}px`;
                tooltipPopupEl.style.left = ``;
              }
            } else {
              if (rectTooltip.left - rectEstimateDelivery.left > (tooltipWidth - minTooltipContentOffset)) {
                tooltipPopupEl.style.left = '';
                tooltipPopupEl.style.right = `-${minTooltipContentOffset}px`;
              } else {
                tooltipPopupEl.style.left = `-${rectTooltip.left - rectEstimateDelivery.left - minTooltipMarginEDT}px`;
                tooltipPopupEl.style.right = ``;
              }
            }
          })
        }
      },
      setupTooltipPopup(el, isDrawerCart) {
        const estimateDeliveryEl = el.closest('.x-estimate-delivery');

        const debounce = (callback, delay) => {
          let timer;
          return function () {
            clearTimeout(timer);
            timer = setTimeout(callback, delay);
          };
        };

        this.updateWidthAndPositionTooltipPopup(el, estimateDeliveryEl, isDrawerCart)
        window.addEventListener('resize', debounce(() => {
          this.updateWidthAndPositionTooltipPopup(el, estimateDeliveryEl, isDrawerCart);
        }, 300));
      }
    });

  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xResizeHandler', {
      callbacks: [],
      triggerResize: null,
      debounce(func, delay) {
        let timer;
        return function (...args) {
          clearTimeout(timer);
          timer = setTimeout(() => func.apply(this, args), delay);
        };
      },
      register(callback, allowDuplicateFuntc, ...params) {
        if (allowDuplicateFuntc) {
          this.callbacks.push({callback, params});
        } else if (!this.callbacks.find(item => item.callback === callback)) {
          this.callbacks.push({callback, params});
        }
      },
      unregister(callback) {
        this.callbacks = this.callbacks.filter(item => item.callback !== callback);
      },
      init() {
        this.triggerResize = this.debounce(() => {
          this.callbacks.forEach(({callback, params}) => {
            callback(...params);
          });
        }, 50);

        window.addEventListener("resize", this.triggerResize);
      }
    });
  });
});

function maximizeParseJSON(jsonString) {
  jsonString = String.raw`${jsonString}`;
  jsonString = jsonString.replaceAll("\\", "\\\\").replaceAll('\\"', '\"');

  return JSON.parse(jsonString);
}

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
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
    }));
  })
});

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
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
        const delay = DURATION.DRAWER_TRANSITION

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
  })
})

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
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
  })
})

function formatWithDelimiters(number, precision, thousands, decimal) {
  precision = defaultOption(precision, 2);
  thousands = defaultOption(thousands, ',');
  decimal = defaultOption(decimal, '.');

  if (isNaN(number) || number == null) {
    return 0;
  }

  number = (number / 100.0).toFixed(precision);

  let parts = number.split('.'),
    dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
    cents = parts[1] ? (decimal + parts[1]) : '';

  return dollars + cents;
}

function defaultOption(opt, def) {
  return (typeof opt == 'undefined' ? def : opt);
}

function formatMoney(amount, formatString) {
  let placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  let value;
  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(amount, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(amount, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(amount, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(amount, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function validateEmail(email) {
  const VALID_REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  if (email === '') {
    return {'isError': true, 'isRequired': true};
  } else if (!email.match(VALID_REGEX_EMAIL)) {
    return {'isError': true, 'isInvalid': true};
  } else {
    return {'isError': false};
  }
}

function getOptionSelectedValues(productId, variantId) {
  let optionsSelectedValues = [];
  const listOptionsValues = window.Maximize.productOptionValues?.has(`${productId}`) ? window.Maximize.productOptionValues.get(`${productId}`) : new Map();
  const listVariantInfo = window.Maximize.variantInfo?.has(`${productId}`) ? window.Maximize.variantInfo.get(`${productId}`) : [];
  const variantOptionsInfo = listVariantInfo.find(variant => variant.id === variantId)?.options || [];

  for (let i = 0; i < variantOptionsInfo.length; i++) {
    let optionValueSelected = listOptionsValues.find(optionValue => optionValue.position === i + 1 && optionValue.value === variantOptionsInfo[i]);
    optionsSelectedValues.push(optionValueSelected ? optionValueSelected.id : null);
  }
  return optionsSelectedValues;
}

function getValueCssVariable(varName, element = document.documentElement, shouldConvertToFloat = false) {
  const value = getComputedStyle(element)
    .getPropertyValue(varName)
    .trim();

  if (!shouldConvertToFloat) return value;
    
  if (!value) return 0;
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );

  const elementFontSize = parseFloat(
    getComputedStyle(element).fontSize
  );

  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return 0;

  if (value.endsWith('ms')) {
    return numericValue;
  }

  if (value.endsWith('s')) {
    return numericValue * MS_PER_SECOND;
  }

  if (value.endsWith('rem')) {
    return numericValue * rootFontSize;
  }

  if (value.endsWith('em')) {
    return numericValue * elementFontSize;
  }

  return numericValue;
}