# Durumsal Taktik Matrisi (Play Call Sheet) Güncellemesi 🏈

Taktik sayfası ve maç motoru baştan aşağı yenilenerek, menajerlere tam anlamıyla bir "Head Coach" gibi **Durumsal Kararlar** verebilme yetkisi eklendi.

## 🛠️ Neler Yapıldı?

1. **Arayüz (TacticsPage) Güncellemesi:**
   - Eski statik "Hücum/Savunma Odağı" butonları kaldırıldı.
   - Yerine devasa bir **Durumsal Oyun Planı (Play Call Sheet)** tablosu eklendi.
   - Menajerler artık 8 farklı saha konumu ve hak/mesafe durumu için ayrı ayrı strateji (Örn: 3. Hak Kısa -> Ağır Koşu, Kırmızı Bölge -> Kısa Pas) atayabiliyor.

2. **Senaryo Havuzu Genişletildi:**
   - **Hücum:** Power Run (Ağır Koşu), Outside Run (Dış Koşu), Play-Action (Sürpriz Pas), Short Pass (Kısa Pas), Screen Pass, Deep Bomb (Derin Bomba), QB Scramble.
   - **Savunma:** Stop Run (Koşu Savunması), Pass Def (Alan Savunması), Man Coverage (Adam Adama), Blitz (Baskı), Dime/Prevent (Uzun Pas Koruma), Red Zone Wall, Goal Line Stand.

3. **Maç Motoru Zekası (`admin-simulate-match`):**
   - Maç motoruna **Durum Analizörü (Situation Analyzer)** eklendi.
   - Her 'Down' öncesinde, motor o anki durumu analiz ediyor (Yard Line kaçta? 3. Hak mı? Mesafe 7'den büyük mü?)
   - Bu duruma göre menajerin matrisine (Playbook) bakarak o anki oyun odağını çekiyor.
   - Yalnızca "Dime Savunması" gibi özel taktikler, durumsal maç motorunda doğru atakları sert şekilde cezalandırırken yanlış atakta (örneğin pas beklerken koşu yemek) paramparça oluyor.
   - Spiker logları yeni taktiklerin tamamını tanıyarak, *"Screen pası Blitz'i cezalandırdı!"* veya *"Dime Savunması ezildi!"* gibi renkli geri bildirimler veriyor.

## 🧪 Nasıl Test Edilir?
- Takımınızın **"Taktik Tahtası"** sayfasına girdiğinizde yeni tabloyu görüp doldurabilirsiniz. "Kaydet"e bastığınızda bu devasa matris veritabanına sorunsuz kaydedilecektir.
- Test simülasyonu çalıştırdığınızda (Admin Panel üzerinden) maç motorunun tam da belirlediğiniz anlarda (Örn: Goal Line) belirlediğiniz stratejiye geçtiğini spiker üzerinden (Örn: "[DC Reid koşuyu sezdi, kutuyu doldurdu...]") görebileceksiniz.
