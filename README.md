# PSantos Construction website

Static one-page site (HTML + CSS + vanilla JS). No build step. Host: Hostinger (`public_html`).

## Structure
```
/
|-- index.html              home (one page)
|-- thanks.html             form success page (noindex)
|-- privacy-policy.html     legal
|-- terms.html              legal
|-- 404.html                not found (noindex)
|-- robots.txt  sitemap.xml  llms.txt  site.webmanifest
|-- favicon.ico  favicon.png  apple-touch-icon.png  icon-192.png  icon-512.png
|-- .htaccess               HTTPS + non-www redirect, clean URLs, cache, security headers
|-- .well-known/security.txt
`-- assets/
    |-- css/style.css
    |-- js/main.js
    |-- video/              client videos (original quality)
    `-- img/
        |-- brand/          logos, emblem, Open Graph image
        |-- hero/           hero slideshow (800 / 1200 / 1600 px WebP)
        |-- services/       service card photos
        |-- projects/       gallery + section photos
        `-- ui/             icon sprite, stone band, video posters
```

## Conventions
- Images are WebP in three widths (`-800`, `-1200`, none = 1600). Keep descriptive file names and alt text.
- Copy comes from the client document and is not rewritten; only decorative labels are ours.
- Bump `?v=` on `style.css` / `main.js` after changing them.

## Form
- `#form01` posts to Web3Forms and redirects to `/thanks`.
- Spam guard: honeypot field + max 10 submissions per browser per rolling 24 h (client side). Server-side limits are set in the Web3Forms account.

## SEO
See `SEO.md` for the title / description / focus keyword of every page.

## Deploy
Upload the contents of this folder (it is already named `public_html`) (include the hidden `.htaccess` and `.well-known`).
