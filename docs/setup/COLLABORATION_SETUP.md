# 🚀 Guide d'installation de la collaboration temps réel

Ce guide vous aide à activer la collaboration temps réel dans H-Board avec Supabase.

## 📋 Ce qui a été implémenté

✅ **Synchronisation temps réel** des éléments (notes, images, colonnes, etc.)
✅ **Présence utilisateurs** (voir qui est en ligne)
✅ **Affichage des utilisateurs actifs** (avatars colorés)
✅ **Architecture prête pour Kanban et Database** (à compléter)
✅ **Indicateurs d'édition** (qui édite quoi - infrastructure prête)

## 🗄️ Étape 1: Exécuter la migration SQL

### Option A: Via l'interface Supabase (Recommandé)

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet H-Board
3. Dans le menu latéral, cliquez sur **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier:
   ```
   supabase/migrations/20241217_collaboration_tables.sql
   ```
6. Cliquez sur **Run** (ou `Ctrl+Enter`)

### Option B: Via Supabase CLI

```bash
# Assurez-vous d'avoir Supabase CLI installé
npm install -g supabase

# Liez votre projet
supabase link --project-ref <your-project-ref>

# Appliquez la migration
supabase db push
```

### Vérification

Après exécution, vous devriez voir ces tables dans votre base:
- ✅ `presence`
- ✅ `element_activity`

Et ces fonctions:
- ✅ `cleanup_stale_presence()`
- ✅ `cleanup_expired_activities()`

## 🔐 Étape 2: Activer Realtime dans Supabase

1. Dans le dashboard Supabase, allez dans **Database** > **Replication**
2. Vérifiez que ces tables sont cochées pour Realtime:
   - ✅ `elements`
   - ✅ `presence`
   - ✅ `element_activity`
   - ✅ `kanban_columns` (si vous utilisez Kanban)
   - ✅ `kanban_cards` (si vous utilisez Kanban)
   - ✅ `database_properties` (si vous utilisez Database)
   - ✅ `database_rows` (si vous utilisez Database)

3. Cliquez sur **Save** si vous avez fait des changements

## ✅ Étape 3: Tester la collaboration

### Test simple (2 onglets)

1. Ouvrez votre application dans un premier onglet: `http://localhost:5173`
2. Ouvrez le même board dans un deuxième onglet
3. Vous devriez voir:
   - 👥 **2 utilisateurs actifs** en haut à droite
   - 🎨 Avatars colorés avec initiales
   - 🔄 Les modifications dans un onglet apparaissent dans l'autre

### Test de synchronisation

Dans le **premier onglet**:
- Créez une note (cliquez sur l'icône Note dans la toolbar)

Dans le **deuxième onglet**:
- La note devrait apparaître **automatiquement** en ~200ms

### Vérifier dans la console

Ouvrez la console (`F12`) et vous verrez:
```
✅ Real-time sync initialized for board: <boardId>
✅ Collaboration channel subscribed
🔵 Remote element created: {...}
```

## 🎨 Personnalisation

### Changer les couleurs utilisateurs

Éditez `src/types/collaboration.ts`:
```typescript
export const USER_COLORS = [
  '#FF0000', // Rouge
  '#00FF00', // Vert
  // ... ajoutez vos couleurs
];
```

### Désactiver la collaboration

Dans `src/pages/CanvasPage.tsx`:
```typescript
useRealtimeSync({
  boardId: boardId || '',
  userId,
  enabled: false, // ← Mettre à false
});
```

### Changer le nom d'utilisateur

Dans `src/pages/CanvasPage.tsx`:
```typescript
const { activeUsers } = usePresence({
  boardId: boardId || '',
  userId,
  userName: 'Votre Nom Ici', // ← Personnaliser
  enabled: !!boardId,
});
```

## 🐛 Dépannage

### Problème: Les utilisateurs n'apparaissent pas

**Solution:**
1. Vérifiez que la migration SQL a bien été exécutée
2. Vérifiez que Realtime est activé pour la table `presence`
3. Ouvrez la console et vérifiez les logs

### Problème: Les modifications ne se synchronisent pas

**Solution:**
1. Vérifiez que Realtime est activé pour la table `elements`
2. Vérifiez votre connexion Supabase dans `.env`:
   ```
   VITE_SUPABASE_URL=<your-url>
   VITE_SUPABASE_ANON_KEY=<your-key>
   ```
3. Vérifiez les logs dans la console

### Problème: Erreur "table presence does not exist"

**Solution:**
La migration SQL n'a pas été exécutée. Retournez à l'Étape 1.

### Problème: Latence importante (>1 seconde)

**Causes possibles:**
- Connexion internet lente
- Serveur Supabase distant (Europe vs USA)
- Trop de données synchronisées

**Solutions:**
- Vérifiez votre connexion
- Utilisez un serveur Supabase plus proche
- Optimisez les données (ne sync que le nécessaire)

## 📊 Limites actuelles

- ⚠️ **Max 200 connexions simultanées** (plan gratuit Supabase)
- ⚠️ **Latence ~100-300ms** (acceptable pour 10 users)
- ⚠️ **Last-write-wins** pour les conflits (pas de merge automatique)

## 🚀 Prochaines étapes (optionnel)

### Ajouter l'authentification

Remplacez le userId généré aléatoirement par un vrai système d'auth:

```typescript
// src/pages/CanvasPage.tsx
import { useAuth } from './hooks/useAuth'; // Votre hook d'auth

const { user } = useAuth();

useRealtimeSync({
  boardId: boardId || '',
  userId: user.id, // ← ID de votre système d'auth
  enabled: !!boardId && !!user,
});
```

### Ajouter les curseurs (optionnel)

Dans `src/services/collaboration/supabaseCollaboration.ts`, changez:
```typescript
await service.initialize(boardId, userId, {
  enablePresence: true,
  enableCursors: true, // ← Activer les curseurs
  enableEditingIndicators: true,
});
```

### Étendre à Kanban et Database

Les hooks sont déjà configurés pour écouter Kanban et Database.
Il suffit d'ajouter la logique dans les stores respectifs.

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Guide de présence](https://supabase.com/docs/guides/realtime/presence)
- [Gestion des conflits](https://supabase.com/docs/guides/realtime/broadcast)

## 💬 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de la console
2. Vérifiez le dashboard Supabase
3. Consultez cette documentation

Bonne collaboration! 🎉
