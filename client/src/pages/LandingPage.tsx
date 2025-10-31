//  Urbanize Landing Page developed by Aditya Gaur, 2025

import { useState } from 'react';
import { useLocation } from 'wouter';
import LandingHero from '@/components/LandingHero';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'planner'>('citizen');

  const handleGetStarted = (role: 'citizen' | 'planner') => {
    setSelectedRole(role);
    setShowAuth(true);
  };

  const handleAuth = (userId: string, email: string, role: 'citizen' | 'planner') => {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
    setShowAuth(false);
    setLocation('/map');
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHero onGetStarted={handleGetStarted} />
      
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialRole={selectedRole}
        onAuth={handleAuth}
      />
    </div>
  );
}
