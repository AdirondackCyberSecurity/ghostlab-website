# GhostLab marketing site

Public marketing site for **GhostLab** (iOS paranormal investigation toolkit).

**Production:** https://ghostlab.icu  
**Repo:** AdirondackCyberSecurity/ghostlab-website

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/team.html` | Team PTT |
| `/modes.html` | Capture modes (free vs Pro) |
| `/tools.html` | Tools free vs Pro + toolkit |
| `/gallery.html` | Screenshots |
| `/pro.html` | GhostLab Pro |
| `/support.html` | App Store support |
| `/privacy.html` | Privacy policy |

## Hosting

GitHub Pages serves from the `main` branch root (static HTML/CSS/JS).

Custom domain: **ghostlab.icu** (see `CNAME`).

### Cloudflare DNS (required)

In Cloudflare → **ghostlab.icu** → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|--------|
| CNAME | `@` | `adirondackcybersecurity.github.io` | DNS only (grey cloud) **or** Proxied after SSL works |
| CNAME | `www` | `adirondackcybersecurity.github.io` | Same |

If apex CNAME is not allowed in the UI, use Cloudflare **CNAME flattening** (supported on `@`) or GitHub’s A records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**SSL/TLS** (Cloudflare): start with **Full**, then **Full (strict)** once the GitHub Pages cert is issued.

**Important:** For custom domain verification, set the record to **DNS only** first so GitHub can issue the certificate; then optional orange-cloud proxy.

### Local preview

```bash
cd ghostlab-website
python3 -m http.server 8080
# open http://localhost:8080
```

## App Store Support URL

Point App Store Connect → Support URL to:

`https://ghostlab.icu/support.html`

Privacy Policy URL:

`https://ghostlab.icu/privacy.html`
