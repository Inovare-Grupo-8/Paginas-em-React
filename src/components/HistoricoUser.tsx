import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, User, Clock, Menu, History, Search, Star, Filter, FileText, Sun, Moon, Home as HomeIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import ErrorMessage from "./ErrorMessage";
import { STATUS_COLORS } from "../constants/ui";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { useTranslation } from "react-i18next";
import { AgendaCardSkeleton } from "./ui/custom-skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getUserNavigationPath, userNavigationItems } from "@/utils/userNavigation";
import { ConsultaApiService, ConsultaOutput } from "@/services/consultaApi";
import { useUserData } from "@/hooks/useUserData"; // Import the useUserData hook
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Eye, MessageSquare, TrendingUp, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface HistoricoConsulta {
  id: string; // Adicionar ID único
  date: Date;
  time: string;
  name: string;
  type: string;
  serviceType: string;
  status: "realizada" | "cancelada" | "remarcada";
  feedback?: {
    rating: number;
    comment?: string;
  };
  duration?: number; // Duração em minutos
  cost?: number; // Custo da consulta
  prescription?: string; // Prescrição médica
  nextAppointment?: Date; // Próxima consulta recomendada
}

const HistoricoUser = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedConsulta, setSelectedConsulta] = useState<HistoricoConsulta | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [currentComment, setCurrentComment] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "rating" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");  const [isExporting, setIsExporting] = useState(false);
  const [historicoConsultas, setHistoricoConsultas] = useState<HistoricoConsulta[]>([]);

  const { profileImage } = useProfileImage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Use the userData hook to get synchronized user data
  const { userData } = useUserData();

  const location = useLocation();  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  useEffect(() => {
    const loadHistorico = async () => {
      setLoading(true);
      setError("");
      
      try {
        const historicoData = await ConsultaApiService.getHistoricoConsultas('assistido');
        
        // Convert API data to component format
        const historicoFormatted: HistoricoConsulta[] = historicoData.map(consulta => {
          const consultaDate = new Date(consulta.horario);
          return {
            id: consulta.id.toString(),
            date: consultaDate,
            time: consulta.horario.split('T')[1]?.substring(0, 5) || '00:00',
            name: consulta.nomeVoluntario,
            type: consulta.especialidadeVoluntario,
            serviceType: consulta.modalidade,
            status: consulta.status as "realizada" | "cancelada" | "remarcada",
            duration: 50, // Default duration, can be enhanced later
            cost: 0, // Default cost, can be enhanced later  
            feedback: consulta.avaliacao ? { 
              rating: consulta.avaliacao, 
              comment: consulta.feedback 
            } : undefined
          };
        });
        
        setHistoricoConsultas(historicoFormatted);
      } catch (err: any) {
        console.error('Erro ao carregar histórico:', err);
        setError(err.message || "Erro ao carregar histórico de consultas");
      } finally {
        setLoading(false);
      }
    };
    
    loadHistorico();
  }, []);

  const handleAddFeedback = (consulta: HistoricoConsulta, rating: number, comment?: string) => {
    setHistoricoConsultas(prev => prev.map(c => {
      if (c.date.getTime() === consulta.date.getTime() && c.time === consulta.time) {
        return {
          ...c,
          feedback: { rating, comment }
        };
      }
      return c;
    }));
    toast({
      title: "Feedback enviado!",
      description: "Obrigado pela sua avaliação.",
      variant: "default"
    });
  };

  const openDetailsModal = (consulta: HistoricoConsulta) => {
    setSelectedConsulta(consulta);
    setShowDetailsModal(true);
  };

  const openFeedbackModal = (consulta: HistoricoConsulta) => {
    setSelectedConsulta(consulta);
    setCurrentRating(consulta.feedback?.rating || 0);
    setCurrentComment(consulta.feedback?.comment || "");
    setShowFeedbackModal(true);
  };

  const saveFeedback = () => {
    if (!selectedConsulta || currentRating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, selecione pelo menos uma estrela.",
        variant: "destructive"
      });
      return;
    }

    setHistoricoConsultas(prev => prev.map(c => 
      c.id === selectedConsulta.id 
        ? { ...c, feedback: { rating: currentRating, comment: currentComment || undefined } }
        : c
    ));

    toast({
      title: "Feedback salvo!",
      description: "Obrigado pela sua avaliação.",
      variant: "default"
    });

    setShowFeedbackModal(false);
    setCurrentRating(0);
    setCurrentComment("");
  };

  const exportHistory = async () => {    setIsExporting(true);
    
    try {
      // Obter dados do histórico via API
      const response = await fetch('/api/historico/exportar', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar histórico');
      }

      const csvContent = [
        ["Data", "Horário", "Profissional", "Especialidade", "Tipo", "Status", "Avaliação", "Valor"],
        ...filteredHistorico.map(consulta => [
          format(consulta.date, "dd/MM/yyyy"),
          consulta.time,
          consulta.name,
          consulta.type,
          consulta.serviceType,
          consulta.status,
          consulta.feedback?.rating || "N/A",
          consulta.cost ? `R$ ${consulta.cost}` : "N/A"
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");      link.href = URL.createObjectURL(blob);
      link.download = `historico-consultas-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();

      toast({
        title: "Histórico exportado!",
        description: "O arquivo foi baixado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar o histórico. Tente novamente.",
        variant: "destructive"
      });
    }

    setIsExporting(false);
  };

  const filteredHistorico = historicoConsultas
    .filter(consulta => {
      // Filtro por período
      if (selectedPeriod !== "all") {
        const now = new Date();
        const consultaDate = new Date(consulta.date);
        
        let compareDate;
        switch (selectedPeriod) {
          case "month": {
            compareDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          }
          case "3months": {
            compareDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          }
          case "year": {
            compareDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          }
        }
        
        if (compareDate && consultaDate < compareDate) return false;
      }

      // Filtro por status
      if (filterStatus && consulta.status !== filterStatus) return false;
      
      // Filtro por texto de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          consulta.name.toLowerCase().includes(searchLower) ||
          consulta.type.toLowerCase().includes(searchLower) ||
          consulta.serviceType.toLowerCase().includes(searchLower) ||
          format(consulta.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date": {
          comparison = a.date.getTime() - b.date.getTime();
          break;
        }
        case "rating": {
          const ratingA = a.feedback?.rating || 0;
          const ratingB = b.feedback?.rating || 0;
          comparison = ratingA - ratingB;
          break;
        }
        case "type": {
          comparison = a.type.localeCompare(b.type);
          break;
        }
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  // Estatísticas do histórico
  const stats = {
    total: historicoConsultas.length,
    realizadas: historicoConsultas.filter(c => c.status === "realizada").length,
    canceladas: historicoConsultas.filter(c => c.status === "cancelada").length,
    avgRating: historicoConsultas
      .filter(c => c.feedback?.rating)
      .reduce((acc, c, _, arr) => acc + (c.feedback?.rating || 0) / arr.length, 0),
    totalSpent: historicoConsultas
      .filter(c => c.status === "realizada" && c.cost)
      .reduce((acc, c) => acc + (c.cost || 0), 0)
  };

  // Add statusColors definition
  const statusColors: Record<string, string> = {
    realizada: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    remarcada: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen w-full flex flex-col md:flex-row text-base md:text-lg bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans`}>
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow" />
            {/* Update to use userData from hook */}
            <span className="font-bold text-indigo-900 text-sm md:text-lg">{userData.nome} {userData.sobrenome}</span>
          </div>
        )}
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
            <img src={profileImage} alt="Logo" className="w-16 h-16 rounded-full border-4 border-[#EDF2FB] shadow" />
            {/* Update to use userData from hook */}
            <span className="font-extrabold text-xl text-indigo-900 tracking-wide">{userData.nome} {userData.sobrenome}</span>
          </div>
          
          <SidebarMenu className="gap-4 text-sm md:text-base">
            {/* Uniform sidebar navigation using the items from userNavigationItems */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === userNavigationItems.home.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to={userNavigationItems.home.path} className="flex items-center gap-3">
                      {userNavigationItems.home.icon}
                      <span>{userNavigationItems.home.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Painel principal com resumo
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === userNavigationItems.agenda.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to={userNavigationItems.agenda.path} className="flex items-center gap-3">
                      {userNavigationItems.agenda.icon}
                      <span>{userNavigationItems.agenda.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Veja sua agenda de consultas
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === userNavigationItems.historico.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to={userNavigationItems.historico.path} className="flex items-center gap-3">
                      {userNavigationItems.historico.icon}
                      <span>{userNavigationItems.historico.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Veja seu histórico de consultas
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === userNavigationItems.agendar.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to={userNavigationItems.agendar.path} className="flex items-center gap-3">
                      {userNavigationItems.agendar.icon}
                      <span>{userNavigationItems.agendar.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Agende uma nova consulta com um profissional
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === userNavigationItems.perfil.path ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to={userNavigationItems.perfil.path} className="flex items-center gap-3">
                      {userNavigationItems.perfil.icon}
                      <span>{userNavigationItems.perfil.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Edite seu perfil e foto
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3" onClick={() => setShowLogoutDialog(true)}>
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

        <main id="main-content" role="main" aria-label="Conteúdo principal do histórico" className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho do histórico">
            <div className="flex items-center gap-3">
              <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200" />
              {/* Update to use userData from hook */}
              <span className="font-bold text-indigo-900 dark:text-gray-100">{t('name')} {userData.nome} {userData.sobrenome}</span>
            </div>            <div className="flex items-center gap-3">              <Button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                tabIndex={0}
                title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
              </Button>
            </div>
          </header>
          <div className="h-20" />
          <div className="max-w-5xl mx-auto p-2 md:p-6 bg-[#EDF2FB] dark:bg-[#181A20]">
            <div className="max-w-6xl mx-auto p-4 md:p-8 pt-24 md:pt-10">
              {/* Add proper navigation breadcrumb */}
              {getUserNavigationPath(location.pathname)}
              
              {/* Rest of the component content */}
              <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100 mb-2">
                Histórico de Consultas
              </h1>
            </div>

            {/* {!formData.nome && (
              <div className="p-4">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            )} */}

            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-full flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar consulta, profissional, especialidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-[#ED4231] transition-colors"
                    />
                  </div>

                  <div className="flex gap-2">                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setFilterStatus(filterStatus === "realizada" ? null : "realizada")}
                          variant={filterStatus === "realizada" ? "default" : "outline"}
                          className={`flex items-center gap-2 ${filterStatus === "realizada" ? "bg-[#ED4231]" : ""}`}
                        >
                          <FileText size={16} />
                          <span>Realizadas</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Filtrar apenas consultas realizadas</p>
                      </TooltipContent>
                    </Tooltip>                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setFilterStatus(filterStatus === "cancelada" ? null : "cancelada")}
                          variant={filterStatus === "cancelada" ? "default" : "outline"}
                          className={`flex items-center gap-2 ${filterStatus === "cancelada" ? "bg-[#ED4231]" : ""}`}
                        >
                          <FileText size={16} />
                          <span>Canceladas</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Filtrar apenas consultas canceladas</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-4" role="region" aria-label="Lista de consultas históricas" ref={listRef}>
                  {loading ? (
                    <div className="space-y-4" aria-busy="true" aria-live="polite">
                      {[...Array(3)].map((_, i) => <AgendaCardSkeleton key={i} />)}
                    </div>
                  ) : error ? (
                    <ErrorMessage message={error} />
                  ) : filteredHistorico.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                      <History className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                      <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">Nenhuma consulta encontrada</div>
                      <div className="text-gray-400 dark:text-gray-500 text-sm">Não há registros que correspondam à sua busca.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistorico.map((consulta, index) => (
                        <motion.div
                          key={`${format(consulta.date, "yyyy-MM-dd")}-${consulta.time}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-white dark:bg-[#181A20] rounded-lg border border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none transition-transform duration-300 hover:scale-[1.01] hover:shadow-md"
                        >
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-[#ED4231]" />
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {format(consulta.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {consulta.time}
                                </span>
                              </div>
                              <Badge className={`${statusColors[consulta.status]} px-3 py-1 rounded-full text-xs font-medium`}>
                                {consulta.status === "realizada" ? "Realizada" : 
                                 consulta.status === "cancelada" ? "Cancelada" : "Remarcada"}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">{consulta.name}</span>
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{consulta.type}</span>
                                <span className="hidden md:inline text-gray-400 dark:text-gray-500">•</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{consulta.serviceType}</span>
                              </div>
                            </div>

                            {consulta.status === "realizada" && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                {consulta.feedback ? (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sua avaliação:</span>
                                        <div className="flex gap-1 ml-2">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              size={16} 
                                              fill={star <= (consulta.feedback?.rating || 0) ? "#ED4231" : "transparent"} 
                                              stroke={star <= (consulta.feedback?.rating || 0) ? "#ED4231" : "#94A3B8"} 
                                            />
                                          ))}
                                        </div>
                                        <span className="text-sm text-gray-500 ml-2">({consulta.feedback.rating}/5)</span>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openFeedbackModal(consulta)}
                                        className="text-xs"
                                      >
                                        Editar
                                      </Button>
                                    </div>
                                    {consulta.feedback.comment && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border-l-4 border-[#ED4231]">
                                        <MessageSquare className="inline w-4 h-4 mr-2 text-[#ED4231]" />
                                        "{consulta.feedback.comment}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                      Como foi sua experiência com esta consulta?
                                    </span>
                                    <Button
                                      onClick={() => openFeedbackModal(consulta)}
                                      variant="outline"
                                      className="w-fit bg-gradient-to-r from-[#ED4231] to-[#c32d22] text-white border-none hover:from-[#c32d22] hover:to-[#a02419] transition-all duration-200"
                                    >
                                      <Star className="w-4 h-4 mr-2" />
                                      Avaliar Consulta
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {filteredHistorico.length > 5 && (              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#ED4231] text-white shadow-lg hover:bg-[#c32d22] focus:outline-none focus:ring-2 focus:ring-[#ED4231] animate-fade-in transition-transform duration-200 hover:scale-110 active:scale-95"
                    aria-label="Voltar ao topo"
                  >
                    ↑
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Voltar ao topo da página</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </main>

        {/* Modal de Detalhes */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#ED4231]" />
                Detalhes da Consulta
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre sua consulta
              </DialogDescription>
            </DialogHeader>

            {selectedConsulta && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="font-medium">Profissional:</span> {selectedConsulta.name}
                      </div>
                      <div>
                        <span className="font-medium">Especialidade:</span> {selectedConsulta.type}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span> {format(selectedConsulta.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      <div>
                        <span className="font-medium">Horário:</span> {selectedConsulta.time}
                      </div>
                      <div>
                        <span className="font-medium">Duração:</span> {selectedConsulta.duration || 50} minutos
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {selectedConsulta.serviceType}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Informações Financeiras
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="font-medium">Valor:</span> 
                        <span className="text-green-600 dark:text-green-400 ml-2">
                          R$ {selectedConsulta.cost || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge className={`${statusColors[selectedConsulta.status]} ml-2`}>
                          {selectedConsulta.status === "realizada" ? "Realizada" : 
                           selectedConsulta.status === "cancelada" ? "Cancelada" : "Remarcada"}
                        </Badge>
                      </div>
                      {selectedConsulta.feedback && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Sua avaliação:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={16} 
                                fill={star <= (selectedConsulta.feedback?.rating || 0) ? "#ED4231" : "transparent"} 
                                stroke={star <= (selectedConsulta.feedback?.rating || 0) ? "#ED4231" : "#94A3B8"} 
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedConsulta.prescription && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Prescrição/Orientações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">{selectedConsulta.prescription}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedConsulta.feedback?.comment && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Seu Comentário
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        "{selectedConsulta.feedback.comment}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Feedback */}
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Star className="w-6 h-6 text-[#ED4231]" />
                {selectedConsulta?.feedback ? "Editar Avaliação" : "Avaliar Consulta"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedConsulta?.feedback 
                  ? `Atualize sua avaliação da consulta com ${selectedConsulta?.name}`
                  : `Como foi sua experiência com ${selectedConsulta?.name}?`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Consulta Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#ED4231] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{selectedConsulta?.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedConsulta?.type}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedConsulta && format(selectedConsulta.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedConsulta?.time}
                </div>
              </div>

              {/* Rating Section */}
              <div className="text-center">
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Qual sua avaliação geral?
                </p>
                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCurrentRating(star)}
                      className="focus:outline-none transition-all duration-200 hover:scale-110 focus:scale-110"
                      title={`${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      <Star 
                        size={40} 
                        fill={star <= currentRating ? "#ED4231" : "transparent"} 
                        stroke={star <= currentRating ? "#ED4231" : "#94A3B8"}
                        className="cursor-pointer transition-colors duration-200"
                      />
                    </button>
                  ))}
                </div>
                {currentRating > 0 && (
                  <div className="bg-[#ED4231]/10 dark:bg-[#ED4231]/20 p-3 rounded-lg">
                    <p className="text-base font-medium text-[#ED4231]">
                      {currentRating === 1 && "😞 Muito insatisfeito"}
                      {currentRating === 2 && "😐 Insatisfeito"}
                      {currentRating === 3 && "😊 Neutro"}
                      {currentRating === 4 && "😃 Satisfeito"}
                      {currentRating === 5 && "🤩 Muito satisfeito"}
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Section */}
              <div>
                <Label htmlFor="comment" className="text-base font-medium">
                  Compartilhe sua experiência (opcional)
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Seu feedback nos ajuda a melhorar o atendimento
                </p>
                <Textarea
                  id="comment"
                  placeholder="Conte-nos como foi a consulta, o que você achou do profissional, se suas expectativas foram atendidas..."
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {currentComment.length}/500 caracteres
                  </span>
                </div>
              </div>

              {/* Rating Guidelines */}
              {currentRating === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    O que considerar na sua avaliação:
                  </h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Pontualidade do profissional</li>
                    <li>• Qualidade do atendimento</li>
                    <li>• Clareza nas orientações</li>
                    <li>• Resolução do seu problema</li>
                    <li>• Experiência geral</li>
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowFeedbackModal(false);
                  setCurrentRating(selectedConsulta?.feedback?.rating || 0);
                  setCurrentComment(selectedConsulta?.feedback?.comment || "");
                }}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveFeedback}
                disabled={currentRating === 0}
                className="bg-[#ED4231] hover:bg-[#d53a2a] px-6 min-w-[120px]"
              >
                {selectedConsulta?.feedback ? "Atualizar" : "Enviar"} Avaliação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <style>{`
        body.dark {
          background: linear-gradient(135deg, #181A20 0%, #23272F 60%, #181A20 100%) !important;
          color: #f3f4f6;
        }
        ::selection {
          background: #ED4231;
          color: #fff;
        }
        body.dark ::selection {
          background: #ED4231;
          color: #fff;
        }
        .dark .shadow-md, .dark .shadow-lg {
          box-shadow: none !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .drop-shadow-md {
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.08));
        }
        .transition-transform {
          transition: transform 0.2s cubic-bezier(.4,0,.2,1);
        }
        .hover:scale-[1.01]:hover, .focus-within:scale-[1.01]:focus-within {
          transform: scale(1.01);
        }
        .text-green-700 {
          color: #15803d !important;
        }
        .dark .text-green-400 {
          color: #4ade80 !important;
        }
        .dark .text-gray-100, .dark .text-gray-200, .dark .text-gray-300, .dark .text-indigo-900 {
          color: #f3f4f6 !important;
        }
        .dark .text-gray-400, .dark .text-gray-500, .dark .text-gray-600 {
          color: #cbd5e1 !important;
        }
        .dark .text-indigo-900 {
          color: #a5b4fc !important;
        }
        @media (max-width: 640px) {
          .max-w-5xl {
            max-width: 100vw !important;
            padding: 0 !important;
          }
          .space-y-4 > * {
            margin-bottom: 1rem !important;
          }
          .overflow-hidden {
            overflow-x: auto !important;
          }
        }
      `}</style>
    </SidebarProvider>
  );
};

export default HistoricoUser;
