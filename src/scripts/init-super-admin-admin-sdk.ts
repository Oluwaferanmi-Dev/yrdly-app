/**
 * Script to initialize the first super admin using Firebase Admin SDK
 * This bypasses Firestore security rules since it uses server-side authentication
 * 
 * Usage: 
 * 1. Download your Firebase service account key from Firebase Console
 * 2. Place it in the project root as 'firebase-service-account.json'
 * 3. Update the email and name below
 * 4. Run: npx tsx src/scripts/init-super-admin-admin-sdk.ts
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK
function initializeAdminSDK() {
  try {
    // Try to read the service account key
    const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    console.log('\nTo fix this:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Download the JSON file');
    console.log('4. Rename it to "firebase-service-account.json"');
    console.log('5. Place it in your project root directory');
    return false;
  }
}

async function initializeSuperAdmin() {
  if (!initializeAdminSDK()) {
    return;
  }

  try {
    // Update these values with your super admin details
    const email = 'feranmioyelowo@gmail.com';
    const name = 'Admin - Feranmi Oyelowo';

    console.log('Initializing super admin...');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);

    const db = admin.firestore();

    // Check if any super admin already exists
    const existingAdmins = await db.collection('admin_users')
      .where('role', '==', 'super_admin')
      .get();

    if (!existingAdmins.empty) {
      console.log('⚠️  Super admin already exists!');
      existingAdmins.forEach(doc => {
        const data = doc.data();
        console.log(`Existing super admin: ${data.name} (${data.email})`);
      });
      return;
    }

    // Create the super admin
    const adminData = {
      email,
      name,
      role: 'super_admin',
      permissions: {
        // Super admins have all permissions
        view_users: true,
        edit_users: true,
        delete_users: true,
        ban_users: true,
        view_posts: true,
        edit_posts: true,
        delete_posts: true,
        approve_posts: true,
        view_items: true,
        edit_items: true,
        delete_items: true,
        approve_items: true,
        view_transactions: true,
        process_transactions: true,
        refund_transactions: true,
        view_seller_accounts: true,
        verify_seller_accounts: true,
        reject_seller_accounts: true,
        view_analytics: true,
        export_data: true,
        view_system_logs: true,
        manage_system_settings: true,
        manage_admins: true,
        view_support_tickets: true,
        respond_support_tickets: true
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    };

    const docRef = await db.collection('admin_users').add(adminData);
    
    console.log('✅ Super admin created successfully!');
    console.log(`Admin ID: ${docRef.id}`);
    console.log('\nNext steps:');
    console.log('1. Make sure the user with this email has a Firebase Auth account');
    console.log('2. They can now access the admin panel at /admin/dashboard');
    console.log('3. They can create additional admin users from the admin panel');
    
    // Log the action
    await db.collection('system_logs').add({
      userId: 'system',
      action: 'CREATE_ADMIN',
      resource: 'admin_user',
      resourceId: docRef.id,
      details: { email, name, role: 'super_admin' },
      ipAddress: 'localhost',
      userAgent: 'admin-init-script',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    console.log('\nPossible solutions:');
    console.log('1. Make sure Firebase is properly configured');
    console.log('2. Check if a super admin already exists');
    console.log('3. Verify the email address is valid');
    console.log('4. Ensure the service account has proper permissions');
  } finally {
    // Clean up
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run the script
initializeSuperAdmin();
