import React, { useState } from 'react';
import { auth } from '../services/auth';
import { User } from '../types';
import { Button, Input, useToast, Card } from '../components/UI';
import { Command, Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await auth.signIn(email, password);
      const user = await auth.getCurrentUser();

      if (!user) {
        throw new Error('Falha ao recuperar perfil do usuário.');
      }

      addToast('Login realizado com sucesso', 'success');
      onLogin(user);
    } catch (err: any) {
      addToast(err.message || 'Erro ao autenticar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#1E1B4B_1px,transparent_1px),linear-gradient(to_bottom,#1E1B4B_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/20 rounded-pm mb-6 shadow-pm">
            <Command size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Prompt<span className="text-primary">Master</span></h1>
          <p className="text-secondary font-medium tracking-wide">ACESSO AO NÚCLEO ENTERPRISE</p>
        </div>

        <Card className="shadow-2xl !p-10 border-white/5 bg-surface/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="E-MAIL CORPORATIVO"
              placeholder="codinome@empresa.com"
              icon={<UserIcon size={20} />}
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />

            <Input
              label="CHAVE DE ACESSO"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={20} />}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full h-14 text-lg">
              AUTENTICAR NÓ
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-secondary text-sm mb-4">Novo no cluster?</p>
            <button
              onClick={onNavigateRegister}
              className="text-primary font-bold hover:text-white transition-colors text-sm uppercase tracking-widest"
            >
              Solicitar Afiliação
            </button>
          </div>
        </Card>

        <p className="mt-12 text-center text-gray-700 font-mono text-[10px] uppercase tracking-[0.4em]">Protocolo de Segurança Ativo: v2.5.0</p>
      </div>
    </div>
  );
};