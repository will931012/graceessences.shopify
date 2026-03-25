if(window.Maximize.checkFileNotLoaded()) {
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
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
    });
  });
}
