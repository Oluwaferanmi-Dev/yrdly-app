# Yrdly Admin System Setup Guide

This guide explains how to set up and use the admin system for Yrdly.

## Overview

The admin system provides two types of admin roles:
- **Super Admin**: Full access to all features and can manage other admins
- **Admin**: Limited access to user management, content moderation, and analytics

## Initial Setup

### 1. Create the First Super Admin

Before you can use the admin system, you need to create the first super admin:

1. Update the email and name in `src/scripts/init-super-admin.ts`:
   ```typescript
   const email = 'your-admin@email.com';
   const name = 'Your Name';
   ```

2. Run the initialization script:
   ```bash
   npx tsx src/scripts/init-super-admin.ts
   ```

3. Make sure the user with that email has a Firebase Auth account in your project.

### 2. Access the Admin Panel

Once the super admin is created:
1. Log in with the super admin account
2. Navigate to `/admin/dashboard`
3. You'll see the admin panel with full access

## Admin Features

### Dashboard (`/admin/dashboard`)
- Overview of system statistics
- Recent activity feed
- System status monitoring
- Quick action buttons

### User Management (`/admin/users`)
- View all users
- Search and filter users
- Ban/unban users
- View user activity and verification status

### Admin Management (`/admin/admins`) - Super Admin Only
- Create new admin users
- Edit admin roles and permissions
- Delete admin users
- View admin activity

### Seller Account Management (`/admin/seller-accounts`)
- Review seller bank account submissions
- Verify or reject seller accounts
- View verification status

### Content Management
- **Posts** (`/admin/posts`): Moderate user posts
- **Items** (`/admin/items`): Manage marketplace items

### Analytics (`/admin/analytics`)
- View system analytics and reports
- Export data (Super Admin only)

### System Logs (`/admin/logs`) - Super Admin Only
- View system activity logs
- Monitor admin actions

## Permissions System

### Super Admin Permissions
- All permissions including:
  - Manage other admins
  - View system logs
  - Export data
  - Manage system settings

### Admin Permissions
- User management (view, edit, ban)
- Content management (posts, items)
- Transaction management
- Seller account verification
- Analytics viewing
- Support ticket management

## Security Features

1. **Role-based Access Control**: Each admin has specific permissions based on their role
2. **Activity Logging**: All admin actions are logged for audit purposes
3. **Protected Routes**: Admin routes are protected and require proper authentication
4. **Permission Checks**: UI elements are hidden/shown based on user permissions

## Creating Additional Admins

Super admins can create additional admin users:

1. Go to `/admin/admins`
2. Click "Add Admin"
3. Fill in the admin details:
   - Name
   - Email (must have Firebase Auth account)
   - Role (Admin or Super Admin)
4. The new admin will be created and can access the admin panel

## Database Collections

The admin system uses these Firestore collections:
- `admin_users`: Stores admin user data and permissions
- `system_logs`: Logs all admin actions for audit purposes

## Troubleshooting

### "Access Denied" Error
- Make sure the user has an admin account in the `admin_users` collection
- Verify the user's email matches their Firebase Auth account
- Check if the admin account is active

### "Insufficient Permissions" Error
- The admin doesn't have the required permission for that action
- Only super admins can manage other admins
- Check the role permissions in `src/types/user-roles.ts`

### Admin Panel Not Loading
- Ensure Firebase is properly configured
- Check browser console for errors
- Verify the admin user exists in Firestore

## Development Notes

- Admin components are in `src/components/admin/`
- Admin routes are in `src/app/(admin)/`
- Admin service logic is in `src/lib/admin-service.ts`
- Permission types are defined in `src/types/user-roles.ts`
- Admin authentication hook is in `src/hooks/use-admin-auth.ts`

## Future Enhancements

Potential features to add:
- Email notifications for admin actions
- Advanced analytics and reporting
- Bulk user operations
- Admin activity dashboard
- Two-factor authentication for admins
- Admin session management
