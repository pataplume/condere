# Brief Claude Code — Création formulaire Tally "Diagnostic Condere"

## Objectif

Créer via l'API Tally un formulaire de diagnostic IA pour PME suisses. Le formulaire doit servir de lead magnet sur le site (intégration via embed ou popup).

Ne PAS recréer un formulaire à chaque exécution du script. Le script doit :
1. Soit créer le formulaire la 1re fois et **sauvegarder l'ID retourné dans un fichier `.tally-form-id`**
2. Soit, si ce fichier existe, faire un PATCH sur ce form ID

---

## Pourquoi cette doc existe

Une tentative précédente a produit un formulaire visuellement cassé : les options étaient affichées comme des boutons empilés "A / B / C…" au lieu d'un vrai bloc question + choix radio. **C'est une erreur classique due à la structure de blocs Tally**, qui n'est pas évidente depuis la doc officielle. Ce brief documente précisément la structure correcte.

---

## API — essentiels

### Authentification

```bash
export TALLY_API_KEY="tly-WPYgeiLBPqYVKTAE2GntSY27CCvju7D0"
```

⚠️ **Cette clé a été partagée en clair. Elle DOIT être révoquée puis régénérée** dans https://tally.so/settings/api-keys avant la mise en production. Le script doit lire la clé depuis `process.env.TALLY_API_KEY` ou un fichier `.env` (ajouter `.env` au `.gitignore`).

### Endpoints utilisés

| Action | Méthode | URL |
|---|---|---|
| Créer un form | POST | `https://api.tally.so/forms` |
| Modifier un form | PATCH | `https://api.tally.so/forms/{id}` |
| Récupérer un form | GET | `https://api.tally.so/forms/{id}` |

Header obligatoire : `Authorization: Bearer ${TALLY_API_KEY}`.

### Statuts

- `BLANK` : brouillon
- `PUBLISHED` : publié et accessible publiquement → utiliser **`PUBLISHED`** pour ce projet.

### Règle critique pour le PATCH

Le PATCH **remplace l'intégralité des blocks** du formulaire. Il faut donc renvoyer **TOUS les blocks** (incluant le `FORM_TITLE`) à chaque update, pas uniquement les nouveaux.

---

## Structure des blocks Tally — LE point qui a tout cassé

Un formulaire Tally est une **liste plate de blocks**. Une "question" n'est PAS un bloc unique : c'est **plusieurs blocks regroupés par un même `groupUuid`**.

### Anatomie d'une question

Une question = au minimum :
- 1 block `TITLE` (l'énoncé de la question)
- 1 ou plusieurs blocks d'input (le ou les champs de réponse)

Tous ces blocks partagent le **même `groupUuid`**. Chaque block a son `uuid` unique.

### Erreur fréquente à NE PAS reproduire

❌ **NE PAS** créer un block de `type: "MULTIPLE_CHOICE"` ou `type: "CHECKBOXES"` avec un tableau d'options dans le payload. Ça n'existe pas dans l'API.

✅ Il faut créer **un block par option**, de type `MULTIPLE_CHOICE_OPTION` ou `CHECKBOX`, tous avec le même `groupUuid` que le `TITLE` de la question.

### Champs `index`, `isFirst`, `isLast` sur les options

Chaque option (MULTIPLE_CHOICE_OPTION ou CHECKBOX) doit avoir dans son `payload` :
- `index` : 0-based, position dans la liste
- `isFirst: true` uniquement sur la 1re option
- `isLast: true` uniquement sur la dernière option
- `text` : le libellé visible

Oublier ces flags ou se tromper sur leur valeur produit l'affichage cassé en boutons "A / B / C".

### Format `safeHTMLSchema` pour les TITLE

Pour les blocks `TITLE`, `HEADING_1/2/3`, `TEXT`, le champ texte se met dans `payload.safeHTMLSchema` :

```json
"payload": {
  "safeHTMLSchema": [["Mon texte de question", [["tag", "span"]]]]
}
```

Pour `FORM_TITLE`, utiliser `payload.title` et `payload.html`.

---

## Cheat sheet block par block

### FORM_TITLE (obligatoire, 1er block)

```json
{
  "uuid": "title-form",
  "type": "FORM_TITLE",
  "groupUuid": "group-form-title",
  "groupType": "TEXT",
  "payload": {
    "title": "Diagnostic Condere",
    "html": "Diagnostic Condere",
    "button": { "label": "Envoyer mes réponses" }
  }
}
```

### Section header (HEADING_2)

```json
{
  "uuid": "h-section1",
  "type": "HEADING_2",
  "groupUuid": "group-h-section1",
  "groupType": "TEXT",
  "payload": {
    "safeHTMLSchema": [["Votre activité", [["tag", "span"]]]]
  }
}
```

### Question MULTIPLE_CHOICE (1 seule réponse possible)

```json
{
  "uuid": "q1-title",
  "type": "TITLE",
  "groupUuid": "group-q1",
  "groupType": "QUESTION",
  "payload": {
    "safeHTMLSchema": [["Dans quel secteur opérez-vous ?", [["tag", "span"]]]]
  }
},
{
  "uuid": "q1-opt-a",
  "type": "MULTIPLE_CHOICE_OPTION",
  "groupUuid": "group-q1",
  "groupType": "MULTIPLE_CHOICE",
  "payload": { "isRequired": true, "index": 0, "isFirst": true, "isLast": false, "text": "Services professionnels (conseil, juridique, RH)" }
},
{
  "uuid": "q1-opt-b",
  "type": "MULTIPLE_CHOICE_OPTION",
  "groupUuid": "group-q1",
  "groupType": "MULTIPLE_CHOICE",
  "payload": { "isRequired": true, "index": 1, "isFirst": false, "isLast": false, "text": "Commerce / Distribution" }
},
{
  "uuid": "q1-opt-f",
  "type": "MULTIPLE_CHOICE_OPTION",
  "groupUuid": "group-q1",
  "groupType": "MULTIPLE_CHOICE",
  "payload": { "isRequired": true, "index": 5, "isFirst": false, "isLast": true, "text": "Autre" }
}
```

### Question CHECKBOXES (plusieurs réponses possibles)

```json
{
  "uuid": "q2-title",
  "type": "TITLE",
  "groupUuid": "group-q2",
  "groupType": "QUESTION",
  "payload": {
    "safeHTMLSchema": [["Quelles tâches vous prennent le plus de temps ?", [["tag", "span"]]]]
  }
},
{
  "uuid": "q2-cb1",
  "type": "CHECKBOX",
  "groupUuid": "group-q2",
  "groupType": "CHECKBOXES",
  "payload": { "index": 0, "isFirst": true, "isLast": false, "text": "Traitement de factures / comptabilité" }
},
{
  "uuid": "q2-cb-last",
  "type": "CHECKBOX",
  "groupUuid": "group-q2",
  "groupType": "CHECKBOXES",
  "payload": { "index": 5, "isFirst": false, "isLast": true, "text": "Autre" }
}
```

### Question texte court (INPUT_TEXT)

```json
{
  "uuid": "q-name-title",
  "type": "TITLE",
  "groupUuid": "group-q-name",
  "groupType": "QUESTION",
  "payload": {
    "safeHTMLSchema": [["Nom de l'entreprise (optionnel)", [["tag", "span"]]]]
  }
},
{
  "uuid": "q-name-input",
  "type": "INPUT_TEXT",
  "groupUuid": "group-q-name",
  "groupType": "QUESTION",
  "payload": { "isRequired": false, "placeholder": "Ex. Acme SA" }
}
```

### Question email (INPUT_EMAIL)

```json
{
  "uuid": "q-email-title",
  "type": "TITLE",
  "groupUuid": "group-q-email",
  "groupType": "QUESTION",
  "payload": {
    "safeHTMLSchema": [["Votre email professionnel", [["tag", "span"]]]]
  }
},
{
  "uuid": "q-email-input",
  "type": "INPUT_EMAIL",
  "groupUuid": "group-q-email",
  "groupType": "QUESTION",
  "payload": { "isRequired": true, "placeholder": "vous@entreprise.ch" }
}
```

### Question texte long (TEXTAREA) — pain points libres

```json
{
  "uuid": "q-pain-title",
  "type": "TITLE",
  "groupUuid": "group-q-pain",
  "groupType": "QUESTION",
  "payload": {
    "safeHTMLSchema": [["Si vous deviez supprimer UNE seule corvée de vos journées, ce serait laquelle ? Décrivez-la avec vos mots, sans filtre.", [["tag", "span"]]]]
  }
},
{
  "uuid": "q-pain-input",
  "type": "TEXTAREA",
  "groupUuid": "group-q-pain",
  "groupType": "QUESTION",
  "payload": { "isRequired": false, "placeholder": "Ex. Je passe 3h par semaine à relancer des clients qui ne paient pas leurs factures, et ça me bouffe le moral autant que le temps..." }
}
```

---

## Spécification du formulaire à créer

Titre : **Diagnostic Condere**

Sous-titre/description (via un block `TEXT` après le `FORM_TITLE`) : *"5 minutes pour identifier où l'IA peut vraiment vous faire gagner du temps. Réponses confidentielles, jamais revendues."*

### Ordre des questions

1. **Section** "🏢 Votre entreprise"
2. **Q1 — MULTIPLE_CHOICE (requis)** "Dans quel secteur opérez-vous ?"
   - A. Services professionnels (conseil, juridique, RH)
   - B. Commerce / Distribution
   - C. Santé / Médical
   - D. Construction / Immobilier
   - E. Industrie / Manufacture
   - F. Autre
3. **Q2 — MULTIPLE_CHOICE (requis)** "Combien de personnes dans votre équipe ?"
   - A. 1 (indépendant)
   - B. 2–9
   - C. 10–49
   - D. 50–249
   - E. 250+

4. **Section** "⏱️ Vos tâches chronophages"
5. **Q3 — CHECKBOXES (non requis)** "Quelles tâches vous prennent le plus de temps ? (cochez tout ce qui s'applique)"
   - Traitement de factures / comptabilité
   - Rédaction emails, rapports, contenus
   - Recherche et synthèse d'informations
   - Saisie et mise à jour de données
   - Service client / réponses répétitives
   - Autre

6. **Q4 — TEXTAREA (non requis, mais c'est LA question clé)** — formulation à préserver telle quelle, c'est elle qui doit faire parler le répondant :
   > "Si vous deviez supprimer UNE seule corvée de vos journées professionnelles, laquelle vous soulagerait le plus ? Décrivez-la avec vos mots, comme vous le diriez à un collègue autour d'un café — pas besoin d'être précis ou de chercher la 'bonne' réponse, on cherche surtout à comprendre ce qui vous gratte vraiment."

   Placeholder : *"Ex. Je passe trois heures par semaine à courir après les clients qui ne paient pas, et chaque relance me coûte autant en énergie qu'en temps. J'aimerais juste que ça se règle tout seul."*

7. **Section** "🤖 Votre rapport à l'IA"
8. **Q5 — MULTIPLE_CHOICE (requis)** "Où en êtes-vous avec l'IA aujourd'hui ?"
   - A. Pas encore utilisée
   - B. J'utilise ChatGPT / Copilot ponctuellement
   - C. Quelques outils IA, sans cohérence
   - D. L'IA est intégrée dans plusieurs processus

9. **Q6 — MULTIPLE_CHOICE (requis)** "Quel serait votre objectif prioritaire ?"
   - A. Gagner du temps sur les tâches répétitives
   - B. Réduire les erreurs, améliorer la qualité
   - C. Libérer l'équipe pour des tâches à plus haute valeur
   - D. Améliorer la satisfaction client
   - E. Réduire les coûts

10. **Section** "📬 Vos coordonnées"
11. **Q7 — INPUT_EMAIL (requis)** "Votre email professionnel" — placeholder `vous@entreprise.ch`
12. **Q8 — INPUT_TEXT (non requis)** "Nom de l'entreprise (optionnel)" — placeholder `Ex. Acme SA`

### Page de remerciement

Activée via les `settings` du form lors du POST :

```json
"settings": {
  "language": "fr",
  "redirectOnCompletion": null,
  "showProgressBar": true
}
```

Le message de fin est géré soit par un block `THANK_YOU_PAGE` ajouté à la fin, soit via les settings. Préférer le block `THANK_YOU_PAGE` :

```json
{
  "uuid": "thank-you",
  "type": "THANK_YOU_PAGE",
  "groupUuid": "group-thank-you",
  "groupType": "THANK_YOU_PAGE",
  "payload": {
    "safeHTMLSchema": [["Merci ! Vos réponses sont précieuses. Vous recevrez sous 48h un mini-diagnostic personnalisé par email avec 2-3 pistes IA concrètes pour votre activité.", [["tag", "span"]]]]
  }
}
```

---

## Implémentation suggérée (Node.js)

```bash
mkdir tally-condere && cd tally-condere
npm init -y
npm install node-fetch dotenv uuid
```

`.env` :
```
TALLY_API_KEY=tly-XXXXX  # à régénérer après révocation de l'ancienne
```

`.gitignore` :
```
node_modules
.env
.tally-form-id
```

`create-form.js` : 
- Lit `.env`
- Construit le tableau de blocks (utiliser `crypto.randomUUID()` pour générer des UUID v4 valides — Tally exige des UUID conformes)
- Si `.tally-form-id` existe → PATCH sur cet ID
- Sinon → POST, puis sauvegarde l'ID retourné dans `.tally-form-id`
- Affiche l'URL publique du form en sortie : `https://tally.so/r/{id}`

### Squelette du script

```js
import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const API = 'https://api.tally.so';
const KEY = process.env.TALLY_API_KEY;
if (!KEY) { console.error('TALLY_API_KEY manquante'); process.exit(1); }

// Helper pour générer UUID v4
const u = () => randomUUID();

// Helper pour créer une question MULTIPLE_CHOICE
function multipleChoice({ question, options, required = true }) {
  const groupUuid = u();
  const blocks = [{
    uuid: u(),
    type: 'TITLE',
    groupUuid,
    groupType: 'QUESTION',
    payload: { safeHTMLSchema: [[question, [['tag', 'span']]]] }
  }];
  options.forEach((text, i) => {
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
        text
      }
    });
  });
  return blocks;
}

// Idem pour checkboxes(), inputText(), inputEmail(), textarea(), heading()...

const blocks = [
  // FORM_TITLE
  { uuid: u(), type: 'FORM_TITLE', groupUuid: u(), groupType: 'TEXT',
    payload: { title: 'Diagnostic Condere', html: 'Diagnostic Condere', button: { label: 'Envoyer mes réponses' } } },
  // ... toutes les questions dans l'ordre spécifié
];

const idFile = '.tally-form-id';
const existingId = fs.existsSync(idFile) ? fs.readFileSync(idFile, 'utf8').trim() : null;

const url = existingId ? `${API}/forms/${existingId}` : `${API}/forms`;
const method = existingId ? 'PATCH' : 'POST';

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
  console.error('Erreur', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
if (!existingId) fs.writeFileSync(idFile, data.id);

console.log(`✅ Form ${method === 'POST' ? 'créé' : 'mis à jour'}`);
console.log(`URL publique : https://tally.so/r/${data.id}`);
console.log(`Embed : https://tally.so/embed/${data.id}?alignLeft=1&hideTitle=0&transparentBackground=1&dynamicHeight=1`);
```

---

## Validation après exécution

1. Ouvrir l'URL publique → vérifier que les questions s'affichent comme **vraies questions avec radio buttons / checkboxes**, pas comme une liste de boutons "A / B / C".
2. Ouvrir le form dans le dashboard Tally (https://tally.so/forms) → vérifier que la structure éditable correspond bien à des "Multiple choice" et "Checkboxes" et non à du texte brut.
3. Tester une soumission complète.
4. Si quelque chose cloche : faire un GET sur le form, comparer le JSON renvoyé à celui envoyé, identifier la divergence.

---

## Intégration sur le site

Une fois le form publié, deux options :

**Option embed inline** (recommandée pour un lead magnet sur landing page) :
```html
<iframe src="https://tally.so/embed/FORM_ID?alignLeft=1&hideTitle=0&transparentBackground=1&dynamicHeight=1"
        loading="lazy" width="100%" height="500" frameborder="0"
        title="Diagnostic Condere"></iframe>
<script async src="https://tally.so/widgets/embed.js"></script>
```

**Option popup** (CTA bouton) — voir https://tally.so/help/developer-resources pour la méthode `Tally.openPopup(formId)`.

---

## Connexion d'un webhook (optionnel mais utile)

Pour recevoir les soumissions en temps réel sur ton backend (alternative au polling) : configurer un webhook dans l'onglet Integrations du form après publication, ou via l'endpoint `POST /webhooks` de l'API. Tally signe les payloads en SHA256 — vérifier la signature côté serveur.

---

↪ Côté méthodo : la Q4 (textarea libre) ne devrait jamais être en option F d'une checklist — la mettre **en question séparée juste après** la checklist force un changement de cadre cognitif (passer du multiple-choice au libre) qui produit des réponses plus riches que si elle était noyée dans les options.
