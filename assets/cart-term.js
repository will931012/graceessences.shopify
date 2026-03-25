if (!window.Maximize.loadedScript.includes('cart-term.js')) {
  window.Maximize.loadedScript.push('cart-term.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xCartTerm', (message) => ({
        message: message,
        isChecked: false,
        init() {
          this.isChecked = localStorage.cart_term_checked === 'agreed';

          this.$watch('isChecked', () => {
            this.save();
          });

          document.addEventListener(`${CART_EVENT.validate}`, () => {
            this.isChecked = localStorage.cart_term_checked == 'agreed' ? true : false;
            if (!this.isChecked) Alpine.store('xCartHelper').validated = false;
          });
        },
        handleChangeCartTerm(event) {
          this.isChecked = event.target.checked;
        },
        save() {
          clearTimeout(this.t);

          const func = () => {
            let status = this.isChecked ? 'agreed' : 'not agreed';
            Alpine.store('xCartHelper').updateCart({
              attributes: {
                'Terms and conditions': status
              }
            });
            localStorage.cart_term_checked = status;
          }
          
          this.t = setTimeout(() => {
            func();
          }, 200);
        }
      }));
    })
  });
};
