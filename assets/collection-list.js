if (!customElements.get('collection-list')) {
  class CollectionList extends HTMLElement {
    constructor() {
      super();
      this.dataSectionIndex = this.dataset.sectionIndex;
      if (this.dataSectionIndex !== "1") {
        this.initializeScrollAnimationTrigger();
      } else {
        this.initializeUpdateTitleAnimation();
      }
    }

    onIntersection(elements, observer) {
      elements.forEach((entry, index) => {
          if (entry.isIntersecting) {
          const elementTarget = entry.target;
          elementTarget.dataset.active = "true";
          elementTarget.setAttribute('style', `--animation-order: ${index + 1};`);

          const textElements = elementTarget.querySelectorAll('.text-animation-item');
            textElements.forEach((textEl) => {
              textEl.classList.add('is-visible');
            });
          observer.unobserve(elementTarget);
          }
      });
}

    initializeScrollAnimationTrigger(rootEl = document) {
      const animationContainers = Array.from(rootEl.querySelectorAll(".animated-list-wrapper"));

      animationContainers.forEach((container) => {
          const animationTriggerElements = Array.from(container.querySelectorAll(".anm-reveal-item-collection[data-active='false']"));
          if (animationTriggerElements.length === 0) return;
      

          const observer = new IntersectionObserver((entries, obs) => {
              this.onIntersection(entries, obs);
          }, {
          rootMargin: '0px 0px -50px 0px'
          });

          animationTriggerElements.forEach((element) => observer.observe(element));
      });
    }

    initializeUpdateTitleAnimation(rootEl = document) {
      const titleElements = Array.from(rootEl.querySelectorAll(".text-animation-item"));
      titleElements.forEach((titleEl) => {
        titleEl.classList.add('is-visible');
      });
    }
  }
  customElements.define('collection-list', CollectionList);
}
