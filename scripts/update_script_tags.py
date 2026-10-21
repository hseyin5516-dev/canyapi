import glob
import re

files = glob.glob("*.html")

for f in files:
    with open(f, "r", encoding="utf-8") as fp:
        c = fp.read()

    orig = c

    # Replace script tags with defer and .min.js
    c = re.sub(r'<script\s+src=["\']js/analytics(?:\.min)?\.js["\']\s*></script>', '<script defer src="js/analytics.min.js"></script>', c)
    c = re.sub(r'<script\s+src=["\']js/cms-client(?:\.min)?\.js["\']\s*></script>', '<script defer src="js/cms-client.min.js"></script>', c)
    c = re.sub(r'<script\s+src=["\']js/main(?:\.min)?\.js["\']\s*></script>', '<script defer src="js/main.min.js"></script>', c)
    if f == "admin.html":
        c = re.sub(r'<script\s+src=["\']js/admin(?:\.min)?\.js["\']\s*></script>', '<script defer src="js/admin.min.js"></script>', c)

    if c != orig:
        with open(f, "w", encoding="utf-8", newline="\r\n") as fp:
            fp.write(c)
        print(f"Updated script tags in: {f}")

print("All HTML files processed for script defer & minification!")
