import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, User, Clock, Menu, History, Calendar, Sun, Moon, Home as HomeIcon, CreditCard, Shield, Check, AlertCircle, Banknote, QrCode, Smartphone, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { userNavigationItems } from "@/utils/userNavigation";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { getUserNavigationPath } from "@/utils/userNavigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUserData } from "@/hooks/useUserData";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

interface PaymentData {
  paymentMethod: "cartao" | "pix" | "boleto" | "";
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCVV: string;
  pixKey: string;
  installments: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  professional: string;
  category: string;
}

// Dados simulados dos serviços - agora será carregado dinamicamente
const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "1",
    name: "Consulta Psicológica Individual",
    description: "Atendimento psicológico personalizado",
    price: 120.00,
    duration: "50 min",
    professional: "Dra. Maria Silva",
    category: "Psicologia"
  },
  {
    id: "2", 
    name: "Atendimento Social",
    description: "Orientação e suporte social",
    price: 80.00,
    duration: "45 min",
    professional: "João Santos",
    category: "Serviço Social"
  },
  {
    id: "3",
    name: "Terapia em Grupo",
    description: "Sessão de terapia coletiva",
    price: 60.00,
    duration: "90 min",
    professional: "Dr. Carlos Lima",
    category: "Psicologia"
  }
];

const PagamentoUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const { userData } = useUserData();

  // Estados do formulário de pagamento
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
    pixKey: "",
    installments: "1"
  });
  // Estados da interface - com loading states mais específicos
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingState, setLoadingState] = useState<{
    type: 'initial' | 'services' | 'payment' | 'validation' | '';
    message: string;
  }>({ type: 'initial', message: 'Carregando dados...' });
  const [isMobile, setIsMobile] = useState(false);  useEffect(() => {
    // Load data without simulated delays
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Load selected services from session/state
        const savedServices = localStorage.getItem('selectedServices');
        if (savedServices) {
          setSelectedServices(JSON.parse(savedServices));
        }
        
      } catch (error) {
        console.error('Error loading payment data:', error);
      } finally {
        setLoading(false);
        setLoadingState({ type: '', message: '' });
      }
    };
    
    // Detect if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    loadData();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calcular total
  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  // Calcular desconto (exemplo: 10% para mais de 1 serviço)
  const calculateDiscount = () => {
    return selectedServices.length > 1 ? calculateTotal() * 0.1 : 0;
  };

  // Total final
  const finalTotal = calculateTotal() - calculateDiscount();

  // Validação de campos
  const validateField = (field: string, value: string) => {
    let error = "";
    
    switch (field) {
      case "cardNumber":
        if (value && !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(value)) {
          error = "Formato: 1234 5678 9012 3456";
        }
        break;
      case "cardName":
        if (value && value.trim().length < 2) {
          error = "Nome deve ter pelo menos 2 caracteres";
        }
        break;
      case "cardExpiry":
        if (value && !/^\d{2}\/\d{2}$/.test(value)) {
          error = "Formato: MM/AA";
        }
        break;
      case "cardCVV":
        if (value && !/^\d{3,4}$/.test(value)) {
          error = "CVV deve ter 3 ou 4 dígitos";
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Formatação de cartão
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19);
  };

  // Formatação de data de expiração
  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  // Handler para mudanças nos campos
  const handleFieldChange = (field: keyof PaymentData, value: string) => {
    let formattedValue = value;
    
    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "cardExpiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cardCVV") {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setPaymentData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Validar após pequeno delay
    setTimeout(() => {
      validateField(field, formattedValue);
    }, 300);
  };

  // Validar formulário completo
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!paymentData.paymentMethod) {
      errors.push("Selecione um método de pagamento");
    }
    
    if (paymentData.paymentMethod === "cartao") {
      if (!paymentData.cardNumber) errors.push("Número do cartão é obrigatório");
      if (!paymentData.cardName) errors.push("Nome no cartão é obrigatório");
      if (!paymentData.cardExpiry) errors.push("Data de expiração é obrigatória");
      if (!paymentData.cardCVV) errors.push("CVV é obrigatório");
    }
    
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors[0],
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };  // Processar pagamento
  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // Etapa 1: Validando dados do pagamento
      setLoadingState({ type: 'validation', message: 'Validando dados do pagamento...' });
      
      // Etapa 2: Processando pagamento específico por método
      let paymentMessage = '';
      switch (paymentData.paymentMethod) {
        case 'cartao':
          paymentMessage = 'Processando pagamento no cartão...';
          break;
        case 'pix':
          paymentMessage = 'Gerando código PIX...';
          break;
        case 'boleto':
          paymentMessage = 'Gerando boleto bancário...';
          break;
        default:
          paymentMessage = 'Processando pagamento...';
      }
      setLoadingState({ type: 'payment', message: paymentMessage });
      
      // Real API call to process payment
      const paymentPayload = {
        services: selectedServices,
        total: finalTotal,
        method: paymentData.paymentMethod,        cardData: paymentData.paymentMethod === 'cartao' ? {
          number: paymentData.cardNumber,
          holder: paymentData.cardName,
          expiry: paymentData.cardExpiry,
          cvv: paymentData.cardCVV
        } : null
      };

      const response = await fetch('http://localhost:8080/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const result = await response.json();
      
      // Etapa 3: Finalizando transação
      setLoadingState({ type: 'validation', message: 'Finalizando transação...' });
      
      // Salvar dados do pagamento
      const paymentRecord = {
        id: result.id || `pay_${Date.now()}`,
        services: selectedServices,
        total: finalTotal,
        method: paymentData.paymentMethod,
        date: new Date(),
        status: result.status || "aprovado"
      };
      
      localStorage.setItem('lastPayment', JSON.stringify(paymentRecord));
      localStorage.removeItem('selectedServices');
      
      setShowSuccessModal(true);
      
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Valor de R$ ${finalTotal.toFixed(2)} processado.`,
        variant: "default",
      });
      
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setLoadingState({ type: '', message: '' });
    }
  };

  // Gerar chave PIX simulada
  const generatePixKey = () => {
    const keys = [
      userData?.email || "usuario@email.com",
      userData?.telefone || "+55 11 99999-9999",
      "123.456.789-01"
    ];
    return keys[Math.floor(Math.random() * keys.length)];
  };
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#EDF2FB] dark:bg-gray-900 px-4">
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          {/* Loading spinner com ícone específico */}
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ED4231]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {loadingState.type === 'initial' && <CreditCard className="w-6 h-6 text-[#ED4231]" />}
              {loadingState.type === 'services' && <Calendar className="w-6 h-6 text-[#ED4231]" />}
              {loadingState.type === 'payment' && <Shield className="w-6 h-6 text-[#ED4231]" />}
              {loadingState.type === 'validation' && <Check className="w-6 h-6 text-[#ED4231]" />}
            </div>
          </div>
          
          {/* Mensagem de loading específica */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {loadingState.message}
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-[#ED4231] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#ED4231] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#ED4231] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Etapas do processo */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 ${loadingState.type === 'initial' ? 'text-[#ED4231] font-medium' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${loadingState.type === 'initial' ? 'bg-[#ED4231]' : 'bg-gray-300'}`}></div>
                Inicializando
              </span>
              {loadingState.type !== 'initial' && <Check className="w-4 h-4 text-green-500" />}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 ${loadingState.type === 'services' ? 'text-[#ED4231] font-medium' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${loadingState.type === 'services' ? 'bg-[#ED4231]' : 'bg-gray-300'}`}></div>
                Carregando serviços
              </span>
              {(loadingState.type === 'validation' || loadingState.type === '') && <Check className="w-4 h-4 text-green-500" />}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 ${loadingState.type === 'validation' ? 'text-[#ED4231] font-medium' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${loadingState.type === 'validation' ? 'bg-[#ED4231]' : 'bg-gray-300'}`}></div>
                Validando
              </span>
              {loadingState.type === '' && <Check className="w-4 h-4 text-green-500" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gray-900">
        {/* Mobile backdrop overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar comprimida para mobile */}
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-gray-900/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData?.nome || 'User'}
              size="w-10 h-10"
              className="border-2 border-[#ED4231] shadow"
            />
            <span className="font-bold text-indigo-900 dark:text-gray-100">{userData?.nome} {userData?.sobrenome}</span>
          </div>
        )}
          {/* Sidebar */}
        <div className={`transition-all duration-500 ease-in-out
          ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full w-0'}
          ${isMobile 
            ? 'fixed top-0 left-0 w-full h-full z-50 bg-white dark:bg-[#23272F]' 
            : 'w-4/5 max-w-xs md:w-72 static bg-gradient-to-b from-white via-[#f8fafc] to-[#EDF2FB] dark:from-[#23272F] dark:via-[#23272F] dark:to-[#181A20] h-auto'
          }
          shadow-2xl rounded-2xl p-6 flex flex-col gap-6 overflow-hidden
          border-r border-[#EDF2FB] dark:border-[#23272F] backdrop-blur-[2px] text-sm md:text-base`
        }>          <div className="w-full flex justify-start mb-6">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
              <Menu className="w-7 h-7" />
            </Button>
            {isMobile && (
              <span className="ml-3 font-semibold text-indigo-900 dark:text-gray-100 self-center">Menu</span>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-2 mb-8">
            <ProfileAvatar 
              profileImage={profileImage}
              name={userData?.nome || 'User'}
              size="w-16 h-16"
              className="border-4 border-[#EDF2FB] shadow"
            />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">
              {userData?.nome} {userData?.sobrenome}
            </span>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              Usuário
            </Badge>
          </div>
            <SidebarMenu className="gap-4 text-sm md:text-base">
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
          </SidebarMenu>
          
          <div className="mt-auto flex flex-col gap-2 text-xs text-gray-400 items-center pt-6 border-t border-[#EDF2FB] dark:border-[#23272F]">
            <span>&copy; {new Date().getFullYear()} Desenvolvido por Inovare</span>
            <div className="flex gap-2">
              <a href="https://inovare.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#ED4231]">Site</a>
              <a href="mailto:contato@inovare.com" className="underline hover:text-[#ED4231]">Contato</a>
            </div>
          </div>
        </div>        {/* Conteúdo principal */}
        <main className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out px-2 md:px-0 ${sidebarOpen ? '' : 'ml-0'}`}>
          {/* Header */}
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]">
            <div className="flex items-center gap-3">
              {isMobile && !sidebarOpen && (
                <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <ProfileAvatar 
                profileImage={profileImage}
                name={userData?.nome || 'User'}
                size="w-10 h-10"
                className="border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200"
              />
              <span className={`font-bold text-indigo-900 dark:text-gray-100 ${isMobile ? 'text-sm' : ''}`}>
                {isMobile ? userData?.nome : `${userData?.nome} ${userData?.sobrenome}`}
              </span>
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
          </header>          <div className={`max-w-6xl mx-auto p-2 sm:p-4 md:p-8 ${isMobile ? 'pt-20' : 'pt-24 sm:pt-28 md:pt-24'}`}>
            <div className="flex flex-col">
              {/* Breadcrumb navigation */}
              {!isMobile && getUserNavigationPath(location.pathname)}
                <div className="flex items-center gap-4 mb-6">
                <Button 
                  onClick={() => navigate("/home-user")} 
                  variant="ghost" 
                  size={isMobile ? "sm" : "default"}
                  className="p-2 rounded-full"
                  aria-label="Voltar para o início"
                >
                  <HomeIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </Button>
                <div>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-bold text-indigo-900 dark:text-gray-100 mb-2`}>
                    {isMobile ? 'Pagamento' : 'Pagamento de Serviços'}
                  </h1>
                  <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
                    {isMobile ? 'Finalize seu pagamento' : 'Finalize o pagamento dos seus serviços selecionados'}
                  </p>
                </div>
              </div><div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
                {/* Resumo do pedido */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`${isMobile ? 'order-1' : 'lg:col-span-1 order-2 lg:order-1'}`}
                >
                  <Card className={`bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857] ${isMobile ? '' : 'sticky top-6'}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#ED4231]" />
                        Resumo do Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">                      {/* Serviços selecionados */}
                      {selectedServices.map((service) => (
                        <div key={service.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0">
                          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-start'}`}>
                            <div className="flex-1">
                              <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm' : ''}`}>{service.name}</h4>
                              <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>{service.professional}</p>
                              <p className={`text-gray-400 dark:text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>{service.duration}</p>
                            </div>
                            <span className={`font-semibold text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm self-end' : ''}`}>
                              R$ {service.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      {/* Cálculos */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                          <span className="text-gray-900 dark:text-gray-100">R$ {calculateTotal().toFixed(2)}</span>
                        </div>
                        {calculateDiscount() > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Desconto</span>
                            <span className="text-green-600">-R$ {calculateDiscount().toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span className="text-gray-900 dark:text-gray-100">Total</span>
                          <span className="text-[#ED4231]">R$ {finalTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Badge de segurança */}
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">Pagamento 100% seguro</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>                {/* Formulário de pagamento */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`${isMobile ? 'order-2' : 'lg:col-span-2 order-1 lg:order-2'}`}
                >
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-[#ED4231]" />
                        Método de Pagamento
                      </CardTitle>
                      <CardDescription>
                        Escolha como deseja realizar o pagamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">                      {/* Seleção de método de pagamento */}
                      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <label className={`cursor-pointer block p-4 border-2 rounded-lg transition-all ${
                            paymentData.paymentMethod === "cartao" 
                              ? "border-[#ED4231] bg-[#ED4231]/5" 
                              : "border-gray-200 dark:border-gray-700 hover:border-[#ED4231]/50"
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cartao"
                              checked={paymentData.paymentMethod === "cartao"}
                              onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">Cartão</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Débito ou Crédito</p>
                            </div>
                          </label>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <label className={`cursor-pointer block p-4 border-2 rounded-lg transition-all ${
                            paymentData.paymentMethod === "pix" 
                              ? "border-[#ED4231] bg-[#ED4231]/5" 
                              : "border-gray-200 dark:border-gray-700 hover:border-[#ED4231]/50"
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="pix"
                              checked={paymentData.paymentMethod === "pix"}
                              onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <QrCode className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">PIX</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Instantâneo</p>
                            </div>
                          </label>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <label className={`cursor-pointer block p-4 border-2 rounded-lg transition-all ${
                            paymentData.paymentMethod === "boleto" 
                              ? "border-[#ED4231] bg-[#ED4231]/5" 
                              : "border-gray-200 dark:border-gray-700 hover:border-[#ED4231]/50"
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="boleto"
                              checked={paymentData.paymentMethod === "boleto"}
                              onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                              className="sr-only"
                            />
                            <div className="text-center">
                              <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">Boleto</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Até 3 dias úteis</p>
                            </div>
                          </label>
                        </motion.div>
                      </div>

                      {/* Formulário específico do método selecionado */}
                      {paymentData.paymentMethod === "cartao" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >                          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
                            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-2'}`}>
                              <Label htmlFor="cardNumber">Número do Cartão *</Label>
                              <Input
                                id="cardNumber"
                                type="text"
                                value={paymentData.cardNumber}
                                onChange={(e) => handleFieldChange("cardNumber", e.target.value)}
                                placeholder="1234 5678 9012 3456"
                                className={`mt-1 ${fieldErrors.cardNumber ? 'border-red-500' : ''}`}
                                maxLength={19}
                              />
                              {fieldErrors.cardNumber && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.cardNumber}
                                </p>
                              )}
                            </div>                            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-2'}`}>
                              <Label htmlFor="cardName">Nome no Cartão *</Label>
                              <Input
                                id="cardName"
                                type="text"
                                value={paymentData.cardName}
                                onChange={(e) => handleFieldChange("cardName", e.target.value.toUpperCase())}
                                placeholder="NOME COMPLETO"
                                className={`mt-1 ${fieldErrors.cardName ? 'border-red-500' : ''}`}
                              />
                              {fieldErrors.cardName && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.cardName}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="cardExpiry">Validade *</Label>
                              <Input
                                id="cardExpiry"
                                type="text"
                                value={paymentData.cardExpiry}
                                onChange={(e) => handleFieldChange("cardExpiry", e.target.value)}
                                placeholder="MM/AA"
                                className={`mt-1 ${fieldErrors.cardExpiry ? 'border-red-500' : ''}`}
                                maxLength={5}
                              />
                              {fieldErrors.cardExpiry && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.cardExpiry}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="cardCVV">CVV *</Label>
                              <Input
                                id="cardCVV"
                                type="text"
                                value={paymentData.cardCVV}
                                onChange={(e) => handleFieldChange("cardCVV", e.target.value)}
                                placeholder="123"
                                className={`mt-1 ${fieldErrors.cardCVV ? 'border-red-500' : ''}`}
                                maxLength={4}
                              />
                              {fieldErrors.cardCVV && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fieldErrors.cardCVV}
                                </p>
                              )}
                            </div>                            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-2'}`}>
                              <Label htmlFor="installments">Parcelas</Label>
                              <Select value={paymentData.installments} onValueChange={(value) => handleFieldChange("installments", value)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1x de R$ {finalTotal.toFixed(2)} (à vista)</SelectItem>
                                  <SelectItem value="2">2x de R$ {(finalTotal / 2).toFixed(2)}</SelectItem>
                                  <SelectItem value="3">3x de R$ {(finalTotal / 3).toFixed(2)}</SelectItem>
                                  <SelectItem value="4">4x de R$ {(finalTotal / 4).toFixed(2)}</SelectItem>
                                  <SelectItem value="5">5x de R$ {(finalTotal / 5).toFixed(2)}</SelectItem>
                                  <SelectItem value="6">6x de R$ {(finalTotal / 6).toFixed(2)}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentData.paymentMethod === "pix" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <QrCode className="w-24 h-24 mx-auto mb-4 text-[#ED4231]" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              R$ {finalTotal.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Escaneie o QR Code ou use a chave PIX
                            </p>
                            <div className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                {generatePixKey()}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Pagamento confirmado automaticamente
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {paymentData.paymentMethod === "boleto" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <span className="font-medium text-yellow-800 dark:text-yellow-400">Atenção</span>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              O boleto será gerado após a confirmação e enviado por email. 
                              O pagamento pode levar até 3 dias úteis para ser processado.
                            </p>
                          </div>
                        </motion.div>
                      )}                      {/* Botão de pagamento */}
                      <div className="pt-4">
                        <Button
                          onClick={handlePayment}
                          disabled={!paymentData.paymentMethod || isProcessing}
                          className="w-full bg-[#ED4231] hover:bg-[#D63626] text-white h-12 text-lg font-semibold"
                        >
                          {isProcessing ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span className="hidden sm:inline">
                                  {loadingState.message || 'Processando...'}
                                </span>
                                <span className="sm:hidden">Processando...</span>
                              </div>
                              {isMobile && loadingState.message && (
                                <span className="text-xs opacity-80 truncate max-w-full">
                                  {loadingState.message}
                                </span>
                              )}
                            </div>
                          ) : (
                            `Pagar R$ ${finalTotal.toFixed(2)}`
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>        {/* Modal de Sucesso */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className={`${isMobile ? 'w-[95vw] max-w-md' : ''}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                <Check className="w-6 h-6 text-green-500" />
                Pagamento Aprovado!
              </DialogTitle>
              <DialogDescription className={isMobile ? 'text-sm' : ''}>
                Seu pagamento foi processado com sucesso.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                  Pagamento Confirmado
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Valor: R$ {finalTotal.toFixed(2)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Você receberá um email de confirmação em breve.
                </p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Próximos passos:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Verifique seu email para mais detalhes</li>
                  <li>Aguarde o contato do profissional</li>
                  <li>Acesse "Minhas Consultas" para acompanhar</li>
                </ul>
              </div>
            </div>
              <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
              <Button variant="outline" onClick={() => navigate("/consultas-user")} className={isMobile ? 'w-full' : ''}>
                Ver Consultas
              </Button>
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/home-user");
                }}
                className={`bg-[#ED4231] hover:bg-[#D63626] text-white ${isMobile ? 'w-full' : ''}`}
              >
                Voltar ao Início
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default PagamentoUser;
