# NFL Manager — Yeni Supabase Kurulum Notları

Bu proje **yeni ve temiz** bir Supabase projesine taşındı. Aşağıda neyin otomatik yapıldığı ve **senin elle tamamlaman gereken adımlar** var.

## Yeni proje bilgileri

| | |
|---|---|
| Proje adı | `nfl-manager` |
| Project ref | `rohvwsfivpnnmagzexam` |
| API URL | `https://rohvwsfivpnnmagzexam.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam |
| anon (public) key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaHZ3c2ZpdnBubm1hZ3pleGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1MDcsImV4cCI6MjA5NzkwMDUwN30.aTyzmzD-jryb4cSHRSDufHtPCr_jerQwxH3lUF-CLGs` |

---

## ✅ Otomatik yapılanlar

- Yeni Supabase projesi oluşturuldu (EU-Central / Frankfurt, ücretsiz plan).
- Tüm şema kuruldu: 23 tablo, RLS politikaları, fonksiyonlar, enum'lar, realtime (6 tablo).
- **Eksik olan signup trigger'ı eklendi** (`on_auth_user_created`) — kayıt olan kullanıcılar artık otomatik `public.users` kaydı alıyor (eskiden bu trigger migration'larda yoktu).
- `seed.sql` çalıştırıldı: 300 serbest oyuncu + 100 isim havuzu.
- `maintenance_mode = false` yapıldı (yoksa site herkese "Tadilat" sayfası gösterirdi).
- **54 edge function deploy edildi** (verify_jwt ayarları korunarak).
- `.env`, `supabase/.temp` yeni projeye yönlendirildi.
- `.env` artık `.gitignore`'da (içinde gizli anahtar olduğu için).

---

## 🔧 Senin yapman gerekenler

> **GÜNCEL DURUM (2026-06-25):** Yapılabilecek her şeyi yaptım. Geriye **tek bir komut** kaldı.
> - ✅ #2 service_role `.env`'de · ✅ #5 maç motoru deploy+doğrulandı · ✅ #8 admin otomatik · ✅ güvenlik sertleştirildi
> - ✅ **#4 GitHub cron'ları artık GEREKMİYOR** — 5 cron işinin hepsi **Supabase pg_cron**'a taşındı (test edildi, zamanlandı). GitHub workflow'ları devre dışı bırakıldı. Secret eklemene gerek yok.
> - ✅ **#3 Vercel** — frontend yeni projeye **kodda sabitlendi** (`src/lib/supabase.ts`) ve **production build doğrulandı** (paket yeni DB'ye bağlanıyor). Vercel dashboard'da env değişkeni ayarlamana **gerek yok**.
> - ⏳ **Senin yapman gereken TEK şey:** değişiklikleri commit + push. Vercel git entegrasyonun otomatik deploy eder ve canlı site yeni DB'ye bağlanır:
>   ```bash
>   git rm --cached .env        # (#7 — başka git işlemi açıkken ben yapamadım)
>   git add -A && git commit -m "migrate to new supabase + crons in pg_cron + security hardening"
>   git push
>   ```
> > Not: Vercel deploy'unu CLI/push olmadan bu ortamdan tetikleyemiyorum (Vercel kimlik/erişimi yok). Build'i yerelde doğruladım; push yeterli.

### 1) Service role anahtarını al  (zaten `.env`'de var)
GitHub secrets (#4) için lazım olursa: yerel `.env` dosyandaki `SUPABASE_SERVICE_ROLE_KEY` değeridir. Yeni almak istersen: https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/settings/api

### 2) Yerel `.env`'i tamamla  ✅ ZATEN TAMAM
`.env` içinde `SUPABASE_SERVICE_ROLE_KEY` gerçek bir secret anahtarla dolu (`sb_secret_…`, yeni anahtar formatı). Ekstra bir şey gerekmiyor.

### 3) Vercel  ✅ KODDA HALLEDİLDİ (sadece push gerekiyor)
`src/lib/supabase.ts` artık yeni proje URL'i + anon key'i (ikisi de **public** değerler) doğrudan içeriyor; `useAchievements.ts` de aynı sabiti kullanıyor. **Production build yerelde doğrulandı** — derlenen paket `rohvwsfivpnnmagzexam.supabase.co`'ya bağlanıyor, `placeholder` kalmadı.

Yani Vercel dashboard'da env değişkeni ayarlaman **gerekmiyor**. Vite env değişkenlerini build-time'da gömdüğü için zaten bir **redeploy şart**tı; kodda sabitleyince bu redeploy env'den bağımsız çalışıyor.

**Canlıya almak için tek gereken:** commit + `git push` (Vercel git entegrasyonu otomatik build+deploy eder). Bu ortamdan Vercel deploy'unu tetikleyemiyorum (Vercel erişimi yok).

### 4) GitHub Actions secrets  ✅ ARTIK GEREKMİYOR (cron'lar Supabase'e taşındı)
5 cron işinin (cleanup, training-complete, fa-market, match-engine, season-end) hepsini **Supabase pg_cron**'a taşıdım — `public.cron_*` fonksiyonları + `cron.schedule` (migration `20260625045134`). Eski GitHub cron script'leriyle birebir aynı mantık, aynı zamanlama (UTC). Test edildi (no-op'lar çalıştı; fa-market rollback'te 300→243→geri alındı).

`.github/workflows/cron-*.yml` dosyaları çift çalışmayı önlemek için **devre dışı** bırakıldı (sadece `workflow_dispatch`). Yani GitHub secrets eklemene **gerek yok**; eklersen bile cron'lar GitHub'da otomatik çalışmaz.

> Zamanlanmış işleri görmek için Supabase SQL Editor'de: `select * from cron.job;`

### 5) `admin-simulate-match` deploy  ✅ TAMAMLANDI (artık senin yapmana gerek yok)

**ÖNEMLİ BULGU:** Bu dosya neden deploy edilmemiş onu buldum — büyüklüğünden değil, **bozuk olduğu için**. `index.ts` çalışma kopyasında üç sorun vardı:
1. **Sözdizimi hatası** — 277-278. satırlarda fazladan bir `}` (yarım kalmış bir düzenlemeden; dıştaki `try` bloğunu erken kapatıyordu → `TS1472: 'catch' or 'finally' expected`). Bu haliyle fonksiyon **boot bile olmaz**, CLI deploy'u bile başarısız olurdu.
2. Dosya sonunda **37 adet NUL (`\0`) baytı** (hatalı yazma artığı).
3. Tüm satırlar **CRLF** satır sonuyla (diğer 53 fonksiyon LF).

**Yapıldı:**
- Üç sorun da düzeltildi; dosya artık temiz parse oluyor (sözdizimi hatası yok), LF satır sonlu, diğer fonksiyonlarla tutarlı.
- **Gerçek 961 satırlık motor `rohvwsfivpnnmagzexam` projesine deploy edildi (version 4, `verify_jwt=true`).**
- Deploy **doğrulandı:** canlıdaki kaynak ile yerel dosya **bayt-bayt aynı** (SHA-256: `3bcf9304…`, `diff` boş).

> Artık ek bir şey yapmana gerek yok. İleride `index.ts`'i değiştirirsen yeniden deploy için:
> `npx supabase functions deploy admin-simulate-match`
>
> Tek yapman gereken: düzeltilen `index.ts` + yeni migration dosyasını **commit'lemek** (`git add -A && git commit`).

### 6) (Opsiyonel) CRON_SECRET
`cron-fill-bots` fonksiyonu opsiyonel bir `CRON_SECRET` kullanıyor. Kullanacaksan:
https://supabase.com/dashboard/project/rohvwsfivpnnmagzexam/settings/functions → Secrets → `CRON_SECRET` ekle.

### 7) `.env`'i git takibinden çıkar (güvenlik)
`.env` şu an repoda **izleniyordu** (eski gizli anahtarlar GitHub'a sızmıştı; o proje silindiği için artık etkisiz). Bir daha sızmaması için:
```bash
git rm --cached .env
git commit -m "chore: stop tracking .env, point to new supabase project"
git push
```

### 8) Admin yetkisi  ✅ OTOMATİKLEŞTİRİLDİ (migration `20260625032510`)
Artık elle SQL çalıştırmana gerek yok. `handle_new_user` trigger'ını değiştirdim: `soltackle0@gmail.com` ile **kayıt olduğun an otomatik admin** olacaksın. (Başka bir e-posta admin olsun istersen söyle, trigger'ı güncelleyeyim.)

---

## ✅ Güvenlik sertleştirmeleri (UYGULANDI — migration `20260625013836`)

Advisor'daki bulgular düzeltildi (canlı projeye uygulandı + yerel migration dosyası eklendi):

- **GERÇEK AÇIK DÜZELTİLDİ:** `admin_delete_league`'in **hiçbir yetki kontrolü yoktu** — `SECURITY DEFINER` + `anon`/`authenticated` çağrılabilir olduğu için **herhangi bir ziyaretçi `/rest/v1/rpc/admin_delete_league` ile istediği ligi silebilirdi.** Fonksiyona içeride admin rol kontrolü eklendi; `anon` yetkisi alındı, `authenticated` kaldı (admin paneli ile çağrılıyor, ama artık admin olmayan 'unauthorized' alıyor).
- `buy_free_agent`, `generate_fixtures`, `handle_new_user`: yalnızca service-role edge function/trigger çağırdığı için `anon`/`authenticated` execute yetkileri alındı (service_role'de kaldı).
- 6 fonksiyonun **mutable `search_path`** uyarısı düzeltildi (`SET search_path = public, pg_temp`).
- Advisor sonucu: **~17 bulgu → 4** (kalanlar bilinçli: `admin_delete_league` artık iç kontrolle korunuyor + `achievements`/`admin_logs`/`sponsors` yalnızca service_role'e açık RLS).

Kalan (kasıtlı): `achievements`, `admin_logs`, `sponsors` tablolarında RLS açık ama policy yok — yalnızca service_role erişebilir, bilinçli tasarım.

## Not: Bazı fonksiyonlarda şema uyuşmazlıkları olabilir
Bazı edge function'lar kodda var olmayan tablo/kolon adlarına atıfta bulunuyor (örn. `user_achievements`, `match_results`, `trades`, `players.overall_rating`, `matches.status/match_time`, `tactics.ilk_11_oyuncu_ids`). Bunlar **bu taşımadan bağımsız**, eski projede de aynıydı. Oyun akışında bu özelliklere denk gelirsen söyle, ayrı bir iş olarak düzeltebilirim.
