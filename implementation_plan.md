# Gelişmiş Taktik Matrisi (Play Call Sheet) Entegrasyonu

Bu belge, gerçek NFL koçlarının kullandığı durumsal (situational) taktik kağıdının (Play Call Sheet) oyuna entegre edilmesini sağlayacak değişiklikleri içerir. Bu sistem sayesinde menajerler, maçın her farklı anı için (Down, Mesafe, Saha Konumu) ayrı bir oyun stratejisi belirleyebilecek ve maç motoru bu spesifik kararları çarpıştıracaktır.

## User Review Required

> [!IMPORTANT]
> **Kritik Kararlar ve Onaylar:**
> 1. **Mevcut "Slider" Sistemi:** Önceden tasarladığımız "Temel Felsefe" (Tempo, Pas Oranı vb.) slider'larını tamamen kaldırıp sadece bu detaylı matrise mi geçelim, yoksa Slider'lar genel katsayıyı (bonus/malus) belirleyip Matris spesifik oyunu mu seçsin? (Önerilen: Slider'lar kalsın, koçun genel ruh halini yansıtsın. Matris ise o anki net hamleyi (Play) belirlesin).
> 2. **Senaryo Havuzu:** Hücum için (Power Run, Outside Run, Short Pass, Deep Bomb, Play-Action, Screen Pass) ve Savunma için (Run Stop, Balanced, Pass Def, Blitz, Dime/Prevent, Red Zone Wall) seçeneklerini kurguladım. Eklemek istediğiniz bir oyun tipi var mı?

## Open Questions

> [!TIP]
> - "The Script" (İlk 15 Oyun) mekaniğini bu aşamada Matrise ekleyelim mi? Yoksa sadece Down&Distance ve Field Position'ı mı yapalım? (Şu anki plana The Script dahil edilmemiştir, matrisin çok karmaşık olmaması için adım adım gidilmesi tavsiye edilir).

## Proposed Changes

### 1. Veritabanı (Veri Yapısı)

Mevcut `tactics` tablosundaki `slider_ayarlari` JSONB objesine yeni bir `playbook` alanı eklenecektir. Migration (SQL) gerektirmez, doğrudan kod üzerinden JSON yapısı genişletilecektir.

```json
"playbook": {
  "offense": {
    "first_down": "play_action",
    "second_short": "power_run",
    "second_long": "short_pass",
    "third_short": "power_run",
    "third_long": "deep_bomb",
    "red_zone": "short_pass",
    "goal_line": "power_run",
    "backed_up": "power_run"
  },
  "defense": {
    "first_down": "balanced",
    "second_short": "run_stop",
    "second_long": "pass_def",
    "third_short": "run_stop",
    "third_long": "dime_prevent",
    "red_zone": "red_zone_wall",
    "goal_line": "goal_line_stand",
    "backed_up": "blitz"
  }
}
```

### 2. Arayüz (Frontend)

#### [MODIFY] `src/pages/tactics/TacticsPage.tsx`
- Mevcut "Oyun Odakları (Focus)" bölümü kaldırılarak, yerine devasa ve profesyonel görünümlü bir **Durumsal Taktik Matrisi (Situational Matrix)** eklenecek.
- Tabloda 8 farklı durum (1st Down, 2nd&Short, 2nd&Long, 3rd&Short, 3rd&Long, Red Zone, Goal Line, Backed Up) listelenecek.
- Her durum için bir "Hücum Tercihi" ve bir "Savunma Tercihi" seçilebilen Dropdown/Buton grupları olacak.
- Tasarım bir Head Coach klasörüne benzeyecek.

### 3. Maç Motoru (Supabase Edge Functions)

#### [MODIFY] `supabase/functions/admin-simulate-match/index.ts`
- **Durum Tespiti (Situation Engine):** Oyun motoru artık her *Down* başında sahadaki durumu analiz edecek.
  - Mesafe (Distance) <= 3 ise `short`, > 3 ise `long`.
  - Yard Line >= 80 ise `red_zone`, >= 95 ise `goal_line`.
  - Yard Line <= 10 ise `backed_up`.
- **Dinamik Oyun Seçimi:** Motor, statik bir hücum odağı (`off_focus`) yerine, durum analizine göre menajerin `playbook` JSON'ından o anki durumu bulup ilgili oyunu çekecek.
- **Matematik ve Katsayılar:** 
  - Örneğin, hücum `third_long` durumunda "Screen Pass" oynamışsa ve savunma "Dime/Prevent" yapmışsa, savunma ekran pasına hazırlıklı olmadığı için hücuma bonus verilecek.
  - Önceden yazdığımız "Koç Tahmin Sistemi" bu yeni durumsal oyunlara entegre edilecek. (Örn: Savunma koçu, 3. hakta rakibin pas atacağını okursa savunmayı `pass_def`'e kaydıracak).
- **Spiker Logları:** Spiker artık durumu daha belirtecek. "3. Hak ve uzun mesafede menajer derin bir bomba çizdi!" şeklinde raporlar verilecek.

## Verification Plan

### Automated Tests
- `admin-simulate-match` fonksiyonuna statik bir test verisi gönderilerek, maç motorunun 3. haklarda gerçekten Playbook'taki 3rd down oyununu çekip çekmediği loglanacak.
- Red zone içindeyken (yardLine > 80) motorun otomatik olarak Red Zone taktiklerine geçiş yaptığı teyit edilecek.

### Manual Verification
- Arayüzde Taktik sayfasına girilip tüm matris doldurulacak ve kaydedilecek.
- Veritabanına `playbook` formatında doğru kaydedildiği gözlemlenecek.
- Bir maç simüle edilecek ve spiker loglarında, ayarlanan spesifik durumsal taktiklerin işlediği teyit edilecek.
