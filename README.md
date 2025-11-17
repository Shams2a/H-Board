# H-Board 🎨

> Un clone local de Milanote - Application de gestion de projet visuelle et créative

## 📖 Description

H-Board est une application web de gestion de projet inspirée de Milanote, conçue pour fonctionner **100% en local** sans nécessiter de serveur externe. Idéale pour les créatifs, designers, écrivains et chefs de projet qui veulent organiser leurs idées de manière visuelle.

### ✨ Caractéristiques Principales

- 🎨 **Canvas Infini** : Espace de travail illimité avec zoom et pan
- 📝 **Notes Riches** : Éditeur de texte avec formatage (TipTap)
- 🖼️ **Organisation Visuelle** : Boards hiérarchiques, colonnes, sections
- 💾 **100% Local** : Stockage dans IndexedDB, aucune connexion requise
- 🎯 **Drag & Drop** : Déplacement fluide des éléments
- 🎨 **Personnalisable** : Couleurs, grille magnétique, zoom
- ⚡ **Performant** : React + TypeScript + Vite

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20.11+ (ou 22.12+)
- npm 10+

### Installation

```bash
# Cloner le projet
cd h-board-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

### Build pour Production

```bash
# Créer le build
npm run build

# Prévisualiser le build
npm run preview
```

## 📚 Utilisation

### 1. Créer un Board

- Cliquez sur le bouton **+** dans la sidebar
- Donnez un nom à votre board
- Le board apparaît dans la liste

### 2. Ajouter des Notes

1. Cliquez sur l'icône **Note** (StickyNote) dans la toolbar en bas
2. Cliquez sur le canvas à l'endroit désiré
3. Une note vide apparaît
4. Commencez à taper !

### 3. Éditer une Note

- **Cliquez sur une note** pour la sélectionner
- La toolbar de formatage apparaît :
  - **B** : Gras
  - **I** : Italique
  - **S** : Barré
  - **</>** : Code
  - **H1, H2, H3** : Titres
  - **Liste** : Puces ou numérotée
  - **Couleurs** : 9 couleurs de fond

### 4. Déplacer une Note

- Sélectionnez la note
- Cliquez et maintenez sur l'icône **≡≡** (grip)
- Déplacez la note
- Relâchez

### 5. Zoom et Navigation

- **Molette souris** : Zoom in/out (avec Ctrl enfoncé)
- **Boutons +/-** : Dans la toolbar
- **Ctrl+0** : Reset zoom à 100%
- **Grille** : Toggle avec l'icône grille

### 6. Boards Hiérarchiques

- Créez des boards enfants depuis n'importe quel board
- Naviguez avec le **fil d'Ariane** en haut
- Retour rapide avec la **flèche ←**

## 🎯 Fonctionnalités Actuelles

### ✅ Implémenté

- [x] Création/suppression de boards
- [x] Navigation hiérarchique avec breadcrumb
- [x] Notes avec éditeur TipTap
- [x] Formatage de texte (gras, italique, titres, listes)
- [x] Couleurs de fond personnalisables
- [x] Drag & drop fluide
- [x] Grille magnétique
- [x] Zoom 25%-200%
- [x] Sélection d'éléments
- [x] Persistance automatique (IndexedDB)
- [x] Sidebar rétractable

### 🚧 En Développement

- [ ] Raccourcis clavier (Delete, Ctrl+C/V/D, Ctrl+Z/Y)
- [ ] Redimensionnement des notes
- [ ] Upload et affichage d'images
- [ ] Colonnes pour organisation
- [ ] Liens vers sous-boards
- [ ] Sections et groupes
- [ ] Export (JSON, Image, PDF)

### 📋 Planifié

- [ ] Lignes et flèches de connexion
- [ ] Dessins à main levée
- [ ] Liens web avec preview
- [ ] Upload de fichiers
- [ ] To-do lists
- [ ] Tableaux/Grilles
- [ ] Templates prédéfinis
- [ ] Mode présentation
- [ ] Sync optionnelle (serveur externe)

## 🛠️ Stack Technique

### Frontend

- **React 18** : Framework UI
- **TypeScript** : Typage statique
- **Vite 5** : Build tool ultra-rapide
- **Tailwind CSS** : Styling utilitaire
- **TipTap** : Éditeur de texte riche
- **Lucide React** : Icônes modernes

### State & Storage

- **Zustand** : State management simple et performant
- **Dexie.js** : Wrapper IndexedDB pour persistance locale

### Outils de Développement

- **ESLint** : Linting
- **Git** : Versioning
- **Hot Module Replacement** : Rechargement instantané

## 📁 Structure du Projet

```
h-board-app/
├── src/
│   ├── components/      # Composants React
│   │   ├── Canvas/      # Canvas et breadcrumb
│   │   ├── Elements/    # Note, Image, Column, etc.
│   │   ├── Sidebar/     # Navigation
│   │   └── Toolbar/     # Barre d'outils
│   ├── hooks/           # Custom hooks
│   ├── store/           # Zustand stores
│   ├── types/           # Types TypeScript
│   ├── utils/           # Utilitaires et DB
│   └── styles/          # Styles globaux
├── public/              # Assets statiques
└── docs/                # Documentation
```

## 🎨 Raccourcis Clavier (Planifiés)

| Raccourci | Action |
|-----------|--------|
| `N` | Nouvelle note |
| `I` | Nouvelle image |
| `C` | Nouvelle colonne |
| `B` | Nouveau board link |
| `Delete` | Supprimer sélection |
| `Ctrl+C/V/X` | Copier/Coller/Couper |
| `Ctrl+D` | Dupliquer |
| `Ctrl+Z/Y` | Undo/Redo |
| `Ctrl+A` | Tout sélectionner |
| `Ctrl+0` | Reset zoom |
| `Alt+←` | Board parent |
| `Escape` | Désélectionner |

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

### Workflow de Développement

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Documentation

- [SPECIFICATIONS.md](../SPECIFICATIONS.md) - Spécifications complètes
- [PLAN_DEVELOPPEMENT.md](../PLAN_DEVELOPPEMENT.md) - Plan de développement en 80 étapes
- [PROGRESS.md](./PROGRESS.md) - Rapport de progression détaillé
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Prochaines actions

## 🐛 Bugs Connus

Aucun bug majeur pour le moment. Signalez les problèmes dans les Issues GitHub.

## 📝 Changelog

### v0.2.0 (Phase 2 - En cours)

- ✅ Notes avec TipTap
- ✅ Drag & drop
- ✅ Sélection d'éléments
- ✅ Toolbar de formatage

### v0.1.0 (Phase 1 - Complété)

- ✅ Setup projet
- ✅ Layout principal
- ✅ Boards hiérarchiques
- ✅ Persistance IndexedDB
- ✅ Zoom et grille

## 🙏 Remerciements

- Inspiré par [Milanote](https://milanote.com)
- Construit avec [TipTap](https://tiptap.dev)
- Icônes par [Lucide](https://lucide.dev)

## 📧 Contact

Pour toute question ou suggestion, ouvrez une Issue sur GitHub.

---

**H-Board** - Organisez vos idées visuellement, localement. 🎨
