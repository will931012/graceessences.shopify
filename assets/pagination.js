if (!window.Maximize.loadedScript.includes('pagination.js')) {
  window.Maximize.loadedScript.push('pagination.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xPagination", (sectionId) => ({
        loading: false,
        loadData(url) {
          this.loading = true
          fetch(url)
          .then(response => response.text())
          .then(response => {
            const parser = new DOMParser();
            const html = parser.parseFromString(response,'text/html');
            const productGrid = html.getElementById('ItemsGrid');
            const newProducts = productGrid.getElementsByClassName('grid-item');
            let productsOnPage = document.getElementById("ItemsGrid");
            let blogGrid = document.getElementById("blog-grid");
            if (blogGrid) { productsOnPage = blogGrid }
            for (let i = 0; i < newProducts.length; i++) {
              // setTimeout(() => {
              //   productsOnPage.insertAdjacentHTML('beforeend', newProducts[i].innerHTML);
              // }, i*300);
              productsOnPage.insertAdjacentHTML('beforeend', newProducts[i].innerHTML);
            }
            if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger();
            this._renderButton(html);
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            this.loading = false;
          })
        } ,
        _renderButton(html) {
          const destination = document.getElementById('btn-pagination-' + sectionId);
          const source = html.getElementById('btn-pagination-' + sectionId);
          if (destination && source) {
            destination.innerHTML = source.innerHTML;
          }
        }
      }));
    });
  });
}
