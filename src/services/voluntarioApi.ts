import axios from 'axios';

// API base configuration
const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      console.warn('Authentication failed, redirecting to login...');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interface para voluntário (correspondente ao backend DTO)
export interface VoluntarioListagem {
  idUsuario: number;
  idVoluntario: number;
  nome: string;
  sobrenome: string;
  email: string;
  funcao?: string;
  areaOrientacao?: string;
  dataCadastro: string; // ISO date string
  ultimoAcesso?: string; // ISO date string
  ativo: boolean;
  nomeCompleto?: string;
}

// Tipos auxiliares para status
export type VoluntarioStatus = 'ativo' | 'inativo' | 'pendente';

// Service class para voluntários
export class VoluntarioApiService {
  
  /**
   * Lista todos os voluntários cadastrados
   */
  static async listarVoluntarios(): Promise<VoluntarioListagem[]> {
    try {
      const response = await apiClient.get<VoluntarioListagem[]>('/usuarios/voluntarios');
      
      // Mapear dados para incluir informações derivadas
      return response.data.map(voluntario => ({
        ...voluntario,
        nomeCompleto: `${voluntario.nome} ${voluntario.sobrenome}`.trim()
      }));
      
    } catch (error) {
      console.error('Erro ao listar voluntários:', error);
      throw new Error('Falha ao carregar lista de voluntários');
    }
  }

  /**
   * Determina o status do voluntário baseado no último acesso
   */
  static determinarStatus(voluntario: VoluntarioListagem): VoluntarioStatus {
    if (!voluntario.ultimoAcesso) {
      return 'pendente'; // Nunca acessou
    }

    const ultimoAcesso = new Date(voluntario.ultimoAcesso);
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    if (ultimoAcesso > trintaDiasAtras) {
      return 'ativo';
    } else {
      return 'inativo';
    }
  }

  /**
   * Filtra voluntários por status
   */
  static filtrarPorStatus(
    voluntarios: VoluntarioListagem[], 
    status: VoluntarioStatus | 'todos'
  ): VoluntarioListagem[] {
    if (status === 'todos') {
      return voluntarios;
    }

    return voluntarios.filter(voluntario => 
      this.determinarStatus(voluntario) === status
    );
  }

  /**
   * Filtra voluntários por termo de busca
   */
  static filtrarPorBusca(
    voluntarios: VoluntarioListagem[], 
    termoBusca: string
  ): VoluntarioListagem[] {
    if (!termoBusca.trim()) {
      return voluntarios;
    }

    const termo = termoBusca.toLowerCase();
    
    return voluntarios.filter(voluntario => 
      voluntario.nome.toLowerCase().includes(termo) ||
      voluntario.sobrenome.toLowerCase().includes(termo) ||
      voluntario.email.toLowerCase().includes(termo) ||
      (voluntario.funcao && voluntario.funcao.toLowerCase().includes(termo)) ||
      (voluntario.areaOrientacao && voluntario.areaOrientacao.toLowerCase().includes(termo))
    );
  }

  /**
   * Aplica filtros combinados (status + busca)
   */
  static aplicarFiltros(
    voluntarios: VoluntarioListagem[],
    termoBusca: string,
    status: VoluntarioStatus | 'todos'
  ): VoluntarioListagem[] {
    let resultado = voluntarios;

    // Aplicar filtro de status
    resultado = this.filtrarPorStatus(resultado, status);

    // Aplicar filtro de busca
    resultado = this.filtrarPorBusca(resultado, termoBusca);

    return resultado;
  }

  /**
   * Formata data para exibição
   */
  static formatarData(dataIso?: string): string {
    if (!dataIso) return 'Nunca';

    try {
      const data = new Date(dataIso);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }

  /**
   * Formata data e hora para exibição
   */
  static formatarDataHora(dataIso?: string): string {
    if (!dataIso) return 'Nunca';

    try {
      const data = new Date(dataIso);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }
}

export default VoluntarioApiService;
