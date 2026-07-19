import { findTopic, topicsForExam } from '@/src/data';
import type { Topic } from '@/src/data/topics';
import type { ExamType, Subject } from '@/src/lib/api/types';

import type { ItemBankItem } from './types';

const NOTE = 'Özgün mini örnek — telifsiz; sonucu kontrol etmeni öneririz.';

function base(
  topic: Topic,
  stem: string,
  choices: ItemBankItem['choices'],
  answerKey: ItemBankItem['answerKey'],
  steps: ItemBankItem['explanationSteps'],
): ItemBankItem {
  return {
    id: `${topic.id}-demo-001`,
    examType: topic.examType,
    subject: topic.subject,
    topicId: topic.id,
    difficulty: 'easy',
    format: 'multiple_choice',
    stem,
    choices,
    answerKey,
    explanationSteps: steps,
    transparencyNote: NOTE,
  };
}

/** Short original stem per subject family — not exam clones. */
function buildSample(topic: Topic): ItemBankItem {
  const name = topic.nameTr;
  const exam =
    topic.examType === 'lgs'
      ? 'LGS'
      : topic.examType === 'ygs'
        ? 'YGS'
        : topic.examType === 'trafik'
          ? 'Trafik'
          : 'KPSS';

  switch (topic.subject as Subject) {
    case 'math':
    case 'geometry':
      return base(
        topic,
        `${name} konusunda: 12’nin %25’i kaçtır?`,
        { A: '2', B: '3', C: '4', D: '6', E: '8' },
        'B',
        [
          {
            title: '1. Yüzdeyi çevir',
            body: '%25 = 25/100 = 1/4.',
          },
          {
            title: '2. Hesapla',
            body: `12 × (1/4) = 3. (${exam} · ${name} mini alıştırması) Cevap B.`,
          },
        ],
      );
    case 'turkish':
    case 'literature':
      return base(
        topic,
        `“Sabah erken kalktı çünkü sınava yetişecekti.” Bu cümlede anlam ilgisi / kök hangisine yakındır? (${name})`,
        {
          A: 'Amaç-sonuç',
          B: 'Karşıtlık',
          C: 'Benzerlik',
          D: 'Koşul-sonuç',
          E: 'Ünlem',
        },
        'A',
        [
          {
            title: '1. Bağ',
            body: '“çünkü” neden bildirir; amaç için “için” de sık görülür. Bu örnekte amaç/neden bağını ayırt et.',
          },
          {
            title: '2. Seçim',
            body: `Soru kökü ${name} çerçevesinde; “sınava yetişmek” amaç, erken kalkmak sonuç/eylem. En uygun A.`,
          },
        ],
      );
    case 'science':
    case 'physics':
    case 'chemistry':
    case 'biology':
      return base(
        topic,
        `${name}: Suyun kaynama noktası standart basınçta yaklaşık kaç °C’dir?`,
        { A: '0', B: '50', C: '100', D: '150', E: '200' },
        'C',
        [
          {
            title: '1. Bilinen',
            body: 'Standart atmosfer basıncında su 100 °C’de kaynar.',
          },
          {
            title: '2. Bağla',
            body: `${exam} ${name} hatırlatması — basınç değişince nokta değişir. Cevap C.`,
          },
        ],
      );
    case 'history':
      return base(
        topic,
        `${name}: TBMM’nin açılış yılı hangisidir?`,
        { A: '1919', B: '1920', C: '1923', D: '1938', E: '1945' },
        'B',
        [
          {
            title: '1. Tarih',
            body: 'TBMM 23 Nisan 1920’de açılmıştır.',
          },
          {
            title: '2. Bağlam',
            body: `${name} çerçevesinde Milli Mücadele süreciyle ilişkilendir. Cevap B.`,
          },
        ],
      );
    case 'geography':
      return base(
        topic,
        `${name}: Türkiye’nin başkenti hangi ildir?`,
        { A: 'İstanbul', B: 'İzmir', C: 'Ankara', D: 'Bursa', E: 'Antalya' },
        'C',
        [
          {
            title: '1. Bilgi',
            body: 'Başkent Ankara’dır.',
          },
          {
            title: '2. Not',
            body: `${exam} ${name} mini kontrol sorusu. Cevap C.`,
          },
        ],
      );
    case 'civics':
    case 'current':
      return base(
        topic,
        `${name}: Türkiye’de milletvekili seçimleri hangi organı oluşturur?`,
        {
          A: 'TBMM',
          B: 'Yargıtay',
          C: 'Anayasa Mahkemesi',
          D: 'Danıştay',
          E: 'Sayıştay',
        },
        'A',
        [
          {
            title: '1. Yasama',
            body: 'Milletvekilleri TBMM’de yer alır.',
          },
          {
            title: '2. Sonuç',
            body: `${name} temel kavram kontrolü. Cevap A.`,
          },
        ],
      );
    case 'philosophy':
      return base(
        topic,
        `${name}: “Bilgi nedir?” sorusu öncelikle hangi alanın temel sorusudur?`,
        {
          A: 'Etik',
          B: 'Estetik',
          C: 'Epistemoloji',
          D: 'Mantık',
          E: 'Siyaset',
        },
        'C',
        [
          {
            title: '1. Tanım',
            body: 'Bilgi kuramı (epistemoloji) bilginin imkânını ve kaynağını sorar.',
          },
          {
            title: '2. Sonuç',
            body: `${name} giriş sorusu. Cevap C.`,
          },
        ],
      );
    case 'religion':
      return base(
        topic,
        `${name}: İslam’da temel ibadetlerden biri hangisidir?`,
        { A: 'Namaz', B: 'Tiyatro', C: 'Spor', D: 'Alışveriş', E: 'Seyahat' },
        'A',
        [
          {
            title: '1. Bilgi',
            body: 'Namaz temel ibadetlerdendir.',
          },
          {
            title: '2. Sonuç',
            body: `${name} hatırlatma. Cevap A.`,
          },
        ],
      );
    case 'english':
      return base(
        topic,
        `${name}: “She ___ to school every day.” boşluğa hangisi gelir?`,
        { A: 'go', B: 'goes', C: 'going', D: 'gone', E: 'went' },
        'B',
        [
          {
            title: '1. Özne',
            body: 'She = 3. tekil; present simple’da fiile -s/-es gelir.',
          },
          {
            title: '2. Sonuç',
            body: 'goes. Cevap B.',
          },
        ],
      );
    case 'traffic':
      return base(
        topic,
        `${name}: Yerleşim yerinde aksini gösteren bir işaret yoksa azami hız sınırı genelde kaç km/s’dir?`,
        { A: '30', B: '50', C: '70', D: '90', E: '120' },
        'B',
        [
          {
            title: '1. Kural',
            body: 'Yerleşim yeri içinde genel azami hız çoğu durumda 50 km/s’tir (aksi işaret yoksa).',
          },
          {
            title: '2. Bağla',
            body: `${exam} · ${name} mini kontrol. Cevap B.`,
          },
        ],
      );
    case 'vehicle':
      return base(
        topic,
        `${name}: Araçta ABS’nin temel amacı nedir?`,
        {
          A: 'Yakıt tüketimini artırmak',
          B: 'Frenlemede tekerleklerin kilitlenmesini önlemek',
          C: 'Farları otomatik açmak',
          D: 'Klima çalıştırmak',
          E: 'Camları indirmek',
        },
        'B',
        [
          {
            title: '1. Kavram',
            body: 'ABS, ani frenlemede tekerlek kilitlenmesini engelleyerek yön kontrolünü korur.',
          },
          {
            title: '2. Sonuç',
            body: `${name}. Cevap B.`,
          },
        ],
      );
    case 'firstaid':
      return base(
        topic,
        `${name}: Bilinci kapalı kazazedede ilk kontrol sırası hangisidir?`,
        {
          A: 'Nabız → solunum → hava yolu',
          B: 'Hava yolu → solunum → dolaşım (ABC)',
          C: 'İlaç vermek',
          D: 'Hemen taşımak',
          E: 'Su içirmek',
        },
        'B',
        [
          {
            title: '1. ABC',
            body: 'Temel yaşam desteğinde hava yolu, solunum ve dolaşım sırası izlenir.',
          },
          {
            title: '2. Sonuç',
            body: `${name}. Cevap B.`,
          },
        ],
      );
    default:
      return base(
        topic,
        `${name}: Bu konuyla ilgili doğru yaklaşım hangisidir?`,
        {
          A: 'Şıkları metne / veriye götürmek',
          B: 'Ezberle rastgele seçmek',
          C: 'Soru kökünü okumamak',
          D: 'Zamanı boşa harcamak',
          E: 'Şıkları hiç elemek',
        },
        'A',
        [
          {
            title: '1. Strateji',
            body: 'Dayanaklı seçim yap; kökü oku.',
          },
          {
            title: '2. Sonuç',
            body: `${exam} · ${name}. Cevap A.`,
          },
        ],
      );
  }
}

/**
 * One demo sample for every catalog topic that lacks a hand-authored seed item.
 * Hand-authored seeds (…-001 without -demo-) take precedence via merge.
 */
export function buildCoverageSamples(existingTopicIds: Set<string>): ItemBankItem[] {
  const exams: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];
  const out: ItemBankItem[] = [];
  for (const exam of exams) {
    for (const topic of topicsForExam(exam)) {
      if (existingTopicIds.has(topic.id)) continue;
      if (!findTopic(topic.id)) continue;
      out.push(buildSample(topic));
    }
  }
  return out;
}
