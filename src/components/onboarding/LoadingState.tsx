"use client";

import { CheckCircle, RefreshCw, Mail, User, MapPin } from 'lucide-react';

interface LoadingStateProps {
  type: 'email' | 'profile' | 'location' | 'general';
  message?: string;
  progress?: number;
}

const loadingConfig = {
  email: {
    icon: Mail,
    defaultMessage: "Setting up your email verification...",
    color: "text-blue-600"
  },
  profile: {
    icon: User,
    defaultMessage: "Creating your profile...",
    color: "text-green-600"
  },
  location: {
    icon: MapPin,
    defaultMessage: "Loading location data...",
    color: "text-purple-600"
  },
  general: {
    icon: RefreshCw,
    defaultMessage: "Loading...",
    color: "text-primary"
  }
};

export function LoadingState({ type, message, progress }: LoadingStateProps) {
  const config = loadingConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full bg-${config.color.replace('text-', '')}/10 flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${config.color} animate-pulse`} />
        </div>
        {type === 'general' && (
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">
          {message || config.defaultMessage}
        </p>
        
        {progress !== undefined && (
          <div className="w-48 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        
        {type === 'email' && (
          <p className="text-sm text-muted-foreground">
            This may take a few moments...
          </p>
        )}
        
        {type === 'profile' && (
          <p className="text-sm text-muted-foreground">
            Almost ready to connect with your neighbors!
          </p>
        )}
        
        {type === 'location' && (
          <p className="text-sm text-muted-foreground">
            Loading local areas and neighborhoods...
          </p>
        )}
      </div>
    </div>
  );
}
