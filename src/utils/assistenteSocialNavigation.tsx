import { Home as HomeIcon, User, UserCheck, UserPlus } from "lucide-react";
import type { UserNavigationItem } from "./userNavigation";

// Standard navigation items for the assistente social interface
export const assistenteSocialNavItems: Record<string, UserNavigationItem> = {
  home: {
    path: '/home-assistente',
    label: 'Home',
    icon: <HomeIcon className="w-6 h-6" color="#ED4231" />,
  },
  classificarUsuarios: {
    path: '/classificacao-usuarios',
    label: 'Classificar Usuários',
    icon: <UserCheck className="w-6 h-6" color="#ED4231" />,
  },
  cadastrarVoluntario: {
    path: '/cadastro-voluntario',
    label: 'Cadastrar Voluntário',
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />,
  }, 
  cadastrarAssistente: {
    path: '/cadastro-assistente',
    label: 'Cadastrar Assistente', 
    icon: <UserPlus className="w-6 h-6" color="#ED4231" />,
  },
  perfil: {
    path: '/profile-form-assistente-social',
    label: 'Meu Perfil',
    icon: <User className="w-6 h-6" color="#ED4231" />,
  }
};
