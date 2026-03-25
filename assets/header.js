if (!window.Maximize.loadedScript.includes("header.js")) {
  window.Maximize.loadedScript.push("header.js");
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.store("xHeaderMenu", {
        isSticky: false,
        isTouch: "ontouchstart" in window || (window.DocumentTouch && window.document instanceof DocumentTouch) || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
        sectionId: "",
        stickyType: "none",
        lastScrollTop: false,
        themeModeChanged: false,
        showLogoTransparent: false,
        offsetTop: 0,
        clickedHeader: false,
        headerHeight: 0,
        isTransparent: false,
        logoPosition: null,
        headerElement: null,
        headerBounds: {
          top: 0,
          bottom: 0,
        },
        handleInitHeader(sectionId, stickyType, isTransparent, logoPosition) {
          this.handleStickyHeader();
          this.setViewPortHeight();
          this.setVariableAnnouncementHeight();
          this.headerElement = document.getElementById("x-header-content");
          this.setHeaderBottom();
          const headerElement = document.getElementById(sectionId);
          this.sectionId = sectionId;
          this.stickyType = stickyType;
          this.isTransparent = isTransparent;
          this.logoPosition = logoPosition;
          if (this.isTransparent) {
            this.showLogoTransparent = true;
          }
          if (stickyType !== "none") {
            headerElement.classList.add("sticky-header");
            Alpine.nextTick(() => {
              this.setHeaderHeight();
              this.setHeaderHeightVariable();
            });
          }
          const debouncedResize = this.debounce((event) => {
            if (event.detail?.isChangeLayoutMode !== true) {
              this.setViewPortHeight();
              this.setHeaderHeight();
              this.setHeaderHeightVariable();
              this.setVariableAnnouncementHeight();
              this.setHeaderBottom();
            }
            this.setTopStickyHeader();
          }, 100);

          window.addEventListener("resize", debouncedResize);
          this.createObserver(headerElement);
        },
        createObserver(element) {
          let observer = new IntersectionObserver((entries, observer) => {
            this.headerBounds = entries[0].intersectionRect;
            observer.disconnect();
          });

          observer.observe(element);
        },
        setViewPortHeight() {
          if (!CSS.supports("height", "100dvh")) {
            const root = document.documentElement;
            const currentHeight = getComputedStyle(root).getPropertyValue("--viewport-height").trim();
            const newHeight = window.innerHeight + "px";
            if (currentHeight !== newHeight) {
              document.documentElement.style.setProperty("--viewport-height", window.innerHeight + "px");
            }
          }
        },
        selectItem(el, type, isSub, event) {
          if (type === "menu" && Alpine.store("xDrawerMenu").menuOpen) {
            Alpine.store("xDrawerMenu").handleCloseMenu();
          }
          this.setHeaderBottom();

          const itemSelector = isSub ? ".toggle-menu-sub" : ".toggle-menu";
          if (event && event.type === "click") {
            let menuItemDropdown = el.closest(".menu-item") && el.closest(".menu-item").querySelector(itemSelector);
            if (menuItemDropdown && !menuItemDropdown.classList.contains("is-open")) {
              event.preventDefault();
            }
          }
          var items = isSub ? el.closest(".toggle-menu").querySelectorAll(itemSelector) : document.querySelectorAll(itemSelector);
          for (var i = 0; i < items.length; i++) {
            items[i].classList.remove("is-open");
            items[i].setAttribute("inert", "");
          }
          let toggleMenu = el.querySelector(itemSelector);

          if (toggleMenu) {
            toggleMenu.classList.add("is-open");
            toggleMenu.removeAttribute("inert");
          }
          if (el.closest(".product-menu-item__lv0")) {
            this.setHeightProductMenu(el);
          }
        },
        handleKeyupElement(el) {
          const toggleMenu = el.querySelector(".toggle-menu");
          const menuOpen = document.getElementsByClassName("toggle-menu is-open");

          for (let i = 0; i < menuOpen.length; i++) {
            if (menuOpen[i] !== toggleMenu) {
              menuOpen[i].setAttribute("inert", "");
              menuOpen[i].classList.remove("is-open");
            }
          }

          toggleMenu.classList.toggle("is-open");
          toggleMenu.toggleAttribute("inert");
          if (el.closest(".product-menu-item__lv0")) {
            this.setHeightProductMenu(el);
          }
        },
        setHeightProductMenu(el) {
          const container = el.closest(".product-menu-item__lv0");
          if (container) {
            const productMegaMenu = container?.querySelector(".product-mega-menu");
            const currentProductMenu = container.querySelector(".product-mega-menu_wrapper.is-open .mega-sub-container");
            const productListMenuLv1 = container.querySelector(".product-list-item");
            // Timeout to wait to calculate scroll height
            setTimeout(() => {
              const currentSubMenuHeight = currentProductMenu?.scrollHeight + 35 || 0;
              const listItemHeight = productListMenuLv1?.scrollHeight + 68 || 0;

              let maxHeight = Math.max(currentSubMenuHeight, listItemHeight);
              if (maxHeight >= window.innerHeight) {
                maxHeight = window.innerHeight;
              }

              if (productMegaMenu) {
                productMegaMenu.style.height = `${maxHeight}px`;
              }
            }, 50);
          }
        },

        setHeaderHeight() {
          if (this.headerElement && this.stickyType !== "none") {
            this.headerHeight = this.headerElement.getBoundingClientRect().height;
          }
        },

        setHeaderBottom(timeout = 0) {
          if (timeout > 0) {
            setTimeout(() => {
              this._updateHeaderBottom(this.headerElement);
            }, timeout);
          } else {
            this._updateHeaderBottom(this.headerElement);
          }
        },

        _updateHeaderBottom(headerElement) {
          requestAnimationFrame(() => {
            if (!headerElement) return;

            const rect = headerElement.getBoundingClientRect();
            // Minus 1px for divider
            const newBottom = rect.bottom.toFixed(2) - 1 + "px";

            const currentBottom = getComputedStyle(headerElement).getPropertyValue("--header-bottom-position").trim();
            const DrawerMenuElement = document.getElementById("DrawerMenu");

            if (DrawerMenuElement && this.logoPosition !== "compact") {
              const headerTopEle = document.querySelector(".header-top");
              DrawerMenuElement.style.setProperty("--header-bottom-position", `${headerTopEle.getBoundingClientRect().bottom + 12}px`);
            }
            if (currentBottom !== newBottom) {
              headerElement.style.setProperty("--header-bottom-position", newBottom);
            }
          });
        },

        hideMenu(parentClass) {
          const selectorClass = parentClass ? `.${parentClass} .toggle-menu.is-open` : ".toggle-menu.is-open";
          var items = document.querySelectorAll(selectorClass);
          for (var i = 0; i < items.length; i++) {
            items[i].classList.remove("is-open");
            items[i].setAttribute("inert", "");
          }
        },
        focusFirstItem(el) {
          const firstMenuItem = el.closest(".first-menu-item");
          if (!firstMenuItem) return;

          const focusElement = firstMenuItem.querySelector(".menu-parent-link span:last-of-type");
          focusElement?.focus();
        },
        touchItem(el, type, isSub = false) {
          const touchClass = isSub ? "touched-sub" : "touched";
          if (el.dataset.touchEvent) {
            return;
          } else {
            el.dataset.touchEvent = true;
            el.addEventListener(
              "touchend",
              (e) => {
                if (el.classList.contains(touchClass)) {
                  return;
                } else {
                  e.preventDefault();
                  var dropdown = document.querySelectorAll(`.${touchClass}`);
                  for (var i = 0; i < dropdown.length; i++) {
                    dropdown[i].classList.remove(touchClass);
                  }

                  el.classList.add(touchClass);
                  this.selectItem(el.closest("li"), type, isSub);
                }
              },
              { passive: false }
            );
          }
        },

        debounce(func, wait) {
          let timeout;
          return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
          };
        },

        handleOnScrollUpSticky() {
          requestAnimationFrame(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const header = document.getElementById(this.sectionId);

            if (!header) {
              return;
            }

            if (this.lastScrollTop !== false) {
              const scrollDiff = Math.abs(scrollTop - this.lastScrollTop);

              if (scrollDiff > 10) {
                const isScrollingUp = scrollTop < this.lastScrollTop;

                if (isScrollingUp) {
                  header.classList.remove("header-up");
                  if (this.isTransparent) {
                    this.setHeaderHeight();
                  }
                  this.setHeaderHeightVariable(false);
                } else if (!this.themeModeChanged) {
                  if (this.isTransparent) {
                    this.setHeaderHeight();
                  }
                  header.classList.add("header-up");
                  this.setHeaderHeightVariable(true);
                }
                this.lastScrollTop = scrollTop;
              }
            } else {
              this.lastScrollTop = scrollTop;
            }

            this.themeModeChanged = false;
            this.setTopStickyHeader();
          });
        },
        handleFocusOut(el, event) {
          if (event.relatedTarget && !el.contains(event.relatedTarget)) {
            this.hideMenu("main-menu-nav");
          }
        },
        setHeaderHeightVariable(isHeaderUp = false) {
          requestAnimationFrame(() => {
            let headerHeight = isHeaderUp ? "0px" : this.headerHeight + "px";
            if (this.showLogoTransparent) {
              headerHeight = "0px";
            }
            if (this.headerElement) {
              this.headerElement.style.setProperty("--height-header", headerHeight);
            }
            const targetClasses = [".section-announcement:has([data-is-sticky='true'])", ".sticky-filter-top", ".sticky-top", ".sticky-filter-above-top", ".sticky-filter-aside-content-top", ".sticky-main-product-top", ".section-product-bundle"];

            const elements = document.querySelectorAll(targetClasses.join(","));

            elements.forEach((el) => {
              el.style.setProperty("--height-header", headerHeight);
            });
          });
        },

        handleStickyHeader() {
          requestAnimationFrame(() => {
            if (this.stickyType !== "none") {
              const scrollTop = window.scrollY || document.documentElement.scrollTop;
              const headerElement = document.getElementById(this.sectionId);
              if (scrollTop <= this.offsetTop && scrollTop > this.headerBounds.bottom) {
                this.isSticky = true;
                this.isTransparent && (this.showLogoTransparent = false);
                this.clickedHeader = false;
              } else if (scrollTop > this.offsetTop && scrollTop > this.headerBounds.bottom) {
                this.isSticky = true;
                this.isTransparent && (this.showLogoTransparent = false);
                if (this.stickyType == "always" || this.stickyType == "reduce-logo-size") {
                  headerElement.classList.add("always-animation", this.stickyType);
                }
              } else if (scrollTop <= this.headerBounds.top) {
                if (headerElement) {
                  headerElement.classList.remove(this.stickyType, "always-animation");
                }
                this.clickedHeader = false;
                this.isSticky = false;
                this.isTransparent && (this.showLogoTransparent = true);
              }

              if (this.isTransparent && this.stickyType !== "on-scroll-up") {
                setTimeout(() => {
                  this.setHeaderHeight();
                  this.setHeaderHeightVariable();
                }, 50);
              }
              this.offsetTop = scrollTop >= 0 ? scrollTop : 0;
            }
          });
        },

        handleChangeThemeMode() {
          requestAnimationFrame(() => {
            this.themeModeChanged = true;
            setTimeout(() => {
              this.setHeaderHeight();
              this.setHeaderBottom();
              this.setHeaderHeightVariable();
            }, 100);
          });
        },

        addTransparentHover(el) {
          el.classList.add("sticky-header-active");
        },

        removeTransparentHover(el) {
          if (this.isTouch && this.clickedHeader == false) {
            el.classList.remove("sticky-header-active");
          } else {
            el.classList.remove("sticky-header-active");
          }
        },

        setVariableAnnouncementHeight() {
          requestAnimationFrame(() => {
            const root = document.documentElement;
            const announcement = document.getElementById("x-announcement");
            let announcementHeight = "0px";
            const isSticky = announcement?.dataset.isSticky === "true";
            if (isSticky) {
              announcementHeight = announcement.getBoundingClientRect().height.toFixed(2) + "px";
            }

            root.style.setProperty("--announcement-height", announcementHeight);
          });
        },
        setTopStickyHeader() {
          requestAnimationFrame(() => {
            let root = document.getElementById(this.sectionId);
            root.style.setProperty("--top-header", this.headerHeight + "px");
          });
        },
      });

      Alpine.store("xMobileNav", {
        show: false,
        loading: false,
        currentMenuLinks: [],
        init() {
          installMediaQueryWatcher("(min-width: 1024px)", (matches) => {
            this.close();
          });
        },
        toggle() {
          this.show = !this.show;
          if (this.show) {
            Alpine.nextTick(() => {
              requestAnimationFrame(() => {
                Alpine.store("xHeaderMenu").setHeaderBottom();
                setTimeout(() => {
                  Alpine.store("xFocusElement").trapFocus("x-header-mobile", "menu-navigation");
                }, 300);
              });
            });
          }
          document.body.classList.toggle("overflow-hidden", this.show);
        },
        close() {
          this.show = false;
          document.body.classList.remove("overflow-hidden");
        },
        setActiveLink(linkId) {
          this.currentMenuLinks.push(linkId);
        },
        removeActiveLink(linkId) {
          const index = this.currentMenuLinks.indexOf(linkId);
          if (index !== -1) {
            this.currentMenuLinks.splice(index, 1);
          }
        },
        resetMenu() {
          this.currentMenuLinks = [];
        },
        scrollTop() {
          document.getElementById("menu-navigation").scrollTop = 0;
        },
        moveElement() {
          const element = document.getElementById("utility-bar-mobile");
          const destination = document.getElementById("main-nav-mobile-toolbar");

          if (element && destination && destination.children.length === 0) {
            let count = element.children.length;

            for (let i = 0; i < count; i++) {
              const child = element.children[i];

              if (Shopify.designMode === true) {
                const clone = child.cloneNode(true);
                destination.appendChild(clone);
              } else {
                destination.appendChild(element.children[0]);
              }
            }
          }
        },
      });

      Alpine.data("xScrollMenu", () => ({
        scrollAmount: 200,
        isAtStart: true,
        isAtEnd: false,
        isScrollable: false,
        directionFlag: 1,
        init() {
          this.debouncedCheckScroll = this.debounce(this.checkScroll, 200);
          this.checkScroll();

          addEventListener("resize", () => {
            this.debouncedCheckScroll();
          });
          if (window.Maximize.rtl) {
            this.directionFlag = -1;
          }
        },
        scrollLeft() {
          let scrollAmount = -this.scrollAmount;
          let scrollLeft = this.$refs.menuList.scrollLeft * this.directionFlag;
          if (scrollLeft < this.scrollAmount) {
            scrollAmount = -scrollLeft;
          }
          this.$refs.menuList.scrollBy({
            left: scrollAmount * this.directionFlag,
            behavior: "smooth",
          });
          this.debouncedCheckScroll();
        },
        scrollRight() {
          let scrollLeft = this.$refs.menuList.scrollLeft * this.directionFlag;
          let distance = this.$refs.menuList.scrollWidth - (scrollLeft + this.$refs.menuList.offsetWidth);
          let scrollAmount = this.scrollAmount;
          if (distance < scrollAmount) {
            scrollAmount = distance;
          }
          this.$refs.menuList.scrollBy({
            left: scrollAmount * this.directionFlag,
            behavior: "smooth",
          });
          this.debouncedCheckScroll();
        },
        checkScroll() {
          const menuList = this.$refs.menuList;
          this.isScrollable = menuList.scrollWidth > menuList.offsetWidth;
          if (window.Maximize.rtl) {
            this.isAtStart = Math.abs(menuList.scrollLeft) <= 1;
            this.isAtEnd = Math.abs(menuList.scrollLeft) >= menuList.scrollWidth - menuList.offsetWidth - 1;
          } else {
            this.isAtStart = menuList.scrollLeft === 0;
            this.isAtEnd = menuList.scrollLeft + menuList.offsetWidth >= menuList.scrollWidth;
          }
        },
        debounce(func, wait) {
          let timeout;
          return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
          };
        },
      }));

      Alpine.data("xMenuItem", (rtl) => ({
        positionLeft: false,
        rtl: false,
        init() {
          this.rtl = rtl;
        },
        setPosition(el, level) {
          const elm = el.closest(".menu-item");
          const widthEl = elm.getElementsByClassName("toggle-menu")[0];
          const elRect = elm.getBoundingClientRect();
          let spacingLeft = 0;
          let spacingRight = 0;
          if (rtl) {
            spacingLeft = elRect.right;
            spacing = spacingLeft - widthEl.offsetWidth * level;
          } else {
            spacingRight = window.innerWidth - elRect.left;
            spacing = spacingRight - widthEl.offsetWidth * level;
          }
          const styles = window.getComputedStyle(elm);
          if (level == 1) {
            if (this.rtl) {
              widthEl.style.right = spacing < 0 ? (window.innerWidth + spacing - elRect.right) + "px" : window.innerWidth - parseFloat(styles.paddingRight) - elRect.right + "px";
            } else {
              widthEl.style.left = spacing < 0 ? (elRect.left + spacing) + "px" : elRect.left + "px";
            }
          } else {
            if (rtl) {
              this.positionLeft = spacing < 0 ? false : true;
            } else {
              this.positionLeft = spacing < 0 ? true : false;
            }
          }
        },
        resizeWindow(el, level) {
          addEventListener("resize", () => {
            setTimeout(() => {
              this.setPosition(el, level);
            }, 300);
          });
          el.closest(".main-menu-nav").addEventListener("scroll", () => {
            Alpine.store("xHeaderMenu").hideMenu();
            this.setPosition(el, level);
          });
        },
      }));

      Alpine.data("xFirstLoadItem", () => ({
        isLoaded: false,
        firstLoad() {
          if (!this.isLoaded) {
            this.isLoaded = true;
          }
        },
        handleTouch(el) {
          if (el.dataset.touchItemEvent) {
            return;
          } else {
            el.dataset.touchItemEvent = true;
            el.addEventListener("touchend", (e) => {
              this.firstLoad();
            });
          }
        },
      }));
      
      Alpine.store("xDrawerMenu", {
        menuOpen: null,
        handleMenuToggle(sectionId) {
          if (this.menuOpen === sectionId) {
            Alpine.store("xHeaderMenu").hideMenu(this.menuOpen);
            this.menuOpen = false;
            Alpine.store("xMaximizeDrawer").handleClose();
          } else {
            Alpine.store("xHeaderMenu").hideMenu('first-menu-item');
            if (this.menuOpen) {
              Alpine.store("xHeaderMenu").hideMenu(this.menuOpen);
            }
            this.menuOpen = sectionId;
            Alpine.store("xMaximizeDrawer").handleOpen(`#Section-${sectionId}`);

          }
        },
        handleCloseMenu(sectionId) {
          if (this.menuOpen) {
            this.menuOpen = null;
            Alpine.store("xMaximizeDrawer").handleClose();
            Alpine.store("xHeaderMenu").hideMenu(sectionId);
          }
        }
      })
    });
  });
}
