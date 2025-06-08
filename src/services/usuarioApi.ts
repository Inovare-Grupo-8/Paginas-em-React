import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

// Função para determinar o tipo do usuário baseado nos dados salvos
const getUserTypeFromStorage = (): string => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      const tipo = parsedData.tipo;
      
      // Mapear os tipos para os valores esperados pelo endpoint
      switch (tipo) {
        case 'VOLUNTARIO':
          return 'voluntario';
        case 'ADMINISTRADOR':
          return 'assistente-social';
        case 'VALOR_SOCIAL':
        case 'GRATUIDADE':
        case 'NAO_CLASSIFICADO':
        default:
          return 'assistido';
      }
    }
    
    // Fallback para assistido
    return 'assistido';
  } catch (error) {
    console.error('Erro ao determinar tipo do usuário:', error);
    return 'assistido';
  }
};

// Serviços de usuário
export const userService = {
  // Buscar dados do usuário logado
  getCurrentUser: async (): Promise<UserData> => {
    try {
      // Buscar o ID e tipo do usuário do localStorage
      const userId = getUserIdFromStorage();
      const userType = getUserTypeFromStorage();
      
      console.log('ID do usuário encontrado:', userId);
      console.log('Tipo do usuário:', userType);
      
      if (userId) {
        try {
          // Buscar dados pessoais usando o endpoint genérico
          console.log(`Buscando dados pessoais: /perfil/${userType}/dados-pessoais?usuarioId=${userId}`);
          const response = await api.get(`/perfil/${userType}/dados-pessoais?usuarioId=${userId}`);
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
            tipo: apiData.tipo,
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
        } catch (apiError: any) {
          console.warn('Erro na API, usando fallback:', apiError);
          
          // Se for erro 404, o usuário não existe
          if (apiError.response?.status === 404) {
            throw new Error('Usuário não encontrado');
          }
          
          // Para outros erros, usar dados do localStorage como fallback
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
          
          throw apiError;
        }
      }
      
      throw new Error('ID do usuário não encontrado');
      
    } catch (error) {
      console.error('Erro geral ao buscar dados do usuário:', error);
      throw new Error('Erro ao carregar dados do usuário');
    }
  },

  // Atualizar dados do usuário usando o endpoint genérico
  updateUser: async (userId: number, userData: Partial<UserData>): Promise<UserData> => {
    try {
      const userType = getUserTypeFromStorage();
      
      console.log('Atualizando dados do usuário:', userId, userData);
      console.log('Tipo do usuário para atualização:', userType);
      
      // Converter dados para o formato da API
      const updateData = {
        nome: userData.nome,
        sobrenome: userData.sobrenome,
        email: userData.email,
        telefone: userData.telefone,
        dataNascimento: userData.dataNascimento,
        genero: userData.genero,
      };
      
      const response = await api.patch(`/perfil/${userType}/dados-pessoais?usuarioId=${userId}`, updateData);
      console.log('Resposta da atualização:', response.data);
      
      // Buscar dados atualizados
      const updatedUserData = await userService.getCurrentUser();
      return updatedUserData;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      
      // Para desenvolvimento, simular sucesso da atualização
      console.log('Simulando atualização bem-sucedida');
      const updatedData = { ...userData } as UserData;
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return updatedData;
    }
  },

  // Upload de foto de perfil
  uploadProfileImage: async (file: File): Promise<string> => {
    try {
      const userId = getUserIdFromStorage();
      const userType = getUserTypeFromStorage();
      
      if (!userId) {
        throw new Error('ID do usuário não encontrado');
      }
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/perfil/${userType}/foto?usuarioId=${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.url || '';
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      
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
    }
  },
};