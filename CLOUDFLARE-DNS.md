# Connect ghostlab.icu (Cloudflare) → GitHub Pages

GitHub Pages is already configured on this repo with custom domain **ghostlab.icu**.

You only need DNS in Cloudflare. Do this once.

## 1. Open Cloudflare DNS

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select domain **ghostlab.icu**
3. Go to **DNS** → **Records**

## 2. Add records

### Recommended (apex via CNAME flattening)

| Type  | Name | Target                              | Proxy status        | TTL  |
|-------|------|-------------------------------------|---------------------|------|
| CNAME | `@`  | `adirondackcybersecurity.github.io` | **DNS only** (grey) | Auto |
| CNAME | `www`| `adirondackcybersecurity.github.io` | **DNS only** (grey) | Auto |

> Use **DNS only** (grey cloud) until GitHub shows the domain as verified and HTTPS works.  
> Then you may optionally enable the orange cloud (proxied). SSL mode: **Full** → later **Full (strict)**.

### Alternative (apex with A records)

If Cloudflare won’t accept CNAME on `@`, use:

| Type | Name | IPv4 address        | Proxy        |
|------|------|---------------------|--------------|
| A    | `@`  | `185.199.108.153`   | DNS only     |
| A    | `@`  | `185.199.109.153`   | DNS only     |
| A    | `@`  | `185.199.110.153`   | DNS only     |
| A    | `@`  | `185.199.111.153`   | DNS only     |
| CNAME| `www`| `adirondackcybersecurity.github.io` | DNS only |

Delete any old A/AAAA/CNAME records for `@` or `www` that point elsewhere (parking, other hosts).

## 3. Confirm in GitHub

1. Open: https://github.com/AdirondackCyberSecurity/ghostlab-website/settings/pages  
2. Custom domain should read **ghostlab.icu**  
3. Wait for **DNS check** to pass (can take a few minutes to 24h)  
4. Enable **Enforce HTTPS** once available  

## 4. Verify

```bash
dig +short ghostlab.icu
# should show GitHub Pages IPs or Cloudflare if proxied

curl -sI https://ghostlab.icu | head -10
```

Expected live URLs:

- https://ghostlab.icu/
- https://ghostlab.icu/support.html  ← App Store Support URL
- https://ghostlab.icu/privacy.html  ← Privacy Policy URL

## 5. App Store Connect (after HTTPS works)

| Field | Value |
|-------|--------|
| Support URL | `https://ghostlab.icu/support.html` |
| Privacy Policy URL | `https://ghostlab.icu/privacy.html` |

## Temporary URL (works without custom DNS)

GitHub may redirect project Pages to the custom domain once CNAME is set.  
Repo: https://github.com/AdirondackCyberSecurity/ghostlab-website
