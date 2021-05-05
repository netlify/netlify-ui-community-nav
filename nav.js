class CommunityNav extends HTMLElement {
	connectedCallback() {
		// Cut the Mustard
		this.classList.add("ncn-ctm");
	}
	// TODO initialize details-force-state and details-animate
}

if("customElements" in window) {
	window.customElements.define("netlify-ui-community-nav", CommunityNav);
}
