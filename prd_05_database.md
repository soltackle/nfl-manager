# PRD Bölüm 5: Veritabanı Mimarisi ve Migrasyonlar (supabase/migrations/)

Bu belge, Supabase Postgresql veritabanının yapısını, verilerin tutulduğu tabloları ve zamanla bu tabloları değiştiren (migration) SQL dosyalarının içeriklerini açıklamaktadır.

### Temel Şema Migrasyonları (Initial Schema)
Projenin temel yapı taşlarını inşa eden ilk SQL dosyalarıdır.
- **`001_initial_schema.sql`**: Uygulamanın iskeletini oluşturur.
  - `users`: Supabase Auth ile entegre, sisteme kayıtlı üyelerin profil bilgilerini tutar.
  - `leagues`: Lig bilgilerini (isim, durum: open/drafting/playing/finished, şifre) barındırır.
  - `franchises`: Oyuncuların oluşturduğu takımları temsil eder. Kulüp adı, kısaltması, bütçesi ve stadyum detayları burada tutulur. `league_id` ile `leagues` tablosuna bağlıdır.
  - `players`: NFL oyuncularının isim, OVR, hız, güç, sözleşme, takım (`franchise_id`) gibi detaylarını tutan en büyük tablodur.
  - `matches` & `match_events`: Fikstürü, takım skorlarını ve maç anındaki pozisyon (Play-by-play) loglarını tutan veritabanı yolları.
- **`002_admin_role.sql`**: Rol (Role) bazlı yetkilendirme (RBAC) yapar. Belirli User ID'lerine `admin` bayrağı ekler ve bu adminlerin sistem fonksiyonlarını (maç başlatma vb.) çağırabilmesi için veritabanı politikalarını düzenler.
- **`004_fix_users.sql`**: İlk şemada oluşmuş olan foreign key uyuşmazlıklarını ve profil resmi senkronizasyon hatalarını düzelten yama (patch) dosyası.

### Ekonomi ve Market Sistemi
- **`003_economy_schema.sql`**: Takımların bütçe takibini sağlayan tablolar.
  - `transactions`: Oyuncu alış, satış, stadyum inşaatı veya görev ödülü gibi tüm finansal hareketlerin geçmişini (Ledger) tutar. (Tutar, Tip, Tarih, Franchise ID)
  - `market`: Satış listesine konmuş oyuncuların ilan (listing) verilerini tutar.
- **`20260605160000_economy_overhaul.sql`**: Oyun ekonomisini enflasyondan korumak için maaş limitlerini (Salary Cap), transfer vergilerini ve günlük jeton (Coin) iddia (claim) kısıtlamalarını ekleyen geniş çaplı ekonomi düzeltmesi.
- **`20240531202200_deduct_club_fund.sql`**: Supabase Trigger kullanarak, transfer yapıldığında bakiyeyi otomatik ve güvenli bir şekilde cüzdandan (franchise tablosu) düşen veritabanı tetikleyicisi.

### Draft, Taktik ve Antrenman Mekanikleri
- **`20260601042949_add_traits_to_players.sql`**: Oyunculara `traits` (Yetenekler - JSONB) sütununu ekler. Böylece her oyuncunun temel OVR puanının ötesinde "Hızlı Okuyucu", "Tank" gibi özel yetenekleri veritabanında saklanabilir.
- **`20260601150231_add_coaches_table.sql`**: `coaches` tablosunu yaratır. Baş antrenör, OC ve DC pozisyonlarının felsefelerini (Pass Heavy, Run Stop) takımlarla eşleştirir.
- **`20240531200100_draft_policies.sql` & `..._draft_deadline.sql`**: Draft sisteminin RLS (Satır Bazlı Güvenlik) kurallarını belirler. Draft başladıktan sonra bir sıranın (Pick) yasal olup olmadığını ve sıra süresinin aşıldığında sistemin otomatik seçim yapmasını sağlayan mantık güncellemeleri.
- **`20260606011000_add_punter_enum.sql`**: Özel bir takım pozisyonu olan (Special Teams) Punter ve Kicker mevki Enum listelerine veritabanı üzerinden dahil edilir.

### Gelişmiş Özellikler ve Realtime Entegrasyonu
- **`20260605200000_enable_realtime_chat.sql`**: Lig içi mesajlaşma için `messages` tablosunu oluşturur ve Supabase'in "Realtime" özelliğini (Publication) bu tablo için aktif hale getirir. Böylece Frontend `useChat` hook'u ile anlık mesaj dinleyebilir.
- **`20260605013100_create_user_quests.sql`**: Günlük/Haftalık görev sisteminin veritabanı yapısı. (Örn: `id`, `quest_type`, `progress`, `is_claimed`).
- **`20260605101831_add_password_to_leagues.sql`**: Liglere özel birleştirme (Join) mekanizması ekleyerek kapalı / arkadaşa özel liglerin (Private Leagues) parolalarını tutan bir `password_hash` sütunu oluşturur.

### Güvenlik (RLS - Row Level Security)
Veritabanına frontend üzerinden yapılan doğrudan isteklerin hileye karşı korunmasını sağlayan kurallar içerir.
- **`20240531184700_training_rls.sql`**: Menajerlerin sadece "kendi takımlarına" ait oyuncuları antrenmana sokabilmesini güvence altına alan SQL politikası.
- **`20240531195800_league_update_policy.sql`**: Menajerlerin lig kurallarını veya adını kafalarına göre değiştirmesini engelleyen, bunu sadece yetkili admin'in veya lig kurucusunun yapmasına izin veren RLS güncellemesi.
- **`20240531193000_force_admin.sql`**: Kötü niyetli kullanıcıların API üzerinden "isAdmin=true" gibi istekler atıp rolünü yükseltmesini engelleyen güvenlik yaması.

### Raporlama ve İstatistikler
- **`20260605013700_add_user_stats.sql`**: Kullanıcıların kariyer geçmişini tutar. "Kazanılan Maç", "Şampiyonluklar", "Kazanılan Toplam Jeton" gibi tüm zamanların verilerini depolayan bir sayaç (counter) tablosu oluşturur.

> **Özetle:** Supabase Migrations klasöründeki dosyalar sırayla çalışır. Boş bir Postgresql veritabanını alıp; tabloları, aralarındaki bağları (foreign keys), kullanıcı haklarını (RLS), otomatik tetikleyicileri (Triggers) ve gerçek zamanlı yayın (Realtime Publications) mekanizmalarını inşa ederek sistemi NFL Manager'ın karmaşık yapısına hazır hale getirir.
