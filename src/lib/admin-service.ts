import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AdminUser, 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS,
  AdminStats,
  SystemLog
} from '@/types/user-roles';

export class AdminService {
  private static readonly ADMINS_COLLECTION = 'admin_users';
  private static readonly SYSTEM_LOGS_COLLECTION = 'system_logs';

  // Create admin user
  static async createAdmin(
    email: string,
    name: string,
    role: UserRole,
    createdBy: string
  ): Promise<string> {
    try {
      const permissions = this.getPermissionsForRole(role);
      
      const adminData: Omit<AdminUser, 'id'> = {
        email,
        name,
        role,
        permissions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy
      };

      const docRef = await addDoc(collection(db, this.ADMINS_COLLECTION), {
        ...adminData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log the action
      await this.logAction(createdBy, 'CREATE_ADMIN', 'admin_user', docRef.id, {
        email,
        name,
        role
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw new Error('Failed to create admin user');
    }
  }

  // Get all admin users
  static async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const q = query(
        collection(db, this.ADMINS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate()
      })) as AdminUser[];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw new Error('Failed to fetch admin users');
    }
  }

  // Get admin user by ID
  static async getAdminById(adminId: string): Promise<AdminUser | null> {
    try {
      const docRef = doc(db, this.ADMINS_COLLECTION, adminId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
          lastLoginAt: docSnap.data().lastLoginAt?.toDate()
        } as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin by ID:', error);
      return null;
    }
  }

  // Get admin user by email
  static async getAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      const q = query(
        collection(db, this.ADMINS_COLLECTION),
        where('email', '==', email)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate()
      } as AdminUser;
    } catch (error) {
      console.error('Error fetching admin by email:', error);
      return null;
    }
  }

  // Update admin user
  static async updateAdmin(
    adminId: string,
    updates: Partial<AdminUser>,
    updatedBy: string
  ): Promise<void> {
    try {
      const adminRef = doc(db, this.ADMINS_COLLECTION, adminId);
      
      // If role is being updated, update permissions too
      if (updates.role) {
        updates.permissions = this.getPermissionsForRole(updates.role);
      }

      await updateDoc(adminRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Log the action
      await this.logAction(updatedBy, 'UPDATE_ADMIN', 'admin_user', adminId, updates);
    } catch (error) {
      console.error('Error updating admin:', error);
      throw new Error('Failed to update admin user');
    }
  }

  // Delete admin user
  static async deleteAdmin(adminId: string, deletedBy: string): Promise<void> {
    try {
      const adminRef = doc(db, this.ADMINS_COLLECTION, adminId);
      await deleteDoc(adminRef);

      // Log the action
      await this.logAction(deletedBy, 'DELETE_ADMIN', 'admin_user', adminId, {});
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw new Error('Failed to delete admin user');
    }
  }

  // Check if user has permission
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  // Get permissions for a role
  static getPermissionsForRole(role: UserRole): Record<string, boolean> {
    const permissions = ROLE_PERMISSIONS[role] || [];
    const permissionMap: Record<string, boolean> = {};
    
    // Initialize all permissions to false
    Object.values(Permission).forEach(perm => {
      permissionMap[perm] = false;
    });
    
    // Set role permissions to true
    permissions.forEach(perm => {
      permissionMap[perm] = true;
    });
    
    return permissionMap;
  }

  // Update admin login time
  static async updateLastLogin(adminId: string): Promise<void> {
    try {
      const adminRef = doc(db, this.ADMINS_COLLECTION, adminId);
      await updateDoc(adminRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Get admin dashboard stats
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // This would typically involve multiple queries to get stats
      // For now, we'll return mock data - in production, you'd query actual collections
      return {
        totalUsers: 1250,
        totalAdmins: 5,
        totalPosts: 3420,
        totalItems: 1890,
        totalTransactions: 567,
        pendingVerifications: 23,
        activeUsers: 890,
        revenue: 1250000 // ₦1,250,000
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  }

  // Log system action
  static async logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    try {
      const logData: Omit<SystemLog, 'id'> = {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date()
      };

      await addDoc(collection(db, this.SYSTEM_LOGS_COLLECTION), {
        ...logData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw error for logging failures
    }
  }

  // Get system logs
  static async getSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.SYSTEM_LOGS_COLLECTION),
        orderBy('timestamp', 'desc'),
        // limit(limit) // Uncomment when you have proper pagination
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as SystemLog[];
    } catch (error) {
      console.error('Error fetching system logs:', error);
      throw new Error('Failed to fetch system logs');
    }
  }

  // Initialize super admin (call this once to create the first super admin)
  static async initializeSuperAdmin(
    email: string,
    name: string
  ): Promise<string> {
    try {
      // Check if any super admin already exists
      const q = query(
        collection(db, this.ADMINS_COLLECTION),
        where('role', '==', UserRole.SUPER_ADMIN)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error('Super admin already exists');
      }

      return await this.createAdmin(email, name, UserRole.SUPER_ADMIN, 'system');
    } catch (error) {
      console.error('Error initializing super admin:', error);
      throw new Error('Failed to initialize super admin');
    }
  }
}
