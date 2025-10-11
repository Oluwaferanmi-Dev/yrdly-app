// Script to check all image messages in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImageMessages() {
  try {
    console.log('🔍 Checking all messages with images...');
    
    // Get all messages that have image_url
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('id, image_url, text, conversation_id, created_at')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log('✅ No messages with images found');
      return;
    }

    console.log(`📊 Found ${messages.length} messages with images:\n`);

    messages.forEach((message, index) => {
      console.log(`${index + 1}. Message ID: ${message.id}`);
      console.log(`   Text: "${message.text || 'No text'}"`);
      console.log(`   Image URL: ${message.image_url}`);
      console.log(`   Conversation: ${message.conversation_id}`);
      console.log(`   Created: ${message.created_at}`);
      console.log(`   URL contains 'post-images': ${message.image_url.includes('post-images')}`);
      console.log(`   URL contains 'chat-images': ${message.image_url.includes('chat-images')}`);
      console.log('---');
    });

    // Count messages with different URL patterns
    const postImagesCount = messages.filter(m => m.image_url.includes('post-images')).length;
    const chatImagesCount = messages.filter(m => m.image_url.includes('chat-images')).length;
    const otherCount = messages.length - postImagesCount - chatImagesCount;

    console.log('\n📊 Summary:');
    console.log(`📷 Messages with 'post-images' URLs: ${postImagesCount}`);
    console.log(`📷 Messages with 'chat-images' URLs: ${chatImagesCount}`);
    console.log(`❓ Messages with other URL patterns: ${otherCount}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
checkImageMessages().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
