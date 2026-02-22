# Upstate AI - Website

Professional static website for Upstate AI, an AI consulting business serving small to mid-sized businesses in upstate New York.

## About

**Upstate AI** provides expert AI strategy consulting, helping businesses navigate the complex landscape of artificial intelligence adoption. Based in upstate NY (2-hour radius of Syracuse), also available remotely.

### Services

1. **AI Workshop** - Educational seminars for executives & business leaders
2. **Readiness Assessment** - Business analysis for AI roadmap development
3. **Proof of Concept** - Hands-on AI implementation pilot

## Technology Stack

- **Pure HTML/CSS** - No frameworks, no build process
- **GitHub Pages Ready** - Static hosting optimized
- **SEO Optimized** - Meta tags, Open Graph, structured data
- **Mobile Responsive** - Works beautifully on all devices

## Deployment

This site is designed for GitHub Pages deployment:

1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to main branch / root
4. Custom domain is configured via CNAME file (`up-state-ai.com`)

### Custom Domain Setup

The CNAME file is already configured. In your domain registrar:

1. Add a CNAME record pointing `www` to `[your-github-username].github.io`
2. Add A records for apex domain pointing to GitHub Pages IPs:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

## Structure

```
upstate-ai-site/
├── index.html          # Main landing page
├── css/
│   └── style.css       # All styles
├── images/             # Brand and visual assets
│   ├── logo.png        # Upstate AI logo (navbar & footer)
│   ├── headshot.jpeg   # Ben's professional headshot
│   ├── syracuse.webp   # Syracuse campus photo (hero background)
│   └── ny-map.png      # NY state map (about section)
├── blog/               # Future blog posts directory
├── CNAME               # Custom domain configuration
└── README.md           # This file
```

## SEO Keywords

The site is optimized for:
- AI consulting Syracuse
- AI strategy upstate NY
- AI for small business New York
- AI consultant Syracuse NY
- Business AI consulting
- AI implementation upstate New York

## Design Philosophy

Premium consulting firm aesthetic:
- Dark navy/slate color palette with gold accents
- Professional but approachable tone
- Clean, modern layout
- Strong CTAs for discovery calls
- Credibility-focused about section

## Future Enhancements

Planned additions:
- Contact form integration
- Active blog with CMS or static generation
- Case studies section
- Client testimonials
- Calendly/booking system integration

## Maintenance

This is a static site - no dependencies to update. Simply edit HTML/CSS files directly and push changes to deploy.

## License

© 2025 Upstate AI. All rights reserved.
