import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, User, Clock, Menu, History, ChevronRight, Users, UserCheck, Activity, Sun, Moon, Home as HomeIcon, Phone, Mail, MessageSquare, FileText, Check, X, Eye, ThumbsUp, ThumbsDown, AlertTriangle, UserPlus, Search, Filter, AlertCircle, EyeOff, Shield, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import VoluntarioApiService, { VoluntarioListagem, VoluntarioStatus } from "@/services/voluntarioApi";

// Interface para dados do assistente social
interface AssistenteSocialData {
  id: string;
  nome: string;
  sobrenome: string;
  crp: string;
  especialidade: string;
  telefone: string;
  email: string;
  disponivel: boolean;
  proximaDisponibilidade: Date;
  atendimentosRealizados: number;
  avaliacaoMedia: number;
}

// Interface para voluntário (compatível com a API)
interface Voluntario {
  idUsuario: number;
  idVoluntario: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  crp?: string;
  funcao?: string;
  areaOrientacao?: string;
  especialidade?: string; // Para compatibilidade com código existente
  experiencia?: string;
  bio?: string;
  foto?: string;
  status: "ativo" | "inativo" | "pendente";
  dataCadastro: Date;
  ultimoAcesso?: Date;
  ativo?: boolean;
}

// Dados simulados do assistente social
const assistenteSocialData: AssistenteSocialData = {
  id: "as001",
  nome: "Maria",
  sobrenome: "Santos",
  crp: "CRP 06/123456",
  especialidade: "Assistência Social",
  telefone: "(11) 99999-8888",
  email: "maria.santos@inovare.com",
  disponivel: true,
  proximaDisponibilidade: new Date(2025, 4, 30, 14, 0),
  atendimentosRealizados: 127,
  avaliacaoMedia: 4.8
};
// Itens de navegação para o assistente social
const assistenteSocialNavItems = [
  {
    path: "/assistente-social",
    label: "Home",
    icon: <HomeIcon className="w-6 h-6" color="#ED4231" />
  },
  {
    path: "/classificacao-usuarios",
    label: "Classificar Usuários",
    icon: <UserCheck className="w-6 h-6" color="#ED4231" />
  },
  {
    path: '/cadastro-assistente',
    label: 'Cadastrar Assistente', 
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />,
  },
  {
    path: "/cadastro-voluntario",
    label: "Cadastrar Voluntário",
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />
  },
  {
    path: "/profile-form-assistente-social",
    label: "Editar Perfil",
    icon: <User className="w-6 h-6" color="#ED4231" />
  }
];

const CadastroVoluntario = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [loadingVoluntarios, setLoadingVoluntarios] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  
  // Estados para formulário de cadastro
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    confirmarSenha: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
    // Estados para lista de voluntários
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [voluntariosOriginal, setVoluntariosOriginal] = useState<VoluntarioListagem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ""
  });
  
  // Estados para controle da interface
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // Função para carregar voluntários da API
  const carregarVoluntarios = async () => {
    try {
      setLoadingVoluntarios(true);
      const dadosApi = await VoluntarioApiService.listarVoluntarios();
      setVoluntariosOriginal(dadosApi);
      
      // Converter dados da API para o formato do componente
      const voluntariosConvertidos: Voluntario[] = dadosApi.map(vol => ({
        idUsuario: vol.idUsuario,
        idVoluntario: vol.idVoluntario,
        nome: vol.nome,
        sobrenome: vol.sobrenome,
        email: vol.email,
        funcao: vol.funcao,
        areaOrientacao: vol.areaOrientacao,
        especialidade: vol.funcao || vol.areaOrientacao || "Não especificado",
        status: VoluntarioApiService.determinarStatus(vol),
        dataCadastro: new Date(vol.dataCadastro),
        ultimoAcesso: vol.ultimoAcesso ? new Date(vol.ultimoAcesso) : undefined,
        ativo: vol.ativo
      }));
      
      setVoluntarios(voluntariosConvertidos);
    } catch (error) {
      console.error('Erro ao carregar voluntários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de voluntários.",
        variant: "destructive",
      });
    } finally {
      setLoadingVoluntarios(false);
    }
  };

  useEffect(() => {
    // Carregar dados iniciais
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 1000)), // Simular delay
        carregarVoluntarios()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Função para validar CPF
  const validarCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpfLimpo.charAt(10));
  };

  // Função para calcular força da senha
  const calcularForcaSenha = (senha: string) => {
    let score = 0;
    let feedback = "";

    if (senha.length === 0) {
      return { score: 0, feedback: "" };
    }

    if (senha.length < 6) {
      return { score: 1, feedback: "Muito fraca - Mínimo 6 caracteres" };
    }

    // Critérios de força
    if (senha.length >= 8) score++;
    if (/[a-z]/.test(senha)) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;

    switch (score) {
      case 1:
      case 2:
        feedback = "Fraca";
        break;
      case 3:
        feedback = "Média";
        break;
      case 4:
        feedback = "Forte";
        break;
      case 5:
        feedback = "Muito forte";
        break;
      default:
        feedback = "Muito fraca";
    }

    return { score: Math.min(score, 4), feedback };
  };

  // Função para validar campo em tempo real
  const validarCampo = (campo: string, valor: string) => {
    let erro = "";
    
    switch (campo) {
      case "email":
        if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          erro = "Email inválido";
        }
        break;
      case "cpf":
        if (valor && !validarCPF(valor)) {
          erro = "CPF inválido";
        }
        break;
      case "telefone":
        if (valor && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(valor)) {
          erro = "Formato: (11) 99999-9999";
        }
        break;
      case "confirmarSenha":
        if (valor && valor !== formData.senha) {
          erro = "As senhas não coincidem";
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [campo]: erro
    }));
  };

  // Função para formatar CPF
  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  // Função para formatar telefone
  const formatarTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .slice(0, 15);
  };

  // Handler para mudanças nos campos
  const handleFieldChange = (campo: string, valor: string) => {
    let valorFormatado = valor;
    
    if (campo === "cpf") {
      valorFormatado = formatarCPF(valor);
    } else if (campo === "telefone") {
      valorFormatado = formatarTelefone(valor);
    } else if (campo === "senha") {
      const strength = calcularForcaSenha(valor);
      setPasswordStrength(strength);
    }
    
    setFormData(prev => ({ ...prev, [campo]: valorFormatado }));
    
    // Validar campo após um pequeno delay
    setTimeout(() => {
      validarCampo(campo, valorFormatado);
    }, 300);
  };
  // Função para formatar data
  const formatarData = (data: Date) => {
    return format(data, "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para formatar data da API
  const formatarDataApi = (dataIso?: string) => {
    return VoluntarioApiService.formatarData(dataIso);
  };

  // Função para validar email
  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  // Função para validar dados do formulário
  const validarFormulario = () => {
    const erros: string[] = [];

    if (!formData.nome.trim()) erros.push("Nome é obrigatório");
    if (!formData.sobrenome.trim()) erros.push("Sobrenome é obrigatório");
    
    if (!formData.email.trim()) {
      erros.push("Email é obrigatório");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      erros.push("Email inválido");
    }    if (!formData.cpf.trim()) {
      erros.push("CPF é obrigatório");
    } else if (!validarCPF(formData.cpf)) {
      erros.push("CPF inválido");
    }

    if (!formData.senha) {
      erros.push("Senha é obrigatória");
    } else if (formData.senha.length < 6) {
      erros.push("Senha deve ter pelo menos 6 caracteres");
    }    if (formData.senha !== formData.confirmarSenha) {
      erros.push("As senhas não coincidem");
    }

    if (erros.length > 0) {
      toast({
        title: "Erro de validação",
        description: erros[0],
        variant: "destructive",
      });
      return false;
    }

    // Verificar se email já existe
    const emailExiste = voluntarios.some(vol => vol.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExiste) {
      toast({
        title: "Erro de validação",
        description: "Este email já está cadastrado.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };  // Função para validar step atual
  const validarStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.nome.trim() && formData.sobrenome.trim() && formData.email.trim() && 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && 
               formData.cpf.trim() && validarCPF(formData.cpf);
      case 2:
        return formData.senha.length >= 6 && formData.senha === formData.confirmarSenha;
      default:
        return true;
    }
  };// Navegação entre steps
  const proximoStep = () => {
    if (validarStep(currentStep)) {
      if (currentStep === 3) {
        // Se estamos no step 3 (revisão), mostrar modal de credenciais
        setShowCredentialsModal(true);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 3));
      }
    }
  };
  const stepAnterior = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Função para confirmar envio das credenciais
  const confirmarEnvioCredenciais = () => {
    setShowCredentialsModal(false);
    setShowConfirmModal(true);
  };

  // Função para submeter formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setShowConfirmModal(true);
    }
  };
  // Função para confirmar cadastro
  const confirmarCadastro = async () => {
    setIsProcessing(true);
    
    try {      // Primeira fase: cadastro básico
      const primeiraFaseData = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''), // Remove formatting for backend
        senha: formData.senha
      };const response1 = await fetch('http://localhost:8080/usuarios/voluntario/fase1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(primeiraFaseData),
      });

      if (!response1.ok) {
        const errorData = await response1.json();
        throw new Error(errorData.message || 'Erro ao cadastrar primeira fase');
      }      const fase1Result = await response1.json();
      const userId = fase1Result.idUsuario;      // Enviar credenciais por email
      try {
        const credentialsResponse = await fetch('http://localhost:8080/usuarios/voluntario/enviar-credenciais', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            nome: formData.nome,
            senha: formData.senha
          }),
        });

        if (!credentialsResponse.ok) {
          const errorData = await credentialsResponse.json().catch(() => ({}));
          console.warn('Erro ao enviar credenciais por email:', errorData.message || 'Erro desconhecido');
          
          toast({
            title: "Aviso",
            description: "Cadastro realizado com sucesso, mas houve falha no envio do email de credenciais.",
            variant: "default",
          });
        } else {
          console.log('Credenciais enviadas por email com sucesso');
        }
      } catch (emailError) {
        console.warn('Erro ao enviar email de credenciais:', emailError);
        
        toast({
          title: "Aviso", 
          description: "Cadastro realizado com sucesso, mas houve falha no envio do email de credenciais.",
          variant: "default",
        });
      }      toast({
        title: "Primeira fase concluída!",
        description: `${formData.nome}, você receberá um email para completar seu cadastro.`,
        variant: "default",
      });

      // Recarregar lista de voluntários da API
      await carregarVoluntarios();

      // Limpar formulário
      setFormData({
        nome: "",
        sobrenome: "",
        email: "",
        telefone: "",
        cpf: "",
        senha: "",
        confirmarSenha: ""
      });
      
      setCurrentStep(1);
      setShowConfirmModal(false);
      
    } catch (error) {
      console.error('Erro ao cadastrar voluntário:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o voluntário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "inativo":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "inativo":
        return "Inativo";
      case "pendente":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#EDF2FB] dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#ED4231]"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gray-900">
        {/* Sidebar comprimida para mobile */}
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-gray-900/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
            <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow" />
            <span className="font-bold text-indigo-900 dark:text-gray-100">{assistenteSocialData.nome} {assistenteSocialData.sobrenome}</span>
          </div>
        )}
        
        {/* Sidebar */}
        <div className={`transition-all duration-500 ease-in-out
          ${sidebarOpen ? 'opacity-100 translate-x-0 w-4/5 max-w-xs md:w-72' : 'opacity-0 -translate-x-full w-0'}
          bg-gradient-to-b from-white via-[#f8fafc] to-[#EDF2FB] dark:from-[#23272F] dark:via-[#23272F] dark:to-[#181A20] shadow-2xl rounded-2xl p-6 flex flex-col gap-6 overflow-hidden
          fixed md:static z-40 top-0 left-0 h-full md:h-auto border-r border-[#EDF2FB] dark:border-[#23272F] backdrop-blur-[2px] text-sm md:text-base`
        }>
          <div className="w-full flex justify-start mb-6">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center gap-2 mb-8">
            <img src={profileImage} alt="Foto de perfil" className="w-16 h-16 rounded-full border-4 border-[#EDF2FB] shadow" />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">
              {assistenteSocialData.nome} {assistenteSocialData.sobrenome}
            </span>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {assistenteSocialData.especialidade}
            </Badge>
          </div>
          
          <SidebarMenu className="gap-4 text-sm md:text-base">
            {assistenteSocialNavItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === item.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                      <Link to={item.path} className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="z-50">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>            ))}
            
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ED4231" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9" /></svg>
                      <span>Sair</span>
                    </span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">Sair da conta</TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
          
          <div className="mt-auto flex flex-col gap-2 text-xs text-gray-400 items-center pt-6 border-t border-[#EDF2FB] dark:border-[#23272F]">
            <span>&copy; {new Date().getFullYear()} Desenvolvido por Inovare</span>
            <div className="flex gap-2">
              <a href="https://inovare.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#ED4231]">Site</a>
              <a href="mailto:contato@inovare.com" className="underline hover:text-[#ED4231]">Contato</a>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <main className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          {/* Header */}
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-gray-900/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200" />
              <span className="font-bold text-indigo-900 dark:text-gray-100">{assistenteSocialData.nome} {assistenteSocialData.sobrenome}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
              </Button>
            </div>
          </header>

          <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-8 pt-24 sm:pt-28 md:pt-24">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100 mb-2">Cadastro de Voluntários</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Cadastre novos voluntários para atuar no sistema</p>              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário de cadastro */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[#ED4231]" />
                        Novo Voluntário
                      </CardTitle>
                      <CardDescription>
                        Preencha os dados do voluntário para criar o acesso
                      </CardDescription>
                        {/* Stepper */}
                      <div className="flex items-center justify-between mt-4">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                              step < currentStep ? 'bg-green-500 text-white' :
                              step === currentStep ? 'bg-[#ED4231] text-white' :
                              'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {step < currentStep ? <Check className="w-4 h-4" /> : step}
                            </div>
                            {step < 3 && (
                              <div className={`w-full h-0.5 mx-2 transition-all duration-300 ${
                                step < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                        {currentStep === 1 && "Dados Pessoais"}
                        {currentStep === 2 && "Credenciais de Acesso"}
                        {currentStep === 3 && "Revisão e Confirmação"}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Step 1: Dados Pessoais */}
                        {currentStep === 1 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                  id="nome"
                                  type="text"
                                  value={formData.nome}
                                  onChange={(e) => handleFieldChange('nome', e.target.value)}
                                  placeholder="Nome do voluntário"
                                  className={`mt-1 ${fieldErrors.nome ? 'border-red-500' : ''}`}
                                  required
                                />
                                {fieldErrors.nome && (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {fieldErrors.nome}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor="sobrenome">Sobrenome *</Label>
                                <Input
                                  id="sobrenome"
                                  type="text"
                                  value={formData.sobrenome}
                                  onChange={(e) => handleFieldChange('sobrenome', e.target.value)}
                                  placeholder="Sobrenome do voluntário"
                                  className={`mt-1 ${fieldErrors.sobrenome ? 'border-red-500' : ''}`}
                                  required
                                />
                                {fieldErrors.sobrenome && (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {fieldErrors.sobrenome}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="email">Email Profissional *</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                placeholder="email@voluntario.com"
                                className={`mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`}
                                required
                              />
                              {fieldErrors.email && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.email}
                                </p>
                              )}
                            </div>                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="cpf">CPF *</Label>
                                <Input
                                  id="cpf"
                                  type="text"
                                  value={formData.cpf}
                                  onChange={(e) => handleFieldChange('cpf', e.target.value)}
                                  placeholder="000.000.000-00"
                                  className={`mt-1 ${fieldErrors.cpf ? 'border-red-500' : ''}`}
                                  required
                                />
                                {fieldErrors.cpf && (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {fieldErrors.cpf}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Credenciais */}
                        {currentStep === 2 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="senha">Senha *</Label>
                              <div className="relative">
                                <Input
                                  id="senha"
                                  type={showPassword ? "text" : "password"}
                                  value={formData.senha}
                                  onChange={(e) => handleFieldChange('senha', e.target.value)}
                                  placeholder="Mínimo 6 caracteres"
                                  className={`mt-1 pr-10 ${fieldErrors.senha ? 'border-red-500' : ''}`}
                                  required
                                />                                <Button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4 text-[#ED4231]" /> : <Eye className="w-4 h-4 text-[#ED4231]" />}
                                </Button>
                              </div>
                              
                              {/* Indicador de força da senha */}
                              {formData.senha && (
                                <div className="mt-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Força da senha:</span>
                                    <span className={`text-sm font-medium ${
                                      passwordStrength.score <= 1 ? 'text-red-500' :
                                      passwordStrength.score === 2 ? 'text-yellow-500' :
                                      passwordStrength.score === 3 ? 'text-blue-500' :
                                      'text-green-500'
                                    }`}>
                                      {passwordStrength.feedback}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        passwordStrength.score <= 1 ? 'bg-red-500' :
                                        passwordStrength.score === 2 ? 'bg-yellow-500' :
                                        passwordStrength.score === 3 ? 'bg-blue-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {fieldErrors.senha && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.senha}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                              <div className="relative">
                                <Input
                                  id="confirmarSenha"
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={formData.confirmarSenha}
                                  onChange={(e) => handleFieldChange('confirmarSenha', e.target.value)}
                                  placeholder="Confirme a senha"
                                  className={`mt-1 pr-10 ${fieldErrors.confirmarSenha ? 'border-red-500' : ''}`}
                                  required
                                />                                <Button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-[#ED4231]" /> : <Eye className="w-4 h-4 text-[#ED4231]" />}
                                </Button>
                              </div>
                              {fieldErrors.confirmarSenha && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.confirmarSenha}
                                </p>
                              )}
                            </div>
                          </motion.div>                        )}

                        {/* Step 3: Revisão */}
                        {currentStep === 3 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                          >
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Revise os dados:</h4>                              <div className="space-y-2 text-sm">
                                <div><strong>Nome:</strong> {formData.nome} {formData.sobrenome}</div>
                                <div><strong>Email:</strong> {formData.email}</div>
                                {formData.telefone && <div><strong>Telefone:</strong> {formData.telefone}</div>}
                                {formData.cpf && <div><strong>CPF:</strong> {formData.cpf}</div>}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Navegação */}
                        <div className="flex justify-between pt-4">
                          {currentStep > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={stepAnterior}
                              className="flex items-center gap-2"
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                              Anterior
                            </Button>
                          )}
                          
                          <div className="flex-1" />
                            {currentStep < 3 ? (
                            <Button
                              type="button"
                              onClick={proximoStep}
                              disabled={!validarStep(currentStep)}
                              className="bg-[#ED4231] hover:bg-[#D63626] text-white flex items-center gap-2"
                            >
                              Próximo
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              type="button"
                              onClick={proximoStep}
                              disabled={!validarStep(currentStep)}
                              className="bg-[#ED4231] hover:bg-[#D63626] text-white flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Cadastrar Voluntário
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>                
                {/* Lista de voluntários cadastrados */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#ED4231]" />
                        Voluntários Cadastrados
                      </CardTitle>
                      <CardDescription>
                        {voluntarios.filter(vol => {
                          const matchSearch = vol.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.especialidade.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchStatus = statusFilter === "todos" || vol.status === statusFilter;
                          return matchSearch && matchStatus;
                        }).length} voluntário{voluntarios.length !== 1 ? 's' : ''} encontrado{voluntarios.length !== 1 ? 's' : ''}
                      </CardDescription>
                      
                      {/* Filtros e busca */}
                      <div className="space-y-3 mt-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Buscar voluntários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="ativo">Ativos</SelectItem>
                              <SelectItem value="inativo">Inativos</SelectItem>
                              <SelectItem value="pendente">Pendentes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>                    </CardHeader>                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loadingVoluntarios ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED4231]"></div>
                            <span className="ml-3 text-sm text-gray-500">Carregando voluntários...</span>
                          </div>
                        ) : (
                          <>
                            {voluntarios
                              .filter(vol => {
                                const matchSearch = vol.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  vol.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  vol.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  vol.especialidade.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchStatus = statusFilter === "todos" || vol.status === statusFilter;
                            return matchSearch && matchStatus;
                          })
                          .map((voluntario) => (
                          <motion.div 
                            key={voluntario.idUsuario}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {voluntario.nome} {voluntario.sobrenome}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(voluntario.status)}>
                                  {getStatusText(voluntario.status)}
                                </Badge>
                                {voluntario.status === "ativo" && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <p>{voluntario.email}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <p>{voluntario.especialidade}</p>
                              </div>                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                <p>Cadastrado em: {formatarData(voluntario.dataCadastro)}</p>
                              </div>
                              {voluntario.ultimoAcesso && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <p>Último acesso: {formatarData(voluntario.ultimoAcesso)}</p>
                                </div>
                              )}
                              {!voluntario.ultimoAcesso && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <p className="text-yellow-600 dark:text-yellow-400">Nunca acessou</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        
                        {voluntarios.filter(vol => {
                          const matchSearch = vol.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            vol.especialidade.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchStatus = statusFilter === "todos" || vol.status === statusFilter;
                          return matchSearch && matchStatus;
                        }).length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Nenhum voluntário encontrado</p>
                            {searchTerm && (                              <Button
                                variant="outline"
                                onClick={() => setSearchTerm("")}
                                className="text-[#ED4231] text-xs mt-1"
                              >
                                Limpar busca
                              </Button>                            )}
                          </div>
                        )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal de Credenciais */}
        <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#ED4231]" />
                Envio de Credenciais
              </DialogTitle>
              <DialogDescription>
                As credenciais de acesso serão enviadas por email para o voluntário.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email de Confirmação</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Um email será enviado para <strong>{formData.email}</strong> contendo:
                </p>
                <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 ml-4 list-disc">
                  <li>Link de acesso ao sistema</li>
                  <li>Credenciais temporárias</li>
                  <li>Instruções para primeiro acesso</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Importante</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  Certifique-se de que o email está correto antes de prosseguir.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmarEnvioCredenciais}
                className="bg-[#ED4231] hover:bg-[#D63626] text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Credenciais
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#ED4231]" />
                Confirmar Cadastro
              </DialogTitle>
              <DialogDescription>
                Confirme os dados do novo voluntário antes de finalizar o cadastro.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Dados do Voluntário:</h4>                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Nome:</strong> {formData.nome} {formData.sobrenome}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Credenciais de Acesso</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  O voluntário receberá as credenciais de acesso por email após o cadastro.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmarCadastro} 
                disabled={isProcessing}
                className="bg-[#ED4231] hover:bg-[#D63626] text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Cadastro
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default CadastroVoluntario;
