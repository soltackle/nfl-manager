# Oyun Senaryo Testi & Hata Düzeltme Raporu (2026-06-25)

Tüm oyun akışları DB seviyesinde + statik kod denetimiyle tarandı. Edge function'lar bu ortamdan ağ üzerinden çağrılamadığı için (sandbox→proje ağı kapalı) testler **veritabanı simülasyonu** ve **şema-kod çapraz denetimi** ile yapıldı.

## ✅ Bulunan ve düzeltilen KRİTİK hatalar (canlı akışları kırıyordu)

| # | Sorun | Etki | Çözüm |
|---|-------|------|-------|
| 1 | `admin-simulate-match` dosyası bozuktu (fazla `}`, NUL, CRLF) | Maç motoru boot olmuyordu | Düzeltildi + deploy + bayt-bayt doğrulandı |
| 2 | **`players.league_id` kolonu yoktu** ama 15+ fonksiyon kullanıyor | Draft, takım kurma, market, temizlik **çöküyordu** | Kolon eklendi (migration) |
| 3 | **`tactics.ilk_11_oyuncu_ids` kolonu yoktu** | `finalize-team` (takım kurma) **çöküyordu** | Kolon eklendi |
| 4 | **`players.progression` kolonu yoktu** | `simulate-friendly` (hazırlık maçı) **çöküyordu** | Kolon eklendi |
| 5 | **`leagues.current_week` kolonu yoktu** | `admin-simulate-match` (otomatik hafta) + admin paneli hata veriyordu | Kolon eklendi (default 1) |
| 6 | `achievements` fonksiyonu olmayan `user_achievements` tablosunu sorguluyordu | Başarımlar sayfası hata veriyordu | `achievements` tablosuna düzeltildi + deploy |
| 7 | `market-transactions` olmayan `franchises.name` kolonunu sorguluyordu (doğrusu `team_name`) | Oyuncu listeleme/satın alma **çöküyordu** | `team_name`'e düzeltildi + deploy + doğrulandı |

## ✅ DB seviyesinde doğrulanan akışlar (geri-alınan test verisiyle)

- **Tam yaşam döngüsü:** lig oluştur → 2 takım → oyuncu (league_id ile) → taktik (ilk_11 ile) → `generate_fixtures` → maç motoru → skor + drive log. **Sonuç: matches=1, played=1, drive_logs=1 ✅**
- **Market satın alma:** `buy_free_agent` RPC → oyuncu takıma geçti, bütçe 50M→49M ✅
- **5 cron işi** (cleanup/training/fa-market/season-end/match-engine) pg_cron'da çalışıyor; fa-market 300→243→geri alındı ✅
- **Güvenlik:** `admin_delete_league` yetki açığı kapatıldı (advisor 17→4) ✅

## ⚠️ Ölü / kullanılmayan (legacy) fonksiyonlar — frontend bunları ÇAĞIRMIYOR
Bunlar eski, bozuk kopyalar; aktif akış farklı fonksiyon kullanıyor. **Oyunu etkilemiyorlar.** Temizlik için silinebilirler:

- `trade-offer`, `trade-respond` → aktif akış **`process-trade`** (doğru, `trade_offers` kullanıyor)
- `matches-result` → frontend `matches` + `match_drive_logs`'u doğrudan okuyor
- `draft-pick` (olmayan `make_draft_pick` RPC'sini çağırıyor) → aktif akış **`make-draft-pick`** edge function
- `market-free-agents` → `useMarket` `players`'ı doğrudan sorguluyor
- `league-fixtures`, `matches-next` (olmayan `matches.status`/`match_time`) → frontend `matches`'i doğrudan okuyor
- `achievements-claim` → frontend'de hiç çağrılmıyor (başarım verme mantığı henüz yok)

## 🔎 Test edilemeyenler (öneri)
Edge function'ların **çalışma-zamanı** davranışı (gerçek HTTP çağrısı) bu ortamdan test edilemedi. Site canlıya alındıktan sonra UI'dan şu akışları bir kez elle denemeni öneririm: kayıt→admin, lig kurma→bot doldurma→draft, takım kurma, maç sonucu, market al/sat, takas, antrenman, scout, mağaza.

## 📌 Not: oyuncu gelişim mantığı
`leagues.current_week` artık var ama otomatik artmıyor; sezon haftası ilerletme mantığı (gerekiyorsa) ayrı bir geliştirme. Maç simülasyonu haftayı parametre olarak aldığı için bu akışı engellemiyor.
