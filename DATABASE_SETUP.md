# Configuration de la Synchronisation avec la Base de Données

## Vue d'ensemble

H-Board implémente une architecture **offline-first** avec synchronisation automatique vers une base de données distante.

### Fonctionnalités

- ✅ **Offline-first**: Toutes les opérations sont sauvegardées localement (IndexedDB)
- ✅ **Sync automatique**: Synchronisation vers l'API quand en ligne
- ✅ **Queue de sync**: File d'attente des opérations en attente
- ✅ **Retry automatique**: Réessaie automatique en cas d'échec (max 3 fois)
- ✅ **Indicateur de statut**: Visualisation temps-réel de l'état de synchronisation
- ✅ **Mode hors-ligne**: Continue à fonctionner sans connexion

## Architecture

```
Frontend (React) → IndexedDB (Local) → SyncService → API Backend → PostgreSQL/MySQL
                   ↑ Always available    ↑ Queue      ↑ When online
```

## Configuration

### 1. Variable d'Environnement

Créez un fichier `.env` à la racine du projet:

```env
# URL de l'API Backend
VITE_API_URL=http://localhost:3000/api
```

**Exemples selon l'environnement:**

```env
# Développement local
VITE_API_URL=http://localhost:3000/api

# Staging
VITE_API_URL=https://staging-api.h-board.com/api

# Production
VITE_API_URL=https://api.h-board.com/api
```

### 2. Démarrer l'Application

```bash
npm install
npm run dev
```

L'application démarrera en mode **offline-first**. Les opérations seront sauvegardées localement et synchronisées quand le backend sera disponible.

## Structure de l'API Backend

### Schéma SQL

Le schéma SQL complet est disponible dans `database-schema.sql`. Il inclut:

- **Tables**: boards, elements, folders, tags, sync_operations
- **Relations**: Foreign keys, cascades, contraintes
- **Indexes**: Optimisations pour requêtes communes
- **Triggers**: Mise à jour automatique des timestamps

### Endpoints API Requis

Le backend doit implémenter les endpoints suivants:

#### Health Check
```
GET /api/health
```

#### Boards
```
GET    /api/boards              # Liste tous les boards
GET    /api/boards/:id          # Board par ID
POST   /api/boards              # Créer un board
PATCH  /api/boards/:id          # Mettre à jour un board
DELETE /api/boards/:id          # Supprimer un board
GET    /api/boards/folder/:id   # Boards d'un folder
GET    /api/boards/:id/children # Sub-boards
```

#### Elements
```
GET    /api/elements/board/:boardId  # Elements d'un board
GET    /api/elements/:id             # Element par ID
POST   /api/elements                 # Créer un element
PATCH  /api/elements/:id             # Mettre à jour un element
DELETE /api/elements/:id             # Supprimer un element
PATCH  /api/elements/bulk            # Mise à jour groupée
```

#### Folders
```
GET    /api/folders              # Liste tous les folders
GET    /api/folders/:id          # Folder par ID
POST   /api/folders              # Créer un folder
PATCH  /api/folders/:id          # Mettre à jour un folder
DELETE /api/folders/:id          # Supprimer un folder
GET    /api/folders/roots        # Folders racine
```

### Format des Données

Tous les endpoints doivent retourner des réponses au format JSON:

**Succès:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Erreur:**
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## Services Frontend

### 1. API Client (`/src/services/api.ts`)

Service HTTP générique avec méthodes GET, POST, PUT, PATCH, DELETE.

```typescript
import { apiClient } from './services/api';

const response = await apiClient.get('/boards');
```

### 2. Services API Spécifiques

- **boardApi.ts**: Opérations CRUD pour les boards
- **elementApi.ts**: Opérations CRUD pour les elements
- **folderApi.ts**: Opérations CRUD pour les folders

```typescript
import { boardApi } from './services/boardApi';

const response = await boardApi.getAll();
```

### 3. SyncService (`/src/services/SyncService.ts`)

Gère la queue de synchronisation et la communication avec l'API.

**Méthodes principales:**
- `queueOperation()`: Ajouter une opération à la queue
- `processQueue()`: Traiter la queue
- `getStats()`: Obtenir les statistiques de sync
- `retryAllFailed()`: Réessayer toutes les opérations échouées

### 4. ConnectionService (`/src/services/ConnectionService.ts`)

Détecte l'état online/offline et la disponibilité du serveur.

**Méthodes principales:**
- `configureServerEndpoint()`: Configurer l'endpoint de health check
- `isOnline()`: Vérifier si en ligne
- `isServerReachable()`: Vérifier si le serveur est accessible
- `subscribe()`: S'abonner aux changements de connexion

## Utilisation dans les Stores

Les stores Zustand (boardStore, elementStore, folderStore) sont déjà intégrés:

```typescript
// Exemple: Créer un board
const { createBoard } = useBoardStore();

// 1. Sauvegarde locale (IndexedDB)
const newBoard = await boardOperations.create(board);

// 2. Queue pour sync
await syncService.queueOperation('create', 'board', newBoard.id, newBoard);

// 3. Sync automatique quand online
```

## Interface Utilisateur

### SyncStatusIndicator

Composant affichant l'état de synchronisation en temps réel:

- **Offline**: Icône grise "Hors ligne"
- **Server Unreachable**: Icône orange "Serveur inaccessible"
- **Syncing**: Icône bleue tournante "Synchronisation en cours"
- **Synced**: Icône verte "Synchronisé"
- **Error**: Icône rouge "Erreur de sync"

**Emplacement:**
- Dashboard: En haut à droite
- Canvas: En haut à droite

**Fonctionnalités:**
- Cliquer pour voir les détails
- Statistiques de sync (pending, synced, failed)
- Boutons "Retry Failed" et "Clear Synced"

## Mode de Développement

### Sans Backend

L'application fonctionne parfaitement sans backend configuré:

1. Toutes les données sont stockées dans IndexedDB
2. Les opérations sont ajoutées à la queue de sync
3. L'indicateur affiche "Server Unreachable"
4. Aucune perte de données

### Tester la Sync

1. **Démarrer sans backend:**
   ```bash
   npm run dev
   ```

2. **Créer des boards/elements:**
   - Les opérations sont ajoutées à la queue
   - Visibles dans le SyncStatusIndicator

3. **Démarrer le backend:**
   ```bash
   # Dans un autre terminal
   cd backend
   npm start
   ```

4. **La sync démarre automatiquement:**
   - La queue se vide progressivement
   - L'indicateur passe au vert "Synced"

## Monitoring & Debug

### Console Logs

Le SyncService affiche des logs détaillés:

```
🌐 Network: Online
✅ Server is reachable
🔄 Syncing 5 items...
✅ Synced board:create abc-123
❌ Failed to sync element:update def-456
🔄 Retrying operation xyz-789 in 2000ms (attempt 1/3)
✅ Sync complete. 4 synced, 1 failed
```

### LocalStorage

La queue de sync est persistée dans localStorage:

```javascript
// Inspecter la queue
const queue = JSON.parse(localStorage.getItem('h-board-sync-queue'));
console.log(queue);
```

### Stats de Sync

```typescript
import { syncService } from './services/SyncService';

const stats = await syncService.getStats();
console.log(stats);
// { pending: 2, synced: 10, failed: 0, total: 12 }
```

## Dépannage

### Le serveur n'est pas détecté

1. Vérifier l'URL dans `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

2. Vérifier le endpoint `/health`:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Configurer CORS sur le backend:
   ```javascript
   app.use(cors({
     origin: 'http://localhost:5173',
     credentials: true
   }));
   ```

### Les opérations ne se synchronisent pas

1. Vérifier le statut:
   - Ouvrir le SyncStatusIndicator
   - Vérifier "pending" et "failed"

2. Vérifier les erreurs:
   - Ouvrir la console développeur
   - Chercher les messages d'erreur du SyncService

3. Réessayer manuellement:
   - Cliquer sur "Retry Failed" dans le SyncStatusIndicator

### Réinitialiser la Queue

Si la queue est corrompue:

```javascript
// Dans la console développeur
localStorage.removeItem('h-board-sync-queue');
location.reload();
```

## Sécurité

### Actuellement (Sans Auth)

- ✅ CORS configuré pour origines autorisées
- ✅ Validation des données côté backend
- ⚠️ Pas d'authentification (à implémenter)

### Future Implémentation Auth

Pour ajouter l'authentification:

1. Créer un `authStore` Zustand
2. Ajouter JWT tokens dans les headers API
3. Implémenter login/logout
4. Protected routes avec React Router

## Performance

### Optimisations Implémentées

- **Batch Updates**: `bulkUpdate()` pour plusieurs elements
- **Debouncing**: Les updates fréquents sont groupés
- **LRU Cache**: Cache intelligent des boards récents
- **Lazy Loading**: Chargement à la demande des elements

### Recommandations

- Limiter les updates fréquents (debounce 300ms minimum)
- Utiliser `bulkUpdate` pour 3+ elements
- Nettoyer régulièrement les opérations synchronisées

## Prochaines Étapes

1. **Backend**: Implémenter l'API Node.js + Express
2. **Database**: Créer la base de données avec `database-schema.sql`
3. **Auth**: Ajouter système d'authentification
4. **WebSocket**: Real-time sync entre utilisateurs
5. **Conflict Resolution**: Gestion des conflits de synchronisation

## Ressources

- [Schéma SQL](./database-schema.sql)
- [API Client](./src/services/api.ts)
- [Sync Service](./src/services/SyncService.ts)
- [Connection Service](./src/services/ConnectionService.ts)

---

**Note**: L'application fonctionne parfaitement en mode offline. La synchronisation est une fonctionnalité optionnelle qui permet de sauvegarder les données sur un serveur distant.
