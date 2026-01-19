# Architecture Sync & Collaboration

## Vue d'ensemble

```
┌─────────────────┐
│   Client A      │
│   (Browser)     │
└────┬────────────┘
     │
     ├─── IndexedDB (local) ◄──┐
     │                         │
     ├─── React State ◄────────┤── Realtime (WebSocket)
     │                         │
     └─── Supabase DB ◄────────┘
```

## Deux systèmes complémentaires

### 1. **Sync Service** (IndexedDB ↔ Supabase DB)
- **Rôle**: Persistance à long terme, backup
- **Direction**: Bidirectionnel
- **Méthode**: REST API (UPSERT)
- **Fréquence**: Périodique (toutes les X secondes)

### 2. **Collaboration Service** (Client ↔ Client)
- **Rôle**: Temps réel entre utilisateurs
- **Direction**: Broadcast multicast
- **Méthode**: WebSocket (Realtime Broadcast)
- **Fréquence**: Immédiat

## Flux de données

### Modification locale (Client A)

```
1. User modifie élément
   ↓
2. elementStore.updateElement()
   ├─► IndexedDB: save (local)
   ├─► React State: update (UI)
   └─► Broadcast: send (autres clients)

3. [Périodiquement] syncService
   └─► Supabase DB: upsert (cloud backup)
```

### Réception modification distante (Client B)

```
1. Receive broadcast
   ↓
2. useRealtimeSync handler
   ├─► React State: update (UI immédiat)
   └─► IndexedDB: [PAS TOUCHÉ - géré par sync périodique]

3. [Périodiquement] syncService
   └─► Supabase DB → IndexedDB (si plus récent)
```

## Résolution de conflits

### Timestamp-based conflict resolution

Tous les objets ont `updatedAt`:

```typescript
// Download ne met à jour QUE si remote plus récent
if (remoteUpdated > localUpdated) {
  await db.elements.put(element);
}
```

**Scénarios**:

1. **Client A modifie, sync pas encore fait**
   - Local: updatedAt = NOW
   - Remote: updatedAt = OLD
   - Download: remote < local → **PAS d'écrasement** ✅

2. **Client B récupère via sync périodique**
   - Local: updatedAt = OLD
   - Remote: updatedAt = NOW (après upload de A)
   - Download: remote > local → **Mise à jour** ✅

3. **Modification simultanée (A et B)**
   - Last-write-wins (celui qui sync en dernier)
   - Acceptable pour un outil de collaboration simple

## Problèmes actuels et solutions

### ❌ Problème 1: Sync immédiat désactivé

**Impact**: Les modifications ne vont jamais dans Supabase DB tant qu'il n'y a pas de sync périodique

**Solution**: Réactiver mais avec upload-only immédiat

### ❌ Problème 2: onSyncComplete recharge pendant sync

**Impact**: Canvas recharge avant la fin de l'upload

**Solution**: Attendre la fin complète du sync avant callback

### ❌ Problème 3: Éléments manquants (créés avant jointure)

**Impact**: Broadcasts pour éléments inconnus sont ignorés

**Solution actuelle**: Ajouter l'élément lors de l'update ✅

## Architecture recommandée

### Option A: Upload immédiat + Sync périodique complet

```typescript
// Après modification locale
updateElement() {
  await elementOperations.update(id, updates);

  // Upload immédiat vers Supabase (pas de download)
  await newSyncService.uploadElement(id);  // Nouveau

  // Broadcast pour temps réel
  collabService.broadcast({...});
}

// Périodiquement (toutes les 30s)
setInterval(() => {
  newSyncService.syncAll();  // Download + Upload complet
}, 30000);
```

**Avantages**:
- ✅ Modifications sauvegardées immédiatement dans Supabase
- ✅ Pas de conflit (upload simple, pas de download)
- ✅ Sync périodique récupère les changements distants

**Inconvénients**:
- ⚠️ Besoin d'une nouvelle méthode uploadElement()

### Option B: Uniquement sync périodique (actuel)

```typescript
// Après modification locale
updateElement() {
  await elementOperations.update(id, updates);

  // PAS de sync immédiat

  // Broadcast pour temps réel
  collabService.broadcast({...});
}

// Périodiquement (toutes les 10s)
setInterval(() => {
  newSyncService.syncAll();  // Download + Upload complet
}, 10000);
```

**Avantages**:
- ✅ Simple, aucun conflit possible
- ✅ Pas de code supplémentaire

**Inconvénients**:
- ⚠️ Modifications dans Supabase avec délai (max 10s)
- ⚠️ Perte de données si crash avant sync

### Option C: Sync bidirectionnel immédiat (original, problématique)

**❌ NE PAS UTILISER** - Cause des race conditions

## Recommandation finale

**Option B** est la plus simple et fonctionne bien si:
- ✅ Sync périodique fréquent (5-10s)
- ✅ Acceptation d'un léger délai pour Supabase
- ✅ Broadcast gère le temps réel entre clients

**Option A** est meilleure si:
- ✅ Besoin de sauvegarde immédiate dans Supabase
- ✅ Utilisateurs ouvrent/ferment rapidement l'application
- ✅ Risque de crash/fermeture avant sync

## Monitoring et debug

### Logs à surveiller

```typescript
// Modification locale
🔧 updateElement called: { id, updates }
📤 Sending broadcast: { type: "element_updated", ... }

// Client distant
🔔 Broadcast received: { type: "element_updated", ... }
✅ Updating element in state

// Sync périodique
🔄 Starting full sync...
✅ Sync complete: X downloaded, Y uploaded
```

### Métriques importantes

- Temps entre modification et apparition chez autres clients (**< 500ms**)
- Temps entre modification et sauvegarde Supabase (**< 10s avec sync périodique**)
- Conflits de timestamp (**devrait être rare**)
