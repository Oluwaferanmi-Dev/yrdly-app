/**
 * Script to initialize the first super admin
 * Run this script once to create the initial super admin user
 * 
 * Usage: 
 * 1. Update the email and name below
 * 2. Run: npx tsx src/scripts/init-super-admin.ts
 */

import { AdminService } from '../lib/admin-service';

async function initializeSuperAdmin() {
  try {
    // Update these values with your super admin details
    const email = 'feranmioyelowo@gmail.com';
    const name = 'Super Admin';

    console.log('Initializing super admin...');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);

    const adminId = await AdminService.initializeSuperAdmin(email, name);
    
    console.log('✅ Super admin created successfully!');
    console.log(`Admin ID: ${adminId}`);
    console.log('\nNext steps:');
    console.log('1. Make sure the user with this email has a Firebase Auth account');
    console.log('2. They can now access the admin panel at /admin/dashboard');
    console.log('3. They can create additional admin users from the admin panel');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    console.log('\nPossible solutions:');
    console.log('1. Make sure Firebase is properly configured');
    console.log('2. Check if a super admin already exists');
    console.log('3. Verify the email address is valid');
  }
}

// Run the script
initializeSuperAdmin();
