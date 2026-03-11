/**
 * Minimal Realtime Test
 * Tests if Supabase Realtime is working at all
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RealtimeTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [channelStatus, setChannelStatus] = useState<string>('NOT_STARTED');

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (!supabase) {
      addLog('❌ Supabase not configured');
      return;
    }

    addLog('🚀 Starting minimal Realtime test...');

    // Test 1: Simple channel without any subscriptions
    addLog('📡 Creating basic channel...');
    const testChannel = supabase.channel('test-minimal');

    testChannel.subscribe((status) => {
      addLog(`📊 Channel status: ${status}`);
      setChannelStatus(status);

      if (status === 'SUBSCRIBED') {
        addLog('✅ SUCCESS! Realtime is working!');
        addLog('   Your Supabase Realtime is configured correctly.');
      } else if (status === 'CHANNEL_ERROR') {
        addLog('❌ CHANNEL_ERROR detected');
        addLog('   This means Realtime is not enabled or there is a configuration issue.');
        addLog('   → Go to Supabase Dashboard > Database > Replication');
        addLog('   → Enable Realtime on your tables');
      } else if (status === 'TIMED_OUT') {
        addLog('⏱️ Connection timed out');
        addLog('   This usually means network issues or Realtime is not available.');
      }
    });

    // Cleanup
    return () => {
      addLog('🔌 Cleaning up test channel...');
      supabase!.removeChannel(testChannel);
    };
  }, []);

  // Test 2: Try to subscribe to a table
  const testTableSubscription = async () => {
    if (!supabase) {
      addLog('❌ Supabase not configured');
      return;
    }

    addLog('📋 Testing table subscription to "boards"...');

    const channel = supabase
      .channel('test-boards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
        },
        (payload) => {
          addLog(`📨 Received event: ${payload.eventType}`);
        }
      )
      .subscribe((status) => {
        addLog(`📡 Boards subscription status: ${status}`);

        if (status === 'SUBSCRIBED') {
          addLog('✅ Table subscription works!');
          addLog('   Now try inserting a board in another tab to see events.');
        } else if (status === 'CHANNEL_ERROR') {
          addLog('❌ Table subscription failed');
          addLog('   → Make sure "boards" table is enabled in Replication');
        }
      });

    // Cleanup after 30 seconds
    setTimeout(() => {
      supabase!.removeChannel(channel);
      addLog('🔕 Unsubscribed from boards channel');
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101418] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🔬 Realtime Connection Test
        </h1>

        <div className="bg-white dark:bg-[#1E252B] rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Connection Status
          </h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                channelStatus === 'SUBSCRIBED'
                  ? 'bg-green-500'
                  : channelStatus === 'CHANNEL_ERROR'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-lg font-medium text-gray-700 dark:text-[#B1B9C4]">
              {channelStatus}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E252B] rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h2>
          <button
            onClick={testTableSubscription}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Table Subscription
          </button>
        </div>

        <div className="bg-white dark:bg-[#1E252B] rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Diagnostic Logs
          </h2>
          <div className="bg-gray-100 dark:bg-[#101418] rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-gray-800 dark:text-[#B1B9C4]">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 dark:text-[#6B7280]">Waiting for logs...</div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📚 Troubleshooting Guide
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p><strong>If you see "CHANNEL_ERROR":</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to <strong>Database → Replication</strong></li>
              <li>Find the <strong>supabase_realtime</strong> publication</li>
              <li>Enable Realtime for these tables:
                <ul className="list-disc list-inside ml-6">
                  <li>presence</li>
                  <li>element_activity</li>
                  <li>boards</li>
                  <li>elements</li>
                </ul>
              </li>
              <li>Refresh this page and try again</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
