import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, User, Clock, Menu, History, ChevronRight, Users, UserCheck, Activity, Sun, Moon, Home as HomeIcon, Phone, Mail, MessageSquare, FileText, Check, X, Eye, ThumbsUp, ThumbsDown, AlertTriangle, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassificacaoUsuarios } from "@/components/ClassificacaoUsuarios";

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

// Interface para atendimento
interface AtendimentoSocial {
  id: string;
  paciente: string;
  data: Date;
  horario: string;
  tipo: "Individual" | "Familiar" | "Grupo";
  status: "agendado" | "em_andamento" | "concluido" | "cancelado";
  observacoes?: string;
}

// Interface para formulário de inscrição/anamnese
interface FormularioInscricao {
  id: string;
  nomeCompleto: string;
  telefone: string;
  dataNascimento: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;  areaOrientacao: string;
  comoSoube: string;
  sugestaoOutraArea?: string;
  dataSubmissao: Date;
  status: "pendente" | "aprovado" | "reprovado";
  observacoesAssistente?: string;
  tipoCandidato?: "multidisciplinar" | "valor_social";
}

// Dados mockados do assistente social
const assistenteSocialData: AssistenteSocialData = {
  id: "as001",
  nome: "Maria",
  sobrenome: "Silva Santos",
  crp: "CRP 12/34567",
  especialidade: "Assistência Social Clínica",
  telefone: "(11) 99999-8888",
  email: "maria.santos@clinic.com",
  disponivel: true,
  proximaDisponibilidade: new Date(2025, 4, 31, 14, 0),
  atendimentosRealizados: 342,
  avaliacaoMedia: 4.8
};

// Dados mockados de usuários do sistema
// const totalUsuarios = 127; // Removido - agora será dinâmico

// Dados mockados de atendimentos
const atendimentosData: AtendimentoSocial[] = [
  {
    id: "at001",
    paciente: "Ana Costa",
    data: new Date(2025, 4, 31, 9, 0),
    horario: "09:00",
    tipo: "Individual",
    status: "agendado",
    observacoes: "Primeira consulta"
  },
  {
    id: "at002", 
    paciente: "Família Oliveira",
    data: new Date(2025, 4, 31, 14, 0),
    horario: "14:00",
    tipo: "Familiar",
    status: "agendado"
  },
  {
    id: "at003",
    paciente: "João Santos",
    data: new Date(2025, 4, 30, 10, 30),
    horario: "10:30",
    tipo: "Individual",
    status: "concluido"
  }
];

// Dados mockados de formulários de inscrição pendentes
const formulariosPendentes: FormularioInscricao[] = [
  {
    id: "form001",
    nomeCompleto: "Maria Silva dos Santos",
    telefone: "(11) 98765-4321",
    dataNascimento: "1985-05-15",
    email: "maria.santos@email.com",
    cep: "01234-567",
    logradouro: "Rua das Flores",
    numero: "123",
    complemento: "Apto 45",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",    areaOrientacao: "Orientação Familiar",
    comoSoube: "Indicação de amigo",
    dataSubmissao: new Date(2025, 4, 29),
    status: "pendente"
  },
  {
    id: "form002",
    nomeCompleto: "Carlos Eduardo Pereira",
    telefone: "(11) 91234-5678",
    dataNascimento: "1978-12-03",
    email: "carlos.pereira@email.com",
    cep: "04567-890",
    logradouro: "Avenida Principal",
    numero: "567",
    bairro: "Vila Nova",
    cidade: "São Paulo",
    estado: "SP",    areaOrientacao: "Orientação Profissional",
    comoSoube: "Site da instituição",
    dataSubmissao: new Date(2025, 4, 28),
    status: "pendente"
  },
  {
    id: "form003",
    nomeCompleto: "Ana Paula Oliveira",
    telefone: "(11) 95555-4444",
    dataNascimento: "1990-08-22",
    email: "ana.oliveira@email.com",
    cep: "02468-135",
    logradouro: "Rua do Comércio",
    numero: "89",
    bairro: "Jardim das Rosas",
    cidade: "São Paulo",
    estado: "SP",    areaOrientacao: "Orientação Psicossocial",
    comoSoube: "Redes sociais",
    dataSubmissao: new Date(2025, 4, 27),
    status: "pendente"
  }
];

// Itens de navegação para o assistente social
const assistenteSocialNavItems = [
  {
    path: "/assistente-social",
    label: "Home",
    icon: <HomeIcon className="w-6 h-6" color="#ED4231" />,
    section: "home"
  },  {
    path: "/classificacao-usuarios",
    label: "Classificar Usuários",
    icon: <UserCheck className="w-6 h-6" color="#ED4231" />,
    section: "classificacao"
  },
  {
    path: "/cadastro-assistente",
    label: "Cadastrar Assistente",
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />,
    section: "cadastro"
  },
  {
    path: "/cadastro-voluntario",
    label: "Cadastrar Voluntário",
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />,
    section: "cadastro"
  },
  {
    path: "/profile-form-assistente-social",
    label: "Editar Perfil",
    icon: <User className="w-6 h-6" color="#ED4231" />,
    section: "perfil"
  }
];

const AssistenteSocial = () => {
  const location = useLocation();  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [secaoAtiva, setSecaoAtiva] = useState("home"); // Novo estado para controlar seção ativa
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();// Estados para controle da interface
  const [atendimentosHoje, setAtendimentosHoje] = useState<AtendimentoSocial[]>([]);
  const [proximosAtendimentos, setProximosAtendimentos] = useState<AtendimentoSocial[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
  const [usuariosNaoClassificados, setUsuariosNaoClassificados] = useState<number>(0);
    // Estados para formulários
  const [formularios, setFormularios] = useState<FormularioInscricao[]>(formulariosPendentes);
  const [formularioSelecionado, setFormularioSelecionado] = useState<FormularioInscricao | null>(null);
  const [showFormularioModal, setShowFormularioModal] = useState(false);
  const [showAprovacaoModal, setShowAprovacaoModal] = useState(false);
  const [showReprovacaoModal, setShowReprovacaoModal] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [tipoCandidato, setTipoCandidato] = useState<"multidisciplinar" | "valor_social" | "">("");
  const [isProcessing, setIsProcessing] = useState(false);  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Buscar total de usuários da API
        const response = await fetch('http://localhost:8080/usuarios');
        if (response.ok) {
          const usuarios = await response.json();
          setTotalUsuarios(usuarios.length);
          
          // Contar usuários não classificados
          const naoClassificados = usuarios.filter((usuario: any) => 
            usuario.tipo === "NAO_CLASSIFICADO" || usuario.tipo === "NÃO_CLASSIFICADO" || !usuario.tipo
          );
          setUsuariosNaoClassificados(naoClassificados.length);
        } else {
          console.error('Erro ao buscar usuários:', response.status);
          // Manter valor padrão em caso de erro
          setTotalUsuarios(0);
          setUsuariosNaoClassificados(0);
        }
      } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        // Manter valor padrão em caso de erro
        setTotalUsuarios(0);
        setUsuariosNaoClassificados(0);
      }
      
      // Simular delay de API para outros dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrar atendimentos de hoje
      const hoje = new Date();
      const atendimentosDeHoje = atendimentosData.filter(
        atendimento => atendimento.data.toDateString() === hoje.toDateString()
      );
      
      // Filtrar próximos atendimentos
      const proximosAtend = atendimentosData.filter(
        atendimento => atendimento.data > hoje
      ).slice(0, 3);
      
      setAtendimentosHoje(atendimentosDeHoje);
      setProximosAtendimentos(proximosAtend);
      setLoading(false);
    };    loadData();
  }, []);

  // Função para atualizar contador após classificação
  const atualizarContadorUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:8080/usuarios');
      if (response.ok) {
        const usuarios = await response.json();
        setTotalUsuarios(usuarios.length);
        
        // Contar usuários não classificados
        const naoClassificados = usuarios.filter((usuario: any) => 
          usuario.tipo === "NAO_CLASSIFICADO" || usuario.tipo === "NÃO_CLASSIFICADO" || !usuario.tipo
        );
        setUsuariosNaoClassificados(naoClassificados.length);
      }
    } catch (error) {
      console.error('Erro ao atualizar contador:', error);
    }
  };

  // Função para formatar data
  const formatarData = (data: Date) => {
    return format(data, "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para formatar data e hora
  const formatarDataHora = (data: Date) => {
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "em_andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "concluido":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };
  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case "agendado":
        return "Agendado";
      case "em_andamento":
        return "Em Andamento";
      case "concluido":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Funções para manipular formulários
  const abrirFormularioModal = (formulario: FormularioInscricao) => {
    setFormularioSelecionado(formulario);
    setShowFormularioModal(true);
  };
  const iniciarAprovacao = (formulario: FormularioInscricao) => {
    setFormularioSelecionado(formulario);
    setObservacoes("");
    setTipoCandidato("");
    setShowAprovacaoModal(true);
  };

  const iniciarReprovacao = (formulario: FormularioInscricao) => {
    setFormularioSelecionado(formulario);
    setObservacoes("");
    setShowReprovacaoModal(true);
  };
  const confirmarAprovacao = async () => {
    if (!formularioSelecionado || !tipoCandidato) return;
    
    setIsProcessing(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar lista de formulários
      setFormularios(prev => 
        prev.map(form => 
          form.id === formularioSelecionado.id 
            ? { ...form, status: "aprovado", observacoesAssistente: observacoes, tipoCandidato: tipoCandidato }
            : form
        )
      );
      
      setShowAprovacaoModal(false);
      setFormularioSelecionado(null);
      setObservacoes("");
      setTipoCandidato("");
      
      const tipoTexto = tipoCandidato === "multidisciplinar" ? "Candidato Multidisciplinar" : "Candidato que Paga o Valor Social";
      
      toast({
        title: "Formulário aprovado!",
        description: `O formulário de ${formularioSelecionado.nomeCompleto} foi aprovado como ${tipoTexto}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Ocorreu um erro ao processar a aprovação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmarReprovacao = async () => {
    if (!formularioSelecionado) return;
    
    setIsProcessing(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar lista de formulários
      setFormularios(prev => 
        prev.map(form => 
          form.id === formularioSelecionado.id 
            ? { ...form, status: "reprovado", observacoesAssistente: observacoes }
            : form
        )
      );
      
      setShowReprovacaoModal(false);
      setFormularioSelecionado(null);
      setObservacoes("");
      
      toast({
        title: "Formulário reprovado",
        description: `O formulário de ${formularioSelecionado.nomeCompleto} foi reprovado.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao reprovar",
        description: "Ocorreu um erro ao processar a reprovação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const fecharModais = () => {
    setShowFormularioModal(false);
    setShowAprovacaoModal(false);
    setShowReprovacaoModal(false);
    setFormularioSelecionado(null);
    setObservacoes("");
    setTipoCandidato("");
  };

  // Função para obter cor do status do formulário
  const getFormStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "aprovado":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "reprovado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Função para obter texto do status do formulário
  const getFormStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aprovado":
        return "Aprovado";
      case "reprovado":
        return "Reprovado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDF2FB] dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#ED4231] mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Carregando...</p>
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
          </div>          <SidebarMenu className="gap-4 text-sm md:text-base">            {assistenteSocialNavItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {item.section === "home" ? (
                      <SidebarMenuButton 
                        onClick={() => setSecaoAtiva(item.section)}
                        className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 cursor-pointer ${
                          secaoAtiva === item.section ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === item.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                        <Link to={item.path} className="flex items-center gap-3">
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="z-50">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ))}            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ED4231" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9" /></svg>
                      <span>Sair</span>
                    </div>
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
          </header>          <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-8 pt-24 sm:pt-28 md:pt-24">
            <div className="flex flex-col">
              {secaoAtiva === "home" && (
                <>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100 mb-2">Dashboard - Assistente Social</h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Gerencie seus atendimentos e acompanhe seu trabalho social</p>
                  
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">{/* Formulários pendentes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pendentes</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {usuariosNaoClassificados}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>{/* Total de usuários */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Usuários</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalUsuarios}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>              {/* Seção de classificação de usuários */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ClassificacaoUsuarios onUsuarioClassificado={atualizarContadorUsuarios} />
                </motion.div>
              </div>                </>
              )}
            </div>
          </div>
        </main>

        {/* Modal de Visualização do Formulário */}
        <Dialog open={showFormularioModal} onOpenChange={() => setShowFormularioModal(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ED4231]" />
                Detalhes do Formulário de Inscrição
              </DialogTitle>
              <DialogDescription>
                Revise todas as informações fornecidas pelo candidato
              </DialogDescription>
            </DialogHeader>
            
            {formularioSelecionado && (
              <div className="space-y-6">
                {/* Informações Pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">
                      Informações Pessoais
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome Completo</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.nomeCompleto}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Nascimento</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.dataNascimento}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.email}</p>
                      </div>
                        <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Telefone</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.telefone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">
                      Endereço
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CEP</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.cep}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Logradouro</label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {formularioSelecionado.logradouro}, {formularioSelecionado.numero}
                          {formularioSelecionado.complemento && ` - ${formularioSelecionado.complemento}`}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bairro</label>
                        <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.bairro}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cidade/Estado</label>
                        <p className="text-gray-900 dark:text-gray-100">
                          {formularioSelecionado.cidade}, {formularioSelecionado.estado}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Informações da Solicitação */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">
                    Informações da Solicitação
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Área de Orientação</label>
                      <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.areaOrientacao}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Como soube do serviço</label>
                      <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.comoSoube}</p>
                    </div>
                  </div>
                  
                  {formularioSelecionado.sugestaoOutraArea && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sugestão de Outra Área</label>
                      <p className="text-gray-900 dark:text-gray-100">{formularioSelecionado.sugestaoOutraArea}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Submissão</label>
                    <p className="text-gray-900 dark:text-gray-100">{formatarDataHora(formularioSelecionado.dataSubmissao)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status Atual</label>
                    <Badge className={getFormStatusColor(formularioSelecionado.status)}>
                      {getFormStatusText(formularioSelecionado.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={fecharModais}>
                Fechar
              </Button>
              {formularioSelecionado && formularioSelecionado.status === "pendente" && (
                <>
                  <Button 
                    onClick={() => {
                      setShowFormularioModal(false);
                      iniciarAprovacao(formularioSelecionado);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setShowFormularioModal(false);
                      iniciarReprovacao(formularioSelecionado);
                    }}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reprovar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Aprovação */}
        <Dialog open={showAprovacaoModal} onOpenChange={() => setShowAprovacaoModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                Aprovar Formulário
              </DialogTitle>
              <DialogDescription>
                {formularioSelecionado && 
                  `Você está prestes a aprovar o formulário de ${formularioSelecionado.nomeCompleto}. Esta ação dará ao usuário acesso às demais funcionalidades do sistema.`
                }
              </DialogDescription>
            </DialogHeader>
              <div className="space-y-4">
              <div>
                <Label htmlFor="tipoCandidato" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Candidato *
                </Label>
                <Select value={tipoCandidato} onValueChange={(value: "multidisciplinar" | "valor_social") => setTipoCandidato(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo de candidato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multidisciplinar">Candidato Multidisciplinar</SelectItem>
                    <SelectItem value="valor_social">Candidato que Paga o Valor Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações (opcional)
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre a aprovação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={fecharModais} disabled={isProcessing}>
                Cancelar
              </Button>              <Button 
                onClick={confirmarAprovacao} 
                disabled={isProcessing || !tipoCandidato}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Aprovação
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Reprovação */}
        <Dialog open={showReprovacaoModal} onOpenChange={() => setShowReprovacaoModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                Reprovar Formulário
              </DialogTitle>
              <DialogDescription>
                {formularioSelecionado && 
                  `Você está prestes a reprovar o formulário de ${formularioSelecionado.nomeCompleto}. O usuário será notificado sobre a reprovação.`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Ação Irreversível</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  A reprovação é uma ação definitiva. O usuário precisará submeter um novo formulário.
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motivo da reprovação <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Informe o motivo da reprovação (obrigatório)..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={fecharModais} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmarReprovacao} 
                disabled={isProcessing || !observacoes.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Confirmar Reprovação
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

export default AssistenteSocial;
