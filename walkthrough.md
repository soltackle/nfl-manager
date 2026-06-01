# Koçluk Sistemi ve Taktiksel Savaş Güncellemesi 🏈

Yeni eklenen **Savunma ve Hücum Koçu (Coordinator)** mekanikleri sayesinde takım stratejisi derinleştirilmiş ve uçuk skorlu maçların önüne geçilmesi için dengeleme (balancing) yapılmıştır.

## 🛠️ Neler Yapıldı?

1. **Veritabanı Güncellemesi (`coaches` tablosu):**
   - Oyuna özel `coaches` tablosu eklendi ve Supabase'e push edildi.
   - Koçlar `offensive` ve `defensive` olarak ikiye ayrıldı.
   - Her koçun bir `prediction_rating`'i (Tahmin/Oyun Okuma gücü) ve rastgele `traits`'leri bulunuyor.

2. **Koç Seçim Ekranı (Post-Draft UI):**
   - Kullanıcıların Draftı bitirdikten sonra (veya lig aktif olduğunda ancak koçları yoksa) yönelecekleri özel bir `/coach-selection` sayfası geliştirildi.
   - İsteğiniz doğrultusunda 20'şer adet özgün Hücum ve Savunma trait havuzu (Air Raid Master, Blitz Master vb.) oluşturuldu. 
   - Arayüzde rastgele 3 Hücum, 3 Savunma koçu sunuluyor, yönetici bunlardan birer tane seçerek sözleşme imzalıyor.

3. **Maç Motoru Güncellemesi (`admin-simulate-match` Edge Function):**
   - Maç motoru artık hücum (offense) ve savunma (defense) koçlarının güçlerini okuyor.
   - **Taktik Çarpışmaları (Mismatch):** 
     - Örneğin hücum "Deep Bomb" (Derin Bomba) atarken, savunma "Blitz" (Baskı) yaparsa bu hücum için büyük bir avantajdır.
     - **Tahmin Sistemi (Prediction):** Bu avantaj anında Savunma koçu devreye girer. Zar atılır. Eğer koç başarılı bir şekilde rakibi okursa (OVR'sine bağlı olarak), Blitz iptal edilir, savunma doğru dizilişe geçer ve hücumun avantajı elinden alınır. Hatta spiker metinlerinde *"Koç X hazırlıksız yakalandı!"* veya *"Koç X ekran pası çağırdı - BAŞARILI TAHMİN!"* şeklinde spiker geri bildirimleri eklenmiştir.

## 🧪 Nasıl Test Edilir?
- Veritabanındaki tüm lig verileri temizlenmişti, bu sayede sıfırdan bir lig oluşturup draftı bitirdiğinizde sistem otomatik olarak sizi **"Koç Ekibini Kur"** sayfasına yönlendirecektir.
- Oradan koçlarınızı seçip ardından Maç Simülasyonu çalıştırdığınızda (Admin Panel üzerinden), oluşacak spiker loglarında koçlarınızın oyunu nasıl okuduğuna dair metinler göreceksiniz.
