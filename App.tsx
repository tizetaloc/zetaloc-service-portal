import React, { useState, useRef, ErrorInfo, ReactNode } from 'react';
import { 
  Building2, 
  Hash, 
  Camera, 
  FileText, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Briefcase,
  Image as ImageIcon,
  LocateFixed,
  X,
  Loader2,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Map,
  Navigation,
  Wrench
} from 'lucide-react';
import { InputField, TextAreaField, ToggleSwitch, SectionHeader, LoadingOverlay, SubmitButton, SelectField } from './components/FormComponents';
import { FormData, FormErrors, Participant } from './types';
import { LOGO_URL, WEBHOOK_URL, JOB_ROLES, EQUIPMENT_MODELS, PROBLEM_TYPES } from './config';

// ============================================================================
// LÓGICA DO APP
// ============================================================================

const ExcavatorIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 17h11v4H2z" />
    <path d="M5 17V8h6v9" />
    <path d="M5 12h6" />
    <path d="M11 10h3l4 6" />
    <path d="M18 16l2 2l2-3" />
  </svg>
);

const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // OTIMIZAÇÃO CRÍTICA PARA SERVIDORES NGINX/N8N
        // Reduzido para 1000px e qualidade 0.5 para garantir payloads < 1MB
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Qualidade reduzida para 50% para evitar erro 413 (Payload Too Large)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5); 
            resolve(dataUrl);
        } else {
            reject(new Error("Falha ao processar contexto de imagem"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Explicitly use React.Component to resolve inheritance and property visibility issues (state/props)
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
           <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-l-4 border-red-600">
             <div className="flex items-center gap-3 text-red-600 mb-4">
               <AlertTriangle size={32} />
               <h2 className="text-xl font-bold">Algo deu errado</h2>
             </div>
             <p className="text-gray-600 mb-4">Ocorreu um erro inesperado na aplicação.</p>
             <button 
               onClick={() => window.location.reload()} 
               className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
             >
               Recarregar Página
             </button>
           </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CheckIcon = ({ size }: { size: number }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const AppContent: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    isMachineStopped: false,
    equipmentModel: '',
    serialNumber: '',
    problemDescription: '',
    problemType: '',
    hourMeter: '',
    location: '',
    mapsLink: '', 
    responsibleName: '',
    responsibleRole: '',
    responsibleEmail: '',
    responsibleContact: '',
    additionalParticipants: [],
    platePhoto: null,
    evidenceFiles: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const plateInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, serialNumber: value }));
    if (errors.serialNumber) {
        setErrors(prev => ({ ...prev, serialNumber: undefined }));
    }
  };

  const handleToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isMachineStopped: checked }));
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        let addressDisplay = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.address) {
                const parts = [
                    data.address.road,
                    data.address.house_number,
                    data.address.suburb,
                    data.address.city || data.address.town || data.address.village,
                    data.address.state
                ].filter(Boolean);
                
                if (parts.length > 0) {
                    addressDisplay = parts.join(', ');
                }
            }
        } catch (error) {
            console.warn("Could not fetch address details, using coords.", error);
        }

        setFormData(prev => ({ 
            ...prev, 
            location: addressDisplay,
            mapsLink: mapsLink 
        }));
        
        setIsLocating(false);
        setErrors(prev => ({ ...prev, location: undefined }));
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Não foi possível obter a localização.";
        if (error.code === error.PERMISSION_DENIED) errorMessage = "Permissão de localização negada.";
        else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Sinal de GPS indisponível.";
        else if (error.code === error.TIMEOUT) errorMessage = "Tempo esgotado ao buscar GPS.";
        
        alert(errorMessage);
        setIsLocating(false);
      },
      options
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'platePhoto' | 'evidenceFiles') => {
    if (e.target.files && e.target.files.length > 0) {
      if (field === 'platePhoto') {
        setFormData(prev => ({ ...prev, platePhoto: e.target.files![0] }));
        setErrors(prev => ({ ...prev, platePhoto: undefined }));
      } else {
        const newFiles = Array.from(e.target.files!);
        setFormData(prev => ({ ...prev, evidenceFiles: [...prev.evidenceFiles, ...newFiles] }));
      }
    }
  };

  const removeEvidence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      additionalParticipants: [
        ...prev.additionalParticipants,
        { id: Math.random().toString(36).substr(2, 9), name: '', role: '', email: '', phone: '' }
      ]
    }));
  };

  const removeParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalParticipants: prev.additionalParticipants.filter(p => p.id !== id)
    }));
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalParticipants: prev.additionalParticipants.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const isValidFullName = (name: string) => {
    return name.trim().split(/\s+/).length >= 2;
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!formData.companyName) newErrors.companyName = "Nome da empresa é obrigatório";
    if (!formData.equipmentModel) newErrors.equipmentModel = "Modelo é obrigatório";
    
    if (!formData.serialNumber) {
        newErrors.serialNumber = "Número de série é obrigatório";
    } else if (formData.serialNumber.length < 4) {
        newErrors.serialNumber = "Mínimo 4 dígitos";
    }

    if (!formData.hourMeter) newErrors.hourMeter = "Horímetro é obrigatório";
    if (!formData.problemType) newErrors.problemType = "Tipo do problema é obrigatório";
    if (!formData.problemDescription) newErrors.problemDescription = "Descrição do problema é obrigatória";
    if (!formData.location) newErrors.location = "Localização é obrigatória";
    
    if (!formData.responsibleName) {
      newErrors.responsibleName = "Nome do responsável é obrigatório";
    } else if (!isValidFullName(formData.responsibleName)) {
      newErrors.responsibleName = "Informe o nome completo (Nome e Sobrenome)";
    }

    if (!formData.responsibleContact) newErrors.responsibleContact = "Contato é obrigatório";
    if (!formData.responsibleRole) newErrors.responsibleRole = "Cargo é obrigatório";
    if (!formData.platePhoto) newErrors.platePhoto = "Foto da plaqueta é obrigatória";

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();

    const invalidParticipants = formData.additionalParticipants.filter(p => !isValidFullName(p.name));
    if (invalidParticipants.length > 0) {
      alert("Por favor, informe o nome completo de todos os participantes adicionais.");
      return;
    }

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);

      try {
        let platePhotoObject = null;
        if (formData.platePhoto) {
          const base64 = await processImage(formData.platePhoto);
          platePhotoObject = {
            name: formData.platePhoto.name,
            type: formData.platePhoto.type,
            content: base64
          };
        }

        const evidenceFilesObjects = await Promise.all(
          formData.evidenceFiles.map(async (file) => ({
            name: file.name,
            type: file.type,
            content: await processImage(file)
          }))
        );

        const payload = {
          companyName: formData.companyName,
          isMachineStopped: formData.isMachineStopped,
          equipmentModel: formData.equipmentModel,
          serialNumber: formData.serialNumber,
          problemDescription: formData.problemDescription,
          problemType: formData.problemType,
          hourMeter: formData.hourMeter,
          location: formData.location,
          mapsLink: formData.mapsLink || "",
          responsibleName: formData.responsibleName,
          responsibleRole: formData.responsibleRole,
          responsibleEmail: formData.responsibleEmail,
          responsibleContact: formData.responsibleContact,
          additionalParticipants: formData.additionalParticipants,
          platePhoto: platePhotoObject,
          evidenceFiles: evidenceFilesObjects,
          submittedAt: new Date().toISOString()
        };

        const jsonPayload = JSON.stringify(payload);
        // Debug para verificar tamanho do payload
        console.log(`Payload size: ${(jsonPayload.length / 1024).toFixed(2)} KB`);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors', // Garante que o CORS seja respeitado
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: jsonPayload,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Sem detalhes');
            if (response.status === 413) {
                throw new Error("As imagens anexadas são muito grandes. Tente enviar menos fotos ou fotos menores.");
            }
            throw new Error(`Erro no servidor: ${response.status} - ${errorText}`);
        }

        setIsSubmitting(false);
        setShowSuccess(true);
      } catch (error: any) {
        console.error("❌ Erro ao enviar:", error);
        
        let msg = "Não foi possível enviar o chamado.";
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            msg = "Erro de conexão. Verifique sua internet ou se o servidor n8n está acessível.";
        } else if (error.message) {
            msg = error.message;
        }
        
        alert(msg);
        setIsSubmitting(false);
      }
    } else {
        const firstErrorField = Object.keys(validationErrors)[0];
        if (firstErrorField === 'platePhoto') {
            document.getElementById('plate-photo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const element = document.getElementsByName(firstErrorField)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (element as HTMLElement).focus();
            }
        }
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-zetaloc-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded shadow-lg p-8 max-w-md w-full animate-in zoom-in duration-300 border-t-4 border-zetaloc-primary">
          <div className="w-20 h-20 bg-red-50 text-zetaloc-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon size={40} />
          </div>
          <h2 className="text-2xl font-bold text-zetaloc-secondary mb-2">Chamado Aberto!</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Sua solicitação para o equipament <strong className="text-zetaloc-secondary">{formData.equipmentModel}</strong> foi enviada com sucesso e em breve nossa equipe técnica entrará em contato.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-zetaloc-primary text-white py-3 rounded font-bold hover:bg-[#B91C1C] transition-colors uppercase text-sm tracking-wide"
          >
            Abrir Novo Chamado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zetaloc-bg font-sans">
      <div className="bg-zetaloc-primary pt-8 pb-24 px-6 shadow-lg relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
           <div className="flex items-center justify-between mb-8">
             <img src={LOGO_URL} alt="Zetaloc" className="h-10 w-auto object-contain opacity-95"/>
           </div>
           <div className="animate-in slide-in-from-bottom-2 duration-500">
             <h2 className="text-3xl font-bold text-white tracking-tight">Abertura de Chamado</h2>
             <p className="text-white/80 text-base mt-2 font-light max-w-lg">Solicite suporte técnico especializado preenchendo as informações abaixo.</p>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      <main className="px-4 max-w-3xl mx-auto relative z-20 -mt-12 pb-20">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 sm:p-10 space-y-4">
          <SectionHeader title="Dados da Empresa" />
          <InputField 
            label="Nome da Empresa / Cliente" name="companyName" placeholder="Digite o nome da empresa" 
            value={formData.companyName} onChange={handleChange} error={errors.companyName}
            icon={<Building2 className="text-zetaloc-detail" size={16} />}
          />

          <SectionHeader title="Status e Equipamento" subtitle="Informações técnicas" />
          <div className="mb-6">
             <ToggleSwitch 
                label="Equipamento Parado" description="Selecione apenas se a máquina estiver inoperante."
                checked={formData.isMachineStopped} onChange={handleToggle}
             />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <SelectField 
                label="Modelo" name="equipmentModel" 
                value={formData.equipmentModel} onChange={handleChange} error={errors.equipmentModel}
                options={EQUIPMENT_MODELS}
                icon={<ExcavatorIcon className="text-zetaloc-detail" size={16} />}
              />
            </div>
            <InputField 
              label="Número de Série" name="serialNumber" placeholder="4 últimos dígitos" 
              value={formData.serialNumber} onChange={handleSerialChange} error={errors.serialNumber}
              icon={<Hash className="text-zetaloc-detail" size={16} />}
              maxLength={4} type="tel"
            />
             <InputField 
              label="Horímetro" name="hourMeter" type="number" placeholder="0000.0" 
              value={formData.hourMeter} onChange={handleChange} error={errors.hourMeter}
              icon={<Clock className="text-zetaloc-detail" size={16} />}
            />
          </div>

          <div className="mt-6" id="plate-photo-section">
            <label className="block text-sm font-semibold text-zetaloc-secondary mb-2 flex items-center gap-2">
              <Camera className="text-zetaloc-detail" size={16} /> Foto da Plaqueta
            </label>
            <div 
              className={`border border-dashed rounded p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${errors.platePhoto ? 'border-zetaloc-primary bg-red-50' : 'border-gray-300 hover:border-zetaloc-primary hover:bg-gray-50'}`}
              onClick={() => plateInputRef.current?.click()}
            >
              <input type="file" ref={plateInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'platePhoto')} />
              {formData.platePhoto ? (
                <div className="relative w-full h-32">
                    <img src={URL.createObjectURL(formData.platePhoto)} alt="Preview" className="w-full h-full object-contain rounded" />
                    <button type="button" className="absolute top-0 right-0 bg-zetaloc-primary text-white rounded-full p-1 shadow-md hover:bg-red-700"
                        onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, platePhoto: null})); }}>
                        <X size={14} />
                    </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-100 p-3 rounded-full mb-2"><Camera className="w-5 h-5 text-gray-500" /></div>
                  <p className="text-sm text-gray-600 font-medium">Carregar foto</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">Obrigatório</p>
                </>
              )}
            </div>
             {errors.platePhoto && <p className="mt-1 text-xs text-zetaloc-primary font-medium">{errors.platePhoto}</p>}
          </div>

          <SectionHeader title="Relato do Problema" subtitle="Descreva o defeito apresentado" />
          <div className="space-y-6">
            <SelectField 
                label="Tipo de Problema" name="problemType" 
                value={formData.problemType} onChange={handleChange} error={errors.problemType}
                options={PROBLEM_TYPES}
                icon={<AlertTriangle className="text-zetaloc-detail" size={16} />}
            />
            <TextAreaField 
              label="Descrição Detalhada" name="problemDescription" placeholder="Descreva os sintomas apresentados pela máquina..." 
              value={formData.problemDescription} onChange={handleChange} error={errors.problemDescription}
              icon={<FileText className="text-zetaloc-detail" size={16} />}
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-zetaloc-secondary mb-2 flex items-center gap-2">
              <ImageIcon className="text-zetaloc-detail" size={16} /> Evidências Visuais
            </label>
            <div 
                className="border border-dashed border-gray-300 rounded p-4 hover:bg-gray-50 transition-colors cursor-pointer text-center py-6"
                onClick={() => evidenceInputRef.current?.click()}
            >
               <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
               <p className="text-sm text-gray-600 font-medium">Adicionar fotos ou vídeos extras</p>
               <input type="file" ref={evidenceInputRef} className="hidden" multiple accept="image/*,video/*" onChange={(e) => handleFileChange(e, 'evidenceFiles')} />
            </div>
            {formData.evidenceFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                    {formData.evidenceFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200 group">
                            <img src={URL.createObjectURL(file)} alt="Evidence" className="w-full h-full object-cover" />
                             <button type="button" className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5" onClick={() => removeEvidence(idx)}><X size={10} /></button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <SectionHeader title="Local e Contato" />
          <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-zetaloc-secondary flex items-center gap-2 mb-2">
                        <MapPin className="text-zetaloc-detail" size={16} /> Localização do Equipamento
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <input 
                                className={`w-full px-4 py-3 pl-10 rounded border bg-white focus:ring-1 focus:ring-zetaloc-primary outline-none text-gray-700 shadow-sm transition-all ${errors.location ? 'border-zetaloc-primary' : 'border-gray-200'}`}
                                placeholder="Endereço ou coordenadas" value={formData.location} 
                                onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))} name="location" 
                            />
                            <div className="absolute left-3 top-3.5 text-gray-400">
                                <MapPin size={16} />
                            </div>
                        </div>
                        <button 
                            type="button" onClick={handleLocationClick} disabled={isLocating}
                            className="bg-zetaloc-secondary text-white hover:bg-[#5a0d09] px-5 py-3 rounded font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all sm:w-auto min-w-[180px]"
                        >
                            {isLocating ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} />}
                            <span>{isLocating ? '...' : 'Localização Atual'}</span>
                        </button>
                    </div>
                    {formData.mapsLink && (
                         <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-2">
                            <CheckCircle2 size={14} /> Localização detectada
                            <a href={formData.mapsLink} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1"><Map size={12}/> Ver mapa</a>
                         </div>
                    )}
                    {errors.location && <p className="mt-1 text-xs text-zetaloc-primary font-medium flex items-center gap-1"><AlertTriangle size={12}/> {errors.location}</p>}
                </div>

                <div className="bg-gray-50 p-6 rounded border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 text-zetaloc-secondary border-b border-gray-200 pb-2 font-bold text-sm uppercase tracking-wider"><User size={18} /> Responsável</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nome Completo" name="responsibleName" placeholder="Nome do responsável" value={formData.responsibleName} onChange={handleChange} error={errors.responsibleName} icon={<User className="text-zetaloc-detail" size={16} />} />
                        <SelectField label="Cargo" name="responsibleRole" value={formData.responsibleRole} onChange={handleChange} error={errors.responsibleRole} options={JOB_ROLES} icon={<Briefcase className="text-zetaloc-detail" size={16} />} />
                        <InputField label="E-mail" name="responsibleEmail" type="email" placeholder="email@exemplo.com" value={formData.responsibleEmail} onChange={handleChange} error={errors.responsibleEmail} icon={<Mail className="text-zetaloc-detail" size={16} />} />
                        <InputField label="Telefone / WhatsApp" name="responsibleContact" placeholder="(00) 00000-0000" value={formData.responsibleContact} onChange={handleChange} error={errors.responsibleContact} icon={<Phone className="text-zetaloc-detail" size={16} />} />
                    </div>
                </div>

                {formData.additionalParticipants.map((participant, index) => (
                    <div key={participant.id} className="bg-white p-6 rounded border border-gray-200 relative group">
                        <button type="button" onClick={() => removeParticipant(participant.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        <div className="flex items-center gap-2 mb-4 text-gray-500 border-b border-gray-100 pb-2 font-bold text-xs uppercase tracking-wider"><Users size={18} /> Participante #{index + 1}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField 
                                label="Nome Completo" 
                                value={participant.name} 
                                onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)} 
                                placeholder="Nome do participante"
                                icon={<User className="text-zetaloc-detail" size={16} />}
                            />
                            <SelectField 
                                label="Cargo" 
                                value={participant.role} 
                                onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)} 
                                options={JOB_ROLES}
                                icon={<Briefcase className="text-zetaloc-detail" size={16} />}
                            />
                            <InputField 
                                label="E-mail" 
                                name={`participant_email_${index}`}
                                type="email" 
                                placeholder="email@exemplo.com" 
                                value={participant.email} 
                                onChange={(e) => updateParticipant(participant.id, 'email', e.target.value)} 
                                icon={<Mail className="text-zetaloc-detail" size={16} />} 
                            />
                            <InputField 
                                label="Telefone / WhatsApp" 
                                name={`participant_phone_${index}`}
                                placeholder="(00) 00000-0000" 
                                value={participant.phone} 
                                onChange={(e) => updateParticipant(participant.id, 'phone', e.target.value)} 
                                icon={<Phone className="text-zetaloc-detail" size={16} />} 
                            />
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addParticipant} className="w-full py-3 border-2 border-dashed border-gray-300 rounded flex items-center justify-center gap-2 text-gray-500 hover:text-zetaloc-secondary hover:border-zetaloc-secondary transition-all font-medium text-sm uppercase tracking-wide">
                    <Plus size={16} /> Adicionar Participante
                </button>
          </div>

          <div className="pt-8">
            <SubmitButton label="Registrar Chamado" onClick={() => {}} disabled={isSubmitting} />
          </div>
        </form>
      </main>
      
      {isSubmitting && <LoadingOverlay message="Enviando chamado..." />}
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;