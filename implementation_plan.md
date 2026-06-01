# Koçluk Sistemi ve Taktik Savaşları Entegrasyonu

Bu belge, oyuna eklenecek olan yeni "Savunma Koçu (Defensive Coordinator / Head Coach)" sisteminin ve maç motorundaki taktiksel dengelemenin teknik tasarımını içermektedir.

## User Review Required

> [!IMPORTANT]
> **Aşağıdaki kritik kararlar için onayınız veya geri bildiriminiz gereklidir:**
> 1. **Koç Seçim Ekranı:** Draft bittikten hemen sonra yöneticiler ana ekrana (Dashboard) gitmeden önce zorunlu bir "Koç Seçim (Coach Selection)" ekranına mı yönlendirilsin? Yoksa bu işlem Transfer/Personel ekranından istenildiği zaman mı yapılsın? (Şu anki plana göre Draft sonrası zorunlu ekran olarak kurgulandı).
> 2. **Koç Ücretleri:** Koçların bir maaşı veya işe alım bedeli (AmFutCoin) olsun mu, yoksa sezonluk ücretsiz bir tercih mi olsun?
> 3. **Hücum Koçu:** Şu anda sadece "Savunma Koçu" üzerinden bir dengeleme istediniz. İleride Hücum Koçu (Offensive Coordinator) da eklenecek şekilde genel bir `coaches` altyapısı kuruyorum, uygun mudur?

## Open Questions

> [!TIP]
> - Koçların sahip olabileceği *Trait (Özellik)* havuzu için özel bir isim tercihiniz var mı? (Örn: "Blitz Ustası", "Duvar", "Zihin Okuyucu" vb.)

## Proposed Changes

Değişiklikler üç ana katmanda yapılacaktır: Veritabanı, Arayüz (Frontend) ve Maç Motoru (Backend).

---

### Veritabanı (Database)

#### [NEW] `supabase/migrations/XXX_add_coaches.sql`
- `coaches` tablosu oluşturulacak.
  - `id`, `name`, `prediction_rating` (Tahmin yüzdesi, Örn: 60-90 arası), `traits` (JSONB)
- `franchises` tablosuna `defensive_coach_id` kolonu eklenecek.

---

### Arayüz (Frontend)

#### [MODIFY] `src/hooks/useDraft.ts` & `src/pages/draft/DraftPage.tsx`
- Draft bittiğinde `window.location.href = '/dashboard'` yerine `window.location.href = '/coach-selection'` olarak güncellenecek.

#### [NEW] `src/pages/coach-selection/CoachSelectionPage.tsx`
- Kullanıcının karşısına sistem tarafından rastgele üretilmiş 3 farklı Koç çıkarılacak.
- Her koçun Tahmin Yüzdesi (Prediction Yeteneği) ve 2 adet Trait'i görünecek.
- Kullanıcı birini seçtiğinde bu koç takımın `franchises` verisine kaydedilecek ve ardından Dashboard'a geçilecek.

---

### Maç Motoru (Supabase Edge Functions)

#### [MODIFY] `supabase/functions/admin-simulate-match/index.ts`
- **Taktiksel Çarpışma Mantığı:** 
  - Maç motoru her *Down* için hücumun oyun planını (Koşu veya Pas) ve savunmanın dizilişini çekecek.
  - **Uyumsuzluk (Mismatch) Senaryosu:** Eğer hücum takımı Pas oynarsa ve savunma ağır koşu (Blitz/Run Stop) dizilişindeyse, hücum tarafı matematiksel olarak büyük bir avantaj elde edecek.
- **Tahmin ve Dengeleme Sistemi:**
  - Uyumsuzluk olduğu anlarda *Savunma Koçu* devreye girecek.
  - Koçun `prediction_rating`'i oranında bir zar atılacak. (Örn: %75).
  - **Başarılı Tahmin:** Koç rakibin oyununu önceden okur ve savunmayı son saniyede (Audible) doğru dizilişe kaydırır. Hücumun avantajı sıfırlanır, taktiksel savunma zarı uygulanır.
  - **Başarısız Tahmin:** Savunma hazırlıksız yakalanır ve hücum avantajı kullanır (Fakat uçuk farklı skorları engellemek için maksimum hasar %20 başarısızlık limitiyle sınırlandırılır).
- **Koç Traitleri:**
  - Koçların özellikleri maçın kritik anlarında devreye girecek. Örn: *"Red Zone Duvarı"* özelliğine sahip koç, son 20 yarda içinde rakibin pas şansını ekstra düşürecek.

## Verification Plan

### Automated Tests
- `admin-simulate-match` fonksiyonu lokal ortamda çalıştırılarak, farklı taktiklere sahip iki takımın skorlarının 70-0 gibi uçuk farklara ulaşmadığı, aksine 24-21, 17-14 gibi NFL standartlarında taktiksel savaşlara sahne olduğu izlenecek.

### Manual Verification
- Bir lig kurulup draft tamamlanacak.
- Draft sonrası sistemin bizi "Koç Seçim" ekranına atıp atmadığı kontrol edilecek.
- Seçilen koçun özelliklerinin kadro/taktik ekranında görünüp görünmediği test edilecek.
