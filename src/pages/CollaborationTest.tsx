/**
 * Collaboration Test Page
 * Debug page to test collaboration features
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { usePresence } from '../hooks/usePresence';
import { getCollaborationService } from '../services/collaboration/collaborationService';

export default function CollaborationTest() {
  const { boardId } = useParams<{ boardId: string }>();
  const [logs, setLogs] = useState<string[]>([]);
  const [userId] = useState(() => {
    let id = localStorage.getItem('h-board-user-id');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('h-board-user-id', id);
    }
    return id;
  });

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test collaboration hooks
  const testBoardId = boardId || 'test-board-collab';

  const { isConnected } = useRealtimeSync({
    boardId: testBoardId,
    userId,
    enabled: true,
  });

  const { activeUsers } = usePresence({
    boardId: testBoardId,
    userId,
    userName: `User ${userId.slice(0, 8)}`,
    enabled: true,
  });

  useEffect(() => {
    addLog('🚀 Collaboration Test Started');
    addLog(`📋 Board ID: ${testBoardId}`);
    addLog(`👤 User ID: ${userId}`);
    addLog(`⚙️  Supabase configured: ${isSupabaseConfigured()}`);

    if (!isSupabaseConfigured()) {
      addLog('❌ Supabase is not configured!');
      return;
    }

    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { error } = await supabase!.from('boards').select('count').limit(1);
        if (error) {
          addLog(`❌ Supabase connection error: ${error.message}`);
        } else {
          addLog('✅ Supabase connection successful');
        }
      } catch (err: any) {
        addLog(`❌ Supabase connection failed: ${err.message}`);
      }
    };

    // Check if boards exist
    const checkBoards = async () => {
      try {
        const { data, error } = await supabase!.from('boards').select('id, name').limit(10);
        if (error) {
          addLog(`❌ Failed to fetch boards: ${error.message}`);
        } else {
          addLog(`📋 Boards in Supabase: ${data?.length || 0}`);
          data?.forEach((board) => {
            addLog(`  - ${board.name} (${board.id})`);
          });

          if (data && data.length === 0) {
            addLog('⚠️  WARNING: No boards found in Supabase!');
            addLog('   You need to create a board first or sync your local boards to Supabase');
          }
        }
      } catch (err: any) {
        addLog(`❌ Failed to check boards: ${err.message}`);
      }
    };

    // Check if current board exists
    const checkCurrentBoard = async () => {
      try {
        const { data, error } = await supabase!
          .from('boards')
          .select('id, name')
          .eq('id', testBoardId)
          .single();

        if (error) {
          addLog(`❌ Current board '${testBoardId}' does NOT exist in Supabase`);
          addLog(`   Error: ${error.message}`);
        } else {
          addLog(`✅ Current board '${data.name}' exists in Supabase`);
        }
      } catch (err: any) {
        addLog(`❌ Failed to check current board: ${err.message}`);
      }
    };

    // Test presence table
    const testPresenceTable = async () => {
      try {
        const { data, error } = await supabase!.from('presence').select('*').limit(1);
        if (error) {
          addLog(`❌ Presence table error: ${error.message}`);
        } else {
          addLog(`✅ Presence table accessible (${data?.length || 0} rows)`);
        }
      } catch (err: any) {
        addLog(`❌ Presence table failed: ${err.message}`);
      }
    };

    // Test element_activity table
    const testElementActivityTable = async () => {
      try {
        const { data, error } = await supabase!.from('element_activity').select('*').limit(1);
        if (error) {
          addLog(`❌ Element activity table error: ${error.message}`);
        } else {
          addLog(`✅ Element activity table accessible (${data?.length || 0} rows)`);
        }
      } catch (err: any) {
        addLog(`❌ Element activity table failed: ${err.message}`);
      }
    };

    // Test collaboration service
    const testCollaborationService = async () => {
      try {
        const service = getCollaborationService();
        addLog('✅ Collaboration service created');

        // Subscribe to presence
        service.subscribeToPresence((users) => {
          addLog(`👥 Presence updated: ${users.length} users`);
        });
      } catch (err: any) {
        addLog(`❌ Collaboration service failed: ${err.message}`);
      }
    };

    testConnection();
    checkBoards();
    checkCurrentBoard();
    testPresenceTable();
    testElementActivityTable();
    testCollaborationService();
  }, [testBoardId, userId]);

  useEffect(() => {
    addLog(`🔌 Realtime sync connected: ${isConnected}`);
  }, [isConnected]);

  useEffect(() => {
    addLog(`👥 Active users count: ${activeUsers.length}`);
    activeUsers.forEach((user) => {
      addLog(`  - ${user.name} (${user.id})`);
    });
  }, [activeUsers]);

  // Manual test: Create test board
  const createTestBoard = async () => {
    if (!supabase) {
      addLog('❌ Supabase not configured');
      return;
    }

    addLog(`🏗️  Creating test board '${testBoardId}'...`);

    try {
      const { data, error } = await supabase
        .from('boards')
        .upsert({
          id: testBoardId,
          name: 'Collaboration Test Board',
          type: 'canvas',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          settings: {},
        })
        .select();

      if (error) {
        addLog(`❌ Failed to create board: ${error.message}`);
      } else {
        addLog(`✅ Board created successfully: ${data[0].name}`);
        addLog('   Now you can test presence!');
      }
    } catch (err: any) {
      addLog(`❌ Create board error: ${err.message}`);
    }
  };

  // Manual test: Insert presence
  const testInsertPresence = async () => {
    if (!supabase) {
      addLog('❌ Supabase not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          board_id: testBoardId,
          user_id: userId,
          user_name: `User ${userId.slice(0, 8)}`,
          user_color: '#3B82F6',
          last_seen: new Date().toISOString(),
        })
        .select();

      if (error) {
        addLog(`❌ Insert presence failed: ${error.message}`);
        if (error.code === '23503') {
          addLog('   💡 Tip: The board does not exist. Click "Create Test Board" first!');
        }
      } else {
        addLog(`✅ Presence inserted successfully`);
      }
    } catch (err: any) {
      addLog(`❌ Insert presence error: ${err.message}`);
    }
  };

  // Manual test: Subscribe to changes
  const testRealtimeSubscription = () => {
    if (!supabase) {
      addLog('❌ Supabase not configured');
      return;
    }

    addLog(`🔔 Subscribing to presence changes on board '${testBoardId}'...`);

    const channel = supabase
      .channel('test-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `board_id=eq.${testBoardId}`,
        },
        (payload) => {
          addLog(`📨 Realtime event: ${payload.eventType}`);
          addLog(`   Data: ${JSON.stringify(payload.new || payload.old)}`);
        }
      )
      .subscribe((status) => {
        addLog(`📡 Subscription status: ${status}`);
      });

    // Cleanup after 30 seconds
    setTimeout(() => {
      channel.unsubscribe();
      addLog('🔕 Unsubscribed from test channel');
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🧪 Collaboration Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Board ID:</span>
              <span className="text-gray-600 dark:text-gray-400">{testBoardId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">User ID:</span>
              <span className="text-gray-600 dark:text-gray-400">{userId.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Supabase:</span>
              <span className={isSupabaseConfigured() ? 'text-green-600' : 'text-red-600'}>
                {isSupabaseConfigured() ? '✅ Configured' : '❌ Not configured'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Realtime Sync:</span>
              <span className={isConnected ? 'text-green-600' : 'text-yellow-600'}>
                {isConnected ? '✅ Connected' : '⏳ Connecting...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Active Users:</span>
              <span className="text-gray-600 dark:text-gray-400">{activeUsers.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Manual Tests
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={createTestBoard}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              1️⃣ Create Test Board
            </button>
            <button
              onClick={testInsertPresence}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              2️⃣ Insert Presence
            </button>
            <button
              onClick={testRealtimeSubscription}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              3️⃣ Subscribe to Changes
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            💡 Click buttons in order: First create a test board, then insert presence, then subscribe to see real-time updates
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Logs
          </h2>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-gray-800 dark:text-gray-300">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 dark:text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
