import glob
import re
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
html_files = glob.glob(os.path.join(base_dir, '*.html'))

font_pattern = re.compile(
    r'<link\s+href=[\"\'](https://fonts\.googleapis\.com/css2\?[^\"\']+)[\"\']\s+rel=[\"\']stylesheet[\"\']>',
    re.I
)

for fpath in html_files:
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8') as fp:
        c = fp.read()

    orig = c

    # 1. Google Fonts Non-blocking
    def font_repl(match):
        url = match.group(1)
        return (
            f'<link rel="preload" as="style" href="{url}">\n'
            f'  <link rel="stylesheet" href="{url}" media="print" onload="this.media=\'all\'">\n'
            f'  <noscript><link rel="stylesheet" href="{url}"></noscript>'
        )

    c = font_pattern.sub(font_repl, c)

    # 2. Add explicit width/height to brand logos
    c = re.sub(
        r'(<img[^>]*?class=[\"\'][^\"\']*?brand-logo[^\"\']*?[\"\'][^>]*?)>',
        lambda m: m.group(1) + ' width="200" height="52">' if 'width=' not in m.group(1) else m.group(0),
        c
    )

    # 3. Add explicit width/height to hero background in index.html
    if fname == 'index.html':
        c = re.sub(
            r'(<img[^>]*?hero-banner-bg-img[^>]*?)>',
            lambda m: m.group(1) + ' width="1600" height="900">' if 'width=' not in m.group(1) else m.group(0),
            c
        )

    # 4. Add aria-label to select elements without aria-label
    def fix_select(m):
        tag = m.group(0)
        if 'aria-label' in tag:
            return tag
        name_m = re.search(r'name=[\"\'](.*?)[\"\']', tag)
        label_text = "Seçim Yapın"
        if name_m:
            name_val = name_m.group(1).lower()
            if 'service' in name_val:
                label_text = "Hizmet Seçimi"
            elif 'location' in name_val:
                label_text = "Antalya İlçe Seçimi"
        return tag[:-1] + f' aria-label="{label_text}">'

    c = re.sub(r'<select\s+[^>]+>', fix_select, c)

    # 5. Add aria-label to file upload input
    c = re.sub(
        r'(<input\s+type=[\"\']file[\"\'][^>]*?)>',
        lambda m: m.group(1) + ' aria-label="Fotoğraf veya dosya seçin">' if 'aria-label' not in m.group(1) else m.group(0),
        c
    )

    if c != orig:
        with open(fpath, 'w', encoding='utf-8', newline='\r\n') as fp:
            fp.write(c)
        print(f"Applied mobile speed fixes in {fname}")

print("Mobile speed and accessibility fixes applied across all HTML files!")
