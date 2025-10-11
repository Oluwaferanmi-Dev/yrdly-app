// Script to explore the database structure and find image messages
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreDatabase() {
  try {
    console.log('🔍 Exploring database structure...\n');

    // Check messages table
    console.log('📋 Checking messages table:');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.log(`❌ Error with messages table: ${messagesError.message}`);
    } else {
      console.log(`✅ Found ${messages?.length || 0} messages`);
      if (messages && messages.length > 0) {
        console.log('📊 Sample message structure:');
        console.log(JSON.stringify(messages[0], null, 2));
      }
    }

    console.log('\n---\n');

    // Check if there are other message-related tables
    console.log('📋 Checking for other message tables...');
    
    // Try common table names
    const tableNames = ['chat_messages', 'conversation_messages', 'message', 'chat_message'];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Found table: ${tableName}`);
          if (data && data.length > 0) {
            console.log(`📊 Sample structure:`);
            console.log(JSON.stringify(data[0], null, 2));
          }
        }
      } catch (err) {
        // Table doesn't exist, continue
      }
    }

    console.log('\n---\n');

    // Check conversations table for any image-related fields
    console.log('📋 Checking conversations table:');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);

    if (convError) {
      console.log(`❌ Error with conversations table: ${convError.message}`);
    } else {
      console.log(`✅ Found ${conversations?.length || 0} conversations`);
      if (conversations && conversations.length > 0) {
        console.log('📊 Sample conversation structure:');
        console.log(JSON.stringify(conversations[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
exploreDatabase().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
