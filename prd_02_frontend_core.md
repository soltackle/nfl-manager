# PRD Bölüm 2: Frontend Çekirdek Yapısı (src/ Core, Layout, UI, State)

Bu belge, projenin arayüz mimarisini oluşturan ana dosyaların, UI bileşenlerinin, global durum (state) yönetiminin ve hook'ların içeriklerini detaylandırır.

### Ana Başlatıcılar (src/ Root)
- **`main.tsx`**: Uygulamanın giriş noktasıdır. React 19 API'si olan `createRoot` fonksiyonunu kullanarak `App.tsx` bileşenini DOM'a bağlar.
- **`App.tsx`**: Tüm rotaları ve global bağlamları (Providers - SWRConfig vb.) sarmalayan ana bileşendir. Aynı zamanda `ToastContainer` veya global yükleme ekranlarını barındırır.
- **`router.tsx`**: React Router DOM `createBrowserRouter` fonksiyonunu kullanarak sayfa yönlendirmelerini tanımlar. `/` anasayfası, `/dashboard`, `/market`, `/match` gibi URL yollarını ve bu yollara denk gelen React sayfalarını eşleştirir. Ayrıca, `AdminRoute` veya `MaintenanceGuard` gibi koruyucu katmanları da (HOC) rotalara entegre eder.
- **`index.css` & `App.css`**: Tailwind'in `@tailwind base; @tailwind components; @tailwind utilities;` direktiflerini içerir. Ayrıca oyunun temasına özgü (özel fontlar, stadyum çim arka plan efektleri, scrollbar gizleme vb.) global CSS sınıflarını (classes) barındırır.

### UI Bileşenleri (src/components/ui/)
Genel amaçlı, tekrar kullanılabilir tasarım sistemine ait parçalardır.
- **`Button.tsx`**: Farklı varyantları (primary, secondary, outline, danger) olan, tıklama animasyonlarına sahip (framer-motion ile) standart buton bileşeni.
- **`Card.tsx`**: Bilgileri gruplamak için kullanılan, köşeleri yuvarlatılmış, hafif gölgeli (glassmorphism/blur destekli) çerçeve bileşeni.
- **`Badge.tsx`**: Durum bildiren (aktif, pasif, satılık vb.) küçük renkli etiketler.
- **`TopNav.tsx` & `BottomNav.tsx`**: Kullanıcının uygulamada gezinmesini sağlayan menüler. TopNav genelde logo, bakiye (coin) ve profili gösterirken; BottomNav mobil görünümde sayfa geçişleri için ikonlu menüler barındırır.
- **`LoadingScreen.tsx` & `Skeleton.tsx`**: Veriler sunucudan çekilirken arayüzün boş kalmaması için iskelet görünümleri ve tam ekran dönen logo (spinner) animasyonları içerir.
- **`ToastContainer.tsx`**: Kullanıcı başarılı/başarısız bir işlem yaptığında ekranın üstünde/altında beliren bildirim mesajlarının render edildiği bileşendir (Zustand `toastStore` ile haberleşir).
- **`TraitBadge.tsx`**: NFL oyuncularının özel yeteneklerini (Hızlı, Güçlü Kol vb.) ikonlar ve özel renklerle belirten komponent.
- **`GameHint.tsx`**: Taktik ekranı veya takım kurma gibi kompleks sayfalarda, kullanıcının üzerine geldiğinde "Bu ne işe yarar?" bilgisini veren tooltip/yardım metinleridir.

### Global State ve Store (src/store/)
Uygulama genelinde (prop-drilling yapmadan) verilere ulaşmak için Zustand kütüphanesi kullanılarak oluşturulan store'lar.
- **`authStore.ts`**: Kullanıcının oturum açıp açmadığı (isLoggedIn), kullanıcı kimliği (session/user) ve admin olup olmadığı bilgisini tutar.
- **`franchiseStore.ts`**: Kullanıcının seçili kulübüne ait bakiye, kulüp adı, stadyum seviyesi gibi temel verileri önbellekler.
- **`leagueStore.ts`**: Kullanıcının bulunduğu ligin ID'si, sezon haftası, draft durumu (başladı/bekliyor) gibi lig metadatalarını barındırır.
- **`uiStore.ts`**: Uygulamanın UI durumlarını yönetir. Örneğin sidebar açık/kapalı durumu veya aktif modal pencereleri.
- **`maintenanceStore.ts`**: Sitenin bakıma (tadilat) girip girmediği bilgisini anlık dinler ve sistemi kilitler.
- **`toastStore.ts`**: ToastContainer'da gösterilecek mesajları (`addToast`, `removeToast`) listeler.

### Custom Hooks (src/hooks/)
Supabase veritabanıyla konuşan asenkron React Hook'larıdır.
- **`useClub.ts` & `useRoster.ts`**: Mevcut kullanıcının takım bilgilerini ve oyuncu kadrosunu SWR kullanarak getirir, önbellekler ve günceller (mutate).
- **`useMatch.ts` & `useMatches.ts`**: Lig fikstürünü, oynanacak sonraki maçı ve maç sonuçlarını (play-by-play logları ile birlikte) getirir.
- **`useMarket.ts` & `useScout.ts`**: Pazarda listelenen oyuncuları filtreler, satın alma işlemlerini asenkron yapar ve scout (gözlemci) görevlerini takip eder.
- **`useTactics.ts`**: `tactics` tablosundan takımın hücum/savunma stratejilerini ve playbook verisini (durumsal taktikler matrisi) okur ve kaydeder.
- **`useMaintenanceMode.ts`**: Edge function veya DB'den global ayarları çekip sistemi bakıma alır.

### Types ve Utility (src/types/ & src/lib/)
- **`types/index.ts`**: Projede kullanılan tüm veri tipleri burada tanımlıdır. `Player`, `Franchise`, `Match`, `Quest`, `Playbook` gibi interfaceler TypeScript hatalarını engeller.
- **`lib/supabase.ts`**: `@supabase/supabase-js` kütüphanesini kullanarak `createClient` ile veritabanı bağlantı objesini dışa aktarır. Tüm hook'lar bu objeyi kullanır.
- **`lib/api.ts`**: Supabase Edge Functions'lara (örneğin `/admin-simulate-match`) yetkilendirilmiş (Auth Header'lı) istek atan yardımcı HTTP fonksiyonlarını barındırır.
- **`lib/constants.ts`**: Oyundaki pozisyon isimleri (QB, WR, RB), takım sınırları, maaş bütçesi limiti, XP sınırları gibi sabit (hardcoded) ayarları barındırır.
