# amfutmanager — Görsel Varlık Listesi & Üretim Prompt'ları

Oyunun kullandığı/ihtiyaç duyduğu **tüm** görseller aşağıda. Her madde için: nerede kullanıldığı, hedef dosya adı/boyut, ve doğrudan bir görsel üreticiye (Midjourney, DALL·E, Ideogram, Flux vb.) **kopyala‑yapıştır** edebileceğin İngilizce prompt var.

> **Nasıl çalışacağız:** Sen bu prompt'larla görselleri üret ve bana geri ver. Ben de doğru dosya adlarıyla `public/` içine koyup kodu (logo referansı, `manifest.json` ikonları, takım logosu seçimi vb.) bağlarım.

---

## 🎨 Genel Stil Rehberi (hepsinde tutarlılık için)

- **Tema:** Modern Amerikan futbolu (NFL tarzı) menajerlik uygulaması, premium/kurumsal, koyu.
- **Renkler:** Derin lacivert `#00254c` ve gece mavisi `#001021` zemin; orta mavi `#004b93` / parlak mavi `#00a2ff`; **vurgu turuncu/amber `#ff9c00`** (altın detaylar). Beyaz `#ffffff` metin.
- **Tipografi (yazı içeren görsellerde):** Başlıklar **Oswald** benzeri sıkışık, BÜYÜK HARF, sporcu kondensed font; gövde Inter.
- **Stil hissi:** Temiz vektörel/flat + hafif degrade ve metalik parlama; "esports/sports app" rozet estetiği. Aşırı gerçekçi fotoğraf DEĞİL (arka planlar hariç).
- **Teknik:** Çoğu ikon/logo **şeffaf arka plan (PNG)**, ortalanmış, kenarlarda az boşluk. Kare oran (1:1) aksi belirtilmedikçe.
- **Her prompt'un sonuna ekle (tutarlılık + temizlik için):**
  > `flat vector style with subtle gradients, navy blue #00254c and #001021 with bright orange #ff9c00 accents, crisp clean edges, centered, transparent background, no text unless specified, high detail, professional sports app icon`
- **Negatif (destekleyen araçlarda):**
  > `no watermark, no real NFL team logos or trademarks, no real player likeness, no photographic background, not blurry, no clutter`

> ⚠️ **Telif:** Gerçek NFL takım logoları/isimleri, gerçek oyuncu yüzleri veya marka amblemleri ürettirme. Hepsi **özgün** olmalı.

---

# 1) ZORUNLU — Marka & Uygulama İkonları
Bunlar kodda referans var ama dosya **eksik** (şu an placeholder/boş).

### 1.1 Ana Logo — `public/logo.png` (ve `logo.svg`)
**Nerede:** Giriş/slot seçim ekranı (`SlotsPage`) — şu an eksik, Dicebear placeholder geliyor.
**Boyut:** 1024×1024 (şeffaf), ayrıca yatay wordmark versiyonu 1600×500.
**Prompt:**
```
App logo for "amfutmanager", an American football manager game. A bold emblem combining an American football and an upward chart/management motif inside a hexagon or shield, paired with the lowercase wordmark "amfutmanager" in a condensed uppercase sporty font. Deep navy and bright orange. Modern, premium, memorable. flat vector style with subtle gradients, navy blue #00254c and #001021 with bright orange #ff9c00 accents, crisp clean edges, centered, transparent background, professional sports app icon
```
**Ayrıca iste:** Sadece amblem (yazısız, kare) — uygulama ikonu için kullanılacak.

### 1.2 Uygulama / PWA İkonları — `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`
**Nerede:** `manifest.json` `icons` şu an **boş**; telefonda "ana ekrana ekle" ikonu yok.
**Boyut:** 192×192, 512×512, 180×180. Köşeleri dolu (maskable) bir versiyon da iyi olur.
**Prompt:**
```
App launcher icon for an American football manager game. The standalone emblem only (no wordmark): a stylized American football crossed with a coach's clipboard/strategy lines, inside a rounded square. Deep navy gradient background filling the whole tile, glowing orange accent. Bold, readable at small sizes. flat vector style, navy blue #00254c and #001021 with bright orange #ff9c00 accents, crisp clean edges, centered, professional mobile app icon, maskable safe area
```

### 1.3 Favicon — `public/favicon.svg` (mevcut, isteğe bağlı yenileme)
Yukarıdaki amblemin en sade, 32×32'de okunur hali.

---

# 2) TAKIM LOGOLARI (emoji placeholder'ların yerine)
**Nerede:** `FranchiseSetupPage` — şu an emoji: 🐻 Ayı, 🐺 Kurt, 🦅 Kartal, 🦁 Aslan, 🦅 Şahin, 🐂 Boğa, 🐍 Yılan, 🦈 Köpekbalığı. Bunları **gerçek takım amblemi** seti yapalım (botlar + kullanıcı takımları için 12 adet öneriyorum).
**Boyut:** her biri 512×512, şeffaf PNG. **Tutarlı bir set** olmalı (aynı çerçeve/stil).
**Ortak prompt iskeleti** (HAYVAN kısmını değiştir):
```
American football team crest logo, fierce stylized [ANIMAL] head mascot, aggressive sporty mascot design inside a rounded shield/circle badge with subtle football laces detail, bold geometric esports style. Deep navy and bright orange color scheme. Part of a matching set of team crests. flat vector style with subtle gradients, navy blue #00254c and #001021 with bright orange #ff9c00 accents, crisp clean edges, centered, transparent background, no text, professional sports team logo
```
**[ANIMAL] listesi (mevcut 8 + 4 ek):**
1. `bear` (Ayı) · 2. `wolf` (Kurt) · 3. `eagle` (Kartal) · 4. `lion` (Aslan) · 5. `hawk/falcon` (Şahin) · 6. `bull` (Boğa) · 7. `snake/cobra` (Yılan) · 8. `shark` (Köpekbalığı) · 9. `panther` (Panter) · 10. `ram` (Koç) · 11. `stallion/horse` (Aygır) · 12. `rhino` (Gergedan)

> İpucu: Her birini ayrı ayrı üret ama prompt'taki "part of a matching set" + aynı renk/çerçeve ifadelerini koru ki seri tutarlı olsun.

---

# 3) ARKA PLANLAR
### 3.1 Ana arka plan — `public/stadium_bg.png` (mevcut, isteğe bağlı yenileme)
**Nerede:** Tüm sayfaların gövde arka planı (`body { background-image }`).
**Boyut:** 1920×1080 (yatay), koyu — üstüne metin geleceği için düşük kontrast/karartılmış.
**Prompt:**
```
Dark moody American football stadium at night, empty stands with stadium lights flares, deep navy blue color grade, heavy dark vignette so UI text is readable on top, cinematic, subtle field markings in the distance, atmospheric haze. Photographic but darkened and desaturated toward navy. 1920x1080, navy blue #00254c and #001021 tones with faint orange light accents, no text, no people in foreground
```
### 3.2 (Opsiyonel) Draft/Lobi arka planı — `public/draft_bg.png`
```
Dark American football draft war-room / locker room interior, navy blue lighting, chalkboard play diagrams faintly visible, dramatic and darkened for UI overlay, cinematic. 1920x1080, navy and orange accents, no text
```

---

# 4) EKONOMİ İKONLARI
### 4.1 Para birimi — `public/icon-amfutcoin.png`
**Nerede:** Üst bar, mağaza, ödüller — oyunun para birimi **amfutcoin**.
**Boyut:** 256×256, şeffaf.
**Prompt:**
```
Game currency coin icon called "amfutcoin": a shiny gold-and-orange coin embossed with an American football icon in the center, slight 3D bevel and metallic shine. flat vector style with subtle gradients, gold and bright orange #ff9c00 with navy #00254c rim, crisp clean edges, centered, transparent background, no text, professional game UI coin icon
```
### 4.2 Kulüp Fonu / Bütçe — `public/icon-clubfund.png`
**Boyut:** 256×256.
```
Club budget / money icon: a stack of cash with an upward green-orange arrow and a small football, finance-meets-sports. flat vector style with subtle gradients, navy #00254c with orange #ff9c00 accents, crisp clean edges, centered, transparent background, no text, professional game UI icon
```

---

# 5) MAĞAZA / GÜÇLENDİRME (BOOST) İKONLARI
**Nerede:** `ShopPage` (mağaza). Bilinen item'lar: **power_boost** (takım gücü), **player development** (oyuncu geliştirme). 256×256, şeffaf.

### 5.1 `public/icon-boost-power.png`
```
Power boost icon for a sports game: a glowing orange lightning bolt over an American football, radiating energy, "team strength up" feeling. flat vector style with subtle gradients, navy #00254c base with bright orange #ff9c00 energy, crisp clean edges, centered, transparent background, no text, professional game UI icon
```
### 5.2 `public/icon-boost-training.png`
```
Player development icon: a flexing arm / dumbbell merged with an upward stat bar and a small football, "training upgrade" feeling. flat vector style, navy and orange, crisp clean edges, centered, transparent background, no text, professional game UI icon
```
### 5.3 (Opsiyonel) Coin paketi — `public/icon-coinpack.png`
```
Coin pack store icon: a pile of glowing orange football coins overflowing, premium purchase feeling. flat vector style with subtle gradients, gold/orange and navy, transparent background, no text, professional game store icon
```

---

# 6) SPONSOR / YÖNETİM KURULU İKONLARI
**Nerede:** Sponsor sistemi 3 profil: **safe** (garanti), **perf** (performans), **risk** (yüksek risk/ödül). 256×256, şeffaf — 3 uyumlu rozet.
### 6.1 `public/icon-sponsor-safe.png`
```
Sponsorship badge "Safe/Reliable": a shield with a steady handshake and a small football, calm trustworthy blue tone with orange trim, part of a matching set of 3 sponsor badges. flat vector style, navy #00254c and orange #ff9c00, transparent background, no text, professional game UI badge
```
### 6.2 `public/icon-sponsor-perf.png`
```
Sponsorship badge "Performance": a shield with an upward chart arrow and a football, dynamic, part of a matching set of 3 sponsor badges. flat vector style, navy and orange, transparent background, no text, professional game UI badge
```
### 6.3 `public/icon-sponsor-risk.png`
```
Sponsorship badge "High Risk High Reward": a shield with dice or a flame and a football, bold risky vibe, more orange/red, part of a matching set of 3 sponsor badges. flat vector style, navy with intense orange #ff9c00, transparent background, no text, professional game UI badge
```

---

# 7) KOÇ PORTRELERİ
**Nerede:** Koç sistemi `coaches` (tip: **offensive** / **defensive**). Jenerik avatarlar. 512×512, şeffaf veya yuvarlak çerçeve.
### 7.1 `public/coach-offensive.png`
```
Stylized avatar of an offensive coordinator (American football coach), confident, headset and clipboard, navy team polo with orange accent, semi-realistic illustrated portrait, circular badge frame. navy #00254c and orange #ff9c00 palette, clean, transparent background, no text, professional sports game character portrait
```
### 7.2 `public/coach-defensive.png`
```
Stylized avatar of a defensive coordinator (American football coach), intense/serious, headset, navy team jacket with orange accent, semi-realistic illustrated portrait, circular badge frame. navy and orange palette, clean, transparent background, no text, professional sports game character portrait
```
> İstersen 4-6 farklı yüz/etnik köken varyasyonu üret (çeşitlilik için) — aynı stil/çerçeveyle.

---

# 8) OYUNCU AVATAR / SİLÜET (placeholder)
**Nerede:** Roster/kadro kartlarında oyuncu görseli yok; jenerik bir kask silüeti placeholder iyi olur.
**Dosya:** `public/player-placeholder.png` — 512×512, şeffaf.
```
Generic American football player placeholder avatar: a clean side-profile silhouette of a football helmet, navy with orange facemask, on a subtle circular navy gradient. minimalist, flat vector style, navy #00254c and orange #ff9c00, transparent background, no text, no team logo, professional game UI placeholder
```

---

# 9) POZİSYON ROZETLERİ (opsiyonel ama UI'yı çok güzelleştirir)
**Nerede:** Kadro/derinlik/draft — 11 pozisyon: QB, RB, WR, TE, OL, DE, LB, CB, S, K, P.
**Dosya:** `public/pos/QB.png` … `public/pos/P.png` — her biri 128×128, şeffaf, **aynı şablon**.
**Ortak prompt (kısaltmayı değiştir):**
```
Small position badge for American football, a rounded hexagon chip with the abbreviation "[POS]" in bold condensed uppercase letters, color-coded (offense = orange, defense = blue, special teams = grey). part of a matching set of position badges. flat vector style, navy #00254c base with #ff9c00, crisp, centered, transparent background, professional sports app badge
```
`[POS]` = QB, RB, WR, TE, OL (hücum=turuncu) · DE, LB, CB, S (savunma=mavi) · K, P (özel takım=gri).
> Bu sette **yazı GEREKLİ** (pozisyon kısaltması), o yüzden "no text" kuralını burada uygulama.

---

# 10) BAŞARIM & KUPA ROZETLERİ
**Nerede:** Başarımlar + lider tablosu/sezon sonu. 256×256, şeffaf.
### 10.1 Genel başarım rozetleri (3 kademe) — `public/badge-bronze.png`, `-silver.png`, `-gold.png`
```
Achievement medal badge, [bronze/silver/gold] tier, a star or football emblem in the center with a laurel/wing frame and a ribbon, shiny metallic. part of a matching 3-tier set. flat vector with subtle gradients, metallic [bronze/silver/gold] with navy #00254c and orange #ff9c00 accents, transparent background, no text, professional game achievement badge
```
### 10.2 Şampiyonluk kupası — `public/icon-trophy.png`
```
Championship trophy icon for American football, a golden trophy with a football on top, orange glow, premium. flat vector with subtle gradients, gold and orange #ff9c00 with navy base, transparent background, no text, professional game UI icon
```

---

# 11) STADYUM YÜKSELTME İKONLARI
**Nerede:** `upgrade-stadium` — 3 yükseltme tipi: **turf** (saha zemini), **capacity** (tribün kapasitesi), **practice** (antrenman tesisi). 256×256, şeffaf, uyumlu set.
### 11.1 `public/icon-stadium-turf.png`
```
Stadium turf upgrade icon: a green football field section with yard lines and an upgrade arrow. flat vector, navy and orange accents with field green, transparent background, no text, professional game UI icon
```
### 11.2 `public/icon-stadium-capacity.png`
```
Stadium capacity upgrade icon: stylized stadium stands/seats with an upward arrow, crowd growth feeling. flat vector, navy #00254c and orange #ff9c00, transparent background, no text, professional game UI icon
```
### 11.3 `public/icon-stadium-practice.png`
```
Practice facility upgrade icon: a training cone, dummy/sled and whistle, "facility upgrade" feeling. flat vector, navy and orange, transparent background, no text, professional game UI icon
```

---

# 12) DİĞER / KÜÇÜK İKONLAR
### 12.1 Scout (gözcü) — `public/icon-scout.png`
```
Talent scout icon: a magnifying glass over an American football with a small radar/sparkle, "scouting players" feeling. flat vector, navy #00254c and orange #ff9c00, transparent background, no text, professional game UI icon
```
### 12.2 Hazırlık maçı (friendly) — `public/icon-friendly.png`
```
Friendly match icon: two small football helmets facing each other with a handshake or "vs" energy, casual practice game feeling. flat vector, navy and orange, transparent background, no text, professional game UI icon
```
### 12.3 (Opsiyonel) Yükleme ekranı görseli — `public/loading-art.png`
```
Loading screen splash art for an American football manager game: a dramatic low-angle football on the field under stadium lights, navy and orange cinematic lighting, space at top for a logo. 1080x1920 portrait, atmospheric, no text
```

---

## 📦 Özet — öncelik sırası
1. **ZORUNLU:** `logo.png` (+amblem), PWA ikonları (192/512/180). *(eksik, placeholder geliyor)*
2. **ÇOK ÖNERİLİR:** 12 takım logosu (emoji'lerin yerine), amfutcoin ikonu.
3. **ÖNERİLİR:** mağaza/boost, sponsor (3), koç (2), stadyum (3), kupa, scout/friendly.
4. **GÜZEL OLUR:** pozisyon rozetleri (11), başarım rozetleri (3), oyuncu placeholder, arka plan yenileme, yükleme art.

Görselleri üretip bana ver; ben `public/` içine doğru adlarla koyup kodu (logo, manifest ikonları, takım logosu seçimi, mağaza/sponsor/koç/pozisyon görselleri) bağlarım.
