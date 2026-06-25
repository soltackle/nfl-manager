# PRD Bölüm 3: Frontend Sayfaları ve Arayüz Akışları (src/pages/ & src/components/dashboard/)

Bu belge, kullanıcıların oyunu oynarken gördüğü temel sayfa ve ekranların içeriklerini ve kullanıcı deneyimi (UX) işlevlerini açıklar.

### Yetkilendirme ve Karşılama Sayfaları (auth/ & onboarding/)
- **`LoginPage.tsx`**: Supabase Auth UI (veya özel form) kullanarak email/şifre ile giriş ve kayıt olma ekranını oluşturur. Başarılı girişte kullanıcıyı `/slots` veya `/dashboard` rotasına yönlendirir.
- **`SlotsPage.tsx`**: Yeni kayıt olan kullanıcının lige dahil olabilmesi için müsait yer (slot) olup olmadığını kontrol eden ekran. Lig doluluğuna göre oyuncuya bekleme veya katılma seçenekleri sunar.
- **`FranchiseSetupPage.tsx`**: Oyuncunun ilk defa takım yarattığı "Onboarding" adımı. Takım adı, kısaltması (abbreviation), takım renkleri ve logo seçimi gibi adımları içeren bir sihirbaz (wizard) formudur. Form tamamlanınca Supabase'deki `franchises` tablosuna kayıt atılır.

### Ana Yönetim ve Dashboard Sayfaları
- **`DashboardPage.tsx`**: Kulübün "Ana Karargahı". Yaklaşan maçı, ligdeki güncel sıralamayı, takımın form durumunu ve bakiye özetini bir arada sunan widget (kart) tabanlı ana sayfa.
- **`ClubPage.tsx`**: Kulübün finansal detayları, stadyum seviyesi ve taraftar durumu (fan base) gösterilir. Kullanıcı stadyumu geliştir (upgrade) tuşlarına buradan erişir.
- **`ProfilePage.tsx`**: Kullanıcıya ait istatistiklerin (User Stats), ayarların (tema, şifre değiştirme) yapıldığı profil ekranı.

### Kadro ve Taktik Sayfaları
- **`RosterPage.tsx`**: Tüm kadronun mevkilerine (QB, RB, WR, Defense) göre filtrelenebildiği tablo/liste ekranı. Oyuncuların genel gücü (OVR), yaşları, potansiyelleri ve yorgunluk/kondisyon durumları burada listelenir.
- **`DepthChartPage.tsx`**: Maça çıkacak ilk 11 (veya spesifik NFL mevkileri) dizilişinin ayarlandığı "Derinlik Tablosu". Oyuncular sürükle-bırak (drag-drop) mantığıyla As veya Yedek olarak atanır. Maç motoru kimin oynayacağını buradan okur.
- **`TacticsPage.tsx`**: Detaylı Durumsal Matris (Play Call Sheet). Oyunun Down, Mesafe (Short/Long) ve Saha Konumu (Red Zone, vb.) bazında farklı hücum ve savunma oyunlarının (ör: Screen Pass, Blitz) ayarlandığı koçluk paneli.
- **`CoachSelectionPage.tsx`**: Takımın hücum (OC) ve savunma (DC) koordinatörlerinin seçildiği, koçların felsefelerinin takıma verdiği bonusların gösterildiği ekran.

### Maç, Fikstür ve Lig Ekranları
- **`MatchesPage.tsx`**: Ligin tam fikstür takvimi. Oynanmış maçların skorları ve oynanacak maçların saatleri listelenir.
- **`MatchResultPage.tsx`**: Bir maç tamamlandıktan sonra skor tabelasını (Scoreboard), takım istatistiklerini (Total Yards, Passing, Rushing vs.) ve spiker anlatım dökümünü (Play-by-play Logs) okuduğumuz detay ekranı.
- **`FriendliesPage.tsx`**: Oyuncuların arkadaşlarına veya bot takımlara karşı hazırlık maçı talebi gönderip kabul ettikleri ekran.
- **`LeaderboardPage.tsx` (Standings)**: Lig puan durumu, galibiyet/mağlubiyet sayıları, atılan/yenilen sayılar (PF/PA) tablosu.
- **`LeagueLobbyPage.tsx`**: Sezon başlamadan önce veya draft günü takımların beklediği sohbet odası formatlı bekleme ekranı.

### Gelişim, Market ve Ekonomi Sayfaları
- **`TrainingPage.tsx`**: Oyunculara bireysel veya takım antrenman programlarının (Strength, Speed, Playbook vb.) atandığı ekran. Antrenman sonuçlarına göre oyuncu OVR artışları gösterilir.
- **`MarketPage.tsx`**: Serbest (Free Agent) oyuncuların listelendiği, kullanıcıların belirli bir bütçeyle oyuncu satın alabildiği veya kendi oyuncusunu listelediği pazar ekranı.
- **`ScoutModal.tsx`**: Market içerisinde yer alan bu özellik, kullanıcının gözlemcileri belirli bir mevkiye göre aramaya gönderdiği pop-up panelidir.
- **`ShopPage.tsx`**: Oyun içi günlük bonusların (Claim Free Coins) alındığı veya premium öğelerin satıldığı mağaza bölümü.

### Dashboard İç İçe Bileşenleri (components/dashboard/)
Bu bileşenler sayfalara gömülü çalışan özel kompleks araçlardır.
- **`LeagueChat.tsx`**: Supabase Realtime Channel kullanarak aynı ligdeki diğer menajerlerle anlık mesajlaşma sağlayan sohbet kutusu (chat box).
- **`LeagueNews.tsx`**: Ligde meydana gelen olayların (Transferler, büyük sakatlıklar, lig şampiyonu vb.) sistem tarafından otomatik oluşturulup bir zaman akışı (feed) şeklinde sergilendiği bileşen.
- **`QuestsModal.tsx`**: Oyuna giriş yapıldığında veya ilgili butona tıklandığında açılan, "Bugün 3 maç kazan" gibi görevleri barındıran ve tamamlandığında ödül verdiren (Claim) pencere.

### Sistem Ekranları
- **`AdminDashboard.tsx`**: `admin` yetkili kullanıcıların erişebildiği panel. Burada maçları manuel simüle etme, sezon sonlandırma, lig açma/kapatma gibi global ayarları tetikleyen butonlar bulunur.
- **`TadilatPage.tsx`**: `useMaintenanceMode` tetiklendiğinde herkesin yönlendirildiği, "Sistem Bakımda" yazılı statik ekran.
