import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { ArrowLeft, Menu, Home, UserCheck, UserPlus, User } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCep } from "@/hooks/useCep";
import { AssistenteSocialInput, useAssistenteSocial } from '@/hooks/useAssistenteSocial';
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useProfileImage } from "@/components/useProfileImage";
import { useThemeToggleWithNotification } from "@/hooks/useThemeToggleWithNotification";
import { useUserData } from "@/hooks/useUserData";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

interface NovoAssistenteSocialData {
    nome: string;
    sobrenome: string;
    email: string;
    senha: string;
    cpf: string;
    dataNascimento: string;
    genero: string;
    renda: number;
    tipo: 'ADMINISTRADOR' | 'USUARIO' | 'VOLUNTARIO';
    funcao: 'ASSISTENCIA_SOCIAL';
    profissao: string;
    telefone: {
        ddd: string;
        numero: string;
    };
    endereco: {
        cep: string;
        numero: string;
        complemento?: string;
    };
    voluntario: {
        crp: string;
        especialidade: string;
        telefone: string;
        bio: string;
        endereco: {
            cep: string;
            numero: string;
            complemento?: string;
        };
    };
    confirmarSenha?: string;
}

const formatCep = (cep: string) => {
    // Remove any non-digit characters
    const digits = cep.replace(/\D/g, '');
    // Format as XXXXX-XXX
    return digits.replace(/^(\d{5})(\d{3}).*/, '$1-$2');
};

const formatCpf = (cpf: string) => {
    // Remove any non-digit characters
    const digits = cpf.replace(/\D/g, '');
    // Format as XXX.XXX.XXX-XX
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
};

const formatTelefone = (telefone: string) => {
    // Remove any non-digit characters
    const digits = telefone.replace(/\D/g, '');
    // Format based on length (9 digits = XXXXX-XXXX, 8 digits = XXXX-XXXX)
    if (digits.length === 9) {
        return digits.replace(/^(\d{5})(\d{4}).*/, '$1-$2');
    } else if (digits.length === 8) {
        return digits.replace(/^(\d{4})(\d{4}).*/, '$1-$2');
    }
    return digits;
};

export default function CadastroAssistenteSocial() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { fetchAddressByCep } = useCep();
    const { profileImage } = useProfileImage();
    const { theme, toggleTheme } = useThemeToggleWithNotification();
    const { userData } = useUserData();
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchPerfil } = useAssistenteSocial();
    
    const [assistenteSocialData, setAssistenteSocialData] = useState({
        idUsuario: 0,
        nome: '',
        sobrenome: '',
        crp: '',
        especialidade: '',
        telefone: '',
        email: '',
        fotoUrl: '',
        endereco: {
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
        }
    });
    
    // Load assistente social data
    useEffect(() => {
        const carregarPerfil = async () => {
            try {
                // Load profile data
                const dados = await fetchPerfil();
                
                // Update state with received data
                setAssistenteSocialData({
                    idUsuario: dados.idUsuario || 0,
                    nome: dados.nome || '',
                    sobrenome: dados.sobrenome || '',
                    crp: dados.crp || '',
                    especialidade: dados.especialidade || '',
                    telefone: dados.telefone || '',
                    email: dados.email || '',
                    fotoUrl: dados.fotoUrl || '',
                    endereco: dados.endereco || {
                        rua: '',
                        numero: '',
                        complemento: '',
                        bairro: '',
                        cidade: '',
                        estado: '',
                        cep: ''
                    }
                });
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };
        
        carregarPerfil();
    }, []);

    const [formData, setFormData] = useState<NovoAssistenteSocialData>({
        nome: '',
        sobrenome: '',
        email: '',
        senha: '',        confirmarSenha: '',
        cpf: '',
        dataNascimento: '',
        genero: '',
        renda: 0,        
        tipo: 'ADMINISTRADOR', 
        funcao: 'ASSISTENCIA_SOCIAL',
        profissao: '',
        telefone: {
            ddd: '',
            numero: ''
        },
        endereco: {
            cep: '',
            numero: '',
            complemento: ''
        },
        voluntario: {
            crp: '',
            especialidade: '',
            telefone: '',
            bio: '',
            endereco: {
                cep: '',
                numero: '',
                complemento: ''
            }
        }
    });    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === "endereco.cep") {
            const formattedCep = formatCep(value);
            setFormData(prev => ({
                ...prev,
                endereco: {
                    ...prev.endereco,
                    cep: formattedCep
                }
            }));
            return;
        }

        if (name === "cpf") {
            const formattedCpf = formatCpf(value);
            setFormData(prev => ({
                ...prev,
                cpf: formattedCpf
            }));
            return;
        }

        if (name === "telefone.numero") {
            const formattedTelefone = formatTelefone(value);
            setFormData(prev => ({
                ...prev,
                telefone: {
                    ...prev.telefone,
                    numero: formattedTelefone
                }
            }));
            return;
        }

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            if (parent === 'telefone') {
                setFormData(prev => ({
                    ...prev,
                    telefone: {
                        ...prev.telefone,
                        [child]: value
                    }
                }));
            } else if (parent === 'endereco') {
                setFormData(prev => ({
                    ...prev,
                    endereco: {
                        ...prev.endereco,
                        [child]: value
                    }
                }));
            } else if (parent === 'voluntario') {
                setFormData(prev => ({
                    ...prev,
                    voluntario: {
                        ...prev.voluntario,
                        [child]: value
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        // Campos obrigatórios baseados no AssistenteSocialInput.java
        if (!formData.nome.trim()) errors.nome = "Nome é obrigatório";
        if (!formData.sobrenome.trim()) errors.sobrenome = "Sobrenome é obrigatório";
        
        // Email - obrigatório e com validação
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = "E-mail é obrigatório";
        } else if (!emailRegex.test(formData.email)) {
            errors.email = "E-mail inválido";
        }

        // Senha - obrigatória
        if (!formData.senha.trim()) {
            errors.senha = "Senha é obrigatória";
        } else if (formData.senha.length < 6) {
            errors.senha = "A senha deve ter pelo menos 6 caracteres";
        }

        if (formData.senha !== formData.confirmarSenha) {
            errors.confirmarSenha = "As senhas não coincidem";
        }
        
        // CPF - obrigatório
        const cpfDigits = formData.cpf.replace(/\D/g, '');
        if (!formData.cpf.trim()) {
            errors.cpf = "CPF é obrigatório";
        } else if (cpfDigits.length !== 11) {
            errors.cpf = "CPF deve ter 11 dígitos";
        }
        
        // Data de nascimento - obrigatória
        if (!formData.dataNascimento) errors.dataNascimento = "Data de nascimento é obrigatória";
        
        // Gênero - obrigatório
        if (!formData.genero) errors.genero = "Gênero é obrigatório";
        
        // Profissão - obrigatória
        if (!formData.profissao.trim()) errors.profissao = "Profissão é obrigatória";
        
        // DDD - obrigatório
        if (!formData.telefone.ddd.trim()) errors['telefone.ddd'] = "DDD é obrigatório";
        
        // Número (endereço) - obrigatório
        if (!formData.endereco.numero.trim()) errors['endereco.numero'] = "Número é obrigatório";
        
        // CEP - obrigatório
        if (!formData.endereco.cep.trim()) errors['endereco.cep'] = "CEP é obrigatório";
        
        // Telefone - obrigatório
        const telefoneDigits = formData.telefone.numero.replace(/\D/g, '');
        if (!formData.telefone.numero.trim()) {
            errors['telefone.numero'] = "Telefone é obrigatório";
        } else if (telefoneDigits.length < 8 || telefoneDigits.length > 9) {
            errors['telefone.numero'] = "Telefone deve ter 8 ou 9 dígitos";
        }
        
        // Campos opcionais (não validamos se obrigatórios):
        // - renda (Double)
        // - complemento (String)
        // - crp (String)
        // - especialidade (String)
        // - bio (String)
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast({
                title: "Erro",
                description: "Por favor, preencha todos os campos obrigatórios corretamente.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);        try {
            const dadosParaEnviar = {
                nome: formData.nome,
                sobrenome: formData.sobrenome,
                email: formData.email,
                senha: formData.senha,
                cpf: formData.cpf.replace(/\D/g, ''), // Remove formatting from CPF
                dataNascimento: formData.dataNascimento,
                genero: formData.genero,
                renda: formData.renda,
                tipo: formData.tipo,
                funcao: formData.funcao,
                profissao: formData.profissao,
                ddd: formData.telefone.ddd,
                numero: formData.telefone.numero.replace(/\D/g, ''), // Remove formatting from phone
                cep: formData.endereco.cep.replace(/\D/g, ''), // Remove formatting from CEP
                complemento: formData.endereco.complemento,
                crp: formData.voluntario.crp,
                especialidade: formData.voluntario.especialidade,
                telefone: `${formData.telefone.ddd}${formData.telefone.numero.replace(/\D/g, '')}`,
                bio: formData.voluntario.bio
            };            // Get the token from userData if available
            const token = userData?.token;
            
            const response = await fetch('http://localhost:8080/auth/cadastrar/assistente-social', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(dadosParaEnviar)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Erro ao cadastrar assistente social');
            }

            toast({
                title: "Sucesso!",
                description: "Assistente Social cadastrado com sucesso.",
            });

            navigate('/assistente-social');
        } catch (error) {
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao cadastrar o assistente social.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value;
        if (!cep || cep.length < 8) return;
        
        const endereco = await fetchAddressByCep(cep);
        if (endereco && formData.endereco) {
            setFormData(prev => ({
                ...prev,
                endereco: {
                    ...prev.endereco!,
                    rua: endereco.logradouro,
                    bairro: endereco.bairro,
                    cidade: endereco.localidade,
                    estado: endereco.uf,
                    cep: endereco.cep
                }
            }));
        }
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20] transition-colors duration-300 font-sans">                {/* Mobile Header */}
                {!sidebarOpen && (
                    <div className="w-full flex justify-start items-center gap-3 p-4 fixed top-0 left-0 z-30 bg-white/80 dark:bg-gray-900/90 shadow-md backdrop-blur-md">
                        <Button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
                            <Menu className="w-7 h-7" />
                        </Button>
                        <ProfileAvatar 
                            profileImage={profileImage}
                            name={`${assistenteSocialData.nome} ${assistenteSocialData.sobrenome}`}
                            size="w-10 h-10"
                            className="border-2 border-[#ED4231] shadow"
                        />
                        <span className="font-bold text-indigo-900 dark:text-gray-100">
                            {assistenteSocialData.nome} {assistenteSocialData.sobrenome}
                        </span>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF2FB] dark:bg-gradient-to-br dark:from-[#181A20] dark:via-[#23272F] dark:to-[#181A20]">
                        {/* Sidebar */}
                        <div className={`
                            ${sidebarOpen ? 'opacity-100 translate-x-0 w-4/5 max-w-xs md:w-72' : 'opacity-0 -translate-x-full w-0'}
                            bg-gradient-to-b from-white via-[#f8fafc] to-[#EDF2FB] dark:from-[#23272F] dark:via-[#23272F] dark:to-[#181A20] 
                            shadow-2xl rounded-2xl p-6 flex flex-col gap-6 overflow-hidden
                            fixed md:static z-40 top-0 left-0 h-full md:h-auto border-r border-[#EDF2FB] dark:border-[#23272F] 
                            backdrop-blur-[2px] transition-all duration-300
                        `}>
                            <div className="w-full flex justify-start mb-6">
                                <Button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full bg-[#ED4231] text-white focus:outline-none shadow-md">
                                    <Menu className="w-7 h-7" />
                                </Button>
                            </div>                            <div className="flex flex-col items-center gap-2 mb-8">
                                <ProfileAvatar 
                                    profileImage={profileImage}
                                    name={`${assistenteSocialData.nome} ${assistenteSocialData.sobrenome}`}
                                    size="w-16 h-16"
                                    className="border-4 border-[#EDF2FB] shadow"
                                />
                                <span className="font-extrabold text-xl text-indigo-900 dark:text-gray-100 tracking-wide">
                                    {assistenteSocialData.nome} {assistenteSocialData.sobrenome}
                                </span>
                                {assistenteSocialData.especialidade && (
                                    <div className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-full text-xs font-medium">
                                        {assistenteSocialData.especialidade}
                                    </div>
                                )}
                            </div>

                            <SidebarMenu className="gap-4 text-sm md:text-base">
                                <SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/home' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                                                <Link to="/assistente-social    " className="flex items-center gap-3">
                                                    <Home className="w-6 h-6" color="#ED4231" />
                                                    <span>Home</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Painel principal com resumo
                                        </TooltipContent>
                                    </Tooltip>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/classificacao-usuarios' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                                                <Link to="/classificacao-usuarios" className="flex items-center gap-3">
                                                    <UserCheck className="w-6 h-6" color="#ED4231" />
                                                    <span>Classificar Usuários</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Classificar usuários
                                        </TooltipContent>
                                    </Tooltip>
                                </SidebarMenuItem>

<SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/cadastro-assistente' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                                                <Link to="/cadastro-assistente" className="flex items-center gap-3">
                                                    <UserPlus className="w-6 h-6" color="#ED4231" />
                                                    <span>Cadastrar Assistente</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Cadastrar Assistente social
                                        </TooltipContent>
                                    </Tooltip>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/cadastro-voluntario' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                                                <Link to="/cadastro-voluntario" className="flex items-center gap-3">
                                                    <UserPlus className="w-6 h-6" color="#ED4231" />
                                                    <span>Cadastrar Voluntário</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Cadastrar novo voluntário
                                        </TooltipContent>
                                    </Tooltip>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className={`rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 ${location.pathname === '/profile-form-assistente-social' ? 'bg-[#EDF2FB] border-l-4 border-[#ED4231]' : ''}`}>
                                                <Link to="/profile-form-assistente-social" className="flex items-center gap-3">
                                                    <User className="w-6 h-6" color="#ED4231" />
                                                    <span>Meu Perfil</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Editar perfil
                                        </TooltipContent>
                                    </Tooltip>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <SidebarMenuButton 
                                            className="rounded-xl px-4 py-3 font-normal text-sm md:text-base transition-all duration-300 hover:bg-[#ED4231]/20 focus:bg-[#ED4231]/20 text-[#ED4231] flex items-center gap-3"
                                            onClick={() => {
                                                // Clear user session data
                                                localStorage.removeItem('userData');
                                                localStorage.removeItem('profileData');
                                                // Redirect to login page
                                                navigate('/');
                                                toast({
                                                    title: "Sessão encerrada",
                                                    description: "Você foi desconectado com sucesso.",
                                                });
                                            }}
                                        >
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
                        </div>

                        {/* Main content */}
                        <main className={`flex-1 w-full md:w-auto mt-20 md:mt-0 transition-all duration-500 ease-in-out ${sidebarOpen ? '' : 'ml-0'} p-4 md:p-8`}>
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center gap-4 mb-6">
                                    <Button 
                                        onClick={() => navigate("/assistente-social")} 
                                        variant="ghost" 
                                        className="p-2 rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-gray-100">
                                            Cadastrar Novo Assistente Social
                                        </h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Preencha os dados para cadastrar um novo assistente social
                                        </p>
                                    </div>
                                </div>

                                <Card className="bg-white dark:bg-[#23272F] border-[#EDF2FB] dark:border-[#444857]">
                                    <CardHeader>
                                        <CardTitle>Dados Pessoais e Profissionais</CardTitle>
                                        <CardDescription>Informe os dados do novo assistente social</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Dados Pessoais */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="nome" className="flex items-center justify-between">
                                                    Nome
                                                    {validationErrors.nome && (
                                                        <span className="text-xs text-red-500">{validationErrors.nome}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="nome" 
                                                    name="nome" 
                                                    value={formData.nome} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.nome ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sobrenome" className="flex items-center justify-between">
                                                    Sobrenome
                                                    {validationErrors.sobrenome && (
                                                        <span className="text-xs text-red-500">{validationErrors.sobrenome}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="sobrenome" 
                                                    name="sobrenome" 
                                                    value={formData.sobrenome} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.sobrenome ? 'border-red-500' : ''}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                                            <div className="space-y-2">
                                                <Label htmlFor="cpf" className="flex items-center justify-between">
                                                    CPF
                                                    {validationErrors.cpf && (
                                                        <span className="text-xs text-red-500">{validationErrors.cpf}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="cpf" 
                                                    name="cpf" 
                                                    value={formData.cpf} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.cpf ? 'border-red-500' : ''}
                                                    placeholder="123.456.789-00"
                                                    maxLength={14}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dataNascimento" className="flex items-center justify-between">
                                                    Data de Nascimento
                                                    {validationErrors.dataNascimento && (
                                                        <span className="text-xs text-red-500">{validationErrors.dataNascimento}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="dataNascimento" 
                                                    name="dataNascimento" 
                                                    type="date"
                                                    value={formData.dataNascimento} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.dataNascimento ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="genero" className="flex items-center justify-between">
                                                    Gênero
                                                    {validationErrors.genero && (
                                                        <span className="text-xs text-red-500">{validationErrors.genero}</span>
                                                    )}
                                                </Label>
                                                <select 
                                                    id="genero" 
                                                    name="genero" 
                                                    value={formData.genero} 
                                                    onChange={handleInputChange}
                                                    className={`w-full p-2 rounded-md border ${validationErrors.genero ? 'border-red-500' : 'border-gray-300'}`}
                                                >
                                                    <option value="">Selecione o gênero</option>
                                                    <option value="MASCULINO">Masculino</option>
                                                    <option value="FEMININO">Feminino</option>
                                                    <option value="OUTRO">Outro</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Dados Profissionais */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="voluntario.crp" className="flex items-center justify-between">
                                                    CRP
                                                    {validationErrors['voluntario.crp'] && (
                                                        <span className="text-xs text-red-500">{validationErrors['voluntario.crp']}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="voluntario.crp" 
                                                    name="voluntario.crp" 
                                                    value={formData.voluntario.crp} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors['voluntario.crp'] ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="voluntario.especialidade" className="flex items-center justify-between">
                                                    Especialidade
                                                    {validationErrors['voluntario.especialidade'] && (
                                                        <span className="text-xs text-red-500">{validationErrors['voluntario.especialidade']}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="voluntario.especialidade" 
                                                    name="voluntario.especialidade" 
                                                    value={formData.voluntario.especialidade} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors['voluntario.especialidade'] ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="profissao" className="flex items-center justify-between">
                                                    Profissão
                                                    {validationErrors.profissao && (
                                                        <span className="text-xs text-red-500">{validationErrors.profissao}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="profissao" 
                                                    name="profissao" 
                                                    value={formData.profissao} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.profissao ? 'border-red-500' : ''}
                                                    placeholder="Digite sua profissão"
                                                />
                                            </div>
                                        </div>                                        <div className="space-y-2">
                                            <Label htmlFor="voluntario.bio">
                                                Biografia (opcional)
                                            </Label>
                                            <textarea 
                                                id="voluntario.bio" 
                                                name="voluntario.bio" 
                                                value={formData.voluntario.bio} 
                                                onChange={handleInputChange}
                                                className="w-full p-2 rounded-md border border-gray-300"
                                                rows={4}
                                                placeholder="Descreva sua biografia profissional..."
                                            />
                                        </div>

                                        {/* Contato */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="flex items-center justify-between">
                                                    Email
                                                    {validationErrors.email && (
                                                        <span className="text-xs text-red-500">{validationErrors.email}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="email" 
                                                    name="email" 
                                                    type="email" 
                                                    value={formData.email} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.email ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="telefone.ddd">DDD</Label>
                                                    <Input 
                                                        id="telefone.ddd" 
                                                        name="telefone.ddd" 
                                                        value={formData.telefone.ddd} 
                                                        onChange={handleInputChange}
                                                        maxLength={2}
                                                        placeholder="11"
                                                    />
                                                </div>                                                <div className="col-span-3 space-y-2">
                                                    <Label htmlFor="telefone.numero">Número</Label>
                                                    <Input 
                                                        id="telefone.numero" 
                                                        name="telefone.numero" 
                                                        value={formData.telefone.numero} 
                                                        onChange={handleInputChange}
                                                        placeholder="98765-4321"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Senha */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="senha" className="flex items-center justify-between">
                                                    Senha
                                                    {validationErrors.senha && (
                                                        <span className="text-xs text-red-500">{validationErrors.senha}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="senha" 
                                                    name="senha" 
                                                    type="password" 
                                                    value={formData.senha} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.senha ? 'border-red-500' : ''}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmarSenha" className="flex items-center justify-between">
                                                    Confirmar Senha
                                                    {validationErrors.confirmarSenha && (
                                                        <span className="text-xs text-red-500">{validationErrors.confirmarSenha}</span>
                                                    )}
                                                </Label>
                                                <Input 
                                                    id="confirmarSenha" 
                                                    name="confirmarSenha" 
                                                    type="password" 
                                                    value={formData.confirmarSenha || ''} 
                                                    onChange={handleInputChange}
                                                    className={validationErrors.confirmarSenha ? 'border-red-500' : ''}
                                                />
                                            </div>
                                        </div>

                                        {/* Endereço */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Endereço</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="endereco.cep">CEP</Label>
                                                    <Input 
                                                        id="endereco.cep" 
                                                        name="endereco.cep" 
                                                        value={formData.endereco.cep} 
                                                        onChange={handleInputChange}
                                                        onBlur={handleCepBlur}
                                                        placeholder="00000-000"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="endereco.numero">Número</Label>
                                                    <Input 
                                                        id="endereco.numero" 
                                                        name="endereco.numero" 
                                                        value={formData.endereco.numero} 
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label htmlFor="endereco.complemento">Complemento</Label>
                                                    <Input 
                                                        id="endereco.complemento" 
                                                        name="endereco.complemento" 
                                                        value={formData.endereco.complemento} 
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/assistente-social")}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-[#ED4231] hover:bg-[#d53a2a]"
                                        >
                                            {loading ? (
                                                <div className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Cadastrando...
                                                </div>
                                            ) : "Cadastrar Assistente Social"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
};
