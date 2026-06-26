import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SPIKER_METINLERI = {
  "KISA_PAS_BASARILI": [
    "Pocket darmadağın olmadan [TEAM] pasörü buttonhook'a gözü kapalı topu bıraktı! [YARDS] yarda, hassas cerrahi gibi bir hamle!",
    "Tribünler titriyor! [TEAM] oyun kurucusu üçüncü alıcı açıktı, buldu! Out route'a tereyağı gibi işleyen bir pas — [YARDS] yarda kazanç!",
    "[TEAM] shotgun'dan snap aldı, sol tarafa döndü ve checkdown'ı gördü! Koşucu topu kaptı, ilerliyor, [YARDS] yarda bitiriyor!",
    "Savunma blitz göndermişti ama [TEAM] buna hazırdı! Hot route devreye girdi, hızlı release — [YARDS] yardalık zekice bir karar!",
    "Kısa ama altın değerinde! [TEAM] oyun kurucusu 3. hakta drag route'daki alıcısını buldu! [YARDS] yarda, first down için yeterli!",
    "Harika bir slant rotası! [TEAM] alıcısı ortadan bıçak gibi kesti ve topu göğsünde yumuşattı. [YARDS] yarda tıkır tıkır işliyor!",
    "[TEAM] hücumu çok sabırlı! Pasör flat'e sarkan tight end'i gördü ve yumuşak bir pasla işi bitirdi. [YARDS] yardalık temiz bir oyun.",
    "Baskı gelmeden top elden çıktı! [TEAM] kısacık bir curl rotasıyla savunmayı uyuttu ve [YARDS] yardayı hanesine yazdırdı.",
    "Hızlı bir RPO (Run-Pass Option) okuması! [TEAM] pasörü koşar gibi yapıp aniden çizgideki alıcıya fırlattı! [YARDS] yardalık müthiş akıl oyunu!",
    "Savunma geri çekilmişken altını oydular! [TEAM] kısacık bir pasla [YARDS] yardalık banko bir kazanç elde etti.",
    "[TEAM] pasörü ekranı harika kurdu! Blokerlar önde, alıcı arkada dans ediyor! [YARDS] yardalık tertemiz bir Screen Pass!",
    "Yüksek tempoda oynuyorlar! [TEAM] no-huddle hücumundan hemen sonra hızlı bir hitch rotasıyla [YARDS] yardayı cebe indirdi.",
    "Linebacker adımını yanlış atınca [TEAM] alıcısı boşluğu hemen doldurdu! Oyun kurucudan jilet gibi bir pas, [YARDS] yarda!",
    "İnanılmaz bir el-göz koordinasyonu! [TEAM] alıcısı seken topu son anda tuttu ve [YARDS] yardayı kurtardı!",
    "Sahanın patronu [TEAM] oyun kurucusu! Savunmayı gözleriyle kandırıp topu ters taraftaki boşluğa gönderdi. [YARDS] yardalık zekâ gösterisi!",
    "Savunmanın ortasındaki o küçücük delik! [TEAM] pasörü iğne deliğinden geçirdi, [YARDS] yardalık lazer atışı!",
    "Denge, zamanlama, kusursuzluk! [TEAM] receiver'ı dönüşünü yaptığı an top ellerindeydi! [YARDS] yarda cebe indi.",
    "Hızlı ve ölümcül! [TEAM] oyun kurucusu blitz'i görünce anında kararını verdi, [YARDS] yardalık harika okuma!",
    "Defansif back geç kaldı! [TEAM] slant rotasında adım avantajını aldı ve topu kapıp [YARDS] yarda götürdü.",
    "Yüksek IQ gerektiren bir play! [TEAM] hücumu savunmanın zone'unu esnetti ve aradaki boşluğa [YARDS] yardalık pası kondurdu."
  ],
  "DERIN_BOMBA_BASARILI": [
    "BOMBA! [TEAM] oyun kurucusu kanal gibi bir geçit buldu ve gözünü kırpmadan post route'a fırlattı! [YARDS] yarda, tam isabetle!",
    "Ay ışığında bir ok gibi süzüldü o top! [TEAM]'in alıcısı iki defender arasından sıyrılıp havadan kaptı! [YARDS] yarda unutulmaz bir play!",
    "Ses dalgaları tribünlerde çarpışıyor! [TEAM] oyun kurucusu scramble'dan çıkıp go route'a fişeği ateşledi! [YARDS] yarda — inanılması güç!",
    "Tek ayak üzerinde, çizginin tam içinde yakaladı! [TEAM] alıcısı sideline'da mucize gösterdi! [YARDS] yardalık kaya gibi sağlam bir play!",
    "Pocket'te çelik gibi direndi, savunma etrafında döndü ve son anda fırlattı! [YARDS] yarda HARIKA bir hedef [TEAM] için!",
    "Hava yollarının tek hakimi [TEAM]! Pasör topu stratosfere fırlattı, alıcı altına girdi ve indirdi! [YARDS] yardalık olağanüstü bir vurgun!",
    "Köşe yazarlarına malzeme çıktı! [TEAM] derinlerde öylesine bir boşluk buldu ki, bu pas [YARDS] yardalık bir şiir gibi yazıldı!",
    "Double coverage işe yaramadı! [TEAM] alıcısı havada asılı kaldı ve topu adeta söküp aldı! [YARDS] yardalık insanüstü bir çaba!",
    "Play action fake'i savunmayı dondurdu! [TEAM] pasörü arkaya sarkan receiver'ı gördü ve [YARDS] yardalık muazzam bir roket yolladı!",
    "Sahada yıldırım düştü sanki! [TEAM] oyun kurucusunun kolu resmen alev alıyor, [YARDS] yardalık derin bir darbe vurdu!",
    "Tüm savunmayı üstüne çekip arkaya yolladı! [TEAM] pasörü havan topu gibi fırlattı, [YARDS] yardalık göz kamaştırıcı pas!",
    "Savunmacı adım adım takip etti ama nafile! [TEAM] alıcısı havada uzanıp topu parmak uçlarıyla kaptı! [YARDS] yardalık mucize!",
    "Oyun kurucunun bileği kırılacak sandık! [TEAM] pasörü tüm ağırlığını vererek [YARDS] yardalık devasa bir pas yolladı!",
    "Sahanın diğer ucuna kargo teslimatı! [TEAM] alıcısı omuz üstünden bakarak topu yakaladı, [YARDS] yardalık destan yazıldı!",
    "Bütün stadyum ayağa kalktı! Havada süzülen bu [YARDS] yardalık [TEAM] pası jeneriklere girecek cinsten!"
  ],
  "ICERIDEN_SERT_KOSU": [
    "İki lineman arasındaki boşluktan bir parmak genişliği bile yok ama [TEAM] koşucusu bir şekilde içeri daldı! [YARDS] yarda zorla kopardı!",
    "[TEAM] fullback önde açıyor yolu, koşucu arkasından geliyor! Kask kaska, omuz omuza — ve [YARDS] yarda çıktı bu karanlık tünelden!",
    "Güneş batarken saha kızıla boyandı, ama [TEAM] koşucusu için tek renk var: ileri! [YARDS] yarda, bir santim dahi olsa ileri!",
    "[TEAM] hücum hattı kapı gibi açtı yolu ama savunma çabuk kapandı! [YARDS] yarda ancak kazanılabildi, bu trenches savaşı tam anlamıyla!",
    "Saat ilerliyor, yağmur çiseliyor ve [TEAM] yine aynı oyunu oynuyor! Güce güç! Koşucu kafasını kaldırmadan ilerliyor — [YARDS] yarda!",
    "Tıpkı bir buldozer gibi! [TEAM] koşucusu üç savunmacıyı sırtına aldı ve [YARDS] yarda sürükledi! Bu nasıl bir bacak kuvvetidir!",
    "İçerisi adeta bir cehennem ama [TEAM] koşucusu yanmayı göze alarak daldı! Kargaşanın içinden [YARDS] yarda çıkardı!",
    "[TEAM] hücum hattı karşı tarafı adeta paten sahasına çevirdi! Koşucu açılan otobandan [YARDS] yarda ilerledi!",
    "Çamur, ter ve kan! [TEAM] koşucusu head down (kafası eğik) girdi ve çarpışmaların arasından [YARDS] yardalık bir can suyu buldu!",
    "Savunma duvar ördü sandı ama [TEAM] o duvarı balyozla yıktı geçti! Sadece güç, saf güç! [YARDS] yarda cebe girdi.",
    "Bacakları durmak bilmiyor! [TEAM] koşucusu ilk temasta düşmedi, dönerek ilerledi ve [YARDS] yardayı koparıp aldı!",
    "Offensive line'dan muazzam bir bloklama! Okyanus gibi yarıldı savunma, [TEAM] koşucusuna sadece yürümek kaldı, [YARDS] yarda!",
    "Arkasından iki kişi asıldı ama nafile! [TEAM] koşucusu bir yük treni misali savunmacıları da peşinden [YARDS] yarda sürükledi!",
    "Daha snap alındığı an kafa kafaya çarpışma! Ancak [TEAM] koşucusu dengeyi buldu ve [YARDS] yardalık zorlu bir koşu çıkardı.",
    "Bu nasıl bir düşük ağırlık merkezi! [TEAM] koşucusu yere santimler kala doğrulup [YARDS] yarda daha gitmeyi başardı!"
  ],
  "DISARIDAN_KOSU_BASARILI": [
    "[TEAM] koşucusu sağ çizgiye saptı, defender önde bekliyordu ama juke o kadar keskin ki adam yerinde dondu! [YARDS] yarda tam gaz!",
    "Toss play! [TEAM] sahayı bir yana kaydırdı, blokerlar yolu temizledi ve koşucu açık alana döküldü! [YARDS] yarda harika bir çalışma!",
    "İzle şu ellerini, izle şu ayaklarını! [TEAM] koşucusu bir değil, iki defender'ı geçti ve [YARDS] yarda zihin açıcı bir play sergiledi!",
    "Saha dışındaki kalabalık dahi tutamadı nefesini! [TEAM] koşucusu end around'dan döktü kendini ve [YARDS] yarda çıkardı bu oyundan!",
    "Cornerback hazırdı ama [TEAM]'in hız roketi onu çoktan geçmişti bile! [YARDS] yarda — kimse tutamadı onu!",
    "Pitch toss yapıldı! [TEAM] koşucusu kenar çizgisine ip cambazı gibi tutunarak ilerledi, [YARDS] yardalık müthiş bir denge gösterisi!",
    "Sweep oyunu kusursuz işledi! [TEAM] hücum hattı köşeyi mühürledi ve koşucuya sadece çimlerde koşmak kaldı! [YARDS] yarda!",
    "Stiff arm! [TEAM] koşucusu savunmacıyı tek koluyla fırlatıp attı ve dışarıdan [YARDS] yardalık destansı bir depar attı!",
    "Bir spor araba gibi vites büyüttü! [TEAM] koşucusu açık alanı gördüğü an ivmelendi ve arkasında sadece toz bıraktı, [YARDS] yarda!",
    "Sanki ayaklarında kanat var! [TEAM] koşucusu sideline'a paralel öyle bir aktı ki, [YARDS] yardalık harika bir izlenim bıraktı.",
    "Müthiş bir yön değiştirme! [TEAM] koşucusu frene basıp savunmacıyı ekarte etti ve dışarıdan [YARDS] yardayı aldı!",
    "Dış hat koşularının şahikası! [TEAM] koşucusu bir dansçı edasıyla çizgide cambazlık yaparak [YARDS] yarda kaydetti!",
    "O nasıl bir spin move! [TEAM] koşucusu kendi etrafında dönerek savunmacıyı şaşkına çevirdi, [YARDS] yarda kazanıldı!",
    "Kamera bile takip etmekte zorlandı! [TEAM] koşucusunun dışarıdan başlattığı bu roket koşusu [YARDS] yarda kazandırdı!",
    "Kenar blokları o kadar iyi ki! [TEAM] alıcıları koşucuya yol açtı, ve o da bu iyiliği [YARDS] yarda ile taçlandırdı."
  ],
  "INCOMPLETE_PASS": [
    "Pocket hızla daralıyor! [TEAM] pasörü paniklemeden topu fırlattı ama o top hep yüksekte gidecekti. Incomplete pass.",
    "[TEAM] deep route'a gitti ama savunma zone coverage'la tüm alanı kapatmıştı! Pas gidecek yer bulamadı, zemine iniyor. Incomplete.",
    "İki alıcı için çizilmiş bir rota ama ikisi de kapalıydı! [TEAM] oyun kurucusu gecikti, sıkıştı ve top boşluğa gitti. Incomplete.",
    "Sert bir blitz rush altında [TEAM] pasörünün kolu tam kalkamamıştı! Top sağa saparak sideline'ın dışına çıktı. Incomplete pass!",
    "Throwaway kararı! Pocket çöküyordu, [TEAM] pasörü topu saha dışına attı. Akıllıca bir güvenlik tercihi ama yine de incomplete.",
    "Alıcı ve pasör aynı sayfada değildi! [TEAM] oyun kurucusu dışarı beklerken alıcı içeri kesti. Top çimlere öpücük kondurdu. Incomplete.",
    "Mükemmel bir savunma hamlesi! [TEAM] alıcısı tam topu kavrarken cornerback elini araya sokup topu düşürttü! Incomplete!",
    "Fazla hızlı, fazla sert! [TEAM] pasörü mermi gibi attı ama alıcının ellerinden sekti. Incomplete pass.",
    "Denge kaybı! [TEAM] oyun kurucusu geri adım atarken tökezledi ve pas havada süzülerek hedefsiz kaldı. Incomplete.",
    "Spike! [TEAM] zamanı durdurmak için topu yere vuruyor. Incomplete pass ama taktiksel bir hamle.",
    "Çok geriye düştü! [TEAM] pası o kadar arkaya gitti ki alıcı kendini yere atsa bile yetişemedi. Incomplete.",
    "Savunmanın fiziksel oyunu işe yarıyor! [TEAM] alıcısı rotadan savruldu ve pas boş bir yeşilliğe indi. Incomplete pass.",
    "Hakemler bile topun nerede olduğuna şaşırdı! [TEAM] pasörü baskıdan kurtulup attı ama bu tamamen körleme bir pastı. Incomplete.",
    "Şiddetli bir darbe! [TEAM] alıcısı tam topu kontrol edecekken yediği omuz darbesiyle top fırladı. Incomplete pass!",
    "Oyun kurucu elinden topu geç çıkardı. [TEAM] alıcısı çoktan sideline dışına çıkmıştı bile. Incomplete."
  ],
  "SACK": [
    "Üçlü blitz baskısı! [TEAM] oyun kurucusunun sağ tarafı çöktü ve içeriden gelen defender dümdüz yere serdi! [YARDS] yarda kayıp! SACK!",
    "Hem sağda hem solda kapı kapandı! [TEAM] pasörü scramble'a çalıştı ama şimdi zeminde yatıyor! [YARDS] yarda geri gitti! SACK!",
    "Edge rusher rüzgar gibi köşeyi döndü! [TEAM] sağ tackle hiçbir şey yapamadı! Oyun kurucusu yere çakıldı! [YARDS] yarda kayıp! SACK!",
    "Kar yağışı altında saha bembeyaz ama [TEAM] pasörünün hayali kara döndü! Defender omuzundan yakaladı ve savurdu! [YARDS] yarda kayıp! SACK!",
    "İki saniye içinde pocket yok oldu! [TEAM] oyun kurucusu topu elinde tutmak zorunda kaldı... ve büyük bedel ödedi! [YARDS] yarda kayıp! SACK!",
    "Görünmez adam! Kör noktadan gelen bir savunmacı [TEAM] pasörüne tren gibi çarptı! [YARDS] yardalık felaket bir SACK!",
    "Oyun kurucu neye uğradığını şaşırdı! [TEAM] offensive line'ı kağıt gibi yırtıldı ve [YARDS] yardalık SACK kaçınılmaz oldu!",
    "Coverage sack! Arkada kimse boşalmayınca [TEAM] oyun kurucusu beklemek zorunda kaldı ve sonunda yutuldu! [YARDS] yarda kayıp! SACK!",
    "Stadyum adeta kükrüyor! Savunmanın kalbi [TEAM] pasörünü merkezde ezip geçti! [YARDS] yarda geriye! SACK!",
    "Kurtulma şansı sıfırdı! [TEAM] pasörü formadan çekilerek yere çalındı! [YARDS] yardalık bu SACK hücumun belini büktü!",
    "Nefes bile aldırmadılar! Top snap edildiği an defender [TEAM] pasörünün üstüne çöktü! [YARDS] yardalık SACK!",
    "Yüksek perdeden bir savunma konseri! [TEAM] oyun kurucusunu iki kişi araya alıp adeta sandviç yaptı! [YARDS] yarda geriye SACK!",
    "Kaçacak delik aradı ama bulamadı! [TEAM] oyun kurucusu sahada daireler çizerken yere serildi! [YARDS] yarda kayıp! SACK!",
    "Büyük bir gürültü koptu sahada! [TEAM] pasörüne yandan öyle bir girdiler ki kaskı sarsıldı! [YARDS] yarda kayıp! SACK!",
    "O-Line tamamen uyumuş! Hiçbir bloklama gelmeyince [TEAM] oyun kurucusu ava giden avcı gibi avlandı! SACK! [YARDS] yarda geriye."
  ],
  "INTERCEPTION": [
    "[TEAM] red zone'da riske girdi! Pas atıldı... ama savunma linebacker'ı rotayı ezbere biliyordu sanki! Atladı, kaptı! INTERCEPTION!",
    "Rüzgar bu kez [TEAM]'in aleyhine esti! Pas saptı, hedeflenen alıcıya gitmedi — karşı takımın safety'si kapıştı! INTERCEPTION!",
    "Tüm saha dondu! [TEAM] pasörü presre aldandı, erken fırlattı topu... ve cornerback tam önünden geçerken kaptı! INTERCEPTION!",
    "Bu maçın dönüm noktası olabilir! [TEAM] oyun kurucusu route'u yanlış okudu, alıcı iç tarafa keserken pas dış tarafa gitti! INTERCEPTION!",
    "Taraftarlar şoku yaşıyor! [TEAM]'in pasörü endzone'a atış yaptı ama savunma hazırdı, konuşlanmıştı, bekliyordu! INTERCEPTION! Büyük kayıp!",
    "Tip drill çalışması sonuç verdi! [TEAM] alıcısının elinden seken top havada asılı kaldı ve savunma affetmedi! INTERCEPTION!",
    "Gözlerine inanamıyor! [TEAM] oyun kurucusu hiç görmediği bir defender'ın kucağına adeta hediye paketi bıraktı! INTERCEPTION!",
    "Zamanlama hatası! [TEAM] pasörü topu erken çıkardı, savunmacı rotanın önüne geçip topu çaldı! İnanılmaz bir INTERCEPTION okuması!",
    "Büyük umutlarla atılan derin bir pas... ama gökyüzünde [TEAM] alıcısından çok savunmacı vardı! Uçarak aldı topu! INTERCEPTION!",
    "Bu bir hırsızlık! [TEAM] pası alıcının tam kucağına iniyordu ki savunmacı aradan uzanıp topu söküp aldı! INTERCEPTION!",
    "Pasör adeta gözü kapalı attı! [TEAM] oyun kurucusunun o bölgede kendi adamı bile yoktu. Bedavadan bir INTERCEPTION!",
    "Muazzam bir atletizm! Savunmacı havada tam bir tur atıp [TEAM] pasını kapıverdi! Stadyum ayakta! INTERCEPTION!",
    "Baskı altında acele edilen bir karar! [TEAM] pası kavis alıp doğrudan savunmanın kucağına düştü. INTERCEPTION!",
    "Kendi yarı sahasında büyük bir felaket! [TEAM] pası sekip havalandı, defansif tackle bile yakalayabilirdi bunu! INTERCEPTION!",
    "Göz okuması harika! Safety [TEAM] pasörünün nereye bakacağını önceden sezdi ve rotayı kesti! İnanılmaz bir INTERCEPTION!"
  ],
  "FUMBLE": [
    "[TEAM] koşucusu ikinci hedefe koşarken defender tam bilekten yakaladı! Top havaya uçtu! FUMBLE! Ve kaos başlıyor!",
    "Snap exchange bozuldu! [TEAM] merkezi topu düzgün aktaramadı, oyun kurucusu kaybetti tutmayı! FUMBLE! Yer yarılıyor sanki!",
    "Hava soğuk, eller uyuşmuş! [TEAM] alıcısı yakaladıktan sonra topu tutamadı! FUMBLE! Top zeminde yuvarlanıyor!",
    "[TEAM] koçu görmek istemedi bunu! Koşucu tek elinde taşırken linebacker tam kasığa vurdu! FUMBLE! Ve savunma fırsatı kaptı!",
    "Hit öyle bir hit ki... [TEAM]'in oyun kurucusu havaya kalktı ve top da ondan önce zemine indi! FUMBLE! İnanılmaz güç!",
    "Peanut punch! Savunmacı inanılmaz bir refleksle topa yumruk attı, [TEAM] oyuncusu topu kaybetti! FUMBLE yerde!",
    "Dengeyi kurmaya çalışırken topu unuttu! [TEAM] koşucusu yere düşmeden top elinden fırladı! FUMBLE karmaşası!",
    "Strip sack! Pocket içinde arkadan gelen defender [TEAM] pasörünün koluna vurdu, top boşta! FUMBLE! Herkes üzerine atlıyor!",
    "Top adeta canlı bir balık gibi kayıp gitti! [TEAM] alıcısı tam döndüğü an darbeyi yedi ve top sahipsiz! FUMBLE!",
    "İnanılmaz bir an! [TEAM] hücumu ilerliyor derken kask kaska çarpışmada top fırladı! FUMBLE alarmı çalıyor!",
    "Elinden sabun gibi kaydı! [TEAM] koşucusu dönüş yaparken top çimlere düştü, panik yaşanıyor! FUMBLE!",
    "Aradan uzanan o sinsi el! [TEAM] pasörü pocket'ta beklerken topu çaldırdı! Kör noktadan gelen FUMBLE!",
    "Hücum tam hızlanmıştı ki takıldılar! [TEAM] koşucusunun koluna gelen şiddetli balyoz darbesiyle FUMBLE gerçekleşti!",
    "Top adeta patladı! [TEAM] oyuncusuna aynı anda üç kişi girince top gökyüzüne fırladı! Dev bir FUMBLE!",
    "Daha topu tutamadan düşürdü! [TEAM] hücumunda inanılmaz bir konsantrasyon kaybı. Yerlerde sürünüyorlar! FUMBLE!"
  ],
  "TOUCHDOWN": [
    "BU NASIL BİR YAKALAYIŞ?! [TEAM] alıcısı tek bacağıyla çizgide, topu göğsüne bastırmış şekilde düşüyor! TOUCHDOWN!!! 6 sayı!",
    "[TEAM] koşucusu son üç defender'ı devirdi, hiçbiri tutamadı onu! TOUCHDOWN!!! Stadyumun çatısı uçuyor! 6 sayı!",
    "Her hafta bu sahaya çıkıyorlar işte bunun için! [TEAM] endzone'a girdi! TOUCHDOWNNNNN!!! Bu tarihi bir an! 6 sayı!",
    "Gece çöküyor üzerimize ama saha aydınlıktan geçmiyor! [TEAM] pasörü scramble'dan çıkıp endzone'a koştu! TOUCHDOWN!!! 6 sayı!",
    "Kalabalığın çığlığı gökyüzüne yükseliyor! [TEAM] topu son çizginin ötesine taşıdı! TOUCHDOWN!!! Herkese hayırlı olsun — 6 sayı!",
    "Savunmayı adeta ipe dizdi! [TEAM] hiçbir engeli tanımadı, pilona uzandı ve bitirdi! TOUCHDOWN! Muhteşem ötesi!",
    "Bomba patladı! [TEAM] derinlerden gelen bir füzeyle endzone'u buldu! TOUCHDOWN! Kutlamalar başladı bile!",
    "Çizgide adeta bir rugby maçı vardı ama [TEAM] topu milim milim iterek içeri sokmayı başardı! TOUCHDOWN! Saf inat!",
    "Geniş alanda tek başına kaldı! [TEAM] oyuncusu için bu bir antrenman koşusuna dönüştü! TOUCHDOWN! Tribünler çıldırıyor!",
    "Mükemmel zamanlama, mükemmel pas, mükemmel koşu! [TEAM] bu oyunu ders kitaplarına sokacak! TOUCHDOWNNNN!!!",
    "Geri dönüşün ateşi yakıldı! [TEAM] imkansız denilen yerden endzone'a sızdı! TOUCHDOWN! 6 sayı tabelada yanıyor!",
    "Bütün hafta buna çalışmışlar belli! Kusursuz bir trick play ve [TEAM] için TOUCHDOWN! Şapkalar çıkıyor bu oyuna!",
    "Araya giren savunmacıların üstünden atladı! [TEAM] oyuncusu adeta havada yürüyerek çizgiyi geçti! İnanılmaz bir TOUCHDOWN!",
    "Açılan koridorda bir Formula aracı gibi süzüldü! [TEAM] endzone'u buldu! TOUCHDOWN! Seyirci kendinden geçiyor!",
    "Son saniyeye kadar direndi ve çizgiyi kopardı! [TEAM] inatçı yapısıyla endzone'da! TOUCHDOWN! Ve 6 sayı geliyor!"
  ],
  "FIELD_GOAL_ISABETLI": [
    "Özel takım sahada! [TEAM] vurucusu [YARDS] yarda için hazırlandı... snap, hold, vuruş... GOOD! DİREKLERİN ARASINDA! FIELD GOAL! 3 sayı!",
    "Rüzgara rağmen [TEAM] vurucusu cesur bir kararla topa vurdu! [YARDS] yarda... top sallanıyor... ve GEÇİYOR! FIELD GOAL! 3 sayı!",
    "Gecenin karanlığında saha ışıkları [TEAM] vurucusunu aydınlıyor... [YARDS] yardalık kritik deneme... GOOD! FIELD GOAL! 3 sayı!",
    "[YARDS] yardalık deneme! [TEAM] vurucusu terlemeden yaklaştı topa... salladı! TOP GEÇİYOR! FIELD GOAL! 3 sayı!",
    "Maçın kritik anında [TEAM] özel takımı sahada! [YARDS] yarda... snap temiz, vuruş güzel — GOOD! FIELD GOAL! 3 sayı!",
    "Top ok gibi fırladı! [TEAM] vurucusu [YARDS] yardadan adeta mermi yolladı, direklerin tam ortası! FIELD GOAL başarılı!",
    "Baskı altında buz gibi soğukkanlı! [TEAM] vurucusu [YARDS] yardayı rahatlıkla çıkarıyor! FIELD GOAL, 3 sayı tabelada!",
    "Kusursuz mekanik! Snap, hold ve kick mükemmel uyum içinde! [TEAM] [YARDS] yardalık FIELD GOAL ile rahat nefes alıyor.",
    "Direği hafif yaladı ama içeri düştü! Şans [TEAM] takımından yana, [YARDS] yardalık FIELD GOAL iyi!",
    "Büyük maçların büyük oyuncusu! [TEAM] kicker'ı [YARDS] yardadan affetmedi! FIELD GOAL, skor değişiyor!",
    "Buz adam devrede! [TEAM] vurucusu tribünlerin gürültüsüne aldırmadan [YARDS] yardadan skoru yazdı! FIELD GOAL! 3 sayı!",
    "Atışın güzelliği jeneriklere girer! Top tam da hedeflendiği gibi ağları buluyor, [TEAM] için [YARDS] yardalık FIELD GOAL başarılı!",
    "Mesafenin uzunluğu onu korkutmadı! [TEAM] vurucusu ayağının tüm gücüyle vurdu ve top filelere saplandı! FIELD GOAL! 3 puan!",
    "Yere çok yakın uçtu ama direklerin arasından süzülmeyi başardı! [TEAM] [YARDS] yardalık kritik bir FIELD GOAL kaydediyor!",
    "Her şey tek bir vuruşa kalmıştı ve [TEAM] vurucusu görevi layıkıyla yerine getirdi. [YARDS] yardadan FIELD GOAL başarılı!"
  ],
  "FIELD_GOAL_KACTI": [
    "[TEAM] vurucusu [YARDS] yarda için hazırlandı ama bacağı kaymış olabilir mi? Top sol direğin dışına çıkıyor! NO GOOD! Field Goal kaçtı!",
    "Snap biraz sola geldi, hold düzeltemedi! [TEAM]'in [YARDS] yardalık denemesi düzensiz gitti... NO GOOD! Kaçan field goal!",
    "[YARDS] yarda bu hava şartlarında mı? [TEAM] vurucusu çok şey istedi kendinden, top kısa kaldı! NO GOOD! Field Goal yok!",
    "[TEAM] vurucusu [YARDS] yardalık denemede ayağını erken kaldırdı! Top sağa saptı, direği dışarıdan geçti! NO GOOD! Kaçan şans!",
    "Her şey hazırdı ama [TEAM] için kader yoktu! [YARDS] yardalık deneme direğin tam üzerinden atlayamadı! NO GOOD! Field Goal kaçtı!",
    "Blok geldi! Savunma inanılmaz bir hızla aradan sızdı ve [TEAM]'in [YARDS] yardalık denemesine eliyle dokundu! NO GOOD!",
    "Direk! Top büyük bir gürültüyle çatalı vurdu ve sahaya geri döndü! [TEAM] inanamıyor, [YARDS] yardalık deneme NO GOOD!",
    "Geniş, çok geniş! [TEAM] vurucusu topa çok altından girdi, hedeften tamamen saptı. [YARDS] yardalık atış kaçtı, NO GOOD!",
    "Rüzgar oyun oynadı! [TEAM] vurucusunun atışı mükemmel görünüyordu ama havada aniden yön değiştirdi! [YARDS] yarda NO GOOD!",
    "Koçun yüzü düşüyor... [TEAM] için [YARDS] yardalık bu atış çok kritikti ama top sağdan dışarı süzüldü. NO GOOD!",
    "Çimlere takıldı sanki! [TEAM] vurucusunun atışı çok cılız kaldı ve direklere varmadan düştü. NO GOOD! Kaçan FIELD GOAL!",
    "Göz ucuyla baktı ve top o yana gitti! [TEAM] için çok ama çok uzak bir atış oldu. [YARDS] yardalık FIELD GOAL başarısız!",
    "Tam bir felaket! Snap o kadar kötüydü ki [TEAM] vurucusu topa zor yetişti, haliyle atış sağa saptı. NO GOOD!",
    "Çıt sesi duyuldu! Savunmadan bir parmak topa dokundu ve [TEAM] [YARDS] yardalık bu şansı harcadı! Kaçtı, NO GOOD!",
    "Çok gerildi, fazla güç verdi! [TEAM] vurucusunun bu denemesi hedefi tamamen şaşırdı. FIELD GOAL NO GOOD!"
  ],
  "TURNOVER_ON_DOWNS": [
    "Drama son hakkında! [TEAM] cesaret gösterdi ama savunma daha cesurdu! Çizgi geçilemiyor! Turnover on Downs! Top rakibinde!",
    "Bütün kartlarını ortaya koydu [TEAM]! Ama savunma her hareketi okudu ve kapandı! Turnover on Downs! Büyük hayal kırıklığı!",
    "First down için tek yarda! Tek YARDA! Ama [TEAM] koşucusu savunma duvarında eridi! Turnover on Downs! Acı son!",
    "Saha suskunlaştı... [TEAM]'in hücum hattı itiyordu... savunma itiyordu... ve savunma kazandı! Turnover on Downs!",
    "[TEAM] pasörü 4. Hakta derin rotayı denedi — riskli karardı, pas incomplete! Turnover on Downs! Top rakibine geçiyor!",
    "Tarihi bir savunma standı! [TEAM] goal line'da 4 haktır deniyordu ama savunma beton gibi durdu! Turnover on Downs!",
    "Kumar oynadılar ve kaybettiler! [TEAM] 4. hakta kendi sahasında çıkmayı denedi ama başarısız! Turnover on Downs!",
    "Fake punt denemesi! [TEAM] herkesi kandırmaya çalıştı ama savunmanın özel timi uyanıktı! İndirdiler! Turnover on Downs!",
    "Zaman daralırken umut bağladıkları 4. hak pası yere düştü! [TEAM] için yürüyüş burada bitiyor. Turnover on Downs!",
    "Savunma koçu kenarda çıldırıyor! Adamları görevini eksiksiz yaptı ve [TEAM] hücumunu durdurdu! Turnover on Downs!",
    "Ne olursa olsun dediler ama olmadı! [TEAM] kendi sahasında 4. hakta tıkandı kaldı! Topu teslim ediyorlar, Turnover on Downs!",
    "Sahanın ortasında bir etten duvar! [TEAM] hücumu defalarca çarptı ama yıkamadı. Turnover on Downs! Harika bir direniş!",
    "Son saniye çabası yetersiz kaldı! [TEAM] dördüncü hakta derin bir rota denedi ancak pas incomplete. Turnover on Downs!",
    "Bir oyun kurucu sneak'i denendi ama çizginin hakimi savunmaydı! [TEAM] geriye itildi! Turnover on Downs!",
    "Sahada inanılmaz bir gerginlik vardı ve kaybeden [TEAM] oldu. Son şanslarını heba ettiler. Turnover on Downs!"
  ],
  "NO_GAIN": [
    "Savunma hattı beton gibi! [TEAM] hücumu içeri daldı ama hiçbir şey çıkaramadı. 0 yarda kazanç.",
    "[TEAM] için oyun anında bozuldu, line of scrimmage'da büyük bir yığılma var! Kazanç yok.",
    "Pas atacak kimse yok! [TEAM] oyun kurucusu çizgiye doğru kaçtı ama hemen indirildi. Sadece 0 yarda.",
    "Koşucu topu aldığı gibi karşısında üç defender buldu! [TEAM] milim bile ilerleyemiyor.",
    "Harika bir savunma okuması! [TEAM]'in denediği trick play tamamen duvara çarptı. 0 yarda.",
    "Göz açtırmadılar! [TEAM] topu eline aldığı anda savunmacı formasına yapışmıştı bile. Hiçbir ilerleme yok.",
    "Tuğla duvara çarpmak gibi bir şeydi bu! [TEAM] hücumu şiddetle geri püskürtüldü. 0 yarda kazanç.",
    "Dışarı çıkmaya çalıştı ama kenar çizgisi ekstra bir savunmacı gibi kapandı! [TEAM] yerinde saydı.",
    "Hücum hattı tamamen çöktü! [TEAM] koşucusu backfield'dan çıkmayı dahi başaramadı. Sıfır numara.",
    "Herkes kilitli, her yer kapalı! [TEAM] oyun kurucusu zorunlu olarak yere yattı. Sıfır yarda kazanç.",
    "Kör bir noktadan gelen darbe! [TEAM] koşucusu topu alır almaz yere serildi. İlerleme tamamen sıfır.",
    "Karşı takım savunması resmen kilit vurdu! [TEAM] bu duvarı tırmanamaz, kazanç yok, 0 yarda.",
    "Bu oyun tasarımı baştan hatalıydı sanki! [TEAM] topu hareket dahi ettiremedi, sıfır kazançla yetinmek zorundalar.",
    "Ahtapot gibi sardılar! [TEAM] oyuncusu top elindeyken adım atacak milimetre boşluk bulamadı. 0 yarda.",
    "Bir anda etrafı sarıldı! [TEAM] hücumu başladığı çizgide eriyip bitti. Hiçbir ilerleme kaydedilemedi."
  ]
}

const getRandomLog = (category: keyof typeof SPIKER_METINLERI, team: string, yards: number = 0) => {
  const options = SPIKER_METINLERI[category]
  if (!options) return ""
  const selected = options[Math.floor(Math.random() * options.length)]
  return selected.replace(/\[TEAM\]/g, team).replace(/\[YARDS\]/g, Math.abs(yards).toString())
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth Header')
    
    const internalSecret = req.headers.get('X-Internal-Secret')
    const isServiceRole = internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && internalSecret !== null
    const token = authHeader.replace('Bearer ', '')

    if (!isServiceRole) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (userError) throw new Error('admin-simulate-match AuthError: ' + userError.message)
      if (!user) throw new Error('admin-simulate-match Invalid token: No User')

      // Verify admin
      const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
      if (!dbUser || dbUser.role !== 'admin') throw new Error('admin-simulate-match Unauthorized: Not an admin')
    }

    let reqBody = {}
    try {
      reqBody = await req.json()
    } catch { /* ignore */ }

    const { league_id, week } = reqBody as any

    let matchesToSimulate: any[] = []

    if (league_id && week) {
      const { data: matches, error: matchErr } = await supabaseAdmin
        .from('matches')
        .select('*, home_franchise_id, away_franchise_id')
        .eq('league_id', league_id)
        .eq('week', week)

      if (matchErr) throw new Error('Matches not found')
      matchesToSimulate = matches || []
    } else {
      // If no league_id and week are provided, select all matches that are played=false and in active leagues
      // Actually, we can just get active leagues and their current week
      const { data: activeLeagues } = await supabaseAdmin.from('leagues').select('id, current_week').eq('status', 'active')
      if (activeLeagues && activeLeagues.length > 0) {
        for (const lg of activeLeagues) {
          const { data: m } = await supabaseAdmin
            .from('matches')
            .select('*, home_franchise_id, away_franchise_id')
            .eq('league_id', lg.id)
            .eq('week', lg.current_week)
            .eq('final_stats->played', false)
            
          if (m && m.length > 0) {
            matchesToSimulate = [...matchesToSimulate, ...m]
          }
        }
      }
    }

    if (matchesToSimulate.length === 0) {
      return new Response(JSON.stringify({ message: "No matches to simulate" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    for (const match of matchesToSimulate) {
      if (match.final_stats?.played) continue

      const { data: homePlayers } = await supabaseAdmin.from('players').select('overall, traits, position, name').eq('franchise_id', match.home_franchise_id)
      const { data: awayPlayers } = await supabaseAdmin.from('players').select('overall, traits, position, name').eq('franchise_id', match.away_franchise_id)
      
      const { data: homeCoaches } = await supabaseAdmin.from('coaches').select('*').eq('franchise_id', match.home_franchise_id)
      const { data: awayCoaches } = await supabaseAdmin.from('coaches').select('*').eq('franchise_id', match.away_franchise_id)
      
      const getPositionalAverage = (players: any[], positions: string[], count: number) => {
        const matching = players.filter(p => positions.includes(p.position)).sort((a, b) => b.overall - a.overall)
        let sum = 0
        for (let i = 0; i < count; i++) {
          sum += matching[i] ? matching[i].overall : 40 // Missing players are penalized with 40 OVR
        }
        return sum
      }

      const getRandomPlayerName = (teamPlayers: any[], positions: string[]) => {
        const matching = teamPlayers?.filter(p => positions.includes(p.position)) || []
        if (matching.length === 0) return ''
        const randomPlayer = matching[Math.floor(Math.random() * matching.length)]
        return randomPlayer.name || ''
      }

      const getOffensePower = (players: any[]) => {
        if (!players || players.length === 0) return 40
        let sum = 0
        sum += getPositionalAverage(players, ['QB'], 1)
        sum += getPositionalAverage(players, ['RB'], 1)
        sum += getPositionalAverage(players, ['WR'], 3)
        sum += getPositionalAverage(players, ['TE'], 1)
        sum += getPositionalAverage(players, ['OL'], 5)
        return sum / 11
      }

      const getDefensePower = (players: any[]) => {
        if (!players || players.length === 0) return 40
        let sum = 0
        sum += getPositionalAverage(players, ['DE', 'DL'], 4)
        sum += getPositionalAverage(players, ['LB'], 3)
        sum += getPositionalAverage(players, ['CB', 'S', 'DB'], 4)
        return sum / 11
      }

      const { data: homeFranchise } = await supabaseAdmin.from('franchises').select('id, active_boost').eq('id', match.home_franchise_id).single()
      const { data: awayFranchise } = await supabaseAdmin.from('franchises').select('id, active_boost').eq('id', match.away_franchise_id).single()
      
      let homeOffPower = getOffensePower(homePlayers || [])
      let homeDefPower = getDefensePower(homePlayers || [])
      let awayOffPower = getOffensePower(awayPlayers || [])
      let awayDefPower = getDefensePower(awayPlayers || [])

      if (homeFranchise?.active_boost === 'power_boost') { homeOffPower += 5; homeDefPower += 5; }
      if (awayFranchise?.active_boost === 'power_boost') { awayOffPower += 5; awayDefPower += 5; }

      const hasTrait = (team: 'home' | 'away', pos: string, trait: string) => {
        const pList = team === 'home' ? homePlayers : awayPlayers
        if (!pList) return false
        return pList.some(p => p.position.includes(pos) && p.traits && p.traits.includes(trait))
      }

      const { data: homeTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.home_franchise_id).single()
      const { data: awayTacData } = await supabaseAdmin.from('tactics').select('slider_ayarlari').eq('franchise_id', match.away_franchise_id).single()
      
      const homeTac = (homeTacData?.slider_ayarlari || {}) as any
      const awayTac = (awayTacData?.slider_ayarlari || {}) as any

      const { data: stadium } = await supabaseAdmin.from('stadiums').select('turf_level').eq('franchise_id', match.home_franchise_id).single()
      if (stadium) {
        let mult = 1
        if (stadium.turf_level === 1) mult = 1.02
        if (stadium.turf_level === 2) mult = 1.04
        if (stadium.turf_level === 3) mult = 1.06
        homeOffPower *= mult; homeDefPower *= mult;
      }

      if (homeTac.x_aggressiveness === 'physical') { homeOffPower += 2; homeDefPower += 2; }
      if (awayTac.x_aggressiveness === 'physical') { awayOffPower += 2; awayDefPower += 2; }
      if (homeTac.x_rotation === 'ironman') { homeOffPower += 2; homeDefPower += 2; }
      if (awayTac.x_rotation === 'ironman') { awayOffPower += 2; awayDefPower += 2; }

      let homeScore = 0
      let awayScore = 0
      let possession = 'home'
      let yardLine = 25
      let down = 1
      let distance = 10
      let quarter = 1
      let playInQuarter = 0
      const maxPlaysPerQuarter = 25
      const logs: any[] = []

      const injectPlayerNames = (text: string, currentPossession: string) => {
        const offPlayers = currentPossession === 'home' ? homePlayers : awayPlayers
        const defPlayers = currentPossession === 'home' ? awayPlayers : homePlayers

        const qbName = getRandomPlayerName(offPlayers || [], ['QB']) || 'Oyun Kurucu'
        const rbName = getRandomPlayerName(offPlayers || [], ['RB']) || 'Koşucu'
        const wrName = getRandomPlayerName(offPlayers || [], ['WR', 'TE']) || 'Alıcı'
        const kName = getRandomPlayerName(offPlayers || [], ['K']) || 'Vurucu'
        const defName = getRandomPlayerName(defPlayers || [], ['LB', 'CB', 'S', 'DE', 'DL']) || 'Savunmacı'

        return text
          .replace(/pasörü|oyun kurucusu/gi, `(${qbName})`)
          .replace(/koşucusu/gi, `(${rbName})`)
          .replace(/alıcısı/gi, `(${wrName})`)
          .replace(/vurucusu|kicker'ı/gi, `(${kName})`)
          .replace(/savunmacı|defender|safety'si/gi, `savunmacı (${defName})`)
      }

      const addLog = (time: string, text: string, playType: string, event: string | null = null, endYard: number = yardLine) => {
        const enrichedText = injectPlayerNames(text, possession)
        logs.push({
          time,
          text: enrichedText,
          possession,
          startYard: yardLine,
          endYard,
          playType,
          event
        })
      }

      addLog("BAŞLANGIÇ", "Maç başladı! İlk hücum hakkı Ev Sahibi'nde.", "kickoff", null, 25)

      const switchPossession = (isKickoff = false) => {
        possession = possession === 'home' ? 'away' : 'home'
        yardLine = isKickoff ? 25 : 100 - yardLine
        if (yardLine <= 0) yardLine = 20
        if (yardLine >= 100) yardLine = 99
        down = 1
        distance = 10
      }

      for (let totalPlays = 0; totalPlays < maxPlaysPerQuarter * 4; totalPlays++) {
        quarter = Math.floor(totalPlays / maxPlaysPerQuarter) + 1
        playInQuarter = totalPlays % maxPlaysPerQuarter

        const offTac = possession === 'home' ? homeTac : awayTac
        const defTac = possession === 'home' ? awayTac : homeTac
        const offPower = possession === 'home' ? homeOffPower : awayOffPower
        const defPower = possession === 'home' ? awayDefPower : homeDefPower

        const teamName = possession === 'home' ? 'Ev Sahibi' : 'Deplasman'
        const timePrefix = `${quarter}Q | ${down}${down === 1 ? 'st' : down === 2 ? 'nd' : down === 3 ? 'rd' : 'th'} & ${distance}`

        let currentOffPower = offPower
        let currentDefPower = defPower

        if (quarter === 4) {
          if (offTac.x_rotation === 'ironman') currentOffPower -= 3
          if (defTac.x_rotation === 'ironman') currentDefPower -= 3
          if (offTac.q_scripting_4th === 'aggressive' && ((possession === 'home' && homeScore <= awayScore) || (possession === 'away' && awayScore <= homeScore))) {
            currentOffPower += 5
          }
        }

        const powerAdvantage = ((currentOffPower - currentDefPower) * 1.5) / 100
        let roll = Math.random() + powerAdvantage

        // SITUATION ANALYZER
        let situationKey = 'first_down'
        if (down === 1) situationKey = 'first_down'
        else if (down === 2 && distance <= 3) situationKey = 'second_short'
        else if (down === 2 && distance > 3) situationKey = 'second_long'
        else if (down === 3 && distance <= 3) situationKey = 'third_short'
        else if (down === 3 && distance > 3) situationKey = 'third_long'
        else if (down === 4) situationKey = 'first_down' // 4th down is handled separately for punts, if played it defaults back to base

        // FIELD POSITION OVERRIDES
        if (yardLine >= 80 && yardLine < 95) situationKey = 'red_zone'
        else if (yardLine >= 95) situationKey = 'goal_line'
        else if (yardLine <= 10) situationKey = 'backed_up'

        // FETCH PLAYBOOK
        const offPlaybook = offTac.playbook?.offense || {
          first_down: 'play_action', second_short: 'power_run', second_long: 'short_pass',
          third_short: 'power_run', third_long: 'deep_bomb', red_zone: 'short_pass',
          goal_line: 'power_run', backed_up: 'power_run'
        }
        const defPlaybook = defTac.playbook?.defense || {
          first_down: 'balanced', second_short: 'stop_run', second_long: 'pass_def',
          third_short: 'stop_run', third_long: 'dime_prevent', red_zone: 'red_zone_wall',
          goal_line: 'goal_line_stand', backed_up: 'blitz'
        }

        let offFocus = (offPlaybook as any)[situationKey] || 'short_pass'
        let defFocus = (defPlaybook as any)[situationKey] || 'balanced'

        // CLOCK MANAGEMENT OVERRIDES
        const offClockMgmt = offTac.clock_mgmt || {}
        const defClockMgmt = defTac.clock_mgmt || {}
        const myScore = possession === 'home' ? homeScore : awayScore
        const theirScore = possession === 'home' ? awayScore : homeScore
        const scoreDiff = myScore - theirScore
        const isLate = playInQuarter >= 20 // son 5 oyun = ~son 2 dakika
        const isVeryLate = playInQuarter >= 22 // son 3 oyun

        // 2-MINUTE DRILL: Gerideyken, son dakikalarda hücum override
        if (isLate && scoreDiff < 0 && (quarter === 2 || quarter === 4)) {
          const drillMode = offClockMgmt.two_min_drill || 'hurry_pass'
          if (drillMode === 'hurry_pass') offFocus = 'short_pass'
          else if (drillMode === 'deep_shots') offFocus = 'deep_bomb'
          // balanced_hurry keeps the playbook choice
        }

        // 4-MINUTE OFFENSE: Öndeyken, son çeyrekte saat eritme override
        if (quarter === 4 && scoreDiff > 0 && isLate) {
          const fourMinMode = offClockMgmt.four_min_offense || 'grind_run'
          if (fourMinMode === 'grind_run') offFocus = 'power_run'
          else if (fourMinMode === 'safe_mix') {
            offFocus = Math.random() < 0.7 ? 'power_run' : 'short_pass'
          }
          // keep_scoring keeps the playbook choice
        }

        // TIMEOUT STRATEGY EFFECTS
        const defTimeoutStrat = defClockMgmt.timeout_strategy || 'save_late'
        if (defTimeoutStrat === 'ice_kicker' && isVeryLate && quarter === 4) {
          // Increases pressure on the offense in final moments
          currentDefPower += 2
        }
        if (defTimeoutStrat === 'stop_momentum' && scoreDiff < -7) {
          // If the defense is getting blown out, they call timeout to regroup
          currentDefPower += 3
        }

        const offCoaches = possession === 'home' ? homeCoaches : awayCoaches
        const defCoaches = possession === 'home' ? awayCoaches : homeCoaches
        
        const offCoach = offCoaches?.find(c => c.type === 'offensive')
        const defCoach = defCoaches?.find(c => c.type === 'defensive')
        
        let predictionText = ''
        
        if (offFocus === 'deep_bomb' && defFocus === 'blitz') {
          if (defCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < defCoach.prediction_rating) {
               predictionText = `[Koç ${defCoach.name} BLITZ'i iptal edip pası savundu - BAŞARILI TAHMİN!] `
               roll -= 0.30 
             } else {
               predictionText = `[Koç ${defCoach.name} hazırlıksız yakalandı! (Hatalı Okuma)] `
               roll += 0.30 
             }
          }
        } 
        else if (offFocus === 'short_pass' && defFocus === 'pass_def') {
          if (offCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < offCoach.prediction_rating) {
               predictionText = `[Hücum Koçu ${offCoach.name} ekran pası çağırdı - BAŞARILI TAHMİN!] `
               roll += 0.30 
             } else {
               predictionText = `[Hücum Koçu ${offCoach.name} savunmanın tuzağına düştü (Hatalı Okuma)] `
               roll -= 0.30
             }
          }
        }
        else if ((offFocus === 'power_run' || offFocus === 'outside_run') && defFocus === 'pass_def') {
          if (defCoach) {
             const predRoll = Math.random() * 100;
             if (predRoll < defCoach.prediction_rating) {
               predictionText = `[DC ${defCoach.name} koşuyu sezdi, kutuyu doldurdu - BAŞARILI TAHMİN!] `
               roll -= 0.30 
             } else {
               predictionText = `[DC ${defCoach.name} pas beklerken koşuyla ezildi! (Hatalı Okuma)] `
               roll += 0.30 
             }
          }
        }

        let outcomeText = predictionText
        let yardsGained = 0
        let isTurnover = false
        let isScore = false
        let eventOccurred: string | null = null
        let currentPlayType = offFocus

        if (down === 4) {
          const fourthDowns = offTac.fourth_downs || { fourth_1: 'punt', fourth_2_3: 'punt', fourth_4_6: 'punt', fourth_7_plus: 'punt', fourth_goal: 'fg' }
          let decision = 'punt'
          
          if (distance === 1) decision = fourthDowns.fourth_1
          else if (distance <= 3) decision = fourthDowns.fourth_2_3
          else if (distance <= 6) decision = fourthDowns.fourth_4_6
          else decision = fourthDowns.fourth_7_plus
          
          if (yardLine >= 80) decision = fourthDowns.fourth_goal

          if (decision === 'punt') {
            addLog(timePrefix, `${teamName} Punt vurdu (Degaj). Top rakibe geçiyor.`, "punt", null, yardLine + 40)
            yardLine += 40
            switchPossession()
            continue
          } else if (decision === 'fg') {
            if (yardLine < 60) {
              addLog(timePrefix, `${teamName} Field Goal mesafesinde değil, mecburen Punt vuruyor.`, "punt", null, yardLine + 40)
              yardLine += 40
              switchPossession()
              continue
            }
            const distanceToGoal = 100 - yardLine + 17
            const fgProb = distanceToGoal < 40 ? 0.95 : distanceToGoal < 50 ? 0.75 : 0.40
            if (Math.random() < fgProb) {
              if (possession === 'home') homeScore += 3; else awayScore += 3;
              addLog(timePrefix, getRandomLog("FIELD_GOAL_ISABETLI", teamName, distanceToGoal), "fg", "fg_good", 100)
            } else {
              addLog(timePrefix, getRandomLog("FIELD_GOAL_KACTI", teamName, distanceToGoal), "fg", "fg_miss", 100)
            }
            switchPossession(true)
            continue
          }
          outcomeText = `${teamName} 4th Down'da riske girip oyunu oynuyor! `
        }

        if (quarter === 4 && playInQuarter > 15 && offTac.signature_play === 'hail_mary' && offTac.signature_condition === 'late_behind') {
          const isTrailing = possession === 'home' ? homeScore < awayScore : awayScore < homeScore
          if (isTrailing) {
            offFocus = 'deep_bomb'
            currentPlayType = 'deep_bomb'
            outcomeText += "🚨 SIGNATURE PLAY! "
          }
        }

        const isHomeOffense = possession === 'home'
        const offTeamStr = isHomeOffense ? 'home' : 'away'
        const defTeamStr = isHomeOffense ? 'away' : 'home'

        // Traits
        const hasPocketPresence = hasTrait(offTeamStr, 'QB', 'Pocket Presence')
        const hasYacMachine = hasTrait(offTeamStr, 'WR', 'YAC Machine')
        const hasRoadGrader = hasTrait(offTeamStr, 'OL', 'Road Grader')
        const hasPassProtector = hasTrait(offTeamStr, 'OL', 'Pass Protector')
        const hasBallHawk = hasTrait(defTeamStr, 'DB', 'Ball Hawk')
        const hasHitPower = hasTrait(defTeamStr, 'LB', 'Hit Power') || hasTrait(defTeamStr, 'DL', 'Hit Power')

        // MAPPING NEW PLAYBOOK STRINGS TO BASE LOGIC
        const isDeep = offFocus === 'deep_bomb'
        const isRun = offFocus === 'power_run' || offFocus === 'outside_run' || offFocus === 'qb_scramble'
        const isPower = offFocus === 'power_run'
        const isScreen = offFocus === 'screen_pass'
        const isPlayAction = offFocus === 'play_action'
        
        const isPassDef = defFocus === 'pass_def' || defFocus === 'man_coverage' || defFocus === 'dime_prevent'
        const isRunDef = defFocus === 'stop_run' || defFocus === 'red_zone_wall' || defFocus === 'goal_line_stand'
        const isBlitz = defFocus === 'blitz'

        // BALANCED RNG LOGIC
        if (isDeep) {
          currentPlayType = 'deep_bomb'
          if (defFocus === 'dime_prevent') {
            // Hard counter to deep bomb
            if (roll < 0.90) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else if (roll < 0.95) { isTurnover = true; eventOccurred = 'interception'; outcomeText += getRandomLog("INTERCEPTION", teamName); }
            else { yardsGained = 15 + Math.floor(Math.random() * 10); outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained); }
          } else if (isPassDef) {
            const intChance = hasBallHawk ? 0.82 : 0.85
            if (roll < 0.70) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else if (roll < intChance) { isTurnover = true; eventOccurred = 'interception'; outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : ""); }
            else { yardsGained = 20 + Math.floor(Math.random() * 20); outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained); }
          } else if (isBlitz) {
            const sackChance = hasPassProtector ? 0.40 : 0.50
            if (roll < sackChance) { yardsGained = -(5 + Math.floor(Math.random() * 5)); eventOccurred = 'sack'; outcomeText += getRandomLog("SACK", teamName, yardsGained); }
            else { yardsGained = 30 + Math.floor(Math.random() * 30); outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained); }
          } else {
            const intChance = hasBallHawk ? 0.72 : 0.75
            if (roll < 0.60) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else if (roll < intChance) { isTurnover = true; eventOccurred = 'interception'; outcomeText += getRandomLog("INTERCEPTION", teamName) + (hasBallHawk ? " (BALL HAWK!)" : ""); }
            else { yardsGained = 20 + Math.floor(Math.random() * 25); outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained); }
          }
        } 
        else if (isRun) {
          currentPlayType = 'run'
          if (defFocus === 'dime_prevent') {
            // Dime prevent gets crushed by runs
            { yardsGained = 10 + Math.floor(Math.random() * 10); outcomeText += getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) + " (Dime Savunması ezildi!)"; }
          } else if (isRunDef) {
            if (roll < 0.65) { yardsGained = Math.floor(Math.random() * 2); outcomeText += yardsGained === 0 ? getRandomLog("NO_GAIN", teamName) : getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained); }
            else { yardsGained = 2 + Math.floor(Math.random() * 4); outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained); }
          } else if (isPassDef) {
            { yardsGained = 4 + Math.floor(Math.random() * 6); outcomeText += isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained); }
          } else {
            const fumbleChance = hasHitPower ? 0.28 : 0.25
            if (roll < 0.20) { yardsGained = 0; outcomeText += getRandomLog("NO_GAIN", teamName); }
            else if (roll < fumbleChance) { isTurnover = true; eventOccurred = 'fumble'; outcomeText += getRandomLog("FUMBLE", teamName) + (hasHitPower ? " (HIT POWER!)" : ""); }
            else { yardsGained = 3 + Math.floor(Math.random() * 5) + (isPower && hasRoadGrader ? 2 : 0); outcomeText += (isPower ? getRandomLog("ICERIDEN_SERT_KOSU", teamName, yardsGained) : getRandomLog("DISARIDAN_KOSU_BASARILI", teamName, yardsGained)) + (isPower && hasRoadGrader ? " (ROAD GRADER Block!)" : ""); }
          }
        } 
        else {
          // short_pass, screen_pass, play_action
          currentPlayType = 'short_pass'
          
          if (isScreen && isBlitz) {
            // Screen perfectly counters blitz
            { yardsGained = 15 + Math.floor(Math.random() * 15); outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained) + " (Screen pası Blitz'i cezalandırdı!)"; }
          }
          else if (isPlayAction && isRunDef) {
            // Play action perfectly counters run stop
            { yardsGained = 15 + Math.floor(Math.random() * 10); outcomeText += getRandomLog("DERIN_BOMBA_BASARILI", teamName, yardsGained) + " (Play-Action savunmayı kandırdı!)"; }
          }
          else if (isBlitz) {
            if (roll < 0.3) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else { yardsGained = 8 + Math.floor(Math.random() * 10); outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained); }
          } else if (isPassDef) {
            if (roll < 0.65) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else if (roll < 0.75) { isTurnover = true; eventOccurred = 'interception'; outcomeText += getRandomLog("INTERCEPTION", teamName); }
            else { yardsGained = 2 + Math.floor(Math.random() * 4); outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained); }
          } else {
            if (roll < 0.40) { yardsGained = 0; eventOccurred = 'incomplete'; outcomeText += getRandomLog("INCOMPLETE_PASS", teamName); }
            else { yardsGained = 4 + Math.floor(Math.random() * 6) + (hasYacMachine ? 3 : 0); outcomeText += getRandomLog("KISA_PAS_BASARILI", teamName, yardsGained) + (hasYacMachine ? " (YAC MACHINE!)" : ""); }
          }
          
          if (eventOccurred === 'sack' && hasPocketPresence && Math.random() < 0.5) {
             eventOccurred = 'incomplete'
             yardsGained = 0
             outcomeText = "Pocket daraldı ancak oyun kurucu (POCKET PRESENCE!) sayesinde sack olmaktan kurtulup topu fırlattı! Incomplete pass."
          }
        }

        if (offTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = -10
          outcomeText = "Hücum takımından gereksiz sertlik (Holding/Personal Foul) cezası! 10 yarda geriye."
          eventOccurred = 'penalty'
          currentPlayType = 'penalty'
        }
        if (defTac.x_aggressiveness === 'physical' && Math.random() < 0.05) {
          yardsGained = 15
          outcomeText = "Savunma takımından maskeden çekme (Face Mask) cezası! Otomatik First Down ve 15 yarda."
          eventOccurred = 'penalty'
          currentPlayType = 'penalty'
        }

        let endY = yardLine + yardsGained

        if (isTurnover) {
          addLog(timePrefix, outcomeText, currentPlayType, eventOccurred, endY)
          yardLine = endY
          switchPossession()
          continue
        }

        yardLine += yardsGained

        if (yardLine >= 100) {
          // TOUCHDOWN!
          const scoringTeam = possession
          const scoringTac = possession === 'home' ? homeTac : awayTac
          const clockMgmtData = scoringTac.clock_mgmt || {}
          const twoPointChart = clockMgmtData.two_point_chart || {}
          
          // Determine score difference BEFORE this TD
          const scorerScore = scoringTeam === 'home' ? homeScore : awayScore
          const opponentScore = scoringTeam === 'home' ? awayScore : homeScore
          const diff = scorerScore - opponentScore // negative = behind

          // Decide: Extra Point (1) or 2-Point Conversion
          let goForTwo = false
          if (diff <= -14) goForTwo = twoPointChart.down_14 === 'go2'
          else if (diff <= -11) goForTwo = twoPointChart.down_11 === 'go2'
          else if (diff <= -8) goForTwo = twoPointChart.down_8 === 'go2'
          else if (diff <= -5) goForTwo = twoPointChart.down_5 === 'go2'
          else if (diff < 0) goForTwo = twoPointChart.down_2 === 'go2'
          else if (diff <= 7) goForTwo = twoPointChart.up_1 === 'go2'
          else goForTwo = twoPointChart.up_any === 'go2'

          let tdPoints = 6
          let patText = ''

          if (goForTwo) {
            // 2-Point Conversion: ~45% success
            if (Math.random() < 0.45) {
              tdPoints = 8
              patText = ' [2-POINT BAŞARILI!]'
            } else {
              tdPoints = 6
              patText = ' [2-POINT BAŞARISIZ]'
            }
          } else {
            // Extra Point Kick: ~95% success
            if (Math.random() < 0.95) {
              tdPoints = 7
              patText = ''
            } else {
              tdPoints = 6
              patText = ' [Ekstra Puan KAÇTI!]'
            }
          }

          if (possession === 'home') homeScore += tdPoints; else awayScore += tdPoints;
          outcomeText = outcomeText + " " + getRandomLog("TOUCHDOWN", teamName) + patText
          addLog(timePrefix, outcomeText, currentPlayType, 'touchdown', 100)
          switchPossession(true)
          continue
        }

        if (yardLine <= 0) {
          if (possession === 'home') awayScore += 2; else homeScore += 2;
          addLog(timePrefix, `${outcomeText} İNANILMAZ! Kendi endzone'unda düşürüldü. SAFETY! Rakip 2 sayı kazanıyor.`, currentPlayType, 'safety', 0)
          switchPossession(true)
          continue
        }

        distance -= yardsGained

        if (distance <= 0) {
          down = 1
          distance = 10
          if (yardLine + distance > 100) distance = 100 - yardLine
          addLog(timePrefix, `${outcomeText} (FIRST DOWN!)`, currentPlayType, eventOccurred, yardLine)
        } else {
          down++
          addLog(timePrefix, outcomeText, currentPlayType, eventOccurred, yardLine)
          if (down > 4) {
            outcomeText += " " + getRandomLog("TURNOVER_ON_DOWNS", teamName)
            addLog(timePrefix, outcomeText, 'turnover', 'turnover', yardLine)
            switchPossession()
          }
        }
      }

      if (homeScore === awayScore) {
        const homeTotalPower = homeOffPower + homeDefPower
        const awayTotalPower = awayOffPower + awayDefPower
        if (Math.random() < homeTotalPower / (homeTotalPower + awayTotalPower)) {
          homeScore += 3
          addLog("OT", getRandomLog("FIELD_GOAL_ISABETLI", "Ev Sahibi", 30), "fg", "fg_good", 100)
        } else {
          awayScore += 3
          addLog("OT", getRandomLog("FIELD_GOAL_ISABETLI", "Deplasman", 30), "fg", "fg_good", 100)
        }
      }

      await supabaseAdmin.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        final_stats: { 
          played: true, 
          summary: `Taktiksel Down-by-Down Motor. Toplam ${maxPlaysPerQuarter * 4} oyun oynandı.` 
        }
      }).eq('id', match.id)

      await supabaseAdmin.from('match_drive_logs').insert({
        match_id: match.id,
        plays: logs,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const { data: capStadium } = await supabaseAdmin.from('stadiums').select('capacity_level').eq('franchise_id', match.home_franchise_id).single()
      let gateMult = 1.0
      if (capStadium) {
        if (capStadium.capacity_level === 1) gateMult = 1.2
        if (capStadium.capacity_level === 2) gateMult = 1.4
        if (capStadium.capacity_level === 3) gateMult = 1.6
      }
      
      const isDraw = homeScore === awayScore
      const homeIsWinner = homeScore > awayScore
      
      const getReward = (win: boolean, draw: boolean) => {
        if (draw) return 4000000
        if (win) return 10000000
        return 1500000
      }

      const homeBaseReward = getReward(homeIsWinner, isDraw)
      const awayBaseReward = getReward(!homeIsWinner, isDraw)
      
      // Home team still gets a small gate multiplier bonus
      const homeRevenue = Math.floor(homeBaseReward * gateMult)
      
      const SPONSORS: Record<string, { basePay: number, winBonus: number }> = {
        safe: { basePay: 500000, winBonus: 50000 },
        perf: { basePay: 200000, winBonus: 150000 },
        risk: { basePay: 0, winBonus: 300000 }
      }

      const { data: homeFranchiseFin } = await supabaseAdmin.from('franchises').select('club_fund, active_sponsor_id, active_boost, user_id').eq('id', match.home_franchise_id).single()
      if (homeFranchiseFin) {
        let sponsorPay = 0
        if (homeFranchiseFin.active_sponsor_id && SPONSORS[homeFranchiseFin.active_sponsor_id]) {
          const sp = SPONSORS[homeFranchiseFin.active_sponsor_id]
          sponsorPay = sp.basePay + (homeScore > awayScore ? sp.winBonus : 0)
        }
        await supabaseAdmin.from('franchises').update({ 
          club_fund: homeFranchiseFin.club_fund + homeRevenue + sponsorPay,
          active_boost: null // Clear boost after match
        }).eq('id', match.home_franchise_id)

        // Update User Stats (Home)
        if (homeFranchiseFin.user_id) {
          const { data: u } = await supabaseAdmin.from('users').select('total_matches_played, total_matches_won, manager_xp, amfutcoin').eq('id', homeFranchiseFin.user_id).single()
          if (u) {
            const isWin = homeScore > awayScore
            const isDrawMatch = homeScore === awayScore
            await supabaseAdmin.from('users').update({
              total_matches_played: (u.total_matches_played || 0) + 1,
              total_matches_won: (u.total_matches_won || 0) + (isWin ? 1 : 0),
              manager_xp: (u.manager_xp || 0) + (isWin ? 50 : isDrawMatch ? 20 : 10),
              amfutcoin: (u.amfutcoin || 0) + 20
            }).eq('id', homeFranchiseFin.user_id)
          }
        }
      }

      const { data: awayFranchiseFin } = await supabaseAdmin.from('franchises').select('club_fund, active_sponsor_id, active_boost, user_id').eq('id', match.away_franchise_id).single()
      if (awayFranchiseFin) {
        let sponsorPay = 0
        if (awayFranchiseFin.active_sponsor_id && SPONSORS[awayFranchiseFin.active_sponsor_id]) {
          const sp = SPONSORS[awayFranchiseFin.active_sponsor_id]
          sponsorPay = sp.basePay + (awayScore > homeScore ? sp.winBonus : 0)
        }
        await supabaseAdmin.from('franchises').update({ 
          club_fund: awayFranchiseFin.club_fund + awayBaseReward + sponsorPay,
          active_boost: null // Clear boost after match
        }).eq('id', match.away_franchise_id)

        // Update User Stats (Away)
        if (awayFranchiseFin.user_id) {
          const { data: u } = await supabaseAdmin.from('users').select('total_matches_played, total_matches_won, manager_xp, amfutcoin').eq('id', awayFranchiseFin.user_id).single()
          if (u) {
            const isWin = awayScore > homeScore
            const isDrawMatch = awayScore === homeScore
            await supabaseAdmin.from('users').update({
              total_matches_played: (u.total_matches_played || 0) + 1,
              total_matches_won: (u.total_matches_won || 0) + (isWin ? 1 : 0),
              manager_xp: (u.manager_xp || 0) + (isWin ? 50 : isDrawMatch ? 20 : 10),
              amfutcoin: (u.amfutcoin || 0) + 20
            }).eq('id', awayFranchiseFin.user_id)
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Hafta ${week} Down-by-Down motoru ile simüle edildi.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
