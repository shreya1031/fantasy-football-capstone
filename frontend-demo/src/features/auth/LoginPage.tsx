import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { useAuthStore } from '../../lib/authStore';
import { Button, Input, Label } from '../../design/primitives/Button';
import { BadgeChip } from '../../design/primitives/BadgeChip';
import { getErrorMessage } from '../../lib/errors';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

const liveStrip = ['ARS 2–1 CHE', 'LIV 1–0 MUN', 'MCI vs TOT 17:30'];

function AuthBrandPanel() {
  return (
    <motion.div
      className="relative hidden flex-col justify-between overflow-hidden bg-[var(--accent-green)] p-10 text-white lg:flex lg:w-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        <svg viewBox="0 0 400 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect x="20" y="20" width="360" height="560" fill="none" stroke="white" strokeWidth="3" />
          <line x1="200" y1="20" x2="200" y2="580" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="300" r="60" fill="none" stroke="white" strokeWidth="2" />
          <rect x="120" y="20" width="160" height="80" fill="none" stroke="white" strokeWidth="2" />
          <rect x="120" y="500" width="160" height="80" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      <div className="relative z-10">
        <span className="text-4xl" aria-hidden>
          ⚽
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold">Fantasy Soccer</h1>
        <p className="mt-2 font-body text-sm text-white/80">Build your squad. Compete every gameweek.</p>
      </div>
      <div className="relative z-10 rounded-xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
        <BadgeChip tone="orange">Live</BadgeChip>
        <div className="mt-3 flex flex-wrap gap-4">
          {liveStrip.map((r) => (
            <span key={r} className="font-stat text-sm font-semibold text-white">
              {r}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <div className="flex min-h-screen pitch-bg">
      <AuthBrandPanel />
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5 rounded-xl border border-[var(--panel-border)] bg-white p-8 shadow-[var(--card-shadow)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="lg:hidden">
            <h1 className="font-display text-2xl font-bold text-[var(--accent-green)]">Fantasy Soccer</h1>
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--fg-0)]">Sign in</h2>
          {error && <p className="text-sm text-[var(--accent-orange)]">{error}</p>}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center font-body text-sm text-[var(--fg-2)]">
            No account?{' '}
            <Link to="/register" className="font-semibold text-[var(--accent-green)] hover:underline">
              Register
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [error, setError] = useState('');

  const registerSchema = schema.extend({ displayName: z.string().min(2).max(50) });
  type RegisterData = z.infer<typeof registerSchema>;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setError('');
    try {
      await registerUser(data.email, data.password, data.displayName);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div className="flex min-h-screen pitch-bg">
      <AuthBrandPanel />
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5 rounded-xl border border-[var(--panel-border)] bg-white p-8 shadow-[var(--card-shadow)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-2xl font-bold text-[var(--fg-0)]">Create account</h2>
          {error && <p className="text-sm text-[var(--accent-orange)]">{error}</p>}
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" {...register('displayName')} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
          <p className="text-center font-body text-sm text-[var(--fg-2)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent-green)] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
