/**
 * Clear Supabase Sync Queue
 * This script clears the local sync queue to start fresh
 */

console.log('🧹 Clearing Supabase sync queue...\n');

// Check if running in browser environment
if (typeof localStorage !== 'undefined') {
  // Running in browser
  const queue = localStorage.getItem('h-board-supabase-sync-queue');

  if (queue) {
    const parsed = JSON.parse(queue);
    console.log(`Found ${parsed.length} operations in queue:`);

    // Group by status
    const byStatus = parsed.reduce((acc, op) => {
      acc[op.status] = (acc[op.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    localStorage.removeItem('h-board-supabase-sync-queue');
    console.log('\n✅ Sync queue cleared!');
    console.log('💡 Refresh the page to start fresh.');
  } else {
    console.log('ℹ️  No sync queue found.');
  }
} else {
  // Instructions for manual clearing
  console.log('This script should be run in the browser console.');
  console.log('\nTo clear the sync queue manually:');
  console.log('1. Open the browser console (F12)');
  console.log('2. Run: localStorage.removeItem("h-board-supabase-sync-queue")');
  console.log('3. Refresh the page');
}
