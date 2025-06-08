import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Sun, CloudMoon, Moon, User, Clock, Menu, CalendarX, History, Home as HomeIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import TimeSlot from "./TimeSlot";
import { useProfileImage } from "@/components/useProfileImage";
import ErrorMessage from "./ErrorMessage";
import { STATUS_COLORS, MESSAGES } from "../constants/ui";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { AgendaCardSkeleton } from "./ui/custom-skeletons";
import { motion, AnimatePresence } from "framer-motion";
import { useUserData } from "@/hooks/useUserData"; // Import the useUserData hook

interface Appointment {
  time: string;
  name: string;
  type: string;
  serviceType: string;
  period: string;
}

const AgendaUser = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(
    [
      { time: "09:00", name: "Dr. Ricardo Santos", type: "Psicologia", serviceType: "Atendimento Online", period: "Manhã" },
      { time: "10:30", name: "Dra. Carolina Mendes", type: "Nutrição", serviceType: "Consulta Presencial", period: "Manhã" },
      { time: "14:00", name: "Dr. Marcelo Pereira", type: "Fisioterapia", serviceType: "Atendimento Online", period: "Tarde" },
      { time: "15:30", name: "Dra. Juliana Costa", type: "Psicologia", serviceType: "Consulta Presencial", period: "Tarde" },
      { time: "19:00", name: "Dr. Felipe Oliveira", type: "Psicologia", serviceType: "Atendimento Online", period: "Noite" },
      { time: "20:30", name: "Dra. Isabela Martins", type: "Nutrição", serviceType: "Consulta Presencial", period: "Noite" },
    ]
  );

  const { profileImage } = useProfileImage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Use the userData hook to get synchronized user data
  const { userData } = useUserData();

  const location = useLocation();  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Let's add the navigate hook for page navigation
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Destaca o próximo atendimento
  const getNextAppointmentIndex = () => {
    const now = new Date();
    return appointments.findIndex((apt) => {
      const [h, m] = apt.time.split(":").map(Number);
      const aptDate = new Date(date);
      aptDate.setHours(h, m, 0, 0);
      return aptDate > now;
    });
  };
  const nextIdx = getNextAppointmentIndex();

  // Feedback visual ao cancelar/reagendar
  const handleCancelAppointment = (time: string) => {
    setLoading(true);
    setTimeout(() => {
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment.time !== time)
      );
      setLoading(false);
      setError("");
      toast({ title: t('appointment_cancelled'), description: t('cancel_success'), variant: "destructive" });
    }, 600);
  };

  const handleRescheduleAppointment = (time: string, newDate: Date, newTime: string) => {
    setLoading(true);
    setTimeout(() => {
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.time === time
            ? { ...appointment, time: newTime, period: getPeriod(newTime) }
            : appointment
        )
      );
      setLoading(false);
      setError("");
      toast({ title: t('appointment_rescheduled'), description: t('reschedule_success'), variant: "default" });
    }, 600);
  };

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

  // Handle logout function
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('profileData');
    navigate('/');
    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso.",
    });
    setShowLogoutDialog(false);
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
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/home-user' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/home-user" className="flex items-center gap-3">
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
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/agenda-user' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/agenda-user" className="flex items-center gap-3">
                      <CalendarIcon className="w-6 h-6" color="#ED4231" />
                      <span>Meus Agendamentos</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  Veja sua agenda de consultas
                </TooltipContent>
              </Tooltip>            </SidebarMenuItem>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/historico-user' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/historico-user" className="flex items-center gap-3">
                      <History className="w-6 h-6" color="#ED4231" />
                      <span>Histórico</span>
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
                   <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/agendar-horario-user' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/agendar-horario-user" className="flex items-center gap-3">
                      <Clock className="w-6 h-6" color="#ED4231" />
                      <span>Agendar Consulta</span>
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
                  <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/profile-form-user' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                    <Link to="/profile-form-user" className="flex items-center gap-3">
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
        <main id="main-content" role="main" aria-label="Conteúdo principal da agenda" className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho da agenda">
            <div className="flex items-center gap-3">
              <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200" />
              {/* Update to use userData from hook */}
              <span className="font-bold text-indigo-900 dark:text-gray-100">{userData.nome} {userData.sobrenome}</span>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                    aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                    tabIndex={0}
                    title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>
          <div className="h-20" />
          <div className="max-w-5xl mx-auto p-2 md:p-6 bg-[#EDF2FB] dark:bg-[#181A20]">
            <h1 className="text-3xl md:text-4xl font-bold text-center animate-fade-in mb-4">Minhas Consultas</h1>

            {!userData.nome && (
              <div className="p-4">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={date.toString()}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-4" role="region" aria-label="Lista de consultas" ref={listRef}>
                  {loading ? (
                    <div className="space-y-4" aria-busy="true" aria-live="polite">
                      {[...Array(3)].map((_, i) => <AgendaCardSkeleton key={i} />)}
                    </div>
                  ) : error ? (
                    <ErrorMessage message={error} />
                  ) : (
                    periods.map(({ period, Icon, timeRange }, periodIdx) => (
                      <div key={period} className="bg-white dark:bg-[#181A20] rounded-lg border border-[#EDF2FB] dark:border-[#444857] shadow-sm dark:shadow-none animate-fade-in transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg focus-within:scale-[1.02] focus-within:shadow-lg group" tabIndex={0} aria-label={`Período ${period}`}> 
                        <div className="flex flex-col sm:flex-row items-start sm:items-center px-2 md:px-4 py-2 border-b border-[#EDF2FB] dark:border-[#444857] bg-white dark:bg-[#23272F] transition-colors duration-200 group-hover:bg-[#f8fafc] group-hover:dark:bg-[#23272F]/80">
                          <div className="flex items-center gap-2">
                            <Icon color="#ED4231" className="w-5 h-5 mr-2" aria-label={`Ícone do período ${period}`}/>
                            <span className={`text-gray-600 dark:text-gray-100 text-sm md:text-base font-semibold ${appointments.filter((apt) => apt.period === period).length > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>{period}</span>
                            {periodIdx === nextIdx && nextIdx !== -1 && (
                              <Badge className={`ml-2 ${STATUS_COLORS.success} animate-fade-in`} aria-label={t('next_appointment')}>{t('next_appointment')}</Badge>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0} className="ml-2 cursor-pointer text-gray-400 hover:text-[#ED4231] focus:text-[#ED4231]" aria-label={`Dica sobre o período ${period}`}>?</span>
                              </TooltipTrigger>
                              <TooltipContent className="z-50">Veja suas consultas do período {period.toLowerCase()}.</TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-gray-400 dark:text-gray-500 text-xs md:text-sm ml-0 sm:ml-auto">{timeRange}</span>
                        </div>
                        <AppointmentList 
                          appointments={appointments.filter((apt) => apt.period === period)}
                          onCancel={handleCancelAppointment}
                          onReschedule={handleRescheduleAppointment}
                          nextIdx={nextIdx}
                        />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {appointments.length > 4 && (
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
        .badge-animate {
          animation: popBadge 0.4s cubic-bezier(.4,0,.2,1);
        }
        @keyframes popBadge {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>

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

function AppointmentList({ appointments, onCancel, onReschedule, nextIdx }: { appointments: Appointment[]; onCancel: (time: string) => void; onReschedule: (time: string, newDate: Date, newTime: string) => void; nextIdx?: number }) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <CalendarX className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">Nenhuma consulta neste período</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">Você ainda não possui consultas agendadas para este período.<br/>Quando houver, elas aparecerão aqui!</div>
      </div>
    );
  }
  return (
    <div role="list" className="divide-y overflow-x-auto">
      {appointments.map((appointment, idx) => (
        <TimeSlot
          key={`${appointment.time}-${idx}`}
          appointment={appointment}
          onCancel={onCancel}
          onReschedule={onReschedule}
          highlight={nextIdx === idx}
          aria-label={`Consulta com ${appointment.name} às ${appointment.time}`}
        />
      ))}
    </div>
  );
}

export default AgendaUser;
