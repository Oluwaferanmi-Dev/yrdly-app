// Script to fix image URLs in messages that point to wrong bucket
// This will update messages with post-images URLs to use chat-images URLs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageUrls() {
  try {
    console.log('🔍 Looking for messages with incorrect image URLs...');
    
    // Find messages that have image_url containing 'post-images' instead of 'chat-images'
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('id, image_url, conversation_id, created_at')
      .not('image_url', 'is', null)
      .like('image_url', '%post-images%');

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log('✅ No messages found with incorrect URLs');
      return;
    }

    console.log(`📊 Found ${messages.length} messages with incorrect URLs`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const message of messages) {
      try {
        // Extract the path from the old URL
        const oldUrl = message.image_url;
        const pathMatch = oldUrl.match(/\/post-images\/(.+)$/);
        
        if (!pathMatch) {
          console.log(`⚠️  Could not extract path from URL: ${oldUrl}`);
          continue;
        }

        const path = pathMatch[1];
        const newUrl = `https://yoiyqxtpmxnrrbqqidcs.supabase.co/storage/v1/object/public/chat-images/${path}`;

        console.log(`🔄 Fixing message ${message.id}:`);
        console.log(`   Old URL: ${oldUrl}`);
        console.log(`   New URL: ${newUrl}`);

        // Update the message with the correct URL
        const { error: updateError } = await supabase
          .from('messages')
          .update({ image_url: newUrl })
          .eq('id', message.id);

        if (updateError) {
          console.error(`❌ Error updating message ${message.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Successfully updated message ${message.id}`);
          fixedCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully fixed: ${fixedCount} messages`);
    console.log(`❌ Errors: ${errorCount} messages`);
    console.log(`📊 Total processed: ${messages.length} messages`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixImageUrls().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
