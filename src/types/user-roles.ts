export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // User Management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  BAN_USERS = 'ban_users',
  
  // Content Management
  VIEW_POSTS = 'view_posts',
  EDIT_POSTS = 'edit_posts',
  DELETE_POSTS = 'delete_posts',
  APPROVE_POSTS = 'approve_posts',
  
  // Marketplace Management
  VIEW_ITEMS = 'view_items',
  EDIT_ITEMS = 'edit_items',
  DELETE_ITEMS = 'delete_items',
  APPROVE_ITEMS = 'approve_items',
  
  // Transaction Management
  VIEW_TRANSACTIONS = 'view_transactions',
  PROCESS_TRANSACTIONS = 'process_transactions',
  REFUND_TRANSACTIONS = 'refund_transactions',
  
  // Seller Account Management
  VIEW_SELLER_ACCOUNTS = 'view_seller_accounts',
  VERIFY_SELLER_ACCOUNTS = 'verify_seller_accounts',
  REJECT_SELLER_ACCOUNTS = 'reject_seller_accounts',
  
  // Analytics & Reports
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // System Management
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  MANAGE_ADMINS = 'manage_admins',
  
  // Support
  VIEW_SUPPORT_TICKETS = 'view_support_tickets',
  RESPOND_SUPPORT_TICKETS = 'respond_support_tickets'
}

export interface UserPermissions {
  [key: string]: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // ID of admin who created this admin
}

export interface RolePermissions {
  [UserRole.USER]: Permission[];
  [UserRole.ADMIN]: Permission[];
  [UserRole.SUPER_ADMIN]: Permission[];
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.USER]: [
    // Users have no admin permissions
  ],
  
  [UserRole.ADMIN]: [
    // User Management
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    
    // Content Management
    Permission.VIEW_POSTS,
    Permission.EDIT_POSTS,
    Permission.DELETE_POSTS,
    Permission.APPROVE_POSTS,
    
    // Marketplace Management
    Permission.VIEW_ITEMS,
    Permission.EDIT_ITEMS,
    Permission.DELETE_ITEMS,
    Permission.APPROVE_ITEMS,
    
    // Transaction Management
    Permission.VIEW_TRANSACTIONS,
    Permission.PROCESS_TRANSACTIONS,
    
    // Seller Account Management
    Permission.VIEW_SELLER_ACCOUNTS,
    Permission.VERIFY_SELLER_ACCOUNTS,
    Permission.REJECT_SELLER_ACCOUNTS,
    
    // Analytics & Reports
    Permission.VIEW_ANALYTICS,
    
    // Support
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_SUPPORT_TICKETS
  ],
  
  [UserRole.SUPER_ADMIN]: [
    // Super admins have all permissions
    ...Object.values(Permission)
  ]
};

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalPosts: number;
  totalItems: number;
  totalTransactions: number;
  pendingVerifications: number;
  activeUsers: number;
  revenue: number;
}

export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
