/**
 * Rule-based suffix transformations used as a second pass after lexicon lookup.
 * Each rule expresses a UK↔US spelling mapping. We keep the list small and
 * high-precision so we never "correct" words that are the same in both.
 *
 * Order matters: more specific rules first.
 */

export interface SuffixRule {
  id: string;
  /** Human explanation for UI surface. */
  clue: string;
  /** Regex matching the UK form. Must include a capture group for the stem. */
  ukPattern: RegExp;
  /** Replacement producing the US form. Uses $1 for the captured stem. */
  ukToUs: string;
  /** Regex matching the US form. */
  usPattern: RegExp;
  /** Replacement producing the UK form. */
  usToUk: string;
  /** Exceptions: words that match the pattern but are NOT dialect contrasts. */
  exceptions?: Set<string>;
}

/* eslint-disable no-useless-escape */
export const SUFFIX_RULES: SuffixRule[] = [
  {
    id: "ise-ize",
    clue: "Verbs ending in -ise (UK) vs -ize (US)",
    ukPattern: /([a-z]{3,})ise(s|d|r|rs)?\b/i,
    ukToUs: "$1ize$2",
    usPattern: /([a-z]{3,})ize(s|d|r|rs)?\b/i,
    usToUk: "$1ise$2",
    // Words ending in -ise that are NOT contrasts (same in both variants).
    exceptions: new Set([
      "advertise","advise","arise","chastise","circumcise","comprise","compromise",
      "demise","despise","devise","disguise","enterprise","excise","exercise",
      "franchise","improvise","merchandise","precise","prise","promise","revise",
      "rise","supervise","surmise","surprise","televise","wise","anise","paradise",
      "concise","incise",
    ]),
  },
  {
    id: "isation-ization",
    clue: "Nouns ending in -isation (UK) vs -ization (US)",
    ukPattern: /([a-z]{3,})isation(s)?\b/i,
    ukToUs: "$1ization$2",
    usPattern: /([a-z]{3,})ization(s)?\b/i,
    usToUk: "$1isation$2",
  },
  {
    id: "yse-yze",
    clue: "-yse (UK) vs -yze (US), e.g. analyse/analyze",
    ukPattern: /\b(anal|catal|paral|breathal|dial)yse(s|d|r)?\b/i,
    ukToUs: "$1yze$2",
    usPattern: /\b(anal|catal|paral|breathal|dial)yze(s|d|r)?\b/i,
    usToUk: "$1yse$2",
  },
  {
    id: "our-or",
    clue: "-our (UK) vs -or (US)",
    ukPattern: /\b(col|fav|flav|hum|hon|lab|neighb|rum|vap|arm|behavi|glam|sav|val|harb|parl|rig)our(s|ed|ing|ite|ites|able|ful|less)?\b/i,
    ukToUs: "$1or$2",
    usPattern: /\b(col|fav|flav|hum|hon|lab|neighb|rum|vap|arm|behavi|glam|sav|val|harb|parl|rig)or(s|ed|ing|ite|ites|able|ful|less)?\b/i,
    usToUk: "$1our$2",
  },
  {
    id: "re-er",
    clue: "-re (UK) vs -er (US) in theatre/centre/metre",
    ukPattern: /\b(cent|fib|lit|met|theat|lust|sombre|spectre|manoeuvre)re(s|d)?\b/i,
    ukToUs: "$1er$2",
    usPattern: /\b(cent|fib|lit|met|theat|lust|sombre|spectre|manoeuvre)er(s|ed)?\b/i,
    usToUk: "$1re$2",
  },
  {
    id: "ogue-og",
    clue: "-logue (UK) vs -log (US) in catalogue/dialog",
    ukPattern: /\b(ana|cata|dia|mono|pro|epi)logue(s|d)?\b/i,
    ukToUs: "$1log$2",
    usPattern: /\b(ana|cata|dia|mono|pro|epi)log(s|ed)?\b/i,
    usToUk: "$1logue$2",
  },
  {
    id: "double-ll",
    clue: "Double-L in UK (travelled) vs single-L in US (traveled)",
    ukPattern: /\b(trave|cance|mode|leve|signa|labe|counse|unrave|fue|marve)lled\b/i,
    ukToUs: "$1led",
    usPattern: /\b(trave|cance|mode|leve|signa|labe|counse|unrave|fue|marve)led\b/i,
    usToUk: "$1lled",
  },
  {
    id: "double-ll-ing",
    clue: "Double-L in UK (-lling) vs single-L in US (-ling)",
    ukPattern: /\b(trave|cance|mode|leve|signa|labe|counse|unrave|fue|marve)lling\b/i,
    ukToUs: "$1ling",
    usPattern: /\b(trave|cance|mode|leve|signa|labe|counse|unrave|fue|marve)ling\b/i,
    usToUk: "$1lling",
  },
  {
    id: "ae-e",
    clue: "-ae-/-oe- (UK) vs -e- (US) in medical terms",
    ukPattern: /\b(an|paed|foet|encyclopa|leuka|diarrh|oedema)(ae|oe)(mia|dia|tus|tre|diatric|ma)?\b/i,
    ukToUs: "$1e$3",
    usPattern: /\b(an|ped|fet|encyclope|leuke|diarrh|edema)e?(mia|dia|tus|tre|diatric|ma)?\b/i,
    usToUk: "$1ae$2",
  },
];
/* eslint-enable no-useless-escape */

/**
 * Direct lexicon — word-for-word contrasts that aren't suffix rules.
 * The analyzer checks this first, then falls back to suffix rules.
 * Keys are lowercase; case is preserved when rewriting.
 */
export const LEXICON: ReadonlyArray<{
  uk: string;
  us: string;
  clue: string;
  category: "vocabulary" | "spelling" | "grammar" | "usage";
}> = [
  // Vocabulary — everyday
  { uk: "lift", us: "elevator", clue: "'Lift' is UK; 'elevator' is US", category: "vocabulary" },
  { uk: "flat", us: "apartment", clue: "'Flat' is UK; 'apartment' is US", category: "vocabulary" },
  { uk: "lorry", us: "truck", clue: "'Lorry' is UK; 'truck' is US", category: "vocabulary" },
  { uk: "biscuit", us: "cookie", clue: "'Biscuit' (UK) = 'cookie' (US)", category: "vocabulary" },
  { uk: "crisps", us: "chips", clue: "'Crisps' (UK) = 'chips' (US)", category: "vocabulary" },
  { uk: "chips", us: "fries", clue: "'Chips' (UK) = 'fries' (US)", category: "vocabulary" },
  { uk: "queue", us: "line", clue: "'Queue' (UK) = 'line' (US)", category: "vocabulary" },
  { uk: "petrol", us: "gasoline", clue: "'Petrol' (UK) = 'gasoline'/'gas' (US)", category: "vocabulary" },
  { uk: "boot", us: "trunk", clue: "Car storage: 'boot' (UK), 'trunk' (US)", category: "vocabulary" },
  { uk: "bonnet", us: "hood", clue: "Car front: 'bonnet' (UK), 'hood' (US)", category: "vocabulary" },
  { uk: "rubbish", us: "trash", clue: "'Rubbish' (UK) = 'trash'/'garbage' (US)", category: "vocabulary" },
  { uk: "nappy", us: "diaper", clue: "'Nappy' (UK) = 'diaper' (US)", category: "vocabulary" },
  { uk: "trousers", us: "pants", clue: "'Trousers' (UK), 'pants' (US). In UK, 'pants' = underwear", category: "vocabulary" },
  { uk: "jumper", us: "sweater", clue: "'Jumper' (UK) = 'sweater' (US)", category: "vocabulary" },
  { uk: "torch", us: "flashlight", clue: "'Torch' (UK) = 'flashlight' (US)", category: "vocabulary" },
  { uk: "holiday", us: "vacation", clue: "'Holiday' (UK) often = 'vacation' (US)", category: "vocabulary" },
  { uk: "autumn", us: "fall", clue: "'Autumn' (UK) = 'fall' (US)", category: "vocabulary" },
  { uk: "postcode", us: "zip code", clue: "'Postcode' (UK) = 'zip code' (US)", category: "vocabulary" },
  { uk: "mobile", us: "cell", clue: "'Mobile' (UK) = 'cell' (US) for phones", category: "vocabulary" },
  { uk: "pavement", us: "sidewalk", clue: "'Pavement' (UK) = 'sidewalk' (US)", category: "vocabulary" },
  { uk: "underground", us: "subway", clue: "'Underground'/'tube' (UK) = 'subway' (US)", category: "vocabulary" },
  { uk: "tube", us: "subway", clue: "'Tube' (London) = 'subway' (US)", category: "vocabulary" },
  { uk: "tap", us: "faucet", clue: "'Tap' (UK) = 'faucet' (US)", category: "vocabulary" },
  { uk: "cot", us: "crib", clue: "Baby bed: 'cot' (UK), 'crib' (US)", category: "vocabulary" },
  { uk: "dustbin", us: "trashcan", clue: "'Dustbin' (UK) = 'trashcan' (US)", category: "vocabulary" },
  { uk: "bin", us: "trashcan", clue: "'Bin' (UK) = 'trashcan' (US)", category: "vocabulary" },
  { uk: "motorway", us: "highway", clue: "'Motorway' (UK) = 'highway'/'freeway' (US)", category: "vocabulary" },
  { uk: "plaster", us: "band-aid", clue: "'Plaster' (UK) = 'Band-Aid' (US)", category: "vocabulary" },
  { uk: "aubergine", us: "eggplant", clue: "'Aubergine' (UK) = 'eggplant' (US)", category: "vocabulary" },
  { uk: "courgette", us: "zucchini", clue: "'Courgette' (UK) = 'zucchini' (US)", category: "vocabulary" },
  { uk: "coriander", us: "cilantro", clue: "'Coriander' (UK) = 'cilantro' (US)", category: "vocabulary" },
  { uk: "football", us: "soccer", clue: "'Football' (UK) = 'soccer' (US)", category: "vocabulary" },
  { uk: "mum", us: "mom", clue: "'Mum' (UK) = 'Mom' (US)", category: "vocabulary" },
  { uk: "mummy", us: "mommy", clue: "'Mummy' (UK) = 'Mommy' (US)", category: "vocabulary" },

  // Spelling (non-rule special cases)
  { uk: "grey", us: "gray", clue: "'Grey' (UK) vs 'gray' (US)", category: "spelling" },
  { uk: "tyre", us: "tire", clue: "Rubber on a wheel: 'tyre' (UK), 'tire' (US)", category: "spelling" },
  { uk: "kerb", us: "curb", clue: "Edge of a pavement: 'kerb' (UK), 'curb' (US)", category: "spelling" },
  { uk: "cheque", us: "check", clue: "Payment slip: 'cheque' (UK), 'check' (US)", category: "spelling" },
  { uk: "programme", us: "program", clue: "'Programme' (UK, non-computing) vs 'program' (US)", category: "spelling" },
  { uk: "whisky", us: "whiskey", clue: "'Whisky' (Scottish/UK) vs 'whiskey' (US/Irish)", category: "spelling" },
  { uk: "aluminium", us: "aluminum", clue: "'Aluminium' (UK) vs 'aluminum' (US)", category: "spelling" },
  { uk: "doughnut", us: "donut", clue: "'Doughnut' (UK) vs 'donut' (US)", category: "spelling" },
  { uk: "storey", us: "story", clue: "Floor of a building: 'storey' (UK), 'story' (US)", category: "spelling" },
  { uk: "plough", us: "plow", clue: "'Plough' (UK) vs 'plow' (US)", category: "spelling" },
  { uk: "draught", us: "draft", clue: "'Draught' (UK) vs 'draft' (US) for cold air or beer", category: "spelling" },
  { uk: "mum", us: "mom", clue: "'Mum' (UK), 'mom' (US)", category: "spelling" },

  // Grammar / usage
  { uk: "at the weekend", us: "on the weekend", clue: "UK uses 'at the weekend'; US uses 'on the weekend'", category: "grammar" },
  { uk: "have got", us: "have", clue: "'Have got' is more common in UK; US tends to use 'have'", category: "grammar" },
  { uk: "in hospital", us: "in the hospital", clue: "UK drops 'the' before hospital; US includes it", category: "grammar" },
  { uk: "at university", us: "in college", clue: "'At university' (UK) vs 'in college' (US)", category: "usage" },
];

export type LexiconEntry = (typeof LEXICON)[number];
