# PRD Bölüm 4: Backend Edge Functions ve Sistem Scriptleri (supabase/functions/ & scripts/)

Bu belge, oyunun "iş mantığı"nı (Business Logic) ve güvenliğini sağlayan, hile yapılmasını önlemek için istemci yerine doğrudan sunucuda (Supabase Edge ortamında) çalışan Deno fonksiyonlarının içeriklerini inceler.

### Maç Motoru ve Lig Yönetimi
Oyunun kalbi olan simülasyon fonksiyonlarıdır.
- **`admin-simulate-match/`**: İki takımı (Ev Sahibi vs Deplasman) alır, Taktik matrislerini (`playbook`), oyuncu özelliklerini ve stadyum avantajını hesaplar. Gelişmiş bir rastgelelik (RNG) ve koç katsayıları kullanarak maçı pozisyon pozisyon oynatır (Down & Distance bazlı). Maç sonucu, oyuncu istatistikleri ve Play-by-play loglarını veritabanına kaydeder.
- **`admin-simulate-draft/` & `admin-fill-bots/`**: Ligi takımlarla (botlarla) dolduran ve draftı otomatik tamamlayan simülasyon araçları.
- **`league-fixtures/`**: Yeni kurulan veya yeni sezona geçen ligler için bir "Round-Robin" (Herkes birbiriyle) fikstür ağacı oluşturur. Maçları haftalara dağıtır.
- **`cron-daily-matches/`**: Github Actions veya pg_cron tarafından günlük tetiklenen zamanlanmış görevdir. Durumu `pending` olan ve zamanı gelmiş maçları bularak teker teker `admin-simulate-match` fonksiyonuna yollar.
- **`auto-matchmake/`**: Yeni kayıt olan bir takımı uygun bir lige yerleştiren, lig yoksa yeni bir lig yaratan eşleştirme sistemidir.
- **`admin-end-season/`**: 18 haftalık sezon bittiğinde (Tüm maçlar oynandığında) ligin kapanışını yapar, sıralamaya göre bakiye (coin) ödüllerini dağıtır, şampiyonu kaydeder ve lig statüsünü günceller.
- **`simulate-friendly/`**: Dostluk maçlarını simüle eder ancak oyuncu yorgunluklarına veya lig puan cetveline (`standings`) etki etmemesini sağlar.

### Oyuncu Yönetimi ve Taktikler
- **`tactics/`**: Kullanıcının frontend üzerinden yolladığı durumsal hücum ve savunma kararlarını (Playbook) alır, RLS doğrulaması yapar ve ilgili `tactics` tablosuna json formatında kaydeder.
- **`franchise-roster/` & `franchise-depth-chart/`**: Kullanıcı oyuncusunu serbest bıraktığında (cut) veya İlk 11 sırasını değiştirdiğinde, sunucu tarafında bunun kurallara (Maaş limiti aşımı var mı? Kadro minimum sayıya sahip mi?) uygunluğunu denetler.

### Ekonomi, Transfer Pazarı ve Ticaret (Trade)
Menajerlerin oyunda birbirleriyle girdiği mali işlemleri denetleyen güvenlik (anti-cheat) katmanıdır.
- **`market-list-player/`**: Menajer bir oyuncusunu transfer listesine koyduğunda çalışır. Fiyat sınırlarını kontrol eder ve `market` tablosuna ilanı ekler.
- **`market-buy/`**: Başka bir takımın oyuncusunu veya serbest pazardaki oyuncuyu alırken çalışır. Kulübün bakiyesinin yetip yetmediğini (Race-condition / Double Spend önlemleriyle) kontrol eder, para transferini yapar ve oyuncunun takım ID'sini günceller.
- **`trade-offer/` & `trade-respond/`**: İki menajer arasında takas (Trade) paketi (Örneğin "Sana 2 WR vereyim, sen bana 1 QB ve 500 Coin ver") oluşturulmasını, teklifin iletilmesini ve karşı taraf kabul/red ettiğinde onaylanmasını sağlayan lojik.
- **`claim-free-coins/` & `shop-purchase/` & `user-balance/`**: Günlük ücretsiz jeton alım sınırını (`last_claim_date`) denetler, mağazadan gerçek bakiye düşümünü yapar (stadyum isim hakkı, boost vb.).

### Antrenman, Gözlemci (Scout) ve Görevler
- **`start-training/` & `process-training/`**: Bir antrenman başlatıldığında cooldown (bekleme) süresi atar. Süre dolduğunda oyuncuların Strength, Speed gibi niteliklerine (Traits) formüle edilmiş zar atışlarıyla (RNG) +1 veya +2 OVR ekler.
- **`scout-start/` & `scout-claim/`**: Gözlemci yollama mekaniğini yönetir. Claim anında rastgele isimli ve potansiyelli (S, A, B, C grade) kurgusal bir "Free Agent" yaratarak pazar dışında menajere oyuncu hediye/satış imkanı sunar.
- **`claim-quest/`**: Kullanıcının günlük görev (Örn: Marketten oyuncu al) şartlarını yerine getirip getirmediğini DB'den okur ve onaylarsa ödülü yansıtır.

### Ortak Kütüphaneler (_shared/)
Fonksiyonların kendi aralarında kod tekrarı yapmamasını sağlayan paylaşımlı klasördür.
- **`cors.ts`**: Frontend'den gelen isteklere (Origin) izin veren standart HTTP başlıkları (Headers).
- **`auth.ts`**: İstek yapan kullanıcının Bearer JWT token'ını Supabase'den doğrulayan güvenlik modülü.
- **`playerUtils.ts`**: Rastgele oyuncu ismi, statüsü (OVR formülleri) üreten matematik jeneratörleri.

### Geliştirici Betikleri (scripts/)
Sunucuya yüklenmeyen, geliştiricinin lokal bilgisayarından CI (Continuous Integration) gibi ortamlara kadar sistemi test veya manipüle ettiği node.js/deno kodlarıdır.
- **`match-engine.ts`**: Maç motorunu UI beklemeden lokalde 1000 kere koşturarak "denge" (balance) testleri yapan script.
- **`seed-traits.js`**: Veritabanı ilk kurulduğunda tüm oyunculara isim, mevkilerine uygun başlangıç puanları ve rastgele yetenekler (Fast, Strong) ekleyen veri tohumlama (seeding) işlemi.
- **`cleanup.ts` / `wipe.js`**: Test maçlarını, spiker loglarını veya gereksiz (silinmiş/yetim kalmış) veritabanı satırlarını periyodik temizleyen bakım scriptleri.
