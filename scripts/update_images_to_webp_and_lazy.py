import glob
import re
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

html_files = glob.glob(os.path.join(base_dir, '*.html'))

for fpath in html_files:
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8') as fp:
        c = fp.read()

    orig = c

    # Replace .jpg/.png in images/ with .webp (excluding favicon)
    def repl_img(match):
        full = match.group(0)
        if 'favicon' in full.lower():
            return full
        return re.sub(r'\.(?:jpg|jpeg|png)(["\'])', r'.webp\1', full, flags=re.I)

    c = re.sub(r'src=["\']images/[^"\']+?\.(?:jpg|jpeg|png)["\']', repl_img, c, flags=re.I)
    c = re.sub(r'href=["\']images/[^"\']+?\.(?:jpg|jpeg|png)["\']', repl_img, c, flags=re.I)
    c = re.sub(r'content=["\'][^"\']*?images/[^"\']+?\.(?:jpg|jpeg|png)["\']', repl_img, c, flags=re.I)

    # In index.html, optimize hero image
    if fname == 'index.html':
        if 'hero-bg-clean.webp' not in c[:1500]:
            preload_tag = '  <link rel="preload" as="image" href="images/hero-bg-clean.webp" fetchpriority="high">\n'
            c = c.replace('</head>', preload_tag + '</head>', 1)
        
        c = re.sub(
            r'(<img\s+src=["\']images/hero-bg-clean\.webp["\'][^>]*?)>',
            r'\1 fetchpriority="high" decoding="async">',
            c
        )

    # Add loading="lazy" and decoding="async" to images without loading attribute
    def add_lazy(match):
        img_tag = match.group(0)
        if 'hero-bg-clean' in img_tag or 'logo' in img_tag:
            if 'decoding=' not in img_tag:
                img_tag = img_tag[:-1] + ' decoding="async">'
            return img_tag
        
        if 'loading=' not in img_tag:
            img_tag = img_tag[:-1] + ' loading="lazy"' + '>'
        if 'decoding=' not in img_tag:
            img_tag = img_tag[:-1] + ' decoding="async"' + '>'
        return img_tag

    c = re.sub(r'<img\s+[^>]+>', add_lazy, c)

    if c != orig:
        with open(fpath, 'w', encoding='utf-8', newline='\r\n') as fp:
            fp.write(c)
        print(f"Updated images in {fname}")

# 2. Update CSS files
css_path = os.path.join(base_dir, 'css', 'style.css')
with open(css_path, 'r', encoding='utf-8') as fp:
    css_content = fp.read()
css_orig = css_content
css_content = css_content.replace('hero-bg-clean.jpg', 'hero-bg-clean.webp')
css_content = css_content.replace('hero-bottom-strip-original.jpg', 'hero-bottom-strip-original.webp')
if css_content != css_orig:
    with open(css_path, 'w', encoding='utf-8', newline='\r\n') as fp:
        fp.write(css_content)
    print("Updated CSS image references")

# 3. Update Data JSON files
json_files = glob.glob(os.path.join(base_dir, 'data', '*.json'))
for jpath in json_files:
    with open(jpath, 'r', encoding='utf-8') as fp:
        jc = fp.read()
    jorig = jc
    jc = re.sub(r'\.(jpg|jpeg|png)', '.webp', jc, flags=re.I)
    if jc != jorig:
        with open(jpath, 'w', encoding='utf-8', newline='\r\n') as fp:
            fp.write(jc)
        print(f"Updated data file {os.path.basename(jpath)}")

print("All references updated to WebP and lazy loading applied!")
