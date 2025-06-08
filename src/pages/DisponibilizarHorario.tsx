import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sun, CloudMoon, Moon, Calendar as CalendarIcon, User, Clock, Menu, History, Home as HomeIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import TimeSlotSection from "@/components/TimeSlotSection";
import AgendaSummary from "@/components/AgendaSummary";
import { toast } from "@/components/ui/use-toast";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useProfileImage } from "@/components/useProfileImage";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTimeModal from "../components/CustomTimeModal";
import ErrorMessage from "@/components/ErrorMessage";
import { isValidTime, isFutureDate, getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { STATUS_COLORS, MESSAGES } from "../constants/ui";
import { useTranslation } from "react-i18next";
import { DisponibilizarHorarioSkeleton } from "../components/ui/custom-skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useProfessional } from "@/hooks/useProfessional";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

const DisponibilizarHorario = () => {
  const { t } = useTranslation();
  const { userData } = useUser();
  const { professionalData } = useProfessional();

  // Estado para armazenar a data selecionada
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Estado para armazenar o horário selecionado
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Estado para o primeiro mês a ser exibido (Abril de 2025)
  const [firstMonth, setFirstMonth] = useState<Date>(new Date(2025, 3, 1)); // Abril de 2025

  // Estado para o segundo mês a ser exibido (Maio de 2025)
  const [secondMonth, setSecondMonth] = useState<Date>(new Date(2025, 4, 1)); // Maio de 2025

  // Estado para controlar a abertura do modal de confirmação
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para controlar a abertura do modal de horário personalizado
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);

  // Estado para armazenar o horário personalizado
  const [customTime, setCustomTime] = useState("");

  // Estado para mensagens de validação
  const [validationMessage, setValidationMessage] = useState("");

  const { profileImage } = useProfileImage();

  // Estado para controlar a abertura/fechamento da sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("profileData");
    return savedData ? JSON.parse(savedData) : { nome: "", sobrenome: "" };
  });

  const location = useLocation();

  // Estado para controlar o estado de loading
  const [isLoading, setIsLoading] = useState(false);

  // Estado para modal de confirmação de saída
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Estado para modal de sucesso após disponibilizar horário
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const { theme, toggleTheme } = useThemeToggleWithNotification();

  // Referência para o resumo fixo
  const summaryRef = useRef<HTMLDivElement>(null);

  // Skeleton loader e feedback visual
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Função para salvar a data e o horário no localStorage
  const saveToLocalStorage = () => {
    if (selectedDate) {
      localStorage.setItem("selectedDate", selectedDate.toISOString());
    }
    if (selectedTime) {
      localStorage.setItem("selectedTime", selectedTime);
    }
  };

  // Carrega a data e o horário do localStorage ao montar o componente
  useEffect(() => {
    const storedDate = localStorage.getItem("selectedDate");
    const storedTime = localStorage.getItem("selectedTime");

    if (storedDate) {
      setSelectedDate(new Date(storedDate));
    }
    if (storedTime) {
      setSelectedTime(storedTime);
    }
  }, []);

  // Validação para impedir a seleção de datas passadas
  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isFutureDate(date)) {
      setValidationMessage("Não é possível selecionar uma data que já passou.");
      setIsModalOpen(true);
      return;
    }
    setSelectedDate(date);
    setValidationMessage("");
  };

  // Função para rolar até o resumo ao selecionar horário
  const scrollToSummary = () => {
    if (summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Função para selecionar o horário
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    scrollToSummary();
  };

  // Função para confirmar logout
  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Função para realmente sair
  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    // Redirecionar ou limpar dados do usuário
    localStorage.clear();
    window.location.href = '/';
  };

  // Função para cancelar logout
  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  // Função para confirmar disponibilização de horário
  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      setValidationMessage("Por favor, selecione uma data e um horário antes de confirmar.");
      setIsModalOpen(true);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      saveToLocalStorage();
      setValidationMessage("");
      setIsModalOpen(false);
      setIsLoading(false);
      setIsSuccessModalOpen(true);
      toast({
        title: "Sucesso!",
        description: `Horário disponibilizado com sucesso: ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}`,
        variant: "default",
        duration: 4000,
      });
    }, 1200);
  };

  // Função para fechar modal de sucesso
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setValidationMessage("");
    setIsModalOpen(false);
    setIsCustomTimeModalOpen(false);
  };

  const handleOtherTime = () => {
    setIsCustomTimeModalOpen(true);
  };

  // Validação para horários personalizados no formato correto e intervalo permitido
  const handleCustomTimeConfirm = () => {
    if (!customTime || !isValidTime(customTime)) {
      setValidationMessage("Por favor, insira um horário válido no formato HH:mm.");
      setIsCustomTimeModalOpen(true);
      return;
    }

    const [hours, minutes] = customTime.split(":").map(Number);
    if (hours < 6 || hours > 21 || (hours === 21 && minutes > 0)) {
      setValidationMessage("O horário deve estar entre 06:00 e 21:00.");
      setIsCustomTimeModalOpen(true);
      return;
    }

    if (selectedTime) {
      const [selectedHours] = selectedTime.split(":").map(Number);
      if (Math.abs(hours - selectedHours) < 1) {
        setValidationMessage("O intervalo entre os horários deve ser de pelo menos uma hora.");
        setIsCustomTimeModalOpen(true);
        return;
      }
    }

    setValidationMessage("");
    setSelectedTime(customTime);
    setIsCustomTimeModalOpen(false);
  };

  const periods = [
    { title: "Manhã", Icon: Sun, timeSlots: [
      "06h00", "06h30", "07h00", "07h30", 
      "08h00", "08h30", "09h00", "09h30", 
      "10h00", "10h30", "11h00", "11h30"
    ] },
    { title: "Tarde", Icon: CloudMoon, timeSlots: [
      "12h00", "12h30", "13h00", "13h30", 
      "14h00", "14h30", "15h00", "15h30", 
      "16h00", "16h30", "17h00", "17h30"
    ] },
    { title: "Noite", Icon: Moon, timeSlots: [
      "18h00", "18h30", "19h00", "19h30", 
      "20h00", "20h30", "21h00", "21h30"
    ] }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-gray-900/90 shadow-md backdrop-blur-md">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </button>
            <ProfileAvatar 
              profileImage={profileImage}
              name={`Dr. ${professionalData.nome} ${professionalData.sobrenome}`}
              size="w-10 h-10"
              className="border-2 border-[#ED4231] shadow"
            />
            <span className="font-bold text-foreground">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
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
            <ProfileAvatar 
              profileImage={profileImage}
              name={`Dr. ${professionalData.nome} ${professionalData.sobrenome}`}
              size="w-16 h-16"
              className="border-4 border-[#EDF2FB] shadow"
            />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {professionalData.especialidade}
            </Badge>
          </div>
          
          <SidebarMenu className="gap-4 text-sm md:text-base">
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
                <TooltipContent>
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
                <TooltipContent>
                  Veja sua agenda de atendimentos
                </TooltipContent>
              </Tooltip>            </SidebarMenuItem>
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
                <TooltipContent>
                  Veja seu histórico de atendimentos
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/disponibilizar-horario' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/disponibilizar-horario" className="flex items-center gap-3">
                      <Clock className="w-6 h-6" color="#ED4231" />
                      <span>Disponibilizar Horário</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>
                  Disponibilize novos horários para atendimento
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
                <TooltipContent>
                  Edite seu perfil e foto
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            {/* Botão Sair na sidebar */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3" onClick={handleLogout}>
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                      <span>Sair</span>
                    </span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>
                  Sair da conta
                </TooltipContent>
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
              <ProfileAvatar 
                profileImage={profileImage}
                name={`Dr. ${professionalData.nome} ${professionalData.sobrenome}`}
                size="w-10 h-10"
                className="border-2 border-primary shadow hover:scale-105 transition-transform duration-200"
              />
              <span className="font-bold text-foreground">Dr. {professionalData.nome} {professionalData.sobrenome}</span>
            </div>
            <div className="flex items-center gap-3">              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                tabIndex={0}
                title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
              </button>
            </div>
          </header>
          <div className="h-20" />
          <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl font-bold text-center animate-fade-in">{t('make_time_available')}</h1>
            <p className="text-lg md:text-xl mb-6 text-center animate-fade-in text-gray-500">{t('choose_date_time')}</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate?.toString() || 'no-date'}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Coluna da esquerda: calendário e horários */}
                  <div className="flex-1 flex flex-col gap-8 min-w-0">
                    <Card className="rounded-2xl shadow-lg p-0 animate-fade-in transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl focus-within:scale-[1.02] focus-within:shadow-xl group" role="region" aria-label="Calendário de seleção de data">
                      <CardHeader className="flex flex-row items-center justify-between py-4 bg-[#f8fafc] rounded-t-2xl transition-colors duration-200 group-hover:bg-[#f1f5f9] group-hover:dark:bg-[#23272F]/80">
                        <CardTitle className="text-lg md:text-xl">
                          {selectedDate ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR }) : format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="w-full flex justify-center items-center p-2 sm:p-4">
                          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              showOutsideDays={true}
                              className="w-full min-h-[340px] sm:min-h-[380px] md:min-h-[420px] rounded-xl border border-[#EDF2FB] bg-white shadow-sm text-base sm:text-lg md:text-xl dark:bg-[#23272F] dark:border-[#444857] dark:text-gray-100 dark:[&_button]:text-gray-100 dark:[&_button]:hover:bg-[#23272F]/80 dark:[&_button]:focus:bg-[#181A20] dark:[&_button]:focus:text-white dark:[&_button]:hover:text-white"
                              locale={ptBR}
                              aria-label="Calendário para selecionar data"
                              aria-describedby="calendario-erro"
                              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            />
                            <span id="calendario-erro" className="sr-only">{validationMessage && selectedDate === undefined ? validationMessage : ''}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-6 animate-fade-in" role="region" aria-label="Seleção de horários">
                      {periods.map(({ title, Icon, timeSlots }) => (
                        <div key={title} className="bg-white dark:bg-[#23272F] rounded-lg overflow-hidden border border-[#D1D5DB] dark:border-[#23272F] shadow-sm dark:shadow-none">
                          <div className="flex items-center px-4 py-3 border-b border-[#D1D5DB] dark:border-[#23272F] bg-white dark:bg-[#23272F]">
                            <Icon color="#ED4231" className="w-6 h-6 mr-2" aria-label={`Ícone do período ${title}`} />
                            <span className="text-lg text-gray-800 dark:text-gray-200 font-semibold" tabIndex={0} title={`Horários do período ${title}`}>{title}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0} className="ml-2 cursor-pointer text-gray-400 hover:text-[#ED4231] focus:text-[#ED4231] text-base" aria-label={`Dica sobre o período ${title}`}>?</span>
                              </TooltipTrigger>
                              <TooltipContent className="text-base">Selecione um horário disponível para o período {title.toLowerCase()}.</TooltipContent>
                            </Tooltip>
                          </div>
                          {timeSlots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                              <Clock className="w-20 h-20 mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                              <div className="text-lg text-gray-500 dark:text-gray-400 font-semibold mb-1">Nenhum horário disponível</div>
                              <div className="text-base text-gray-400 dark:text-gray-500">Todos os horários deste período já foram reservados.<br/>Tente outro período ou volte mais tarde.</div>
                            </div>
                          ) : (
                            <TimeSlotSection 
                              title={title} 
                              timeSlots={timeSlots}
                              selectedTime={selectedTime}
                              onSelectTime={handleTimeSelect}
                              highlightColor={title === 'Manhã' ? 'bg-yellow-100 dark:bg-yellow-900/30' : title === 'Tarde' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}
                              animateSelection
                              aria-describedby="horarios-erro"
                              aria-label={`Horários disponíveis para o período ${title}`}
                              aria-selected={selectedTime ? true : false}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Coluna da direita: resumo */}
                  <div ref={summaryRef} className="w-full lg:w-96 lg:max-w-md flex-shrink-0 mt-6 lg:mt-0 flex flex-col gap-6" role="complementary" aria-label="Resumo do horário selecionado">
                    {/* Resumo do horário selecionado */}
                    <div
                      className="w-full bg-white dark:bg-[#23272F] dark:border dark:border-[#23272F] rounded-lg shadow p-6 mb-2 text-center transition-colors duration-300 text-gray-900 dark:text-gray-100 sticky top-24 z-10 animate-fade-in text-lg"
                      role="status"
                      aria-live="polite"
                      aria-describedby="resumo-erro"
                    >
                      {selectedDate && selectedTime ? (
                        <>
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-lg">Selecionado:</span>
                          <div className="mt-1 text-xl">{format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às {selectedTime}</div>
                          <Badge className={`ml-2 ${STATUS_COLORS.success} animate-fade-in badge-animate text-base`} aria-label={t('selected_time')}>{t('selected_time')}</Badge>
                        </>
                      ) : (
                        <span className="text-gray-400 text-base">Nenhum horário selecionado</span>
                      )}
                      <ErrorMessage message={validationMessage} />
                      {validationMessage && (
                        <span id="resumo-erro" className="text-red-500 text-base mt-2 block" role="alert">{validationMessage}</span>
                      )}
                    </div>
                    <AgendaSummary 
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      highlight={!!selectedDate && !!selectedTime}
                    />
                    <Button 
                      className={`w-full bg-indigo-900 dark:bg-indigo-700 hover:bg-indigo-800 dark:hover:bg-indigo-800 text-white py-7 mt-2 transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} shadow-md dark:shadow-none text-lg`}
                      onClick={handleOtherTime}
                      aria-label={t('choose_custom_time')}
                      disabled={isLoading}
                      aria-disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2 text-lg"><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>{t('loading')}</span>
                      ) : t('other_time')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="text-center flex flex-col items-center" role="dialog" aria-modal="true">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Confirmação</DialogTitle>
              </DialogHeader>
              {validationMessage && (
                <p className="text-red-500 text-sm mb-4" role="alert">{validationMessage}</p>
              )}
              <p className="text-sm text-gray-600 mb-4">
                Ao clicar em confirmar, você <span className="font-semibold">declara</span> que estará disponível no dia e horário.
              </p>
              <DialogFooter className="flex flex-col gap-2 w-full items-center">
                <Button className="bg-indigo-900 hover:bg-indigo-800 text-white py-2 w-3/4" onClick={closeModal} aria-label="Confirmar seleção">
                  Confirmar
                </Button>
                <Button variant="outline" className="py-2 w-3/4" onClick={closeModal} aria-label="Cancelar seleção">
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de confirmação de logout */}
          <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
            <DialogContent className="text-center flex flex-col items-center" role="dialog" aria-modal="true">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Deseja realmente sair?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600 mb-4">Você será desconectado da plataforma.</p>
              <DialogFooter className="flex flex-col gap-2 w-full items-center">
                <Button className="bg-[#ED4231] hover:bg-[#c32d22] text-white py-2 w-3/4" onClick={confirmLogout} aria-label="Confirmar saída">
                  Sair
                </Button>
                <Button variant="outline" className="py-2 w-3/4" onClick={cancelLogout} aria-label="Cancelar saída">
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de sucesso após disponibilizar horário */}
          <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
            <DialogContent className="text-center flex flex-col items-center" role="alertdialog" aria-modal="true">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-green-700">Horário disponibilizado!</DialogTitle>
              </DialogHeader>
              <p className="text-green-700 text-lg font-semibold mb-2">Seu horário foi salvo com sucesso.</p>
              <Button className="bg-indigo-900 dark:bg-indigo-700 hover:bg-indigo-800 dark:hover:bg-indigo-800 text-white py-2 w-3/4 mt-2 shadow-md dark:shadow-none" onClick={closeSuccessModal} aria-label="Fechar modal de sucesso" tabIndex={0} title="Fechar modal de sucesso">
                OK
              </Button>
            </DialogContent>
          </Dialog>

          {/* Modal de horário personalizado como componente separado */}
          <CustomTimeModal
            open={isCustomTimeModalOpen}
            onOpenChange={setIsCustomTimeModalOpen}
            customTime={customTime}
            setCustomTime={setCustomTime}
            validationMessage={validationMessage}
            onConfirm={handleCustomTimeConfirm}
          />
          {selectedDate && selectedTime && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#ED4231] text-white shadow-lg hover:bg-[#c32d22] focus:outline-none focus:ring-2 focus:ring-[#ED4231] animate-fade-in transition-transform duration-200 hover:scale-110 active:scale-95"
              aria-label="Voltar ao topo"
            >
              ↑
            </button>
          )}
        </main>
      </div>
      <style>{`
        :focus {
          outline: 2px solid #4F46E5;
          outline-offset: 2px;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border-width: 0;
        }
        .focus:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          margin: 0;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
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
        .not-allowed {
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
        .fade-in {
          animation: fadeIn 0.4s ease-in;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .lg:flex-row {
            flex-direction: column !important;
          }
          .lg:max-w-xs {
            max-width: 100% !important;
          }
        }
        .badge-animate {
          animation: popBadge 0.4s cubic-bezier(.4,0,.2,1);
        }
        @keyframes popBadge {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        :focus-visible {
          outline: 3px solid #ED4231 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ED4231;
          transition: outline 0.2s, box-shadow 0.2s;
        }
      `}</style>
    </SidebarProvider>
  );
};

export default DisponibilizarHorario;