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
    color: "#3b82f6", // Blue
    bg: "rgba(59, 130, 246, 0.15)"
  },
  profile: {
    icon: User,
    defaultMessage: "Creating your profile...",
    color: "#388E3C", // Green
    bg: "rgba(56, 142, 60, 0.15)"
  },
  location: {
    icon: MapPin,
    defaultMessage: "Loading location data...",
    color: "#a855f7", // Purple
    bg: "rgba(168, 85, 247, 0.15)"
  },
  general: {
    icon: RefreshCw,
    defaultMessage: "Loading...",
    color: "#388E3C", // Green
    bg: "rgba(56, 142, 60, 0.15)"
  }
};

export function LoadingState({ type, message, progress }: LoadingStateProps) {
  const config = loadingConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4" style={{ fontFamily: "Work Sans, sans-serif" }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: config.bg }}>
          <Icon className="w-8 h-8 animate-pulse" style={{ color: config.color }} />
        </div>
        {type === 'general' && (
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: config.color }}></div>
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#e1e2e9" }}>
          {message || config.defaultMessage}
        </p>
        
        {progress !== undefined && (
          <div className="w-48 rounded-full h-2" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div 
              className="h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: config.color }}
            />
          </div>
        )}
        
        {type === 'email' && (
          <p className="text-sm" style={{ color: "#899485" }}>
            This may take a few moments...
          </p>
        )}
        
        {type === 'profile' && (
          <p className="text-sm" style={{ color: "#899485" }}>
            Almost ready to connect with your neighbors!
          </p>
        )}
        
        {type === 'location' && (
          <p className="text-sm" style={{ color: "#899485" }}>
            Loading local areas and neighborhoods...
          </p>
        )}
      </div>
    </div>
  );
}
