# Phase 4 : Database Board (Type Notion)

## 📋 Vue d'ensemble

Un **Database Board** dans H-Board est un tableau structuré similaire à Notion, permettant de gérer des données structurées avec des colonnes typées, des vues multiples, des filtres et des tris.

---

## 🎯 Fonctionnalités MVP (Phase 4.1)

### 1. Structure de base
- [x] Type de board `database` déjà défini dans les types
- [ ] Vue Table (vue par défaut)
- [ ] Système de lignes (rows) et colonnes (properties)
- [ ] Chaque ligne = une page avec contenu riche (comme une carte étendue)

### 2. Types de propriétés (colonnes) - Essentiels
- [ ] **Title** (Text) - Propriété principale obligatoire
- [ ] **Text** - Texte simple/multiligne
- [ ] **Number** - Nombres (entiers, décimaux, pourcentage, devise)
- [ ] **Select** - Choix unique dans une liste
- [ ] **Multi-Select** - Choix multiples dans une liste
- [ ] **Date** - Date et/ou heure
- [ ] **Checkbox** - Case à cocher (boolean)
- [ ] **URL** - Liens externes
- [ ] **Email** - Adresses email
- [ ] **Phone** - Numéros de téléphone

### 3. Gestion des colonnes
- [ ] Ajouter une colonne (property)
- [ ] Renommer une colonne
- [ ] Changer le type d'une colonne
- [ ] Supprimer une colonne
- [ ] Réorganiser les colonnes (drag & drop)
- [ ] Redimensionner la largeur des colonnes
- [ ] Cacher/afficher des colonnes

### 4. Gestion des lignes (rows)
- [ ] Ajouter une ligne (nouvelle entrée)
- [ ] Éditer une ligne (inline editing)
- [ ] Supprimer une ligne
- [ ] Dupliquer une ligne
- [ ] Réorganiser les lignes (drag & drop)
- [ ] Ouvrir une ligne en modal pour édition complète

### 5. Fonctionnalités de tri et filtrage
- [ ] **Trier** par colonne (ascendant/descendant)
- [ ] Trier par plusieurs colonnes
- [ ] **Filtrer** : égal, différent, contient, ne contient pas
- [ ] Filtres par type (texte, nombre, date, select)
- [ ] Combiner plusieurs filtres (AND)

### 6. Interface utilisateur
- [ ] Grille de table responsive
- [ ] Inline editing des cellules
- [ ] Menu contextuel sur clic droit (ligne/colonne)
- [ ] Barre d'outils : ajouter ligne, ajouter colonne, filtres, tri
- [ ] Indicateur de nombre de lignes
- [ ] Scrolling horizontal/vertical pour grandes tables

### 7. Persistence
- [ ] Tables Supabase pour database boards
- [ ] Schema flexible pour stocker les propriétés
- [ ] JSONB pour les valeurs des cellules
- [ ] Synchronisation temps réel

---

## 🚀 Fonctionnalités Avancées (Phase 4.2)

### 1. Types de propriétés avancés
- [ ] **Files & Media** - Upload de fichiers
- [ ] **Person** - Assignation d'utilisateurs
- [ ] **Formula** - Calculs automatiques
- [ ] **Relation** - Liens entre databases
- [ ] **Rollup** - Agrégations depuis relations
- [ ] **Created time** - Date de création auto
- [ ] **Created by** - Créateur auto
- [ ] **Last edited time** - Date de modification auto
- [ ] **Last edited by** - Dernier éditeur auto

### 2. Vues multiples
- [ ] Vue **List** - Liste compacte
- [ ] Vue **Board** (Kanban) - Grouper par Select
- [ ] Vue **Calendar** - Visualiser par dates
- [ ] Vue **Gallery** - Cartes visuelles avec images
- [ ] Basculer entre les vues sans changer les données

### 3. Fonctionnalités avancées
- [ ] **Groupement** par colonne (comme SQL GROUP BY)
- [ ] **Calculs** en bas de colonne (Count, Sum, Average, etc.)
- [ ] **Templates de lignes** pour création rapide
- [ ] **Formulaires** pour collecter des données
- [ ] **Export** CSV/JSON
- [ ] **Import** CSV
- [ ] Recherche globale dans la table
- [ ] Coloration conditionnelle des lignes/cellules

### 4. Collaboration
- [ ] Multi-utilisateurs temps réel
- [ ] Permissions par database
- [ ] Commentaires sur les lignes
- [ ] Historique des modifications

---

## 📐 Architecture technique

### Types TypeScript

```typescript
// src/types/database.ts

export type PropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'file'
  | 'person'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by';

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface NumberFormat {
  type: 'number' | 'decimal' | 'percentage' | 'currency';
  decimals?: number;
  currency?: string; // USD, EUR, etc.
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[]; // For select/multi-select
  numberFormat?: NumberFormat; // For number
  required?: boolean;
  width?: number; // Column width in pixels
  visible?: boolean; // Show/hide column
}

export interface DatabaseRow {
  id: string;
  boardId: string;
  position: number;
  properties: Record<string, any>; // propertyId -> value
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  lastEditedBy?: string;
}

export interface DatabaseView {
  id: string;
  boardId: string;
  name: string;
  type: 'table' | 'list' | 'board' | 'calendar' | 'gallery';
  filters: DatabaseFilter[];
  sorts: DatabaseSort[];
  groupBy?: string; // propertyId
  visibleProperties: string[]; // propertyId[]
}

export interface DatabaseFilter {
  propertyId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: any;
}

export interface DatabaseSort {
  propertyId: string;
  direction: 'asc' | 'desc';
}
```

### Schema Supabase

```sql
-- database_properties table
CREATE TABLE database_properties (
  id VARCHAR(36) PRIMARY KEY,
  board_id VARCHAR(36) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  options JSONB DEFAULT '[]'::jsonb, -- For select options
  number_format JSONB DEFAULT NULL,
  position INTEGER NOT NULL,
  required BOOLEAN DEFAULT false,
  width INTEGER DEFAULT 200,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- database_rows table
CREATE TABLE database_rows (
  id VARCHAR(36) PRIMARY KEY,
  board_id VARCHAR(36) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- All cell values
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  last_edited_by VARCHAR(36)
);

-- database_views table (Phase 4.2)
CREATE TABLE database_views (
  id VARCHAR(36) PRIMARY KEY,
  board_id VARCHAR(36) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '[]'::jsonb,
  sorts JSONB DEFAULT '[]'::jsonb,
  group_by VARCHAR(36),
  visible_properties JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_database_properties_board_id ON database_properties(board_id);
CREATE INDEX idx_database_rows_board_id ON database_rows(board_id);
CREATE INDEX idx_database_views_board_id ON database_views(board_id);
```

---

## 🛠️ Plan d'implémentation (MVP)

### Étape 1 : Structure et types (1-2h)
- [ ] Créer `src/types/database.ts` avec tous les types
- [ ] Créer le store Zustand `src/store/databaseStore.ts`
- [ ] Définir les interfaces de base

### Étape 2 : Migration Supabase (30min)
- [ ] Créer `supabase/migrations/20241216_create_database_tables.sql`
- [ ] Appliquer la migration

### Étape 3 : Services Supabase (1-2h)
- [ ] `src/services/supabase/databaseService.ts`
- [ ] CRUD pour properties
- [ ] CRUD pour rows
- [ ] Transformations snake_case ↔️ camelCase

### Étape 4 : Composants de base (2-3h)
- [ ] `src/components/Database/DatabaseBoard.tsx` - Composant principal
- [ ] `src/components/Database/DatabaseTable.tsx` - Vue table
- [ ] `src/components/Database/DatabaseToolbar.tsx` - Barre d'outils
- [ ] `src/components/Database/PropertyHeader.tsx` - En-tête de colonne
- [ ] `src/components/Database/DatabaseRow.tsx` - Ligne de la table

### Étape 5 : Éditeurs de cellules (3-4h)
- [ ] `src/components/Database/cells/TextCell.tsx`
- [ ] `src/components/Database/cells/NumberCell.tsx`
- [ ] `src/components/Database/cells/SelectCell.tsx`
- [ ] `src/components/Database/cells/MultiSelectCell.tsx`
- [ ] `src/components/Database/cells/DateCell.tsx`
- [ ] `src/components/Database/cells/CheckboxCell.tsx`
- [ ] `src/components/Database/cells/URLCell.tsx`
- [ ] `src/components/Database/cells/EmailCell.tsx`
- [ ] `src/components/Database/cells/PhoneCell.tsx`

### Étape 6 : Gestion des propriétés (2h)
- [ ] Modal d'ajout de propriété
- [ ] Modal d'édition de propriété
- [ ] Menu contextuel sur en-tête de colonne
- [ ] Drag & drop des colonnes

### Étape 7 : Gestion des lignes (1-2h)
- [ ] Ajouter une ligne
- [ ] Supprimer une ligne
- [ ] Dupliquer une ligne
- [ ] Drag & drop des lignes
- [ ] Modal de ligne complète

### Étape 8 : Filtres et tri (2-3h)
- [ ] Interface de filtrage
- [ ] Interface de tri
- [ ] Logique de filtrage côté client
- [ ] Logique de tri côté client

### Étape 9 : Persistence (2h)
- [ ] Intégrer les services Supabase dans le store
- [ ] Optimistic updates + rollback
- [ ] Synchronisation au chargement

### Étape 10 : Tests et polish (1-2h)
- [ ] Tester tous les types de propriétés
- [ ] Tester filtres et tri
- [ ] Vérifier la persistence
- [ ] Améliorer l'UX (loading states, erreurs)

---

## 📊 Estimation totale : 15-25 heures

### MVP (Phase 4.1) : ~15-20h
- Structure et types : 1-2h
- Migration : 30min
- Services : 1-2h
- Composants de base : 2-3h
- Éditeurs de cellules : 3-4h
- Gestion propriétés : 2h
- Gestion lignes : 1-2h
- Filtres et tri : 2-3h
- Persistence : 2h
- Tests : 1-2h

### Avancé (Phase 4.2) : ~5-10h
- Types avancés : 2-3h
- Vues multiples : 3-5h
- Fonctionnalités avancées : 2-3h

---

## 🎨 Références UI/UX

### Inspiration
- **Notion** : Interface de référence
- **Airtable** : Gestion des colonnes et types
- **Google Sheets** : Inline editing fluide
- **Linear** : Filtres et tri élégants

### Bibliothèques recommandées
- **@tanstack/react-table** - Gestion de tables avancées
- **react-select** - Éditeur de select/multi-select
- **react-datepicker** - Sélecteur de dates
- **@dnd-kit** - Drag & drop (déjà installé)

---

## ✅ Prérequis

- [x] Kanban MVP terminé
- [x] Persistence Supabase fonctionnelle
- [x] Type `database` défini dans Board
- [ ] @tanstack/react-table installé (à faire)

---

## 🚦 État actuel

- **Phase 1 (Canvas)** : ✅ Terminé
- **Phase 2 (Kanban MVP)** : ✅ Terminé
- **Phase 3 (Kanban Avancé)** : ✅ Terminé
- **Phase 3.5 (Persistence Kanban)** : ✅ Terminé
- **Phase 4 (Database Board)** : ⏳ À commencer

---

## 📝 Notes

1. **Approche progressive** : Commencer par le MVP avec les types de base, puis ajouter les fonctionnalités avancées
2. **Persistence flexible** : Utiliser JSONB pour stocker les valeurs des cellules pour faciliter l'évolution du schema
3. **Performance** : Pagination si > 100 lignes, virtualisation si > 1000 lignes
4. **Validation** : Valider les types de données côté client ET serveur
5. **UX** : Inline editing fluide, raccourcis clavier (Tab, Enter, Escape)
