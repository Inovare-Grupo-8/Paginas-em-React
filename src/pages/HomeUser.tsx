import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, User, Clock, Menu, History, Calendar, Sun, Moon, X, Info, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { userNavigationItems } from "@/utils/userNavigation";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { getUserNavigationPath } from "@/utils/userNavigation";
import { useUserData } from "@/hooks/useUserData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

// Dados simulados para consultas - substitua por fonte de dados real posteriormente
const mockConsultations = [
  {
    id: 1,
    doctor: "Dr. Ana Silva",
    specialty: "Cardiologia",
    date: "2023-11-28",
    time: "14:30",
    status: "Agendada",
    location: "Clínica Central - Sala 302",
    notes: "Trazer exames anteriores"
  },
  {
    id: 2,
    doctor: "Dr. Carlos Mendes",
    specialty: "Oftalmologia",
    date: "2023-12-05",
    time: "10:15",
    status: "Agendada",
    location: "Hospital São Lucas - Ala B",
    notes: "Consulta de retorno"
  },
  {
    id: 3,
    doctor: "Dra. Mariana Costa",
    specialty: "Dermatologia",
    date: "2023-12-15",
    time: "09:00",
    status: "Agendada",
    location: "Centro Médico Vida - 5º andar",
    notes: ""
  }
];

const HomeUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const { userData } = useUserData();
  
  // Variáveis de estado para controle dos modais
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultations, setConsultations] = useState(mockConsultations);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const { toast } = useToast();

  // Gerencia a abertura do diálogo de cancelamento
  const handleCancelClick = (consultation) => {
    setSelectedConsultation(consultation);
    setCancelDialogOpen(true);
  };

  // Gerencia a abertura do diálogo de detalhes
  const handleDetailsClick = (consultation) => {
    setSelectedConsultation(consultation);
    setDetailsDialogOpen(true);
  };

  // Função para abrir o modal de reagendamento
  const handleRescheduleClick = (consultation) => {
    setSelectedConsultation(consultation);
    setNewDate(consultation.date);
    setNewTime(consultation.time);
    setRescheduleDialogOpen(true);
  };

  // Gerencia a confirmação de cancelamento
  const handleConfirmCancel = () => {
    if (selectedConsultation) {
      // Em uma aplicação real, você chamaria uma API para cancelar a consulta
      setConsultations(consultations.map(c => 
        c.id === selectedConsultation.id 
          ? {...c, status: "Cancelada"} 
          : c
      ));
      
      // Mostrar notificação de sucesso
      toast({
        title: "Consulta cancelada",
        description: `Sua consulta com ${selectedConsultation.doctor} foi cancelada com sucesso.`,
        variant: "destructive",
      });
      
      setCancelDialogOpen(false);
    }
  };

  // Função para confirmar o reagendamento
  const handleConfirmReschedule = () => {
    if (selectedConsultation && newDate && newTime) {
      // Em uma aplicação real, você chamaria uma API para reagendar a consulta
      setConsultations(consultations.map(c => 
        c.id === selectedConsultation.id 
          ? {...c, date: newDate, time: newTime} 
          : c
      ));
      
      // Mostrar notificação de sucesso
      toast({
        title: "Consulta reagendada",
        description: `Sua consulta com ${selectedConsultation.doctor} foi reagendada para ${new Date(newDate).toLocaleDateString()} às ${newTime}.`,
        variant: "default",
      });
      
      setRescheduleDialogOpen(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans text-base">
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-[#23272F]/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData?.nome || 'User'}
              size="w-10 h-10"
              className="border-2 border-[#ED4231] shadow"
            />
            {/* Use the userData from the hook */}
            <span className="font-bold text-indigo-900 dark:text-gray-100">{userData.nome} {userData.sobrenome}</span>
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
              name={userData?.nome || 'User'}
              size="w-16 h-16"
              className="border-4 border-[#EDF2FB] shadow"
            />

            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">{userData.nome} {userData.sobrenome}</span>
          </div>
          
          {/* Adicione itens de navegação aqui se necessário */}
        </div>

        <main id="main-content" role="main" aria-label="Conteúdo principal" className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho">
            <div className="flex items-center gap-3">
              <ProfileAvatar 
                profileImage={profileImage}
                name={userData?.nome || 'User'}
                size="w-10 h-10"
                className="border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200"
              />
      
              <span className="font-bold text-indigo-900 dark:text-gray-100">{userData.nome} {userData.sobrenome}</span>
            </div>
            
            {/* Você pode adicionar mais conteúdo ao cabeçalho aqui */}
          </header>
          
          {/* Conteúdo da lista de consultas */}
          <div className="pt-20 pb-10 px-4 md:px-8">
            <h1 className="text-2xl font-bold mb-6 text-indigo-900 dark:text-gray-100">Minhas Consultas</h1>
            
            <div className="grid gap-4">
              {consultations.map((consultation) => (
                <div 
                  key={consultation.id}
                  className={`p-4 bg-white dark:bg-[#23272F] rounded-lg shadow-md border-l-4 ${
                    consultation.status === "Agendada" 
                      ? "border-green-500" 
                      : consultation.status === "Cancelada" 
                      ? "border-red-500" 
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{consultation.doctor}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{consultation.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(consultation.date).toLocaleDateString()} às {consultation.time}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      consultation.status === "Agendada" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : consultation.status === "Cancelada" 
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}>
                      {consultation.status}
                    </span>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDetailsClick(consultation)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Info className="w-4 h-4" />
                        <span>Detalhes</span>
                      </Button>
                      
                      {consultation.status === "Agendada" && (
                        <>
                          <Button
                            onClick={() => handleRescheduleClick(consultation)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reagendar</span>
                          </Button>
                          
                          <Button
                            onClick={() => handleCancelClick(consultation)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal de Cancelamento */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar cancelamento</DialogTitle>
                <DialogDescription>
                  Você está prestes a cancelar uma consulta. Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              
              {selectedConsultation && (
                <div className="py-4">
                  <p><strong>Médico:</strong> {selectedConsultation.doctor}</p>
                  <p><strong>Especialidade:</strong> {selectedConsultation.specialty}</p>
                  <p><strong>Data/Hora:</strong> {new Date(selectedConsultation.date).toLocaleDateString()} às {selectedConsultation.time}</p>
                </div>  
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Voltar
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleConfirmCancel}
                >
                  Confirmar Cancelamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Detalhes */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Detalhes da Consulta</DialogTitle>
              </DialogHeader>
              
              {selectedConsultation && (
                <div className="py-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="font-bold text-lg">{selectedConsultation.doctor}</div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      selectedConsultation.status === "Agendada" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : selectedConsultation.status === "Cancelada" 
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}>
                      {selectedConsultation.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p><strong>Especialidade:</strong> {selectedConsultation.specialty}</p>
                    <p><strong>Data:</strong> {new Date(selectedConsultation.date).toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> {selectedConsultation.time}</p>
                    <p><strong>Local:</strong> {selectedConsultation.location}</p>
                    {selectedConsultation.notes && (
                      <p><strong>Observações:</strong> {selectedConsultation.notes}</p>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Reagendamento */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reagendar Consulta</DialogTitle>
                <DialogDescription>
                  Selecione uma nova data e horário para sua consulta.
                </DialogDescription>
              </DialogHeader>
              
              {selectedConsultation && (
                <div className="py-4 space-y-4">
                  <div>
                    <p><strong>Médico:</strong> {selectedConsultation.doctor}</p>
                    <p><strong>Especialidade:</strong> {selectedConsultation.specialty}</p>
                    <p><strong>Data/Hora atual:</strong> {new Date(selectedConsultation.date).toLocaleDateString()} às {selectedConsultation.time}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-date">Nova Data</Label>
                    <Input 
                      id="new-date" 
                      type="date" 
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-time">Novo Horário</Label>
                    <Input 
                      id="new-time" 
                      type="time" 
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setRescheduleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={handleConfirmReschedule}
                  disabled={!newDate || !newTime}
                >
                  Confirmar Reagendamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HomeUser;