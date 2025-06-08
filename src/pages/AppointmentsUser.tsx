import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, User, Clock, Menu, History, Calendar, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { userNavigationItems } from "@/utils/userNavigation";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { getUserNavigationPath } from "@/utils/userNavigation";
import { useUserData } from "@/hooks/useUserData";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

const AppointmentsUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  // Get user data from the hook
  const { userData } = useUserData();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans text-base">        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-[#23272F]/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData.nome || 'User'}
              size="w-10 h-10"
              className="border-2 border-[#ED4231]"
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
          </div>          <div className="flex flex-col items-center gap-2 mb-8">
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData.nome || 'User'}
              size="w-16 h-16"
              className="border-4 border-[#EDF2FB]"
            />
            {/* Use the userData from the hook */}
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">{userData.nome} {userData.sobrenome}</span>
          </div>
          
          {/* ...existing sidebar content... */}
        </div>

        <main id="main-content" role="main" aria-label="Conteúdo principal" className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho">
            <div className="flex items-center gap-3">
              <ProfileAvatar 
                profileImage={profileImage}
                name={userData.nome || 'User'}
                size="w-10 h-10"
                className="border-2 border-[#ED4231]"
              />
              {/* Use the userData from the hook */}
              <span className="font-bold text-indigo-900 dark:text-gray-100">{userData.nome} {userData.sobrenome}</span>
            </div>
            
            {/* ...existing header content... */}
          </header>

          {/* ...existing main content... */}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppointmentsUser;