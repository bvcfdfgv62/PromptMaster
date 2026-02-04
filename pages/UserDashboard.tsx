import React, { useState, useEffect, useMemo } from 'react';
import { User, PromptType, PromptEntry } from '../types';
import { db } from '../services/db';
import { generateExpertPrompt } from '../services/geminiService';
import { Button, Select, Modal, Card, useToast } from '../components/UI';
import {
    Zap, Copy, LogOut, Check, MessageCircle,
    Layout, Command, History, Settings, Sparkles,
    BarChart3, Cpu, ShieldCheck, User as UserIcon, Lock,
    Globe, Cloud
} from 'lucide-react';
import { isCloudActive } from '../services/supabase';

interface UserDashboardProps {
    currentUser: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

type UserView = 'GENERATOR' | 'HISTORY' | 'ANALYTICS' | 'SETTINGS';

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout, onUpdateUser }) => {
    const [activeView, setActiveView] = useState<UserView>('GENERATOR');

    // Generator State
    const [promptType, setPromptType] = useState<PromptType>(PromptType.WEBSITE);
    const [description, setDescription] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // History & Stats State
    const [history, setHistory] = useState<PromptEntry[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);

    // Settings State
    const [settingsName, setSettingsName] = useState(currentUser.name);
    const [settingsPassword, setSettingsPassword] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const { addToast } = useToast();

    // Load Data on Mount
    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            setIsHistoryLoading(true);
            try {
                const hist = await db.getUserHistory(currentUser.id);
                if (mounted) {
                    setHistory(hist);
                    setGeneratedCount(hist.length);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                if (mounted) setIsHistoryLoading(false);
            }
        };
        loadData();
        setSettingsName(currentUser.name);
        return () => { mounted = false; };
    }, [currentUser.id, currentUser.name]);

    // Analytics Calculation
    const chartData = useMemo(() => {
        const days = 7;
        const counts = new Array(days).fill(0);
        const now = new Date();

        history.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            const diffTime = Math.abs(now.getTime() - entryDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < days) {
                const index = (days - 1) - diffDays;
                if (index >= 0 && index < days) {
                    counts[index]++;
                }
            }
        });
        return counts;
    }, [history]);

    // Handlers
    const handleGenerate = async () => {
        if (currentUser.credits <= 0) {
            setShowNoCreditsModal(true);
            return;
        }

        if (!description.trim()) {
            addToast('Por favor, descreva o contexto do prompt.', 'info');
            return;
        }

        setIsLoading(true);
        setGeneratedPrompt('');

        try {
            const result = await generateExpertPrompt(promptType, description);
            setGeneratedPrompt(result);

            const updatedUser = await db.updateUserCredits(currentUser.id, -1);

            const newHistoryEntry = await db.savePromptHistory({
                user_id: currentUser.id,
                type: promptType,
                prompt: description,
                output: result
            });

            onUpdateUser(updatedUser);
            setHistory(prev => [newHistoryEntry, ...prev]);
            setGeneratedCount(prev => prev + 1);
            addToast('Prompt gerado com sucesso.', 'success');
        } catch (error: any) {
            addToast(error.message || "Erro ao gerar prompt.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settingsName.trim()) {
            addToast("O nome não pode estar vazio.", "error");
            return;
        }

        setIsSavingSettings(true);
        try {
            const updatedUser = await db.updateUserProfile(currentUser.id, {
                name: settingsName,
                password: settingsPassword || undefined
            });
            onUpdateUser(updatedUser);
            setSettingsPassword('');
            addToast("PERFIL ATUALIZADO COM SUCESSO", "success");
        } catch (error: any) {
            addToast("ERRO NA ATUALIZAÇÃO", "error");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleCopy = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        addToast('Prompt copiado para a área de transferência', 'info');
        setTimeout(() => setCopied(false), 2000);
    };

    // Views
    // Replaced hardcoded #5B2EFF with primary/cyan styles
    const renderGenerator = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start animate-fade-in pb-20">
            <div className="lg:col-span-1 space-y-8">
                <Card className="border-primary/20 bg-surface/80">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Command size={16} />
                        </div>
                        <h2 className="font-bold text-white uppercase tracking-[0.2em] text-[11px]">Configuração de Matriz</h2>
                    </div>

                    <Select
                        label="Arquitetura de Sistema"
                        value={promptType}
                        onChange={(e) => setPromptType(e.target.value as PromptType)}
                        options={Object.values(PromptType).map(t => ({ label: t, value: t }))}
                    />

                    <div className="w-full group">
                        <label className="block text-secondary text-[9px] uppercase tracking-[0.2em] font-bold mb-3 group-focus-within:text-primary transition-colors pl-0.5">
                            Parâmetros & Contexto
                        </label>
                        <textarea
                            className="w-full bg-surface border border-border focus:border-primary/50 rounded-xl p-5 text-white placeholder-gray-800 outline-none min-h-[220px] resize-none transition-all duration-200 focus:bg-surfaceHover text-sm leading-relaxed font-mono"
                            placeholder="Descreva o domínio do problema, público-alvo e restrições técnicas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="mt-8">
                        <Button onClick={handleGenerate} isLoading={isLoading} disabled={!description.trim()}>
                            <Sparkles size={16} className={isLoading ? "animate-pulse" : ""} />
                            {isLoading ? "Fabricando..." : "Gerar Prompt Mestre"}
                        </Button>
                        <div className="mt-4 flex items-center justify-between px-1">
                            <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold">
                                <Zap size={10} className="text-primary fill-current" /> Custo: 1 Unidade
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-2 min-h-[650px]">
                {generatedPrompt ? (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl flex flex-col h-full animate-slide-up">
                        <div className="bg-background/80 border-b border-border p-4 flex justify-between items-center">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-border"></div>
                                <div className="w-2 h-2 bg-border"></div>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">especificacao_arquitetura.md</span>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm transition-all ${copied ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500 hover:text-white border border-border'}`}
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? "Copiado" : "Copiar"}
                            </button>
                        </div>
                        <div className="p-8 overflow-x-auto flex-1 bg-black/40">
                            <pre className="font-mono text-sm text-gray-400 whitespace-pre-wrap leading-relaxed selection:bg-primary/20 selection:text-primary">
                                {generatedPrompt}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="h-full border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-gray-800 bg-surface/30 min-h-[650px]">
                        <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-6">
                            <Layout size={32} className="opacity-10 text-primary" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Aguardando Inicialização</p>
                        <p className="text-[9px] text-gray-700 mt-3 max-w-xs text-center uppercase tracking-widest font-mono">Defina os parâmetros para gerar a arquitetura neural.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="animate-fade-in max-w-5xl">
            <h2 className="text-xl font-display font-bold text-white mb-10 flex items-center gap-4 uppercase tracking-[0.2em]">
                <History className="text-primary" size={24} /> Arquivos de Arquitetura
            </h2>
            {isHistoryLoading ? (
                <div className="flex justify-center py-24"><div className="animate-pulse text-gray-700 font-mono text-[10px] uppercase tracking-widest">CARREGANDO_FLUXO_DE_DADOS...</div></div>
            ) : history.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-border rounded-sm bg-surface/20">
                    <p className="text-gray-600 font-mono text-[10px] uppercase tracking-widest">Nenhum registro encontrado no cluster.</p>
                    <Button variant="ghost" className="w-auto mt-6 mx-auto uppercase tracking-widest text-[9px]" onClick={() => setActiveView('GENERATOR')}>Iniciar Primeiro Projeto</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map(entry => (
                        <div key={entry.id} className="bg-surface border border-border p-8 hover:border-primary/40 transition-all group relative">
                            <div className="absolute top-0 left-0 w-[2px] h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">{entry.type}</span>
                                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(entry.output); addToast("COPIADO PARA O CLIPE", "success") }} className="p-2 text-gray-700 hover:text-primary transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 line-clamp-2 pl-4 border-l border-border group-hover:border-primary/30 transition-colors italic">{entry.prompt}</p>
                            <div className="bg-background/60 p-5 border border-border group-hover:border-primary/10 transition-colors">
                                <pre className="font-mono text-[11px] text-gray-700 line-clamp-3 overflow-hidden leading-relaxed">{entry.output}</pre>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAnalytics = () => (
        <div className="animate-fade-in max-w-5xl">
            <h2 className="text-xl font-display font-bold text-white mb-10 flex items-center gap-4 uppercase tracking-[0.2em]">
                <BarChart3 className="text-primary" size={24} /> Telemetria de Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <Card className="bg-surface">
                    <h3 className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] mb-10">Vazão Semanal de Prompts</h3>
                    <div className="flex items-end gap-3 h-56 px-2">
                        {chartData.length > 0 ? chartData.map((count, i) => {
                            const max = Math.max(...chartData, 5);
                            const height = (count / max) * 100;
                            return (
                                <div key={i} className="flex-1 bg-primary/5 hover:bg-primary/10 transition-all relative group flex flex-col justify-end h-full">
                                    <div className="bg-primary/80 w-full transition-all duration-700 ease-out group-hover:bg-primary shadow-neon" style={{ height: `${height}%` }}></div>
                                </div>
                            )
                        }) : <div className="w-full h-full flex items-center justify-center text-gray-800 font-mono text-[9px] uppercase tracking-widest">Dados Insuficientes</div>}
                    </div>
                    <div className="flex justify-between mt-6 px-1 border-t border-border pt-4">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            return <span key={i} className="text-[9px] text-gray-600 uppercase font-mono font-bold tracking-tighter">{d.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</span>
                        })}
                    </div>
                </Card>
                <Card className="bg-surface">
                    <h3 className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] mb-10">Logs de Atividade Global</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-background/50 border border-border hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 text-primary"><Sparkles size={16} /></div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total de Fabricações</span>
                            </div>
                            <span className="font-mono font-bold text-white text-xl">{generatedCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-background/50 border border-border hover:border-warning/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-warning/10 text-warning"><Zap size={16} /></div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Unidades Consumidas</span>
                            </div>
                            <span className="font-mono font-bold text-warning text-xl">{10 - currentUser.credits}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="animate-fade-in max-w-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-10 flex items-center gap-4 uppercase tracking-[0.2em]">
                <Settings className="text-primary" size={24} /> Configuração de Perfil
            </h2>
            <Card className="p-10">
                <div className="flex items-center gap-8 mb-12">
                    <div className="w-20 h-20 bg-primary flex items-center justify-center text-2xl font-bold text-black shadow-neon">
                        {currentUser.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-white font-display font-bold text-2xl tracking-tighter uppercase">{currentUser.name}</h3>
                        <p className="text-secondary text-[11px] font-mono mt-1 tracking-wider uppercase">{currentUser.email}</p>
                        <span className="inline-block mt-4 px-4 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">Administrador Enterprise</span>
                    </div>
                </div>
                <div className="space-y-8">
                    <div>
                        <label className="block text-secondary text-[9px] uppercase tracking-[0.2em] font-bold mb-3 pl-0.5 font-mono">Nome de Exibição</label>
                        <div className="relative group">
                            <UserIcon size={16} className="absolute left-4 top-4 text-gray-700 group-focus-within:text-primary transition-colors" />
                            <input
                                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all duration-200"
                                value={settingsName}
                                onChange={(e) => setSettingsName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-secondary text-[9px] uppercase tracking-[0.2em] font-bold mb-3 pl-0.5 font-mono">Chave de Segurança (Senha)</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-4 top-4 text-gray-700 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                className="w-full bg-surface border border-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all duration-200"
                                placeholder="DEIXE EM BRANCO PARA MANTER"
                                value={settingsPassword}
                                onChange={(e) => setSettingsPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border flex justify-end">
                        <Button className="!w-auto px-10 h-14" onClick={handleSaveSettings} isLoading={isSavingSettings}>Salvar Alterações</Button>
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex font-sans overflow-hidden">

            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-surface/30 backdrop-blur-md flex-col hidden lg:flex sticky top-0 h-screen z-20">
                <div className="p-10 border-b border-white/5">
                    <div className="flex items-center gap-4 text-primary">
                        <Command size={28} />
                        <span className="font-bold text-2xl text-white tracking-tight">Panis<span className="text-primary">Master</span></span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold ml-11 mt-2 block">Enterprise Management</span>
                </div>

                <nav className="flex-1 p-8 space-y-4">
                    <NavItem active={activeView === 'GENERATOR'} onClick={() => setActiveView('GENERATOR')} icon={<Layout size={20} />} label="Bancada Neura" />
                    <NavItem active={activeView === 'HISTORY'} onClick={() => setActiveView('HISTORY')} icon={<History size={20} />} label="Arquivos" />
                    <NavItem active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} icon={<BarChart3 size={20} />} label="Telemetria" />
                    <NavItem active={activeView === 'SETTINGS'} onClick={() => setActiveView('SETTINGS')} icon={<Settings size={20} />} label="Configuração" />
                </nav>

                <div className="p-8 border-t border-white/5 bg-black/20">
                    <Card className="!p-8 bg-primary/5 border-primary/10 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Créditos</span>
                            <Zap size={16} className="text-primary fill-current" />
                        </div>
                        <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden mb-6">
                            <div className="bg-primary h-full transition-all duration-1000 ease-out shadow-lg shadow-primary/40" style={{ width: `${Math.min((currentUser.credits / 10) * 100, 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-primary shadow-lg shadow-primary/50 animate-pulse' : 'bg-warning'}`}></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{isCloudActive ? 'NÚVEM: ATIVO' : 'LOCAL: ISOLADO'}</span>
                            </div>
                            <p className="text-[11px] text-primary font-bold text-right">{currentUser.credits} UNID</p>
                        </div>
                    </Card>
                    <button onClick={onLogout} className="flex items-center gap-4 text-secondary hover:text-white px-4 py-3 w-full transition-all text-sm font-bold uppercase tracking-widest group rounded-pm border border-transparent hover:border-white/5 hover:bg-white/5">
                        <LogOut size={18} className="group-hover:text-danger transition-colors" /> Encerrar Sessão
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto relative h-screen bg-dots-pattern">
                {/* Mobile Header */}
                <header className="lg:hidden border-b border-white/5 bg-surface/80 p-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-xl">
                    <span className="font-display font-bold text-white text-xl">Panis<span className="text-primary">Master</span></span>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-primary font-bold flex items-center gap-1 border border-primary/20 px-3 py-1 rounded-full bg-primary/10">
                            <Zap size={12} fill="currentColor" /> {currentUser.credits}
                        </div>
                        <button onClick={onLogout}><LogOut className="text-gray-400" size={20} /></button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-12 lg:p-20 pb-40">
                    <div className="mb-20 animate-fade-in relative">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
                            {activeView === 'GENERATOR' && 'Bancada Neural'}
                            {activeView === 'HISTORY' && 'Arquivos de Sistema'}
                            {activeView === 'ANALYTICS' && 'Telemetria do Nodo'}
                            {activeView === 'SETTINGS' && 'Configuração de Acesso'}
                        </h1>
                        <p className="text-secondary font-medium text-lg max-w-2xl leading-relaxed">Ambiente de engenharia de prompts de alta fidelidade para profissionais enterprise.</p>
                    </div>

                    {activeView === 'GENERATOR' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 animate-fade-in">
                            <StatCard icon={<Sparkles className="text-primary" size={24} />} label="Total de Builds" value={generatedCount.toString()} sub="PROJETOS" />
                            <StatCard icon={<Cpu className="text-primary" size={24} />} label="Motor Central" value="Gemini Pro" sub="ALTA_VELOCIDADE" />
                            <StatCard icon={<ShieldCheck className="text-primary" size={24} />} label="Status de Nó" value="Online" sub="SISTEMA ATIVO" />
                        </div>
                    )}

                    {activeView === 'GENERATOR' && renderGenerator()}
                    {activeView === 'HISTORY' && renderHistory()}
                    {activeView === 'ANALYTICS' && renderAnalytics()}
                    {activeView === 'SETTINGS' && renderSettings()}
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={showNoCreditsModal} onClose={() => setShowNoCreditsModal(false)} title="Saldo de Créditos Esgotado">
                <div className="text-center py-8">
                    <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-8 text-danger border border-danger/20">
                        <Zap size={48} fill="currentColor" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white mb-4">Créditos Esgotados</h3>
                    <p className="text-gray-400 mb-10 px-6 leading-relaxed">Seu saldo de créditos acabou. Para adquirir mais, entre em contato direto pelo WhatsApp abaixo:</p>
                    <Button onClick={() => window.open('https://wa.me/5571988637705?text=Olá,%20gostaria%20de%20comprar%20mais%20créditos%20para%20continuar%20usando%20o%20sistema.', '_blank')} className="h-14 text-lg w-full">
                        <MessageCircle className="fill-current" size={24} /> Comprar Créditos (WhatsApp)
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// Components
const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-pm transition-all duration-200 group relative ${active ? 'bg-primary/10 text-white border border-primary/20 shadow-lg shadow-primary/5' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}>
        {active && <div className="absolute left-0 w-1.5 h-1/2 bg-primary rounded-full -translate-x-1/2"></div>}
        <div className={`transition-all duration-300 ${active ? 'text-primary' : 'group-hover:text-primary'}`}>{icon}</div>
        <span className="font-bold text-sm tracking-wide">{label}</span>
    </button>
);

const StatCard = ({ icon, label, value, sub }: any) => (
    <Card className="flex items-center gap-8 hover:border-primary/40 transition-all duration-500 group">
        <div className="w-16 h-16 bg-black/40 border border-white/5 rounded-pm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
            {React.cloneElement(icon, { className: "group-hover:text-white transition-colors" })}
        </div>
        <div>
            <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
            <div className="flex items-baseline gap-4">
                <h4 className="text-4xl font-bold text-white tracking-tight">{value}</h4>
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wide">{sub}</span>
            </div>
        </div>
    </Card>
);