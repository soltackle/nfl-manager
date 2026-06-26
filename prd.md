# Proje Dosya Analizi ve Dokümantasyonu (PRD)

Bu belge, NFL Manager projesindeki tüm dosyaların detaylı bir incelemesini ve her birinin sistem içerisindeki görevini açıklamaktadır.

## 1. Kök Dizin ve Konfigürasyon Dosyaları
- `package.json` / `package-lock.json`: Projenin bağımlılıklarını (dependencies) ve npm scriptlerini (dev, build, vb.) tanımlar.
- `vite.config.ts`: Vite derleyicisinin (bundler) konfigürasyon dosyası. React pluginleri ve alias ayarlarını içerir.
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`: TypeScript derleyicisinin tip denetim ve derleme kurallarını belirler.
- `tailwind.config.ts` / `postcss.config.js`: TailwindCSS'in tasarım sistemi, renk paleti ve plugin konfigürasyonları.
- `eslint.config.js`: Projedeki kod standartlarını ve lint kurallarını belirler.
- `.env`: Ortam değişkenlerini (Supabase URL, Anon Key vb.) tutar.
- `.gitignore`: Git tarafından takip edilmeyecek dosya ve klasörleri tanımlar.
- `vercel.json`: Vercel platformu için deploy ve routing (yönlendirme) ayarlarını barındırır.
- `index.html`: Uygulamanın giriş noktası olan ana HTML şablonudur.
- `README.md`, `implementation_plan.md`, `walkthrough.md`, `task.md`: Projenin geliştirme süreçlerini, görevleri ve mimari kararlarını anlatan dokümantasyon dosyaları.

## 2. Frontend (src/) - React & Vite

### 2.1. Ana Dosyalar
- `src/main.tsx`: React uygulamasını başlatan (bootstrap) ve DOM'a render eden ana dosyadır.
- `src/App.tsx`: Uygulamanın root bileşeni; genel sarmalayıcıları (providers) içerir.
- `src/router.tsx`: React Router yapılandırması. Tüm sayfaların rotalarını (URL yollarını) ve hangi component'in yükleneceğini belirler.
- `src/index.css` / `src/App.css`: Global CSS tanımlamaları ve Tailwind direktifleri.

### 2.2. Bileşenler (components/)
- **auth/**
  - `AdminRoute.tsx`: Yalnızca admin yetkisine sahip kullanıcıların erişebileceği rotaları koruyan HOC (Higher Order Component).
  - `MaintenanceGuard.tsx`: Sistem bakım modundayken kullanıcıları tadilat sayfasına yönlendirir.
- **dashboard/**
  - `LeagueChat.tsx`: Lig içi gerçek zamanlı (real-time) mesajlaşma arayüzü.
  - `LeagueNews.tsx`: Ligde gerçekleşen olayların ve haberlerin listelendiği bileşen.
  - `QuestsModal.tsx`: Kullanıcının görevlerini (quests) ve ödüllerini gösteren popup ekranı.
- **layout/**
  - `Layout.tsx`: Uygulamanın genel sayfa düzeni; navbar, sidebar veya alt menülerin yerleşimini sağlar.
- **ui/**
  - `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Skeleton.tsx`: Yeniden kullanılabilir, Tailwind ile stillendirilmiş temel UI (arayüz) elemanları.
  - `TopNav.tsx`, `BottomNav.tsx`: Mobil ve masaüstü uyumlu üst/alt navigasyon çubukları.
  - `ToastContainer.tsx`: Kullanıcıya gösterilen bildirim (toast) mesajlarının barındırıldığı konteyner.
  - `GameHint.tsx`: Oyuncu kartlarında veya belirli alanlarda ipuçları gösteren bileşen.
  - `TraitBadge.tsx`: Oyuncuların özel yeteneklerini (traits) görselleştiren rozet.
  - `LoadingScreen.tsx`: Veri yüklenirken gösterilen tam ekran animasyon.

### 2.3. Sayfalar (pages/)
- **auth/**
  - `LoginPage.tsx`: Kullanıcı giriş / kayıt ekranı.
  - `SlotsPage.tsx`: Kullanıcı kayıt öncesi boş slot (yer) kontrol ekranı.
- **admin/**
  - `AdminDashboard.tsx`: Adminlerin oyun ekonomisini, ligleri ve sistem durumunu yönettiği panel.
- **dashboard/**
  - `DashboardPage.tsx`: Kullanıcının oyuna girdiğinde karşılaştığı ana özet ekran.
- **club/ & team-creation/**
  - `ClubPage.tsx`: Kulüp bilgileri, finans ve stadyum gibi detayların gösterildiği sayfa.
  - `TeamCreationPage.tsx`: Yeni bir takıma isim, logo ve temel bilgilerin atandığı kurulum sayfası.
- **roster/ & depth-chart/**
  - `RosterPage.tsx`: Takımın mevcut kadrosunu (oyuncu listesini) listeler.
  - `DepthChartPage.tsx`: Oyuncuların sahaya hangi pozisyonlarda (1. takım, 2. takım) çıkacağını belirleyen sıralama sayfası.
- **tactics/**
  - `TacticsPage.tsx`: Durumsal (situational) hücum ve savunma taktiklerinin ayarlandığı strateji ekranı.
- **coach-selection/**
  - `CoachSelectionPage.tsx`: Takıma baş antrenör, hücum/savunma koordinatörü atama ekranı.
- **market/ & shop/**
  - `MarketPage.tsx`: Serbest oyuncu pazarı ve transfer merkezi.
  - `ScoutModal.tsx`: Gözlemci (scout) göndererek yeni oyuncu bulma ekranı.
  - `ShopPage.tsx`: Oyun içi para (coin) ile avantajların alındığı mağaza.
- **match/ & friendlies/**
  - `MatchesPage.tsx`: Fikstür ve oynanmış / oynanacak maçların listesi.
  - `MatchResultPage.tsx`: Oynanan maçın sonucunu, istatistiklerini ve spiker (Play-by-play) loglarını gösteren sayfa.
  - `FriendliesPage.tsx`: Diğer takımlarla hazırlık maçı yapma (friendly match) sayfası.
- **leaderboard/ & lobby/**
  - `LeaderboardPage.tsx`: Genel sıralamalar ve puan durumu.
  - `LeagueLobbyPage.tsx`: Draft öncesi veya lig başlangıcı öncesi bekleme odası.
- **training/**
  - `TrainingPage.tsx`: Oyuncuların antrenman programlarının ayarlandığı ve geliştirildiği sayfa.
- **maintenance/**
  - `TadilatPage.tsx`: Bakım çalışması (maintenance) sırasında kullanıcılara gösterilen bilgilendirme ekranı.
- **onboarding/**
  - `FranchiseSetupPage.tsx`: İlk kayıt aşamasında kulübün (franchise) oluşturulduğu karşılama sayfası.
- **profile/**
  - `ProfilePage.tsx`: Kullanıcı hesap ayarları ve kişisel bilgileri.

### 2.4. Hook'lar (hooks/)
Tüm hook'lar `SWR` veya doğrudan `Supabase` aracılığıyla veritabanından veri çeker ve state yönetimini sağlar:
- `useClub.ts`, `useRoster.ts`, `useDepthChart.ts`, `useStandings.ts`: Kulüp, kadro, diziliş ve puan durumu verilerini çeker.
- `useMatch.ts`, `useMatches.ts`: Maç motorundan dönen fikstür ve maç sonuçlarını işler.
- `useMarket.ts`, `useScout.ts`, `useTraining.ts`: Market, gözlemci ve antrenman işlemlerini asenkron yönetir.
- `useTactics.ts`: Takımın durumsal taktiklerini getirir/kaydeder.
- `useAchievements.ts`: Başarımları ve quest'leri takip eder.
- `useMaintenanceMode.ts`: Sitede genel bir bakım olup olmadığını kontrol eder.

### 2.5. Durum Yönetimi (store/)
Uygulamanın genel (global) state'ini yönetmek için `Zustand` kullanılmıştır:
- `authStore.ts`: Oturum (session) ve giriş yapan kullanıcının temel bilgilerini tutar.
- `franchiseStore.ts`: Seçili takımın anlık verilerini saklar.
- `leagueStore.ts`: Kullanıcının bulunduğu ligin detaylarını (draft saati, sezon durumu) tutar.
- `toastStore.ts`: Uygulama içi bildirimlerin tetiklenmesini yönetir.
- `uiStore.ts`, `maintenanceStore.ts`: Arayüz (sidebar, modal) ve bakım durumu flag'lerini barındırır.

### 2.6. Tipler ve Utility'ler (types/ & lib/)
- `types/index.ts`: Tüm TypeScript arayüzlerini (Interface, Type, Enum) merkezi olarak barındırır (örn: `Player`, `Team`, `MatchInfo`).
- `lib/supabase.ts`: Supabase istemcisinin başlatıldığı ve projenin geri kalanına aktarıldığı yerdir.
- `lib/api.ts`: Edge function'lara istek atmak için sarmalayıcı (wrapper) fonksiyonları barındırır.
- `lib/constants.ts`: Oyun içi sabitler, katsayılar ve konfigürasyon değişkenleri.

## 3. Backend (supabase/) - Edge Functions & Veritabanı

### 3.1. Supabase Edge Functions (functions/)
Bu klasör, Deno tabanlı sunucusuz (serverless) fonksiyonları içerir. İş mantığı (Business logic) burada koşar.
- **Yönetici ve Maç Motoru (Admin / Match Engine):**
  - `admin-simulate-match/`, `admin-simulate-draft/`: Maçların simülasyonunu ve draft atamalarını yapan ana motorlar.
  - `admin-end-season/`: Sezon sonu işlemlerini (küme düşme, ödül dağıtımı) gerçekleştirir.
  - `auto-matchmake/`, `cron-daily-matches/`: Fikstürü oluşturan ve zamanı gelen maçları otomatik oynatan fonksiyonlar.
  - `league-fixtures/`, `league-standings/`: Lig maç takvimini ve anlık puan durumunu günceller.
- **Oyun Ekonomisi ve Market:**
  - `market-buy/`, `market-list-player/`: Oyuncu alım-satım işlemlerini doğrular.
  - `process-trade/`, `trade-offer/`: Menajerler arası oyuncu takas (trade) mantığını işletir.
  - `claim-free-coins/`, `shop-purchase/`, `user-balance/`: Oyun içi sanal para işlemlerini güvenli bir şekilde yapar.
- **Takım Yönetimi ve Gelişim:**
  - `process-training/`, `start-training/`, `training-start/`: Antrenman döngüsünü işletip oyuncu niteliklerini artırır.
  - `scout-start/`, `scout-claim/`: Gözlemci operasyonlarını yönetir.
  - `tactics/`, `franchise-roster/`, `franchise-depth-chart/`: Takım kurma ve taktik atama API uçları.
- **Draft Sistemi:**
  - `draft-session/`, `make-draft-pick/`, `draft-pick/`: Sezon öncesi canlı draft (oyuncu seçme) işlemlerini Realtime üzerinden yönetir.
- **Görevler (Quests) ve Diğer:**
  - `get-quests/`, `claim-quest/`: Kullanıcı görevlerini kontrol edip ödüllerini tanımlar.
  - `simulate-friendly/`: Puan tablosunu etkilemeden oynanan dostluk maçlarını hesaplar.
  - `_shared/`: Tüm edge function'ların ortak kullandığı yardımcı dosyalar (`supabase.ts`, `cors.ts`, `playerUtils.ts`, `auth.ts`).

### 3.2. Veritabanı Göçleri (migrations/)
Bu klasördeki `.sql` dosyaları, veritabanı şemasının zaman içindeki değişimini tutar.
- `001_initial_schema.sql` - `004_fix_users.sql`: Kullanıcı, kulüp ve ana oyun tablolarının yaratılması.
- `..._economy_schema.sql`: Oyun içi market, coins ve finansal hareketlerin tabloları.
- `..._enable_realtime_draft.sql`, `..._enable_realtime_chat.sql`: Supabase Realtime modüllerini aktif eden SQL komutları.
- `..._auto_matchmaking.sql`, `..._economy_overhaul.sql`: Oyunu otomatize eden veritabanı tetikleyicileri (Triggers) ve rütine bağlanan işlemler.
- RLS (Row Level Security) dosyaları (`..._training_rls.sql`, `..._draft_policies.sql` vb.): Veri güvenliği kurallarını sağlar, herkesin sadece kendi takımının verisini düzenleyebilmesini temin eder.

## 4. Araçlar ve Scriptler (scripts/, scratch/, spiker/)
- **scripts/**: Geliştiricinin node üzerinden veya CI/CD üzerinden çalıştırdığı görevler.
  - `match-engine.ts`, `season-end.ts`, `fa-market.ts`: Test amaçlı veya manuel tetiklenen lokal scriptler.
  - `seed-traits.js`: Oyunculara başlangıç özelliklerini (traits) rastgele atayan script.
  - `wipe.js`, `cleanup.ts`: Test veritabanını temizleyen geliştirici araçları.
- **scratch/**: Geliştirme esnasında kullanılmış, kalıcı olmayan test (scratchpad) dosyaları.
  - `check_users.js`, `test_match.js`, `e2e_test.js`: Çeşitli API ve fonksiyonların çalıştığını doğrulamak için yazılmış basit JS testleri.
- **spiker/**:
  - `pbp_spiker_metinleri.json`, `pbp_spiker_metinleri_v2.json`: Maç esnasında spikerin söyleyeceği sözlerin, oyun pozisyonlarına (Play-by-play) göre saklandığı lokalizasyon/metin kütüphanesi.
- **tests/**:
  - `e2e/main_flow.js`: Otomatize edilmiş uçtan uca (End-to-End) kullanıcı senaryo testleri.

## 5. Medya ve Public (public/, assets/, sounds/)
- `public/`, `src/assets/`: İkonlar (`favicon.svg`, `icons.svg`), arkaplanlar (`stadium_bg.png`), Vite ve React logoları (`hero.png`).
- `sounds/Touchdown.mp3`: Maç simülasyonu esnasında spesifik anlarda (örneğin Touchdown olduğunda) oynatılan ses efekti dosyası.
