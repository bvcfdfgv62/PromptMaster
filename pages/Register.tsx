import React, { useState } from 'react';
import { auth } from '../services/auth';
import { User } from '../types';
import { Button, Input, useToast, Card } from '../components/UI';
import { Command, Mail, Lock, User as UserIcon, Shield, CheckCircle } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onNavigateLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onLogin, onNavigateLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await auth.signUp(email, password, name);
      // const user = await auth.getCurrentUser(); // Removed redundant check that fails in local mode

      if (!user) throw new Error("Erro ao criar perfil.");

      setSuccess(true);
      addToast('Conta criada com sucesso!', 'success');

      // Allow user to see the success state briefly before redirect
      setTimeout(() => {
        onLogin(user);
      }, 2000);
    } catch (err: any) {
      addToast(err.message || 'Erro ao criar conta.', 'error');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="bg-surface border border-primary/30 p-12 rounded-xl text-center animate-slide-up max-w-[400px]">
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-8 shadow-neon">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2 tracking-widest uppercase">Acesso Concedido</h2>
          <p className="text-secondary font-mono text-[10px] uppercase tracking-[0.2em] mb-6">Créditos Iniciais: <span className="text-primary font-bold">10 UNIDADES</span></p>
          <div className="h-[2px] w-24 bg-primary/10 mx-auto overflow-hidden">
            <div className="h-full bg-primary animate-[wiggle_1s_infinite]"></div>
          </div>
          <p className="mt-8 text-[9px] text-gray-600 font-mono animate-pulse">REDIRECIONANDO PARA O WORKBENCH...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[linear-gradient(to_right,#1E1B4B_1px,transparent_1px),linear-gradient(to_bottom,#1E1B4B_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 transform rotate-180"></div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/20 rounded-md mb-6 shadow-md">
            <Shield size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Criar Identidade</h1>
          <p className="text-secondary font-medium tracking-wide">SOLICITAR AFILIAÇÃO AO CLUSTER</p>
        </div>

        <Card className="shadow-2xl !p-10 border-white/5 bg-surface/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="DESIGNAÇÃO COMPLETA"
              placeholder="Seu Nome Completo"
              icon={<UserIcon size={20} />}
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              required
            />

            <Input
              label="E-MAIL CORPORATIVO"
              placeholder="codinome@empresa.com"
              icon={<Mail size={20} />}
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />

            <Input
              label="CHAVE DE SEGURANÇA"
              type="password"
              placeholder="Mínimo 8 caracteres"
              icon={<Lock size={20} />}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full h-14 text-lg mt-4">
              SOLICITAR ACESSO
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-secondary text-sm mb-4">Já possui autorização?</p>
            <button
              onClick={onNavigateLogin}
              className="text-primary font-bold hover:text-white transition-colors text-sm uppercase tracking-widest"
            >
              Retornar ao Login
            </button>
          </div>
        </Card>

        <p className="mt-12 text-center text-gray-700 font-mono text-[10px] uppercase tracking-[0.4em]">Node Cluster: 02-BR-SAO</p>
      </div>
    </div>
  );
};