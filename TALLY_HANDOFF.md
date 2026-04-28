# Tally — Handoff formulaire Diagnostic Condere

## Credentials
- **Clé API** : `tly-WPYgeiLBPqYVKTAE2GntSY27CCvju7D0`
- **Base URL** : `https://api.tally.so`
- **Auth** : `Authorization: Bearer <clé>`

## Formulaire actuel (partiellement fonctionnel)
- **URL publique** : `https://tally.so/r/D4XEjb`
- **URL édition** : `https://tally.so/forms/D4XEjb/edit`
- **Statut** : PUBLISHED — les questions s'affichent mais les libellés n'ont pas d'accents (bug encodage lors de la création via API)

## Questions du formulaire
1. Secteur d'activité (MULTIPLE_CHOICE, 6 options)
2. Tâches chronophages (CHECKBOXES, 6 options)
3. Taille équipe (MULTIPLE_CHOICE, 5 options)
4. Maturité IA (MULTIPLE_CHOICE, 4 options)
5. Objectif principal (MULTIPLE_CHOICE, 5 options)
6. Email (INPUT_EMAIL)
7. Nom entreprise, optionnel (INPUT_TEXT)
8. Page de remerciement (THANK_YOU_PAGE)

---

## Structure API correcte (après reverse engineering)

La structure des blocs Tally est la suivante :

### Règles générales
- Chaque **groupe de blocs** (= une question) partage le même `groupUuid`
- `groupType` = type du bloc **parent** de ce groupe
- Les blocs statiques (titre, input, thank you) ont `groupType == type`
- Les blocs options doivent avoir `groupType` = type de la question parente (ex: `MULTIPLE_CHOICE`)

### Structure MULTIPLE_CHOICE
```json
{ "uuid": "...", "groupUuid": "G1", "groupType": "MULTIPLE_CHOICE", "type": "MULTIPLE_CHOICE",
  "payload": { "html": "Texte de la question ?" } }
{ "uuid": "...", "groupUuid": "G1", "groupType": "MULTIPLE_CHOICE", "type": "MULTIPLE_CHOICE_OPTION",
  "payload": { "text": "Option A", "index": 0, "isFirst": true, "isLast": false } }
{ "uuid": "...", "groupUuid": "G1", "groupType": "MULTIPLE_CHOICE", "type": "MULTIPLE_CHOICE_OPTION",
  "payload": { "text": "Option B", "index": 1, "isFirst": false, "isLast": true } }
```

### Structure CHECKBOXES
```json
{ "uuid": "...", "groupUuid": "G2", "groupType": "CHECKBOXES", "type": "CHECKBOXES",
  "payload": { "html": "Texte de la question ?" } }
{ "uuid": "...", "groupUuid": "G2", "groupType": "CHECKBOXES", "type": "CHECKBOX",
  "payload": { "text": "Option A", "index": 0, "isFirst": true, "isLast": false } }
```

### Structure INPUT_EMAIL / INPUT_TEXT
```json
{ "uuid": "...", "groupUuid": "G3", "groupType": "INPUT_EMAIL", "type": "INPUT_EMAIL", "payload": {} }
```
⚠️ `payload.html` n'est **pas** accepté pour les inputs — payload vide `{}` uniquement.

### Structure FORM_TITLE
```json
{ "uuid": "...", "groupUuid": "G4", "groupType": "FORM_TITLE", "type": "FORM_TITLE",
  "payload": { "html": "Titre du formulaire" } }
```

### Structure THANK_YOU_PAGE
```json
{ "uuid": "...", "groupUuid": "G5", "groupType": "THANK_YOU_PAGE", "type": "THANK_YOU_PAGE",
  "payload": { "html": "Message de fin." } }
```

---

## À faire
- Corriger les accents dans les libellés (soit via PATCH API, soit recréer le form avec les bons accents en testant l'encodage)
- Personnaliser visuellement dans l'UI Tally (couleurs dark pour matcher condere.ch)
- Le bouton sur `Condere.html` pointe déjà vers `https://tally.so/r/D4XEjb` — mettre à jour si le form est recréé
