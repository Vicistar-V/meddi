import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Pill } from 'lucide-react';
import { z } from 'zod';

const usernameSchema = z.string()
  .trim()
  .min(2, 'Username must be at least 2 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(true); // Guest mode is default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInAsGuest, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isGuestMode) {
        try {
          const validatedUsername = usernameSchema.parse(username);
          const { error } = await signInAsGuest(validatedUsername);
          if (error) {
            toast({
              variant: 'destructive',
              title: 'Guest login failed',
              description: error.message
            });
          } else {
            toast({
              title: 'Welcome!',
              description: 'You\'re signed in as a guest'
            });
            navigate('/dashboard');
          }
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            toast({
              variant: 'destructive',
              title: 'Invalid username',
              description: validationError.issues[0].message
            });
          }
          setLoading(false);
          return;
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Login failed',
            description: error.message
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        if (!fullName.trim()) {
          toast({
            variant: 'destructive',
            title: 'Full name required',
            description: 'Please enter your full name'
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign up failed',
            description: error.message
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'You can now sign in'
          });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-4">
      <Card className="w-full max-w-md bg-gradient-cappuccino shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Pill className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Meddi</CardTitle>
          <CardDescription>
            {isGuestMode ? 'Start tracking your medications' : isLogin ? 'Sign in to your account' : 'Create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isGuestMode ? (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  Your medications will be saved temporarily
                </p>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      placeholder="John Doe"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Please wait...' : isGuestMode ? 'Continue as Guest' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-6 space-y-3 text-center">
            {isGuestMode ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">
                      Already have an account?
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsGuestMode(false);
                    setIsLogin(true);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Sign in with email
                </button>
              </>
            ) : (
              <>
                {!isGuestMode && (
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="block w-full text-sm text-primary hover:underline"
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsGuestMode(true);
                    setIsLogin(true);
                  }}
                  className="block w-full text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Continue as guest instead
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}