if (window.Maximize.checkFileNotLoaded()) {
  class CustomCollections extends HTMLElement {
    constructor() {
      super();
      this.sectionId = this.dataset.sectionId;
      this.currentTab = 1;
      this.isLoading = false;
      this.cachedData = {};
      this.onSelectCollection = this.handleSelectCollection.bind(this);
      this.preventViewAllClick = this.preventViewAllClick.bind(this);
      this.viewAllDisabled = false;
    }
    
    connectedCallback() {
      this.collectionButtons = this.querySelectorAll('.collection-title');
      this.collectionsWrapperEl = document.getElementById(`Collections--${this.sectionId}`);
      this.viewAllLinks = this.querySelectorAll('.collection__view-all');

      if (!this.collectionsWrapperEl) return;

      if (this.collectionButtons.length > 1) {
        const cloneCollectionsWrapperEl = this.collectionsWrapperEl.cloneNode(true);
        this.anmRevealItems = cloneCollectionsWrapperEl.querySelectorAll('.anm-reveal-item');
        this.anmRevealItems.forEach((item) => {
          item.classList.remove('anm-reveal-item');
        });
        this.cachedData[`tabIndex-${this.currentTab}`] = cloneCollectionsWrapperEl.innerHTML;
        
        this.collectionButtons.forEach((button, index) => {
          button.addEventListener('click', this.onSelectCollection);
        });
      }

      if (this.collectionButtons[0]) {
        this.selectCollection(1);
      }

      if (this.viewAllLinks.length > 0) {
        this.viewAllLinks.forEach((el) => {
          el.addEventListener('click', this.preventViewAllClick);
        });
  
        this.setViewAllLink(this.dataset.defaultViewAllLink);
      }
    }
  
    disconnectedCallback() {
      if (!this.collectionButtons) return;

      this.collectionButtons.forEach((button) => {
        button.removeEventListener('click', this.onSelectCollection);
      });

      this.viewAllLinks.forEach((el) => {
        el.removeEventListener('click', this.preventViewAllClick);
      });
    }

    async handleSelectCollection(e) {
      if (!this.collectionsWrapperEl) return;
      
      const tabIndex = parseInt(e.currentTarget.dataset.tabIndex, 10);
      const viewAllLink = e.currentTarget.dataset.viewAllLink;
      if (this.currentTab !== tabIndex && !this.isLoading) {
        await this.loadDataCollection(tabIndex);
        this.selectCollection(tabIndex);
        if (this.viewAllLinks.length > 0) {
          this.setViewAllLink(viewAllLink);
        }
      }
    }

    selectCollection(index) {      
      this.collectionButtons.forEach((button) => {
        const tabIndex = parseInt(button.dataset.tabIndex, 10);
        if (tabIndex === index) {
          button.classList.add('is-active');
        } else {
          button.classList.remove('is-active');
        }
      });
    }
    
    setViewAllLink(link) {
      const isDisabled = !link;

      this.viewAllLinks.forEach((el) => {
        el.href = link || '';
        el.classList.toggle('opacity-70', isDisabled);
        el.classList.toggle('hover:cursor-not-allowed', isDisabled);
      });

      this.viewAllDisabled = isDisabled;
    }

    preventViewAllClick(e) {
      if (this.viewAllDisabled) {
        e.preventDefault();
      }
    }

    selectCollectionButtonsLoading(isLoading, nextTabIndexActive) {
      if (isLoading) {
        this.collectionButtons[nextTabIndexActive - 1].classList.add('next-tab-active');
        this.collectionButtons.forEach((button) => {
          button.setAttribute('aria-disabled', 'true');
        });
      } else {
        this.collectionButtons[nextTabIndexActive - 1].classList.remove('next-tab-active');
        this.collectionButtons.forEach((button) => {
          button.removeAttribute('aria-disabled');
        });
      }
      this.isLoading = isLoading;
    }
  
    async loadDataCollection(index) {
      const tabIndexKey = `tabIndex-${index}`;

      if (this.cachedData[tabIndexKey]) {
        this.collectionsWrapperEl.innerHTML = this.cachedData[tabIndexKey];
        this.currentTab = index;
      } else {
        this.selectCollectionButtonsLoading(true, index);
        let url = `${window.location.pathname}?section_id=${this.sectionId}&page=${index}`;
    
        try {
          const response = await fetch(url);
          const responseText = await response.text();
          const html = (new DOMParser()).parseFromString(responseText, 'text/html');
          const newContent = html.getElementById(`Collections--${this.sectionId}`);
          if (newContent) {
            this.collectionsWrapperEl.innerHTML = newContent.innerHTML;
            this.anmRevealItems = newContent.querySelectorAll('.anm-reveal-item');
            this.anmRevealItems.forEach((item) => {
              item.classList.remove('anm-reveal-item');
            });
            this.cachedData[tabIndexKey] = newContent.innerHTML;
            this.currentTab = index;
          }
        } catch (error) {
          console.error(error);
        }
        
        this.selectCollectionButtonsLoading(false, index);
      }
    }
  }
  
  if (!customElements.get("custom-collections")) {
    customElements.define("custom-collections", CustomCollections);
  }
}