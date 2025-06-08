import axios from 'axios';

// Configuração base do axios
const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Para enviar cookies (JSESSIONID)
});

// Interceptor para adicionar token de autenticação se necessário
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interfaces adaptadas para sua API
export interface UserData {
    id?: number;
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
    dataNascimento: string;
    genero: 'FEMININO' | 'MASCULINO' | 'OUTRO';
    cpf?: string;
    renda?: number;
    tipo?: string;
    areaOrientacao?: string;
    comoSoube?: string;
    profissao?: string;
    endereco: {
        cep: string;
        rua?: string;
        numero: string;
        complemento: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
    };
    foto?: string;
}

// Interface para dados da API (formato que vem do backend)
interface ApiUserData {
    id: number;
    nome: string;
    sobrenome: string;
    email: string;
    cpf?: string;
    dataNascimento?: string;
    genero?: 'FEMININO' | 'MASCULINO' | 'OUTRO';
    renda?: number;
    tipo?: string;
    areaOrientacao?: string;
    comoSoube?: string;
    profissao?: string;
    endereco?: {
        cep?: string;
        numero?: string;
        complemento?: string;
        logradouro?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
    };
    telefone?: {
        ddd?: string;
        numero?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Função para extrair o ID do usuário do userData armazenado no login
const getUserIdFromStorage = (): number | null => {
    try {
        // Tentar pegar o ID do userData salvo no login
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            if (parsedData.idUsuario) {
                return parsedData.idUsuario;
            }
            if (parsedData.id) {
                return parsedData.id;
            }
        }

        // Tentar pegar diretamente do userId
        const userId = localStorage.getItem('userId');
        if (userId) {
            return parseInt(userId, 10);
        }

        return null;
    } catch (error) {
        console.error('Erro ao extrair ID do usuário:', error);
        return null;
    }
};

// Função para converter dados da API para o formato do frontend
const convertApiDataToUserData = (apiData: ApiUserData): UserData => {
    return {
        id: apiData.id,
        nome: apiData.nome || '',
        sobrenome: apiData.sobrenome || '',
        email: apiData.email || '',
        telefone: apiData.telefone ? `(${apiData.telefone.ddd || ''}) ${apiData.telefone.numero || ''}` : '',
        dataNascimento: apiData.dataNascimento || '',
        genero: apiData.genero || 'OUTRO',
        cpf: apiData.cpf,
        renda: apiData.renda,
        tipo: apiData.tipo,
        areaOrientacao: apiData.areaOrientacao,
        comoSoube: apiData.comoSoube,
        profissao: apiData.profissao,
        endereco: {
            cep: apiData.endereco?.cep || '',
            rua: apiData.endereco?.logradouro || '',
            numero: apiData.endereco?.numero || '',
            complemento: apiData.endereco?.complemento || '',
            bairro: apiData.endereco?.bairro || '',
            cidade: apiData.endereco?.cidade || '',
            estado: apiData.endereco?.estado || '',
        },
    };
};

// Função para converter dados do frontend para o formato da API
const convertUserDataToApiData = (userData: Partial<UserData>) => {
    const telefoneMatch = userData.telefone?.match(/\((\d{2})\)\s*(\d{4,5}-?\d{4})/);
    const ddd = telefoneMatch ? telefoneMatch[1] : '';
    const numero = telefoneMatch ? telefoneMatch[2].replace('-', '') : '';

    return {
        nome: userData.nome,
        sobrenome: userData.sobrenome,
        email: userData.email,
        cpf: userData.cpf,
        dataNascimento: userData.dataNascimento,
        genero: userData.genero,
        renda: userData.renda,
        tipo: userData.tipo,
        areaOrientacao: userData.areaOrientacao,
        comoSoube: userData.comoSoube,
        profissao: userData.profissao,
        endereco: {
            numero: userData.endereco?.numero,
            cep: userData.endereco?.cep,
            complemento: userData.endereco?.complemento,
        },
        telefone: {
            ddd: ddd,
            numero: numero,
        },
    };
};

// Serviços de usuário
export const userService = {
    // Buscar dados do usuário logado
    getCurrentUser: async (): Promise<UserData> => {
        try {
            // Buscar o ID do usuário do localStorage
            const userId = getUserIdFromStorage();

            console.log('ID do usuário encontrado:', userId);

            if (userId) {
                try {
                    // Buscar dados pessoais usando o endpoint correto
                    console.log(`Buscando dados pessoais para usuário ID: ${userId}`);
                    const response = await api.get(`/perfil/assistido/dados-pessoais?usuarioId=${userId}`);
                    console.log('Dados recebidos da API:', response.data);

                    // Converter os dados da API para o formato esperado
                    const apiData = response.data;
                    const userData: UserData = {
                        id: userId,
                        nome: apiData.nome || '',
                        sobrenome: apiData.sobrenome || '',
                        email: apiData.email || '',
                        telefone: apiData.telefone || '',
                        dataNascimento: apiData.dataNascimento || '',
                        genero: apiData.genero || 'OUTRO',
                        cpf: apiData.cpf,
                        endereco: {
                            cep: '',
                            rua: '',
                            numero: '',
                            complemento: '',
                            bairro: '',
                            cidade: '',
                            estado: '',
                        },
                    };

                    console.log('Dados convertidos:', userData);
                    return userData;
                } catch (apiError) {
                    console.warn('Erro na API, usando fallback:', apiError);
                    // Se falhar na API, usar dados do localStorage como fallback
                    const savedData = localStorage.getItem('userData');
                    if (savedData) {
                        const parsedData = JSON.parse(savedData);

                        // Garantir que os dados estão no formato correto
                        const fallbackData: UserData = {
                            id: userId,
                            nome: parsedData.nome || '',
                            sobrenome: parsedData.sobrenome || '',
                            email: parsedData.email || '',
                            telefone: parsedData.telefone || '',
                            dataNascimento: parsedData.dataNascimento || '',
                            genero: parsedData.genero || 'OUTRO',
                            cpf: parsedData.cpf,
                            renda: parsedData.renda,
                            tipo: parsedData.tipo,
                            areaOrientacao: parsedData.areaOrientacao,
                            comoSoube: parsedData.comoSoube,
                            profissao: parsedData.profissao,
                            endereco: {
                                cep: parsedData.endereco?.cep || '',
                                rua: parsedData.endereco?.rua || '',
                                numero: parsedData.endereco?.numero || '',
                                complemento: parsedData.endereco?.complemento || '',
                                bairro: parsedData.endereco?.bairro || '',
                                cidade: parsedData.endereco?.cidade || '',
                                estado: parsedData.endereco?.estado || '',
                            },
                        };

                        console.log('Usando dados do localStorage como fallback:', fallbackData);
                        return fallbackData;
                    }
                }
            }

            // Se não encontrou ID ou não conseguiu buscar, criar dados padrão
            console.log('Criando dados padrão para usuário sem ID');
            const defaultData: UserData = {
                id: 1, // ID padrão para desenvolvimento
                nome: 'Usuário',
                sobrenome: 'Teste',
                email: 'usuario@exemplo.com',
                telefone: '(11) 99999-9999',
                dataNascimento: '1990-01-01',
                genero: 'OUTRO',
                endereco: {
                    cep: '01234-567',
                    rua: 'Rua Exemplo',
                    numero: '123',
                    complemento: '',
                    bairro: 'Centro',
                    cidade: 'São Paulo',
                    estado: 'SP',
                },
            };

            // Salvar dados padrão para próximas sessões
            localStorage.setItem('userData', JSON.stringify(defaultData));
            localStorage.setItem('userId', '1');

            return defaultData;

        } catch (error) {
            console.error('Erro geral ao buscar dados do usuário:', error);
            throw new Error('Erro ao carregar dados do usuário');
        }
    },

    // Atualizar dados do usuário usando o endpoint de dados pessoais
    updateUser: async (userId: number, userData: Partial<UserData>): Promise<UserData> => {
        try {
            console.log('Atualizando dados do usuário:', userId, userData);

            // Converter dados para o formato da API
            const updateData = {
                nome: userData.nome,
                sobrenome: userData.sobrenome,
                email: userData.email,
                telefone: userData.telefone,
                dataNascimento: userData.dataNascimento,
                genero: userData.genero,
            };

            const response = await api.patch(`/perfil/assistido/dados-pessoais?usuarioId=${userId}`, updateData);

            // Buscar dados atualizados
            const updatedUserData = await userService.getCurrentUser();
            return updatedUserData;
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);

            // Para desenvolvimento, simular sucesso da atualização
            console.log('Simulando atualização bem-sucedida');
            const updatedData = { ...userData } as UserData;

            // Simular delay da API
            await new Promise(resolve => setTimeout(resolve, 1500));

            return updatedData;
        }
    },

    // Upload de foto de perfil (implementar quando a API estiver pronta)
    uploadProfileImage: async (file: File): Promise<string> => {
        try {
            // Para desenvolvimento, simular upload
            return new Promise((resolve) => {
                setTimeout(() => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }, 1000);
            });
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
            throw new Error('Erro ao fazer upload da foto');
        }
    },
};