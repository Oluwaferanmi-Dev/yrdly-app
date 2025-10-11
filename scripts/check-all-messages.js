// Script to check all message-related tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllMessages() {
  try {
    console.log('🔍 Checking all message-related tables...\n');

    // Check messages table
    console.log('📋 Checking messages table:');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(10);

    if (messagesError) {
      console.log(`❌ Error with messages table: ${messagesError.message}`);
    } else {
      console.log(`✅ Found ${messages?.length || 0} messages`);
      if (messages && messages.length > 0) {
        console.log('📊 Sample message:');
        console.log(JSON.stringify(messages[0], null, 2));
      }
    }

    console.log('\n---\n');

    // Check chat_messages table
    console.log('📋 Checking chat_messages table:');
    const { data: chatMessages, error: chatMessagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(10);

    if (chatMessagesError) {
      console.log(`❌ Error with chat_messages table: ${chatMessagesError.message}`);
    } else {
      console.log(`✅ Found ${chatMessages?.length || 0} chat_messages`);
      if (chatMessages && chatMessages.length > 0) {
        console.log('📊 Sample chat_message:');
        console.log(JSON.stringify(chatMessages[0], null, 2));
      }
    }

    console.log('\n---\n');

    // Check conversations table
    console.log('📋 Checking conversations table:');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    if (convError) {
      console.log(`❌ Error with conversations table: ${convError.message}`);
    } else {
      console.log(`✅ Found ${conversations?.length || 0} conversations`);
      if (conversations && conversations.length > 0) {
        console.log('📊 Sample conversation:');
        console.log(JSON.stringify(conversations[0], null, 2));
      }
    }

    console.log('\n---\n');

    // List all tables
    console.log('📋 Available tables:');
    const tables = ['messages', 'chat_messages', 'conversations', 'users', 'posts', 'friend_requests'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${table}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Table not found or no access`);
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
checkAllMessages().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
