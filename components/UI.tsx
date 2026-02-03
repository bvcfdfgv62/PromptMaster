import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => (
  <div className={`flex items-center gap-4 px-8 py-5 rounded-pm shadow-2xl backdrop-blur-xl border border-white/10 ${type === 'success' ? 'bg-success/10 text-success border-success/20' : type === 'error' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
    <div className="font-sans font-bold text-sm tracking-wide uppercase">{message}</div>
    <button onClick={onClose} className="hover:opacity-50 transition-opacity"><X size={16} /></button>
  </div>
);

// --- Toast System ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="animate-slide-up pointer-events-auto">
            <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- Card ---
// Card Component
export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-surface border border-white/5 p-8 rounded-pm shadow-pm transition-all duration-300 ${className}`}>
    {children}
  </div>
);

// --- Button ---
// Button Component
export const Button = ({ children, onClick, variant = 'primary', isLoading, className = "", disabled, type = 'button' }: any) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
    secondary: 'bg-white/5 text-secondary hover:bg-white/10 border border-white/10',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
    whatsapp: "bg-[#25D366] hover:bg-[#1ebc59] text-white border-transparent",
    ghost: 'bg-transparent text-secondary hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-3 px-8 py-4 rounded-pm font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
  );
};

// --- Input ---
// Input Component
export const Input = ({ label, type = "text", value, onChange, placeholder, icon, disabled, required }: any) => (
  <div className="space-y-3 group">
    {label && <label className="block text-[11px] font-bold text-secondary uppercase tracking-[0.1em] group-focus-within:text-primary transition-colors">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">{icon}</div>}
      <input
        required={required}
        disabled={disabled}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-black/40 border border-white/5 rounded-pm px-5 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all ${icon ? 'pl-12' : ''} disabled:opacity-50`}
      />
    </div>
  </div>
);

// --- Select ---
// Select Component
export const Select = ({ label, value, onChange, options, icon }: any) => (
  <div className="space-y-3 group">
    {label && <label className="block text-[11px] font-bold text-secondary uppercase tracking-[0.1em] group-focus-within:text-primary transition-colors">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">{icon}</div>}
      <select
        value={value}
        onChange={onChange}
        className={`w-full bg-black/40 border border-white/5 rounded-pm px-5 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer ${icon ? 'pl-12' : ''}`}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-white">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none group-focus-within:text-primary transition-colors">
        <ChevronDown size={18} />
      </div>
    </div>
  </div>
);

// --- Modal ---
// Modal Component
export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-12 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-pm shadow-2xl relative z-10 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20">
          <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-secondary hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 lg:p-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};