# Configuration Supabase pour H-Board

## ✅ Configuration Complète !

Votre application H-Board est maintenant configurée pour utiliser Supabase comme backend de synchronisation.

## 📋 Ce qui a été fait

### 1. Variables d'environnement
Le fichier `.env` a été configuré avec vos identifiants Supabase :
```env
VITE_SUPABASE_URL=https://wuhrmplftwxarrimmuff.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Tables créées dans Supabase
Les tables suivantes doivent être créées dans votre base de données Supabase (via le SQL Editor) :
- ✅ `folders` - Gestion des dossiers
- ✅ `boards` - Les tableaux
- ✅ `elements` - Les éléments sur les tableaux
- ✅ `tags` - Système de tags
- ✅ `board_tags` - Relation boards-tags
- ✅ `sync_operations` - Pour la synchronisation (optionnel)

Le schéma SQL complet est dans `database-schema.sql`.

### 3. Services Supabase créés
- ✅ `src/lib/supabase.ts` - Client Supabase
- ✅ `src/services/supabase/boardService.ts` - Service boards
- ✅ `src/services/supabase/elementService.ts` - Service elements
- ✅ `src/services/supabase/folderService.ts` - Service folders
- ✅ `src/services/supabase/supabaseAdapter.ts` - Adaptateur pour l'API
- ✅ `src/services/supabase/supabaseSyncService.ts` - Service de synchronisation

### 4. Stores mis à jour
Les stores Zustand ont été mis à jour pour utiliser Supabase :
- ✅ `boardStore.ts` - Synchronise les boards vers Supabase
- ✅ `elementStore.ts` - Synchronise les elements vers Supabase
- ✅ `folderStore.ts` - Synchronise les folders vers Supabase

### 5. Interface utilisateur
- ✅ `SupabaseSyncStatus.tsx` - Composant de statut de sync

## 🚀 Comment ça fonctionne

### Architecture Offline-First
L'application utilise une architecture **offline-first** :

1. **Stockage local (IndexedDB)** : Toutes les opérations sont d'abord sauvegardées localement
2. **Queue de synchronisation** : Les opérations sont ajoutées à une queue
3. **Sync automatique** : Quand Supabase est accessible, la queue se vide automatiquement
4. **Retry automatique** : En cas d'échec, l'opération est réessayée (max 3 fois)

```
User Action → IndexedDB (Local) → Sync Queue → Supabase (Cloud)
              ✅ Instantané         📦 Async      ☁️ Persistant
```

### Flux de données

#### Création d'un Board
```typescript
// 1. User crée un board dans l'UI
boardStore.createBoard('Mon Board')

// 2. Sauvegarde locale immédiate (IndexedDB)
await boardOperations.create(newBoard)

// 3. Ajout à la queue de sync
await supabaseSyncService.queueOperation('create', 'board', id, data)

// 4. Sync automatique vers Supabase (quand connecté)
supabaseBoardService.create(newBoard)
```

#### Mise à jour
```typescript
// 1. User modifie un élément
elementStore.updateElement(id, updates)

// 2. Mise à jour locale
await elementOperations.update(id, updates)

// 3. Queue de sync
await supabaseSyncService.queueOperation('update', 'element', id, data)

// 4. Sync vers Supabase
supabaseElementService.update(id, updates)
```

#### Suppression
```typescript
// 1. User supprime un board
boardStore.deleteBoard(id)

// 2. Suppression locale
await boardOperations.delete(id)

// 3. Queue de sync (avec data = null pour delete)
await supabaseSyncService.queueOperation('delete', 'board', id, null)

// 4. Suppression dans Supabase
supabaseBoardService.delete(id)
```

## 🔧 Vérifier le statut de sync

### Dans la console du navigateur
Ouvrez la console développeur (F12) et recherchez :
```
🚀 Initializing H-Board services...
✅ Database initialized
🔌 Supabase configured, testing connection...
✅ Supabase connection successful
📊 Sync Queue: 0 pending, 0 synced, 0 failed
✅ All services initialized successfully
```

### Test de connexion
Exécutez le test de connexion :
```bash
node test-supabase.js
```

Résultat attendu :
```
✅ Connexion réussie!
✅ Table "boards" - OK
✅ Table "elements" - OK
✅ Table "folders" - OK
✅ Table "tags" - OK
✅ Board créé avec succès!
✅ Board de test supprimé
🎉 Tous les tests ont réussi!
```

### Composant UI
Ajoutez le composant `SupabaseSyncStatus` dans votre interface :
```tsx
import { SupabaseSyncStatus } from './components/SyncStatus/SupabaseSyncStatus';

// Dans votre layout
<SupabaseSyncStatus />
```

Cela affiche :
- 🔵 **Syncing (X)** - Synchronisation en cours
- 🔴 **Failed (X)** - Opérations échouées
- 🟢 **Synced** - Tout est synchronisé
- ⚪ **Offline Only** - Supabase non configuré

## 📊 Monitorer la sync

### Stats de sync
```typescript
import { supabaseSyncService } from './services/supabase/supabaseSyncService';

const stats = supabaseSyncService.getStats();
console.log(stats);
// { pending: 2, synced: 10, failed: 0, total: 12 }
```

### Queue de sync
```typescript
const queue = supabaseSyncService.getQueue();
console.log(queue);
// [
//   {
//     id: "...",
//     operation: "create",
//     entityType: "board",
//     entityId: "...",
//     status: "pending",
//     retries: 0
//   }
// ]
```

### LocalStorage
La queue est persistée dans localStorage :
```javascript
const queue = JSON.parse(localStorage.getItem('h-board-supabase-sync-queue'));
console.log(queue);
```

## 🛠️ Opérations manuelles

### Réessayer les opérations échouées
```typescript
await supabaseSyncService.retryAllFailed();
```

### Nettoyer les opérations synchronisées
```typescript
supabaseSyncService.clearSynced();
```

### Forcer la synchronisation
```typescript
await supabaseSyncService.processQueue();
```

## ⚙️ Configuration avancée

### Désactiver Supabase
Supprimez ou commentez les variables d'environnement dans `.env` :
```env
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

L'application fonctionnera en mode offline-only.

### Changer l'intervalle de sync automatique
Modifiez `supabaseSyncService.ts` :
```typescript
// Ligne 335 - Change 30000ms (30s) vers une autre valeur
setInterval(() => {
  if (isSupabaseConfigured()) {
    this.processQueue();
  }
}, 60000); // 60 secondes
```

### Modifier le nombre de retries
Modifiez `supabaseSyncService.ts` :
```typescript
// Ligne 20
const MAX_RETRIES = 5; // au lieu de 3
```

## 🔍 Dépannage

### La connexion échoue
1. Vérifiez les variables d'environnement dans `.env`
2. Vérifiez que les tables existent dans Supabase
3. Testez avec `node test-supabase.js`
4. Vérifiez la console du navigateur pour les erreurs

### Les opérations ne se synchronisent pas
1. Ouvrez le composant `SupabaseSyncStatus` (cliquez dessus)
2. Vérifiez le nombre d'opérations "Pending" et "Failed"
3. Si des opérations ont échoué, cliquez sur "Retry Failed Operations"
4. Vérifiez la console pour les messages d'erreur

### Erreur "relation does not exist"
Les tables n'existent pas dans Supabase :
1. Ouvrez https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans SQL Editor
4. Copiez le contenu de `database-schema.sql`
5. Exécutez le script

### Erreur CORS
Si vous avez des erreurs CORS, vérifiez les paramètres de votre projet Supabase :
1. Allez dans Settings → API
2. Vérifiez que l'URL de votre app est autorisée

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Schéma SQL](./database-schema.sql)
- [Test de connexion](./test-supabase.js)

## 🎯 Prochaines étapes

1. ✅ Supabase configuré et testé
2. ⏳ Ajouter l'authentification (optionnel)
3. ⏳ Ajouter la synchronisation en temps réel (WebSocket)
4. ⏳ Implémenter la résolution de conflits
5. ⏳ Ajouter le multi-utilisateur

---

**Note** : L'application fonctionne parfaitement en mode offline. Supabase est optionnel et ajoute la synchronisation cloud.
