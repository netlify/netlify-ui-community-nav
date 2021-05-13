# @netlify/community-nav

A web component for shared navigation on Community, Forums, Answers, Podcasts, Swag, and others.

* [**Demo**](https://netlify-ui-community-nav.netlify.app/demo.html)
* [Figma Designs](https://www.figma.com/file/D7YIl02a4P2W0LKur2Nxbw/Community-2.0---navigation?node-id=112%3A5&viewport=-849%2C-3011%2C1)

## Usage

1. Add `nav.js` and `nav.css` to your site’s bundler.
2. Copy markup for the property (find the `<netlify-ui-community-nav>` in `demo.html`) and add to the top of the page (update the “Customize” sections)

The reason we embed markup inline inside of the web component here is for both progressive enhancement and performance reasons. The hamburger icon is also embedded inline to animate the transition when opened.

3. (Optional, performance) Add to `<head>`: `<link rel="preconnect" href="https://netlify-ui-community-nav.netlify.app/">`
4. (Optional, performance) Add to `<head>`: `<script>document.documentElement.classList.add("ncn-ctm");</script>`

## Release

1. Update `version` in package.json
2. Update Version comment in `nav.js`, `nav.css`
3. Update `version` HTML attribute in `demo.html`
4. Commit, tag, push.