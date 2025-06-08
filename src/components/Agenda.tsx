import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Sun, CloudMoon, Moon, User, Clock, Menu, CalendarX, History, Home as HomeIcon, Search, Filter, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import TimeSlot from "./TimeSlot";
import { useProfileImage } from "@/components/useProfileImage";
import ErrorMessage from "./ErrorMessage";
import { STATUS_COLORS, MESSAGES } from "../constants/ui";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { AgendaCardSkeleton } from "./ui/custom-skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { useProfessional } from "@/hooks/useProfessional";
import React from "react";

interface Appointment {
  id: string;
  time: string;
  name: string;
  type: string;
  serviceType: string;
  period: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

const Agenda = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>(
    [
      { id: '1', time: "09:00", name: "Ana Silva", type: "Psicologia", serviceType: "Atendimento Online", period: "Manhã", status: 'confirmed', priority: 'high' },
      { id: '2', time: "10:30", name: "Carlos Souza", type: "Nutrição", serviceType: "Consulta Presencial", period: "Manhã", status: 'pending', priority: 'medium' },
      { id: '3', time: "14:00", name: "Beatriz Lima", type: "Fisioterapia", serviceType: "Atendimento Online", period: "Tarde", status: 'confirmed', priority: 'low' },
      { id: '4', time: "15:30", name: "João Pedro", type: "Psicologia", serviceType: "Consulta Presencial", period: "Tarde", status: 'confirmed', priority: 'high' },
      { id: '5', time: "19:00", name: "Mariana Costa", type: "Psicologia", serviceType: "Atendimento Online", period: "Noite", status: 'pending', priority: 'medium' },
      { id: '6', time: "20:30", name: "Rafael Almeida", type: "Nutrição", serviceType: "Consulta Presencial", period: "Noite", status: 'confirmed', priority: 'low' },
    ]
  );

  const { profileImage } = useProfileImage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("profileData");
    return savedData ? JSON.parse(savedData) : { nome: "", sobrenome: "" };
  });

  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { professionalData } = useProfessional();

  // Memoized filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = apt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           apt.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || apt.type === typeFilter;
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [appointments, searchTerm, typeFilter, statusFilter]);

  // Memoized appointment types for filter
  const appointmentTypes = useMemo(() => {
    const types = [...new Set(appointments.map(apt => apt.type))];
    return types;
  }, [appointments]);

  // Optimized next appointment calculation
  const getNextAppointmentIndex = useCallback(() => {
    const now = new Date();
    return filteredAppointments.findIndex((apt) => {
      const [h, m] = apt.time.split(":").map(Number);
      const aptDate = new Date(date);
      aptDate.setHours(h, m, 0, 0);
      return aptDate > now && apt.status !== 'cancelled';
    });
  }, [filteredAppointments, date]);

  const nextIdx = getNextAppointmentIndex();
  // Optimized refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Atualizar agenda via API
      const response = await fetch('/api/agenda/atualizar', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar agenda');
      }

      toast({ 
        title: t('agenda_updated'), 
        description: t('latest_appointments_loaded'),
        variant: "default" 
      });
    } catch (error) {
      toast({ 
        title: t('update_failed'), 
        description: t('try_again_later'),
        variant: "destructive" 
      });
    } finally {
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Memoized cancel handler
  const handleCancelAppointment = useCallback((id: string) => {
    setLoading(true);
    setTimeout(() => {
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === id
            ? { ...appointment, status: 'cancelled' as const }
            : appointment
        )
      );
      setLoading(false);
      setError("");
      toast({ 
        title: t('appointment_cancelled'), 
        description: t('cancel_success'), 
        variant: "destructive" 
      });
    }, 600);
  }, [t]);

  // Memoized reschedule handler
  const handleRescheduleAppointment = useCallback((id: string, newDate: Date, newTime: string) => {
    setLoading(true);
    setTimeout(() => {
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === id
            ? { ...appointment, time: newTime, period: getPeriod(newTime), status: 'confirmed' as const }
            : appointment
        )
      );
      setLoading(false);
      setError("");
      toast({ 
        title: t('appointment_rescheduled'), 
        description: t('reschedule_success'), 
        variant: "default" 
      });
    }, 600);
  }, [t]);

  const getPeriod = (time: string) => {
    const hour = parseInt(time.split(":")[0], 10);
    if (hour < 12) return "Manhã";
    if (hour < 18) return "Tarde";
    return "Noite";
  };

  const periods = [
    { period: "Manhã", Icon: Sun, timeRange: "09h-12h" },
    { period: "Tarde", Icon: CloudMoon, timeRange: "12h-18h" },
    { period: "Noite", Icon: Moon, timeRange: "19h-21h" },
  ];

  // Clear filters function
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
        {/* Sidebar - existing code unchanged */}
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-gray-900/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow" />
            <span className="font-bold text-foreground">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
          </div>
        )}
        
        <div className={`transition-all duration-500 ease-in-out
          ${sidebarOpen ? 'opacity-100 translate-x-0 w-4/5 max-w-xs md:w-72' : 'opacity-0 -translate-x-full w-0'}
          bg-gradient-to-b from-white via-[#f8fafc] to-[#EDF2FB] dark:from-[#23272F] dark:via-[#23272F] dark:to-[#181A20] shadow-2xl rounded-2xl p-6 flex flex-col gap-6 overflow-hidden
          fixed md:static z-40 top-0 left-0 h-full md:h-auto border-r border-[#EDF2FB] dark:border-[#23272F] backdrop-blur-[2px] text-sm md:text-base`
        }>
          {/* ...existing sidebar code... */}
          <div className="w-full flex justify-start mb-6">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2 mb-8">
            <img src={profileImage} alt="Foto de perfil" className="w-16 h-16 rounded-full border-4 border-[#EDF2FB] shadow" />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {professionalData.especialidade}
            </Badge>
          </div>
          
          <SidebarMenu className="gap-4 text-sm md:text-base">
            {/* ...existing menu items... */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/home' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/home" className="flex items-center gap-3">
                      <HomeIcon className="w-6 h-6" color="#ED4231" />
                      <span>Home</span>
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
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/agenda' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/agenda" className="flex items-center gap-3">
                      <CalendarIcon className="w-6 h-6" color="#ED4231" />
                      <span>Agenda</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Veja sua agenda de atendimentos
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/historico' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/historico" className="flex items-center gap-3">
                      <History className="w-6 h-6" color="#ED4231" />
                      <span>Histórico</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Veja seu histórico de atendimentos
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/profile-form' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/profile-form" className="flex items-center gap-3">
                      <User className="w-6 h-6" color="#ED4231" />
                      <span>Editar Perfil</span>
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

        <main id="main-content" role="main" aria-label="Conteúdo principal" className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-gray-900/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-primary shadow hover:scale-105 transition-transform duration-200" />
              <span className="font-bold text-foreground">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                aria-label="Atualizar agenda"
                title="Atualizar agenda"
              >
                <RefreshCw className={`w-5 h-5 text-gray-800 dark:text-gray-200 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h1 className="text-3xl md:text-4xl font-bold animate-fade-in">{t('your_schedule')}</h1>
              
              {/* Date Picker */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                      aria-label="Selecionar data"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Filter className="w-4 h-4" />
                  <span>Filtros:</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por paciente ou tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      aria-label="Buscar atendimentos"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por tipo">
                      <SelectValue placeholder="Tipo de atendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters */}
                {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                    aria-label="Limpar filtros"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              
              {/* Results Counter */}
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {filteredAppointments.length} de {appointments.length} atendimentos
                {searchTerm && ` para "${searchTerm}"`}
              </div>
            </div>

            {/* Appointments List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${date.toString()}-${searchTerm}-${typeFilter}-${statusFilter}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-4" role="region" aria-label="Lista de atendimentos" ref={listRef}>
                  {loading ? (
                    <div className="space-y-4" aria-busy="true" aria-live="polite">
                      {[...Array(3)].map((_, i) => <AgendaCardSkeleton key={i} />)}
                    </div>
                  ) : error ? (
                    <ErrorMessage message={error} />
                  ) : filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                      <CalendarX className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                      <div className="text-gray-500 dark:text-gray-400 text-xl font-semibold mb-2">
                        {searchTerm || typeFilter !== "all" || statusFilter !== "all" 
                          ? "Nenhum atendimento encontrado"
                          : "Nenhum atendimento hoje"
                        }
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 text-sm max-w-md">
                        {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                          ? "Tente ajustar os filtros para encontrar outros atendimentos."
                          : "Você não possui agendamentos para hoje. Aproveite o tempo livre!"
                        }
                      </div>
                      {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="mt-4"
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    periods.map(({ period, Icon, timeRange }, periodIdx) => {
                      const periodAppointments = filteredAppointments.filter((apt) => apt.period === period);
                      if (periodAppointments.length === 0) return null;
                      
                      return (
                        <div key={period} className="bg-white dark:bg-[#181A20] rounded-lg border border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none animate-fade-in transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg focus-within:scale-[1.02] focus-within:shadow-lg group" tabIndex={0} aria-label={`Período ${period}`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center px-2 md:px-4 py-2 border-b border-[#EDF2FB] dark:border-[#444857] bg-white dark:bg-[#23272F] transition-colors duration-200 group-hover:bg-[#f8fafc] group-hover:dark:bg-[#23272F]/80">
                            <div className="flex items-center gap-2">
                              <Icon color="#ED4231" className="w-5 h-5 mr-2" aria-label={`Ícone do período ${period}`}/>
                              <span className="text-green-700 dark:text-green-400 text-sm md:text-base font-semibold">{period}</span>
                              <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                {periodAppointments.length}
                              </Badge>
                              {periodIdx === nextIdx && nextIdx !== -1 && (
                                <Badge className={`ml-2 ${STATUS_COLORS.success} animate-fade-in badge-animate`} aria-label={t('next_appointment')}>{t('next_appointment')}</Badge>
                              )}
                            </div>
                            <span className="text-gray-400 dark:text-gray-500 text-xs md:text-sm ml-0 sm:ml-auto">{timeRange}</span>
                          </div>
                          <AppointmentList 
                            appointments={periodAppointments}
                            onCancel={handleCancelAppointment}
                            onReschedule={handleRescheduleAppointment}
                            nextIdx={nextIdx}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating scroll to top button */}
            {filteredAppointments.length > 4 && (
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#ED4231] text-white shadow-lg hover:bg-[#c32d22] focus:outline-none focus:ring-2 focus:ring-[#ED4231] animate-fade-in transition-transform duration-200 hover:scale-110 active:scale-95"
                aria-label="Voltar ao topo"
              >
                ↑
              </Button>
            )}
          </div>
        </main>
      </div>
      
      {/* Enhanced styles */}
      <style>{`
        /* ...existing styles... */
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
        .badge-animate {
          animation: popBadge 0.4s cubic-bezier(.4,0,.2,1);
        }
        @keyframes popBadge {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        
        /* Enhanced focus styles for accessibility */
        .focus-visible:focus-visible {
          outline: 2px solid #ED4231;
          outline-offset: 2px;
        }
        
        /* Smooth transitions for all interactive elements */
        .transition-all {
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
        }
        
        /* Enhanced mobile responsiveness */
        @media (max-width: 640px) {
          .max-w-5xl {
            max-width: 100vw !important;
            padding: 0.5rem !important;
          }
          .space-y-4 > * {
            margin-bottom: 1rem !important;
          }
          .text-3xl {
            font-size: 1.875rem !important;
          }
          .gap-4 {
            gap: 0.75rem !important;
          }
        }
        
        /* Loading states */
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Priority indicators */
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
      `}</style>
    </SidebarProvider>
  );
};

// Memoized AppointmentList component for better performance
const AppointmentList = React.memo(({ 
  appointments, 
  onCancel, 
  onReschedule, 
  nextIdx 
}: { 
  appointments: Appointment[]; 
  onCancel: (id: string) => void; 
  onReschedule: (id: string, newDate: Date, newTime: string) => void; 
  nextIdx?: number 
}) => {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <CalendarX className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">Nenhum atendimento neste período</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">Você ainda não possui agendamentos para este período.<br/>Quando houver, eles aparecerão aqui!</div>
      </div>
    );
  }
  
  return (
    <div role="list" className="divide-y overflow-x-auto">
      {appointments.map((appointment, idx) => (
        <TimeSlot
          key={appointment.id}
          appointment={appointment}
          onCancel={() => onCancel(appointment.id)}
          onReschedule={(time: string, date: Date, newTime: string) => onReschedule(appointment.id, date, newTime)}
          highlight={nextIdx === idx}
          aria-label={`Atendimento de ${appointment.name} às ${appointment.time} - Status: ${appointment.status} - Prioridade: ${appointment.priority}`}
        />
      ))}
    </div>
  );
});

export default Agenda;
