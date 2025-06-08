import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle2, X, Save, User, MapPin, Heart, Star, Sparkles, GraduationCap } from "lucide-react";

// Constants and Types
const SALARIO_MINIMO = 1518.00;

interface FormVoluntarioData {
  nomeCompleto: string;
  telefone: string;
  dataNascimento: string;
  genero: string;
  cpf: string;
  faixaSalarial: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  funcao: string;
  profissao: string;
  crm?: string;
  tipo: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

type FieldState = 'valid' | 'invalid' | 'default';

interface PrimeiraFaseData {
  nome?: string;
  sobrenome?: string;
  email?: string;
  dataNascimento?: string;
  telefone?: string;
  cpf?: string;
  id?: number;
}

// Components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ className, children, ...props }) => (
  <button className={className} {...props}>{children}</button>
);

// Helper functions
const convertFaixaSalarialToNumber = (faixa: string): number => {
  switch (faixa) {
    case 'ate-1-salario': return SALARIO_MINIMO;
    case '1-a-2-salarios': return SALARIO_MINIMO * 2;
    case '2-a-3-salarios': return SALARIO_MINIMO * 3;
    case '3-a-5-salarios': return SALARIO_MINIMO * 5;
    case '5-a-10-salarios': return SALARIO_MINIMO * 10;
    case 'acima-10-salarios': return SALARIO_MINIMO * 11;
    default: return SALARIO_MINIMO;
  }
};

const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
};

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// Styles
const formClasses = {
  input: "w-full px-4 py-2.5 text-base text-gray-700 bg-white/90 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200",
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  select: "w-full px-4 py-2.5 text-base text-gray-700 bg-white/90 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200",
  error: "text-red-500 text-xs mt-1",
  section: {
    pessoal: "bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-4 sm:p-8 border border-blue-100/50 dark:border-gray-600/30 backdrop-blur-sm relative overflow-hidden mb-8",
    endereco: "bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-4 sm:p-8 border border-green-100/50 dark:border-gray-600/30 backdrop-blur-sm relative overflow-hidden mb-8",
    profissional: "bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-4 sm:p-8 border border-purple-100/50 dark:border-gray-600/30 backdrop-blur-sm relative overflow-hidden mb-8"
  },
  sectionTitle: {
    pessoal: "text-xl font-bold mb-6 text-blue-700 dark:text-blue-300 flex items-center gap-2",
    endereco: "text-xl font-bold mb-6 text-green-700 dark:text-green-300 flex items-center gap-2",
    profissional: "text-xl font-bold mb-6 text-purple-700 dark:text-purple-300 flex items-center gap-2"
  }
};

// Animations
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 }
  }
};

export function CompletarCadastroVoluntario() {
  // State
  const [formData, setFormData] = useState<FormVoluntarioData>({
    nomeCompleto: "",
    telefone: "",
    dataNascimento: "",
    genero: "",
    cpf: "",
    faixaSalarial: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    funcao: "",
    profissao: "",
    crm: "",
    tipo: "VOLUNTARIO",
  });  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [fetchUserError, setFetchUserError] = useState<string | null>(null);
  const [primeiraFaseData, setPrimeiraFaseData] = useState<PrimeiraFaseData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const idUsuario = searchParams.get('id');

  // Função para gerar senha padrão
  const generateDefaultPassword = (cpf: string, dataNascimento: string): string => {
    const cpfDigits = cpf.replace(/\D/g, '');
    const firstThreeCpfDigits = cpfDigits.substring(0, 3);
    const birthDate = dataNascimento.replace(/\D/g, '');
    return firstThreeCpfDigits + birthDate;
  };
  const validateField = (fieldName: string, value: string) => {
    let isValid = true;
    let errorMessage = "";
    switch (fieldName) {
      case 'dataNascimento':
        if (!value) {
          errorMessage = "Data de nascimento é obrigatória";
          isValid = false;
        }
        break;
      case 'genero':
        if (!value) {
          errorMessage = "Gênero é obrigatório";
          isValid = false;
        }
        break;
      case 'renda':
        if (!value || isNaN(Number(value))) {
          errorMessage = "Renda obrigatória e deve ser um número";
          isValid = false;
        }
        break;
      case 'funcao':
        if (!value) {
          errorMessage = "Função é obrigatória";
          isValid = false;
        }
        break;
      case 'profissao':
        if (!value) {
          errorMessage = "Profissão é obrigatória";
          isValid = false;
        }
        break;
      case 'cep': {
        const cepRegex = /^\d{5}-\d{3}$/;
        if (!value) {
          errorMessage = "CEP é obrigatório";
          isValid = false;
        } else if (!cepRegex.test(value)) {
          errorMessage = "CEP inválido (formato: 00000-000)";
          isValid = false;
        }
        break;
      }
      case 'numero':
        if (!value) {
          errorMessage = "Número é obrigatório";
          isValid = false;
        }
        break;
      case 'ddd':
        if (!value || value.length !== 2) {
          errorMessage = "DDD obrigatório (2 dígitos)";
          isValid = false;
        }
        break;
      case 'telefone': {
        const cleanPhone = value.replace(/\D/g, '');
        if (!value) {
          errorMessage = "Telefone é obrigatório";
          isValid = false;
        } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          errorMessage = "Telefone deve ter 10 ou 11 dígitos";
          isValid = false;
        } else if (!/^\d+$/.test(cleanPhone)) {
          errorMessage = "Telefone deve conter apenas números";
          isValid = false;
        }
        break;
      }
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));
    setFieldStates(prev => ({ ...prev, [fieldName]: value ? (isValid ? 'valid' : 'invalid') : 'default' }));
    return isValid;
  };
  // Funções de formatação
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };
  const handleFieldChange = (fieldName: string, value: string) => {
    // Não permitir edição de campos somente leitura
    if (readOnlyFields.has(fieldName)) {
      return;
    }
    
    let formattedValue = value;

    // Apply formatting based on field type
    if (fieldName === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (fieldName === 'telefone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [fieldName]: formattedValue }));
    setChangedFields(prev => new Set(prev).add(fieldName));
    setTimeout(() => validateField(fieldName, formattedValue), 100);
  };

  // Handler para mudanças nos campos com máscara
  const handleMaskedFieldChange = (fieldName: string, value: string) => {
    // Não permitir edição de campos somente leitura
    if (readOnlyFields.has(fieldName)) {
      return;
    }
    
    let formattedValue = value;
    if (fieldName === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (fieldName === 'telefone') {
      formattedValue = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [fieldName]: formattedValue }));
    setChangedFields(prev => new Set(prev).add(fieldName));
    setTimeout(() => validateField(fieldName, formattedValue), 300);
  };

  // Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (changedFields.size > 0) {
        localStorage.setItem('voluntario_form_data', JSON.stringify(formData));
        localStorage.setItem('voluntario_form_timestamp', new Date().toISOString());
        setLastSaved(new Date());
        setChangedFields(new Set());
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [changedFields, formData]);  // Buscar dados do usuário quando o ID está disponível
  useEffect(() => {
    if (!idUsuario) {
      console.log("idUsuario não encontrado na URL.");
      return;
    }
    
    console.log("Buscando usuário com idUsuario:", idUsuario);
    setFetchingUser(true);
    setFetchUserError(null);
    
    fetch(`http://localhost:8080/usuarios/verificar-cadastro?idUsuario=${idUsuario}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Erro ao buscar dados do usuário');
        }
        const data = await res.json();
        console.log("Dados recebidos:", data);
        
        // Verificar se é usuário novo (sem dados da primeira fase completos)
        const hasBasicInfo = data.nome && data.cpf;
        setIsNewUser(!hasBasicInfo);
        
        // Determinar quais campos vieram do banco de dados e devem ser somente leitura
        const fieldsFromDB = new Set<string>();
        
        // Atualizar dados do formulário e marcar campos como somente leitura
        setFormData((prev) => {
          const updatedData = { ...prev };
          
          // Nome completo (combinação de nome + sobrenome)
          if (data.nome) {
            const nomeCompleto = data.sobrenome ? `${data.nome} ${data.sobrenome}` : data.nome;
            updatedData.nomeCompleto = nomeCompleto;
            fieldsFromDB.add('nomeCompleto');
          }
          
          // Email
          if (data.email) {
            updatedData.email = data.email;
            fieldsFromDB.add('email');
          }
          
          // CPF
          if (data.cpf) {
            updatedData.cpf = data.cpf;
            fieldsFromDB.add('cpf');
          }
          
          // Data de nascimento
          if (data.dataNascimento) {
            updatedData.dataNascimento = data.dataNascimento;
          }
          
          return updatedData;
        });
        
        // Marcar campos como somente leitura
        setReadOnlyFields(fieldsFromDB);
        
        // Salvar dados da primeira fase
        setPrimeiraFaseData(data);
      })
      .catch((error) => {
        console.error("Erro ao buscar usuário:", error);
        setFetchUserError(error.message);
      })
      .finally(() => setFetchingUser(false));
  }, [idUsuario]);  // Buscar usuário por email se idUsuario não existir
  useEffect(() => {
    if ((!idUsuario || idUsuario === '0') && formData.email && fieldStates.email === 'valid') {
      setFetchingUser(true);
      
      fetch(`http://localhost:8080/usuarios/verificar-cadastro?email=${encodeURIComponent(formData.email)}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Usuário não encontrado');
          }
          const data = await res.json();
          
          if (data) {
            // Verificar se é usuário novo (sem dados da primeira fase completos)
            const hasBasicInfo = data.nome && data.cpf;
            setIsNewUser(!hasBasicInfo);
            
            // Determinar quais campos vieram do banco de dados e devem ser somente leitura
            const fieldsFromDB = new Set<string>();
            
            // Atualizar dados do formulário e marcar campos como somente leitura
            setFormData((prev) => {
              const updatedData = { ...prev };
              
              // Nome completo (combinação de nome + sobrenome)
              if (data.nome) {
                const nomeCompleto = data.sobrenome ? `${data.nome} ${data.sobrenome}` : data.nome;
                updatedData.nomeCompleto = nomeCompleto;
                fieldsFromDB.add('nomeCompleto');
              }
              
              // Email
              if (data.email) {
                updatedData.email = data.email;
                fieldsFromDB.add('email');
              }
              
              // CPF
              if (data.cpf) {
                updatedData.cpf = data.cpf;
                fieldsFromDB.add('cpf');
              }
              
              // Data de nascimento
              if (data.dataNascimento) {
                updatedData.dataNascimento = data.dataNascimento;
              }
              
              return updatedData;
            });
            
            // Marcar campos como somente leitura
            setReadOnlyFields(fieldsFromDB);
            
            // Salvar dados da primeira fase
            setPrimeiraFaseData(data);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar usuário por email:", error);
        })
        .finally(() => setFetchingUser(false));
    }
  }, [formData.email, idUsuario, fieldStates.email]);

  // Busca endereço por CEP
  const fetchAddressByCep = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            complemento: data.complemento || prev.complemento,
          }));        } else {
          setErrors(prev => ({ ...prev, cep: "CEP não encontrado" }));
          setFieldStates(prev => ({ ...prev, cep: 'invalid' }));
        }
      }
    } catch {
      setErrors(prev => ({ ...prev, cep: "Erro ao buscar CEP" }));
      setFieldStates(prev => ({ ...prev, cep: 'invalid' }));
    }
  };

  // Validação geral
  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData])) isValid = false;
    });
    return isValid;
  };  // Payload para backend
  const getPayload = () => {
    // Clean up phone number - remove all non-digits and ensure proper format
    const cleanPhone = formData.telefone.replace(/\D/g, '');
    // Clean up CEP - remove all non-digits for backend
    const cleanCep = formData.cep.replace(/\D/g, '');
    
    // Parse phone number: 11 digits = ddd (2) + prefixo (5) + sufixo (4)
    let telefoneData = {};
    if (cleanPhone.length === 11) {
      telefoneData = {
        ddd: cleanPhone.substring(0, 2),
        prefixo: cleanPhone.substring(2, 7),
        sufixo: cleanPhone.substring(7, 11),
        whatsapp: true // Default to true for volunteers
      };
    } else if (cleanPhone.length === 10) {
      // Handle 10-digit numbers: ddd (2) + prefixo (4) + sufixo (4) -> convert to new format
      telefoneData = {
        ddd: cleanPhone.substring(0, 2),
        prefixo: "9" + cleanPhone.substring(2, 6), // Add 9 prefix for mobile
        sufixo: cleanPhone.substring(6, 10),
        whatsapp: true
      };
    }
    
    const payload: any = {
      // CPF is not included here since it comes from first phase
      dataNascimento: formData.dataNascimento,
      genero: formData.genero,
      renda: convertFaixaSalarialToNumber(formData.faixaSalarial),
      tipo: "VOLUNTARIO",
      endereco: {
        cep: cleanCep,
        numero: formData.numero,
        complemento: formData.complemento || "N/A" // Required field, provide default
      },
      telefone: telefoneData,
      profissao: formData.profissao
    };
    
    // Add optional fields
    if (formData.funcao) payload.funcao = formData.funcao;
    if (formData.crm) payload.crm = formData.crm;
    
    // Para usuários novos, incluir dados da primeira fase e senha
    if (isNewUser) {
      // Separar nome completo em nome e sobrenome
      const nomePartes = formData.nomeCompleto.trim().split(' ');
      const nome = nomePartes[0];
      const sobrenome = nomePartes.slice(1).join(' ') || '';
      
      const senha = generateDefaultPassword(formData.cpf, formData.dataNascimento);
      setGeneratedPassword(senha);
      
      payload.nome = nome;
      payload.sobrenome = sobrenome;
      payload.email = formData.email;
      payload.cpf = formData.cpf.replace(/\D/g, '');
      payload.senha = senha;
    }
    
    return payload;
  };
  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!idUsuario) {
        throw new Error("ID do usuário não encontrado na URL.");
      }

      if (!validateForm()) {
        throw new Error("Por favor, preencha todos os campos obrigatórios corretamente.");
      }

      const payload = getPayload();
      console.log('Enviando payload:', JSON.stringify(payload, null, 2));
      const url = `http://localhost:8080/usuarios/voluntario/fase2/${idUsuario}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resposta do servidor:', errorData);
        
        throw new Error(errorData.message || 'Erro ao completar cadastro');
      }

      // Limpar dados do localStorage
      localStorage.removeItem('voluntario_form_data');
      localStorage.removeItem('voluntario_form_timestamp');
      
      // Mostrar modal de sucesso
      setShowSuccessModal(true);
      
      // Para usuários existentes, redirecionar automaticamente após delay
      if (!isNewUser) {
        setTimeout(() => navigate('/login'), 2000);
      }
      // Para usuários novos, aguardar fechamento manual do modal

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar cadastro.';
      setSubmitError(errorMessage);
      
      console.error('Erro no submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter classes CSS do campo baseado no estado readonly
  const getFieldClasses = (fieldName: string, baseClass: string = formClasses.input) => {
    if (readOnlyFields.has(fieldName)) {
      return `${baseClass} bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-600 dark:text-gray-400`;
    }
    return baseClass;
  };

  // Renderização do campo com estado visual
  const renderFieldWithState = (fieldName: string, children: React.ReactNode) => {
    const state = fieldStates[fieldName] || 'default';
    return (
      <div className="relative">
        {children}
        {state === 'valid' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-[50%] transform -translate-y-1/2"
          >
            <Check className="w-5 h-5 text-green-500" />
          </motion.div>
        )}
      </div>
    );
  };

  // Layout e animações semelhantes à tela de anamnese
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-md w-full mx-4 overflow-hidden" initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} transition={{ duration: 0.4, type: "spring", stiffness: 300 }}>              <motion.button 
                onClick={() => {
                  setShowSuccessModal(false);
                  if (isNewUser) {
                    navigate('/login');
                  }
                }} 
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10" 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.button>
              <div className="p-8 text-center">
                <motion.div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 300 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>
                <motion.h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  Cadastro de Voluntário Completo!
                </motion.h3>
                
                {isNewUser ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                      Bem-vindo! Seu cadastro foi criado com sucesso.
                    </p>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sua senha padrão é:
                      </p>
                      <div className="bg-white dark:bg-gray-600 rounded border px-3 py-2 font-mono text-lg text-center font-bold text-blue-600 dark:text-blue-400">
                        {generatedPassword}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Guarde esta senha em local seguro. Você pode alterá-la após fazer login.
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Clique no X para ir para a tela de login.
                    </p>
                  </motion.div>
                ) : (
                  <motion.p className="text-gray-600 dark:text-gray-300 leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    Obrigado por completar seu cadastro como voluntário!
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lastSaved && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }} 
            className="fixed top-4 right-4 z-40 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Salvo automaticamente às {lastSaved.toLocaleTimeString()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-4 py-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="text-center mb-12">
          <div className="flex items-center justify-center gap-6 mb-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <img src="image/LogoIMA.png" alt="Logo Mãos Amigas" className="h-24 w-auto drop-shadow-2xl" />
            </motion.div>
            <div className="text-left">
              <motion.h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-blue-400 dark:to-purple-400 mb-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                Completar Cadastro do Voluntário
              </motion.h1>
              <motion.p className="text-xl text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Sparkles className="w-5 h-5" />
                Mãos Amigas
              </motion.p>
            </div>
          </div>          <motion.p className="text-gray-600 dark:text-gray-300 max-w-4xl mx-auto text-lg leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            Preencha o formulário para completar seu cadastro como voluntário.
          </motion.p>
        </motion.div><motion.div className="max-w-4xl mx-auto">
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
            >
              {submitError}
            </motion.div>
          )}
          {fetchUserError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg"
            >
              {fetchUserError}
            </motion.div>
          )}
          {fetchingUser && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg"
            >
              Carregando dados do usuário...
            </motion.div>
          )}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
            <div className="p-4 sm:p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">                
                {/* Seção 1 - Dados Pessoais */}
                <div className={formClasses.section.pessoal}>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className={formClasses.sectionTitle.pessoal}>
                      <User className="w-6 h-6" />
                      Dados Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                      {renderFieldWithState('nomeCompleto', (
                        <div>
                          <label className={formClasses.label}>
                            Nome Completo *
                            {readOnlyFields.has('nomeCompleto') && (
                              <span className="text-xs text-gray-500 ml-1">(vindos do cadastro)</span>
                            )}
                          </label>
                          <input 
                            type="text" 
                            className={getFieldClasses('nomeCompleto')}
                            value={formData.nomeCompleto} 
                            onChange={e => handleFieldChange('nomeCompleto', e.target.value)} 
                            placeholder="Ex: João da Silva"
                            readOnly={readOnlyFields.has('nomeCompleto')}
                          />
                          {errors.nomeCompleto && <span className={formClasses.error}>{errors.nomeCompleto}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('telefone', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Telefone *</label>
                          <input type="text" className="input" value={formData.telefone} onChange={e => handleMaskedFieldChange('telefone', e.target.value)} maxLength={15} placeholder="Ex: (11) 99999-9999" />
                          {errors.telefone && <span className="text-red-500 text-xs">{errors.telefone}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('dataNascimento', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Data de Nascimento *</label>
                          <input type="date" className="input" value={formData.dataNascimento} onChange={e => handleFieldChange('dataNascimento', e.target.value)} />
                          {errors.dataNascimento && <span className="text-red-500 text-xs">{errors.dataNascimento}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('genero', (
                        <div>
                          <label className={formClasses.label}>Gênero *</label>
                          <select 
                            className={formClasses.select} 
                            value={formData.genero} 
                            onChange={e => handleFieldChange('genero', e.target.value)}
                          >
                            <option value="">Selecione</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                            <option value="O">Outro</option>
                          </select>
                          {errors.genero && <span className={formClasses.error}>{errors.genero}</span>}
                        </div>
                      ))}                      {renderFieldWithState('cpf', (
                        <div>
                          <label className={formClasses.label}>
                            CPF *
                            {readOnlyFields.has('cpf') && (
                              <span className="text-xs text-gray-500 ml-1">(vindos do cadastro)</span>
                            )}
                          </label>
                          <input 
                            type="text" 
                            className={getFieldClasses('cpf')}
                            value={formData.cpf} 
                            onChange={e => handleFieldChange('cpf', e.target.value)}
                            placeholder="000.000.000-00" 
                            readOnly={readOnlyFields.has('cpf')}
                            title={readOnlyFields.has('cpf') ? "CPF foi informado na primeira fase do cadastro" : ""}
                          />
                          {errors.cpf && <span className={formClasses.error}>{errors.cpf}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('faixaSalarial', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Faixa Salarial *</label>
                          <select className="input" value={formData.faixaSalarial} onChange={e => handleFieldChange('faixaSalarial', e.target.value)}>
                            <option value="">Selecione</option>
                            <option value="ate-1-salario">Até 1 salário mínimo</option>
                            <option value="1-a-2-salarios">De 1 a 2 salários mínimos</option>
                            <option value="2-a-3-salarios">De 2 a 3 salários mínimos</option>
                            <option value="3-a-5-salarios">De 3 a 5 salários mínimos</option>
                            <option value="5-a-10-salarios">De 5 a 10 salários mínimos</option>
                            <option value="acima-10-salarios">Acima de 10 salários mínimos</option>
                          </select>
                          {errors.faixaSalarial && <span className="text-red-500 text-xs">{errors.faixaSalarial}</span>}
                        </div>
                      ))}                      {renderFieldWithState('email', (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Email *
                            {readOnlyFields.has('email') && (
                              <span className="text-xs text-gray-500 ml-1">(vindos do cadastro)</span>
                            )}
                          </label>
                          <input 
                            type="email" 
                            className={getFieldClasses('email', formClasses.input)}
                            value={formData.email} 
                            onChange={e => handleFieldChange('email', e.target.value)} 
                            placeholder="Ex: joao@email.com"
                            readOnly={readOnlyFields.has('email')}
                          />
                          {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>                {/* Seção 2 - Endereço */}
                <div className={formClasses.section.endereco}>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-200/30 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className={formClasses.sectionTitle.endereco}>
                      <MapPin className="w-6 h-6" />
                      Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderFieldWithState('cep', (
                        <div>
                          <label className="block text-sm font-medium mb-1">CEP *</label>
                          <input type="text" className="input" value={formData.cep} onChange={e => { handleFieldChange('cep', e.target.value); if (e.target.value.replace(/\D/g, '').length === 8) fetchAddressByCep(e.target.value); }} maxLength={9} placeholder="00000-000" />
                          {errors.cep && <span className="text-red-500 text-xs">{errors.cep}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('numero', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Número *</label>
                          <input type="text" className="input" value={formData.numero} onChange={e => handleFieldChange('numero', e.target.value)} />
                          {errors.numero && <span className="text-red-500 text-xs">{errors.numero}</span>}
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium mb-1">Complemento</label>
                        <input type="text" className="input" value={formData.complemento} onChange={e => handleFieldChange('complemento', e.target.value)} />
                      </div>
                      {renderFieldWithState('logradouro', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Logradouro *</label>
                          <input type="text" className="input" value={formData.logradouro} onChange={e => handleFieldChange('logradouro', e.target.value)} />
                          {errors.logradouro && <span className="text-red-500 text-xs">{errors.logradouro}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('bairro', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Bairro *</label>
                          <input type="text" className="input" value={formData.bairro} onChange={e => handleFieldChange('bairro', e.target.value)} />
                          {errors.bairro && <span className="text-red-500 text-xs">{errors.bairro}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('cidade', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Cidade *</label>
                          <input type="text" className="input" value={formData.cidade} onChange={e => handleFieldChange('cidade', e.target.value)} />
                          {errors.cidade && <span className="text-red-500 text-xs">{errors.cidade}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('estado', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Estado *</label>
                          <input type="text" className="input" value={formData.estado} onChange={e => handleFieldChange('estado', e.target.value)} />
                          {errors.estado && <span className="text-red-500 text-xs">{errors.estado}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>                {/* Seção 3 - Profissional */}
                <div className={formClasses.section.profissional}>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className={formClasses.sectionTitle.profissional}>
                      <GraduationCap className="w-6 h-6" />
                      Dados Profissionais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderFieldWithState('funcao', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Função *</label>
                          <select className="input" value={formData.funcao} onChange={e => handleFieldChange('funcao', e.target.value)}>
                            <option value="">Selecione</option>
                            <option value="QUIROPRAXIA">Quiropraxia</option>
                            <option value="PSICOLOGIA">Psicologia</option>
                            <option value="FISIOTERAPIA">Fisioterapia</option>
                            <option value="NUTRIÇÃO">Nutrição</option>
                          </select>
                          {errors.funcao && <span className="text-red-500 text-xs">{errors.funcao}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('profissao', (
                        <div>
                          <label className="block text-sm font-medium mb-1">Profissão *</label>
                          <input type="text" className="input" value={formData.profissao} onChange={e => handleFieldChange('profissao', e.target.value)} placeholder="Ex: Psicóloga Clínico" />
                          {errors.profissao && <span className="text-red-500 text-xs">{errors.profissao}</span>}
                        </div>
                      ))}
                      {renderFieldWithState('crm', (
                        <div>
                          <label className="block text-sm font-medium mb-1">CRM (opcional)</label>
                          <input type="text" className="input" value={formData.crm} onChange={e => handleFieldChange('crm', e.target.value)} placeholder="Ex: 123456/SP" />
                          {errors.crm && <span className="text-red-500 text-xs">{errors.crm}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Completar Cadastro"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
        <motion.div className="text-center mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/30">          <motion.div className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }}>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
              <Heart className="w-4 h-4 text-red-500" />
            </motion.span>
            © 2025 Projeto Mãos Amigas - Ajudando a construir um futuro melhor
            <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
              <Star className="w-4 h-4 text-yellow-500" />
            </motion.span>
          </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
