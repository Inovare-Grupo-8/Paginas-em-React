import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, User, Clock, Menu, History, ChevronRight, Sun, Moon, Home as HomeIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ProximaConsulta} from "@/services/consultaApi";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import ErrorMessage from "./ErrorMessage";
import { STATUS_COLORS } from "../constants/ui";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { userNavigationItems } from "@/utils/userNavigation";
import { ConsultaApiService, ConsultaDto, ConsultaOutput } from "@/services/consultaApi";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

interface ConsultaSummary {
  total: number;
  proxima: Date | null;
  canceladas: number;
  semana: number; // Adicionar campo para consultas da semana
}

interface AtendimentoSummary {
  realizados: number;
  proximos: number;
  ultimaAvaliacao: number | null;
}

// Adicionar interface para Consulta
interface Consulta {
  id: number;
  profissional: string;
  especialidade: string;
  data: Date;
  tipo: string;
  status: string;
  avaliacao?: number;
}

// Adicionar interface para dados de cancelamento
interface ConsultaCancelamento {
  id: number;
  profissional: string;
  data: Date;
  tipo: string;
  especialidade?: string;
}

const HomeUser = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Handle logout function
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('profileData');
    navigate('/');
    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso.",
    });
  };
  const { t } = useTranslation();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  
  // Estado para o modal de cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [consultaParaCancelar, setConsultaParaCancelar] = useState<ConsultaCancelamento | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [motivoSelecionado, setMotivoSelecionado] = useState("");
  const [cancelandoConsulta, setCancellandoConsulta] = useState(false);

  // Estado para o modal de detalhes
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [consultaDetalhes, setConsultaDetalhes] = useState<Consulta | null>(null);

  const [userData, setUserData] = useState(() => {
    const savedData = localStorage.getItem("userData");
    return savedData ? JSON.parse(savedData) : {
      nome: "Maria",
      sobrenome: "Silva",
      email: "maria.silva@email.com"
    };
  });
    // Estado para o calendário
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const savedDate = localStorage.getItem("selectedDateForBooking");
    return savedDate ? new Date(savedDate) : undefined;
  });

  // Salvar a data selecionada no localStorage sempre que ela mudar
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("selectedDateForBooking", selectedDate.toISOString());
    }  }, [selectedDate]);

  // Estado para o resumo dos dados
  const [consultasSummary, setConsultasSummary] = useState<ConsultaSummary>({
    total: 0,
    proxima: null,
    canceladas: 0,
    semana: 0
  });

  // Adicionando estado para o status da próxima consulta
  const [proximaConsultaData, setProximaConsultaData] = useState<{
    profissional: string;
    especialidade: string;
    tipo: string;
    status: string;
  } | null>(null);

  // Estado para o resumo dos dados
  const [atendimentosSummary, setAtendimentosSummary] = useState<AtendimentoSummary>({
    realizados: 0,
    proximos: 0,
    ultimaAvaliacao: null
  });
  // Dados de exemplo para as próximas consultas
  const [proximasConsultas, setProximasConsultas] = useState<Consulta[]>([]);

  //Proxima consulta do usuario
   const [proximaConsulta, setProximaConsulta] = useState<ProximaConsulta | null>(null);
 // Adicionar useEffect para carregar a próxima consulta
  useEffect(() => {
    const loadProximaConsulta = async () => {
      try {
        const userData = localStorage.getItem("userData");
        if (!userData) {
          console.log("User data not found");
          return;
        }

        const user = JSON.parse(userData);
        const idUsuario = user.idUsuario; // Note que aqui usamos idUsuario conforme o backend

        const consulta = await ConsultaApiService.getProximaConsulta(idUsuario);
        setProximaConsulta(consulta);
      } catch (error) {
        console.error("Erro ao carregar próxima consulta:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar sua próxima consulta",
          variant: "destructive"
        });
      }
    };

    loadProximaConsulta();
  }, []);

  // Dados de exemplo para o histórico recente
  const [historicoRecente, setHistoricoRecente] = useState<Consulta[]>([]);  // Carregar dados das consultas via API
  useEffect(() => {
    const loadConsultaData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Buscar todos os dados em paralelo
        const [consultaStats, proximasConsultasData, historicoData] = await Promise.all([
          ConsultaApiService.getAllConsultaStats('assistido'),
          ConsultaApiService.getProximasConsultas('assistido'),
          ConsultaApiService.getConsultasRecentes('assistido')
        ]);

        // Converter dados das próximas consultas do formato da API para o formato local
        const proximasFormatted: Consulta[] = proximasConsultasData.map(consulta => ({
          id: consulta.id,
          profissional: consulta.nomeVoluntario,
          especialidade: consulta.especialidadeVoluntario,
          data: new Date(consulta.horario),
          tipo: consulta.modalidade,
          status: consulta.status,
          avaliacao: consulta.avaliacao
        }));

        // Converter dados do histórico do formato da API para o formato local  
        const historicoFormatted: Consulta[] = historicoData.map(consulta => ({
          id: consulta.id,
          profissional: consulta.profissional,
          especialidade: consulta.especialidade,
          data: new Date(consulta.data),
          tipo: consulta.tipo,
          status: consulta.status,
          avaliacao: consulta.avaliacao
        }));

        // Atualizar estados com dados reais
        setProximasConsultas(proximasFormatted);
        setHistoricoRecente(historicoFormatted);

        // Mapear dados das estatísticas
        const proximaData = proximasFormatted.length > 0 ? proximasFormatted[0].data : null;
        setConsultasSummary({
          total: consultaStats.hoje,
          proxima: proximaData,
          canceladas: consultaStats.mes,
          semana: consultaStats.semana
        });
        
        // Preencher dados da próxima consulta se existir
        if (proximasFormatted.length > 0) {
          const proximaConsulta = proximasFormatted[0];
          setProximaConsultaData({
            profissional: proximaConsulta.profissional,
            especialidade: proximaConsulta.especialidade,
            tipo: proximaConsulta.tipo,
            status: proximaConsulta.status
          });
        }

        // Atualizar dados dos atendimentos com dados da API
        setAtendimentosSummary({
          realizados: historicoFormatted.filter(c => c.status === 'realizada').length,
          proximos: proximasFormatted.length,
          ultimaAvaliacao: historicoFormatted.find(c => c.avaliacao)?.avaliacao || null
        });
        
      } catch (err: any) {
        console.error('Erro ao carregar dados das consultas:', err);
        setError(err.message || "Erro ao carregar dados das consultas");
        
        // Manter valores vazios em caso de erro
        setConsultasSummary({
          total: 0,
          proxima: null,
          canceladas: 0,
          semana: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadConsultaData();
  }, []); // Remover dependência de proximasConsultas para evitar loop infinito

  const statusColors: Record<string, string> = {
    agendada: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    realizada: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    remarcada: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
  };

  // Função para formatar a data
  const formatarData = (data: Date) => {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    
    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${format(data, 'HH:mm')}`;
    } else if (data.toDateString() === amanha.toDateString()) {
      return `Amanhã às ${format(data, 'HH:mm')}`;
    } else {
      return `${format(data, "dd/MM", { locale: ptBR })} às ${format(data, 'HH:mm')}`;
    }
  };

  // Calcular estrelas para avaliação
  const renderEstrelas = (avaliacao: number) => {
    return Array(5).fill(0).map((_, i) => (
      <svg 
        key={i} 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill={i < Math.round(avaliacao) ? "#ED4231" : "none"} 
        stroke="#ED4231" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ));
  };
  
  // Renderizar ícone de status
  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'agendada':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'realizada':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
          </svg>
        );
      case 'cancelada':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
        );
      case 'remarcada':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Função para abrir modal de cancelamento
  const abrirModalCancelamento = (consulta: Consulta | ConsultaCancelamento) => {
    setConsultaParaCancelar({
      id: consulta.id,
      profissional: consulta.profissional,
      data: consulta.data,
      tipo: consulta.tipo,
      especialidade: 'especialidade' in consulta ? consulta.especialidade : undefined
    });
    setShowCancelModal(true);
    setMotivoCancelamento("");
    setMotivoSelecionado("");
  };

  // Função para abrir modal de detalhes
  const abrirModalDetalhes = (consulta: Consulta) => {
    setConsultaDetalhes({
      id: consulta.id,
      profissional: consulta.profissional,
      especialidade: consulta.especialidade,
      data: consulta.data,
      tipo: consulta.tipo,
      status: consulta.status,
      avaliacao: consulta.avaliacao
    });
    setDetalhesModalOpen(true);
  };

  // Função para confirmar cancelamento
  const confirmarCancelamento = async () => {
    if (!motivoSelecionado) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, selecione um motivo para o cancelamento.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (motivoSelecionado === "outro" && !motivoCancelamento.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva o motivo do cancelamento.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }    setCancellandoConsulta(true);

    try {
      // Cancelar consulta via API
      const response = await fetch(`/api/consultas/${consultaParaCancelar?.id}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar consulta');
      }

      if (consultaParaCancelar) {
        // Atualizar o status da consulta para cancelada
        setProximasConsultas(prev => 
          prev.map(consulta => 
            consulta.id === consultaParaCancelar.id 
              ? { ...consulta, status: 'cancelada' }
              : consulta
          )
        );
          // Atualizar contadores
        setConsultasSummary(prev => ({
          ...prev,
          canceladas: prev.canceladas + 1
        }));
        
        setAtendimentosSummary(prev => ({
          ...prev,
          proximos: prev.proximos - 1
        }));
        
        toast({
          title: "Consulta cancelada com sucesso",
          description: `A consulta com ${consultaParaCancelar.profissional} foi cancelada. Você receberá um e-mail de confirmação.`,
          variant: "default",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao cancelar consulta",
        description: "Ocorreu um erro ao cancelar a consulta. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
    
    setCancellandoConsulta(false);
    setShowCancelModal(false);
    setConsultaParaCancelar(null);
    setMotivoCancelamento("");
    setMotivoSelecionado("");
  };

  // Função para fechar modal
  const fecharModal = () => {
    if (cancelandoConsulta) return;
    setShowCancelModal(false);
    setConsultaParaCancelar(null);
    setMotivoCancelamento("");
    setMotivoSelecionado("");
  };

  // Calcular tempo até a consulta
  const calcularTempoAteConsulta = (dataConsulta: Date) => {
    const agora = new Date();
    const diferenca = dataConsulta.getTime() - agora.getTime();
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    
    if (horas < 24) {
      return `${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      return `${dias} dia${dias > 1 ? 's' : ''}`;
    }
  };

  // Opções de motivo para cancelamento
  const motivosCancelamento = [
    { value: "agenda", label: "Conflito de agenda" },
    { value: "emergencia", label: "Emergência pessoal" },
    { value: "doenca", label: "Problemas de saúde" },
    { value: "trabalho", label: "Compromisso de trabalho" },
    { value: "financeiro", label: "Motivos financeiros" },
    { value: "tecnico", label: "Problemas técnicos" },
    { value: "outro", label: "Outro motivo" }
  ];

  // Função para gerar link de videochamada simulado
  const gerarLinkVideochamada = (): string => {
    const links = [
      'https://meet.google.com/abc-defg-hij',
      'https://zoom.us/j/123456789',
      'https://teams.microsoft.com/l/meetup-join/...'
    ];
    return links[Math.floor(Math.random() * links.length)];
  };

  return (
    <SidebarProvider>      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans text-base">
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-[#23272F]/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData?.nome || 'User'}
              size="w-10 h-10"
              className="border-2 border-[#ED4231]"
            />
            <span className="font-bold text-indigo-900 dark:text-gray-100">{userData?.nome} {userData?.sobrenome}</span>
          </div>
        )}
        <div className={`transition-all duration-500 ease-in-out
          ${sidebarOpen ? 'opacity-100 translate-x-0 w-4/5 max-w-xs md:w-72' : 'opacity-0 -translate-x-full w-0'}
          bg-gradient-to-b from-white via-[#f8fafc] to-[#EDF2FB] dark:from-[#23272F] dark:via-[#23272F] dark:to-[#181A20] shadow-2xl rounded-2xl p-6 flex flex-col gap-6 overflow-hidden
          fixed md:static z-40 top-0 left-0 h-full md:h-auto border-r border-[#EDF2FB] dark:border-[#23272F] backdrop-blur-[2px] text-sm md:text-base`
        }>          <div className="w-full flex justify-start mb-6">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2 mb-8">
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData?.nome || 'User'}
              size="w-16 h-16"
              className="border-4 border-[#EDF2FB]"
            />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">{userData?.nome} {userData?.sobrenome}</span>
          </div>
          <SidebarMenu className="gap-4 text-sm md:text-base">
            {/* Substituir os items de menu por uma iteração do userNavigationItems */}
            {Object.values(userNavigationItems).map((item) => (
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
              </SidebarMenuItem>
            ))}
            
            {/* Botão de Sair permanece o mesmo */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>                  <SidebarMenuButton 
                    className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3"
                    onClick={() => setShowLogoutDialog(true)}
                  >
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

        <main id="main-content" role="main" aria-label="Conteúdo principal do dashboard" className={`flex-1 w-full md:w-auto transition-all duration-500 ease-in-out ${sidebarOpen ? '' : 'ml-0'}`}>          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 right-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho do dashboard">
            <div className="flex items-center gap-3">
              <ProfileAvatar 
                profileImage={profileImage}
                name={userData?.nome || 'User'}
                size="w-10 h-10"
                className="border-2 border-[#ED4231]"
              />
              <span className="font-bold text-indigo-900 dark:text-gray-100">{userData?.nome} {userData?.sobrenome}</span>
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

          {/* Content area with proper spacing */}
          <div className="pt-20 md:pt-24 min-h-screen">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100 mb-2">Dashboard</h1>
                <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
                  Bem-vindo(a), {userData?.nome}! Aqui está o resumo das suas consultas.
                </p>
              
                {error && <ErrorMessage message={error} />}
                
                {/* Cards do dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Card de Consultas */}
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none transition-transform duration-300 hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Clock className="w-5 h-5 text-[#ED4231] cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resumo de todas as suas consultas agendadas</p>
                          </TooltipContent>
                        </Tooltip>
                        Minhas Consultas
                      </CardTitle>
                      <CardDescription>Visão geral das suas consultas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-6 w-28" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-center">                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md cursor-help"
                                >
                                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{consultasSummary.total}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Hoje</span>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Consultas agendadas para hoje</p>
                              </TooltipContent>
                            </Tooltip>                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md cursor-help"
                                >
                                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{consultasSummary.semana}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Semana</span>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Consultas agendadas para esta semana</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  className="flex flex-col items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md cursor-help"
                                >
                                  <span className="text-lg font-bold text-red-700 dark:text-red-300">{consultasSummary.canceladas}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Mês</span>
                                </motion.div>
                              </TooltipTrigger>                              <TooltipContent>
                                <p>Total de consultas agendadas para este mês</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          {consultasSummary.proxima ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                              className="mt-3 border border-gray-100 dark:border-gray-800 rounded-lg p-3 hover:border-[#ED4231]/30 dark:hover:border-[#ED4231]/30 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Próxima consulta:</h3>
                                {proximaConsulta && (
                                  <div className="flex items-center gap-1">
                                    {renderStatusIcon(proximaConsulta.status.toLocaleLowerCase())}
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Status: {proximaConsulta.status === 'AGENDADA' ? 'Confirmada' : 
                                             proximaConsulta.status === 'REALIZADA' ? 'Realizada' : 
                                             proximaConsulta.status === 'CANCELADA' ? 'Cancelada' : 'Remarcada'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {proximaConsulta ? (
                                <div className="space-y-2">
                                <div className="flex justify-between items-center">
                               <span className="font-medium text-gray-800 dark:text-gray-200">
                               {`${proximaConsulta.voluntario.ficha.nome} ${proximaConsulta.voluntario.ficha.sobrenome}`}
                                </span>
                                <Badge className={statusColors[proximaConsulta.status.toLowerCase()]}>
                                {proximaConsulta.especialidade.nome}
                                  </Badge>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{proximaConsulta.modalidade}</span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {new Date(proximaConsulta.horario).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                  </div>                                
                                  <div className="flex items-center gap-2 mt-2 border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
                                    <Clock className="w-4 h-4 text-[#ED4231]" />
                                    <span className="text-sm font-medium text-[#ED4231]">
                                      {formatarData(new Date(proximaConsulta.horario))}
                                    </span>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="text-xs flex gap-1 items-center flex-1 border-[#ED4231] text-[#ED4231] hover:bg-[#ED4231]/10"
                                          onClick={() => abrirModalCancelamento({
                                            id: proximasConsultas.find(c => 
                                              c.data.toDateString() === consultasSummary.proxima?.toDateString()
                                            )?.id || 1,
                                            profissional: proximaConsultaData.profissional,
                                            data: consultasSummary.proxima,
                                            tipo: proximaConsultaData.tipo
                                          })}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z" /><path d="m10 11 4 4m0-4-4 4" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                                          </svg>
                                          Cancelar
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Cancelar esta consulta (sujeito à política de cancelamento)</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="text-xs flex gap-1 items-center flex-1 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                                          onClick={() => abrirModalDetalhes({
                                            id: proximasConsultas.find(c => 
                                              c.data.toDateString() === consultasSummary.proxima?.toDateString()
                                            )?.id || 1,
                                            profissional: proximaConsultaData.profissional,
                                            especialidade: proximaConsultaData.especialidade,
                                            data: consultasSummary.proxima,
                                            tipo: proximaConsultaData.tipo,
                                            status: proximaConsultaData.status
                                          })}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11h2v5" /><circle cx="12" cy="7" r="1" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                          Detalhes
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Ver informações completas sobre esta consulta</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <span className="text-sm text-indigo-900 dark:text-indigo-300">
                                    {formatarData(consultasSummary.proxima)}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4 }}
                              className="mt-2 text-center py-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg"
                            >
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Você não tem consultas agendadas
                              </span>
                              <div className="mt-2">
                                <Link to="/agendar-horario-user">
                                  <Button size="sm" variant="outline" className="text-xs border-[#ED4231] text-[#ED4231] hover:bg-[#ED4231]/10">
                                    Agendar Consulta
                                  </Button>
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Link to="/consultas-user" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-[#ED4231] dark:hover:text-[#ED4231] flex items-center gap-1">
                      Ver todas as consultas
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    {!loading && consultasSummary.proxima && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-1 text-xs p-0 h-auto text-gray-500 hover:text-[#ED4231]"
                            onClick={() => toast({
                              title: "Lembrete configurado",
                              description: "Você receberá um lembrete antes da consulta",
                              duration: 3000,
                            })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            Lembrar-me
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Receber notificações antes da consulta por email e SMS</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardFooter>
                </Card>

                {/* Card de Atendimentos */}
                <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none transition-transform duration-300 hover:scale-[1.02] hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <User className="w-5 h-5 text-[#ED4231] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Histórico das suas consultas realizadas e avaliações</p>
                        </TooltipContent>
                      </Tooltip>
                      Meu Histórico
                    </CardTitle>
                    <CardDescription>Histórico de consultas realizadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Consultas realizadas:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{atendimentosSummary.realizados}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Próximas consultas:</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{atendimentosSummary.proximos}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Última avaliação:</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1 cursor-help">
                                {atendimentosSummary.ultimaAvaliacao !== null ? (
                                  <div className="flex">
                                    {renderEstrelas(atendimentosSummary.ultimaAvaliacao)}
                                  </div>
                                ) : "N/A"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Sua última avaliação dada para um profissional (1-5 estrelas)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>                {/* Card de Calendário (substituindo Ações Rápidas) */}
                <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none transition-transform duration-300 hover:scale-[1.02] hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CalendarIcon className="w-5 h-5 text-[#ED4231] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Selecione uma data no calendário para agendar uma nova consulta</p>
                        </TooltipContent>
                      </Tooltip>
                      Calendário
                    </CardTitle>
                    <CardDescription>Selecione uma data para agendar</CardDescription>
                  </CardHeader>
                  <CardContent>                    
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            // Verificar se há consultas nesta data
                            const consultasNaData = proximasConsultas.filter(
                              consulta => consulta.data.toDateString() === date.toDateString()
                            );
                            
                            if (consultasNaData.length > 0) {
                              toast({
                                title: `${consultasNaData.length} consulta${consultasNaData.length > 1 ? 's' : ''} nesta data`,
                                description: "Você já possui consultas agendadas para esta data.",
                                variant: "default",
                                duration: 3000,
                              });
                            } else {
                              toast({
                                title: "Data selecionada",
                                description: `Você selecionou ${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
                                duration: 3000,
                              });
                            }
                          }
                        }}
                        className="rounded-md border border-[#EDF2FB] dark:border-[#444857]"
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        modifiers={{
                          booked: (date) => proximasConsultas.some(
                            consulta => consulta.data.toDateString() === date.toDateString()
                          ),
                        }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: "rgba(237, 66, 49, 0.1)",
                            borderColor: "rgba(237, 66, 49, 0.5)",
                            color: "#ED4231",
                            fontWeight: "bold",
                          }
                        }}
                      />
                    </div>{selectedDate && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md"
                      >
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Data selecionada: <span className="font-semibold">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {format(selectedDate, "EEEE", { locale: ptBR }).charAt(0).toUpperCase() + format(selectedDate, "EEEE", { locale: ptBR }).slice(1)}
                          </p>
                          {new Date().toDateString() === selectedDate.toDateString() && (
                            <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Hoje
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>                  <CardFooter>
                    {selectedDate ? (
                      <div className="w-full space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              className="w-full bg-[#ED4231] hover:bg-[#d53a2a] dark:bg-[#ED4231] dark:hover:bg-[#d53a2a] text-white"
                              onClick={() => {
                                // Armazena a data selecionada para usar na tela de agendar
                                localStorage.setItem("selectedDateForBooking", selectedDate.toISOString());
                                // Navega para a tela de agendamento
                                window.location.href = "/agendar-horario-user";
                              }}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Agendar para esta data
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ir para a tela de agendamento com esta data pré-selecionada</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <div className="flex justify-between items-center text-xs">
                          <Link to="/agenda-user" className="text-indigo-600 dark:text-indigo-400 hover:text-[#ED4231] dark:hover:text-[#ED4231] flex items-center gap-1">
                            Ver minha agenda
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500 h-auto p-0"
                                onClick={() => {
                                  setSelectedDate(undefined);
                                  localStorage.removeItem("selectedDateForBooking");
                                  toast({
                                    title: "Seleção removida",
                                    description: "A data selecionada foi removida.",
                                    duration: 3000,
                                  });
                                }}
                              >
                                Limpar seleção
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover a data selecionada do calendário</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Selecione uma data para agendar uma consulta
                        </p>
                        <Link to="/agenda-user">
                          <Button variant="outline" size="sm" className="text-xs border-[#ED4231] text-[#ED4231] hover:bg-[#ED4231]/10">
                            Ver minha agenda
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </div>

              {/* Seções de Próximas Consultas e Histórico Recente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seção Próximas Consultas */}
                <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none">                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Clock className="w-5 h-5 text-[#ED4231] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Lista das suas próximas consultas agendadas</p>
                            </TooltipContent>
                          </Tooltip>
                          Próximas Consultas
                        </CardTitle>
                        <CardDescription>Consultas agendadas para os próximos dias</CardDescription>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 cursor-help">
                            {atendimentosSummary.proximos} agendadas
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Número total de consultas agendadas para os próximos dias</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                            <div className="flex flex-col gap-2">
                              <Skeleton className="h-5 w-36" />
                              <Skeleton className="h-5 w-24" />
                              <div className="flex justify-between">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-5 w-20" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>                    ) : proximasConsultas.length > 0 ? (
                      <div className="space-y-3">
                        {proximasConsultas.map((consulta) => (
                          <motion.div 
                            key={consulta.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: consulta.id * 0.1 }}
                            className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:border-[#ED4231]/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        {renderStatusIcon(consulta.status)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Status: {consulta.status === 'agendada' ? 'Consulta confirmada e agendada' : 
                                               consulta.status === 'realizada' ? 'Consulta já foi realizada' : 
                                               consulta.status === 'cancelada' ? 'Consulta foi cancelada' : 'Consulta foi remarcada'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{consulta.profissional}</span>
                                </div>
                                <Badge className={statusColors[consulta.status]}>
                                  {consulta.status === 'agendada' ? 'Agendada' : 
                                  consulta.status === 'realizada' ? 'Realizada' : 
                                  consulta.status === 'cancelada' ? 'Cancelada' : 'Remarcada'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="inline-flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 16 5 5 5-5" /></svg>
                                    {consulta.especialidade}
                                  </span>
                                </span>                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  <span className="inline-flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {consulta.tipo}
                                  </span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex items-center text-[#ED4231]">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center cursor-help">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        <span className="text-sm font-medium">{formatarData(consulta.data)}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Data e horário da consulta: {format(consulta.data, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={() => abrirModalDetalhes(consulta)}
                                      >
                                        Detalhes
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver informações detalhadas da consulta</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => abrirModalCancelamento(consulta)}
                                      >
                                        Cancelar
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cancelar esta consulta (pode haver taxas)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                        <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-1">Sem consultas agendadas</div>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">Você não tem nenhuma consulta agendada para os próximos dias.</div>
                      </div>
                    )}
                  </CardContent>                  <CardFooter className="flex justify-between items-center">
                    <Link to="/consultas-user" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-[#ED4231] dark:hover:text-[#ED4231] flex items-center gap-1">
                      Ver todas as consultas
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </CardFooter>
                </Card>

                {/* Seção Histórico Recente */}
                <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <History className="w-5 h-5 text-[#ED4231] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Histórico das suas consultas mais recentes</p>
                            </TooltipContent>
                          </Tooltip>
                          Histórico Recente
                        </CardTitle>
                        <CardDescription>Últimas consultas realizadas</CardDescription>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800 cursor-help">
                            {atendimentosSummary.realizados} realizadas
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total de consultas já realizadas por você</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                            <div className="flex flex-col gap-2">
                              <Skeleton className="h-5 w-36" />
                              <Skeleton className="h-5 w-24" />
                              <div className="flex justify-between">
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-5 w-20" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : historicoRecente.length > 0 ? (
                      <div className="space-y-3">
                        {historicoRecente.map((consulta) => (
                          <motion.div 
                            key={consulta.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: consulta.id * 0.1 }}
                            className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:border-[#ED4231]/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {renderStatusIcon(consulta.status)}
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{consulta.profissional}</span>
                                </div>
                                <Badge className={statusColors[consulta.status]}>
                                  {consulta.status === 'agendada' ? 'Agendada' : 
                                  consulta.status === 'realizada' ? 'Realizada' : 
                                  consulta.status === 'cancelada' ? 'Cancelada' : 'Remarcada'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="inline-flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 16 5 5 5-5" /></svg>
                                    {consulta.especialidade}
                                  </span>
                                </span>                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  <span className="inline-flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {consulta.tipo}
                                  </span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  <span className="text-sm">{formatarData(consulta.data)}</span>
                                </div>
                                {consulta.status === 'realizada' && consulta.avaliacao && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Avaliação:</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex cursor-help">
                                          {renderEstrelas(consulta.avaliacao)}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Sua avaliação: {consulta.avaliacao} de 5 estrelas</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                )}
                              </div>
                              {consulta.status === 'realizada' && (
                                <div className="flex justify-end mt-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    onClick={() => abrirModalDetalhes(consulta)}
                                  >
                                    Ver detalhes
                                  </Button>
                                  {!consulta.avaliacao && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                      onClick={() => toast({
                                        title: "Funcionalidade em desenvolvimento",
                                        description: "A avaliação de consultas estará disponível em breve."
                                      })}
                                    >
                                      Avaliar
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                        <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-1">Sem histórico recente</div>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">Você ainda não realizou nenhuma consulta.</div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Link to="/historico-user" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-[#ED4231] dark:hover:text-[#ED4231] flex items-center gap-1">
                      Ver histórico completo
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    {!loading && historicoRecente.some(consulta => consulta.status === 'realizada' && !consulta.avaliacao) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs border-amber-500 text-amber-500 hover:bg-amber-500/10"
                            onClick={() => toast({
                              title: "Avaliação em desenvolvimento",
                              description: "A funcionalidade de avaliação estará disponível em breve.",
                              duration: 3000,
                            })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Avaliar Consultas
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Avaliar consultas realizadas que ainda não foram avaliadas</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
        </main>

        {/* Modal de Confirmação de Cancelamento */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-[#23272F] border border-[#EDF2FB] dark:border-[#444857] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="m12 17 .01 0" />
                  </svg>
                </div>
                Cancelar Consulta
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                Você está prestes a cancelar uma consulta agendada. Esta ação é irreversível e pode estar sujeita às políticas de cancelamento.
              </DialogDescription>
            </DialogHeader>

            {consultaParaCancelar && (
              <div className="space-y-6">
                {/* Detalhes da Consulta */}
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Detalhes da Consulta</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Consulta que será cancelada</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                        {calcularTempoAteConsulta(consultaParaCancelar.data)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Profissional:</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">{consultaParaCancelar.profissional}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 16 5 5 5-5" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">Especialidade:</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">{consultaParaCancelar.especialidade || "Não informado"}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Data e Hora:</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">{formatarData(consultaParaCancelar.data)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="m9 9 5 5v-5h-5" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">{consultaParaCancelar.tipo}</p>
                    </div>
                  </div>
                </div>

                {/* Seleção de Motivo */}
                <div className="space-y-3">
                  <Label htmlFor="motivo" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Motivo do cancelamento *
                  </Label>
                  <Select value={motivoSelecionado} onValueChange={setMotivoSelecionado}>
                    <SelectTrigger className="w-full border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Selecione o motivo do cancelamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosCancelamento.map((motivo) => (
                        <SelectItem key={motivo.value} value={motivo.value}>
                          {motivo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo de descrição - aparece quando "Outro" é selecionado */}
                {motivoSelecionado === "outro" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="descricao" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Descreva o motivo *
                    </Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descreva brevemente o motivo do cancelamento..."
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      className="min-h-[80px] border-gray-300 dark:border-gray-600 focus:border-[#ED4231] dark:focus:border-[#ED4231]"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {motivoCancelamento.length}/500 caracteres
                    </p>
                  </motion.div>
                )}

                {/* Política de Cancelamento */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="m12 8 .01 0" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-800 dark:text-amber-300 font-semibold mb-2">Política de Cancelamento</p>
                      <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                        <li>• Cancelamentos com mais de 24h: sem cobrança</li>
                        <li>• Cancelamentos entre 12-24h: cobrança de 50%</li>
                        <li>• Cancelamentos com menos de 12h: cobrança integral</li>
                        <li>• Emergências médicas são isentas de cobrança</li>
                      </ul>
                      <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/40 rounded border-l-4 border-amber-400">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                          Tempo restante: <span className="font-bold">{calcularTempoAteConsulta(consultaParaCancelar.data)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sugestões */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <path d="m12 17 .01 0" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-800 dark:text-blue-300 font-semibold mb-2">Considere outras opções</p>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Reagendar para outra data</li>
                        <li>• Alterar para consulta online</li>
                        <li>• Transferir para outro profissional</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={fecharModal}
                disabled={cancelandoConsulta}
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
                Manter Consulta
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmarCancelamento}
                disabled={cancelandoConsulta || !motivoSelecionado}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelandoConsulta ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z" />
                      <path d="m10 11 4 4m0-4-4 4" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                    Confirmar Cancelamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes da Consulta */}
        <Dialog open={detalhesModalOpen} onOpenChange={setDetalhesModalOpen}>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#23272F] border border-[#EDF2FB] dark:border-[#444857] mx-4 sm:mx-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-indigo-900 dark:text-gray-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ED4231" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11h2v5" /><circle cx="12" cy="7" r="1" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                Detalhes da Consulta
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Informações completas sobre sua consulta agendada.
              </DialogDescription>
            </DialogHeader>

            {consultaDetalhes && (
              <div className="space-y-4 sm:space-y-6 px-1">
                {/* Informações principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card do Profissional */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Profissional
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nome:</strong> {consultaDetalhes.profissional}</p>
                      <p><strong>Especialidade:</strong> {consultaDetalhes.especialidade}</p>
                      <p><strong>CRM:</strong> 12345-SP</p>
                      <p><strong>Telefone:</strong> (11) 98888-8888</p>
                      <p><strong>Experiência:</strong> 15 anos</p>
                    </div>
                  </div>

                  {/* Card da Consulta */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                      Consulta
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Tipo:</strong> {consultaDetalhes.tipo}</p>
                      <p><strong>Data:</strong> {format(consultaDetalhes.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                      <p><strong>Horário:</strong> {format(consultaDetalhes.data, 'HH:mm')}</p>
                      <p><strong>Duração:</strong> 50 minutos</p>
                      <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <Badge className={`${statusColors[consultaDetalhes.status]} text-xs`}>
                          {consultaDetalhes.status === 'agendada' ? 'Confirmada' : 
                           consultaDetalhes.status === 'realizada' ? 'Realizada' : 
                           consultaDetalhes.status === 'cancelada' ? 'Cancelada' : 'Remarcada'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações específicas por tipo de consulta */}
                {consultaDetalhes.tipo === "Consulta Online" ? (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                      Consulta Online
                    </h4>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <strong className="text-sm">Link da videochamada:</strong>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                            {gerarLinkVideochamada()}
                          </code>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-7"
                            onClick={() => {
                              navigator.clipboard.writeText(gerarLinkVideochamada());
                              toast({
                                title: "Link copiado!",
                                description: "O link da videochamada foi copiado para a área de transferência.",
                                duration: 3000,
                              });
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        <p><strong>Preparação para a consulta:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Teste sua conexão 5 minutos antes</li>
                          <li>Tenha seus documentos e exames em mãos</li>
                          <li>Escolha um local silencioso e bem iluminado</li>
                          <li>Certifique-se de que a câmera e microfone funcionem</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      Consulta Presencial
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Endereço:</strong> Rua das Flores, 123</p>
                      <p><strong>Bairro:</strong> Vila Madalena</p>
                      <p><strong>Cidade:</strong> São Paulo - SP</p>
                      <p><strong>CEP:</strong> 05435-000</p>
                      <p><strong>Complemento:</strong> Sala 205</p>
                      <div className="mt-3 text-orange-700 dark:text-orange-300">
                        <p><strong>Instruções importantes:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Chegue 15 minutos antes do horário</li>
                          <li>Traga um documento com foto</li>
                          <li>Traga seus exames e receitas anteriores</li>
                          <li>Use máscara se necessário</li>
                          <li>Há estacionamento no local</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações financeiras e procedimentos */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    Informações Financeiras
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Valor da consulta:</strong> R$ 180,00</p>
                    <p><strong>Formas de pagamento:</strong> PIX, dinheiro, cartão de débito/crédito</p>
                    <p><strong>Convênios aceitos:</strong> Particular</p>
                    <div className="mt-3 text-yellow-700 dark:text-yellow-300">
                      <p><strong>Política de cancelamento:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Cancelamento com mais de 24h: sem cobrança</li>
                        <li>Cancelamento entre 12-24h: cobrança de 50%</li>
                        <li>Cancelamento com menos de 12h: cobrança integral</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preparação para a consulta */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
                    Preparação para a Consulta
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>O que levar:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1 mb-3">
                      <li>Documento de identidade com foto</li>
                      <li>Carteirinha do convênio (se aplicável)</li>
                      <li>Exames anteriores relacionados ao problema</li>
                      <li>Lista de medicamentos em uso</li>
                      <li>Histórico médico familiar</li>
                    </ul>
                    <p><strong>Preparação necessária:</strong></p>
                    <p className="mt-1">Para esta consulta de {consultaDetalhes.especialidade}, não é necessária preparação especial. Venha com suas dúvidas anotadas para aproveitar melhor o tempo.</p>
                  </div>
                </div>

                {/* Histórico com o profissional (se houver) */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ED4231" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
                    Seu Histórico
                  </h4>
                  <div className="text-sm space-y-2">
                    <p><strong>Consultas com este profissional:</strong> {consultaDetalhes.status === 'realizada' ? '2 (incluindo esta)' : '1ª consulta'}</p>
                    {consultaDetalhes.status === 'realizada' && (
                      <p><strong>Última consulta:</strong> {format(new Date(2025, 3, 10), "dd/MM/yyyy")}</p>
                    )}
                    <p><strong>Total de consultas na plataforma:</strong> 8</p>
                    {consultaDetalhes.status === 'realizada' && consultaDetalhes.avaliacao && (
                      <div className="flex items-center gap-2">
                        <strong>Sua avaliação:</strong>
                        <div className="flex">
                          {renderEstrelas(consultaDetalhes.avaliacao)}
                        </div>
                        <span>({consultaDetalhes.avaliacao}/5)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lembrete para consulta agendada */}
                {consultaDetalhes.status === 'agendada' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                      Lembrete
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>Você receberá um lembrete por email e SMS:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>24 horas antes da consulta</li>
                        <li>2 horas antes da consulta</li>
                        <li>Link da videochamada (se online) 15 minutos antes</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button
                variant="outline"
                onClick={() => setDetalhesModalOpen(false)}
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                Fechar
              </Button>
              
              {consultaDetalhes?.status === 'agendada' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetalhesModalOpen(false);
                      abrirModalCancelamento(consultaDetalhes);
                    }}
                    className="w-full sm:w-auto order-2 border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z" />
                    <path d="m10 11 4 4m0-4-4 4" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                    Cancelar Consulta
                  </Button>
                  
                  <Button
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white order-1 sm:order-3"
                    onClick={() => {
                      if (consultaDetalhes.tipo === "Consulta Online") {
                        window.open(gerarLinkVideochamada(), '_blank');
                      }
                      toast({
                        title: consultaDetalhes.tipo === "Consulta Online" ? "Entrando na videochamada" : "Consulta confirmada",
                        description: consultaDetalhes.tipo === "Consulta Online" ? 
                          "A videochamada foi aberta em uma nova aba. Aguarde o profissional." : 
                          "Sua presença foi confirmada. Dirija-se ao local da consulta.",
                        duration: 5000,
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      {consultaDetalhes?.tipo === "Consulta Online" ? 
                        <><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></> :
                        <><path d="M20 6L9 17l-5-5" /></>
                      }
                    </svg>
                    {consultaDetalhes?.tipo === "Consulta Online" ? "Entrar na Videochamada" : "Confirmar Presença"}
                  </Button>
                </>
              )}

              {consultaDetalhes?.status === 'realizada' && !consultaDetalhes.avaliacao && (
                <Button
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white order-1 sm:order-3"
                  onClick={() => {
                    toast({
                      title: "Avaliação em desenvolvimento",
                      description: "A funcionalidade de avaliação estará disponível em breve.",
                      duration: 3000,
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Avaliar Consulta
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add responsive styles */}
      <style>{`
        /* Mobile-first responsive adjustments */
        @media (max-width: 768px) {
          .max-w-6xl {
            max-width: 100% !important;
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
          
          .grid-cols-1.md\\:grid-cols-3 {
            gap: 1rem !important;
          }
          
          .grid-cols-1.lg\\:grid-cols-2 {
            gap: 1rem !important;
          }
          
          /* Ensure proper spacing on mobile */
          .pt-20 {
            padding-top: 5.5rem !important; /* Increase mobile top padding */
          }
        }
        
        @media (min-width: 769px) {
          .pt-20.md\\:pt-24 {
            padding-top: 6.5rem !important; /* Increase desktop top padding */
          }
        }
        
        /* Ensure header doesn't overlap content */
        header[role="banner"] {
          height: 4.5rem; /* Fixed header height */
        }
        
        /* Fix sidebar overlap on mobile */
        @media (max-width: 768px) {
          .fixed.z-40 {
            top: 0 !important;
            height: 100vh !important;
          }
        }
        
        /* Improve card responsiveness */
        .grid > .bg-white {
          min-height: auto !important;
        }
        
        /* Better mobile card layouts */
        @media (max-width: 640px) {
          .space-y-4 > * {
            margin-bottom: 1rem !important;
          }
          
          .flex.flex-col.sm\\:flex-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .w-full.sm\\:w-auto {
            width: 100% !important;
          }
        }      `}</style>
      
      {/* Logout dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Deseja realmente sair?</DialogTitle>
            <DialogDescription>Você será desconectado da sua conta.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancelar</Button>
            <Button variant="default" onClick={handleLogout} className="bg-[#ED4231] hover:bg-[#D63A2A] text-white font-medium">
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default HomeUser;