import type { SongDefinition } from '../types';

export const FOUNDATIONAL_SONGS: SongDefinition[] = [
  // --- TIER 1: Laut & Zahl (Phonetics & Numbers) ---
  {
    id: 'song_1',
    number: 1,
    title: 'Das Alphabet & Die Umlaute',
    subtitle: 'Ntiq s-s7i7 d l-7ourouf w l-Umlaute',
    theme: 'Phonetik & Laute',
    tier: 'Stufe 1: Laut & Zahl',
    bpm: 72,
    instrument: 'piano',
    lyrics: [
      { id: '1_1', german: 'A, B, C', phoneticGuide: 'Ah, Beh, Tseh', darijaCorrect: 'L-hourouf l-oula', darijaDistractor: 'L-arqam l-oula', timingSec: 2 },
      { id: '1_2', german: 'Ä [ae]', phoneticGuide: 'Eh (fhal f hedra)', darijaCorrect: 'A m3a noqat (Ä)', darijaDistractor: 'U m3a noqat (Ü)', timingSec: 5 },
      { id: '1_3', german: 'Ö [oe]', phoneticGuide: 'Eu (fhal l-fransawiya)', darijaCorrect: 'O m3a noqat (Ö)', darijaDistractor: 'A m3a noqat (Ä)', timingSec: 8 },
      { id: '1_4', german: 'Ü [ue]', phoneticGuide: 'U (fhal l-fransawiya tu)', darijaCorrect: 'U m3a noqat (Ü)', darijaDistractor: 'O m3a noqat (Ö)', timingSec: 11 },
      { id: '1_5', german: 'das Alphabet', phoneticGuide: 'das Al-fa-bet', darijaCorrect: 'L-hourouf kamlin', darijaDistractor: 'L-kelmat kamlin', timingSec: 14 },
      { id: '1_6', german: 'das Eszett [ß]', phoneticGuide: 'das Ess-tset', darijaCorrect: 'Double S (ß)', darijaDistractor: 'Double T (tt)', timingSec: 17 },
      { id: '1_7', german: 'Ich lerne Deutsch', phoneticGuide: 'Ikh ler-ne Doytsh', darijaCorrect: 'Ana kant3llem l-Almaniya', darijaDistractor: 'Ana kanhder l-Almaniya', timingSec: 20 },
      { id: '1_8', german: 'Sehr gut!', phoneticGuide: 'Zehr goot!', darijaCorrect: 'Mezyan bzaf!', darijaDistractor: 'Khayb bzaf!', timingSec: 23 }
    ]
  },
  {
    id: 'song_2',
    number: 2,
    title: 'Die Zahlen: 1 bis 10',
    subtitle: 'Hfed l-arqam mn 1 tal 10 b l-iqa3',
    theme: 'Zahlen 1-10',
    tier: 'Stufe 1: Laut & Zahl',
    bpm: 76,
    instrument: 'acoustic_guitar',
    lyrics: [
      { id: '2_1', german: 'eins', phoneticGuide: 'ayns', darijaCorrect: 'wa7ed (1)', darijaDistractor: 'jouj (2)', timingSec: 2 },
      { id: '2_2', german: 'zwei', phoneticGuide: 'tsway', darijaCorrect: 'jouj (2)', darijaDistractor: 'tlata (3)', timingSec: 5 },
      { id: '2_3', german: 'drei', phoneticGuide: 'dray', darijaCorrect: 'tlata (3)', darijaDistractor: 'reb3a (4)', timingSec: 8 },
      { id: '2_4', german: 'vier', phoneticGuide: 'feer', darijaCorrect: 'reb3a (4)', darijaDistractor: 'khemsa (5)', timingSec: 11 },
      { id: '2_5', german: 'fünf', phoneticGuide: 'fuenf', darijaCorrect: 'khemsa (5)', darijaDistractor: 'setta (6)', timingSec: 14 },
      { id: '2_6', german: 'sechs', phoneticGuide: 'zeks', darijaCorrect: 'setta (6)', darijaDistractor: 'seb3a (7)', timingSec: 17 },
      { id: '2_7', german: 'sieben', phoneticGuide: 'zee-ben', darijaCorrect: 'seb3a (7)', darijaDistractor: 'tmnya (8)', timingSec: 20 },
      { id: '2_8', german: 'acht', phoneticGuide: 'akht', darijaCorrect: 'tmnya (8)', darijaDistractor: 'ts3ood (9)', timingSec: 23 },
      { id: '2_9', german: 'neun', phoneticGuide: 'noyn', darijaCorrect: 'ts3ood (9)', darijaDistractor: '3achra (10)', timingSec: 26 },
      { id: '2_10', german: 'zehn', phoneticGuide: 'tsehn', darijaCorrect: '3achra (10)', darijaDistractor: 'hdash (11)', timingSec: 29 }
    ]
  },
  {
    id: 'song_3',
    number: 3,
    title: 'Die Zahlen: 11 bis 20',
    subtitle: 'L-arqam mn 11 tal 20 b rhythm modern',
    theme: 'Zahlen 11-20',
    tier: 'Stufe 1: Laut & Zahl',
    bpm: 80,
    instrument: 'synthwave',
    lyrics: [
      { id: '3_1', german: 'elf', phoneticGuide: 'elf', darijaCorrect: 'hdash (11)', darijaDistractor: 'tnash (12)', timingSec: 2 },
      { id: '3_2', german: 'zwölf', phoneticGuide: 'tswoelf', darijaCorrect: 'tnash (12)', darijaDistractor: 'teltash (13)', timingSec: 5 },
      { id: '3_3', german: 'dreizehn', phoneticGuide: 'dray-tsehn', darijaCorrect: 'teltash (13)', darijaDistractor: 'rb3tash (14)', timingSec: 8 },
      { id: '3_4', german: 'vierzehn', phoneticGuide: 'feer-tsehn', darijaCorrect: 'rb3tash (14)', darijaDistractor: 'khemstash (15)', timingSec: 11 },
      { id: '3_5', german: 'fünfzehn', phoneticGuide: 'fuenf-tsehn', darijaCorrect: 'khemstash (15)', darijaDistractor: 'settash (16)', timingSec: 14 },
      { id: '3_6', german: 'sechzehn', phoneticGuide: 'zekh-tsehn', darijaCorrect: 'settash (16)', darijaDistractor: 'sb3tash (17)', timingSec: 17 },
      { id: '3_7', german: 'siebzehn', phoneticGuide: 'zeeb-tsehn', darijaCorrect: 'sb3tash (17)', darijaDistractor: 'tmentash (18)', timingSec: 20 },
      { id: '3_8', german: 'achtzehn', phoneticGuide: 'akht-tsehn', darijaCorrect: 'tmentash (18)', darijaDistractor: 'ts3tash (19)', timingSec: 23 },
      { id: '3_9', german: 'neunzehn', phoneticGuide: 'noyn-tsehn', darijaCorrect: 'ts3tash (19)', darijaDistractor: '3shrin (20)', timingSec: 26 },
      { id: '3_10', german: 'zwanzig', phoneticGuide: 'tswan-tsikh', darijaCorrect: '3shrin (20)', darijaDistractor: 'tlatine (30)', timingSec: 29 }
    ]
  },

  // --- TIER 2: Begrüßung & Höflichkeit (Greetings & Politeness) ---
  {
    id: 'song_4',
    number: 4,
    title: 'Hallo & Tschüss',
    subtitle: 'Salam w t-tewdi3 f l-Almaniya',
    theme: 'Begrüßungen',
    tier: 'Stufe 2: Begrüßung & Höflichkeit',
    bpm: 80,
    instrument: 'chillhop',
    lyrics: [
      { id: '4_1', german: 'Hallo!', phoneticGuide: 'Hal-lo!', darijaCorrect: 'Salam / Ahlan', darijaDistractor: 'Bslama', timingSec: 2 },
      { id: '4_2', german: 'Guten Morgen', phoneticGuide: 'Goo-ten Mor-gen', darijaCorrect: 'Sba7 l-khir', darijaDistractor: 'Msa l-khir', timingSec: 5 },
      { id: '4_3', german: 'Guten Tag', phoneticGuide: 'Goo-ten Tahk', darijaCorrect: 'Nharak mabrouk (f wast nhar)', darijaDistractor: 'Layla sa3ida', timingSec: 8 },
      { id: '4_4', german: 'Guten Abend', phoneticGuide: 'Goo-ten Ah-bent', darijaCorrect: 'Msa l-khir (f l-3chiya)', darijaDistractor: 'Sba7 l-khir', timingSec: 11 },
      { id: '4_5', german: 'Gute Nacht', phoneticGuide: 'Goo-te Nakht', darijaCorrect: 'Tsba7 3la khir (qbel n3ass)', darijaDistractor: 'Nharak mabrouk', timingSec: 14 },
      { id: '4_6', german: 'Tschüss!', phoneticGuide: 'Tshooss!', darijaCorrect: 'Bslama! (m3a shab)', darijaDistractor: 'Marhba!', timingSec: 17 },
      { id: '4_7', german: 'Auf Wiedersehen', phoneticGuide: 'Owf Vee-der-zay-en', darijaCorrect: 'Ila liqa2 (rasmi)', darijaDistractor: 'Sba7 l-khir', timingSec: 20 },
      { id: '4_8', german: 'Bis bald!', phoneticGuide: 'Bis balt!', darijaCorrect: 'Nchoufek 9rib!', darijaDistractor: 'Ghedda nchoufek', timingSec: 23 }
    ]
  },
  {
    id: 'song_5',
    number: 5,
    title: 'Die Zauberwörter',
    subtitle: 'Kelmat l-adab li kayfet7o ga3 l-biban',
    theme: 'Höflichkeit',
    tier: 'Stufe 2: Begrüßung & Höflichkeit',
    bpm: 78,
    instrument: 'acoustic_guitar',
    lyrics: [
      { id: '5_1', german: 'Bitte', phoneticGuide: 'Bit-te', darijaCorrect: '3afak / Tfeddel', darijaDistractor: 'Shukran', timingSec: 2 },
      { id: '5_2', german: 'Danke', phoneticGuide: 'Dang-ke', darijaCorrect: 'Shukran', darijaDistractor: 'Sme7 lia', timingSec: 5 },
      { id: '5_3', german: 'Danke schön', phoneticGuide: 'Dang-ke shoen', darijaCorrect: 'Shukran bzaf', darijaDistractor: 'Bla jmil', timingSec: 8 },
      { id: '5_4', german: 'Bitte schön', phoneticGuide: 'Bit-te shoen', darijaCorrect: 'Bla jmil / Marhba', darijaDistractor: 'Sme7 lia', timingSec: 11 },
      { id: '5_5', german: 'Entschuldigung', phoneticGuide: 'Ent-shool-di-goong', darijaCorrect: 'Sme7 lia / Pardon', darijaDistractor: 'Shukran', timingSec: 14 },
      { id: '5_6', german: 'Kein Problem', phoneticGuide: 'Kayn Pro-blehm', darijaCorrect: 'Machi moshkil ga3', darijaDistractor: 'Moshkil kbir', timingSec: 17 },
      { id: '5_7', german: 'Gern geschehen', phoneticGuide: 'Gern ge-shay-en', darijaCorrect: 'Mn kolli farah', darijaDistractor: 'Ma3ndich waqt', timingSec: 20 },
      { id: '5_8', german: 'Alles gut', phoneticGuide: 'Al-les goot', darijaCorrect: 'Kolchi mezyan', darijaDistractor: 'Walou ma mezyan', timingSec: 23 }
    ]
  },
  {
    id: 'song_6',
    number: 6,
    title: "Wie geht's dir?",
    subtitle: 'Swel 3la l-a7wal w jawb b thabata',
    theme: 'Befinden',
    tier: 'Stufe 2: Begrüßung & Höflichkeit',
    bpm: 82,
    instrument: 'chillhop',
    lyrics: [
      { id: '6_1', german: "Wie geht's?", phoneticGuide: 'Vee gayts?', darijaCorrect: 'Ki dayr? / Labas?', darijaDistractor: 'Chno smitek?', timingSec: 2 },
      { id: '6_2', german: 'Mir geht es gut', phoneticGuide: 'Meer gayt es goot', darijaCorrect: 'Ana bkhir w mezyan', darijaDistractor: 'Ana 3yan bzaf', timingSec: 5 },
      { id: '6_3', german: 'Sehr gut!', phoneticGuide: 'Zehr goot!', darijaCorrect: 'Bkhir bzaf!', darijaDistractor: 'Khayb!', timingSec: 8 },
      { id: '6_4', german: 'Nicht so gut', phoneticGuide: 'Nikht zo goot', darijaCorrect: 'Machi mezyan bzaf', darijaDistractor: 'Mezyan bzaf', timingSec: 11 },
      { id: '6_5', german: 'Es geht', phoneticGuide: 'Es gayt', darijaCorrect: 'Hakda w hakda (Msslek)', darijaDistractor: 'Tafih', timingSec: 14 },
      { id: '6_6', german: 'Und dir?', phoneticGuide: 'Oont deer?', darijaCorrect: 'W nta ki dayr?', darijaDistractor: 'W fin nta?', timingSec: 17 },
      { id: '6_7', german: 'Auch gut', phoneticGuide: 'Owkh goot', darijaCorrect: 'Hetta ana bkhir', darijaDistractor: 'Ghir bo7di bkhir', timingSec: 20 },
      { id: '6_8', german: 'Super!', phoneticGuide: 'Zoo-per!', darijaCorrect: 'Top / Wa3er!', darijaDistractor: '3adi', timingSec: 23 }
    ]
  },

  // --- TIER 3: Identität & Herkunft (Identity & Origin) ---
  {
    id: 'song_7',
    number: 7,
    title: 'Wer bist du?',
    subtitle: '3ref b rassek b l-Almaniya',
    theme: 'Identität',
    tier: 'Stufe 3: Identität & Herkunft',
    bpm: 84,
    instrument: 'synthwave',
    lyrics: [
      { id: '7_1', german: 'Wer bist du?', phoneticGuide: 'Vehr bist doo?', darijaCorrect: 'Chkoun nta?', darijaDistractor: 'Fin nta?', timingSec: 2 },
      { id: '7_2', german: 'Ich heiße Bilal', phoneticGuide: 'Ikh hay-sseh Bee-lal', darijaCorrect: 'Smiti Bilal', darijaDistractor: 'Ana f Dar l-Bayda', timingSec: 5 },
      { id: '7_3', german: 'Wie heißt du?', phoneticGuide: 'Vee hayst doo?', darijaCorrect: 'Chno smitek nta?', darijaDistractor: 'Chhal f 3omrek?', timingSec: 8 },
      { id: '7_4', german: 'Mein Name ist...', phoneticGuide: 'Mayn Nah-me ist...', darijaCorrect: 'L-ism dyali howa...', darijaDistractor: 'L-khdma dyali hiya...', timingSec: 11 },
      { id: '7_5', german: 'Ich bin...', phoneticGuide: 'Ikh bin...', darijaCorrect: 'Ana akoun...', darijaDistractor: 'Nta takoun...', timingSec: 14 },
      { id: '7_6', german: 'Freut mich!', phoneticGuide: 'Froyt mikh!', darijaCorrect: 'Mtsherfin!', darijaDistractor: 'Bslama!', timingSec: 17 },
      { id: '7_7', german: 'Sehr angenehm', phoneticGuide: 'Zehr an-ge-nehm', darijaCorrect: 'Charf kbir / Mtsherfin bzaf', darijaDistractor: 'La shukran', timingSec: 20 },
      { id: '7_8', german: 'Willkommen!', phoneticGuide: 'Vil-kom-men!', darijaCorrect: 'Merhba bik!', darijaDistractor: 'Tsba7 3la khir!', timingSec: 23 }
    ]
  },
  {
    id: 'song_8',
    number: 8,
    title: 'Woher kommst du?',
    subtitle: 'Mnina bled jiti w fin saken',
    theme: 'Herkunft & Wohnort',
    tier: 'Stufe 3: Identität & Herkunft',
    bpm: 84,
    instrument: 'moroccan_beat',
    lyrics: [
      { id: '8_1', german: 'Woher kommst du?', phoneticGuide: 'Vo-hehr komst doo?', darijaCorrect: 'Mnina bled nta?', darijaDistractor: 'Fin ghadi?', timingSec: 2 },
      { id: '8_2', german: 'Ich komme aus Marokko', phoneticGuide: 'Ikh kom-me ows Ma-rok-ko', darijaCorrect: 'Ana mn l-Maghreb', darijaDistractor: 'Ana sakn f l-Almaniya', timingSec: 5 },
      { id: '8_3', german: 'Wo wohnst du?', phoneticGuide: 'Vo vohnst doo?', darijaCorrect: 'Fin saken nta?', darijaDistractor: 'Fin kheddam?', timingSec: 8 },
      { id: '8_4', german: 'Ich wohne in Casablanca', phoneticGuide: 'Ikh voh-ne in Ka-za-blang-ka', darijaCorrect: 'Ana saken f Casa', darijaDistractor: 'Ana jey mn Casa', timingSec: 11 },
      { id: '8_5', german: 'aus Deutschland', phoneticGuide: 'ows Doytsh-lant', darijaCorrect: 'Mn l-Almaniya', darijaDistractor: 'F l-Almaniya', timingSec: 14 },
      { id: '8_6', german: 'in Berlin', phoneticGuide: 'in Behr-leen', darijaCorrect: 'F Berlin', darijaDistractor: 'Mn Berlin', timingSec: 17 },
      { id: '8_7', german: 'Marokkaner', phoneticGuide: 'Ma-rok-kah-ner', darijaCorrect: 'Maghribi', darijaDistractor: 'Almani', timingSec: 20 },
      { id: '8_8', german: 'Deutsche Sprache', phoneticGuide: 'Doyt-she Shprah-khe', darijaCorrect: 'L-lougha l-Almaniya', darijaDistractor: 'L-lougha l-3arabiya', timingSec: 23 }
    ]
  },

  // --- TIER 4: Die Säulen (The Pillar Verbs: Sein & Haben) ---
  {
    id: 'song_9',
    number: 9,
    title: 'Das Verb "Sein"',
    subtitle: 'Assas l-joumla: Ana, Nta, Howa, Hna',
    theme: 'Verb Sein',
    tier: 'Stufe 4: Die Säulen-Verben',
    bpm: 82,
    instrument: 'piano',
    lyrics: [
      { id: '9_1', german: 'ich bin', phoneticGuide: 'ikh bin', darijaCorrect: 'ana (kayn)', darijaDistractor: 'nta (kayn)', timingSec: 2 },
      { id: '9_2', german: 'du bist', phoneticGuide: 'doo bist', darijaCorrect: 'nta (kayn)', darijaDistractor: 'howa (kayn)', timingSec: 5 },
      { id: '9_3', german: 'er ist', phoneticGuide: 'ehr ist', darijaCorrect: 'howa (kayn)', darijaDistractor: 'hiya (kayna)', timingSec: 8 },
      { id: '9_4', german: 'sie ist', phoneticGuide: 'zee ist', darijaCorrect: 'hiya (kayna)', darijaDistractor: 'hna (kaynin)', timingSec: 11 },
      { id: '9_5', german: 'wir sind', phoneticGuide: 'veer zint', darijaCorrect: 'hna (kaynin)', darijaDistractor: 'ntouma (kaynin)', timingSec: 14 },
      { id: '9_6', german: 'ihr seid', phoneticGuide: 'eer zayt', darijaCorrect: 'ntouma (kaynin)', darijaDistractor: 'houma (kaynin)', timingSec: 17 },
      { id: '9_7', german: 'sie sind', phoneticGuide: 'zee zint', darijaCorrect: 'houma (kaynin)', darijaDistractor: 'ana (kayn)', timingSec: 20 },
      { id: '9_8', german: 'Ich bin bereit!', phoneticGuide: 'Ikh bin be-rayt!', darijaCorrect: 'Ana wajed!', darijaDistractor: 'Ana 3yan!', timingSec: 23 }
    ]
  },
  {
    id: 'song_10',
    number: 10,
    title: 'Das Verb "Haben"',
    subtitle: 'L-milkiya: 3ndi, 3ndek, 3ndna',
    theme: 'Verb Haben',
    tier: 'Stufe 4: Die Säulen-Verben',
    bpm: 85,
    instrument: 'funk_bass',
    lyrics: [
      { id: '10_1', german: 'ich habe', phoneticGuide: 'ikh hah-be', darijaCorrect: '3ndi', darijaDistractor: '3ndek', timingSec: 2 },
      { id: '10_2', german: 'du hast', phoneticGuide: 'doo hast', darijaCorrect: '3ndek nta', darijaDistractor: '3ndo howa', timingSec: 5 },
      { id: '10_3', german: 'er hat', phoneticGuide: 'ehr hat', darijaCorrect: '3ndo howa', darijaDistractor: '3ndha hiya', timingSec: 8 },
      { id: '10_4', german: 'wir haben', phoneticGuide: 'veer hah-ben', darijaCorrect: '3ndna hna', darijaDistractor: '3ndhom houma', timingSec: 11 },
      { id: '10_5', german: 'ihr habt', phoneticGuide: 'eer habt', darijaCorrect: '3ndkom ntouma', darijaDistractor: '3ndna hna', timingSec: 14 },
      { id: '10_6', german: 'sie haben', phoneticGuide: 'zee hah-ben', darijaCorrect: '3ndhom houma', darijaDistractor: '3ndi ana', timingSec: 17 },
      { id: '10_7', german: 'Ich habe Zeit', phoneticGuide: 'Ikh hah-be Tsayt', darijaCorrect: '3ndi l-waqt', darijaDistractor: 'Ma3ndich l-waqt', timingSec: 20 },
      { id: '10_8', german: 'Ich habe Hunger', phoneticGuide: 'Ikh hah-be Hoong-er', darijaCorrect: 'Fiya j-jou3', darijaDistractor: 'Fiya l-3tesh', timingSec: 23 }
    ]
  },

  // --- TIER 5: Die Artikel & Gegenstände (Articles & Objects) ---
  {
    id: 'song_11',
    number: 11,
    title: 'Der-Wörter: Männlich (Blue)',
    subtitle: 'Asmaa2 l-Moudakkar (der) b lawn azraq',
    theme: 'Artikel Der',
    tier: 'Stufe 5: Artikel & Objekte',
    bpm: 80,
    instrument: 'chillhop',
    lyrics: [
      { id: '11_1', german: 'der Kaffee', phoneticGuide: 'dehr Kaf-fay', darijaCorrect: 'L-qahwa (M)', darijaDistractor: 'Atay (M)', timingSec: 2 },
      { id: '11_2', german: 'der Tee', phoneticGuide: 'dehr Tay', darijaCorrect: 'Atay (M)', darijaDistractor: 'L-qahwa (M)', timingSec: 5 },
      { id: '11_3', german: 'der Tisch', phoneticGuide: 'dehr Teesh', darijaCorrect: 'T-tebla (M)', darijaDistractor: 'L-korsi (M)', timingSec: 8 },
      { id: '11_4', german: 'der Stuhl', phoneticGuide: 'dehr Shtool', darijaCorrect: 'L-korsi (M)', darijaDistractor: 'T-tebla (M)', timingSec: 11 },
      { id: '11_5', german: 'der Schlüssel', phoneticGuide: 'dehr Shloos-sel', darijaCorrect: 'S-sarout (M)', darijaDistractor: 'L-bab (F)', timingSec: 14 },
      { id: '11_6', german: 'der Computer', phoneticGuide: 'dehr Kom-pyoo-ter', darijaCorrect: 'L-pc / L-ordinateur (M)', darijaDistractor: 'L-portable (N)', timingSec: 17 },
      { id: '11_7', german: 'der Tag', phoneticGuide: 'dehr Tahk', darijaCorrect: 'N-nhar (M)', darijaDistractor: 'L-lil (F)', timingSec: 20 },
      { id: '11_8', german: 'der Freund', phoneticGuide: 'dehr Froynt', darijaCorrect: 'S-sadi9 (M)', darijaDistractor: 'S-sadiqa (F)', timingSec: 23 }
    ]
  },
  {
    id: 'song_12',
    number: 12,
    title: 'Die-Wörter: Weiblich (Pink)',
    subtitle: 'Asmaa2 l-Mouannat (die) b lawn wrdi',
    theme: 'Artikel Die',
    tier: 'Stufe 5: Artikel & Objekte',
    bpm: 80,
    instrument: 'acoustic_guitar',
    lyrics: [
      { id: '12_1', german: 'die Tasse', phoneticGuide: 'dee Tas-se', darijaCorrect: 'L-kass / Fenjan (F)', darijaDistractor: 'T-tebla (M)', timingSec: 2 },
      { id: '12_2', german: 'die Tür', phoneticGuide: 'dee Toor', darijaCorrect: 'L-bab (F)', darijaDistractor: 'S-sarout (M)', timingSec: 5 },
      { id: '12_3', german: 'die Tasche', phoneticGuide: 'dee Tash-she', darijaCorrect: 'S-sak / Cartable (F)', darijaDistractor: 'L-kass (F)', timingSec: 8 },
      { id: '12_4', german: 'die Sonne', phoneticGuide: 'dee Zon-ne', darijaCorrect: 'Sh-shems (F)', darijaDistractor: 'L-qamar (M)', timingSec: 11 },
      { id: '12_5', german: 'die Stadt', phoneticGuide: 'dee Shtat', darijaCorrect: 'L-mdina (F)', darijaDistractor: 'L-bled (N)', timingSec: 14 },
      { id: '12_6', german: 'die Nacht', phoneticGuide: 'dee Nakht', darijaCorrect: 'L-lila (F)', darijaDistractor: 'N-nhar (M)', timingSec: 17 },
      { id: '12_7', german: 'die Straße', phoneticGuide: 'dee Shtrah-sse', darijaCorrect: 'Z-zenqa / Shari3 (F)', darijaDistractor: 'L-gare (M)', timingSec: 20 },
      { id: '12_8', german: 'die Musik', phoneticGuide: 'dee Moo-zeek', darijaCorrect: 'L-moussiqa (F)', darijaDistractor: 'L-ktab (N)', timingSec: 23 }
    ]
  },
  {
    id: 'song_13',
    number: 13,
    title: 'Das-Wörter: Neutral (Green)',
    subtitle: 'Asmaa2 l-Mou7ayad (das) b lawn khder',
    theme: 'Artikel Das',
    tier: 'Stufe 5: Artikel & Objekte',
    bpm: 80,
    instrument: 'synthwave',
    lyrics: [
      { id: '13_1', german: 'das Wasser', phoneticGuide: 'das Vas-ser', darijaCorrect: 'L-ma (N)', darijaDistractor: 'Atay (M)', timingSec: 2 },
      { id: '13_2', german: 'das Buch', phoneticGuide: 'das Bookh', darijaCorrect: 'L-ktab (N)', darijaDistractor: 'L-werqa (F)', timingSec: 5 },
      { id: '13_3', german: 'das Handy', phoneticGuide: 'das Hen-dee', darijaCorrect: 'L-portable / Telephone (N)', darijaDistractor: 'L-pc (M)', timingSec: 8 },
      { id: '13_4', german: 'das Brot', phoneticGuide: 'das Broht', darijaCorrect: 'L-khobz (N)', darijaDistractor: 'L-hlib (F)', timingSec: 11 },
      { id: '13_5', german: 'das Zimmer', phoneticGuide: 'das Tsim-mer', darijaCorrect: 'L-bit / Chambre (N)', darijaDistractor: 'L-bab (F)', timingSec: 14 },
      { id: '13_6', german: 'das Auto', phoneticGuide: 'das Ow-toh', darijaCorrect: 'T-tomobil (N)', darijaDistractor: 'L-bus (M)', timingSec: 17 },
      { id: '13_7', german: 'das Haus', phoneticGuide: 'das Hows', darijaCorrect: 'D-dar (N)', darijaDistractor: 'L-mdina (F)', timingSec: 20 },
      { id: '13_8', german: 'das Geld', phoneticGuide: 'das Gelt', darijaCorrect: 'L-flouss (N)', darijaDistractor: 'L-waqt (F)', timingSec: 23 }
    ]
  },

  // --- TIER 6: Routine & Alltagsverben (Routine & Action Verbs) ---
  {
    id: 'song_14',
    number: 14,
    title: 'Mein Morgen (Routine)',
    subtitle: 'Af3al d l-fiqaq w l-qahwa b ntiq nadi',
    theme: 'Morgenroutine',
    tier: 'Stufe 6: Routine & Alltag',
    bpm: 86,
    instrument: 'chillhop',
    lyrics: [
      { id: '14_1', german: 'aufstehen', phoneticGuide: 'owf-shtay-en', darijaCorrect: 'Nfiq mn n-n3ass', darijaDistractor: 'N3ess', timingSec: 2 },
      { id: '14_2', german: 'duschen', phoneticGuide: 'doo-shen', darijaCorrect: 'Ndowesh', darijaDistractor: 'Nghsel yddia', timingSec: 5 },
      { id: '14_3', german: 'Zähne putzen', phoneticGuide: 'Tseh-ne poot-tsen', darijaCorrect: 'N7ekk snani', darijaDistractor: 'Nmchet che3ri', timingSec: 8 },
      { id: '14_4', german: 'Kaffee kochen', phoneticGuide: 'Kaf-fay kokh-en', darijaCorrect: 'Ntiyeb l-qahwa', darijaDistractor: 'Nsrob atay', timingSec: 11 },
      { id: '14_5', german: 'frühstücken', phoneticGuide: 'frooh-shtook-en', darijaCorrect: 'Nftor', darijaDistractor: 'Nt3echa', timingSec: 14 },
      { id: '14_6', german: 'anziehen', phoneticGuide: 'an-tsee-en', darijaCorrect: 'Nlbes 7wayji', darijaDistractor: 'N7eyyed 7wayji', timingSec: 17 },
      { id: '14_7', german: 'bereit sein', phoneticGuide: 'be-rayt zayn', darijaCorrect: 'Nkoun wajed', darijaDistractor: 'Nkoun m3ettel', timingSec: 20 },
      { id: '14_8', german: 'Guten Morgen!', phoneticGuide: 'Goo-ten Mor-gen!', darijaCorrect: 'Sba7 l-khir!', darijaDistractor: 'Tsba7 3la khir!', timingSec: 23 }
    ]
  },
  {
    id: 'song_15',
    number: 15,
    title: 'Essen & Trinken',
    subtitle: 'L-makla, l-chrab w l-wejbate',
    theme: 'Essen & Trinken',
    tier: 'Stufe 6: Routine & Alltag',
    bpm: 84,
    instrument: 'acoustic_guitar',
    lyrics: [
      { id: '15_1', german: 'ich esse', phoneticGuide: 'ikh es-se', darijaCorrect: 'Ana kanakol', darijaDistractor: 'Ana kanshrob', timingSec: 2 },
      { id: '15_2', german: 'ich trinke', phoneticGuide: 'ikh tring-ke', darijaCorrect: 'Ana kanshrob', darijaDistractor: 'Ana kanakol', timingSec: 5 },
      { id: '15_3', german: 'das Frühstück', phoneticGuide: 'das Frooh-shtook', darijaCorrect: 'L-ftour', darijaDistractor: 'L-ghda', timingSec: 8 },
      { id: '15_4', german: 'das Mittagessen', phoneticGuide: 'das Mit-tahk-es-sen', darijaCorrect: 'L-ghda', darijaDistractor: 'L-3sha', timingSec: 11 },
      { id: '15_5', german: 'das Abendessen', phoneticGuide: 'das Ah-bent-es-sen', darijaCorrect: 'L-3sha', darijaDistractor: 'L-ftour', timingSec: 14 },
      { id: '15_6', german: 'kochen', phoneticGuide: 'kokh-en', darijaCorrect: 'Ntiyeb / Ntbekh', darijaDistractor: 'Nghsel l-mwa3en', timingSec: 17 },
      { id: '15_7', german: 'lecker', phoneticGuide: 'lek-ker', darijaCorrect: 'Bnin / Ldid', darijaDistractor: 'Khayb', timingSec: 20 },
      { id: '15_8', german: 'Guten Appetit!', phoneticGuide: 'Goo-ten Ap-pe-teet!', darijaCorrect: 'B s-se77a w r-ra7a!', darijaDistractor: 'Shukran bzaf!', timingSec: 23 }
    ]
  },
  {
    id: 'song_16',
    number: 16,
    title: 'Aktionsverben',
    subtitle: 'Af3al l-7araka w t-tawassol',
    theme: 'Wichtige Verben',
    tier: 'Stufe 6: Routine & Alltag',
    bpm: 88,
    instrument: 'funk_bass',
    lyrics: [
      { id: '16_1', german: 'gehen', phoneticGuide: 'gay-en', darijaCorrect: 'Nmshi', darijaDistractor: 'Nji', timingSec: 2 },
      { id: '16_2', german: 'kommen', phoneticGuide: 'kom-men', darijaCorrect: 'Nji', darijaDistractor: 'Nmshi', timingSec: 5 },
      { id: '16_3', german: 'machen', phoneticGuide: 'makh-en', darijaCorrect: 'Ndir / Nssweb', darijaDistractor: 'Nfeker', timingSec: 8 },
      { id: '16_4', german: 'hören', phoneticGuide: 'hoe-ren', darijaCorrect: 'Nsme3', darijaDistractor: 'Nchouf', timingSec: 11 },
      { id: '16_5', german: 'sehen', phoneticGuide: 'zay-en', darijaCorrect: 'Nchouf', darijaDistractor: 'Nsme3', timingSec: 14 },
      { id: '16_6', german: 'sprechen', phoneticGuide: 'shprekh-en', darijaCorrect: 'Nhder / Ntkellem', darijaDistractor: 'Nskot', timingSec: 17 },
      { id: '16_7', german: 'lernen', phoneticGuide: 'lehr-nen', darijaCorrect: 'Nt3ellem', darijaDistractor: 'Nnsa', timingSec: 20 },
      { id: '16_8', german: 'verstehen', phoneticGuide: 'fehr-shtay-en', darijaCorrect: 'Nfhem', darijaDistractor: 'Nsowel', timingSec: 23 }
    ]
  },

  // --- TIER 7: Zeit, Tage & Orientierung (Time, Days & Navigation) ---
  {
    id: 'song_17',
    number: 17,
    title: 'Die 7 Wochentage',
    subtitle: 'Ayyam l-ousbou3 mn t-tnin tal l-hed',
    theme: 'Wochentage',
    tier: 'Stufe 7: Zeit & Stadt',
    bpm: 85,
    instrument: 'piano',
    lyrics: [
      { id: '17_1', german: 'Montag', phoneticGuide: 'Mohn-tahk', darijaCorrect: 'L-itnin', darijaDistractor: 'T-tlat', timingSec: 2 },
      { id: '17_2', german: 'Dienstag', phoneticGuide: 'Deens-tahk', darijaCorrect: 'T-tlat', darijaDistractor: 'L-arba3', timingSec: 5 },
      { id: '17_3', german: 'Mittwoch', phoneticGuide: 'Mit-vokh', darijaCorrect: 'L-arba3', darijaDistractor: 'L-khemis', timingSec: 8 },
      { id: '17_4', german: 'Donnerstag', phoneticGuide: 'Don-ners-tahk', darijaCorrect: 'L-khemis', darijaDistractor: 'L-jem3a', timingSec: 11 },
      { id: '17_5', german: 'Freitag', phoneticGuide: 'Fray-tahk', darijaCorrect: 'L-jem3a', darijaDistractor: 'S-sebt', timingSec: 14 },
      { id: '17_6', german: 'Samstag', phoneticGuide: 'Zams-tahk', darijaCorrect: 'S-sebt', darijaDistractor: 'L-hed', timingSec: 17 },
      { id: '17_7', german: 'Sonntag', phoneticGuide: 'Zon-tahk', darijaCorrect: 'L-hed', darijaDistractor: 'L-itnin', timingSec: 20 },
      { id: '17_8', german: 'das Wochenende', phoneticGuide: 'das Vokh-en-en-de', darijaCorrect: 'Fin de semaine / Weekend', darijaDistractor: 'L-khedma', timingSec: 23 }
    ]
  },
  {
    id: 'song_18',
    number: 18,
    title: 'Die Tageszeiten & Zeit',
    subtitle: 'Awqat n-nhar w l-kelmat d l-waqt',
    theme: 'Zeitbegriffe',
    tier: 'Stufe 7: Zeit & Stadt',
    bpm: 82,
    instrument: 'chillhop',
    lyrics: [
      { id: '18_1', german: 'der Morgen', phoneticGuide: 'dehr Mor-gen', darijaCorrect: 'S-sba7', darijaDistractor: 'L-3chiya', timingSec: 2 },
      { id: '18_2', german: 'der Mittag', phoneticGuide: 'dehr Mit-tahk', darijaCorrect: 'Z-zwal / Wast n-nhar', darijaDistractor: 'L-lil', timingSec: 5 },
      { id: '18_3', german: 'der Abend', phoneticGuide: 'dehr Ah-bent', darijaCorrect: 'L-3chiya / L-maghreb', darijaDistractor: 'S-sba7', timingSec: 8 },
      { id: '18_4', german: 'die Nacht', phoneticGuide: 'dee Nakht', darijaCorrect: 'L-lil', darijaDistractor: 'N-nhar', timingSec: 11 },
      { id: '18_5', german: 'heute', phoneticGuide: 'hoy-te', darijaCorrect: 'L-youm', darijaDistractor: 'Ghedda', timingSec: 14 },
      { id: '18_6', german: 'morgen', phoneticGuide: 'mor-gen (lowercase)', darijaCorrect: 'Ghedda', darijaDistractor: 'L-bareh', timingSec: 17 },
      { id: '18_7', german: 'jetzt', phoneticGuide: 'yetst', darijaCorrect: 'Daba', darijaDistractor: 'Mn be3d', timingSec: 20 },
      { id: '18_8', german: 'Wie spät ist es?', phoneticGuide: 'Vee shpayt ist es?', darijaCorrect: 'Ch7al f s-sa3a?', darijaDistractor: 'Fin ghadi?', timingSec: 23 }
    ]
  },
  {
    id: 'song_19',
    number: 19,
    title: 'In der Stadt',
    subtitle: 'N3et l-triq w n3et l-amakin f l-mdina',
    theme: 'Navigation',
    tier: 'Stufe 7: Zeit & Stadt',
    bpm: 88,
    instrument: 'moroccan_beat',
    lyrics: [
      { id: '19_1', german: 'Wo ist...?', phoneticGuide: 'Voh ist...?', darijaCorrect: 'Fina howa...?', darijaDistractor: 'Chkoun howa...?', timingSec: 2 },
      { id: '19_2', german: 'geradeaus', phoneticGuide: 'ge-rah-de-ows', darijaCorrect: 'Nishan / Trik direct', darijaDistractor: 'Dour 3la l-iser', timingSec: 5 },
      { id: '19_3', german: 'nach links', phoneticGuide: 'nahkh links', darijaCorrect: '3la l-isser', darijaDistractor: '3la l-imen', timingSec: 8 },
      { id: '19_4', german: 'nach rechts', phoneticGuide: 'nahkh rekhts', darijaCorrect: '3la l-imen', darijaDistractor: '3la l-isser', timingSec: 11 },
      { id: '19_5', german: 'der Bahnhof', phoneticGuide: 'dehr Bahn-hohf', darijaCorrect: 'La gare d t-tren', darijaDistractor: 'L-matar', timingSec: 14 },
      { id: '19_6', german: 'die Straße', phoneticGuide: 'dee Shtrah-sse', darijaCorrect: 'Z-zenqa / Shari3', darijaDistractor: 'D-dar', timingSec: 17 },
      { id: '19_7', german: 'hier', phoneticGuide: 'heer', darijaCorrect: 'Hna', darijaDistractor: 'Lhih', timingSec: 20 },
      { id: '19_8', german: 'da drüben', phoneticGuide: 'dah droo-ben', darijaCorrect: 'Lhih / Hnak', darijaDistractor: 'Hna 9rib', timingSec: 23 }
    ]
  },

  // --- TIER 8: Der erste echte Dialog (A1 Capstone) ---
  {
    id: 'song_20',
    number: 20,
    title: 'Der erste Dialog (A1 Capstone)',
    subtitle: 'L-ghoniya l-khatima: Dialog kaml f l-cafe',
    theme: 'Abschluss-Dialog',
    tier: 'Stufe 8: A1 Meisterschaft',
    bpm: 90,
    instrument: 'piano',
    lyrics: [
      { id: '20_1', german: 'Hallo, guten Tag!', phoneticGuide: 'Hal-lo, goo-ten Tahk!', darijaCorrect: 'Ahlan, nharak mabrouk!', darijaDistractor: 'Bslama, tsba7 3la khir!', timingSec: 2 },
      { id: '20_2', german: 'Einen Kaffee, bitte!', phoneticGuide: 'Ay-nen Kaf-fay, bit-te!', darijaCorrect: 'Wa7ed l-qahwa 3afak!', darijaDistractor: 'Kass d l-ma 3afak!', timingSec: 5 },
      { id: '20_3', german: 'Mit Milch und Zucker?', phoneticGuide: 'Mit Milkh oont Tsoo-ker?', darijaCorrect: 'B l-hlib w s-sokkar?', darijaDistractor: 'Bla walou?', timingSec: 8 },
      { id: '20_4', german: 'Nur mit Milch, danke', phoneticGuide: 'Noor mit Milkh, dang-ke', darijaCorrect: 'Ghir b l-hlib, shukran', darijaDistractor: 'Ghir b s-sokkar', timingSec: 11 },
      { id: '20_5', german: 'Was kostet das?', phoneticGuide: 'Vas kos-tet das?', darijaCorrect: 'Bsh7al hadchi?', darijaDistractor: 'Fin l-kass?', timingSec: 14 },
      { id: '20_6', german: 'Das macht drei Euro', phoneticGuide: 'Das makht dray Oy-ro', darijaCorrect: 'Jat tlata Euro', darijaDistractor: 'Jat 3shra Euro', timingSec: 17 },
      { id: '20_7', german: 'Hier bitte schön!', phoneticGuide: 'Heer bit-te shoen!', darijaCorrect: 'Hahiya tfeddel!', darijaDistractor: 'Ma3ndich sarf!', timingSec: 20 },
      { id: '20_8', german: 'Schönen Tag noch!', phoneticGuide: 'Shoe-nen Tahk nokh!', darijaCorrect: 'Baqi nharek mabrouk!', darijaDistractor: 'Layla sa3ida!', timingSec: 23 },
      { id: '20_9', german: 'Danke, gleichfalls!', phoneticGuide: 'Dang-ke, glaykh-fals!', darijaCorrect: 'Shukran, lina w lik!', darijaDistractor: 'Shukran, bslama!', timingSec: 26 },
      { id: '20_10', german: 'Ich kann Deutsch!', phoneticGuide: 'Ikh kan Doytsh!', darijaCorrect: 'Ana kan9der 3la l-Almaniya!', darijaDistractor: 'Ana ma kan3ref walou!', timingSec: 29 }
    ]
  }
];

export function getSongById(id: string): SongDefinition | undefined {
  return FOUNDATIONAL_SONGS.find((s) => s.id === id);
}

export function getAllSongs(): SongDefinition[] {
  return FOUNDATIONAL_SONGS;
}
