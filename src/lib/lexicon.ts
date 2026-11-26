// src/lib/lexicon.ts

export interface LexiconEntry {
  original: string;
  transliteration: string;
  language: 'Griego' | 'Hebreo';
  strong: string;
  meaning: string;
  theologicalContext: string;
}

export const BIBLE_LEXICON: Record<string, LexiconEntry> = {
  agape: {
    original: 'ἀγάπη',
    transliteration: 'Agápē',
    language: 'Griego',
    strong: 'G26',
    meaning: 'Amor incondicional, benevolente, sacrificial y de pacto.',
    theologicalContext: 'Es la clase de amor que Dios manifiesta en la cruz (Juan 3:16, 1 Juan 4:8).'
  },
  shalom: {
    original: 'שָׁלוֹם',
    transliteration: 'Shālôm',
    language: 'Hebreo',
    strong: 'H7965',
    meaning: 'Paz integral, plenitud, bienestar físico y espiritual, armonía.',
    theologicalContext: 'No es solo ausencia de conflicto, sino la presencia de la totalidad y bendición de Dios.'
  },
  ruaj: {
    original: 'רוּחַ',
    transliteration: 'Rûaħ',
    language: 'Hebreo',
    strong: 'H7307',
    meaning: 'Viento, soplo, aliento de vida, el Espíritu de Dios.',
    theologicalContext: 'El Espíritu que da vida en la creación (Génesis 1:2) y renueva el corazón humano.'
  },
  gracia: {
    original: 'χάρις',
    transliteration: 'Cháris',
    language: 'Griego',
    strong: 'G5485',
    meaning: 'Favor inmerecido, benevolencia divina, don gratuito de salvación.',
    theologicalContext: 'Fundamento de la justificación sin obras humanas (Efesios 2:8-9).'
  },
  charis: {
    original: 'χάρις',
    transliteration: 'Cháris',
    language: 'Griego',
    strong: 'G5485',
    meaning: 'Favor inmerecido, benevolencia divina y poder habilitador de Dios.',
    theologicalContext: 'Fundamento de la vida cristiana y rescate por Cristo.'
  },
  logos: {
    original: 'λόγος',
    transliteration: 'Lógos',
    language: 'Griego',
    strong: 'G3056',
    meaning: 'Palabra, Verbo divino, razón divina encarnada.',
    theologicalContext: 'Jesús como la revelación suprema de Dios (Juan 1:1, 1:14).'
  },
  koinonia: {
    original: 'κοινωνία',
    transliteration: 'Koinōnía',
    language: 'Griego',
    strong: 'G2842',
    meaning: 'Comunión íntima, compañerismo profundo, participación y solidaridad.',
    theologicalContext: 'El vínculo fraternal de la iglesia primitiva guiada por el Espíritu (Hechos 2:42).'
  },
  hesed: {
    original: 'חֶסֶד',
    transliteration: 'Ḥesed',
    language: 'Hebreo',
    strong: 'H2617',
    meaning: 'Amor leal, misericordia inagotable de pacto, fidelidad constante.',
    theologicalContext: 'El compromiso eterno de Dios de no abandonar a su pueblo.'
  },
  metanoia: {
    original: 'μετάνοια',
    transliteration: 'Metánoia',
    language: 'Griego',
    strong: 'G3341',
    meaning: 'Arrepentimiento genuino; transformación radical de mentalidad.',
    theologicalContext: 'Giro de 180° alejándose del pecado hacia la voluntad de Dios (Marcos 1:15).'
  },
  shema: {
    original: 'שְׁמַע',
    transliteration: 'Šəmaʿ',
    language: 'Hebreo',
    strong: 'H8085',
    meaning: 'Escuchar obedeciendo; guardar la palabra en el corazón y actuar.',
    theologicalContext: 'La confesión central del pueblo de Dios (Deuteronomio 6:4).'
  },
  justificacion: {
    original: 'δικαίωσις',
    transliteration: 'Dikaíōsis',
    language: 'Griego',
    strong: 'G1347',
    meaning: 'Declaración judicial divina de justicia conferida al creyente.',
    theologicalContext: 'El acto donde Dios nos declara justos por los méritos de Cristo (Romanos 5:1).'
  }
};

// Expresión regular que detecta libros de la Biblia en español
const BIBLE_BOOKS_REGEX = /^(?:[1-3]\s*)?(?:Génesis|Genesis|Éxodo|Exodo|Levítico|Levitico|Números|Numeros|Deuteronomio|Josué|Josue|Jueces|Rut|Samuel|Reyes|Crónicas|Cronicas|Esdras|Nehemías|Nehemias|Ester|Job|Salmos?|Proverbios|Eclesiastés|Eclesiastes|Cantares|Isaías|Isaias|Jeremías|Jeremias|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Amos|Abdías|Abdias|Jonás|Jonas|Miqueas|Nahúm|Nahum|Habacuc|Sofonías|Sofonias|Hageo|Zacarías|Zacarias|Malaquías|Malaquias|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|Corintios|Gálatas|Galatas|Efesios|Filipenses|Colosenses|Tesalonicenses|Timoteo|Tito|Filemón|Filemon|Hebreos|Santiago|Pedro|Judas|Apocalipsis|Gn|Ex|Lv|Nm|Dt|Jos|Jue|Rt|1\s*S|2\s*S|1\s*R|2\s*R|1\s*Cr|2\s*Cr|Esd|Neh|Est|Sal|Pr|Ec|Cnt|Is|Jer|Lm|Ez|Dn|Os|Jl|Am|Abd|Jon|Miq|Nah|Hab|Sof|Hag|Zac|Mal|Mt|Mc|Lc|Jn|Hch|Ro|1\s*Co|2\s*Co|Gál|Gal|Ef|Fil|Col|1\s*Ts|2\s*Ts|1\s*Ti|2\s*Ti|Tit|Flm|Heb|Stg|1\s*P|2\s*P|1\s*Jn|2\s*Jn|3\s*Jn|Jud|Ap)\.?\s*\d+(?:[\s:.,\-–]\d+)?/i;

export function isBiblePassage(text: string): boolean {
  return BIBLE_BOOKS_REGEX.test(text.trim());
}

export function findLexiconMatch(text: string): LexiconEntry | null {
  const clean = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return BIBLE_LEXICON[clean] || null;
}
