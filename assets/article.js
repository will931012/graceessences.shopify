if (!window.Maximize.loadedScript.includes('article.js')) {
    window.Maximize.loadedScript.push('article.js');
  
    requestAnimationFrame(() => {
      document.addEventListener('alpine:init', () => {
        Alpine.data('xArticle', () => ({
          show: false,
          showInTab: false,
          init() {
            if (document.querySelector('.menu-article')) {
              const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    if (document.querySelector('.menu-article .active')) {
                      document.querySelector('.menu-article .active').classList.remove("active");
                    }
                    document.querySelectorAll('.item-menu-article')[entry.target.dataset.index].classList.add("active");
                  }
                });
              }, {rootMargin: '0px 0px -60% 0px'});
              if (this.$refs.content.querySelectorAll('h2, h3, h4').length > 1) {
                this.$refs.content.querySelectorAll('h2, h3, h4').forEach((heading, index) => {
                  heading.dataset.index = index;
                  observer.observe(heading);
                });
              } else {
                document.querySelector('.menu-article').remove();
              }
            }
          },
          loadData(list_style) {
            const load = document.querySelector('.load-curr');
            const loadBar = document.querySelector('.load-bar');
            const element = this.$refs.content;
            if (element) {
              document.addEventListener('scroll', () => {
                const elementTop = element.offsetTop;
                const elementHeight = element.offsetHeight;
                const windowHeight = window.innerHeight;
                const scrollPosition = window.scrollY + windowHeight;

                let scrollPercent;

                if (scrollPosition < elementTop) {
                  scrollPercent = 0;
                  if(loadBar) loadBar.classList.remove("active-bar")
                } else if (scrollPosition > elementTop + elementHeight) {
                  scrollPercent = 100;
                } else {
                  if(loadBar) loadBar.classList.add("active-bar")
                  scrollPercent = ((scrollPosition - elementTop) / elementHeight) * 100;
                }
                if (load) load.style.width = scrollPercent.toFixed(2) + `%`
              })
            }
            const heading2 = document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4');
            if (heading2.length > 1) {
              let htmlContent = "";
              heading2.forEach((item, index) => {
                if (item.tagName === 'H2') {
                  htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>";
                }
                if (item.tagName === 'H3') {
                  if (heading2[index-1] && heading2[index-1].tagName === 'H2') {
                    if (index !== heading2.length-1 && heading2[index+1].tagName !== 'H2') {
                      htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>" 
                      : "<ul class='toc:m-0 toc:pl-4'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    } else {
                      htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                      : "<ul class='toc:m-0 toc:pl-4'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    }
                  } else {
                    if (index !== heading2.length-1 && heading2[index+1].tagName !== 'H2') {
                      htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    } else {
                      htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    }
                  }      
                }
                if (item.tagName === 'H4') {
                  if (heading2[index-1] && heading2[index-1].tagName !== 'H4') {
                    if (index !== heading2.length-1 && heading2[index+1].tagName === 'H4') {
                      htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                      : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    } else if (index !== heading2.length-1 && heading2[index+1].tagName === 'H3') {
                      htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                      : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    } else {
                      htmlContent += list_style === 'bullet' ? "<ul class='toc:m-0 toc:pl-5'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                      : "<ul class='toc:m-0 toc:pl-6'><li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                    }
                  } else {
                    if (index !== heading2.length-1 && heading2[index+1].tagName === 'H4') {
                      htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li>"
                    } else if (index !== heading2.length-1 && heading2[index+1].tagName === 'H3') {
                      htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul>"
                    } else {
                      htmlContent += "<li class='toc:m-0 toc:mt-1.5 item-menu-article w-full cursor-pointer' tabindex='0' @keydown.enter='scrollTop($el," + index + ")' @click='scrollTop($el," + index + ")' >" + item.textContent + "</li></ul></ul>"
                    }
                  }
                }
              })
              document.querySelector('.list-menu-article').innerHTML += htmlContent;
            }
          },
          scrollTop(el,index) {
            if (document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4').length > index) {
              if (document.querySelector('.menu-article .active')) {
                document.querySelector('.menu-article .active').classList.remove("active");
              }
              el.classList.add("active");
              document.querySelector('.main-article__text .page__body').querySelectorAll('h2, h3, h4')[index].scrollIntoView({ behavior: "smooth" });
            }
          },
          setPositionSideBar() {
            let sideBarElement = document.querySelector('#side-bar-template');
            if (sideBarElement) {
              if (sideBarElement.querySelector('.side-bar__load-bar .load-bar')) {
                document.querySelector('.main-article__load-bar').appendChild(sideBarElement.querySelector('.side-bar__load-bar .load-bar'));
              }
            }
          }
        }));
      })
    });
  }