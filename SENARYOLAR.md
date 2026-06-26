# amfutmanager — Oyun Senaryoları & Test Kataloğu

Oyundaki **tüm** akışlar + uç/hata durumları. Birlikte test edip **Durum** sütununu dolduracağız.

**Durum kodları:** ⬜ test edilmedi · ✅ çalışıyor · ❌ hata var · 🔧 bu oturumda düzeltildi (tekrar doğrulanacak) · ⚠️ bilinen eksik/yarım özellik

> Test ortamı notu: Edge function'lar ağ üzerinden bu ortamdan çağrılamadığı için aşağıdakiler **DB simülasyonu + statik denetim** ile bakıldı; ❗gerçek UI testini sen yapınca işaretleyeceğiz.

## ✅ Bu oturumda otomatik doğrulananlar
- **Şema denetimi (otomatik, 55 fonksiyon + frontend):** TÜM **canlı** fonksiyonlar artık şema-temiz — gerçek olmayan tablo/kolon/RPC referansı yok. Tespit edilen tüm uyumsuzluklar ya düzeltildi ya da **ölü (frontend çağırmayan) fonksiyonlarda** kaldı.
- **DB simülasyonuyla uçtan uca doğrulandı (hepsi rollback'li):** çekirdek zincir (lig→franchise→oyuncu→taktik→fikstür→maç motoru: matches=1/played=1), market satın alma (50M→49M), 5 cron işi (fa-market 300→243), **sezon sonu** (serbest bırakma + status=waiting + puan sıfır + şampiyon +500 + depth_chart silme), güvenlik (admin_delete_league yetki açığı).
- **Bu oturumda düzeltilen CANLI hatalar:** maç motoru bozukluğu · `players.league_id` · `tactics.ilk_11_oyuncu_ids` · `players.progression` · `leagues.current_week` · `achievements` (user_achievements→achievements, deploy) · `market-transactions` (name→team_name, deploy) · admin_delete_league yetki açığı.
- **Sonuç:** Çekirdek backend çalışıyor. Geriye **UI/runtime testleri (sen)** + opsiyonel ölü fonksiyon temizliği kaldı.

---

## 0) Erişim & Route Koruyucuları (guards)
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| G1 | Bakım modu AÇIK → her sayfa `/tadilat`'a yönlenir | Sadece Tadilat sayfası | ⬜ |
| G2 | Bakım modu KAPALI → normal erişim | Normal | 🔧 (maintenance_mode=false yapıldı) |
| G3 | Giriş yapılmadan korumalı sayfa → `/login` | Login'e yönlenir | ⬜ |
| G4 | Franchise yokken oyun sayfası → `/setup` | Kurulum'a yönlenir | ⬜ |
| G5 | Franchise var ama oyun aktif değil → lobby/team-creation | Doğru ara sayfa | ⬜ |
| G6 | Admin olmayan `/admin` → engellenir/yönlenir | Erişim yok | ⬜ |

## 1) Kimlik (Auth)
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| A1 | E‑posta + şifre ile **kayıt** | `public.users` satırı oluşur | 🔧 (handle_new_user trigger eklendi) |
| A2 | `soltackle0@gmail.com` kaydı → **otomatik admin** | role='admin' | 🔧 (bootstrap trigger) |
| A3 | E‑posta onayı AÇIKsa giriş engeli | "e‑postanı onayla" | ⬜ (gerekirse Auth'ta kapat) |
| A4 | Doğru e‑posta/şifre ile **giriş** | Oturum açılır | ⬜ |
| A5 | Yanlış şifre | Hata mesajı | ⬜ |
| A6 | **Google ile giriş** (provider açıkken) | Oturum açılır | ⬜ (Google OAuth kurulumu gerekli) |
| A7 | Google provider kapalıyken | "provider is not enabled" | ❌ (GOOGLE_GIRIS_KURULUMU.md ile çözülecek) |
| A8 | Aynı e‑posta ile 2. kayıt | Hata (zaten var) | ⬜ |
| A9 | Çıkış (signOut) | Oturum kapanır | ⬜ |
| A10 | Sayfa yenileme → oturum korunur | Giriş kalır | ⬜ |
| A11 | Ücretsiz plan e‑posta limiti (saatlik) | Çok kayıtta limit | ⚠️ (Google'a geçiş öneriliyor) |

## 2) Slot & Franchise Seçim
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| S1 | Slot ekranı → mevcut franchise'ları gör | Liste | ⬜ |
| S2 | Boş slottan yeni franchise → `/setup` | Kurulum açılır | ⬜ |
| S3 | Birden fazla slot (çoklu takım) | Her slot ayrı franchise | ⬜ |

## 3) Onboarding / Franchise Kurulum
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| O1 | Takım adı + şehir (serbest) + logo seç → oluştur | Franchise + stadium (trigger) | ⬜ |
| O2 | Kurulumdan sonra otomatik lig eşleştirme | auto-matchmake | ⬜ |
| O3 | Boş ad/şehir validasyonu | Engellenir | ⬜ |
| O4 | Emoji logo seçimi (şimdilik) | Seçilen logo kaydedilir | ⚠️ (gerçek logolar GORSEL_PROMPTLARI.md) |

## 4) Lig Yaşam Döngüsü
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| L1 | Auto-matchmake: bekleyen lige katıl / yeni aç | league_members + franchise.league_id | 🔧 (players.league_id eklendi) |
| L2 | Lig lobisi: üyeler + durum | Liste + status | ⬜ |
| L3 | 60 dk sonra bot doldurma (cron-fill-bots) | Eksikler bot olur | ⬜ |
| L4 | Admin/lig bot doldurma (admin-fill-bots / league-fill-bots) | Bot eklenir | ⬜ |
| L5 | Durum geçişleri waiting→draft→active→playoffs→completed | Doğru akış | ⬜ |
| L6 | Draft zamanı ayarla (league-set-draft-time) | Zaman kaydı | ⬜ |
| L7 | Draft başlat (league-start-draft) → lig oyuncu havuzu üretilir | draft_session + players(league_id) | 🔧 |
| L8 | Takım kurma başlat (league-start-team-creation) | status=draft, havuz | 🔧 |
| L9 | Lige katıl (join-league) | Üye olur | ⬜ |

## 5) Draft
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| D1 | Sıradaki seçim + deadline gösterimi | draft_session okunur | ⬜ |
| D2 | İnsan oyuncu seçer (make-draft-pick) | draft_pick + player.franchise_id | 🔧 (league_id şema) |
| D3 | Sıradaki bot → otomatik seçim zinciri | Botlar otomatik seçer | ⬜ |
| D4 | Süre dolunca otomatik seçim (is_timeout) | Otomatik pick | ⬜ |
| D5 | Snake sıralama (tek/çift round ters) | Doğru sıra | ⬜ |
| D6 | "Sıra sende değil" | Hata | ⬜ |
| D7 | Draft bitişi (round>8) → yedek oyuncular + fikstür + lig aktif | generate_fixtures + status=active | 🔧 |
| D8 | Havuz lige özel (başka lig oyuncusu gelmez) | league_id filtresi | 🔧 |

## 6) Takım Kurma
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| T1 | Koç seçimi (offensive/defensive) | coaches kaydı | ⬜ |
| T2 | 12 oyuncu seç → finalize-team | roster + 18 yedek (toplam 30) + taktik | 🔧 (ilk_11_oyuncu_ids + league_id) |
| T3 | Tam 12 değilse | Hata | ⬜ |
| T4 | Bütçe yetersiz | Hata | ⬜ |
| T5 | Pozisyon gereksinimleri (1QB,1RB,2WR...) | Doğrulama | ⬜ (kodda kural yorumlanmış) |
| T6 | Tüm insanlar bitince → lig aktif + fikstür | status=active | 🔧 |
| T7 | player-ready işareti | is_ready güncel | ⬜ |

## 7) Kadro / Derinlik Şeması
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| R1 | Kadroyu gör (franchise-roster) | Oyuncu listesi | ⬜ |
| R2 | Derinlik şeması ayarla (franchise-depth-chart) | depth_charts kaydı | ⬜ |
| R3 | Oyuncu yeniden adlandır (rename-player) | name güncellenir | ⬜ |

## 8) Taktik
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| TC1 | Slider + playbook (durumsal) + saat yönetimi kaydet | tactics.slider_ayarlari | ⬜ |
| TC2 | Signature play / 4. hak kararları | Maç motorunda etki | ⬜ |
| TC3 | Varsayılan taktik (takım kurmada) | Otomatik oluşur | 🔧 |

## 9) Maçlar
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| M1 | Fikstür listesi | matches haftaya göre | 🔧 (league-fixtures match_time→week; canlı akış doğrudan sorgu) |
| M2 | Sıradaki maç (matches-next) | Oynanmamış maç | 🔧 (status/match_time düzeltmesi) |
| M3 | Admin maç simülasyonu (admin-simulate-match, tam motor) | Skor + drive log | 🔧 (motor düzeltildi+doğrulandı) |
| M4 | Günlük otomatik maç (pg_cron match-engine 17:00) | Oynanmamışlar simüle | 🔧 (DB testi: matches=1 played=1) |
| M5 | Maç sonucu sayfası (match/:id): skor + anlatım | matches + match_drive_logs | ⬜ |
| M6 | Puan tablosu (league-standings/mini) | Galibiyet 2 / beraberlik 1 | 🔧 (DB testi geçti) |
| M7 | Lider tablosu (leaderboard) | Sıralama | ⬜ |
| M8 | Beraberlikte OT (admin motor) | 3 puanlık FG ile bozulur | ✅ (motor mantığı) |

## 10) Market / Transfer
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| MK1 | Serbest oyuncu listesi (useMarket/market-free-agents) | franchise_id null + league_id | 🔧 (overall_rating→overall; canlı akış doğrudan sorgu) |
| MK2 | Serbest oyuncu satın al (buy_free_agent / market-transactions buy_fa) | Kadroya + bütçe düşer | 🔧 (DB testi: 50M→49M) |
| MK3 | Oyuncuyu satışa çıkar (market-transactions list_player) | status=listed + chat | 🔧 (team_name düzeltmesi) |
| MK4 | Listelenen oyuncu satın al (buy_listed) | Transfer + %5 vergi + satıcıya öder + chat | 🔧 |
| MK5 | Takas teklifi (process-trade) | trade_offers kaydı | ⬜ |
| MK6 | Takas kabul/ret (process-trade) | Oyuncular+coin transfer | ⬜ |
| MK7 | Bütçe yetersiz | Hata | ⬜ |
| MK8 | Kendi oyuncunu/kendi takımını alma | Hata | ⬜ |

## 11) Antrenman
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| AN1 | Antrenman başlat (start-training/training-start) | training_sessions | ⬜ |
| AN2 | Antrenman tamamla (process-training / cron 30dk) | overall +2..5 | 🔧 (cron DB testi geçti) |
| AN3 | Antrenman tesisi seviyesinin etkisi | Hız/bonus | ⬜ |

## 12) Scout (Gözcü)
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| SC1 | Scout görevi başlat (scout-start): 100 coin, pozisyon | scout_missions + coin düşer | ⬜ |
| SC2 | Scout topla (scout-claim): oyuncu seç | Seçilen kadroya, diğerleri FA | 🔧 (league_id şema) |
| SC3 | Günlük scout limiti (created_date) | Aynı gün engeli | ⬜ |
| SC4 | Yetersiz coin | Hata | ⬜ |

## 13) Mağaza
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| SH1 | Güç boost al (shop-purchase power_boost) | active_boost set, coin düşer | ⬜ |
| SH2 | Oyuncu geliştirme al | overall +1 | ⬜ |
| SH3 | Yetersiz coin | Hata | ⬜ |
| SH4 | Alışveriş görevi sayacı (shop_bought) | +1 | ⬜ |

## 14) Ekonomi
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| E1 | Bakiye gösterimi (user-balance) | amfutcoin | ⬜ |
| E2 | Günlük ücretsiz coin (claim-free-coins) | +50, cooldown | ⬜ |
| E3 | Cooldown dolmadan tekrar | Engellenir | ⬜ |
| E4 | Maç ödülü + sponsor geliri | club_fund/amfutcoin artar | ✅ (motor mantığı) |

## 15) Görevler (Quests)
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| Q1 | Görevleri getir (get-quests) + günlük reset | user_quests | ⬜ |
| Q2 | Görev topla (claim-quest): login/friendly/shop | Ödül + claimed | ⬜ |
| Q3 | Tamamlanmamış görev topla | Hata | ⬜ |

## 16) Başarımlar
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| AC1 | Başarımları gör (achievements) | Kullanıcının satırları | 🔧 (user_achievements→achievements, deploy) |
| AC2 | Başarım topla (achievements-claim) | is_claimed | ⚠️ (verme mantığı henüz yok; satır oluşmuyor) |

## 17) Hazırlık Maçı
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| F1 | Hazırlık maçı simüle (simulate-friendly): 4 coin | Skor + progression artışı | 🔧 (players.progression eklendi) |
| F2 | Görev sayacı (friendly_played) | +1 | ⬜ |
| F3 | Yetersiz coin | Hata | ⬜ |

## 18) Kulüp / Stadyum / Sponsor / Koç
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| C1 | Kulüp durumu (club-status) | Bilgiler | ⬜ |
| C2 | Stadyum yükselt (upgrade-stadium): turf/capacity/practice | Seviye +1, fon düşer | ⬜ |
| C3 | Maks seviye (3) | Hata | ⬜ |
| C4 | Sponsor seç (safe/perf/risk) | Maç gelirine etki | ⬜ |
| C5 | Boost/turf/kapasite maç etkisi | Güç/gelir bonusu | ✅ (motor mantığı) |
| C6 | Koç tahmini (prediction_rating) | Maç motorunda etki | ✅ (motor mantığı) |

## 19) Profil / Sohbet
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| P1 | Profil: maç/galibiyet/xp/coin | Doğru istatistik | ⬜ |
| P2 | Lig sohbeti: mesaj gönder | league_chat | ⬜ |
| P3 | Sistem mesajları (transfer duyurusu) | Otomatik mesaj | 🔧 (team_name) |

## 20) Sezon Sonu
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| SE1 | Sezon sonu (admin-end-season / cron Paz 21:00) | Sıraya göre ödül + reset + status=waiting | 🔧 (cron port) |
| SE2 | Oyuncular serbest bırakılır, depth_chart silinir | franchise_id=null | ⬜ |

## 21) Admin Paneli
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| AD1 | İstatistikler (admin-get-stats) | users/leagues/matches | ⬜ |
| AD2 | Lig oluştur (admin-create-league) | league + oyuncu havuzu | 🔧 (players.league_id) |
| AD3 | Bot doldur (admin-fill-bots) | Botlar | ⬜ |
| AD4 | Draft simüle (admin-simulate-draft) | Otomatik draft | ⬜ |
| AD5 | Maç simüle (admin-simulate-match) | Tam motor skorları | 🔧 |
| AD6 | Sezon bitir (admin-end-season) | Ödül+reset | ⬜ |
| AD7 | Lig sil (admin_delete_league) | Sadece admin silebilir | 🔧 (yetki açığı kapatıldı) |
| AD8 | Geçici SQL (admin-temp-sql) | Çalışır | ⬜ |

## 22) Otomasyon (pg_cron)
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| CR1 | cleanup-logs (günlük) | Süresi geçen drive log silinir | 🔧 (test edildi) |
| CR2 | complete-training (30 dk) | Antrenman biter | 🔧 |
| CR3 | fa-market (saatlik) | +3 FA, %20 silinir | 🔧 (300→243 testi) |
| CR4 | match-engine (günlük 17:00) | Oynanmamışlar simüle | 🔧 |
| CR5 | season-end (Paz 21:00) | Sezon kapanır | 🔧 |

## 23) Kesişen Uç/Hata Durumları
| ID | Senaryo | Beklenen | Durum |
|----|---------|----------|-------|
| X1 | Yetkisiz işlem (başka franchise) | Hata | ⬜ |
| X2 | Oturum süresi dolması | Login'e yönlenir | ⬜ |
| X3 | Boş durumlar (lig/maç/FA yok) | Düzgün boş ekran | ⬜ |
| X4 | Eşzamanlı çift istek (double-click) | Çift işlem olmaz | ⬜ |
| X5 | Mobil/PWA (ana ekrana ekle) | Manifest ikonları | ⚠️ (ikonlar GORSEL_PROMPTLARI.md) |

---

## Bilinen eksikler / izlenecekler
- ⚠️ **Başarım verme mantığı yok** (AC2): `achievements` satırlarını oluşturan bir tetikleyici/kod yok — başarımlar hep boş gelir. İstersek ekleriz.
- ⚠️ **`leagues.current_week` otomatik artmıyor**: kolon eklendi ama haftayı ilerleten mantık yok; günlük maç cron'u "oynanmamış"a göre çalıştığı için engel değil.
- ⚠️ **Pozisyon kuralları yorum satırı** (T5): finalize-team'de katı pozisyon doğrulaması kapalı.
- ⚠️ **Ölü/legacy fonksiyonlar** (TEST_RAPORU.md): trade-offer, trade-respond, matches-result, draft-pick, market-free-agents, league-fixtures, matches-next — frontend çağırmıyor; silinebilir.

## Nasıl test edeceğiz
Sıra: önce **Auth → Onboarding → Lig → Draft → Takım Kurma** (çekirdek zincir), sonra **Maç → Market → Antrenman → Scout → Mağaza → Görev → Sezon**. Her satırı UI'dan dene; ❌ olanı bana söyle, hemen düzeltip yeniden deploy/push edelim.
