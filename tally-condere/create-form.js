import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const API = 'https://api.tally.so';
const KEY = process.env.TALLY_API_KEY;
if (!KEY) { console.error('TALLY_API_KEY manquante'); process.exit(1); }

const u = () => randomUUID();

function pageBreak() {
  return [{
    uuid: u(),
    type: 'PAGE_BREAK',
    groupUuid: u(),
    groupType: 'PAGE_BREAK',
    payload: {}
  }];
}

function heading(text) {
  return [{
    uuid: u(),
    type: 'HEADING_2',
    groupUuid: u(),
    groupType: 'HEADING_2',
    payload: { safeHTMLSchema: [[text, [['tag', 'span']]]] }
  }];
}

function text(content) {
  return [{
    uuid: u(),
    type: 'TEXT',
    groupUuid: u(),
    groupType: 'TEXT',
    payload: { safeHTMLSchema: [[content, [['tag', 'span']]]] }
  }];
}

function multipleChoice({ question, options, required = true }) {
  const groupUuid = u();
  const blocks = [{
    uuid: u(),
    type: 'TITLE',
    groupUuid,
    groupType: 'QUESTION',
    payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
  }];
  options.forEach((label, i) => {
    blocks.push({
      uuid: u(),
      type: 'MULTIPLE_CHOICE_OPTION',
      groupUuid,
      groupType: 'MULTIPLE_CHOICE',
      payload: {
        isRequired: required,
        index: i,
        isFirst: i === 0,
        isLast: i === options.length - 1,
        text: label
      }
    });
  });
  return blocks;
}

function checkboxes({ question, options, required = false }) {
  const groupUuid = u();
  const blocks = [{
    uuid: u(),
    type: 'TITLE',
    groupUuid,
    groupType: 'QUESTION',
    payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
  }];
  options.forEach((label, i) => {
    blocks.push({
      uuid: u(),
      type: 'CHECKBOX',
      groupUuid,
      groupType: 'CHECKBOXES',
      payload: {
        isRequired: required,
        index: i,
        isFirst: i === 0,
        isLast: i === options.length - 1,
        text: label
      }
    });
  });
  return blocks;
}

function textarea({ question, placeholder, required = false }) {
  const groupUuid = u();
  return [
    {
      uuid: u(),
      type: 'TITLE',
      groupUuid,
      groupType: 'QUESTION',
      payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
    },
    {
      uuid: u(),
      type: 'TEXTAREA',
      groupUuid,
      groupType: 'TEXTAREA',
      payload: { isRequired: required, placeholder }
    }
  ];
}

function inputEmail({ question, placeholder, required = true }) {
  const groupUuid = u();
  return [
    {
      uuid: u(),
      type: 'TITLE',
      groupUuid,
      groupType: 'QUESTION',
      payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
    },
    {
      uuid: u(),
      type: 'INPUT_EMAIL',
      groupUuid,
      groupType: 'INPUT_EMAIL',
      payload: { isRequired: required, placeholder }
    }
  ];
}

function inputText({ question, placeholder, required = false }) {
  const groupUuid = u();
  return [
    {
      uuid: u(),
      type: 'TITLE',
      groupUuid,
      groupType: 'QUESTION',
      payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
    },
    {
      uuid: u(),
      type: 'INPUT_TEXT',
      groupUuid,
      groupType: 'INPUT_TEXT',
      payload: { isRequired: required, placeholder }
    }
  ];
}

// ─────────────────────────────────────────────
// STRUCTURE : 5 pages + remerciement
// ─────────────────────────────────────────────
//
// Page 1 — Votre profil         (Q1 secteur, Q2 taille)
// Page 2 — Vos défis            (Q3 checkboxes tâches)
// Page 3 — La question clé      (Q4 textarea seule)
// Page 4 — Votre rapport à l'IA (Q5 maturité, Q6 objectif)
// Page 5 — Vos coordonnées      (Q7 email, Q8 entreprise)
// ─────────────────────────────────────────────

const blocks = [

  // ── FORM_TITLE ──────────────────────────────
  {
    uuid: u(),
    type: 'FORM_TITLE',
    groupUuid: u(),
    groupType: 'TEXT',
    payload: {
      title: 'Diagnostic Condere',
      html: 'Diagnostic Condere',
      button: { label: 'Envoyer mes réponses' }
    }
  },

  // ── PAGE 1 — Votre profil ───────────────────
  ...text('Un diagnostic confidentiel pour identifier précisément où l\'IA peut vous redonner du temps — pas des généralités, des pistes concrètes pour votre activité.'),

  ...multipleChoice({
    question: 'Dans quel secteur opérez-vous ?',
    options: [
      'Services professionnels (conseil, juridique, RH)',
      'Commerce / Distribution',
      'Santé / Médical',
      'Construction / Immobilier',
      'Industrie / Manufacture',
      'Autre'
    ],
    required: true
  }),

  ...multipleChoice({
    question: 'Combien de personnes dans votre équipe ?',
    options: [
      '1 (indépendant)',
      '2–9',
      '10–49',
      '50–249',
      '250+'
    ],
    required: true
  }),

  // ── PAGE 2 — Vos défis ──────────────────────
  ...pageBreak(),
  ...heading('Vos défis quotidiens'),

  ...checkboxes({
    question: 'Quelles tâches vous prennent le plus de temps ? (cochez tout ce qui s\'applique)',
    options: [
      'Traitement de factures / comptabilité',
      'Rédaction emails, rapports, contenus',
      'Recherche et synthèse d\'informations',
      'Saisie et mise à jour de données',
      'Service client / réponses répétitives',
      'Autre'
    ],
    required: false
  }),

  // ── PAGE 3 — La question clé ────────────────
  ...pageBreak(),

  ...textarea({
    question: 'Si vous deviez supprimer UNE seule corvée de vos journées professionnelles, laquelle vous soulagerait le plus ? Décrivez-la avec vos mots, comme vous le diriez à un collègue autour d\'un café — pas besoin d\'être précis ou de chercher la \'bonne\' réponse, on cherche surtout à comprendre ce qui vous gratte vraiment.',
    placeholder: 'Ex. Je passe trois heures par semaine à courir après les clients qui ne paient pas, et chaque relance me coûte autant en énergie qu\'en temps. J\'aimerais juste que ça se règle tout seul.',
    required: false
  }),

  // ── PAGE 4 — Votre rapport à l'IA ──────────
  ...pageBreak(),
  ...heading('Votre rapport à l\'IA'),

  ...multipleChoice({
    question: 'Où en êtes-vous avec l\'IA aujourd\'hui ?',
    options: [
      'Pas encore utilisée',
      'J\'utilise ChatGPT / Copilot ponctuellement',
      'Quelques outils IA, sans cohérence',
      'L\'IA est intégrée dans plusieurs processus'
    ],
    required: true
  }),

  ...multipleChoice({
    question: 'Quel serait votre objectif prioritaire ?',
    options: [
      'Gagner du temps sur les tâches répétitives',
      'Réduire les erreurs, améliorer la qualité',
      'Libérer l\'équipe pour des tâches à plus haute valeur',
      'Améliorer la satisfaction client',
      'Réduire les coûts'
    ],
    required: true
  }),

  // ── PAGE 5 — Vos coordonnées ────────────────
  ...pageBreak(),
  ...heading('Vos coordonnées'),
  ...text('Laissez votre email — vous recevrez sous 48h un mini-diagnostic personnalisé avec 2–3 pistes IA concrètes pour votre activité.'),

  ...inputEmail({
    question: 'Votre email professionnel',
    placeholder: 'vous@entreprise.ch',
    required: true
  }),

  ...inputText({
    question: 'Nom de l\'entreprise (optionnel)',
    placeholder: 'Ex. Acme SA',
    required: false
  }),

  // ── REMERCIEMENT ────────────────────────────
  {
    uuid: u(),
    type: 'THANK_YOU_PAGE',
    groupUuid: u(),
    groupType: 'THANK_YOU_PAGE',
    payload: {
      safeHTMLSchema: [['Merci. Vos réponses sont précieuses. Vous recevrez sous 48h un diagnostic personnalisé avec des pistes concrètes pour votre activité.', [['tag', 'span']]]]
    }
  }
];

// ─────────────────────────────────────────────

const idFile = '.tally-form-id';
const existingId = fs.existsSync(idFile) ? fs.readFileSync(idFile, 'utf8').trim() : null;

const url = existingId ? `${API}/forms/${existingId}` : `${API}/forms`;
const method = existingId ? 'PATCH' : 'POST';

console.log(`${method === 'POST' ? 'Création' : 'Mise à jour'} du formulaire...`);

const res = await fetch(url, {
  method,
  headers: {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Diagnostic Condere',
    status: 'PUBLISHED',
    blocks,
    settings: { language: 'fr', showProgressBar: true }
  })
});

if (!res.ok) {
  const err = await res.text();
  console.error(`Erreur ${res.status}:`, err);
  process.exit(1);
}

const data = await res.json();
const formId = data.id || existingId;

if (!existingId && data.id) {
  fs.writeFileSync(idFile, data.id);
  console.log(`ID sauvegardé dans ${idFile}`);
}

console.log(`\n✅ Formulaire ${method === 'POST' ? 'créé' : 'mis à jour'}`);
console.log(`URL publique  : https://tally.so/r/${formId}`);
console.log(`URL édition   : https://tally.so/forms/${formId}/edit`);
console.log(`Embed         : https://tally.so/embed/${formId}?alignLeft=1&hideTitle=0&transparentBackground=1&dynamicHeight=1`);
