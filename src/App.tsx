import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DisponibilizarHorario from "./pages/DisponibilizarHorario";
import Agenda from "@/components/Agenda";
import AgendaUser from "@/components/AgendaUser";
import Home from "@/components/Home";
import HomeUser from "@/components/HomeUser";
import Historico from "@/components/Historico";
import HistoricoUser from "@/components/HistoricoUser";
import ProfileForm from "@/components/ProfileForm";
import ProfileFormUser from "@/components/ProfileFormUser";
import TelaLogin from "@/components/TelaLogin";
import { ProfileImageProvider } from "@/components/ProfileImageContext";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { UserNavigationProvider } from "@/contexts/UserNavigationContext";
import AgendarHorarioUser from "@/components/AgendarHorarioUser";
import { CompletarCadastroUsuarioAssistido } from "./components/CompletarCadastroUsuarioAssistido";
import AssistenteSocial from "@/components/AssistenteSocial";
import ProfileFormAssistenteSocial from "@/components/ProfileFormAssistenteSocial";
import CadastroVoluntario from "@/components/CadastroVoluntario";
import PagamentoUser from "@/components/PagamentoUser";
import { UserProvider } from "@/contexts/UserContext";
import { ProfessionalProvider } from "@/contexts/ProfessionalContext";
import { CompletarCadastroVoluntario } from "@/components/CompletarCadastroVoluntario";
import { ClassificacaoUsuarios } from "@/components/ClassificacaoUsuarios";
import CadastroAssistenteSocial from "@/components/CadastroAssistenteSocial";

const queryClient = new QueryClient();

const App = () => {
  // Carrega o script VLibras apenas uma vez
  useEffect(() => {
    if (document.getElementById("vlibras-plugin-script")) return;
    setTimeout(() => {
      const script = document.createElement("script");
      script.id = "vlibras-plugin-script";
      script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      script.async = true;
      script.onload = () => {
        // @ts-expect-error: VLibras is not typed in the global window object
        if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');
      };
      document.body.appendChild(script);
    }, 500); // Pequeno delay para garantir que o DOM está pronto
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ProfileImageProvider>
            <UserProvider>
              <ProfessionalProvider>
                <Router>
                  <UserNavigationProvider>
                    <Routes>                      
                      {/* Rotas do usuário */}
                      <Route path="/home-user" element={<HomeUser />} />
                      <Route path="/agenda-user" element={<AgendaUser />} />
                      <Route path="/historico-user" element={<HistoricoUser />} />
                      <Route path="/agendar-horario-user" element={<AgendarHorarioUser />} />
                      <Route path="/profile-form-user" element={<ProfileFormUser />} />
                      <Route path="/pagamento-user" element={<PagamentoUser />} />

                      {/* Rotas do profissional */}
                      <Route path="/home" element={<Home />} />
                      <Route path="/disponibilizar-horario" element={<DisponibilizarHorario />} />
                      <Route path="/agenda" element={<Agenda />} />
                      <Route path="/historico" element={<Historico />} />
                      <Route path="/profile-form" element={<ProfileForm />} />                      
                      <Route path="/login" element={<TelaLogin />} />                      
                      <Route path="/cadastro" element={<TelaLogin />} />
                      {/* Rota para o formulário de inscrição */}
                      <Route path="/completar-cadastro-usuario" element={<CompletarCadastroUsuarioAssistido />} />
                      {/* Rota para completar cadastro do assistido */}
                      <Route path="/completar-cadastro-voluntario" element={<CompletarCadastroVoluntario />} />                      {/* Rotas da assistente social */}                      <Route path="/assistente-social" element={<AssistenteSocial />} />
                      <Route path="/profile-form-assistente-social" element={<ProfileFormAssistenteSocial />} />
                      <Route path="/cadastro-assistente" element={<CadastroAssistenteSocial />} />
                      <Route path="/cadastro-voluntario" element={<CadastroVoluntario />} />
                      <Route path="/classificacao-usuarios" element={<ClassificacaoUsuarios />} />

                      {/* Redirecionamento para a home do usuário como fallback */}
                      <Route path="/" element={<HomeUser />} />
                      {/* Rota padrão para página não encontrada */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </UserNavigationProvider>
                </Router>
              </ProfessionalProvider>
            </UserProvider>
          </ProfileImageProvider>
        </TooltipProvider>
        {/* Foco visual customizado global */}
        <style>{`
          :focus-visible {
            outline: 3px solid #ED4231 !important;
            outline-offset: 2px;
            box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ED4231;
            transition: outline 0.2s, box-shadow 0.2s;
          }
        `}</style>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;