import glob
import re

LINK_MAP = [
    (r'href=["\']index\.html(["\'])', r'href="/\1'),
    (r'href=["\']index\.html#(.*?)["\']', r'href="/#\1"'),
    (r'href=["\']hakkimizda\.html(["\'])', r'href="hakkimizda\1'),
    (r'href=["\']hizmetler\.html(["\'])', r'href="hizmetler\1'),
    (r'href=["\']hizmet-tadilat\.html(["\'])', r'href="hizmet-tadilat\1'),
    (r'href=["\']hizmet-mutfak\.html(["\'])', r'href="hizmet-mutfak\1'),
    (r'href=["\']hizmet-banyo\.html(["\'])', r'href="hizmet-banyo\1'),
    (r'href=["\']hizmet-seramik-fayans\.html(["\'])', r'href="hizmet-seramik-fayans\1'),
    (r'href=["\']hizmet-boya\.html(["\'])', r'href="hizmet-boya\1'),
    (r'href=["\']hizmet-mantolama\.html(["\'])', r'href="hizmet-mantolama\1'),
    (r'href=["\']hizmet-cati\.html(["\'])', r'href="hizmet-cati\1'),
    (r'href=["\']hizmet-prefabrik\.html(["\'])', r'href="hizmet-prefabrik\1'),
    (r'href=["\']projeler\.html(["\'])', r'href="projeler\1'),
    (r'href=["\']blog\.html(["\'])', r'href="blog\1'),
    (r'href=["\']blog-detay\.html\?slug=(.*?)["\']', r'href="blog-detay?slug=\1"'),
    (r'href=["\']blog-detay\.html(["\'])', r'href="blog-detay\1'),
    (r'href=["\']ucretsiz-kesif\.html(["\'])', r'href="ucretsiz-kesif\1'),
    (r'href=["\']iletisim\.html(["\'])', r'href="iletisim\1'),
    # Minified assets replacement
    (r'href=["\']css/style\.css(["\'])', r'href="css/style.min.css\1'),
    (r'src=["\']js/main\.js(["\'])', r'src="js/main.min.js\1'),
]

files = glob.glob("*.html")
total_changes = 0

for f in files:
    with open(f, "r", encoding="utf-8") as fp:
        c = fp.read()

    orig = c
    for pattern, repl in LINK_MAP:
        c = re.sub(pattern, repl, c)

    if c != orig:
        with open(f, "w", encoding="utf-8", newline="\r\n") as fp:
            fp.write(c)
        total_changes += 1
        print(f"Updated links & assets in: {f}")

print(f"Total files updated: {total_changes}")
