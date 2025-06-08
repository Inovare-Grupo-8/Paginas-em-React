import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Menu, User } from "lucide-react";
import { useProfileImage } from "@/components/useProfileImage";
import { Link, useLocation } from "react-router-dom";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

const navLinks = [
  { to: "/agenda", label: "Agenda" },
  { to: "/disponibilizar-horario", label: "Disponibilizar Horário" },
  { to: "/profile-form", label: "Perfil" },
];

const Header = ({ nome = "Usuário", sobrenome = "", onLogout }: { nome?: string; sobrenome?: string; onLogout?: () => void }) => {
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const { profileImage } = useProfileImage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="w-full bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-30 backdrop-blur-md border-b border-[#EDF2FB] dark:border-[#23272F]">
      <nav aria-label="Navegação principal" className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
        {/* Menu hambúrguer mobile */}
        <button
          className="md:hidden p-2 rounded-full bg-[#ED4231] text-white focus:outline-none focus:ring-2 focus:ring-[#ED4231] mr-2"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-nav"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <Menu className="w-6 h-6" />
        </button>        {/* Logo e nome do usuário */}
        <div className="flex items-center gap-2 md:gap-3">
          <ProfileAvatar 
            profileImage={profileImage}
            name={`${nome} ${sobrenome}`.trim()}
            size="w-9 h-9 md:w-10 md:h-10"
            className="border-2 border-[#ED4231] shadow"
          />
          <span className="font-bold text-indigo-900 dark:text-gray-100 text-sm md:text-base truncate max-w-[120px] md:max-w-none" tabIndex={0}>
            {nome} {sobrenome}
          </span>
        </div>
        {/* Navegação desktop */}
        <ul id="main-nav" className="hidden md:flex items-center gap-6 ml-8" role="menubar">
          {navLinks.map((link) => (
            <li key={link.to} role="none">
              <Link
                to={link.to}
                className={`px-3 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#ED4231] ${location.pathname === link.to ? "bg-[#ED4231] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-[#ED4231]/20"}`}
                role="menuitem"
                tabIndex={0}
                aria-current={location.pathname === link.to ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Ações rápidas e menu do usuário */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto relative">          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            tabIndex={0}
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
          </button>
          {/* Menu do usuário */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
              aria-label="Abrir menu do usuário"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((v) => !v)}
              tabIndex={0}
            >
              <User className="w-5 h-5 text-[#ED4231]" />
            </button>
            {userMenuOpen && (
              <ul className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#23272F] rounded-lg shadow-lg border border-gray-200 dark:border-[#444857] z-50 animate-fade-in" role="menu">
                <li>
                  <Link to="/profile-form" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 rounded-t-lg" role="menuitem" tabIndex={0} onClick={() => setUserMenuOpen(false)}>
                    Meu Perfil
                  </Link>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 rounded-b-lg" role="menuitem" tabIndex={0} onClick={() => { setUserMenuOpen(false); if (onLogout) onLogout(); }}>
                    Sair
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
      {/* Navegação mobile */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white dark:bg-[#23272F] border-t border-[#EDF2FB] dark:border-[#23272F] animate-fade-in" aria-label="Menu mobile">
          <ul className="flex flex-col gap-1 py-2" role="menubar">
            {navLinks.map((link) => (
              <li key={link.to} role="none">
                <Link
                  to={link.to}
                  className={`block px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#ED4231] ${location.pathname === link.to ? "bg-[#ED4231] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-[#ED4231]/20"}`}
                  role="menuitem"
                  tabIndex={0}
                  aria-current={location.pathname === link.to ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
