import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, User, Clock, Menu, History, Calendar, Sun, Moon, Home as HomeIcon, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfileImage } from "@/components/useProfileImage";
import { userNavigationItems } from "@/utils/userNavigation";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { getUserNavigationPath } from "@/utils/userNavigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCep } from "@/hooks/useCep";
import { useUserData } from "@/hooks/useUserData";

const ProfileFormUser = () => {
  const location = useLocation();
  const navigate = useNavigate();  
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profileImage, setProfileImage } = useProfileImage();
  const { theme, toggleTheme } = useThemeToggleWithNotification();
  const { fetchAddressByCep, loading: loadingCep, formatCep } = useCep();
  
  // Get user data and setter from the hook
  const { userData, setUserData } = useUserData();
  
  // Adicionando estado para feedback visual de validação
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [formChanged, setFormChanged] = useState(false);

  // Estado para o formulário
  const [formData, setFormData] = useState(userData);

  // Estado para a imagem selecionada
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Update form data when userData changes (sync across tabs)
  useEffect(() => {
    if (!formChanged && userData) {
      // Garantir que endereco existe antes de definir formData
      const safeUserData = {
        ...userData,
        endereco: {
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          ...userData.endereco, // Mesclar com dados existentes se houver
        }
      };
      setFormData(safeUserData);
    }
  }, [userData, formChanged]);

  // Função para lidar com a mudança nos campos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormChanged(true);
    const { name, value } = e.target;
    
    // Formatação específica para o CEP
    if (name === "endereco.cep") {
      const formattedCep = formatCep(value);
      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          cep: formattedCep
        }
      });
      return;
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Função para lidar com a seleção da imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para validar o formulário antes de salvar
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validação básica de campos obrigatórios
    if (!formData.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!formData.sobrenome.trim()) errors.sobrenome = "Sobrenome é obrigatório";
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Email inválido";
    }
    
    // Validação de telefone (formato brasileiro)
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (formData.telefone && !phoneRegex.test(formData.telefone)) {
      errors.telefone = "Formato de telefone inválido. Ex: (11) 98765-4321";
    }
    
    // Validação de data de nascimento
    if (formData.dataNascimento) {
      const birthDate = new Date(formData.dataNascimento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 16 || age > 120) {
        errors.dataNascimento = "Data de nascimento inválida";
      }
    }
    
    // Validação de CEP (formato brasileiro)
    const cepRegex = /^\d{5}-\d{3}$/;
    if (formData.endereco.cep && !cepRegex.test(formData.endereco.cep)) {
      errors["endereco.cep"] = "Formato de CEP inválido. Ex: 12345-678";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar as alterações
  const handleSave = () => {
    // If no changes were made, just provide feedback
    if (!formChanged && !selectedImage) {
      toast({
        title: "Nenhuma alteração detectada",
        description: "Altere algum campo para salvar",
        variant: "default"
      });
      return;
    }
    
    // Validate the form before saving
    if (!validateForm()) {
      toast({
        title: "Formulário com erros",
        description: "Corrija os erros antes de salvar",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulating an API call
    setTimeout(() => {
      try {
        // Use the setUserData function from the hook instead of directly setting localStorage
        setUserData(formData);
        
        // If there's a new image, update it
        if (selectedImage && imagePreview) {
          setProfileImage(imagePreview);
        }
        
        // Success feedback
        setSuccessMessage("Perfil atualizado com sucesso!");
        setFormChanged(false);
        
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram atualizadas com sucesso!",
        });
        
        // Hide success message after a few seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar suas informações.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }, 1500);
  };
  
  // Função para buscar endereço pelo CEP
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    if (!cep || cep.length < 8) return;
    
    const endereco = await fetchAddressByCep(cep);
    if (endereco) {
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          rua: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.localidade,
          estado: endereco.uf,
          cep: endereco.cep
        }
      }));
      setFormChanged(true);
      
      toast({
        title: "Endereço encontrado",
        description: "Os campos foram preenchidos automaticamente.",
      });
    }
  };
  
  // Função para descartar alterações
  const handleCancel = () => {
    // Recarregando dados originais do localStorage
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
    
    // Resetando estados
    setSelectedImage(null);
    setImagePreview(null);
    setFormChanged(false);
    setValidationErrors({});
    
    toast({
      title: "Alterações descartadas",
      description: "Suas alterações foram descartadas com sucesso.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans text-base">
        {!sidebarOpen && (
          <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-[#23272F]/90 shadow-md backdrop-blur-md">
            <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md" aria-label="Abrir menu lateral" tabIndex={0} title="Abrir menu lateral">
              <Menu className="w-7 h-7" />
            </Button>
            <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow" />
            <span className="font-bold text-indigo-900 dark:text-gray-100">{formData.nome} {formData.sobrenome}</span>
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
            <img src={profileImage} alt="Foto de perfil" className="w-16 h-16 rounded-full border-4 border-[#EDF2FB] shadow" />
            <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">{formData.nome} {formData.sobrenome}</span>
          </div>
          
          <SidebarMenu className="gap-4 text-sm md:text-base">
            {/* Utilizando os itens de navegação do userNavigationItems */}
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
            
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3">
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
          <header className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-white/90 dark:bg-[#23272F]/95 shadow-md fixed top-0 left-0 z-20 backdrop-blur-md transition-colors duration-300 border-b border-[#EDF2FB] dark:border-[#23272F]" role="banner" aria-label="Cabeçalho">
            <div className="flex items-center gap-3">
              <img src={profileImage} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#ED4231] shadow hover:scale-105 transition-transform duration-200" />
              <span className="font-bold text-indigo-900 dark:text-gray-100">{formData.nome} {formData.sobrenome}</span>
            </div>
            <div className="flex items-center gap-3">              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-[#ED4231] focus:outline-none"
                    aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div className="max-w-6xl mx-auto p-4 md:p-8 pt-24 md:pt-10">
            {/* Breadcrumb navigation */}
            {getUserNavigationPath(location.pathname)}

            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => navigate("/home-user")} 
                      variant="ghost" 
                      className="p-2 rounded-full"
                      aria-label="Voltar"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Voltar para página inicial</p>
                  </TooltipContent>
                </Tooltip>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100">Editar Perfil</h1>
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    Atualize suas informações pessoais
                  </p>
                </div>
              </div>
              
              <Tabs defaultValue="pessoal" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="foto">Foto de Perfil</TabsTrigger>
                </TabsList>
                
                {/* Aba de Dados Pessoais */}
                <TabsContent value="pessoal">
                  <Card className="w-full bg-white dark:bg-[#23272F] border border-[#EDF2FB] dark:border-gray-700 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-indigo-900 dark:text-gray-100">
                        Dados Pessoais
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Atualize suas informações pessoais
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {loading && (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED4231]"></div>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados...</span>
                        </div>
                      )}
                      
                      {!loading && (
                        <>
                          {/* Nome e Sobrenome */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nome" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nome *
                              </Label>
                              <Input
                                id="nome"
                                name="nome"
                                type="text"
                                value={formData.nome}
                                onChange={handleInputChange}
                                className={`w-full ${validationErrors.nome ? 'border-red-500' : ''}`}
                                placeholder="Digite seu nome"
                              />
                              {validationErrors.nome && (
                                <span className="text-sm text-red-500">{validationErrors.nome}</span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="sobrenome" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sobrenome *
                              </Label>
                              <Input
                                id="sobrenome"
                                name="sobrenome"
                                type="text"
                                value={formData.sobrenome}
                                onChange={handleInputChange}
                                className={`w-full ${validationErrors.sobrenome ? 'border-red-500' : ''}`}
                                placeholder="Digite seu sobrenome"
                              />
                              {validationErrors.sobrenome && (
                                <span className="text-sm text-red-500">{validationErrors.sobrenome}</span>
                              )}
                            </div>
                          </div>

                          {/* Email */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              E-mail *
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                              placeholder="Digite seu e-mail"
                            />
                            {validationErrors.email && (
                              <span className="text-sm text-red-500">{validationErrors.email}</span>
                            )}
                          </div>

                          {/* Telefone */}
                          <div className="space-y-2">
                            <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Telefone
                            </Label>
                            <Input
                              id="telefone"
                              name="telefone"
                              type="tel"
                              value={formData.telefone}
                              onChange={handleInputChange}
                              className={`w-full ${validationErrors.telefone ? 'border-red-500' : ''}`}
                              placeholder="(11) 98765-4321"
                            />
                            {validationErrors.telefone && (
                              <span className="text-sm text-red-500">{validationErrors.telefone}</span>
                            )}
                          </div>

                          {/* Data de Nascimento e Gênero */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="dataNascimento" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Data de Nascimento
                              </Label>
                              <Input
                                id="dataNascimento"
                                name="dataNascimento"
                                type="date"
                                value={formData.dataNascimento}
                                onChange={handleInputChange}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="genero" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Gênero
                              </Label>
                              <select
                                id="genero"
                                name="genero"
                                value={formData.genero}
                                onChange={(e) => handleInputChange(e as any)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED4231] bg-white dark:bg-[#23272F] text-gray-900 dark:text-gray-100"
                              >
                                <option value="OUTRO">Prefiro não informar</option>
                                <option value="FEMININO">Feminino</option>
                                <option value="MASCULINO">Masculino</option>
                              </select>
                            </div>
                          </div>

                          {/* Botões de ação */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                              onClick={handleSave}
                              disabled={loading}
                              className="flex-1 bg-[#ED4231] hover:bg-[#ED4231]/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Salvando...
                                </>
                              ) : (
                                'Salvar Alterações'
                              )}
                            </Button>
                            
                            <Button
                              onClick={handleCancel}
                              disabled={loading}
                              variant="outline"
                              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                              Cancelar
                            </Button>
                          </div>

                          {/* Mensagem de sucesso */}
                          {successMessage && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
                              {successMessage}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Aba de Endereço */}
                <TabsContent value="endereco">
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                    <CardHeader>
                      <CardTitle>Endereço</CardTitle>
                      <CardDescription>Atualize seu endereço</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="rua">Rua</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input 
                                id="rua" 
                                name="endereco.rua" 
                                value={formData.endereco.rua} 
                                onChange={handleInputChange}
                                className="bg-white dark:bg-gray-800"
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Nome da rua, avenida ou logradouro</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número</Label>
                          <Input 
                            id="numero" 
                            name="endereco.numero" 
                            value={formData.endereco.numero} 
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input 
                          id="complemento" 
                          name="endereco.complemento" 
                          value={formData.endereco.complemento} 
                          onChange={handleInputChange}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input 
                          id="bairro" 
                          name="endereco.bairro" 
                          value={formData.endereco.bairro} 
                          onChange={handleInputChange}
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input 
                            id="cidade" 
                            name="endereco.cidade" 
                            value={formData.endereco.cidade} 
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input 
                            id="estado" 
                            name="endereco.estado" 
                            value={formData.endereco.estado} 
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <div className="relative">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Input 
                                  id="cep" 
                                  name="endereco.cep" 
                                  value={formData.endereco.cep} 
                                  onChange={handleInputChange}
                                  onBlur={handleCepBlur}
                                  placeholder="00000-000"
                                  maxLength={9}
                                  className="bg-white dark:bg-gray-800"
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Formato: 00000-000 (preenchimento automático ao sair do campo)</p>
                              </TooltipContent>
                            </Tooltip>
                            {loadingCep && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin h-4 w-4 border-2 border-[#ED4231] border-t-transparent rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Digite o CEP para preencher o endereço automaticamente</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleSave} disabled={loading} className="ml-auto bg-[#ED4231] hover:bg-[#d53a2a]">
                            {loading ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Salvar alterações feitas no endereço</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Aba de Foto de Perfil */}
                <TabsContent value="foto">
                  <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                    <CardHeader>
                      <CardTitle>Foto de Perfil</CardTitle>
                      <CardDescription>Atualize sua foto de perfil</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#EDF2FB] dark:border-[#23272F] shadow-lg">
                          <img 
                            src={imagePreview || profileImage} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label 
                                htmlFor="photo-upload"
                                className="cursor-pointer flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Escolher Foto
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Clique para selecionar uma nova foto de perfil</p>
                            </TooltipContent>
                          </Tooltip>
                          <Input 
                            id="photo-upload" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Formatos suportados: JPG, PNG, GIF<br/>
                            Tamanho máximo: 5MB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleSave} disabled={loading || !selectedImage} className="ml-auto bg-[#ED4231] hover:bg-[#d53a2a]">
                            {loading ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Salvar a nova foto de perfil</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProfileFormUser;