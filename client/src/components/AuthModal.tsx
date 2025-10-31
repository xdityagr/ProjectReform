import { useState } from 'react';
import { X, Mail, Lock, User, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'citizen' | 'planner';
  onAuth: (userId: string, email: string, role: 'citizen' | 'planner') => void;
}

export default function AuthModal({ isOpen, onClose, initialRole = 'citizen', onAuth }: AuthModalProps) {
  const [role, setRole] = useState<'citizen' | 'planner'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: 'Account created!',
            description: 'Welcome to Urbanize!',
          });
          onAuth(data.user.id, email, role);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const userRole = (data.user.user_metadata?.role as 'citizen' | 'planner') || 'citizen';
          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in',
          });
          onAuth(data.user.id, email, userRole);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card rounded-lg shadow-2xl border border-card-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover-elevate z-10"
          data-testid="button-close-auth"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-6">
          <h2 className="text-2xl font-bold mb-6">Welcome</h2>

          <Tabs value={role} onValueChange={(v) => setRole(v as 'citizen' | 'planner')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="citizen" data-testid="tab-citizen">
                <Users className="w-4 h-4 mr-2" />
                Citizen
              </TabsTrigger>
              <TabsTrigger value="planner" data-testid="tab-planner">
                <Building2 className="w-4 h-4 mr-2" />
                Urban Planner
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 mb-6">
            <Button
              variant={authMode === 'signin' ? 'default' : 'ghost'}
              onClick={() => setAuthMode('signin')}
              className="flex-1"
              data-testid="button-signin-mode"
            >
              Sign In
            </Button>
            <Button
              variant={authMode === 'signup' ? 'default' : 'ghost'}
              onClick={() => setAuthMode('signup')}
              className="flex-1"
              data-testid="button-signup-mode"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit-auth" disabled={isLoading}>
              {isLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
