// Master Professor Moroccan-German Pedagogy Engine
// Specially crafted for Moroccan learners acquiring German (A1-B1)
// Provides mouth maps, Moroccan trap alerts, teacher advice in Darija, and street dialogues.

import type { SongLyricItem, RealDialogueSnippet } from '../types';

export interface MasterGuidanceData {
  explanation: string;
  phoneticSecret: string;
  moroccanTrap: string;
  realDialogue: RealDialogueSnippet;
  grammarBadge: {
    label: string;
    color: string;
    bg: string;
    border: string;
  };
  memoryHook: string;
}

// Curated pedagogical repository for foundational curriculum items
const CURATED_PEDAGOGY: Record<string, Partial<MasterGuidanceData>> = {
  // --- Song 1: Alphabet & Umlaute ---
  '1_1': {
    explanation: 'F l-Almaniya, l-7ourouf A, B, C kaytneqo bchkel saafi w wadi7. Makayench dak tkhlat fhal l-anglaisiya. Fach katqra kelma, katnfeqha 7arf b 7arf.',
    phoneticSecret: 'Fte7 femmek mzyan f "A" fhal fach katgol "Ahlan". F "B" nfeqha bchwiyyet d l-hawa, w "C" katneq "Tseh" (T + S khfifa).',
    moroccanTrap: 'L-Mgharba kaykhalto bin "C" d l-anglaisiya (Si) w "C" d l-Almaniya li hiya "Tseh". Ila ma nteqtich T f l-bedya katban mberzt!',
    realDialogue: {
      speakerA: 'Lehrer:',
      germanA: 'Buchstabieren Sie bitte: A - B - C!',
      speakerB: 'Bilal:',
      germanB: 'A [Ah], B [Beh], C [Tseh]!',
      darijaContext: 'L-oustad kaygoul lik: "Spell l-hourouf 3afak", w nta katjaweb b ntiq Almaniy sa7i7.'
    },
    memoryHook: '3qel: C f l-Almaniya dima m3aha T mkhbbiya f l-bedya: [Tseh]!'
  },
  '1_2': {
    explanation: 'Ä [ae] howa A m3aha jouj noqat (Umlaut). Kaybeddel s-sout mn "A" mftou7a l "Eh" m7loula fhal "è" f l-fransawiya (fhal f kelmet tête).',
    phoneticSecret: 'Fte7 fmmek b j-jenb fhal ila katbtasem w khrej sout "Eh" mn wast l-7elq bla ma tzeyer 3la lsanek.',
    moroccanTrap: 'Bzaf d l-Mgharba kayqrawha "A" 3adiya wla "Ay". Hada ghalat kbir kaybeddel ma3na l-kelma!',
    realDialogue: {
      speakerA: 'Kellner:',
      germanA: 'Möchten Sie frische Äpfel?',
      speakerB: 'Bilal:',
      germanB: 'Ja, zwei Äpfel bitte!',
      darijaContext: 'Garçon kaysowlek wash bghiti teffah (Äpfel), katnteq Ä b [Eh] mzyan.'
    },
    memoryHook: 'Ä = Fte7 fmmek w btasem: "Eh"!'
  },
  '1_3': {
    explanation: 'Ö [oe] howa l-harf li kaykhele3 n-nass walakin sirro sahel! Howa mel9i bin "O" w "E". Kaychbeh l "eu" f l-fransawiya (fhal "bleu" wla "deux").',
    phoneticSecret: 'Dawwer chnayfek fhal ila ghadi tgoul "O" (daira dayra), walakin mn dakhel khrej sout "E"! Hadd l-haraka katkhelli s-sout itla3 Almaniy 100%.',
    moroccanTrap: 'Ghaliban l-Mgharba kaykherjouha "O" 3adiya wla "Ou". Ila golti "schon" f 3ewd "schön", beddelti l-ma3na mn "Zwina" l "Déjà"!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Wie findest du Berlin?',
      speakerB: 'Bilal:',
      germanB: 'Berlin ist wunderschön!',
      darijaContext: 'Sahbek kaysowlek 3la Berlin, katgoul lih "Wunderschön" (Wa3ra bzaaf) b Ö nqia.'
    },
    memoryHook: 'Ö = Chnayef dayrin fhal O + Lsan kaygoul E!'
  },
  '1_4': {
    explanation: 'Ü [ue] howa U m3a jouj noqat. Howa exactemenet sout "U" f l-fransawiya (fhal "tu" wla "salut"). F Darija ma3ndnach had s-sout walakin f l-fransawiya mojoud.',
    phoneticSecret: 'Jme3 chnayfek bzzaf fhal ila ghadi tseffer (tiny hole), w gol "EE" mn dakhel. Had t-tadafof kaykherrej Ü nqiya.',
    moroccanTrap: 'Kat-tneq "Ou" 3adiya 3nd l-Mgharba. Mathalan "fünf" (5) kaygoulouha "founf" w hada kaybeyyen bli ntiqek da3if!',
    realDialogue: {
      speakerA: 'Verkäufer:',
      germanA: 'Wie viele Brötchen möchten Sie?',
      speakerB: 'Bilal:',
      germanB: 'Fünf Brötchen, bitte!',
      darijaContext: 'Moul l-mkhbaza kaysowlk ch7al d l-khobzat bghiti, katjawbo: "Fünf" (khemsa).'
    },
    memoryHook: 'Ü = Chnayef kayssefro + sot "EE" mn d-dakhel!'
  },
  '1_6': {
    explanation: 'das Eszett [ß] howa 7arf khass ghir b l-Almaniya. Kaytssma "scharfes S" (S l-madi). Kaytssme3 dima "SS" naqiya w qa77a, w kayji ghir mn be3d les voyelles twal.',
    phoneticSecret: '7ett rras d lsanek mour snanek l-te7tiyin w khrej s-sfeer mjehhed fhal l-af3a [ssss].',
    moroccanTrap: 'Kaykhalto bin ß w B 7it katchbeh liha f l-ktaba! ß rah machi B, ß rah jouj d les S (ss)!',
    realDialogue: {
      speakerA: 'Passant:',
      germanA: 'Entschuldigung, wo ist die Post?',
      speakerB: 'Bilal:',
      germanB: 'Die Post ist in dieser Straße!',
      darijaContext: 'Wa7ed kaysowlek fin l-bosta, katwerrih z-zenqa: "Straße" (b ß madi).'
    },
    memoryHook: 'ß machi B! ß = Sssss madiyya bzaf!'
  },

  // --- Song 2: Zahlen 1-10 ---
  '2_1': {
    explanation: '"eins" = 1. L-Alman kaykhedmouh f l-7ssab w l-arqam. Red l-bal: f l-Almaniya "ei" dima katneq "ay" (fhal f kelmet night b l-anglaisiya)!',
    phoneticSecret: 'Nfeqha [Ayns]. Bedya b A mftou7a w kmml b yns khafifa.',
    moroccanTrap: 'L-Mgharba kayqraw "ei" fhal "ey" wla "ee" fransawiya. L-qa3ida: "ei" = [AY]!',
    realDialogue: {
      speakerA: 'Kellner:',
      germanA: 'Für wie viele Personen?',
      speakerB: 'Bilal:',
      germanB: 'Nur eins, bitte!',
      darijaContext: 'L-garçon kaysowlek ch7al mn wahed ntouma, katgoul lih wahed safi.'
    },
    memoryHook: 'E + I = AY (Ayns = 1)'
  },
  '2_2': {
    explanation: '"zwei" = 2. L-harf Z f l-Almaniya dima howa [TS]. Makayench sout Z fhal f Darija f bedyet l-kelma!',
    phoneticSecret: 'Dir sout T b snanek l-foqaniyin w tbe3ha b S b zzerba: [Ts]! Kmmlha b [way]: [Tsway].',
    moroccanTrap: 'L-Ghalat raqm 1 d l-Mgharba: kaygoulou "Zway" b Z 3adiya d zite! La, dima [Tsway]!',
    realDialogue: {
      speakerA: 'Kassierer:',
      germanA: 'Wie viele Tickets brauchen Sie?',
      speakerB: 'Bilal:',
      germanB: 'Zwei Tickets bitte!',
      darijaContext: 'Moul l-guichet kaysowlk ch7al d les billets, katgoul lih jouj b ntiq Ts.'
    },
    memoryHook: 'Z f l-Almaniya = TS! ZWEI = Tsway!'
  },
  '2_4': {
    explanation: '"vier" = 4. L-harf V f l-Almaniya kaytneq F f aghlab l-kelmat l-assliya!',
    phoneticSecret: '7ett snanek l-foqaniyin 3la chneftek t-te7tiya w khrej [F]. Vier katneq [Feer] m3a r khafifa f l-lekher.',
    moroccanTrap: 'Ntiqha b [V] fhal voiture! Almaniy ila sm3ek galti "Veer" maghadich ifhmek direct. Gol [Feer]!',
    realDialogue: {
      speakerA: 'Chef:',
      germanA: 'Wie viele Stunden arbeitest du heute?',
      speakerB: 'Bilal:',
      germanB: 'Ich arbeite heute vier Stunden.',
      darijaContext: 'L-patron kaysowlek ch7al d sway3 ghadi tkhdem, katgoul lih 4 d sway3.'
    },
    memoryHook: 'V f l-Almaniya = F! VIER = Feer!'
  },
  '2_5': {
    explanation: '"fünf" = 5. Hada howa l-imtihan l-7eqiqi d l-Umlaut Ü!',
    phoneticSecret: 'Jme3 chnayfek kora sghira, nfeq F moraha Ü [ue] moraha NF: [Fuenf].',
    moroccanTrap: 'Ntiqha "Founf" wla "Fonf". Dir l-effort f Ü bash t-semma profi!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Um wie viel Uhr treffen wir uns?',
      speakerB: 'Bilal:',
      germanB: 'Treffen wir uns um fünf Uhr!',
      darijaContext: 'Kattfahem m3a sahbek 3la l-weqt: m3a l-khemsa nichan!'
    },
    memoryHook: 'FÜNF: Jme3 chnayfek w sir m3a l-5!'
  },
  '2_6': {
    explanation: '"sechs" = 6. S f bedyet l-kelma moraha voyelle katneq Z! W "chs" katneq [KS]!',
    phoneticSecret: 'Bedya b [Z] sahla, moraha E, moraha [KS]: [Zeks]!',
    moroccanTrap: 'L-Mgharba kayqrawha "Sekhs" b l-Kha 7it kanchoufo "ch". Hna chs katneq KS nichan: [Zeks]!',
    realDialogue: {
      speakerA: 'Polizist:',
      germanA: 'Welche Hausnummer suchen Sie?',
      speakerB: 'Bilal:',
      germanB: 'Ich suche Hausnummer sechs.',
      darijaContext: 'L-boulis kaysowlek 3la nmra d d-dar, katgoul lih nmra setta.'
    },
    memoryHook: 'SECHS = [Zeks] fhal Z + KS!'
  },
  '2_8': {
    explanation: '"acht" = 8. Hna "ch" moraha harf "A", dakshi 3lash katneq Kha (خ) qasi7a fhal f Darija!',
    phoneticSecret: 'Fte7 fmmek f "A" w kherrej Kha (خ) mn l-7elq l-wessani: [Akht]!',
    moroccanTrap: 'Hna mzyan tnteqha Kha! Walakin matnsash T f l-lekher: Acht machi Ach!',
    realDialogue: {
      speakerA: 'Kunde:',
      germanA: 'Was kostet das Brot?',
      speakerB: 'Verkäufer:',
      germanB: 'Das kostet acht Euro.',
      darijaContext: 'Moul l-hanout kaygoul lik t-taman: 8 Euro.'
    },
    memoryHook: 'Acht = A + Kha + T!'
  },
  '2_9': {
    explanation: '"neun" = 9. F l-Almaniya "eu" dima katneq [OY] fhal f boy!',
    phoneticSecret: 'Nfeqha [Noyn]. E + U = OY!',
    moroccanTrap: 'L-Mgharba kayqrawha "Neon" wla "Neun" b fransawiya. La: EU = [OY]!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Wie alt ist dein Bruder?',
      speakerB: 'Bilal:',
      germanB: 'Er ist neun Jahre alt.',
      darijaContext: 'Sahbek kaysowlk ch7al f 3omr khouk: 9 snin.'
    },
    memoryHook: 'EU = OY! Neun = Noyn!'
  },
  '2_10': {
    explanation: '"zehn" = 10. Z katneq [TS], w H f wast l-kelma katmedd l-harf E (Dehnungs-H)!',
    phoneticSecret: 'Tseh-n: mdd l-harf E chwiya: [Tsehn].',
    moroccanTrap: 'Matkherrejch H mjehhed hna. H ghir katmedd E!',
    realDialogue: {
      speakerA: 'Trainer:',
      germanA: 'Noch zehn Sekunden!',
      speakerB: 'Bilal:',
      germanB: 'Alles klar, ich schaffe zehn!',
      darijaContext: 'L-entraineur kaygol lik baqi 10 tawani!'
    },
    memoryHook: 'ZEHN = [Tsehn] (10)!'
  },

  // --- Song 3: Zahlen 11-20 ---
  '3_2': {
    explanation: '"zwölf" = 12. Hada combo wa3er: Z [TS] + Ö [oe] + lf!',
    phoneticSecret: 'Bedya b [TS], dawwer chnayfek fhal O w gol E [OE], w kmml b LF: [Tswoelf]!',
    moroccanTrap: 'Ntiqha "Zwolf" wla "Zoolf". Khassha Ts w Ö mzyan!',
    realDialogue: {
      speakerA: 'Chef:',
      germanA: 'Wann beginnt die Pause?',
      speakerB: 'Bilal:',
      germanB: 'Um zwölf Uhr mittags.',
      darijaContext: 'L-pause katbda m3a 12 d n-nhar nichan.'
    },
    memoryHook: 'ZWÖLF = [Tswoelf] (12)!'
  },
  '3_10': {
    explanation: '"zwanzig" = 20. Qa3ida dahabiya f l-Almaniya: kelmat li kayssaliw b "-ig" f l-Almaniya l-wosta kaytneqo "-ikh" (soft ich-Laut)!',
    phoneticSecret: 'Z [TS] + wan + tsikh: [Tswan-tsikh]!',
    moroccanTrap: 'Ntiqha "Zwan-zik" wla "Zwan-zig" b l-Gaf. Ntiq s-s7i7 d Hochdeutsch howa "-ikh"!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Wie alt bist du?',
      speakerB: 'Bilal:',
      germanB: 'Ich bin zwanzig Jahre alt.',
      darijaContext: 'Bilal kayjawb 3la 3omro: "Ich bin zwanzig" (3ndi 20 3am).'
    },
    memoryHook: '-IG f l-kher = -IKH! Zwanzig = Tswantsikh!'
  },

  // --- Song 6: Befinden ---
  '6_1': {
    explanation: '"Wie geht\'s?" = Kif dayr? / Labas? Hiya khtissar d "Wie geht es dir?" (Kifach ghadi m3ak l-7al?). W f l-Almaniya dima [V]!',
    phoneticSecret: 'Vee gayts: W = [V], h f geht katmedd E: [Vee gayts]?',
    moroccanTrap: 'Swel wahed formal b "Wie geht\'s?". M3a l-mowaddafin w l-asatida katgoul: "Wie geht es Ihnen?"',
    realDialogue: {
      speakerA: 'Sarah:',
      germanA: 'Hallo Bilal! Wie geht\'s?',
      speakerB: 'Bilal:',
      germanB: 'Danke, super! Und dir?',
      darijaContext: 'Salam d z-zenqa bin s7ab: labas w nta labas.'
    },
    memoryHook: 'Wie geht\'s = Kif dayra l-omour m3ak?'
  },
  '6_2': {
    explanation: '"Mir geht es gut" = Ana bkhir. RED L-BAL: f l-Almaniya ma katgoulch "Ich bin gut" (hada kay3ni ana insan khayyer akhlaqiyan!). Katgoul "Mir geht es gut" (L-7al ghadi m3aya mezyan)!',
    phoneticSecret: 'Meer gayt es goot. R khfifa w T wad7a.',
    moroccanTrap: 'Tgoul "Ich bin gut" bach tgoul ana labas! Hada ashhar trap kaydiroh l-ajaneb kamlin!',
    realDialogue: {
      speakerA: 'Arzt:',
      germanA: 'Wie geht es Ihnen heute?',
      speakerB: 'Bilal:',
      germanB: 'Mir geht es heute sehr gut, danke!',
      darijaContext: 'T-tbib kaysowlk 3la sa7tek, katjawbo b Mir geht es gut.'
    },
    memoryHook: 'MIR geht es gut (machi Ich bin gut)!'
  },

  // --- Song 7: Identität ---
  '7_1': {
    explanation: '"Wer bist du?" = Chkoun nta? W = [V], bist = فعل الكينونة مع du. Isti3mal m3a shabek w n-nass f 3omrek.',
    phoneticSecret: 'Vehr bist doo? R khfifa f Wer.',
    moroccanTrap: 'L-Mgharba kaykhalto bin "Wer" (Chkoun / Who) w "Wo" (Fin / Where) 7it f l-anglaisiya Where = Fin!',
    realDialogue: {
      speakerA: 'Student:',
      germanA: 'Hallo, ich bin neu hier. Wer bist du?',
      speakerB: 'Bilal:',
      germanB: 'Hallo! Ich bin Bilal aus Marokko.',
      darijaContext: 'Talib jdid tlaqito f l-jami3a kaysowlek 3la smitek.'
    },
    memoryHook: 'WER = Chkoun (Who)! WO = Fin (Where)!'
  },
  '7_2': {
    explanation: '"Ich heiße Bilal" = Smiti Bilal. Fiha l-harf ß (scharfes S) li kaytneq "SS" madiyya.',
    phoneticSecret: 'Ikh hay-sse Bee-lal. EI = [AY], ß = [SS].',
    moroccanTrap: 'Ntiqha "Ich heisse" b Z. La, ß dima SS naqiya!',
    realDialogue: {
      speakerA: 'Lehrerin:',
      germanA: 'Wie heißt du bitte?',
      speakerB: 'Bilal:',
      germanB: 'Ich heiße Bilal und komme aus Casablanca.',
      darijaContext: 'L-mou3allima katsowlk 3la smitek f awwel hssa.'
    },
    memoryHook: 'Ich heiße = Smiti (EI = AY, ß = SS)!'
  },

  // --- Song 8: Herkunft ---
  '8_1': {
    explanation: '"Woher kommst du?" = Mnina bled nta? Wo = Fin, her = jihat l-motakallim. Kommst = ja mn kommen (iji).',
    phoneticSecret: 'Vo-hehr komst doo? W = [V], H wad7a.',
    moroccanTrap: 'Tgoul "Wo kommst du?" bla her! "Wo" bo7dha kat3ni fin, "Woher" kat3ni mnina!',
    realDialogue: {
      speakerA: 'Kollege:',
      germanA: 'Dein Akzent ist interessant! Woher kommst du?',
      speakerB: 'Bilal:',
      germanB: 'Ich komme aus Marokko!',
      darijaContext: 'Collègue f l-khedma 3jbo l-accent dyalek w swelk mnin nta.'
    },
    memoryHook: 'WOHER = Mn fin / Mnina bled!'
  },
  '8_2': {
    explanation: '"Ich komme aus Marokko" = Ana mn l-Maghreb. Harf jar "aus" kaytst3mel dima m3a l-boldan w l-moudoun bash tbiyen l-asl dyalek!',
    phoneticSecret: 'Ikh kom-me ows Ma-rok-ko. AUS = [OWS] (fhal house).',
    moroccanTrap: 'Tgoul "Ich komme von Marokko". L-asl dima m3ah AUS!',
    realDialogue: {
      speakerA: 'Nachbarin:',
      germanA: 'Woher kommen Sie ursprünglich?',
      speakerB: 'Bilal:',
      germanB: 'Ich komme aus Marokko, aus Casablanca.',
      darijaContext: 'Jara almaniya katsowlk 3la aslek, katgoul liha aus Marokko.'
    },
    memoryHook: 'KOMMEN + AUS = Jey mn / Asli mn!'
  },

  // --- Song 10: Haben ---
  '10_1': {
    explanation: '"ich habe" = 3ndi (I have / J\'ai). Assas l-milkiya f l-Almaniya.',
    phoneticSecret: 'Ikh hah-be. H wad7a, A mftou7a.',
    moroccanTrap: 'Tgoul "Ich habe 20 Jahre" bach tgoul 3ndi 20 3am! F l-Almaniya l-3omr dima m3a SEIN: "Ich bin 20 Jahre alt"!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Hast du heute Zeit?',
      speakerB: 'Bilal:',
      germanB: 'Ja, ich habe heute viel Zeit!',
      darijaContext: 'Sahbek kaysowlk wash 3ndk l-weqt, katgoul lih ih 3ndi l-weqt.'
    },
    memoryHook: 'ICH HABE = 3ndi l-7aja (walakin l-3omr b ICH BIN)!'
  },
  '10_8': {
    explanation: '"Ich habe Hunger" = Fiya j-jou3. F l-Almaniya katgoul "3ndi jou3" (Ich habe Hunger) w "3ndi 3tech" (Ich habe Durst)!',
    phoneticSecret: 'Ikh hah-be Hoong-er. NG kattsret fhal anglaisiya.',
    moroccanTrap: 'Tgoul "Ich bin hungrig" f zanqa; l-Alman f l-hadra l-3adiya dima kaygoulou "Ich habe Hunger"!',
    realDialogue: {
      speakerA: 'Kollege:',
      germanA: 'Gehen wir in die Kantine?',
      speakerB: 'Bilal:',
      germanB: 'Ja gern, ich habe großen Hunger!',
      darijaContext: 'Collègue kaysowlk nmshiw l l-restau, katgoul lih fiya jou3 bzaf!'
    },
    memoryHook: 'Ich habe Hunger = Fiya j-jou3!'
  },

  // --- Song 14: Routine ---
  '14_1': {
    explanation: '"aufstehen" = Nfiq / Nnod mn l-frash. Hada "Trennbares Verb" (verb munfasil)! Fach katserfou, "auf" katmchi l-akher l-joumla: "Ich stehe um 7 Uhr AUF"!',
    phoneticSecret: 'Owf-shtay-en: AU = [OW], ST f l-bedya = [SHT]!',
    moroccanTrap: 'Ntiq "st" b S 3adiya. F l-bedyet l-kelmat l-Almaniya, ST dima katneq [SHT]!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Wann stehst du sonntags auf?',
      speakerB: 'Bilal:',
      germanB: 'Ich stehe um acht Uhr auf.',
      darijaContext: 'Sahbek kaysowlk m3ash katfiq l-hed, katgoul lih m3a 8 kan-fiq.'
    },
    memoryHook: 'AUFSTEHEN: St = SHT! Auf katmchi l l-kher!'
  },

  // --- Song 15: Essen & Trinken ---
  '15_1': {
    explanation: '"ich esse" = Ana kanakol. Verb Essen (yakol) verb qwi (starkes Verb): Er isst (howa yakol) katbeddel fiha E l I!',
    phoneticSecret: 'Ikh es-se. Double S madiyya w E qssira.',
    moroccanTrap: 'Matbeddelch s-sout! Esse sahla bzaf.',
    realDialogue: {
      speakerA: 'Mutter:',
      germanA: 'Was isst du zum Frühstück?',
      speakerB: 'Bilal:',
      germanB: 'Ich esse Brot mit Olivenöl.',
      darijaContext: 'Katsowlk l-walida chno kataqol f l-ftour: khobz b zit l-3oud.'
    },
    memoryHook: 'ICH ESSE = Ana kanakol!'
  },

  // --- Song 16: Aktionsverben ---
  '16_6': {
    explanation: '"sprechen" = Nhder / Ntkellem. SP f bedyet l-kelma dima [SHP]! W "ch" hna moraha E dakshi 3lash katneq ich-Laut khfifa!',
    phoneticSecret: 'Shprekh-en: SP = [SHP], CH = ich-Laut na3im.',
    moroccanTrap: 'Ntiq SP fhal fransawiya "spécial". F l-Almaniya dima [SHP]: Shprechen!',
    realDialogue: {
      speakerA: 'Passant:',
      germanA: 'Sprechen Sie Deutsch?',
      speakerB: 'Bilal:',
      germanB: 'Ja, ich spreche ein bisschen Deutsch!',
      darijaContext: 'Wahed kaysowlk wash kat-hder Almaniya, katgoul lih shwiya.'
    },
    memoryHook: 'SP = SHP! Sprechen = Shprechen!'
  },
  '16_8': {
    explanation: '"verstehen" = Nfhem. V f bedya = [F], ST f wast l-kelma = [SHT]! Hada verb d l-fahama l-kobra.',
    phoneticSecret: 'Fehr-shtay-en: V = [F], ver- dima katneq [fehr-].',
    moroccanTrap: 'Ntiqha "Verstehen" b V d voiture. Dima [Fehrshteyen]!',
    realDialogue: {
      speakerA: 'Lehrer:',
      germanA: 'Verstehst du diesen Satz?',
      speakerB: 'Bilal:',
      germanB: 'Ja, ich verstehe alles perfekt!',
      darijaContext: 'L-oustad kaysowlk wash fhemti had l-joumla, katjawbo b kol tiqa.'
    },
    memoryHook: 'VERSTEHEN: V = F, ST = SHT (Fhem)!'
  },

  // --- Song 17: Wochentage ---
  '17_3': {
    explanation: '"Mittwoch" = L-arba3. Khtira3 Almaniy 3abqari: Mitte (wast) + Woche (simana) = wast s-simana! L-Alman massmawsh l-arba3 3la smiyet ilah fhal bbaqi l-ayyam.',
    phoneticSecret: 'Mit-vokh: W = [V], OCH fiha Kha (خ) 7arsha 7it moraha O!',
    moroccanTrap: 'Katnsa bliwoch fiha Kha qasi7a: Mit-vokh!',
    realDialogue: {
      speakerA: 'Kollege:',
      germanA: 'Haben wir am Mittwoch ein Meeting?',
      speakerB: 'Bilal:',
      germanB: 'Ja, am Mittwoch um zehn Uhr.',
      darijaContext: 'Rendez-vous f l-khedma nhar l-arba3.'
    },
    memoryHook: 'Mitte (wast) + Woche (simana) = Mittwoch (L-Arba3)!'
  },

  // --- Song 19: Navigation ---
  '19_2': {
    explanation: '"geradeaus" = Nishan / Trik direct. Kelma d n-na3t l-triq li ghadi tsme3ha f ay blasa f l-Almaniya.',
    phoneticSecret: 'Ge-rah-de-ows: AU = [OW] fhal f house.',
    moroccanTrap: 'Tghlet bin rechts (limen), links (liser), w geradeaus (nishan)!',
    realDialogue: {
      speakerA: 'Tourist:',
      germanA: 'Wie komme ich zum Hauptbahnhof?',
      speakerB: 'Bilal:',
      germanB: 'Gehen Sie immer geradeaus!',
      darijaContext: 'Touriste swelk fin la gare, katgoul lih sir nishan!'
    },
    memoryHook: 'GERADEAUS = Sir nishan bla matdour!'
  },
  '19_5': {
    explanation: '"der Bahnhof" = La gare d t-tren. Kelma morakkaba: die Bahn (s-sekka / t-tren) + der Hof (l-fina2 / l-sa7a) = Der Bahnhof (MOUDHAQAR - der)!',
    phoneticSecret: 'Dehr Bahn-hohf: H katmedd A (Bahn) w O (Hof).',
    moroccanTrap: 'Tgoul "die Bahnhof" 7it la gare f fransawiya mouannat! F l-Almaniya dima DER Bahnhof.',
    realDialogue: {
      speakerA: 'Taxifahrer:',
      germanA: 'Wohin möchten Sie fahren?',
      speakerB: 'Bilal:',
      germanB: 'Zum Hauptbahnhof, bitte!',
      darijaContext: 'F taxi katgoul l chauffeur iddik l la gare centrale.'
    },
    memoryHook: '🔵 DER Bahnhof: La gare moudakkar (der)!'
  },

  // --- Song 20: Capstone Dialog ---
  '20_2': {
    explanation: '"Einen Kaffee, bitte!" = Wahed l-qahwa 3afak! 3LASH "Einen" machi "Ein"? 7it l-qahwa Männlich (der Kaffee) w jat Maf3oul bihi (Akkusativ)! Dakshi 3lash "der" katwlli "den" w "ein" katwlli "einen"!',
    phoneticSecret: 'Ay-nen Kaf-fay, bit-te. Ntiqha b slasa.',
    moroccanTrap: 'Tgoul "Ein Kaffee bitte" bhal l-mobtadi2in. Fach katgoul "Einen Kaffee", l-Alman kay3erfouk pro f l-grammaire!',
    realDialogue: {
      speakerA: 'Kellnerin:',
      germanA: 'Guten Tag! Was darf ich Ihnen bringen?',
      speakerB: 'Bilal:',
      germanB: 'Einen Kaffee bitte, schwarz und heiß.',
      darijaContext: 'Kat-tleb qahwa k7la skhouna f café b Akkusativ nadya.'
    },
    memoryHook: 'Männlich f l-Akkusativ = EINEN! Einen Kaffee bitte!'
  },
  '20_9': {
    explanation: '"Danke, gleichfalls!" = Shukran, lina w lik / Hed sa3id lina w lik. Fach chi wahed kaygoul lik "Schönen Tag" (Nharak mabrouk) wla "Schönes Wochenende", a7san jawab howa "Danke, gleichfalls"!',
    phoneticSecret: 'Dang-ke, glaykh-fals. EI = [AY], ch = ich-Laut khfifa.',
    moroccanTrap: 'Tjawb ghir b "Danke". "Gleichfalls" katbeyyen adab 3ali w lougha 7eya!',
    realDialogue: {
      speakerA: 'Verkäufer:',
      germanA: 'Schönes Wochenende noch!',
      speakerB: 'Bilal:',
      germanB: 'Vielen Dank, gleichfalls!',
      darijaContext: 'Moul l-hanout tmenna lik weekend zwine, katjawbo: lina w lik!'
    },
    memoryHook: 'Gleich (fhal fhal) + falls = Lina w lik!'
  },

  // --- Song 4: Begrüßungen ---
  '4_1': {
    explanation: '"Hallo!" hiya salam l-iktiraia li kat-st3mel f kol blasa m3a shabek, f l-ma7allat, m3a n-nass f zenqa.',
    phoneticSecret: 'H f l-Almaniya khasha t-tneq b nneffas mn l-7elq (fhal H d hwa). Nfeqha [Hal-lo] bla t3qid.',
    moroccanTrap: 'L-Mgharba l-moulfin l-fransawiya kayhbtou 3la H w kaygoulou "Allo". Almaniy khassou isme3 H wadi7a!',
    realDialogue: {
      speakerA: 'Nachbar:',
      germanA: 'Hallo Bilal! Wie geht es dir?',
      speakerB: 'Bilal:',
      germanB: 'Hallo! Mir geht es super, danke!',
      darijaContext: 'Jarek f l-immeuble tlaqa m3ak w sellm 3lik b Hallo.'
    },
    memoryHook: 'H dyal HALLO katnfeqq b n-neffass: HHH-allo!'
  },
  '4_2': {
    explanation: '"Guten Morgen" = Sba7 l-khir. Kat-goulha mn l-fjer tal 11:00 d s-sba7. Mn be3dha katbeddel l Guten Tag.',
    phoneticSecret: 'R f "Morgen" katji khfifa bhal l-Ghayn khfifa wla A msrouta f l-kher: [Goo-ten Mor-gen].',
    moroccanTrap: 'Katgoul Guten Morgen m3a 2 d l-3chiya! L-Alman deqiqin f l-weqt.',
    realDialogue: {
      speakerA: 'Kollege:',
      germanA: 'Guten Morgen! Hast du gut geschlafen?',
      speakerB: 'Bilal:',
      germanB: 'Guten Morgen! Ja, sehr gut danke.',
      darijaContext: 'Dkhelte l l-khedma f s-sba7, awwel kelma katgoul l les collègues.'
    },
    memoryHook: 'Morgen = Sba7 (Guten Morgen = Sba7 l-khir)'
  },
  '4_6': {
    explanation: '"Tschüss!" = Bslama! Hiya ashhar kelma kaygoulouha l-Alman fach kaymchiw. Kat-st3mel m3a kolchi ila f l-idarat l-kbar bzaf.',
    phoneticSecret: 'Tsch katneq [TCH] mjhhda fhal f "Tchoutchou". Moraha Ü mejmou3a w ss madi: [Tshooss]!',
    moroccanTrap: 'Matnsash Ü! Ila golti "Tchiss" wla "Tchouss" katban mweffeq.',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Ich muss jetzt zur Bahn. Tschüss!',
      speakerB: 'Bilal:',
      germanB: 'Tschüss! Machs gut und bis bald!',
      darijaContext: 'Sahbek ghadi l l-gare, katweddo b Tschüss 7ara.'
    },
    memoryHook: 'Tsch = Tch + üss = Tschüss!'
  },
  '4_7': {
    explanation: '"Auf Wiedersehen" = Ila l-liqa2. Hiya l-forma r-rasmiya (Formell). Katgoulha f l-banka, l-idara, l-moustashfa.',
    phoneticSecret: 'Wiedersehen fiha W (katneq V) w S (katneq Z): [Owf Vee-der-zay-en].',
    moroccanTrap: 'Katgoul Tschüss l l-professeur wla l-qadi f l-ma7kama! F had l-amakin dima Auf Wiedersehen.',
    realDialogue: {
      speakerA: 'Beamter:',
      germanA: 'Vielen Dank für Ihre Dokumente. Auf Wiedersehen!',
      speakerB: 'Bilal:',
      germanB: 'Vielen Dank und auf Wiedersehen!',
      darijaContext: 'Saliti wraqek f l-baladiya (Bürgeramt), katwede3 l-mowaddaf b adab kbir.'
    },
    memoryHook: 'Wieder = 3awtani, Sehen = Nchoufek -> Auf Wiedersehen!'
  },

  // --- Song 5: Zauberwörter ---
  '5_1': {
    explanation: '"Bitte" hiya l-joukhar d l-Almaniya! 3ndha 4 d l-isti3malat: 1) 3afak (Please), 2) Tfeddel (Here you go), 3) Bla jmil (You\'re welcome), 4) Pardon? (Fach ma katsme3ch mzyan).',
    phoneticSecret: 'I qssira w double T madi: [Bit-te]. Matmeddhach!',
    moroccanTrap: 'L-Mgharba kaydennu bli Bitte kat3ni ghir "3afak". Dima red l-bal l l-siyaq fin tgalat!',
    realDialogue: {
      speakerA: 'Kunde:',
      germanA: 'Einen Kaffee, bitte!',
      speakerB: 'Kellner:',
      germanB: 'Hier ist Ihr Kaffee. Bitte sehr!',
      darijaContext: 'Tlebte qahwa b "bitte" w l-garçon 3taha lik b "bitte".'
    },
    memoryHook: 'Bitte = S-Sarout d kolchi f l-Almaniya!'
  },
  '5_2': {
    explanation: '"Danke" = Shukran. Kelma mohimma bzaf f thaqafa d l-Alman. Dima 9olha l ay wahed 3awnk wla 3tak chi haja.',
    phoneticSecret: 'A mftou7a, NK katji fhal l-anglaisiya (thank), w E f l-kher khfifa: [Dang-ke].',
    moroccanTrap: 'Matgolch "Danki" b I f l-kher! E f l-Almaniya khfifa: Danke.',
    realDialogue: {
      speakerA: 'Fremder:',
      germanA: 'Entschuldigung, hier ist deine Tasche!',
      speakerB: 'Bilal:',
      germanB: 'Vielen Dank! Das ist sehr nett.',
      darijaContext: 'Wahed nbehek l s-sak dyalek li nsitih, katchkro mn qelbek.'
    },
    memoryHook: 'Danke = Shukran b kol tawado3.'
  },
  '5_5': {
    explanation: '"Entschuldigung" = Sme7 lia / Pardon. Kelma twila walakin qssamha: Ent - schul - di - gung! Kat-st3mel bash t-tleb sme7 wla fach tbghi dwez f z-z7am.',
    phoneticSecret: 'Sch katneq [CH], U katneq [OO], moraha d-i-gung: [Ent-shool-di-goong].',
    moroccanTrap: 'Katkhefeff mnha wla mathfedhash 7it twila! Hfedha b les syllabes: Ent + Schul + Di + Gung!',
    realDialogue: {
      speakerA: 'Bilal:',
      germanA: 'Entschuldigung, fährt dieser Bus zum Zentrum?',
      speakerB: 'Passant:',
      germanB: 'Ja, dieser Bus fährt direkt zum Bahnhof.',
      darijaContext: 'Swelti wahed f l-arrêt d l-bus b adab 3la l-khatt.'
    },
    memoryHook: 'Ent + Schul + Di + Gung = 4 d t-tbeqat sahlin!'
  },

  // --- Song 9: Sein ---
  '9_1': {
    explanation: '"ich bin" = Ana akoun (I am / Je suis). F l-Almaniya maymkench tgol "Ana f d-dar" bla verb! Khassk tgol "Ich BIN zu Hause".',
    phoneticSecret: 'Ich fiha l-ich-Laut (soft ch fhal f l-fiss d l-qett), machi Kha! Bin katneq [Bin] 3adiya: [Ikh bin].',
    moroccanTrap: 'Moroccan trap: ntiq "Ich" b Kha 7arsha fhal "Ikhhh". L-Alman kayd7ko 3liha! Khelliha hssis na3im.',
    realDialogue: {
      speakerA: 'Chef:',
      germanA: 'Guten Tag, wer bist du?',
      speakerB: 'Bilal:',
      germanB: 'Ich bin Bilal und ich lerne Deutsch.',
      darijaContext: 'Kat-3erref b rassek f l-entretien: "Ich bin Bilal".'
    },
    memoryHook: 'Ich bin = Ana akoun (Sasi d l-joumla).'
  },

  // --- Song 11: Der (Männlich) ---
  '11_1': {
    explanation: '"der Kaffee" = L-qahwa. F l-Almaniya l-qahwa MOUDHAQAR (der)! Hada awwel sdem l l-Mgharba 7it f Darija w l-Fransawiya l-qahwa mouannat!',
    phoneticSecret: 'Der katneq [Dehr] m3a r mskota. Kaffee l-accent 3la l-kher: [Kaf-fay].',
    moroccanTrap: 'Tgoul "die Kaffee" 7it f balek l-qahwa bent! La, l-qahwa f l-Almaniya rajel: DER Kaffee!',
    realDialogue: {
      speakerA: 'Kellner:',
      germanA: 'Was möchten Sie trinken?',
      speakerB: 'Bilal:',
      germanB: 'Der Kaffee bitte!',
      darijaContext: 'Kat-tleb qahwa f café w kat-ftekher bli 3aref l-article dyalha.'
    },
    memoryHook: '🔵 DER Kaffee: Dima blue, dima moudakkar!'
  },

  // --- Song 12: Die (Weiblich) ---
  '12_4': {
    explanation: '"die Sonne" = Sh-shems. F l-Almaniya sh-shems MOUANNAT (die)! F l-3arabiya sh-shems mouannat majazan, walakin f l-Almaniya 3ndha l-article DIE!',
    phoneticSecret: 'S f bedya moraha voyelle katneq [Z]: [dee Zon-ne]. Double N katbeiyen l-haraka qssira.',
    moroccanTrap: 'Ntiqha b S naqssa "Sonne". Dima Z f bedyet l-kelmat l-Almaniya li fihom S moraha voyelle!',
    realDialogue: {
      speakerA: 'Freund:',
      germanA: 'Das Wetter ist toll heute!',
      speakerB: 'Bilal:',
      germanB: 'Ja, die Sonne scheint!',
      darijaContext: 'Katchouf l-jaw zwine w ch-chems tal3a, katgoul die Sonne scheint.'
    },
    memoryHook: '🌸 DIE Sonne: Ch-chems l-waradiya l-mouannata!'
  },

  // --- Song 13: Das (Neutral) ---
  '13_1': {
    explanation: '"das Wasser" = L-ma. L-Almaniya fiha 3 d l-ajnas: Männlich (der), Weiblich (die), w NEUTRAL (das). L-ma NEUTRAL!',
    phoneticSecret: 'W katneq [V] nichan! Wasser = [Das Vas-ser]. R f l-kher kat-tsret fhal A khfifa: [Vassa].',
    moroccanTrap: 'L-ghalat l-khatir: ntiq W fhal l-anglaisiya "Watter"! F l-Almaniya W = V dima!',
    realDialogue: {
      speakerA: 'Kellner:',
      germanA: 'Möchten Sie etwas trinken?',
      speakerB: 'Bilal:',
      germanB: 'Ein Wasser bitte!',
      darijaContext: 'Kattleb kass d l-ma f restaurant b ntiq Almaniy naqi.'
    },
    memoryHook: '🟢 DAS Wasser: L-Ma akhdar mou7ayad!'
  }
};

/**
 * Derives grammar badge for an item
 */
function getGrammarBadge(german: string): { label: string; color: string; bg: string; border: string } {
  const lower = german.toLowerCase().trim();
  if (lower.startsWith('der ')) {
    return {
      label: '🔵 NOUN: MÄNNLICH (DER)',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.35)'
    };
  }
  if (lower.startsWith('die ')) {
    return {
      label: '🌸 NOUN: WEIBLICH (DIE)',
      color: '#f472b6',
      bg: 'rgba(244, 114, 182, 0.12)',
      border: 'rgba(244, 114, 182, 0.35)'
    };
  }
  if (lower.startsWith('das ')) {
    return {
      label: '🟢 NOUN: NEUTRAL (DAS)',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.35)'
    };
  }
  if (
    lower.endsWith('en') &&
    !lower.includes(' ') &&
    !lower.startsWith('guten')
  ) {
    return {
      label: '⚡ VERB: AKTION',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.35)'
    };
  }
  return {
    label: '💬 SATZ & REDEWENDUNG',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.35)'
  };
}

/**
 * Generates an intelligent Moroccan professor guidance profile for any curriculum item
 */
export function getMasterProfessorGuidance(item: SongLyricItem): MasterGuidanceData {
  const custom = CURATED_PEDAGOGY[item.id];
  const grammar = getGrammarBadge(item.german);

  // If curated data exists, merge with defaults
  if (custom) {
    return {
      explanation: custom.explanation || `Had l-kelma "${item.german}" kat3ni "${item.darijaCorrect}" w kat-st3mel f l-7ayat l-yawmiya b khetra.`,
      phoneticSecret: custom.phoneticSecret || `Ntiqha b deqqa: [${item.phoneticGuide}]. Khrej l-7ourouf bla ma tzerreb.`,
      moroccanTrap: custom.moroccanTrap || `Red l-bal mn t-tkhlat bin ntiq d l-fransawiya w l-Almaniya! Hfedha b [${item.phoneticGuide}].`,
      realDialogue: custom.realDialogue || {
        speakerA: 'Sprecher A:',
        germanA: `${item.german}!`,
        speakerB: 'Bilal:',
        germanB: `Ja, genau: ${item.german}!`,
        darijaContext: `Isti3mal mubashir f l-waqi3: ${item.darijaCorrect}.`
      },
      grammarBadge: grammar,
      memoryHook: custom.memoryHook || `3qel 3liha: "${item.german}" = "${item.darijaCorrect}"!`
    };
  }

  // Dynamic pedagogical derivation for items without hardcoded entries
  const german = item.german;
  const darija = item.darijaCorrect;
  const phonetic = item.phoneticGuide;

  let dynamicSecret = `Nteqha deqqa b deqqa fhal [${phonetic}]. `;
  let dynamicTrap = `L-Ghalat li kaydiroh bzaf d n-nass howa t-tzerrib f n-ntiq. `;
  let memoryMnemonic = `Rbet had l-kelma "${german}" b l-ma3na dyalha "${darija}".`;

  if (german.includes('ch')) {
    dynamicSecret += 'Fiha "ch": Ila kant moraha a/o/u katneq Kha (خ), w ila moraha e/i katneq ich-Laut khfifa fhal l-fiss.';
    dynamicTrap += 'Matkherrejch dima Kha 7arsha! Dima shouf l-voyelle li qbel "ch".';
  } else if (german.includes('w') || german.includes('W')) {
    dynamicSecret += 'Fiha "W": F l-Almaniya W katneq dima [V] fhal f voiture wla valise.';
    dynamicTrap += 'Trap d l-Anglais: Makatneqch "W" fhal water, dima [V]!';
  } else if (german.includes('v') || german.includes('V')) {
    dynamicSecret += 'Fiha "V": Aghlab l-kelmat katneq fihom [F] fhal f Vater wla Vier.';
    dynamicTrap += 'Trap: Matnteqhash [V], Almaniy kaysme3ha [F]!';
  } else if (german.includes('z') || german.includes('Z')) {
    dynamicSecret += 'Fiha "Z": Z f l-Almaniya dima howa [TS] mjehhed fhal snan.';
    dynamicTrap += 'Trap: Matnteqhash Z dyal zit! Dima [TS]!';
  } else if (german.includes('ä') || german.includes('ö') || german.includes('ü')) {
    dynamicSecret += 'Fiha Umlaut (..): Dawwer chnayfek w khrej s-sout mn wast l-7elq b thabata.';
    dynamicTrap += 'Trap: Matbdelch l-Umlaut b voyelle 3adiya 7it l-ma3na kaytbeddel kaml!';
  }

  return {
    explanation: `Had l-3ibara "${german}" kat3ni "${darija}". Hadhi mn r-rawafed l-assasiya f l-Almaniya li khassk thfedha bla ma tfekker. F l-Almaniya, deqqat l-kelma hiya kolchi!`,
    phoneticSecret: dynamicSecret,
    moroccanTrap: dynamicTrap,
    realDialogue: {
      speakerA: 'Kollege:',
      germanA: `${german}, oder?`,
      speakerB: 'Bilal:',
      germanB: `Ja, ${german}!`,
      darijaContext: `Hiwar yawmi kaybiyn kifach "${german}" katkhdem f l-waqi3: "${darija}".`
    },
    grammarBadge: grammar,
    memoryHook: memoryMnemonic
  };
}
