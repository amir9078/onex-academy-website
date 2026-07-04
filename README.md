# OneX Academy — Website

Static marketing site for OneX Academy (Dubai) — AI-integrated career training in real estate, hospitality and professional AI skills. Accreditation by Vocatech (KHDA-approved).

- Plain HTML/CSS/vanilla JS, no build step.
- Branding (logo, palette, Montserrat, stats, partner logos) sourced from [onexacademy.com](https://onexacademy.com/).
- Served via GitHub Pages; works at domain root or under a `/repo/` base path (handled in `script.js`).

## Structure

```
index.html                        Homepage
<page-slug>/index.html            One folder per page (clean URLs)
partials/header.html, footer.html Shared chrome, injected by script.js
style.css                         Design system
script.js                         Nav, FAQ, counters, reveals, base-path handling
```

## Local preview

```
python -m http.server 5500
```

Then open http://localhost:5500/.
