# Google ile Giriş Kurulumu (amfutmanager)

Projenin gerçek değerleri:
- **Supabase callback (redirect) URL:** `https://rohvwsfivpnnmagzexam.supabase.co/auth/v1/callback`
- **Canlı site:** `https://nfl-manager-alpha.vercel.app`
- **Supabase Providers:** https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/auth/providers
- **Supabase URL Config:** https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/auth/url-configuration

---

## BÖLÜM 1 — Google Cloud Console (kimlik üret)

### 1.1 Proje oluştur
1. https://console.cloud.google.com adresine gir (soltackle0@gmail.com ile).
2. Üst çubuktaki proje seçiciye tıkla → **New Project** → ad: `amfutmanager` → **Create**.
3. Oluşunca o projeyi seçili yap.

### 1.2 OAuth consent screen (izin ekranı)
1. Sol menü → **APIs & Services → OAuth consent screen**.
2. **User Type: External** → **Create**.
3. Zorunlu alanlar:
   - **App name:** amfutmanager
   - **User support email:** soltackle0@gmail.com
   - **Developer contact information:** soltackle0@gmail.com
   - (Logo/alan adı opsiyonel) → **Save and Continue**.
4. **Scopes:** dokunmadan **Save and Continue** (varsayılan email/profile yeterli).
5. **Test users:** **Add Users** → `soltackle0@gmail.com` ekle → **Save and Continue**.
   - ⚠️ Test modunda yalnızca eklediğin e‑postalar giriş yapabilir. Herkese açmak istediğinde izin ekranında **"Publish app"** de (temel email/profile izinleri için doğrulama gerekmez, sadece "unverified app" uyarısı çıkar; "Advanced → Go to app" ile geçilir).

### 1.3 OAuth Client ID oluştur
1. Sol menü → **APIs & Services → Credentials**.
2. **+ Create Credentials → OAuth client ID**.
3. **Application type: Web application**.
4. **Name:** amfutmanager-web
5. **Authorized JavaScript origins** → **Add URI** (her biri ayrı):
   - `https://nfl-manager-alpha.vercel.app`
   - `https://rohvwsfivpnnmagzexam.supabase.co`
   - `http://localhost:5173` (yerel geliştirme için, opsiyonel)
6. **Authorized redirect URIs** → **Add URI** (BU EN KRİTİK SATIR):
   - `https://rohvwsfivpnnmagzexam.supabase.co/auth/v1/callback`
7. **Create** → açılan pencerede **Client ID** ve **Client secret** görünür. İkisini de kopyala (bir yere yapıştır).

---

## BÖLÜM 2 — Supabase (kimliği gir)

### 2.1 Google sağlayıcısını aç
1. https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/auth/providers
2. Listeden **Google**'a tıkla.
3. **Enable Sign in with Google** → AÇ.
4. **Client ID (for OAuth):** Google'dan kopyaladığın Client ID'yi yapıştır.
5. **Client Secret (for OAuth):** Client secret'ı yapıştır.
6. (Bu sayfadaki "Callback URL" zaten `https://rohvwsfivpnnmagzexam.supabase.co/auth/v1/callback` olmalı — Google'a eklediğinle aynı.)
7. **Save**.

### 2.2 Site URL & Redirect URLs (giriş sonrası geri dönüş için — atlanırsa localhost'a düşer)
1. https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/auth/url-configuration
2. **Site URL:** `https://nfl-manager-alpha.vercel.app`
3. **Redirect URLs** → **Add URL**:
   - `https://nfl-manager-alpha.vercel.app/**`
   - `http://localhost:5173/**` (yerel için, opsiyonel)
4. **Save**.

---

## BÖLÜM 3 — Test
1. https://nfl-manager-alpha.vercel.app → **Google ile Giriş Yap**.
2. Google hesabı seç (**soltackle0@gmail.com** ile gir).
3. "unverified app" uyarısı çıkarsa: **Advanced → Go to amfutmanager (unsafe)** → izin ver.
4. Uygulamaya geri dönüp giriş yapmış olmalısın.

> **Admin:** Otomatik admin trigger'ı e‑postaya bakıyor. Google'a **soltackle0@gmail.com** hesabıyla girersen otomatik admin olursun. Farklı bir Google hesabıyla girersen admin olmazsın — o durumda bana o e‑postayı söyle, trigger'ı güncelleyeyim (ya da seni elle admin yapayım).

---

## Sık hata
- **"redirect_uri_mismatch":** Google'daki redirect URI ile Supabase callback birebir aynı değil. 1.3 adım 6'daki URL'yi kontrol et.
- **Giriş sonrası localhost'a/boş sayfaya düşüyor:** Bölüm 2.2 (Site URL / Redirect URLs) eksik.
- **"access_denied" / sadece sen girebiliyorsun:** İzin ekranı Test modunda; ya test user ekle ya "Publish app".
- **"provider is not enabled":** Bölüm 2.1 kaydedilmemiş.
