/*
  A plugin to animate <details> opening and closing

  Features:
  * Unobtrusive (works without animation when JS is disabled)
  * Snap to final position when interrupted during animation
  * Uses native toggle behavior when `open` (only close is bypassed for animation)
  * Doesn’t wait for next frame to animate when content height is already cached

  Note: *Lots* of inspiration from https://css-tricks.com/how-to-animate-the-details-element-using-waapi/
*/

;(function() {
  if( !("querySelectorAll" in document) || !("from" in Array) || !("animate" in document.documentElement) ) {
    return;
  }

  class Details {
    constructor(detail) {
      this.detail = detail;
      this.summary = this.detail.querySelector(":scope > summary");

      this.contentSelector = this.detail.getAttribute("data-details-animate-content") || ".details-content";
      this.animationTargetSelector = this.detail.getAttribute("data-details-animate-target");

      if(this.animationTargetSelector) {
        this.content = this.detail.closest(this.animationTargetSelector);
      }
      if(!this.animationTargetSelector || !this.content) {
        this.content = this.detail.querySelector(`:scope > ${this.contentSelector}`);
      }
			if(!this.content) {
				this.content = this.summary.nextElementSibling;
			}

      this.openDuration = 200;
      this.closeDuration = 150;

      this.animationFrames = this.detail.getAttribute("data-details-animate-frames");

      this.summary.addEventListener("click", this.onclick.bind(this));
    }

    parseAnimationFrames(f) {
      let keyframes = [];
      if(f) {
        let [property, ...frames] = f.split("/");
        for(let frame of frames) {
          let obj = {};
          obj[property] = frame;
          keyframes.push(obj);
        }
      }
      return keyframes;
    }

    getKeyframes(open) {
      let frames = this.parseAnimationFrames(this.animationFrames || `maxHeight/0px/${this.getContentHeight()}px`);
      if(!open) {
        return frames.filter(() => true).reverse();
      }
      return frames;
    }

    getContentHeight() {
      if(this.contentHeight) {
        return this.contentHeight;
      }

      // make sure it’s open before we measure otherwise it will be 0
      if(this.detail.open) {
        this.contentHeight = this.content.offsetHeight;
        return this.contentHeight;
      }
    }

    animate(open, duration) {
      this.isPending = true;
      let frames = this.getKeyframes(open);
      this.animation = this.content.animate(frames, {
        duration,
        easing: "ease-out"
      });
			this.detail.classList.add("details-animating")

      this.animation.finished.catch(e => {}).finally(() => {
        this.isPending = false;
				this.detail.classList.remove("details-animating");
      });

      // close() has to wait to remove the [open] attribute manually until after the animation runs
      // open() doesn’t have to wait, it needs [open] added before it animates
      if(!open) {
        this.animation.finished.catch(e => {}).finally(() => {
          this.detail.removeAttribute("open");
        });
      }
    }

    open() {
      // if we’re passing in our own animation frames, we don’t need the content height
      if(this.animationFrames || this.contentHeight) {
        this.animate(true, this.openDuration);
      } else {
        // must wait a frame if we haven’t cached the contentHeight
        requestAnimationFrame(() => this.animate(true, this.openDuration));
      }
    }

    close() {
      this.animate(false, this.closeDuration);
    }

    useAnimation() {
      return "matchMedia" in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // happens before state change when toggling
    onclick(event) {
      // do nothing if the click is inside of a link
      if(event.target.closest("a[href]") || !this.useAnimation()) {
        return;
      } else if(this.isPending) {
        if(this.animation) {
          this.animation.cancel();
        }
      } else {
        if(this.detail.open) {
          // cancel the click because we want to wait to remove [open] until after the animation
          event.preventDefault();
          this.close();
        } else {
          this.open();
        }
      }
    }

    ontoggle(event) {}
  }

  let details = document.querySelectorAll("details[data-details-animate]");
  for(let detail of Array.from(details)) {
    new Details(detail);
  }
})();
