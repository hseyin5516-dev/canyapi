import re
import os

def minify_css(css_text):
    # Remove comments
    css_text = re.sub(r'/\*.*?\*/', '', css_text, flags=re.DOTALL)
    # Remove space around symbols
    css_text = re.sub(r'\s*([\{\}\:\;\,])\s*', r'\1', css_text)
    # Remove extra semicolons
    css_text = re.sub(r';+}', '}', css_text)
    # Remove excess whitespace
    css_text = re.sub(r'\s+', ' ', css_text).strip()
    return css_text

def minify_js(js_text):
    lines = []
    in_block_comment = False
    for line in js_text.splitlines():
        stripped = line.strip()
        if in_block_comment:
            if '*/' in line:
                in_block_comment = False
            continue
        if stripped.startswith('/*') and not ('`' in line or "'" in line or '"' in line):
            if '*/' not in line:
                in_block_comment = True
            continue
        if stripped.startswith('//'):
            continue
        lines.append(line)
    text = '\n'.join(lines)
    # Compact excessive empty lines
    text = re.sub(r'\n\s*\n', '\n', text)
    return text.strip()

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # CSS
    css_in = os.path.join(base_dir, 'css', 'style.css')
    css_out = os.path.join(base_dir, 'css', 'style.min.css')
    with open(css_in, 'r', encoding='utf-8') as f:
        raw_css = f.read()
    min_css = minify_css(raw_css)
    with open(css_out, 'w', encoding='utf-8') as f:
        f.write(min_css)
    print(f"CSS: {len(raw_css)} -> {len(min_css)} bytes")

    # JS Files
    js_files = ['main.js', 'cms-client.js', 'analytics.js', 'admin.js']
    for js_name in js_files:
        js_in = os.path.join(base_dir, 'js', js_name)
        min_name = js_name.replace('.js', '.min.js')
        js_out = os.path.join(base_dir, 'js', min_name)
        if os.path.exists(js_in):
            with open(js_in, 'r', encoding='utf-8') as f:
                raw_js = f.read()
            min_js = minify_js(raw_js)
            with open(js_out, 'w', encoding='utf-8') as f:
                f.write(min_js)
            print(f"JS ({js_name}): {len(raw_js)} -> {len(min_js)} bytes")
