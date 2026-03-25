function onIntersection(elements, observer) {
  elements.forEach((entry, index) => {
    if (entry.isIntersecting) {
      const elementTarget = entry.target;
      elementTarget.classList.add("animation-card");
      elementTarget.dataset.active = "true";
      elementTarget.setAttribute('style', `--animation-order: ${index + 1};`);
      observer.unobserve(elementTarget);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document) {
  const animationContainers = Array.from(rootEl.querySelectorAll(".anm-reveal-container"));

  animationContainers.forEach((container) => {
    const animationTriggerElements = Array.from(container.querySelectorAll(".anm-reveal-item[data-active='false']"));

    if (animationTriggerElements.length === 0) return;

    const observer = new IntersectionObserver((entries, obs) => {
      onIntersection(entries, obs);
    }, {
      rootMargin: '0px 0px -50px 0px'
    });

    animationTriggerElements.forEach((element) => observer.observe(element));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
});
document.addEventListener(`${ANIMATION_EVENT.revealItem}`, (event) => {
  initializeScrollAnimationTrigger(event.detail?.rootElement);
})
if (Shopify.designMode) {
  // change by reorder insead
  document.addEventListener('shopify:section:load', () => initializeScrollAnimationTrigger(document));
}
