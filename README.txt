AS Games responsive landing page

Files:
- index.html: landing page
- sitemap.xml: sitemap for https://events.asgames.in/
- robots.txt: crawler rules and sitemap location

Deploy on Hostinger:
1. Open the document root for events.asgames.in in hPanel / File Manager.
2. Upload index.html, sitemap.xml and robots.txt into that same document root.
3. Ensure HTTPS/SSL is enabled.
4. Test https://events.asgames.in/, https://events.asgames.in/robots.txt and https://events.asgames.in/sitemap.xml.
5. If the actual subdomain differs, update canonical/Open Graph URLs in index.html and the URL in sitemap.xml and robots.txt.

SEO notes:
- Title, description, canonical, Open Graph, Twitter card, geo metadata and JSON-LD are included.
- This is a single-page site; sitemap currently contains the homepage only.
- Submit https://events.asgames.in/sitemap.xml in Google Search Console after deployment.

API:
GET /api/getdata should return JSON matching the API contract in index.html.
