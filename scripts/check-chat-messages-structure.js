// Script to check the structure of chat_messages table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChatMessagesStructure() {
  try {
    console.log('🔍 Checking chat_messages table structure...');
    
    // Get a sample record to see the structure
    const { data: messages, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(3);

    if (fetchError) {
      console.error('❌ Error fetching chat_messages:', fetchError);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log('✅ No chat_messages found');
      return;
    }

    console.log(`📊 Found ${messages.length} chat_messages`);
    console.log('\n📋 Table structure:');
    console.log(JSON.stringify(messages[0], null, 2));

    // Check if there are any image-related fields
    const sampleMessage = messages[0];
    const imageFields = Object.keys(sampleMessage).filter(key => 
      key.toLowerCase().includes('image') || 
      key.toLowerCase().includes('photo') || 
      key.toLowerCase().includes('media') ||
      key.toLowerCase().includes('url')
    );

    if (imageFields.length > 0) {
      console.log(`\n📷 Image-related fields found: ${imageFields.join(', ')}`);
    } else {
      console.log('\n❌ No image-related fields found in chat_messages table');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
checkChatMessagesStructure().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
