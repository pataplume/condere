# Handoff — Condere.html

## Contexte du projet

Landing page single-file pour **Condere** (`condere.ch`), une micro-SaaS company suisse qui construit des outils logiciels pensés avec l'IA pour les PME francophones.

Fichier principal : `Condere.html` (898 lignes, vanilla HTML/CSS/JS + Tailwind CDN + Google Fonts).

---

## Stack technique

- **Tailwind CDN** (pas de build step) — config étendue avec couleurs custom dans `<script>` inline
- **Google Fonts** : Cormorant Garamond (serif), Inter (sans), JetBrains Mono (mono)
- **JS vanilla** : scroll reveal (IntersectionObserver), smooth scroll, canvas particles (hero)
- **Pas de framework** — tout est dans un seul fichier HTML

### Palette
```
--ink:        #0E0B08   (fond principal)
--ink2:       #1A1410   (fond sections alternées)
--travertin:  #F5EFE4   (texte principal)
--gold:       #C9A961   (accent or)
--terra:      #B85C3C   (CTA principal)
--stone:      #8A8175   (texte secondaire)
```

---

## Structure de la page (sections)

| # | ID / Ancre | Contenu |
|---|-----------|---------|
| Nav | `#top` | Logo CONDERE ·MMXXVI, liens nav, bouton "Fonder un projet" |
| Hero | `#top` | SVG animé "CONDERE" (stroke + fill cascade lettre par lettre), tagline "Modular AI Foundation", sous-titre, 2 CTAs, canvas particules dorées, indicateur scroll bas-droite |
| I | `#a-propos` | Étymologie *condere*, 3 paragraphes (dont IA + humain au centre), citation Virgile, 3 bullets (EU/CH hébergement, FR·EN·DE·IT, Swiss Made) |
| II | `#produits` | Grille 3×2 "modules" : Augustus (actif → augustus.condere.ch), Tiberius (actif → tiberius.condere.ch), Caligula/Claudius/Nero/Galba (inactifs, "Bientôt") |
| III | `#services` | 3 services typographiques : Micro-SaaS sur mesure / Audits SOP & coaching IA / Sites web essentiels |
| IV | Manifeste | Quote sur le FOMO IA des PME suisses, "Le manifeste Condere" |
| Diagnostic | — | Section 2 colonnes : pitch questionnaire + bouton Tally actif |
| V | `#contact` | CTA final "Bâtissons quelque chose qui vous survivra", mailto + bouton produits |
| Footer | — | Logo, nav, version |

---

## Formulaire Tally

- **URL** : `https://tally.so/r/D4XEjb`
- **Clé API** : `tly-WPYgeiLBPqYVKTAE2GntSY27CCvju7D0`
- **Questions** :
  1. Secteur (choix multiple, 6 options)
  2. Tâches chronophages (cases à cocher, 6 options)
  3. Taille équipe (choix multiple, 5 options)
  4. Maturité IA (choix multiple, 4 options)
  5. Objectif principal (choix multiple, 5 options)
  6. Email (INPUT_EMAIL)
  7. Nom entreprise (INPUT_TEXT, optionnel)
  + Page de remerciement
- **Statut** : PUBLIÉ, fonctionnel via API
- **À faire** : ajouter les accents dans les libellés (contournement encodage API), personnaliser couleurs dans l'UI Tally, connecter webhook → Claude API pour recommandation automatique

---

## Problèmes connus / résolus

| Problème | Cause | Fix appliqué |
|---------|-------|-------------|
| Overlay sur la tagline latine | Canvas goldDust sans z-index explicite | `z-index:0` canvas, `z-index:1` content div |
| Filtre SVG hors-limites | `#stone` filter orphelin + overflow bevel | `overflow:hidden` sur SVG titre + suppression filtre stone |
| Sections IV/Diagnostic sans style | Guillemets typographiques `"` dans les attributs HTML (Edit tool bug) | Remplacement global `"` `"` → `"` ASCII via Python |
| Formulaire Tally vide | Structure API incorrecte (options dans payload au lieu de blocs séparés) | Blocs `MULTIPLE_CHOICE_OPTION` avec `index`, `isFirst`, `isLast` |

---

## Ce qui reste à faire

- [ ] **Tally** : corriger les accents dans les libellés du formulaire (via UI Tally ou PATCH API)
- [ ] **Tally** : customisation visuelle (couleurs dark, font)
- [ ] **Automation** : webhook Tally → Claude API → email de recommandation automatique
- [ ] **Footer** : liens LinkedIn et GitHub à renseigner (actuellement `href="#"`)
- [ ] **Nav mobile** : pas de menu hamburger, navigation cachée sur mobile
- [ ] **Mise en ligne** : déployer sur `condere.ch` (hébergement CH/EU)
- [ ] **SEO** : meta description en place, pas de og:image ni sitemap

---

## Points d'attention pour la suite

- **Ne pas utiliser l'Edit tool pour des blocs HTML larges** — il introduit des guillemets typographiques dans les attributs. Préférer des remplacements ciblés sur de petits blocs, ou vérifier avec `python3 -c "..."` après chaque édition.
- **Tailwind CDN** : les classes arbitraires `text-[clamp(...)]` fonctionnent mais le scanner Tailwind est sensible aux caractères non-ASCII dans les attributs class.
- **Canvas goldDust** : désactivé sur mobile (`@media max-width:768px`), toujours actif desktop.
- La tagline latine (`latin-line` CSS) a été **supprimée** du HTML mais le CSS est toujours présent — peut être nettoyé.
