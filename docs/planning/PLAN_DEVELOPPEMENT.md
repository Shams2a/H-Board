# Plan de Développement H-Board
## Découpage en Étapes Courtes et Cohérentes

---

## 🎯 Objectif
Développer H-Board de manière incrémentale avec des étapes testables de 30-60 minutes maximum.

---

## 📦 PHASE 1 : FONDATIONS (Jour 1-2)

### Étape 1.1 : Setup Initial du Projet ⏱️ 30 min
- [ ] Initialiser Vite avec template React + TypeScript
- [ ] Créer le dépôt Git et premier commit
- [ ] Configurer .gitignore
- [ ] Vérifier que le projet démarre correctement

**Test de validation** : `npm run dev` affiche la page de démarrage Vite

---

### Étape 1.2 : Installation des Dépendances ⏱️ 20 min
- [ ] Installer Tailwind CSS + PostCSS + Autoprefixer
- [ ] Installer Zustand pour state management
- [ ] Installer Dexie.js pour IndexedDB
- [ ] Installer uuid et dayjs
- [ ] Installer @radix-ui/react-* (dropdown, dialog, etc.)

```bash
npm install tailwindcss postcss autoprefixer
npm install zustand dexie uuid dayjs
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install @radix-ui/react-popover @radix-ui/react-tooltip
```

**Test de validation** : Toutes les dépendances dans package.json

---

### Étape 1.3 : Configuration Tailwind ⏱️ 20 min
- [ ] Créer tailwind.config.js avec la palette de couleurs
- [ ] Créer postcss.config.js
- [ ] Configurer globals.css avec directives Tailwind
- [ ] Définir les couleurs du design system

**Test de validation** : Styles Tailwind appliqués sur un élément test

---

### Étape 1.4 : Structure de Dossiers ⏱️ 15 min
- [ ] Créer tous les dossiers selon SPECIFICATIONS.md
- [ ] Créer des fichiers .gitkeep dans dossiers vides
- [ ] Créer index.ts pour exports barrel dans types/

```
src/
├── components/
│   ├── Canvas/
│   ├── Elements/
│   ├── Sidebar/
│   ├── Toolbar/
│   └── Modals/
├── hooks/
├── store/
├── utils/
├── types/
└── styles/
```

**Test de validation** : Structure visible dans l'éditeur

---

### Étape 1.5 : Types TypeScript de Base ⏱️ 30 min
- [ ] Créer types/board.ts avec interface Board
- [ ] Créer types/element.ts avec tous les types d'éléments
- [ ] Créer types/index.ts pour exports
- [ ] Ajouter types pour Position, Size, Style

**Test de validation** : Aucune erreur TypeScript

---

### Étape 1.6 : Configuration IndexedDB ⏱️ 45 min
- [ ] Créer utils/storage.ts avec Dexie setup
- [ ] Définir schémas boards et elements
- [ ] Créer fonctions CRUD de base
- [ ] Tester insertion/lecture de données

```typescript
// Exemple de structure
class HBoardDatabase extends Dexie {
  boards!: Table<Board>;
  elements!: Table<Element>;
}
```

**Test de validation** : Données persistantes dans IndexedDB (vérifier DevTools)

---

## 📐 PHASE 2 : LAYOUT ET UI DE BASE (Jour 3-4)

### Étape 2.1 : Composant Sidebar ⏱️ 45 min
- [ ] Créer Sidebar.tsx avec structure de base
- [ ] Ajouter bouton toggle pour rétracter/étendre
- [ ] Implémenter la logique de rétractation
- [ ] Styler selon le design system

**Test de validation** : Sidebar se rétracte et s'étend au clic

---

### Étape 2.2 : BoardTree (Liste des Boards) ⏱️ 1h
- [ ] Créer BoardTree.tsx avec structure arborescente
- [ ] Afficher boards depuis le store
- [ ] Permettre la sélection d'un board
- [ ] Icônes pour expand/collapse des niveaux

**Test de validation** : Liste des boards s'affiche et est cliquable

---

### Étape 2.3 : Composant Breadcrumb ⏱️ 30 min
- [ ] Créer Breadcrumb.tsx
- [ ] Afficher la hiérarchie du board actuel
- [ ] Rendre chaque niveau cliquable pour navigation
- [ ] Ajouter bouton retour rapide (Alt+←)

**Test de validation** : Navigation via breadcrumb fonctionne

---

### Étape 2.4 : Toolbar Flottante ⏱️ 45 min
- [ ] Créer Toolbar.tsx en bas de l'écran
- [ ] Ajouter boutons pour chaque type d'élément
- [ ] Icônes pour chaque outil
- [ ] Tooltips au survol

**Test de validation** : Toolbar visible avec tous les outils

---

### Étape 2.5 : Layout Principal Assemblé ⏱️ 30 min
- [ ] Assembler Sidebar + Canvas + Breadcrumb + Toolbar dans App.tsx
- [ ] Configurer le routing de base (même si local)
- [ ] Responsive layout (grid CSS)
- [ ] Tester redimensionnement fenêtre

**Test de validation** : Layout complet et responsive

---

## 🎨 PHASE 3 : CANVAS ET INTERACTION (Jour 5-6)

### Étape 3.1 : Setup Konva.js ⏱️ 30 min
- [ ] Installer react-konva
- [ ] Créer Canvas.tsx avec Stage et Layer de base
- [ ] Configurer dimensions responsives
- [ ] Background color du canvas

```bash
npm install konva react-konva
npm install -D @types/konva
```

**Test de validation** : Canvas Konva s'affiche

---

### Étape 3.2 : Zoom et Pan ⏱️ 1h
- [ ] Implémenter zoom avec molette + Ctrl
- [ ] Limiter zoom entre 25% et 200%
- [ ] Implémenter pan avec Space + Drag
- [ ] Afficher le niveau de zoom actuel

**Test de validation** : Zoom/pan fluides au clavier et souris

---

### Étape 3.3 : Grille Optionnelle ⏱️ 30 min
- [ ] Créer Grid.tsx avec lignes de grille
- [ ] Toggle grille depuis toolbar
- [ ] Grille magnétique (snap to grid)
- [ ] Configurer espacement (8px par défaut)

**Test de validation** : Grille visible/cachée et éléments s'alignent

---

### Étape 3.4 : ZoomControls Component ⏱️ 20 min
- [ ] Créer ZoomControls.tsx
- [ ] Boutons +, -, Reset (100%)
- [ ] Affichage du pourcentage
- [ ] Intégrer dans Toolbar

**Test de validation** : Contrôles de zoom fonctionnent

---

## 📝 PHASE 4 : PREMIER ÉLÉMENT - NOTES (Jour 7-8)

### Étape 4.1 : Setup TipTap ⏱️ 30 min
- [ ] Installer @tiptap/react et extensions
- [ ] Configurer éditeur de base
- [ ] Tester dans composant isolé

```bash
npm install @tiptap/react @tiptap/starter-kit
npm install @tiptap/extension-placeholder
npm install @tiptap/extension-color @tiptap/extension-text-style
```

**Test de validation** : Éditeur TipTap fonctionne dans page test

---

### Étape 4.2 : Composant Note ⏱️ 1h
- [ ] Créer Note.tsx
- [ ] Intégrer TipTap pour édition
- [ ] Styles de carte (border, shadow, padding)
- [ ] Toolbar de formatage (gras, italique, etc.)
- [ ] Couleurs de fond personnalisables

**Test de validation** : Note éditable avec formatage

---

### Étape 4.3 : Drag & Drop Basique ⏱️ 1h
- [ ] Installer @dnd-kit/core
- [ ] Rendre Note draggable sur canvas
- [ ] Sauvegarder position dans store
- [ ] Persister dans IndexedDB

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Test de validation** : Note déplaçable et position sauvegardée

---

### Étape 4.4 : Redimensionnement de Notes ⏱️ 45 min
- [ ] Ajouter poignées de redimensionnement
- [ ] Gérer resize avec Konva Transformer
- [ ] Contraintes min/max de taille
- [ ] Sauvegarder dimensions

**Test de validation** : Note redimensionnable

---

### Étape 4.5 : Création de Notes ⏱️ 30 min
- [ ] Connecter bouton toolbar "Nouvelle Note"
- [ ] Créer note au centre du canvas visible
- [ ] Assigner ID unique (uuid)
- [ ] Sauvegarder immédiatement

**Test de validation** : Clic sur bouton crée une nouvelle note

---

## 🖼️ PHASE 5 : IMAGES (Jour 9)

### Étape 5.1 : Upload d'Images ⏱️ 45 min
- [ ] Créer Image.tsx
- [ ] Input file pour upload
- [ ] Conversion en base64
- [ ] Stockage dans IndexedDB

**Test de validation** : Image uploadée et affichée

---

### Étape 5.2 : Drag & Drop d'Images ⏱️ 30 min
- [ ] Drop zone sur canvas
- [ ] Accepter JPG, PNG, GIF, WebP, SVG
- [ ] Validation de taille (max 10MB)
- [ ] Feedback visuel pendant drop

**Test de validation** : Drag image depuis fichiers vers canvas

---

### Étape 5.3 : Redimensionnement Proportionnel ⏱️ 30 min
- [ ] Maintenir ratio aspect lors resize
- [ ] Poignées de coins seulement
- [ ] Contraintes de taille min/max

**Test de validation** : Image garde proportions au resize

---

### Étape 5.4 : Lightbox ⏱️ 30 min
- [ ] Double-clic ouvre image en plein écran
- [ ] Modal avec image agrandie
- [ ] Bouton fermer (X et Escape)
- [ ] Fond semi-transparent

**Test de validation** : Lightbox s'ouvre au double-clic

---

## 🎛️ PHASE 6 : STATE MANAGEMENT AVANCÉ (Jour 10)

### Étape 6.1 : BoardStore Complet ⏱️ 45 min
- [ ] Actions : createBoard, deleteBoard, updateBoard
- [ ] Navigation entre boards
- [ ] Hiérarchie parent/enfant
- [ ] Board actuel

**Test de validation** : Création/suppression de boards fonctionne

---

### Étape 6.2 : ElementStore Complet ⏱️ 45 min
- [ ] Actions : createElement, deleteElement, updateElement
- [ ] Sélection d'éléments
- [ ] Z-index management
- [ ] Filtrage par board

**Test de validation** : CRUD complet sur éléments

---

### Étape 6.3 : UIStore ⏱️ 30 min
- [ ] État sidebar (ouvert/fermé)
- [ ] Niveau de zoom
- [ ] Position pan du canvas
- [ ] Outil actif dans toolbar

**Test de validation** : État UI persiste entre rafraîchissements

---

### Étape 6.4 : Undo/Redo System ⏱️ 1h
- [ ] Historique des actions (max 50)
- [ ] Undo (Ctrl+Z)
- [ ] Redo (Ctrl+Y)
- [ ] Types d'actions réversibles

**Test de validation** : Undo/Redo fonctionne sur notes et images

---

## 🔲 PHASE 7 : SÉLECTION ET MANIPULATION (Jour 11)

### Étape 7.1 : Sélection Simple ⏱️ 30 min
- [ ] Clic sur élément le sélectionne
- [ ] Border highlight sur sélection
- [ ] Désélection au clic ailleurs
- [ ] State de sélection dans store

**Test de validation** : Sélection visuelle fonctionne

---

### Étape 7.2 : Sélection Multiple ⏱️ 45 min
- [ ] Ctrl+Clic pour ajouter à sélection
- [ ] Rectangle de sélection (lasso)
- [ ] Highlight tous les éléments sélectionnés
- [ ] Actions groupées

**Test de validation** : Sélection multiple au Ctrl+Clic et lasso

---

### Étape 7.3 : Copier/Coller ⏱️ 45 min
- [ ] Ctrl+C copie les éléments sélectionnés
- [ ] Ctrl+V colle avec offset
- [ ] Nouveaux IDs pour copies
- [ ] Clipboard interne

**Test de validation** : Copier/coller crée duplicatas

---

### Étape 7.4 : Suppression ⏱️ 20 min
- [ ] Delete supprime sélection
- [ ] Confirmation si >1 élément
- [ ] Soft delete (corbeille 30j)
- [ ] Animation de disparition

**Test de validation** : Delete supprime éléments sélectionnés

---

### Étape 7.5 : Menu Contextuel ⏱️ 45 min
- [ ] Clic droit ouvre menu
- [ ] Options : Copier, Coller, Dupliquer, Supprimer
- [ ] Options : Avant/Arrière, Verrouiller
- [ ] Position menu au curseur

**Test de validation** : Menu contextuel affiche bonnes options

---

## 📊 PHASE 8 : COLONNES (Jour 12-13)

### Étape 8.1 : Composant Column ⏱️ 1h
- [ ] Créer Column.tsx
- [ ] Container avec titre éditable
- [ ] Dimensions configurables (200-400px largeur)
- [ ] Styles personnalisables

**Test de validation** : Colonne créée et affichée

---

### Étape 8.2 : Drop Zone Intelligente ⏱️ 1h
- [ ] Détecter survol d'élément sur colonne
- [ ] Highlight de la drop zone
- [ ] Ajout d'élément dans la colonne
- [ ] Relation parent-enfant dans store

**Test de validation** : Glisser note dans colonne fonctionne

---

### Étape 8.3 : Auto-arrangement Vertical ⏱️ 45 min
- [ ] Éléments s'alignent verticalement
- [ ] Espacement de 8px entre éléments
- [ ] Réarrangement auto lors ajout/suppression
- [ ] Largeur héritée de la colonne

**Test de validation** : Éléments s'arrangent automatiquement

---

### Étape 8.4 : Extraction d'Éléments ⏱️ 30 min
- [ ] Glisser élément hors de colonne
- [ ] Retour sur canvas principal
- [ ] Mise à jour relation parent-enfant
- [ ] Position absolue restaurée

**Test de validation** : Extraction d'élément fonctionne

---

### Étape 8.5 : Scroll Interne ⏱️ 20 min
- [ ] Scrollbar si contenu déborde
- [ ] Hauteur max configurable
- [ ] Styles de scrollbar customisés

**Test de validation** : Colonne scroll si beaucoup d'éléments

---

## 🔗 PHASE 9 : BOARD LINKS ET NAVIGATION (Jour 14-15)

### Étape 9.1 : Composant BoardLink ⏱️ 45 min
- [ ] Créer BoardLink.tsx
- [ ] Icône distinctive (dossier/grille)
- [ ] Titre et description
- [ ] Badge nombre d'éléments

**Test de validation** : BoardLink s'affiche avec infos

---

### Étape 9.2 : Navigation vers Sous-Board ⏱️ 1h
- [ ] Double-clic entre dans le board
- [ ] Charger éléments du sous-board
- [ ] Mise à jour breadcrumb
- [ ] Animation de transition

**Test de validation** : Navigation vers sous-board fonctionne

---

### Étape 9.3 : Retour au Parent ⏱️ 30 min
- [ ] Bouton retour dans breadcrumb
- [ ] Raccourci Alt+←
- [ ] Sauvegarder état du canvas (zoom, pan)
- [ ] Restaurer état du parent

**Test de validation** : Retour au parent restaure état

---

### Étape 9.4 : Création de Sous-Boards ⏱️ 30 min
- [ ] Bouton "Nouveau Board" dans toolbar
- [ ] Créer board enfant lié
- [ ] Ajouter à hiérarchie dans sidebar
- [ ] Naviguer automatiquement

**Test de validation** : Création de sous-board et navigation

---

## 📋 PHASE 10 : AUTRES TYPES D'ÉLÉMENTS (Jour 16-18)

### Étape 10.1 : Sections ⏱️ 45 min
- [ ] Créer Section.tsx
- [ ] Rectangle redimensionnable
- [ ] Fond semi-transparent
- [ ] Titre optionnel

**Test de validation** : Section créée et redimensionnable

---

### Étape 10.2 : To-Do Lists ⏱️ 1h
- [ ] Créer TodoList.tsx
- [ ] Checkboxes interactives
- [ ] Ajout/suppression d'items
- [ ] Barre de progression

**Test de validation** : Todo list fonctionnelle

---

### Étape 10.3 : Liens Web ⏱️ 1h
- [ ] Créer Link.tsx
- [ ] Input URL
- [ ] Preview (titre, description, image) via API
- [ ] Ouverture dans nouvel onglet

**Test de validation** : Lien web avec preview

---

### Étape 10.4 : Fichiers ⏱️ 45 min
- [ ] Créer File.tsx
- [ ] Upload de documents
- [ ] Icônes selon type
- [ ] Téléchargement

**Test de validation** : Upload et download de fichiers

---

### Étape 10.5 : Tableaux/Grilles ⏱️ 2h
- [ ] Installer @tanstack/react-table
- [ ] Créer Table.tsx
- [ ] Grille éditable (lignes/colonnes dynamiques)
- [ ] Types de cellules (texte, nombre, date)
- [ ] Formules basiques (SUM, AVG)

**Test de validation** : Tableau fonctionnel avec formules

---

## 🎨 PHASE 11 : ÉLÉMENTS VISUELS AVANCÉS (Jour 19-20)

### Étape 11.1 : Lignes et Flèches ⏱️ 2h
- [ ] Créer Line.tsx
- [ ] Points d'ancrage sur éléments
- [ ] Courbes de Bézier
- [ ] Styles (solide, pointillé, flèches)

**Test de validation** : Lignes connectent les éléments

---

### Étape 11.2 : Dessins à Main Levée ⏱️ 1h30
- [ ] Créer Drawing.tsx
- [ ] Outil crayon
- [ ] Épaisseurs variables
- [ ] Palette de couleurs
- [ ] Gomme

**Test de validation** : Dessin libre fonctionne

---

## ⚙️ PHASE 12 : RACCOURCIS CLAVIER (Jour 21)

### Étape 12.1 : Hook useKeyboardShortcuts ⏱️ 1h
- [ ] Installer react-hotkeys-hook
- [ ] Créer hook personnalisé
- [ ] Mapper tous les raccourcis
- [ ] Désactiver si input focus

**Test de validation** : Tous les raccourcis fonctionnent

---

### Étape 12.2 : Aide des Raccourcis ⏱️ 30 min
- [ ] Modal d'aide (Ctrl+?)
- [ ] Liste tous les raccourcis
- [ ] Recherche de raccourcis

**Test de validation** : Modal d'aide affichée

---

## 🔍 PHASE 13 : RECHERCHE ET FILTRES (Jour 22)

### Étape 13.1 : Recherche Globale ⏱️ 1h
- [ ] SearchBar dans sidebar
- [ ] Recherche full-text dans boards/éléments
- [ ] Highlights des résultats
- [ ] Navigation vers résultat

**Test de validation** : Recherche trouve et affiche résultats

---

### Étape 13.2 : Filtres ⏱️ 45 min
- [ ] Filtres par type d'élément
- [ ] Filtres par date
- [ ] Filtres par tags
- [ ] Reset filtres

**Test de validation** : Filtres affichent bons éléments

---

## 📤 PHASE 14 : EXPORT/IMPORT (Jour 23)

### Étape 14.1 : Export JSON ⏱️ 30 min
- [ ] Fonction exportBoardToJSON
- [ ] Téléchargement du fichier
- [ ] Format structuré

**Test de validation** : Fichier JSON téléchargé

---

### Étape 14.2 : Import JSON ⏱️ 45 min
- [ ] Upload fichier JSON
- [ ] Validation du format
- [ ] Import dans IndexedDB
- [ ] Gestion des conflits d'ID

**Test de validation** : Import restaure le board

---

### Étape 14.3 : Export Image ⏱️ 1h
- [ ] Installer html2canvas
- [ ] Capture du canvas
- [ ] Download PNG/JPG
- [ ] Options de qualité

**Test de validation** : Image du board téléchargée

---

### Étape 14.4 : Export PDF ⏱️ 1h
- [ ] Installer jsPDF
- [ ] Conversion canvas vers PDF
- [ ] Multi-pages si nécessaire
- [ ] Download PDF

**Test de validation** : PDF du board téléchargé

---

## 🌐 PHASE 15 : MODE OFFLINE/SYNC OPTIONNEL (Jour 24-26)

### Étape 15.1 : Indicateur de Statut ⏱️ 30 min
- [ ] Composant StatusIndicator
- [ ] Détection online/offline
- [ ] Icône dans UI (coin supérieur)

**Test de validation** : Indicateur change selon connexion

---

### Étape 15.2 : File d'Attente Sync ⏱️ 1h
- [ ] Queue des changements offline
- [ ] Stockage dans IndexedDB
- [ ] Flush au retour online

**Test de validation** : Changements offline mis en queue

---

### Étape 15.3 : Configuration Serveur Optionnel ⏱️ 1h
- [ ] Modal de configuration
- [ ] URL serveur
- [ ] Token d'auth
- [ ] Test de connexion

**Test de validation** : Config serveur sauvegardée

---

### Étape 15.4 : API Client ⏱️ 2h
- [ ] Fonctions fetch pour sync
- [ ] Push des changements
- [ ] Pull des mises à jour
- [ ] Gestion erreurs réseau

**Test de validation** : API client fonctionne (avec mock)

---

### Étape 15.5 : Résolution de Conflits ⏱️ 1h30
- [ ] Détection de conflits (timestamps)
- [ ] Stratégies : dernier gagne, demander utilisateur
- [ ] UI de résolution manuelle

**Test de validation** : Conflits détectés et résolus

---

## 🎭 PHASE 16 : TEMPLATES (Jour 27)

### Étape 16.1 : Bibliothèque de Templates ⏱️ 1h
- [ ] Créer templates prédéfinis en JSON
- [ ] Liste dans sidebar
- [ ] Preview des templates

**Test de validation** : Templates listés

---

### Étape 16.2 : Création depuis Template ⏱️ 45 min
- [ ] Bouton "Utiliser ce template"
- [ ] Clone du template
- [ ] Nouveaux IDs générés

**Test de validation** : Board créé depuis template

---

### Étape 16.3 : Sauvegarde Custom Template ⏱️ 30 min
- [ ] Bouton "Sauver comme template"
- [ ] Nom et description
- [ ] Stockage dans IndexedDB

**Test de validation** : Template personnalisé sauvegardé

---

## 🎬 PHASE 17 : MODE PRÉSENTATION (Jour 28)

### Étape 17.1 : Mode Plein Écran ⏱️ 30 min
- [ ] Bouton mode présentation
- [ ] Cache sidebar et toolbar
- [ ] Plein écran navigateur

**Test de validation** : Mode plein écran activé

---

### Étape 17.2 : Navigation par Zones ⏱️ 1h
- [ ] Définir zones de focus
- [ ] Navigation flèches
- [ ] Zoom auto sur zone

**Test de validation** : Navigation entre zones

---

## 🔧 PHASE 18 : POLISH ET OPTIMISATION (Jour 29-30)

### Étape 18.1 : Animations et Transitions ⏱️ 1h
- [ ] Transitions CSS fluides
- [ ] Micro-interactions
- [ ] Loading states
- [ ] Feedback visuel

**Test de validation** : UI fluide et responsive

---

### Étape 18.2 : Optimisation Performance ⏱️ 1h30
- [ ] Virtualisation grandes listes
- [ ] Lazy loading images
- [ ] Debounce sauvegarde
- [ ] Memoization composants

**Test de validation** : Canvas fluide avec 500+ éléments

---

### Étape 18.3 : Tests de Base ⏱️ 2h
- [ ] Setup Vitest
- [ ] Tests stores
- [ ] Tests composants critiques
- [ ] Tests utils

**Test de validation** : Tests passent

---

### Étape 18.4 : Documentation ⏱️ 1h
- [ ] README.md complet
- [ ] Guide d'utilisation
- [ ] Guide de contribution
- [ ] Commentaires code

**Test de validation** : Documentation claire

---

### Étape 18.5 : Build Production ⏱️ 30 min
- [ ] Optimiser build Vite
- [ ] Minification
- [ ] Tree shaking
- [ ] Test du build

**Test de validation** : Build réussi et fonctionne

---

## 🎉 PHASE 19 : FINALISATION (Jour 31)

### Étape 19.1 : Tests Utilisateur ⏱️ 2h
- [ ] Scénarios d'usage réels
- [ ] Identifier bugs
- [ ] Notes d'amélioration

---

### Étape 19.2 : Corrections Finales ⏱️ Variable
- [ ] Fix bugs critiques
- [ ] Améliorations UX
- [ ] Edge cases

---

### Étape 19.3 : Package pour Distribution ⏱️ 1h
- [ ] Instructions installation
- [ ] Script de démarrage
- [ ] Variables d'environnement
- [ ] Archive de release

---

## 📊 Récapitulatif

**Total estimé** : ~30 jours de développement
**Étapes** : ~80 étapes courtes et testables
**Approche** : Incrémentale et itérative

Chaque étape :
- ✅ Testable indépendamment
- ✅ Temps limité (15-120 min)
- ✅ Produit un résultat visible
- ✅ Peut être commitée séparément

---

## 🚀 Commencer Maintenant

**Prochaine action** : Étape 1.1 - Setup Initial du Projet

```bash
npm create vite@latest h-board -- --template react-ts
cd h-board
npm install
npm run dev
```

**Règle d'or** : Toujours tester avant de passer à l'étape suivante !