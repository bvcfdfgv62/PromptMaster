import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { Button, Modal, Input, useToast, Card } from '../components/UI';
import {
  LayoutDashboard, Users, CreditCard, LogOut,
  Trash2, Plus, Minus, Search, TrendingUp,
  Activity, DollarSign, Calendar, ShieldCheck, Globe
} from 'lucide-react';
import { isCloudActive } from '../services/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'METRICS' | 'USERS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('METRICS');

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCreditsUsed: 0,
    totalPrompts: 0,
    activeUsersToday: 0
  });

  // User Management State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('10');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, metricsData] = await Promise.all([
        db.getUsers(),
        db.getSystemMetrics()
      ]);
      setUsers(usersData);
      setMetrics({
        totalUsers: usersData.length,
        totalCreditsUsed: metricsData.totalCredits,
        totalPrompts: metricsData.totalPrompts,
        activeUsersToday: metricsData.activeUsers
      });
    } catch (e) {
      addToast("ERRO AO CARREGAR DADOS", "error");
    }
  };

  const handleUpdateCredits = async (operation: 'add' | 'remove') => {
    if (!selectedUser) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('VALOR INVÁLIDO', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const val = operation === 'add' ? amount : -amount;
      const newCredits = Math.max(0, selectedUser.credits + val);
      await db.updateUserCredits(selectedUser.id, newCredits);

      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credits: newCredits } : u));
      addToast('CRÉDITOS ATUALIZADOS', 'success');
      setIsCreditModalOpen(false);
      setSelectedUser(null);
    } catch (e: any) {
      addToast("FALHA NA OPERAÇÃO", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("CONFIRMAR EXCLUSÃO DE IDENTIDADE? ESTA AÇÃO É IRREVERSÍVEL.")) return;
    try {
      await db.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addToast("IDENTIDADE REMOVIDA DO CLUSTER", "success");
    } catch (error) {
      addToast("FALHA NA REMOÇÃO", "error");
    }
  };

  const openCreditModal = (user: User) => {
    setSelectedUser(user);
    setCreditAmount('10');
    setIsCreditModalOpen(true);
  };

  // --- Views Renders ---

  const MetricCard = ({ icon, label, value, trend, desc }: { icon: React.ReactNode; label: string; value: string; trend: string; desc: string }) => (
    <Card className="flex flex-col items-start gap-4 border-border bg-surface shadow-glass p-6">
      <div className="p-3 bg-black/20 rounded-xl text-primary shadow-neon">
        {icon}
      </div>
      <div>
        <p className="text-secondary text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
        <p className="text-[10px] text-gray-500 mt-1 font-mono">{trend} | {desc}</p>
      </div>
    </Card>
  );

  const renderMetrics = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white">Visão Geral do Sistema</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-fade-in">
        <MetricCard
          icon={<Users className="text-primary" />}
          label="Nós Ativos"
          value={metrics.totalUsers.toString()}
          trend="+12%"
          desc="Identidades no Cluster"
        />
        <MetricCard
          icon={<Activity className="text-primary" />}
          label="Fluxo Prompts"
          value={metrics.totalPrompts.toString()}
          trend="+24%"
          desc="Fabricação Total"
        />
        <MetricCard
          icon={<CreditCard className="text-warning" />}
          label="Consumo Créditos"
          value={metrics.totalCreditsUsed.toString()}
          trend="-5%"
          desc="Unidades Processadas"
        />
        <MetricCard
          icon={<Calendar className="text-primary" />}
          label="Atividade (Hoje)"
          value={metrics.activeUsersToday.toString()}
          trend="Estável"
          desc="Sessões Contemporâneas"
        />
      </div>

      {/* System Health / Recent Logs Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> Velocidade de Crescimento
          </h3>
          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="w-full bg-primary/10 hover:bg-primary transition-all rounded-t-sm relative group" style={{ height: `${h}%` }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 whitespace-nowrap text-white font-mono z-20">
                  {h * 12} Novos Operativos
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Alertas do Sistema</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_#22c55e]"></div>
              <span className="font-mono text-xs">Latência do Banco de Dados: 45ms (Ótimo)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_#22c55e]"></div>
              <span className="font-mono text-xs">Status da API Gemini: Online</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full bg-warning shadow-[0_0_10px_#f59e0b]"></div>
              <span className="font-mono text-xs">Aviso de Alto Tráfego (Região: BR-Leste)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(u =>
      u.role !== 'ADMIN' &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Gestão de Operativos</h2>
          <div className="relative max-w-xs w-full group">
            <Search className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
            <input
              className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none transition-colors"
              placeholder="Buscar operativo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-surface/40 border border-white/5 rounded-2xl overflow-hidden shadow-glass backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="p-5 text-secondary text-[10px] font-bold uppercase tracking-wider">Nome</th>
                  <th className="p-5 text-secondary text-[10px] font-bold uppercase tracking-wider">Email</th>
                  <th className="p-5 text-secondary text-[10px] font-bold uppercase tracking-wider">Créditos</th>
                  <th className="p-5 text-secondary text-[10px] font-bold uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500 font-mono text-sm">Nenhum operativo encontrado no banco de dados</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-5 text-white font-medium text-sm">{user.name}</td>
                      <td className="p-5 text-gray-400 text-sm font-mono">{user.email}</td>
                      <td className="p-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${user.credits > 0 ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                          {user.credits} UNIDADES
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openCreditModal(user)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Gerenciar Créditos"
                          >
                            <CreditCard size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-danger/10 rounded-lg text-gray-500 hover:text-danger transition-colors"
                            title="Desativar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans">
      {/* Admin Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-surface flex flex-col sticky top-0 h-screen z-20">
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-4 text-primary mb-2">
            <ShieldCheck size={28} />
            <span className="font-bold text-2xl text-white tracking-tight">Admin<span className="text-primary">Node</span></span>
          </div>
        </div>

        <div className="p-8">
          <div className="px-6 py-4 mb-8 bg-black/40 border border-white/5 rounded-pm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-primary shadow-lg shadow-primary/50 animate-pulse' : 'bg-warning'}`}></div>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{isCloudActive ? 'NÚVEM ATIVA' : 'SANDBOX LOCAL'}</span>
            </div>
            <p className="text-[10px] text-gray-600 font-mono italic">{isCloudActive ? 'SECURE_NODE_ACTIVE' : 'OFFLINE_MODE'}</p>
          </div>

          <nav className="space-y-3">
            <NavItem
              active={activeTab === 'METRICS'}
              onClick={() => setActiveTab('METRICS')}
              icon={<TrendingUp size={20} />}
              label="Métricas de Nodo"
            />
            <NavItem
              active={activeTab === 'USERS'}
              onClick={() => setActiveTab('USERS')}
              icon={<Users size={20} />}
              label="Gestão de Usuários"
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
          <button onClick={onLogout} className="flex items-center gap-4 text-secondary hover:text-white px-6 py-4 w-full transition-all text-sm font-bold uppercase tracking-widest group rounded-pm border border-transparent hover:border-white/5 hover:bg-white/5">
            <LogOut size={20} className="group-hover:text-danger" /> Encerrar Acesso
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <header className="h-24 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-10 transition-all duration-300">
          <div>
            <h2 className="text-[10px] text-primary font-bold uppercase tracking-[0.4em] mb-1 font-mono">Status do Sistema: <span className="animate-pulse">NOMINAL</span></h2>
            <p className="text-secondary text-[9px] font-mono uppercase tracking-widest">Acesso de Nível: <span className="text-white">DIRETOR_ESTRATÉGICO</span></p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-white font-bold uppercase tracking-widest">Admin Global</p>
              <p className="text-[9px] text-gray-700 font-mono uppercase tracking-tighter italic">Enterprise Root</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-12 lg:p-16 pb-32">
          <div className="mb-16 animate-fade-in relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <h1 className="text-4xl font-display font-bold text-white mb-4 tracking-[0.1em] uppercase">
              {activeTab === 'METRICS' && 'Analítica Enterprise'}
              {activeTab === 'USERS' && 'Gestão de Identidades'}
            </h1>
            <p className="text-secondary font-mono text-[11px] uppercase tracking-[0.4em] max-w-2xl">Supervisão central de infraestrutura e governança de dados.</p>
          </div>

          <div className="space-y-12">
            {activeTab === 'METRICS' && renderMetrics()}
            {activeTab === 'USERS' && renderUsers()}
          </div>
        </div>
      </main>

      {/* Credit Modal */}
      <Modal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        title="AJUSTE DE CRÉDITOS"
      >
        <div className="space-y-8">
          <div className="p-6 bg-background/50 border border-border">
            <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-2">Usuário Alvo</p>
            <p className="text-white text-sm font-mono">{selectedUser?.email}</p>
            <p className="text-primary text-[10px] font-bold mt-4 uppercase tracking-[0.2em]">Saldo Atual: {selectedUser?.credits} UNIDADES</p>
          </div>

          <Input
            label="QUANTIDADE DE AJUSTE"
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Button variant="danger" onClick={() => handleUpdateCredits('remove')} isLoading={isLoading}>
              <Minus size={16} /> REMOVER
            </Button>
            <Button onClick={() => handleUpdateCredits('add')} isLoading={isLoading}>
              <Plus size={16} /> ADICIONAR
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Internal Helper for Sidebar ---
const NavItem = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <div
    onClick={onClick}
    className={`
      flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-300
      ${active ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    {icon}
    <span className="font-semibold text-sm tracking-wide">{label}</span>
  </div>
);