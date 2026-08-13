export default {
  async fetch(request) {
    const url = new URL(request.url);
    const srcBase =
      "https://raw.githubusercontent.com/AdirondackCyberSecurity/ghostlab-website/main";
    const path = url.pathname;

    async function passthrough(file, contentType) {
      const upstream = await fetch(srcBase + "/" + file, {
        headers: { "user-agent": "ghostlab-sitemap-worker" },
      });
      if (!upstream.ok) {
        return new Response("upstream " + upstream.status, { status: 502 });
      }
      return new Response(await upstream.text(), {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=300",
        },
      });
    }

    if (path === "/" || path === "/sitemap.xml") {
      return passthrough("sitemap.xml", "application/xml; charset=utf-8");
    }
    if (path === "/sitemap.txt") {
      return passthrough("sitemap.txt", "text/plain; charset=utf-8");
    }
    return new Response("Not found", { status: 404 });
  },
};
