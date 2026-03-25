if (!window.Maximize.loadedScript.includes("product-picker.js")) {
  window.Maximize.loadedScript.push("product-picker.js");

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
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
    });
  });
}
