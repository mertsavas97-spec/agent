import type { Topic } from '@/src/data/topics';
import type { ExamType, Subject } from '@/src/lib/api/types';
import { SUBJECT_LABEL } from '@/src/data/subjects';

/** Rich primer pieces — exam + topic specific, telifsiz öğretmen sesi. */
export type LessonParts = {
  summary: string;
  bullets: string[];
  /** Sınavda sık düşülen tuzak / dikkat */
  examCue: string;
  /** Kısa öz-kontrol sorusu */
  checkPrompt: string;
  tip: string;
};

function subLabel(subject: Subject): string {
  if (subject === 'unknown') return 'Konu';
  return SUBJECT_LABEL[subject] ?? subject;
}

/** Complete bank keyed by topicId — every catalog topic has a dedicated primer. */
export const LESSON_BANK: Record<string, LessonParts> = {
  // ─── LGS Türkçe ─────────────────────────────────────────────
  'lgs-turkish-anlam': {
    summary: 'Sözcükte anlam: gerçek, mecaz, eş/zıt ve bağlamdan anlam çıkarma.',
    bullets: [
      'Gerçek anlam sözlüğün ilk karşılığıdır; mecaz bağlamda kayar.',
      'Eş anlamlıyı cümleye geri koyup dene — anlam bozulmamalı.',
      'Zıt anlamlıda “tam karşıt” mı, yoksa “yakın ama farklı” mı ayır.',
      'LGS’de bağlam cümlesi şart: sözcüğü yalnız ezberlemeden oku.',
    ],
    examCue: 'LGS tuzağı: şık “güzel duruyor” diye seçilmez; cümleye geri koy.',
    checkPrompt: 'Bu sözcüğü cümleden çıkarınca anlam bozuluyor mu?',
    tip: 'Önce cümleyi sesli oku, sonra şıkları tek tek yerine koy.',
  },
  'lgs-turkish-cumlede-anlam': {
    summary: 'Cümlede anlam: amaç, neden, koşul, karşıtlık ve çıkarım.',
    bullets: [
      '“…mek için” çoğu zaman amaç-sonuçtur.',
      '“çünkü / -den dolayı / yüzünden” → neden-sonuç.',
      '“eğer / -se/-sa” koşul; “oysa / fakat / rağmen” karşıtlık.',
      'Çıkarımda metinde olmayanı ekleme.',
    ],
    examCue: 'LGS: amaç ile nedeni karıştırma — “için” görürsen önce amaç diye bak.',
    checkPrompt: 'Bağlacı değiştirince anlam bozuluyor mu?',
    tip: 'Bağ sözcüğünü daire içine al, sonra şıklara götür.',
  },
  'lgs-turkish-paragraf': {
    summary: 'Paragraf: ana fikir, yardımcı düşünce, anlatım biçimi, çıkarım.',
    bullets: [
      'Ana düşünce sıkça ilk veya son cümlede gizlidir.',
      'Yardımcı düşünceler ana fikri örnekler veya açıklar.',
      '“Çıkarılamaz” sorusunda metinde dayanağı olmayanı ele.',
      'Anlatım biçiminde öyküleme / betimleme / açıklama / tartışmayı ayır.',
    ],
    examCue: 'LGS paragrafında kendi bilginle değil metinle cevapla.',
    checkPrompt: 'Bu şık metnin hangi cümlesine dayanıyor?',
    tip: 'Önce soru kökünü oku, sonra paragrafa dön.',
  },
  'lgs-turkish-dilbilgisi': {
    summary: 'Dil bilgisi: ses, yazım, noktalama, sözcük türü ve cümle ögeleri.',
    bullets: [
      'Özne–yüklem uyumunu her soruda kontrol et.',
      'Yazım: büyük harf, birleşik sözcük, de/da ayrı-bitişik.',
      'Noktalamada virgül ve noktalı virgülün işini karıştırma.',
      'Sözcük türünü cümledeki görevine göre bul.',
    ],
    examCue: 'LGS’de “görünürde doğru” yazım şıkları sık tuzak olur.',
    checkPrompt: 'Yüklemi buldum mu? Özne onunla uyumlu mu?',
    tip: 'Şüphede cümleyi yüklemden geriye doğru çöz.',
  },

  // ─── LGS Matematik ──────────────────────────────────────────
  'lgs-math-kesirler': {
    summary: 'Kesirler: pay–payda, işlemler ve “kalanın kesri”.',
    bullets: [
      'Pay = alınan parça, payda = bütünün kaç eşit parçaya bölündüğü.',
      'Toplama/çıkarmada paydaları eşitle; çarpma pay×pay, payda×payda.',
      '“Kalanın yarısı”nda önce kalanı bul, sonra onun kesrini al.',
      'Bileşik kesri basit kesre çevirip işlem yap.',
    ],
    examCue: 'LGS: “kalan” ifadesini atlama — çoğu hata buradan gelir.',
    checkPrompt: 'Payda eşitledim mi, yoksa doğrudan mı topladım?',
    tip: 'Pastayı çizmek LGS’de sık kurtarır.',
  },
  'lgs-math-uslu-sayilar': {
    summary: 'Üslü sayılar: aynı tabanda işlem, sıfır ve negatif üs.',
    bullets: [
      'aⁿ = a’nın n kez çarpımı; a≠0 iken a⁰ = 1.',
      'Aynı tabanda çarpma: üsleri topla; bölme: üsleri çıkar.',
      'Negatif üs: a⁻ⁿ = 1/aⁿ.',
      'Farklı tabanları önce aynı tabana getir.',
    ],
    examCue: 'LGS: 2³·2² ile (2·2)³ karıştırması klasik tuzak.',
    checkPrompt: 'Tabanlar aynı mı? Değilse önce eşitle.',
    tip: 'Önce tabanları aynı hale getir, sonra üslerle oyna.',
  },
  'lgs-math-koklu-sayilar': {
    summary: 'Köklü sayılar: karekök, sadeleştirme ve işlem kuralları.',
    bullets: [
      '√(a·b) = √a·√b (a,b≥0); toplamayı köke dağıtma.',
      'İçindeki tam kareleri dışarı çıkar.',
      'Eş köklüleri topla/çıkar; farklı köklüleri ayrı tut.',
      'Paydada kök varsa gerekirse eşlenik ile genişlet.',
    ],
    examCue: 'LGS: √a + √b ≠ √(a+b) — bu eşitlik yoktur.',
    checkPrompt: 'Toplamı köke mi dağıttım? Yanlışsa düzelt.',
    tip: 'Önce içleri sadeleştir, sonra işlem yap.',
  },
  'lgs-math-oran-oranti': {
    summary: 'Oran–orantı: doğru/ters orantı ve birim tutarlılığı.',
    bullets: [
      'Oran: iki niceliğin karşılaştırması (a:b veya a/b).',
      'Doğru orantı: biri artınca diğeri artar → çapraz çarpım.',
      'Ters orantı: biri artınca diğeri azalır (çarpım sabit).',
      'Birimleri ortak yapmadan işlem yapma.',
    ],
    examCue: 'LGS: ters orantıyı doğru orantı gibi çaprazlamak hata.',
    checkPrompt: 'Bu problem doğru mu ters mi orantı?',
    tip: 'Birimi yaz — km/saat mi, kişi/gün mü net olsun.',
  },
  'lgs-math-yuzdeler': {
    summary: 'Yüzdeler: artış, azalış ve ardışık değişim.',
    bullets: [
      '%x = x/100. “%20 artar” → ×1,20; “%20 azalır” → ×0,80.',
      'Ardışık yüzde değişimleri sırayla çarp; yüzde puan ile karıştırma.',
      '“Eskisine göre yüzde kaç” → fark / eski × 100.',
      '100 üzerinden düşünmek hız kazandırır.',
    ],
    examCue: 'LGS: %20 artıp %20 azalınca eskiye dönülmez.',
    checkPrompt: 'Ardışık değişimi çarptım mı, yoksa topladım mı?',
    tip: '100 TL varsay — hesabı netleştirir.',
  },
  'lgs-math-denklemler': {
    summary: 'Denklemler: bilinmeyeni yalnız bırakma ve kontrol.',
    bullets: [
      'Her iki tarafa aynı işlemi uygula.',
      'Parantezi aç, benzer terimleri birleştir.',
      'Sonucu yerine koyup doğrula.',
      'Kesirli denklemde payda sıfır olamaz.',
    ],
    examCue: 'LGS: işlem sırasını bozmak en sık hata.',
    checkPrompt: 'Bulduğum x’i denkleme koyunca eşitlik sağlanıyor mu?',
    tip: 'Önce çarpma/bölme, sonra toplama — sırayı koru.',
  },
  'lgs-math-olasilik': {
    summary: 'Olasılık: istenen / tüm durumlar.',
    bullets: [
      'P = istenen durum sayısı / tüm durum sayısı.',
      'Olasılık 0 ile 1 arasındadır (veya %0–%100).',
      '“En az / en fazla” ifadelerinde durumları dikkatli say.',
      'Bağımsız olaylarda çarpma kuralını kullan.',
    ],
    examCue: 'LGS: tüm durumları eksik saymak sonucu bozar.',
    checkPrompt: 'Paydadaki tüm durumları tek tek yazdım mı?',
    tip: 'Ağaç şeması veya tablo saymayı kolaylaştırır.',
  },
  'lgs-math-veri-analiz': {
    summary: 'Veri analizi: ortalama, ortanca, tepe değer, grafik okuma.',
    bullets: [
      'Aritmetik ortalama = toplam / veri sayısı.',
      'Ortanca: sıralı dizinin ortasındaki değer.',
      'Tepe değer (mod): en sık görülen.',
      'Grafikte birim ve ölçeği önce oku.',
    ],
    examCue: 'LGS: ortanca için önce sıralama şart.',
    checkPrompt: 'Verileri sıraladım mı?',
    tip: 'Grafik sorusunda eksen etiketlerini atlama.',
  },
  'lgs-math-ucgenler': {
    summary: 'Üçgenler: açı, kenar bağıntıları ve alan.',
    bullets: [
      'İç açılar toplamı 180°.',
      'Üçgen eşitsizliği: herhangi iki kenar toplamı üçüncüden büyük.',
      'Alan = (taban × yükseklik) / 2.',
      'İkizkenar / eşkenar özelliklerini karıştırma.',
    ],
    examCue: 'LGS: dış açı = kendisine komşu olmayan iki iç açının toplamı.',
    checkPrompt: 'Açıları toplayınca 180 oluyor mu?',
    tip: 'Şekli yeniden çizip verilenleri yaz.',
  },

  // ─── LGS Fen ────────────────────────────────────────────────
  'lgs-science-basinc': {
    summary: 'Basınç: katı, sıvı ve gaz basıncı; birim ve bağıntılar.',
    bullets: [
      'Katı basıncı: P = F/A — kuvvet artar / alan azalırsa basınç artar.',
      'Sıvı basıncı derinlik ve özkütle ile artar.',
      'Açık hava basıncı yükseklik arttıkça azalır.',
      'Birimleri (Pascal, N/m²) tutarlı kullan.',
    ],
    examCue: 'LGS: “keskin uç daha çok batar” → alan küçülür, basınç artar.',
    checkPrompt: 'Kuvvet mi alan mı değişiyor?',
    tip: 'Günlük örnekle (kar ayakkabısı, bıçak) şıkları test et.',
  },
  'lgs-science-madde': {
    summary: 'Madde ve endüstri: hâl, karışım, element–bileşik.',
    bullets: [
      'Element tek tür atom; bileşik sabit oranda birleşim.',
      'Homojen / heterojen karışımı ayır.',
      'Fiziksel değişimde öz değişmez; kimyasalda yeni madde oluşur.',
      'Periyodik özelliklere giriş sorularında tabloyu oku.',
    ],
    examCue: 'LGS: erime–donma fizikseldir; yanma kimyasaldır.',
    checkPrompt: 'Yeni madde oluştu mu?',
    tip: 'Önce “özellik mi değişim mi?” diye sınıflandır.',
  },
  'lgs-science-enerji': {
    summary: 'Enerji dönüşümleri: kinetik, potansiyel, ısı, elektrik.',
    bullets: [
      'Enerji yoktan var / vardan yok olmaz; dönüşür.',
      'Yükseklik artarsa potansiyel artar; hız artarsa kinetik artar.',
      'Isı ile sıcaklığı karıştırma.',
      'Dönüşüm diyagramında giriş–çıkış enerjilerini yaz.',
    ],
    examCue: 'LGS: “kaybolan enerji” şıkkı genelde yanlıştır — dönüşmüştür.',
    checkPrompt: 'Hangi enerji hangisine dönüştü?',
    tip: 'Ok yönlü bir diyagram çiz.',
  },
  'lgs-science-elektrik': {
    summary: 'Elektrik: devre elemanları, akım, gerilim, direnç.',
    bullets: [
      'Kapalı devrede akım dolaşır; açıkta dolaşmaz.',
      'Seri / paralel bağlantıda ampul parlaklığı değişir.',
      'Direnç artarsa akım azalır (aynı gerilimde).',
      'Sigorta ve anahtarın görevini karıştırma.',
    ],
    examCue: 'LGS: paralel brançta bir ampul sönse diğeri yanabilir.',
    checkPrompt: 'Devre kapalı mı? Elemanlar seri mi paralel mi?',
    tip: 'Devreyi yeniden çizip akım yolunu takip et.',
  },
  'lgs-science-dna': {
    summary: 'DNA ve genetik: kalıtım, gen, çaprazlama temelleri.',
    bullets: [
      'DNA kalıtsal bilgiyi taşır; gen özellik birimidir.',
      'Dominant / çekinik alelleri ayır.',
      'Çaprazlamada olası genotipleri yaz.',
      'Çevre etkisi ile kalıtımı karıştırma.',
    ],
    examCue: 'LGS: fenotip görünür özellik, genotip gen yapısıdır.',
    checkPrompt: 'Soru genotip mi fenotip mi istiyor?',
    tip: 'Punnett karesi (basit tablo) hız kazandırır.',
  },

  // ─── LGS İnkılap / Din / İngilizce ──────────────────────────
  'lgs-history-milli-mucadele': {
    summary: 'Milli Mücadele: kongreler, cepheler, zafer ve antlaşmalar.',
    bullets: [
      'Sivas / Erzurum kongrelerinin amacını ayır.',
      'Düzenli orduya geçişin nedenini bil.',
      'Sakarya / Büyük Taarruz sonuçlarını karıştırma.',
      'Lozan’ı Mudanya ile eşleştirme.',
    ],
    examCue: 'LGS: kronoloji sorularında önce–sonra zincirini kur.',
    checkPrompt: 'Bu olay hangi yıldan önce / sonra?',
    tip: 'Olay → sebep → sonuç diye üç kutu yaz.',
  },
  'lgs-history-inkilaplar': {
    summary: 'Atatürk ilke ve inkılapları: amaç ve uygulama.',
    bullets: [
      'İlke ile inkılabı karıştırma (cumhuriyetçilik ≠ şapka inkılabı).',
      'Eğitim, hukuk, toplumsal alandaki inkılapları grupla.',
      'Laiklik ve milliyetçilik uygulamalarını örnekle bağla.',
      'İnkılabın “neden yapıldığı” sorusu sık gelir.',
    ],
    examCue: 'LGS: inkılabı yanlış alana (hukuk/eğitim) yerleştirme tuzağı.',
    checkPrompt: 'Bu inkılap hangi alanı değiştiriyor?',
    tip: 'Önce alan (eğitim/hukuk/toplum), sonra örnek.',
  },
  'lgs-history-dis-politika': {
    summary: 'Cumhuriyet dönemi dış politika: barış, denge, antlaşmalar.',
    bullets: [
      '“Yurtta sulh, cihanda sulh” ilkesini olaylara bağla.',
      'Milletler Cemiyeti, Balkan / Sadabad gibi adımları tanı.',
      'Hatay sürecini bil.',
      'İç politika ile dış politikayı karıştırma.',
    ],
    examCue: 'LGS: antlaşma adını dönemle eşleştir.',
    checkPrompt: 'Bu politika barışçı denge mi, yoksa iç reform mu?',
    tip: 'Harita üzerinde komşu ülkeleri hatırla.',
  },
  'lgs-religion-inanc': {
    summary: 'İnanç: temel inanç esasları ve kavramlar.',
    bullets: [
      'İman esaslarını ezber değil anlamla bağla.',
      'Tevhit / nübüvvet gibi kavramları ayır.',
      'İnanç ile ibadeti karıştırma.',
      'Metne dayanmayan yorumu seçme.',
    ],
    examCue: 'LGS Din: soru kökü “inanç” mı “ibadet” mi diye bak.',
    checkPrompt: 'Bu kavram inanç mı, uygulama mı?',
    tip: 'Tanımı bir cümlelik örnekle bağla.',
  },
  'lgs-religion-ibadet': {
    summary: 'İbadet: amaç, çeşitler ve günlük yaşam bağı.',
    bullets: [
      'İbadetin bireysel ve toplumsal boyutunu ayır.',
      'Farziyet / sünnet ayrımını abartmadan bil.',
      'Temizlik ve niyet vurgusunu oku.',
      'Ezber madde listesi yerine “neden yapılır?” sor.',
    ],
    examCue: 'LGS: ibadet sorusunda ahlakî mesaj şıkkı sık doğru olur.',
    checkPrompt: 'Soru biçim mi, amaç mı soruyor?',
    tip: 'Şıkları “yardımlaşma / sorumluluk” dilinde ele.',
  },
  'lgs-english-vocabulary': {
    summary: 'Kelime bilgisi: bağlamdan anlam ve sık kalıplar.',
    bullets: [
      'Unknown word → cümledeki ipuçlarına bak.',
      'Synonym / opposite sorularında bağlamı koru.',
      'Phrasal verb’ü parçalayıp değil bütün olarak düşün.',
      'Şıkkı cümleye geri koy.',
    ],
    examCue: 'LGS İngilizce: tek kelime ezberi yetmez — bağlam şart.',
    checkPrompt: 'Bu şık cümlenin anlamını bozuyor mu?',
    tip: 'Önce tüm cümleyi oku, sonra boşluğu doldur.',
  },
  'lgs-english-reading': {
    summary: 'Okuma / diyalog: ana fikir, detay ve konuşma kalıbı.',
    bullets: [
      'Diyalogda sorulan kişiye göre cevap seç.',
      'Main idea genelde ilk veya son cümlede.',
      'True/False detayda metne dön.',
      'Görgü / rica kalıplarını (Could you…?) tanı.',
    ],
    examCue: 'LGS: diyalogda “kim soruyor?” tuzağına düşme.',
    checkPrompt: 'Cevap soruyu soran kişiye uygun mu?',
    tip: 'Konuşmacıları A/B diye etiketle.',
  },

  // ─── YGS Türkçe / Edebiyat ──────────────────────────────────
  'ygs-turkish-paragraf': {
    summary: 'TYT paragraf: ana fikir, anlatım biçimi, çıkarım temposu.',
    bullets: [
      'Önce soru kökünü oku, sonra metne dön — süre kazanırsın.',
      'Öyküleme olay, betimleme tasvir, açıklama bilgi, tartışma sav.',
      'Çıkarımda metnin sınırını aşma.',
      'Uzun paragrafta gereksiz detaya takılma.',
    ],
    examCue: 'YGS/TYT: “anlatım biçimi” ile “düşünceyi geliştirme” karışmasın.',
    checkPrompt: 'Kök ne istiyor: ana fikir mi, biçim mi?',
    tip: 'Şıkları elemek çoğu zaman bulmaktan hızlıdır.',
  },
  'ygs-turkish-anlam': {
    summary: 'Anlam bilgisi: sözcük/cümle anlamı ve anlam ilgileri.',
    bullets: [
      'Amaç-sonuç ile neden-sonucu ayır: “yapmak için” çoğunlukla amaç.',
      'Şıkları metne / cümleye götür; ezber etiket seçme.',
      'Uzun cümlede önce fiili, sonra bağı ayır.',
      'Mecaz / deyim sorusunda bağlam şart.',
    ],
    examCue: 'YGS: “için” görürsen amaç mı sebep mi diye sesli oku.',
    checkPrompt: 'Bağlacı değiştirince anlam bozuluyor mu?',
    tip: 'Önce bağı dairele, sonra şık.',
  },
  'ygs-turkish-dilbilgisi': {
    summary: 'Dil bilgisi (TYT): ses, yazım, sözcük, cümle.',
    bullets: [
      'Yazım ve noktalama ayrı köklerdir — karıştırma.',
      'Fiilimsi / zarf-fiil ayrımını örnekle pekiştir.',
      'Cümle türlerini yükleme göre bul.',
      'Anlamsız kural ezberi yerine “görev” sor.',
    ],
    examCue: 'YGS: birleşik sözcük yazımı sık çeldirici.',
    checkPrompt: 'Bu sözcük cümlede hangi görevde?',
    tip: 'Şüphede yüklemden geriye çöz.',
  },
  'ygs-literature-siir': {
    summary: 'Şiir bilgisi (AYT): nazım birimi, ölçü, edebî sanat.',
    bullets: [
      'Nazım birimi (beyit, dörtlük) ile ölçüyü ayır.',
      'Redif / kafiye ayrımını ses benzerliğine göre yap.',
      'Sanatları (teşbih, istiare…) örnekle tanı.',
      'Dönem + şair eşlemesini kur.',
    ],
    examCue: 'YGS/AYT: sanat adını ezberlemeden dizedeki ilişkiyi gör.',
    checkPrompt: 'Benzetilen / benzeyen net mi?',
    tip: 'Önce dizeyi modern Türkçeye çevir.',
  },
  'ygs-literature-nesir': {
    summary: 'Nesir / edebiyat tarihi: tür, dönem, temsilci.',
    bullets: [
      'Roman, hikâye, tiyatro, deneme özelliklerini ayır.',
      'Tanzimat / Servet-i Fünûn / Millî Edebiyat çizgisini bil.',
      'Eser–yazar eşlemesinde dönemi de kontrol et.',
      'Soru “özellik” mi “temsilci” mi istiyor bak.',
    ],
    examCue: 'AYT: eser adını yanlış döneme yapıştırma tuzağı.',
    checkPrompt: 'Bu eser hangi dönemin ruhuna uyuyor?',
    tip: 'Dönem → özellik → örnek üçlüsü kur.',
  },

  // ─── YGS Matematik ──────────────────────────────────────────
  'ygs-math-temel-kavramlar': {
    summary: 'Temel kavramlar: sayı kümeleri, işlem önceliği, mutlak değer.',
    bullets: [
      'Doğal, tam, rasyonel, irrasyonel ayrımını net tut.',
      'Öncelik: parantez → üs → çarpma/bölme → toplama/çıkarma.',
      'Mutlak değer uzaklık demektir: |a| ≥ 0.',
      'Çözüm kümesi dilini (∈, ⊆) doğru oku.',
    ],
    examCue: 'YGS: işaret hatalarının çoğu öncelik unutulmasından gelir.',
    checkPrompt: 'İşlem sırasını baştan uyguladım mı?',
    tip: 'Parantezleri renklendirerek çöz.',
  },
  'ygs-math-sayilar': {
    summary: 'Sayılar: asal, EBOB–EKOK, basamak.',
    bullets: [
      'Asal çarpanlara ayırma EBOB–EKOK’un anahtarıdır.',
      'Basamak değeri ile basamak sayısı karışmasın.',
      'Tek/çift ve pozitif/negatif durumlarını ayrı yaz.',
      'Modüler düşünce (kalan) hız kazandırır.',
    ],
    examCue: 'YGS: EBOB ile EKOK formülünü ters kullanma.',
    checkPrompt: 'Asal çarpanları doğru yazdım mı?',
    tip: 'Küçük örnekle kuralı doğrula.',
  },
  'ygs-math-bolunebilme': {
    summary: 'Bölünebilme kuralları ve kalan problemleri.',
    bullets: [
      '2, 3, 4, 5, 9, 11 kurallarını ezber değil gerekçeyle bil.',
      'Kalanlı bölmede a = bq + r, 0 ≤ r < b.',
      'Ortak bölünenlerde EBOB mantığını kullan.',
      'Şık varsa yerine koyma geçerli taktiktir.',
    ],
    examCue: 'YGS: 4’e bölünmede son iki basamak; 3’te rakamlar toplamı.',
    checkPrompt: 'Hangi basamağa bakmam gerekiyor?',
    tip: 'Kuralı bir örnekle test et, sonra soruya dön.',
  },
  'ygs-math-faktoriyel': {
    summary: 'Faktöriyel: n!, sadeleştirme, denklem.',
    bullets: [
      'n! = n·(n−1)·…·1; 0! = 1.',
      'Kesirli faktöriyellerde ortak çarpanları sadeleştir.',
      'Denklemde her iki tarafı aynı faktöriyelle yaz.',
      'n büyükse şıklardan eleme yap.',
    ],
    examCue: 'YGS: (n+1)! = (n+1)·n! kimliğini unutma.',
    checkPrompt: 'Sadeleştirmeden sonra ne kaldı?',
    tip: 'Küçük n ile dene, sonra genelle.',
  },
  'ygs-math-denklemler': {
    summary: 'Denklemler (YGS/YKS): doğrusal, köklü, üslü.',
    bullets: [
      'Doğrusal: ax+b=c → x yalnız kalır.',
      'İki tarafı sadeleştir; ortak çarpan varsa böl.',
      'Köklü/üslü denklemlerde tanım kümesini yaz.',
      'Şık varsa yerine koyma hız taktiğidir.',
    ],
    examCue: 'YGS: köklü denklemde dışarıda kalan çözümleri ele.',
    checkPrompt: 'Bulduğum kök tanım kümesinde mi?',
    tip: 'Önce tanım, sonra çözüm, sonra kontrol.',
  },
  'ygs-math-esitsizlik': {
    summary: 'Eşitsizlikler: işaret, aralık, mutlak değer.',
    bullets: [
      'Eşitsizliği çarparken/bölerken işaret yönünü kontrol et.',
      'Çözümü sayı doğrusunda göster.',
      'Mutlak değerli eşitsizlikte kritik noktaları bul.',
      'Kesişim / birleşim dilini doğru oku.',
    ],
    examCue: 'YGS: negatif sayı ile çarpınca yön döner.',
    checkPrompt: 'Sınır noktaları dahil mi (≤ / <)?',
    tip: 'Sayı doğrusu çizmeden işaretleme.',
  },
  'ygs-math-fonksiyonlar': {
    summary: 'Fonksiyonlar: tanım, görüntü, bileşke.',
    bullets: [
      'f: A→B her elemana tek görüntü verir.',
      'f(x)=… ifadesinde x yerine verileni yaz.',
      '(f∘g)(x) = f(g(x)) — içten dışa.',
      'Tanım kümesi dışındaki x’leri ele.',
    ],
    examCue: 'YGS: bileşkede sırayı ters çevirmek klasik hata.',
    checkPrompt: 'İç fonksiyonu önce mi hesapladım?',
    tip: 'Adım adım yerine koy, tek satırda sıkıştırma.',
  },
  'ygs-math-trigonometri': {
    summary: 'Trigonometri: oranlar, birim çember, özdeşlik.',
    bullets: [
      'sin, cos, tan tanımlarını dik üçgende kur.',
      'Birim çemberde işaretleri bölgeye göre yaz.',
      'Temel özdeşlik: sin²+cos²=1.',
      'Derece / radyan birimini karıştırma.',
    ],
    examCue: 'YGS: ikinci bölgede sin pozitif, cos negatiftir.',
    checkPrompt: 'Açı hangi bölgede?',
    tip: 'Birim çember taslağı çiz.',
  },
  'ygs-math-limit-turev': {
    summary: 'Limit / türev (AYT): yaklaşım ve anlık değişim.',
    bullets: [
      'Limit “ne olur?” değil “neye yaklaşır?” sorusudur.',
      '0/0 belirsizliğinde çarpanlara ayır / sadeleştir.',
      'Türev: anlık değişim oranı; temel kuralları bil.',
      'Grafikte teğet eğimi = türev.',
    ],
    examCue: 'AYT: soldan/sağdan limit farklıysa limit yok.',
    checkPrompt: 'Belirsizlik var mı, sadeleştirdim mi?',
    tip: 'Önce yerine koy; belirsizse cebirsel müdahale.',
  },
  'ygs-math-integral': {
    summary: 'İntegral (AYT): antıtürev ve alan yorumu.',
    bullets: [
      'Belirsiz integral +C unutulmaz.',
      'Belirli integrali alan olarak oku.',
      'Temel fonksiyonların antıtürevlerini bil.',
      'Sınırları değiştirirken işareti kontrol et.',
    ],
    examCue: 'AYT: alan sorusunda x ekseni altı negatif çıkabilir.',
    checkPrompt: '+C veya sınırları doğru yazdım mı?',
    tip: 'Türev ile doğrula.',
  },

  // ─── YGS Fen ────────────────────────────────────────────────
  'ygs-physics-hareket': {
    summary: 'Hareket: konum, hız, ivme ve grafikler.',
    bullets: [
      'v = Δx/Δt; a = Δv/Δt.',
      'Konum–zaman eğimi hız; hız–zaman eğimi ivme.',
      'Düzgün doğrusal / düzgün hızlanan ayrımını yap.',
      'Birimleri SI’de tut.',
    ],
    examCue: 'YGS: grafik eğimi ile alanın anlamını karıştırma.',
    checkPrompt: 'Grafikte eğim mi alan mı isteniyor?',
    tip: 'Eksenleri yüksek sesle oku.',
  },
  'ygs-physics-kuvvet': {
    summary: 'Kuvvet ve enerji: Newton yasaları, iş, enerji.',
    bullets: [
      'ΣF = ma — net kuvvet ivmeyi belirler.',
      'İş = kuvvet × yol (aynı doğrultuda).',
      'Mekanik enerji korunumu sürtünmesiz idealde.',
      'Sürtünme yönü harekete zıttır.',
    ],
    examCue: 'YGS: “etki–tepki aynı cisimde” yanlıştır.',
    checkPrompt: 'Net kuvveti doğru yönde çizdim mi?',
    tip: 'Serbest cisim diyagramı çiz.',
  },
  'ygs-physics-elektrik': {
    summary: 'Elektrik: yük, alan, potansiyel, basit devre.',
    bullets: [
      'Aynı yükler iter, zıt yükler çeker.',
      'Akım I = V/R (ohm yasası) basit devrede.',
      'Seri/paralel eşdeğer direnç kurallarını bil.',
      'Güç P = V·I ilişkilerini kullan.',
    ],
    examCue: 'YGS: paralel brançta gerilim aynıdır.',
    checkPrompt: 'Elemanlar seri mi paralel mi?',
    tip: 'Devreyi sadeleştirerek çöz.',
  },
  'ygs-chemistry-atom': {
    summary: 'Atom ve periyodik sistem: yapı ve periyodik özellik.',
    bullets: [
      'Proton = atom numarası; kütle no = p+n.',
      'İyon: elektron alıp/verme.',
      'Grup / periyot eğilimlerini (yarıçap, iyonlaşma) bil.',
      'İzotop: aynı p, farklı n.',
    ],
    examCue: 'YGS: atom no ile kütle no karıştırması klasik.',
    checkPrompt: 'Elektron sayısı nötr atomda protona eşit mi?',
    tip: 'Önce p–n–e tablosu yaz.',
  },
  'ygs-chemistry-kimyasal-tepkimeler': {
    summary: 'Kimyasal tepkimeler: denkleştirme, tür, mol.',
    bullets: [
      'Denkleştirmede atom sayılarını eşitle.',
      'Sentez / analiz / yanma / yer değiştirme türlerini tanı.',
      'Mol = m/M; oranları katsayılardan oku.',
      'Sınırlayıcı bileşeni unutma.',
    ],
    examCue: 'YGS: katsayıyı indise yazmak hata.',
    checkPrompt: 'Her element iki tarafta eşit mi?',
    tip: 'Önce en karmaşık formülü denkleştir.',
  },
  'ygs-chemistry-asit-baz': {
    summary: 'Asitler ve bazlar: pH, nötrleşme, göstergeler.',
    bullets: [
      'Asit H⁺ verir / baz OH⁻ verir (basit model).',
      'pH < 7 asit, =7 nötr, >7 baz.',
      'Nötrleşmede tuz + su oluşur.',
      'Gösterge rengini ezberle değil tabloyla oku.',
    ],
    examCue: 'YGS: kuvvetli/zayıf asidi derişimle karıştırma.',
    checkPrompt: 'pH arttı mı azaldı mı?',
    tip: 'Nötrleşme denklemini yaz.',
  },
  'ygs-biology-hucre': {
    summary: 'Hücre: organeller, prokarya–ökarya, zar.',
    bullets: [
      'Organel–görev eşlemesini net tut (mitokondri, ribozom…).',
      'Bitki / hayvan hücresi farklarını bil.',
      'Zar seçici geçirgendir.',
      'DNA konumu (çekirdek) ökaryotta.',
    ],
    examCue: 'YGS: ribozom iki tip hücrede de vardır.',
    checkPrompt: 'Bu organel hangi hücrede bulunur?',
    tip: 'Karşılaştırma tablosu çiz.',
  },
  'ygs-biology-sistemler': {
    summary: 'Sistemler: yapı–görev ve homeostazi.',
    bullets: [
      'Sistemi organ → görev zinciriyle oku.',
      'Dolaşım / solunum / sindirim etkileşimini bil.',
      'Hormon–sinir koordinasyonunu karıştırma.',
      'Hastalık / bozukluk sorusunda önce normali yaz.',
    ],
    examCue: 'YGS: organı yanlış sisteme bağlama tuzağı.',
    checkPrompt: 'Bu organ hangi sistemde?',
    tip: 'Önce sistem adı, sonra organ, sonra görev.',
  },
  'ygs-biology-ekoloji': {
    summary: 'Ekoloji: popülasyon, besin zinciri, madde döngüsü.',
    bullets: [
      'Üretici → tüketici → ayrıştırıcı akışını kur.',
      'Enerji piramidinde yukarı çıkıldıkça enerji azalır.',
      'Simbiyoz türlerini ayır.',
      'Madde döngüsü (C, N, su) ezberini örnekle bağla.',
    ],
    examCue: 'YGS: madde döngüsü kapanır, enerji akışı tek yönlüdür.',
    checkPrompt: 'Bu canlı üretici mi tüketici mi?',
    tip: 'Besin zincirini okla çiz.',
  },

  // ─── YGS Sosyal ─────────────────────────────────────────────
  'ygs-history-osmanli': {
    summary: 'Osmanlı: kuruluş, yükselme, kurumlar, gerileme.',
    bullets: [
      'Dönem özelliklerini (tımar, devşirme…) olayla bağla.',
      'Islahat / semerant ayrımını karıştırma.',
      'Savaş–antlaşma sonuçlarını bil.',
      'Kronoloji sorusunda önce–sonra kur.',
    ],
    examCue: 'YGS: kurum adını yanlış yüzyıla yerleştirme.',
    checkPrompt: 'Bu olay hangi dönemde?',
    tip: 'Yüzyıl + padişah + olay üçlüsü yaz.',
  },
  'ygs-history-inkilap': {
    summary: 'İnkılap tarihi: Milli Mücadele’den Cumhuriyet’e.',
    bullets: [
      'Kongreler → TBMM → cepheler → Lozan zinciri.',
      'İnkılapların alanını (hukuk, eğitim…) ayır.',
      'İlkelerin günlük politikaya yansımasını oku.',
      'Antlaşma adlarını karıştırma.',
    ],
    examCue: 'YGS: Mudanya ateşkes, Lozan barış antlaşmasıdır.',
    checkPrompt: 'Bu adım askerî mi siyasî mi?',
    tip: 'Zaman şeridi çiz.',
  },
  'ygs-history-cagdas': {
    summary: 'Çağdaş Türk ve dünya tarihi: 20. yy olayları.',
    bullets: [
      'I. / II. Dünya Savaşı sonuçlarını ayır.',
      'Soğuk Savaş kurumlarını (NATO, BM) tanı.',
      'Türkiye’nin çok partili hayata geçişini bil.',
      'Küresel olay–Türkiye yansıması sorularına hazır ol.',
    ],
    examCue: 'YGS: tarih ile güncel siyaset yorumunu karıştırma.',
    checkPrompt: 'Olayın yılı / dönemi net mi?',
    tip: 'Önce dünya, sonra Türkiye etkisini yaz.',
  },
  'ygs-geography-fiziki': {
    summary: 'Fiziki coğrafya: yerşekli, iklim, iç/dış kuvvetler.',
    bullets: [
      'İç kuvvet (tektonik) / dış kuvvet (aşınım) ayrımı.',
      'İklim elemanları: sıcaklık, yağış, basınç, rüzgâr.',
      'Haritada yükselti ve enlem etkisini oku.',
      'Bitki örtüsü–iklim eşlemesi yap.',
    ],
    examCue: 'YGS: enlem ile yükseltinin sıcaklığa etkisini karıştırma.',
    checkPrompt: 'Soru iklim mi yerşekli mi soruyor?',
    tip: 'Harita varsa önce onu oku.',
  },
  'ygs-geography-beseri': {
    summary: 'Beşeri coğrafya: nüfus, yerleşme, göç.',
    bullets: [
      'Nüfus artış hızı / yoğunluk ayrımını yap.',
      'Kır–kent yerleşme özelliklerini bil.',
      'Göç neden–sonuç zinciri kur.',
      'Grafik/tabloda birimi oku.',
    ],
    examCue: 'YGS: yoğunluk = nüfus / alan; artışı hızla karıştırma.',
    checkPrompt: 'Tablo hangi birimi kullanıyor?',
    tip: 'Önce grafik başlığını oku.',
  },
  'ygs-geography-turkiye': {
    summary: 'Türkiye coğrafyası: bölgeler, iklim, ekonomi.',
    bullets: [
      'Bölgelerin iklim ve ekonomik özelliklerini ayır.',
      'Tarım / sanayi / turizm dağılımını bil.',
      'Akarsu / göl / dağ isimlerini bölgeyle eşleştir.',
      'Ulaşım ve liman sorularında haritayı kullan.',
    ],
    examCue: 'YGS: bölge–ürün eşlemesi sık sorulur.',
    checkPrompt: 'Bu özellik hangi bölgeye uyuyor?',
    tip: 'Türkiye haritasını zihninde bölgelere böl.',
  },
  'ygs-philosophy-felsefe': {
    summary: 'Felsefe: alanlar, temel sorular, düşünürler.',
    bullets: [
      'Bilgi / varlık / ahlak / sanat alanını ayır.',
      'Tanım ↔ örnek eşlemesi yap.',
      'Düşünürü dönemi ve sorusuyla bağla.',
      'Uç genellemeleri ele.',
    ],
    examCue: 'YGS: felsefe sorusunda “günlük kanaat” şıkkı genelde zayıf.',
    checkPrompt: 'Bu soru hangi felsefe alanına ait?',
    tip: 'Önce alan, sonra kavram, sonra düşünür.',
  },
  'ygs-philosophy-mantik': {
    summary: 'Mantık: önerme, çıkarım, doğruluk tablosu.',
    bullets: [
      'Önerme doğru/yanlış değer alabilen cümledir.',
      'Tutarlılık / geçerlilik ayrımını bil.',
      'Değil, ve, veya bağlaçlarını doğru uygula.',
      'Çıkarımda öncülleri yaz.',
    ],
    examCue: 'YGS: günlük dil ile mantık bağlacını karıştırma.',
    checkPrompt: 'Öncüller doğruysa sonuç zorunlu mu?',
    tip: 'Sembolle yaz, sonra Türkçeye dön.',
  },
  'ygs-religion-inanc-ibadet': {
    summary: 'İnanç / ibadet: kavramlar ve ahlakî boyut.',
    bullets: [
      'İnanç esasları ile ibadet çeşitlerini ayır.',
      'Ahlakî mesajı metne bağla.',
      'Ezber madde yerine “amaç” sor.',
      'Diğer dinî kavramlarla karıştırma.',
    ],
    examCue: 'YGS: kök “inanç” ise uygulama şıkkını ele.',
    checkPrompt: 'Soru bilgi mi tutum mu istiyor?',
    tip: 'Tanımı bir örnek davranışla bağla.',
  },

  // ─── KPSS Türkçe ────────────────────────────────────────────
  'kpss-turkish-paragraf': {
    summary: 'KPSS paragraf: anlatım biçimleri ve hızlı kök okuma.',
    bullets: [
      'Öyküleme: olayları zaman içinde anlatır.',
      'Betimleme duyularla resmeder; açıklama bilgi verir; tartışma savunur.',
      'Şıkları metne götür — “güzel duruyor” diye seçme.',
      'Uzun metinde önce kök, sonra ilgili paragraf dilimi.',
    ],
    examCue: 'KPSS: anlatım biçimi ile düşünceyi geliştirme yollarını karıştırma.',
    checkPrompt: 'Metinde zaman mı, tasvir mi baskın?',
    tip: 'Eylem/zaman mı, sıfat/duyu mu diye bak.',
  },
  'kpss-turkish-anlam': {
    summary: 'Anlam bilgisi: cümlede anlam ilgileri.',
    bullets: [
      'Amaç-sonuç: “…mek için” → amaç.',
      'Neden-sonuç: çünkü, -den dolayı, yüzünden.',
      'Koşul: eğer, -se/-sa; karşıtlık: oysa, fakat, rağmen.',
      'Şıkkı cümleye geri koy.',
    ],
    examCue: 'KPSS: amaç ile nedeni ayırmak puan getirir.',
    checkPrompt: 'Bağ sözcüğü hangisi?',
    tip: 'Önce bağlacı bul, sonra şık.',
  },
  'kpss-turkish-dilbilgisi': {
    summary: 'Dil bilgisi: yazım, noktalama, sözcük, cümle.',
    bullets: [
      'de/da, ki, mi yazımına dikkat.',
      'Noktalama sorusunda cümlenin duraklarını oku.',
      'Fiilimsi türlerini görevle ayır.',
      'Özne–yüklem uyumunu kontrol et.',
    ],
    examCue: 'KPSS GY: yazım–noktalama ayrı soru tipleridir.',
    checkPrompt: 'Bu “de” bağlaç mı ek mi?',
    tip: 'Şüphede cümleden çıkar — anlam bozulursa ek değildir.',
  },
  'kpss-turkish-sozel-mantik': {
    summary: 'Sözel mantık: sıralama, gruplama, diyagram.',
    bullets: [
      'Verilenleri tabloya dök; çelişeni ele.',
      '“En az / tam / yalnızca” ifadelerini işaretle.',
      'İki ifadeyi birleştirmeden önce tek tek yaz.',
      'Şıklardan eleme çoğu zaman hızlıdır.',
    ],
    examCue: 'KPSS: “olabilir” ile “zorunlu”yu karıştırma.',
    checkPrompt: 'Bu bilgi kesin mi, olasılık mı?',
    tip: 'Küçük bir tablo çiz, boş bırakma.',
  },

  // ─── KPSS Matematik / Geometri ──────────────────────────────
  'kpss-math-temel-islemler': {
    summary: 'Temel işlemler: öncelik, kesirli parantez, sadeleştirme.',
    bullets: [
      'Öncelik: parantez → çarpma/bölme → toplama/çıkarma.',
      'Kesirli parantezde önce içi bitir.',
      'Pay/payda biçiminde üstü ve altı ayrı hesapla.',
      'Sonucu şıklara götür.',
    ],
    examCue: 'KPSS: uzun işlemde ara adımı şıklara yasla.',
    checkPrompt: 'Parantezi bitirdim mi?',
    tip: 'Şık varsa sonuçtan geriye de gidebilirsin.',
  },
  'kpss-math-kesirler': {
    summary: 'Kesir işlemleri (KPSS): dört işlem ve bileşik kesir.',
    bullets: [
      'Toplama/çıkarmada payda eşitle.',
      'Bileşik kesir: (a/b)÷(c/d) = (a/b)×(d/c).',
      'Parantezli ifadelerde önce içteki kesri sadeleştir.',
      'Sonucu en sade hâle getir.',
    ],
    examCue: 'KPSS: “kalanın kesri” ifadesini atlama.',
    checkPrompt: 'Payda eşitledim mi?',
    tip: 'Sonucu şıklarla eşleştirmeden sadeleştir.',
  },
  'kpss-math-yuzde': {
    summary: 'Yüzde problemleri: artış, azalış, kâr–zarar.',
    bullets: [
      'Artış: ×(1+p/100); azalış: ×(1−p/100).',
      'İki ardışık değişimi çarp.',
      '“Eskisine göre yüzde kaç” → fark/eski×100.',
      '100 TL varsayımı klasik hız yöntemidir.',
    ],
    examCue: 'KPSS: yüzde puan ile yüzde değişimi karıştırma.',
    checkPrompt: 'Ardışık değişimi çarptım mı?',
    tip: '100 üzerinden düşün.',
  },
  'kpss-math-oran-oranti': {
    summary: 'Oran–orantı: doğru/ters, işçi–havuz.',
    bullets: [
      'Doğru orantıda a/b = c/d → ad = bc.',
      'İşçi–havuz tipinde ters orantıyı tanı.',
      'Oranları ortak birime indir.',
      'Tablo çizmek sözeli sayısala çevirir.',
    ],
    examCue: 'KPSS: ters orantıda çarpım sabittir.',
    checkPrompt: 'Doğru mu ters mi?',
    tip: 'Birimleri yaz.',
  },
  'kpss-math-problemler': {
    summary: 'Problemler: yaş, hız, karışım, iş.',
    bullets: [
      'Verilenleri ve isteneni ayır; bilinmeyeni tanımla.',
      'Birim tutarlılığı şart.',
      'Sonucu şıklara ve sağduyuya göre kontrol et.',
      'Önce “ne arıyorum?” cümlesini yaz.',
    ],
    examCue: 'KPSS: gereksiz bilgiyi veri sanma.',
    checkPrompt: 'İstenen net mi?',
    tip: 'Kısa bir denklem kur.',
  },
  'kpss-math-sayisal-mantik': {
    summary: 'Sayısal mantık: örüntü, şekil, işlem kuralı.',
    bullets: [
      'Örüntüyü bir önceki–sonraki farkla yakala.',
      'Şekil sorusunda say / dön / simetri dene.',
      'İşlem kuralını örneklerden çıkar.',
      'Şıklardan eleme yap.',
    ],
    examCue: 'KPSS: tek örnekle kural uydurma — iki örnekle doğrula.',
    checkPrompt: 'Kural tüm örneklere uyuyor mu?',
    tip: 'Fark tablosu çiz.',
  },
  'kpss-math-veri': {
    summary: 'Tablo / grafik: okuma, ortalama, yorum.',
    bullets: [
      'Önce başlık ve birimleri oku.',
      'Ortalama / yüzde sorularında ham veriyi yaz.',
      'Grafik türüne göre (çubuk, dilim) doğru oku.',
      'Gereksiz serileri ele.',
    ],
    examCue: 'KPSS: eksen ölçeğini atlamak sonucu bozar.',
    checkPrompt: 'Birim nedir?',
    tip: 'İstenen hücreyi kalemle işaretle.',
  },
  'kpss-geometry-ucgen': {
    summary: 'Üçgenler: açı, kenar, benzerlik, alan.',
    bullets: [
      'İç açılar 180°; dış açı kuralını bil.',
      'Benzerlikte oranları doğru eşleştir.',
      'Alan = taban×yükseklik/2.',
      'Özel üçgen (30-60-90, 45-45-90) oranlarını kullan.',
    ],
    examCue: 'KPSS: benzerlikte karşılıklı kenarları yanlış eşlemek.',
    checkPrompt: 'Açılar karşılıklı mı?',
    tip: 'Şekli yeniden çiz.',
  },
  'kpss-geometry-dortgen': {
    summary: 'Dörtgenler: paralellik, dikdörtgen, kare, yamuk.',
    bullets: [
      'İç açılar toplamı 360°.',
      'Paralelkenar / dikdörtgen / kare özelliklerini ayır.',
      'Yamukta yalnızca bir çift kenar paraleldir.',
      'Alan formüllerini karıştırma.',
    ],
    examCue: 'KPSS: her dikdörtgen paralelkenardır; tersi değil.',
    checkPrompt: 'Kaç kenar paralel?',
    tip: 'Özellik listesinden eleme yap.',
  },
  'kpss-geometry-cember': {
    summary: 'Çember / daire: açı, yay, alan, çevre.',
    bullets: [
      'Merkez açı / çevre açı ilişkisini bil.',
      'Çevre = 2πr; alan = πr².',
      'Teğet yarıçapa diktir.',
      'Yay uzunluğu oranını merkez açıdan oku.',
    ],
    examCue: 'KPSS: çapı yarıçap sanmak klasik hata.',
    checkPrompt: 'r mi d mi verilmiş?',
    tip: 'Merkezi işaretle, açıları yaz.',
  },

  // ─── KPSS GK ────────────────────────────────────────────────
  'kpss-history-osmanli': {
    summary: 'Osmanlı tarihi (GK): dönem, kurum, antlaşma.',
    bullets: [
      'Kuruluş–yükselme–duraklama–gerileme özelliklerini ayır.',
      'Tımar, kapıkulu, divan kurumlarını tanı.',
      'Önemli antlaşmaların sonucunu bil.',
      'Islahatların amacını oku.',
    ],
    examCue: 'KPSS GK: kurum–dönem eşlemesi sık sorulur.',
    checkPrompt: 'Bu kurum hangi döneme ait?',
    tip: 'Yüzyıl + olay yaz.',
  },
  'kpss-history-inkilap': {
    summary: 'İnkılap tarihi: Milli Mücadele ve Cumhuriyet inkılapları.',
    bullets: [
      'Kongre–TBMM–cephe–Lozan zinciri.',
      'İnkılapları alanına göre grupla.',
      'İlkeleri uygulamayla bağla.',
      'Kronoloji sorularında şıkları sırala.',
    ],
    examCue: 'KPSS: inkılap yılı ezberinden çok “amaç” sorulur.',
    checkPrompt: 'Bu inkılap neyi değiştirdi?',
    tip: 'Alan etiketi yapıştır (hukuk/eğitim…).',
  },
  'kpss-history-cumhuriyet': {
    summary: 'Cumhuriyet dönemi: siyaset, ekonomi, dış politika.',
    bullets: [
      'Çok partili hayata geçiş sürecini bil.',
      'Ekonomi politikalarını dönemle eşleştir.',
      'Dış politikada denge arayışını oku.',
      'Askerî darbeler / geçiş dönemlerini karıştırma.',
    ],
    examCue: 'KPSS: olay–hükümet eşlemesinde yıl kontrolü yap.',
    checkPrompt: 'Bu olay iç politika mı dış mı?',
    tip: 'Kısa zaman şeridi tut.',
  },
  'kpss-geography-turkiye': {
    summary: 'Türkiye coğrafyası: bölgeler, yerşekli, iklim.',
    bullets: [
      'Bölgelerin iklim ve ekonomik yapısını ayır.',
      'Yerşekli–iklim ilişkisini kur.',
      'Akarsu / dağ / ova isimlerini bölgeye bağla.',
      'Harita sorusunda yön ve ölçek oku.',
    ],
    examCue: 'KPSS: ürün–bölge eşlemesi klasik soru.',
    checkPrompt: 'Bu özellik hangi bölge?',
    tip: 'Haritayı zihninde böl.',
  },
  'kpss-geography-nufus': {
    summary: 'Nüfus ve yerleşme: dağılış, göç, kentleşme.',
    bullets: [
      'Yoğunluk ile artış hızını ayır.',
      'Göçün itici/çekici nedenlerini yaz.',
      'Kır–kent farklarını bil.',
      'Grafikte birimi kontrol et.',
    ],
    examCue: 'KPSS: “en yoğun” ile “en kalabalık” farklı sorulardır.',
    checkPrompt: 'Yoğunluk mu toplam nüfus mu?',
    tip: 'Tablo başlığını oku.',
  },
  'kpss-geography-ekonomi': {
    summary: 'Ekonomik coğrafya: tarım, sanayi, enerji, turizm.',
    bullets: [
      'Tarım ürünlerini bölgeyle eşleştir.',
      'Enerji kaynaklarını (hidro, termik…) ayır.',
      'Sanayi bölgelerinin avantajını oku.',
      'Ulaşım ağının ekonomik etkisini bil.',
    ],
    examCue: 'KPSS: ham madde–üretim yeri ilişkisini sorar.',
    checkPrompt: 'Bu faaliyet hangi coğrafi koşula bağlı?',
    tip: 'Ürün → bölge → koşul üçlüsü.',
  },
  'kpss-civics-anayasa': {
    summary: 'Anayasa temelleri: kuvvetler ayrılığı, organlar.',
    bullets: [
      'Yasama / yürütme / yargı görevlerini ayır.',
      'Anayasa üstünlüğü ilkesini bil.',
      'Cumhurbaşkanı / TBMM yetkilerini karıştırma.',
      'Yargı bağımsızlığı sorularına hazır ol.',
    ],
    examCue: 'KPSS GK: organı yanlış kuvvete bağlama tuzağı.',
    checkPrompt: 'Bu yetki hangi organda?',
    tip: 'Üç kuvvet kutusuna yerleştir.',
  },
  'kpss-civics-temel-haklar': {
    summary: 'Temel hak ve ödevler: sınıflandırma ve sınırlama.',
    bullets: [
      'Kişi / siyasi / sosyal hak ayrımını yap.',
      'Hak–ödev dengesini oku.',
      'Sınırlamanın anayasal çerçevesini bil.',
      'Örnek olayı doğru hak kategorisine koy.',
    ],
    examCue: 'KPSS: hak türünü yanlış sınıfa alma.',
    checkPrompt: 'Bu bir hak mı ödev mi?',
    tip: 'Önce kategori, sonra örnek.',
  },
  'kpss-current-gundem': {
    summary: 'Gündem / kurumlar: güncel yapı ve uluslararası örgütler.',
    bullets: [
      'Türkiye’nin üye olduğu örgütleri (BM, NATO, AK…) bil.',
      'Bakanlık / kurum görevlerini karıştırma.',
      'Güncel soruda tarihi çerçeveyi unutma.',
      'Ezber başlık yerine “görev ne?” diye sor.',
    ],
    examCue: 'KPSS: kurum adını yanlış görevle eşleme.',
    checkPrompt: 'Bu kurumun temel görevi ne?',
    tip: 'Kısaltmayı açarak düşün (örn. BM).',
  },

  // ─── Ehliyet / Trafik ───────────────────────────────────────
  'trafik-traffic-kurallar': {
    summary: 'Trafik kuralları: sahne kur, genel kural, levha üstünlüğü.',
    bullets: [
      'Önce sahneyi kur: yerleşim yeri mi, kavşak mı, tek yön mü?',
      '“Aksi işaret yoksa” genel kuralı uygula; levha varsa levha üstündür.',
      'Geçiş üstünlüğü ve emniyet mesafesi çoğu sorunun anahtarıdır.',
      'Güvenli davranış hangisi diye sor — ezber etiket seçme.',
    ],
    examCue: 'Ehliyet: levha ile genel kural çelişirse levha geçerli.',
    checkPrompt: 'Sahneyi kurdum mu? Levha var mı?',
    tip: 'Şıkları “en güvenli” ölçütüyle ele.',
  },
  'trafik-traffic-hiz-mesafe': {
    summary: 'Hız ve takip mesafesi: limitler ve yol koşulu.',
    bullets: [
      'Yerleşim yeri azami hız (aksi işaret yoksa) 50 km/s.',
      'Takip mesafesi hız ve yol koşullarına göre artar.',
      'Yağış / görüş düşüklüğünde hızı düşür, mesafeyi aç.',
      'Öndeki ani fren için “2 saniye” mantığını bil.',
    ],
    examCue: 'Ehliyet: “aksi işaret” varsa önce onu oku.',
    checkPrompt: 'Yerleşim yeri mi şehirler arası mı?',
    tip: 'Hız levhasını sorunun ilk satırında ara.',
  },
  'trafik-traffic-kavsak': {
    summary: 'Kavşak ve geçiş üstünlüğü: ışık, levha, dönel.',
    bullets: [
      'Kontrollü kavşakta ışık / görevli / işaret sırası.',
      'Kontrolsüzde sağdaki araç kuralını bil.',
      'Dönelde içerideki aracın önceliği vardır (genel kural).',
      'Tramvay / acil araç üstünlüğünü unutma.',
    ],
    examCue: 'Ehliyet: “sağdaki” kuralını ışıklı kavşağa uygulama.',
    checkPrompt: 'Kavşak kontrollü mü?',
    tip: 'Sahneyi yukarıdan çiz.',
  },
  'trafik-traffic-cevre': {
    summary: 'Trafik ve çevre: emisyon, gürültü, atık.',
    bullets: [
      'Egzoz ve gürültü kirliliği güvenlikle birlikte sorulur.',
      'Atık yağ / akü doğaya bırakılmaz.',
      'Lastik basıncı hem güvenlik hem yakıt / çevre etkiler.',
      'Gereksiz rölanti ve ani gaz çevreye zarar.',
    ],
    examCue: 'Ehliyet: çevre sorusu “güvenli sürüş” ile bağlanır.',
    checkPrompt: 'Bu davranış çevreyi nasıl etkiler?',
    tip: 'Hem güvenlik hem çevre faydası olan şıkkı seç.',
  },
  'trafik-traffic-isaretler-uyari': {
    summary: 'Uyarı işaretleri: üçgen çerçeve, tehlike öncesi.',
    bullets: [
      'Üçgen çerçeve = uyarı: tehlikeyi önceden bildirir.',
      'Dönüş, yokuş, yaya — neyi haber veriyor bak.',
      'Uyarıyı görünce hızı ayarla; yasakla karıştırma.',
      'Şekil + renk ailesini ezberle, sonra içeriği oku.',
    ],
    examCue: 'Ehliyet: uyarı yasak değildir — tedbir ister.',
    checkPrompt: 'Bu işaret neyi önceden bildiriyor?',
    tip: 'Üçgen görürsen “yavaşla / dikkat”.',
  },
  'trafik-traffic-isaretler-yasak': {
    summary: 'Yasaklama işaretleri: daire + kırmızı çerçeve.',
    bullets: [
      'Daire + kırmızı çerçeve = yasak.',
      'Yasaklanan eylemi yapma; süre / mesafe varsa oku.',
      'Durma / park ayrımını bil.',
      'Yasak kalkış levhasını (varsa) ayrı tanı.',
    ],
    examCue: 'Ehliyet: yasak ile uyarı şeklini karıştırma.',
    checkPrompt: 'Şekil daire mi üçgen mi?',
    tip: 'Kırmızı çember = yapma.',
  },
  'trafik-traffic-isaretler-bilgi': {
    summary: 'Bilgi işaretleri ve yol çizgileri.',
    bullets: [
      'Bilgi işaretleri yön / hizmet bildirir (mavi vb.).',
      'Düz çizgi aşılmaz; kesik çizgi kontrollü geçiş.',
      'Yaya geçidi ve bisiklet yolu çizgilerini tanı.',
      'Şerit oklarını takip et.',
    ],
    examCue: 'Ehliyet: düz çizgiyi kesik gibi geçmek sık hata.',
    checkPrompt: 'Çizgi düz mü kesik mi?',
    tip: 'Yol çizgisini işaret levhasıyla birlikte oku.',
  },
  'trafik-vehicle-motor': {
    summary: 'Motor ve güç aktarma: parça sırası ve görev.',
    bullets: [
      'Güç yolu: motor → şanzıman → şaft → diferansiyel → aks → tekerlek.',
      'Şaft / diferansiyel / aks = aktarma; yağ/debriyaj ile karıştırma.',
      '“Hangisi güç aktarır?” sorusunda sıradaki yeri eşle.',
      'Arıza belirtisini parçaya bağla.',
    ],
    examCue: 'Ehliyet: aktarma organı listesine yağ katarak çeldirir.',
    checkPrompt: 'Bu parça güç yolunda mı?',
    tip: 'Sırayı ezberle, sonra şık ele.',
  },
  'trafik-vehicle-fren-suspansiyon': {
    summary: 'Fren ve süspansiyon: güvenlik ve yol tutuşu.',
    bullets: [
      'Fren hidroliği / balata aşınması fren mesafesini etkiler.',
      'ABS kilitlenmeyi önler; süspansiyon yol temasını korur.',
      'El freni park / acil içindir.',
      'Titreşim ve kayma belirtilerini sisteme bağla.',
    ],
    examCue: 'Ehliyet: fren mesafesi hızın karesiyle artar (kavramsal).',
    checkPrompt: 'Belirti fren mi süspansiyon mu?',
    tip: 'Güvenlik şıkkını önceliklendir.',
  },
  'trafik-vehicle-elektrik': {
    summary: 'Elektrik ve aydınlatma: akü, far, sinyal.',
    bullets: [
      'Akü bitince marş zayıflar; bağlantıları kontrol et.',
      'Far / sinyal arızası hem ceza hem güvenlik riski.',
      'Sigorta korumadır — rastgele tel sarma.',
      'Arıza ışığı yanıyorsa ilgili sistemi düşün.',
    ],
    examCue: 'Ehliyet: aydınlatma arızasını “önemsiz” sanma.',
    checkPrompt: 'Hangi lamba / sistem soruluyor?',
    tip: 'Belirti ↔ bileşen eşlemesi yap.',
  },
  'trafik-vehicle-guvenlik': {
    summary: 'Araç güvenlik sistemleri: ABS, ESP, kemer, yastık.',
    bullets: [
      'ABS: kilitlenmeyi önler, yön kontrolünü korur.',
      'ESP / hava yastığı / emniyet kemeri birbirinin yerine geçmez.',
      'Kemer takılı değilse yastık beklenen korumayı vermez.',
      'Arıza ışığını görmezden gelme.',
    ],
    examCue: 'Ehliyet: “ABS daha çabuk durdurur” her zaman doğru değildir.',
    checkPrompt: 'Sistemin asıl görevi ne?',
    tip: '“Ne işe yarar?” diye sor.',
  },
  'trafik-firstaid-temel': {
    summary: 'Temel ilk yardım: güvenlik sırası ve yapılmaması gerekenler.',
    bullets: [
      'Önce kendi güvenliğin, sonra olay yeri, sonra kazazede.',
      'ABC: hava yolu, solunum, dolaşım.',
      'Su içirmek / zorla kaldırmak gibi hataları ele.',
      '112’ye konum + durum bildir.',
    ],
    examCue: 'Ehliyet: “önce şunu yap” sırasını bozma.',
    checkPrompt: 'İlk adım kendi güvenliğim mi?',
    tip: 'Adımları sırayla yaz.',
  },
  'trafik-firstaid-kanama': {
    summary: 'Kanama ve şok: baskı, konum, yardım.',
    bullets: [
      'Dış kanamada temiz baskı uygula.',
      'Şokta ısı kaybını önle, ayakları yükselt (uygunsa).',
      'Turnike bilgisini abartmadan, eğitimli müdahale çerçevesinde düşün.',
      'Kanla temasta kendi korunmanı unutma.',
    ],
    examCue: 'Ehliyet: kanayan bölgeye kirli bez / yabancı madde koyma.',
    checkPrompt: 'Baskıyı doğrudan yaraya mı uyguladım?',
    tip: 'Önce baskı, sonra yardım çağır.',
  },
  'trafik-firstaid-kirik-yanik': {
    summary: 'Kırık / yanık: sabitleme ve soğutma.',
    bullets: [
      'Kırıkta hareket ettirme; destekle sabitle.',
      'Yanıkta soğuk suyla soğut — macun/un/diş macunu sürme.',
      'Açık yarada hijyen; su içirmeye zorlama.',
      'Ciddi durumda 112.',
    ],
    examCue: 'Ehliyet: yanığa yoğurt/diş macunu şıkkı yanlıştır.',
    checkPrompt: 'Kırığı mı yoksa yanığı mı yönetiyorum?',
    tip: '“Zarar verme” ilkesi — şüphede sabitle ve bekle.',
  },
  'trafik-firstaid-abc': {
    summary: 'ABC ve bilinç kontrolü: hava yolu önceliği.',
    bullets: [
      'Bilinç: seslen + hafif uyarı.',
      'ABC sırası: hava yolu → solunum → dolaşım.',
      'Solunum yoksa temel yaşam desteği protokolüne geç (eğitim çerçevesinde).',
      'Boynu zorlamadan hava yolu aç.',
    ],
    examCue: 'Ehliyet: ABC sırasını ters çeviren şıklar çeldiricidir.',
    checkPrompt: 'Önce hava yolu mu baktım?',
    tip: 'Sırayı ezberle: A–B–C.',
  },
};

export function fallbackLessonParts(topic: Topic): LessonParts {
  const exam = topic.examType;
  const sub = subLabel(topic.subject);
  const name = topic.nameTr;
  const voice =
    exam === 'lgs'
      ? 'LGS / 8. sınıf'
      : exam === 'ygs'
        ? 'YGS–YKS'
        : exam === 'kpss'
          ? 'KPSS GY–GK'
          : 'Ehliyet / MTS';
  return {
    summary: `${voice} · ${sub} · ${name}: bu başlığın çekirdek kavramlarını kısa tut.`,
    bullets: [
      `${voice} sorularında önce neyin sorulduğunu ayır — ezber etiket seçme.`,
      `${name} için verilenleri yaz; birim / bağ / sahne kur.`,
      'Şıkları dayanakla ele; emin değilsen eleme yap.',
      'Takılırsan örnek soruyu çöz, sonra fotoğrafla canlı çözüm al.',
    ],
    examCue: `${voice}: en sık tuzak, dayanaksız şıkkı “güzel duruyor” diye seçmektir.`,
    checkPrompt: `Bu soruda ${name} için dayanağım ne?`,
    tip: `${sub} örnek sorusunu çöz; netleşmezse fotoğraf çek.`,
  };
}

export function lessonPartsForTopic(topic: Topic): LessonParts {
  return LESSON_BANK[topic.id] ?? fallbackLessonParts(topic);
}

export function bankCoverageStats(topics: Topic[]): {
  total: number;
  banked: number;
  missing: string[];
} {
  const missing = topics.filter((t) => !LESSON_BANK[t.id]).map((t) => t.id);
  return { total: topics.length, banked: topics.length - missing.length, missing };
}
