(function() {
  if( !("querySelectorAll" in document) || !("from" in Array) || !("open" in document.createElement("details")) ) {
    return;
  }

  // This is a var, `let` caused an error in Safari 13
  var attr = {
    forceState: "data-force-state-closed",
    closeEsc: "data-close-esc",
    closeClickOutside: "data-close-click-outside",
  };

	function animateClose(detail) {
		let summary = detail.querySelector(":scope > summary");
		if(summary) {
			let clickEvent = new MouseEvent("click", {
				view: window,
				bubbles: true,
				cancelable: true
			});
			summary.dispatchEvent(clickEvent);
		}
	}

  function forceState(detail, isOpen) {
    // We don’t want the summary to be focusable at larger breakpoints
    // Trying to prevent toggle as it should be always visible. Works in tandem with pointer-events: none
    let summary = detail.querySelector(":scope > summary");
    if(summary) {
      if(isOpen) {
        summary.setAttribute("tabindex", -1);
      } else {
        if(summary) summary.removeAttribute("tabindex");
      }
    }

    if( isOpen ) {
      detail.setAttribute("open", "open");
    } else {
			detail.removeAttribute("open");
    }
  }

  function getMatchMedia(detail) {
    if(!detail) return;

    let forceClosed = detail.getAttribute(attr.forceState);
    if(forceClosed && "matchMedia" in window) {
      return window.matchMedia(forceClosed);
    }
  }

  function hasParent(target, parent) {
    while(target && target.parentNode) {
      if(target.parentNode === parent) {
        return true;
      }
      target = target.parentNode;
    }
    return false;
  }

  let details = Array.from(document.querySelectorAll("details[data-force-state]"));
  for(let detail of details) {
    let mm = getMatchMedia(detail);

    if( mm ) {
      forceState(detail, !mm.matches);
      // Force stated based on details-force-state-closed attribute value in a media query listener
      mm.addListener(function(e) {
        forceState(detail, !e.matches);
      });
    }
  }

  // Close with ESC
  document.documentElement.addEventListener("keydown", event => {
    let details = Array.from(document.querySelectorAll(`details[${attr.closeEsc}]`));
    for(let detail of details) {
      if (event.keyCode === 27 && detail.open) {
        let mm = getMatchMedia(detail);
        let mediaQuery = detail.getAttribute(attr.closeEsc);
        if(!mm) {
          forceState(detail, false);
        } else if(mediaQuery) {
          forceState(detail, !mm.matches);
        }
      }
    }
  }, false);

  // Click outside to close
  document.documentElement.addEventListener("mousedown", event => {
    let details = Array.from(document.querySelectorAll(`details[${attr.closeClickOutside}]`));
    for(let detail of details) {
      let mediaQuery = detail.getAttribute("data-close-click-outside");
      if(mediaQuery) {
        let mm = getMatchMedia(detail, mediaQuery);
        if(mm && !mm.matches) {
          continue;
        }
      }

      let isCurtainElement = event.target.hasAttribute("data-close-click-outside-curtain");
      if((isCurtainElement || !hasParent(event.target, detail)) && detail.open) {
				if(detail.hasAttribute("data-details-animate")) {
					animateClose(detail);
				}
      }
    }
  }, false);
})();
