import glob
import re

files = glob.glob("*.html")
VERSION = "20261023b"

for f in files:
    with open(f, "r", encoding="utf-8") as fp:
        c = fp.read()

    orig = c

    # Replace script tags with defer and .min.js?v=...
    c = re.sub(r'<script[^>]*src=["\']js/analytics(?:\.min)?\.js(?:\?[^"\']*)?["\'][^>]*></script>', f'<script defer src="js/analytics.min.js?v={VERSION}"></script>', c)
    c = re.sub(r'<script[^>]*src=["\']js/cms-client(?:\.min)?\.js(?:\?[^"\']*)?["\'][^>]*></script>', f'<script defer src="js/cms-client.min.js?v={VERSION}"></script>', c)
    c = re.sub(r'<script[^>]*src=["\']js/main(?:\.min)?\.js(?:\?[^"\']*)?["\'][^>]*></script>', f'<script defer src="js/main.min.js?v={VERSION}"></script>', c)
    if f == "admin.html":
        c = re.sub(r'<script[^>]*src=["\']js/admin(?:\.min)?\.js(?:\?[^"\']*)?["\'][^>]*></script>', f'<script defer src="js/admin.min.js?v={VERSION}"></script>', c)

    if c != orig:
        with open(f, "w", encoding="utf-8", newline="\r\n") as fp:
            fp.write(c)
        print(f"Updated script tags in: {f}")

print("All HTML files processed with new cache buster!")
