# Fix : Erreur HTTP 400 lors de la synchronisation Supabase

## 🐛 Problème identifié

Les requêtes vers Supabase échouaient avec l'erreur HTTP 400 (`PGRST204`) :

```
PATCH https://wuhrmplftwxarrimmuff.supabase.co/rest/v1/elements?id=eq....
Status: 400
Error: PGRST204
```

### Cause racine

**Incompatibilité de nommage entre TypeScript et PostgreSQL :**

- **TypeScript** utilise `camelCase` : `boardId`, `zIndex`, `createdAt`, `updatedAt`
- **PostgreSQL/Supabase** utilise `snake_case` : `board_id`, `z_index`, `created_at`, `updated_at`

Quand l'application envoyait des données à Supabase, les champs n'étaient pas reconnus par la base de données.

### Exemple du problème

**Données envoyées (TypeScript) :**
```json
{
  "id": "abc-123",
  "boardId": "def-456",
  "zIndex": 1,
  "createdAt": "2025-11-19T..."
}
```

**Données attendues par Supabase (PostgreSQL) :**
```json
{
  "id": "abc-123",
  "board_id": "def-456",
  "z_index": 1,
  "created_at": "2025-11-19T..."
}
```

## ✅ Solution implémentée

### 1. Création de transformateurs de données

Créé `/src/services/supabase/transformers.ts` avec :

#### Fonctions de conversion de casse
- `toSnakeCase()` - convertit camelCase → snake_case
- `toCamelCase()` - convertit snake_case → camelCase
- `objectToSnakeCase()` - transforme récursivement un objet
- `objectToCamelCase()` - transforme récursivement un objet

#### Transformateurs spécifiques
- `boardToSupabase()` / `boardFromSupabase()` - Boards
- `elementToSupabase()` / `elementFromSupabase()` - Elements
- `folderToSupabase()` / `folderFromSupabase()` - Folders
- `transformArray()` - Transformation de tableaux

### 2. Mise à jour des services Supabase

Tous les services ont été mis à jour pour utiliser les transformateurs :

#### `boardService.ts`
```typescript
// Avant
const { data, error } = await supabase
  .from('boards')
  .insert(board);

// Après
const supabaseBoard = boardToSupabase(board);
const { data, error } = await supabase
  .from('boards')
  .insert(supabaseBoard);

const result = boardFromSupabase(data);
```

#### `elementService.ts`
```typescript
// Avant
const { data, error } = await supabase
  .from('elements')
  .insert(element);

// Après
const supabaseElement = elementToSupabase(element);
const { data, error } = await supabase
  .from('elements')
  .insert(supabaseElement);

const result = elementFromSupabase(data);
```

#### `folderService.ts`
Même principe de transformation.

### 3. Gestion des champs JSONB

Les champs JSONB (`position`, `size`, `style`, `content`, `settings`) sont préservés tels quels car leur contenu interne utilise déjà le bon format.

### 4. Conversion automatique des dates

Les dates sont automatiquement converties :
- **Envoi à Supabase** : `Date` → `string` (ISO 8601)
- **Réception de Supabase** : `string` → `Date`

## 📊 Mapping des champs

### Board
| TypeScript (camelCase) | PostgreSQL (snake_case) |
|------------------------|-------------------------|
| `id` | `id` |
| `name` | `name` |
| `description` | `description` |
| `folderId` | `folder_id` |
| `parentId` | `parent_id` |
| `settings` | `settings` (JSONB) |
| `tags` | `tags` (array) |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### Element
| TypeScript (camelCase) | PostgreSQL (snake_case) |
|------------------------|-------------------------|
| `id` | `id` |
| `boardId` | `board_id` |
| `type` | `type` |
| `position` | `position` (JSONB) |
| `size` | `size` (JSONB) |
| `style` | `style` (JSONB) |
| `content` | `content` (JSONB) |
| `zIndex` | `z_index` |
| `locked` | `locked` |
| `parentId` | `parent_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### Folder
| TypeScript (camelCase) | PostgreSQL (snake_case) |
|------------------------|-------------------------|
| `id` | `id` |
| `name` | `name` |
| `color` | `color` |
| `parentFolderId` | `parent_folder_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## 🧪 Test de la correction

### 1. Tester manuellement
1. Ouvrez l'application : http://localhost:5174/
2. Créez un élément (note, image, etc.)
3. Vérifiez la console - pas d'erreurs HTTP 400
4. Vérifiez dans Supabase → Table Editor → elements
5. L'élément doit apparaître avec les bons champs

### 2. Test automatique
```bash
node test-supabase.js
```

Résultat attendu :
```
✅ Connexion réussie!
✅ Table "boards" - OK
✅ Table "elements" - OK
✅ Board créé avec succès!
✅ Board de test supprimé
🎉 Tous les tests ont réussi!
```

## 📝 Fichiers modifiés

### Nouveaux fichiers
- ✅ `src/services/supabase/transformers.ts` - Transformateurs de données
- ✅ `src/services/supabase/supabaseAdapter.ts` - Adaptateur pour le SyncService
- ✅ `src/services/supabase/supabaseSyncService.ts` - Service de sync Supabase

### Fichiers mis à jour
- ✅ `src/services/supabase/boardService.ts` - Utilise les transformateurs
- ✅ `src/services/supabase/elementService.ts` - Utilise les transformateurs
- ✅ `src/services/supabase/folderService.ts` - Utilise les transformateurs
- ✅ `src/store/boardStore.ts` - Utilise supabaseSyncService
- ✅ `src/store/elementStore.ts` - Utilise supabaseSyncService
- ✅ `src/store/folderStore.ts` - Utilise supabaseSyncService
- ✅ `src/services/init.ts` - Initialise Supabase au démarrage

## 🚀 Vérification finale

### Dans la console du navigateur
```
🚀 Initializing H-Board services...
✅ Database initialized
🔌 Supabase configured, testing connection...
✅ Supabase connection successful
📊 Sync Queue: 0 pending, 0 synced, 0 failed
✅ All services initialized successfully
```

### Créez un élément et vérifiez les logs
```
➕ Queued element:create abc-123
🔄 Syncing 1 operations...
✅ Synced element:create abc-123
✅ Sync complete. 1 synced, 0 failed
```

### Dans Supabase Table Editor
Les données doivent apparaître avec les champs en `snake_case` :
- `board_id` ✅
- `z_index` ✅
- `created_at` ✅
- `updated_at` ✅

## 💡 Points clés

1. **Les transformateurs sont bidirectionnels** :
   - TypeScript → Supabase : camelCase → snake_case
   - Supabase → TypeScript : snake_case → camelCase

2. **Les champs JSONB sont préservés** :
   - `position`, `size`, `style`, `content`, `settings` ne sont pas transformés
   - Leur contenu interne est géré par l'application

3. **Les dates sont automatiques** :
   - Converties en `Date` objects côté TypeScript
   - Stockées en ISO 8601 dans PostgreSQL

4. **Rétrocompatibilité** :
   - Les données IndexedDB locales restent en camelCase
   - Seules les communications avec Supabase sont transformées

## 🔧 Maintenance future

### Ajouter un nouveau champ
1. Ajoutez le champ au type TypeScript (camelCase)
2. Ajoutez le champ au schéma SQL (snake_case)
3. Les transformateurs géreront automatiquement la conversion

### Debugging
Si une erreur persiste :
1. Vérifiez les logs console
2. Inspectez la requête réseau dans DevTools
3. Vérifiez que le schéma SQL est à jour
4. Testez avec `node test-supabase.js`

## 📚 Ressources

- [Schéma SQL](./database-schema.sql)
- [Services Supabase](./src/services/supabase/)
- [Guide de configuration](./SUPABASE_SETUP.md)

---

**Statut** : ✅ **Corrigé et testé**
**Date** : 19 novembre 2025
**Impact** : Toutes les opérations CRUD vers Supabase fonctionnent correctement
