if (window.Maximize.checkFileNotLoaded()) {
  class SlideElement extends HTMLElement {
    constructor() {
      super();  
      this.listItems = Array.from(this.getElementsByClassName("slide-element__item"));
  
      this.activeIndex = -1;
      this.prevActiveIndex = -1;
      this.animationInterval = null;
      this.classNames = {
        active: "is-active",
        prevActive: "is-prev-active",
        transitionNone: '!transition-none'
      };
      this.isFistTimeVisible = true;
      this.isIntersecting = false;
    }
  
    connectedCallback() {
      if (this.listItems.length === 0) return;
      this.initSlideElement();
      this.setupObserver();
    }
  
    disconnectedCallback() {
      this.handleLeave();
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    setupObserver() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.handleIntersect();
            } else {
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
  
      this.observer.observe(this);
    }

    initSlideElement() {
      let customConfig;
      try {
        customConfig = JSON.parse(this.dataset.config);
        if (typeof customConfig === "string") customConfig = JSON.parse(customConfig);
      } catch {
        customConfig = {};
      }

      customConfig.gap && this.style.setProperty('--slide-element-gap', `${customConfig.gap}px`);
      customConfig.effectDuration && this.style.setProperty('--slide-effect-duration', customConfig.effectDuration);

      this.config = {
        timeToNext: customConfig.timeToNext ? (parseInt(customConfig.timeToNext) * MS_PER_SECOND) : 0,
        gap: (customConfig.gap ? customConfig.gap : SLIDE_ELEMENT.SLIDE_ELEMENT_GAP) || 0,
        effectDuration: (customConfig.effectDuration ? customConfig.effectDuration : SLIDE_ELEMENT.SLIDER_ELEMENT_DURATION) || 0
      }
    }
  
    handleIntersect() {
      if (this.listItems.length === 0) return;

      if (this.isFistTimeVisible) {
        this.activeIndex = 0;
        this.listItems[this.activeIndex]?.classList.add(this.classNames.active, this.classNames.transitionNone);
        requestAnimationFrame(() => {
          this.listItems[this.activeIndex]?.classList.remove(this.classNames.transitionNone);
          this.isFistTimeVisible = false;
        });
      }

      this.handleAutoPlay();
      this.isIntersecting = true;
    }

    handleLeave() {
      this.isIntersecting = false;
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }

    handleAutoPlay() {
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }

      if (this.animationTimeOut) {
        clearTimeout(this.animationTimeOut);
        this.animationTimeOut = null;
      }
  
      if (this.listItems.length > 1 && this.config.timeToNext > 0) {
        if (this.isIntersecting) {
          const duration = this.config.timeToNext;
          this.animationInterval = setInterval(() => {
            this.slide(true);
          }, duration);
        } else {
          const duration = this.config.timeToNext - this.config.effectDuration;
          this.animationTimeOut = setTimeout(() => {
            this.slide(true);
            this.handleAutoPlay();
          }, duration);
        }
      }
    }

    slide(next = true) {
      const currentActiveIndex = this.activeIndex;
      const nextActiveItemIndex = next ? ((this.activeIndex + 1) % this.listItems.length) : ((this.activeIndex - 1 + this.listItems.length) % this.listItems.length);

      if (this.prevActiveIndex !== -1) {
        this.listItems[this.prevActiveIndex].classList.remove(this.classNames.prevActive);
      }
      this.listItems[this.activeIndex].classList.remove(this.classNames.active);

      this.prevActiveIndex = currentActiveIndex;

      this.activeIndex = nextActiveItemIndex;

      this.listItems[this.prevActiveIndex].classList.add(this.classNames.prevActive);
      this.listItems[this.activeIndex].classList.add(this.classNames.active);

      setTimeout(() => {
        this.listItems[this.prevActiveIndex]?.classList.remove(this.classNames.prevActive);
      }, this.config.effectDuration);
    }

    nextItem() {
      this.slide(true);
      this.handleAutoPlay();
    }

    backItem() {
      this.slide(false);
      this.handleAutoPlay();
    }
  }
  
  if (!customElements.get("slide-element")) {
    customElements.define("slide-element", SlideElement);
  }
}