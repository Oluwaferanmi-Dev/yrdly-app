"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAdminAuth } from '@/hooks/use-admin-auth-simple';
import { AdminService } from '@/lib/admin-service';
import { UserRole } from '@/types/user-roles';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

const createAdminFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.nativeEnum(UserRole, {
    required_error: "Please select a role.",
  }),
});

type CreateAdminFormValues = z.infer<typeof createAdminFormSchema>;

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAdminDialog({ open, onOpenChange, onSuccess }: CreateAdminDialogProps) {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: UserRole.ADMIN,
    },
  });

  const onSubmit = async (values: CreateAdminFormValues) => {
    if (!adminUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create admin users.",
      });
      return;
    }

    try {
      setLoading(true);
      await AdminService.createAdmin(
        values.email,
        values.name,
        values.role,
        adminUser.id
      );
      
      toast({
        title: "Success",
        description: "Admin user created successfully.",
      });
      
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create admin user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Create Admin User</span>
          </DialogTitle>
          <DialogDescription>
            Add a new admin user to the system. They will receive an email with login instructions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
