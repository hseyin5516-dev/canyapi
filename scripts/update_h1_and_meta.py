import os

index_file = "index.html"
with open(index_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. H1 Update
old_h1_block = """        <!-- Orijinal Afişteki 3 Katmanlı Altın Rozet -->
        <div class="hero-poster-badge">
          <div class="poster-pill-top">ANTALYA</div>
          <div class="poster-plate-gold">
            <h1>ANAHTAR TESLİM</h1>
          </div>
          <div class="poster-pill-sub">TADİLAT &amp; <span>İNŞAAT</span></div>
        </div>"""

new_h1_block = """        <!-- Orijinal Afişteki 3 Katmanlı Altın Rozet (Google & SEO için Bütüncül H1) -->
        <h1 class="hero-poster-badge">
          <span class="poster-pill-top">ANTALYA</span>
          <span class="poster-plate-gold">
            <span class="poster-gold-title">ANAHTAR TESLİM</span>
          </span>
          <span class="poster-pill-sub">TADİLAT &amp; <span>İNŞAAT</span></span>
        </h1>"""

# 2. Meta description in index.html (161 chars -> 152 chars)
old_meta = '<meta name="description" content="Antalya\'da anahtar teslim ev tadilatı, modern mutfak & lüks banyo yenileme, çatı izolasyonu ve prefabrik villa yapımı. 15+ yıllık tecrübeyle ücretsiz keşif alın!">'
new_meta = '<meta name="description" content="Antalya\'da anahtar teslim ev tadilatı, modern mutfak ve banyo yenileme, çatı izolasyonu ve prefabrik konut. 15+ yıllık tecrübeyle ücretsiz keşif alın!">'

content_norm = content.replace("\r\n", "\n")
old_h1_norm = old_h1_block.replace("\r\n", "\n")
new_h1_norm = new_h1_block.replace("\r\n", "\n")

if old_h1_norm in content_norm:
    content_norm = content_norm.replace(old_h1_norm, new_h1_norm)
    print("H1 replaced successfully!")
else:
    print("WARNING: old_h1_norm not found!")

if old_meta in content_norm:
    content_norm = content_norm.replace(old_meta, new_meta)
    print("Meta description replaced successfully!")
else:
    print("WARNING: old_meta not found!")

with open(index_file, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(content_norm)

print("Updated index.html!")
