# ⚡ 5 Minutes pour compléter à 100%

Si vous voulez compléter les features optionnelles, voici le guide express:

## 📋 Database Boards Sync (5 minutes)

### Étape 1: Ajouter les méthodes dans `src/store/databaseStore.ts`

**Cherchez la ligne avec `clearDatabase`** et ajoutez APRÈS:

```typescript
  // Realtime sync helpers
  addPropertyFromRemote: (property: DatabaseProperty) => {
    set((state) => {
      const boardProperties = state.properties[property.boardId] || [];
      if (boardProperties.some(p => p.id === property.id)) {
        return state;
      }
      return {
        properties: {
          ...state.properties,
          [property.boardId]: [...boardProperties, property]
        }
      };
    });
  },

  updatePropertyFromRemote: (property: DatabaseProperty) => {
    set((state) => ({
      properties: {
        ...state.properties,
        [property.boardId]: (state.properties[property.boardId] || []).map(p =>
          p.id === property.id ? property : p
        )
      }
    }));
  },

  deletePropertyFromRemote: (propertyId: string) => {
    set((state) => {
      const updatedProperties: Record<string, DatabaseProperty[]> = {};
      Object.entries(state.properties).forEach(([boardId, properties]) => {
        updatedProperties[boardId] = properties.filter(p => p.id !== propertyId);
      });
      return { properties: updatedProperties };
    });
  },

  addRowFromRemote: (row: DatabaseRow) => {
    set((state) => {
      const boardRows = state.rows[row.boardId] || [];
      if (boardRows.some(r => r.id === row.id)) {
        return state;
      }
      return {
        rows: {
          ...state.rows,
          [row.boardId]: [...boardRows, row]
        }
      };
    });
  },

  updateRowFromRemote: (row: DatabaseRow) => {
    set((state) => ({
      rows: {
        ...state.rows,
        [row.boardId]: (state.rows[row.boardId] || []).map(r =>
          r.id === row.id ? row : r
        )
      }
    }));
  },

  deleteRowFromRemote: (rowId: string) => {
    set((state) => {
      const updatedRows: Record<string, DatabaseRow[]> = {};
      Object.entries(state.rows).forEach(([boardId, rows]) => {
        updatedRows[boardId] = rows.filter(r => r.id !== rowId);
      });
      return { rows: updatedRows };
    });
  },
```

### Étape 2: Ajouter les types dans l'interface

**Cherchez `interface DatabaseStore`** et ajoutez:

```typescript
  // Realtime sync helpers (called by collaboration service)
  addPropertyFromRemote: (property: DatabaseProperty) => void;
  updatePropertyFromRemote: (property: DatabaseProperty) => void;
  deletePropertyFromRemote: (propertyId: string) => void;
  addRowFromRemote: (row: DatabaseRow) => void;
  updateRowFromRemote: (row: DatabaseRow) => void;
  deleteRowFromRemote: (rowId: string) => void;
```

### Étape 3: Utiliser dans `src/hooks/useRealtimeSync.ts`

**Ligne 43, remplacez:**
```typescript
const { properties, rows } = useDatabaseStore();
```

**Par:**
```typescript
const {
  addPropertyFromRemote,
  updatePropertyFromRemote,
  deletePropertyFromRemote,
  addRowFromRemote,
  updateRowFromRemote,
  deleteRowFromRemote
} = useDatabaseStore();
```

**Lignes 152-185, remplacez les callbacks par:**
```typescript
      // Subscribe to database_properties table (Database boards)
      service.subscribeToTable(
        'database_properties',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            if (payload.new) {
              console.log('🔵 Remote database property created:', payload.new);
              addPropertyFromRemote(payload.new);
            }
          },
          onUpdate: (payload) => {
            if (payload.new) {
              console.log('🟡 Remote database property updated:', payload.new);
              updatePropertyFromRemote(payload.new);
            }
          },
          onDelete: (payload) => {
            if (payload.old) {
              console.log('🔴 Remote database property deleted:', payload.old.id);
              deletePropertyFromRemote(payload.old.id);
            }
          },
        }
      );

      // Subscribe to database_rows table (Database boards)
      service.subscribeToTable(
        'database_rows',
        { board_id: boardId },
        {
          onInsert: (payload) => {
            if (payload.new) {
              console.log('🔵 Remote database row created:', payload.new);
              addRowFromRemote(payload.new);
            }
          },
          onUpdate: (payload) => {
            if (payload.new) {
              console.log('🟡 Remote database row updated:', payload.new);
              updateRowFromRemote(payload.new);
            }
          },
          onDelete: (payload) => {
            if (payload.old) {
              console.log('🔴 Remote database row deleted:', payload.old.id);
              deleteRowFromRemote(payload.old.id);
            }
          },
        }
      );
```

**Terminé!** Database boards sync maintenant en temps réel! ✅

---

## 🎨 Curseurs (Optionnel, 15 minutes)

Voir le fichier `COLLABORATION_FEATURES_FINAL.md` section 6.

---

## ✏️ Indicateurs d'édition (Optionnel, 30 minutes)

Voir le fichier `COLLABORATION_FEATURES_FINAL.md` section 7.

---

## ✅ Checklist finale

- [ ] Migration SQL exécutée dans Supabase
- [ ] Realtime activé pour les tables
- [ ] Testé avec 2 onglets sur Canvas board
- [ ] Testé avec 2 onglets sur Kanban board
- [ ] (Optionnel) Méthodes Database ajoutées
- [ ] (Optionnel) Testé Database board
- [ ] (Optionnel) Curseurs activés
- [ ] (Optionnel) Indicateurs d'édition ajoutés

**Temps total avec Database:** 5-10 minutes
**Temps total avec tout:** 1-2 heures

Bon coding! 🚀
