import React from 'react';
import { AlertCircle, Check, Loader2, ChevronDown } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const InputField: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => (
  <div className="w-full group">
    <label className="block text-sm font-semibold text-zetaloc-secondary mb-1.5 flex items-center gap-2 transition-colors group-focus-within:text-zetaloc-primary">
      {icon}
      {label}
    </label>
    <input
      className={`w-full px-4 py-3 rounded border bg-white focus:ring-1 focus:ring-zetaloc-primary focus:border-zetaloc-primary transition-all outline-none text-gray-700 placeholder-gray-400 shadow-sm ${
        error ? 'border-zetaloc-primary/50 ring-1 ring-zetaloc-primary/20' : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-zetaloc-primary flex items-center gap-1 font-medium"><AlertCircle size={12} /> {error}</p>}
  </div>
);

// Tipo para suportar strings simples ou objetos de grupo
type SelectOption = string | { category: string; items: string[] };

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  icon?: React.ReactNode;
}

export const SelectField: React.FC<SelectProps> = ({ label, options, error, icon, className, ...props }) => (
  <div className="w-full group">
    <label className="block text-sm font-semibold text-zetaloc-secondary mb-1.5 flex items-center gap-2 transition-colors group-focus-within:text-zetaloc-primary">
      {icon}
      {label}
    </label>
    <div className="relative">
      <select
        className={`w-full px-4 py-3 rounded border bg-white focus:ring-1 focus:ring-zetaloc-primary focus:border-zetaloc-primary transition-all outline-none text-gray-700 shadow-sm appearance-none cursor-pointer ${
          error ? 'border-zetaloc-primary/50 ring-1 ring-zetaloc-primary/20' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="" disabled>Selecione uma opção...</option>
        {options.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          } else {
            return (
              <optgroup key={index} label={option.category}>
                {option.items.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </optgroup>
            );
          }
        })}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
        <ChevronDown size={16} />
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-zetaloc-primary flex items-center gap-1 font-medium"><AlertCircle size={12} /> {error}</p>}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TextAreaField: React.FC<TextAreaProps> = ({ label, error, icon, className, ...props }) => (
  <div className="w-full group">
    <label className="block text-sm font-semibold text-zetaloc-secondary mb-1.5 flex items-center gap-2 transition-colors group-focus-within:text-zetaloc-primary">
      {icon}
      {label}
    </label>
    <textarea
      className={`w-full px-4 py-3 rounded border bg-white focus:ring-1 focus:ring-zetaloc-primary focus:border-zetaloc-primary transition-all outline-none min-h-[120px] resize-y text-gray-700 placeholder-gray-400 shadow-sm ${
        error ? 'border-zetaloc-primary/50 ring-1 ring-zetaloc-primary/20' : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-zetaloc-primary flex items-center gap-1 font-medium"><AlertCircle size={12} /> {error}</p>}
  </div>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleProps> = ({ label, checked, onChange, description }) => (
  <div 
    className={`p-4 rounded border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${checked ? 'border-zetaloc-primary bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} 
    onClick={() => onChange(!checked)}
  >
    <div className="flex-1">
      <div className={`font-bold uppercase tracking-wide text-sm ${checked ? 'text-zetaloc-primary' : 'text-gray-600'}`}>{label}</div>
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
    </div>
    <div className={`w-12 h-6 rounded-full p-0.5 transition-colors relative ${checked ? 'bg-zetaloc-primary' : 'bg-gray-300'}`}>
      <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6 mt-8 pb-2 border-b border-gray-200">
    <h3 className="text-lg font-bold text-zetaloc-secondary uppercase tracking-wider">{title}</h3>
    {subtitle && <p className="text-sm text-gray-500 mt-1 font-light">{subtitle}</p>}
  </div>
);

export const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-zetaloc-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
      <Loader2 className="w-10 h-10 text-zetaloc-primary animate-spin mb-4" />
      <p className="text-zetaloc-secondary font-bold">{message}</p>
    </div>
  </div>
);

export const SubmitButton: React.FC<{ onClick: () => void; disabled?: boolean; label: string }> = ({ onClick, disabled, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full bg-zetaloc-primary hover:bg-[#B91C1C] text-white font-bold py-4 px-6 rounded shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] uppercase tracking-wide text-sm"
  >
    {disabled ? <Loader2 className="animate-spin" /> : <Check />}
    {label}
  </button>
);