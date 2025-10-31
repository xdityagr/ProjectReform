import { useState } from 'react';
import AuthModal from '../AuthModal';
import { Button } from '@/components/ui/button';

export default function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Auth Modal</Button>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialRole="citizen"
        onAuth={(email, password, role, isSignUp) => {
          console.log('Auth:', { email, password, role, isSignUp });
          setIsOpen(false);
        }}
      />
    </div>
  );
}
