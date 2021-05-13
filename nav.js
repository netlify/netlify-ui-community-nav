/* Netlify Community Nav, v1.0 */

function getMatchMedia(el, mq) {
	if(!el) return;

	// when the attribute value is empty, React casts to "true" string
	if(mq && mq !== "true" && "matchMedia" in window) {
		return window.matchMedia(mq);
	}
}

class ForceState {
	constructor(detail) {
		this.attr = {
			forceStateClosed: "data-force-state-closed",
			closeEsc: "data-close-esc",
			closeClickOutside: "data-close-click-outside",
			closeClickOutsideCurtain: "data-close-click-outside-curtain",
			modal: "data-modal",
		};

		this.detail = detail;
		this.summary = detail.querySelector(":scope > summary");
	}

	init() {
		let mm = getMatchMedia(this.detail, this.detail.getAttribute(this.attr.forceStateClosed));

		if( mm ) {
			this.setState(!mm.matches);

			// Force stated based on details-force-state-closed attribute value in a media query listener
			mm.addListener(e => {
				this.setState(!e.matches);
			});
		}

		// modal
		let modalMm = this.getModalMediaQuery();
		if(modalMm) {
			modalMm.addListener(e => {
				if(this.detail.open) {
					this.setModal(e.matches);
				}
			});
		}

		this.summary.addEventListener("click", e => {
			if(modalMm && modalMm.matches) {
				// TODO does this value work without animate too?
				this.setModal(!this.detail.open);
			}
		});
	}

	isCloseOnEsc() {
		return this.detail.hasAttribute(this.attr.closeEsc);
	}

	getCloseOnEscMatchMedia() {
		return getMatchMedia(this.detail, this.detail.getAttribute(this.attr.closeEsc));
	}

	getClickoutToCloseMatchMedia() {
		return getMatchMedia(this.detail, this.detail.getAttribute(this.attr.closeClickOutside));
	}

	triggerClickToClose() {
		if(this.summary) {
			let clickEvent = new MouseEvent("click", {
				view: window,
				bubbles: true,
				cancelable: true
			});
			this.summary.dispatchEvent(clickEvent);
		}
	}

	getModalMediaQuery() {
		return getMatchMedia(this.detail, this.detail.getAttribute(this.attr.modal));
	}

	setModal(isOpen) {
		if(isOpen) {
			document.documentElement.style.overflow = "hidden";
		} else {
			document.documentElement.style.overflow = "";
		}
	}

	setState(setOpen) {
		// We don’t want the summary to be focusable at larger breakpoints
		// Trying to prevent toggle as it should be always visible. Works in tandem with pointer-events: none
		if(this.summary) {
			if(setOpen) {
				this.summary.setAttribute("tabindex", -1);
			} else {
				this.summary.removeAttribute("tabindex");
			}
		}

		if( setOpen ) {
			this.detail.setAttribute("open", "open");
		} else {
			this.detail.removeAttribute("open");
		}
	}
}

class AnimateDetails {
	constructor(detail) {
		this.duration = {
			open: 200,
			close: 150
		};
		this.detail = detail;
		this.summary = this.detail.querySelector(":scope > summary");

		let contentTarget = this.detail.getAttribute("data-details-animate-target");
		if(contentTarget) {
			this.content = this.detail.closest(contentTarget);
		}

		if(!this.content) {
			this.content = this.summary.nextElementSibling;
		}

		this.summary.addEventListener("click", this.onclick.bind(this));
	}

	parseAnimationFrames(property, ...frames) {
		let keyframes = [];
		for(let frame of frames) {
			let obj = {};
			obj[property] = frame;
			keyframes.push(obj);
		}
		return keyframes;
	}

	getKeyframes(open) {
		let frames = this.parseAnimationFrames("maxHeight", "0px", `${this.getContentHeight()}px`);
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
		if(this.contentHeight) {
			this.animate(true, this.duration.open);
		} else {
			// must wait a frame if we haven’t cached the contentHeight
			requestAnimationFrame(() => this.animate(true, this.duration.open));
		}
	}

	close() {
		this.animate(false, this.duration.close);
	}

	useAnimation() {
		return "matchMedia" in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// happens before state change when toggling
	onclick(event) {
		// do nothing if the click is inside of a link
		if(event.target.closest("a[href]") || !this.useAnimation()) {
			return;
		}

		if(this.isPending) {
			if(this.animation) {
				this.animation.cancel();
			}
		} else if(this.detail.open) {
			// cancel the click because we want to wait to remove [open] until after the animation
			event.preventDefault();
			this.close();
		} else {
			this.open();
		}
	}
}


// Nest usage of `HTMLElement` global inside of this check (compat with Gatsby SSR)
if(typeof window !== "undefined" && ("customElements" in window)) {

	class CommunityNav extends HTMLElement {
		constructor() {
			super();
			this._connect();
		}

		connectedCallback() {
			this._connect();
		}

		_connect() {
			if (this.children.length) {
				this._init();
				return;
			}

			// not yet available, watch it for init
			this._observer = new MutationObserver(this._init.bind(this));
			this._observer.observe(this, { childList: true });
		}

		_init() {
			if(this.initialized) {
				return;
			}
			this.initialized = true;

			let details = Array.from(this.querySelectorAll(`:scope details`));
			for(let detail of details) {
				// override initial state based on viewport (if needed)
				let fs = new ForceState(detail);
				fs.init();

				// animate the menus
				new AnimateDetails(detail);
			}

			this.bindCloseOnEsc(details);
			this.bindClickoutToClose(details);
		}

		bindCloseOnEsc(details) {
			document.documentElement.addEventListener("keydown", event => {
				for(let detail of details) {
					let fs = new ForceState(detail);
					if (fs.isCloseOnEsc() && event.keyCode === 27 && detail.open) {
						let mm = fs.getCloseOnEscMatchMedia();
						if(!mm) {
							fs.setState(false);
						} else if(mm) {
							fs.setState(!mm.matches);
						}
					}
				}
			}, false);
		}

		isChildOfParent(target, parent) {
			while(target && target.parentNode) {
				if(target.parentNode === parent) {
					return true;
				}
				target = target.parentNode;
			}
			return false;
		}

		bindClickoutToClose(details) {
			document.documentElement.addEventListener("mousedown", event => {
				for(let detail of details) {
					let fs = new ForceState(detail);
					let mm = fs.getClickoutToCloseMatchMedia();
					if(mm && !mm.matches) {
						// don’t close if has a media query but it doesn’t match current viewport size
						// useful for viewport navigation that must stay open (e.g. list of horizontal links)
						continue;
					}

					let isCurtainElement = event.target.hasAttribute(fs.attr.closeClickOutsideCurtain);
					if((isCurtainElement || !this.isChildOfParent(event.target, detail)) && detail.open) {
						fs.triggerClickToClose(detail);
					}
				}
			}, false);
		}
	}

	// Better if this is in <head>
	document.documentElement.classList.add("ncn-ctm");

	window.customElements.define("netlify-ui-community-nav", CommunityNav);
}
