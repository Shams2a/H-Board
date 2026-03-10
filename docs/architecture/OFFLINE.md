# H-Board - Configuration Offline & PWA

## 🎉 L'application est maintenant une PWA complète !

H-Board fonctionne **complètement offline** et peut être installée comme une application native sur votre ordinateur ou téléphone.

## ✨ Fonctionnalités Offline

### Actuellement disponible
- ✅ **Stockage local** : Toutes vos données sont stockées dans IndexedDB
- ✅ **Cache LRU intelligent** : Max 3 boards en cache (configurable)
- ✅ **Nettoyage automatique** : Boards non utilisés depuis 7 jours sont supprimés
- ✅ **Service Worker** : Assets (JS, CSS, HTML) mis en cache
- ✅ **Installable** : Peut être installée comme une app native
- ✅ **Queue de synchronisation** : Les changements sont trackés pour sync future
- ✅ **Indicateur de statut** : Montre l'état online/offline et sync

### Cache Strategy
- **Local-first** : Les données sont d'abord stockées localement
- **Sync when online** : Synchronisation automatique quand la connexion revient
- **Minimal storage** : Cible < 1MB total (~3 boards)
- **Smart eviction** : LRU (Least Recently Used)

## 📱 Installation en tant qu'app

### Sur Desktop (Chrome, Edge, Brave)
1. Ouvrez l'application dans votre navigateur
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Ou Menu → "Installer H-Board"

### Sur Mobile (Chrome, Safari)
1. Ouvrez l'application dans votre navigateur
2. Menu → "Ajouter à l'écran d'accueil"

## 🔧 Configuration de l'API (Future)

Quand vous aurez créé votre backend API, ajoutez cette ligne dans `src/main.tsx` :

```typescript
import { configureAPI } from './services/init'

// Après initializeServices()
configureAPI('http://localhost:3000/api') // Votre URL d'API
```

### Endpoints API nécessaires

Votre API devra exposer ces endpoints :

```
GET    /api/health              # Health check
GET    /api/boards              # Liste des boards
GET    /api/boards/:id          # Board spécifique
POST   /api/boards              # Créer un board
PUT    /api/boards/:id          # Mettre à jour un board
DELETE /api/boards/:id          # Supprimer un board
GET    /api/boards/:id/elements # Éléments d'un board
POST   /api/elements            # Créer un élément
PUT    /api/elements/:id        # Mettre à jour un élément
DELETE /api/elements/:id        # Supprimer un élément
```

## ⚙️ Configuration du stockage

Les paramètres par défaut peuvent être modifiés via l'interface (à venir) ou directement :

```typescript
import { storageManager } from './services/StorageManager'

// Modifier les paramètres
await storageManager.updateSettings({
  maxCachedBoards: 5,        // Au lieu de 3
  cacheExpiryDays: 14,       // Au lieu de 7
  autoCleanup: true,         // Nettoyage automatique
  storeImagesLocally: false  // Économie d'espace
})
```

## 🔍 Monitoring

### Console du navigateur
Ouvrez la console (F12) pour voir les logs :
- 🚀 Initialisation des services
- 📊 Statistiques de stockage
- 🌐 État de connexion
- ✅ Synchronisation

### Indicateur UI
L'indicateur en haut à droite montre :
- État de connexion (online/offline)
- État du serveur
- Opérations en attente
- Stockage utilisé
- Boards en cache

## 🛠️ Développement

### Build pour production
```bash
npm run build
```

### Preview du build
```bash
npm run preview
```

### Test PWA en dev
La PWA est activée même en mode dev (`devOptions.enabled: true`). Vous pouvez tester :
- L'installation
- Le mode offline (DevTools → Network → Offline)
- Les mises à jour du service worker

## 📦 Structure des services

```
src/services/
├── init.ts              # Initialisation
├── StorageManager.ts    # Gestion du cache LRU
├── ConnectionService.ts # Détection online/offline
├── SyncService.ts       # Queue et sync API
└── CacheManager.ts      # Chargement des boards
```

## 💾 Stockage des données

### IndexedDB Tables
- `boards` : Métadonnées des boards
- `elements` : Éléments du canvas
- `folders` : Organisation
- `syncQueue` : Opérations en attente
- `cacheMetadata` : Info de cache LRU
- `settings` : Paramètres utilisateur

### Service Worker Cache
- Assets statiques (JS, CSS, HTML)
- Fonts (Google Fonts)
- Images (optionnel)

## 🚨 Limitations actuelles

- **Pas d'API backend** : L'app fonctionne en mode local uniquement
- **Pas de sync multi-device** : Jusqu'à ce que l'API soit configurée
- **Images non cachées** : Pour économiser l'espace (configurable)

## 📝 Notes

- Les icônes PWA actuelles sont des placeholders avec un "H"
- Vous pouvez les remplacer dans `public/` avec vos propres icônes
- Le manifest est auto-généré par Vite PWA
- Le service worker se met à jour automatiquement

---

**Profitez de H-Board offline !** 🎨
