import { useState, useEffect } from 'react';
import { userService, UserData } from '../services/usuarioApi';
import { toast } from './use-toast';

const defaultUserData: UserData = {
  nome: '',
  sobrenome: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  genero: 'OUTRO',
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

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados do usuário
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Iniciando busca de dados do usuário...');
      const data = await userService.getCurrentUser();
      
      // Garantir que o objeto endereco existe
      const safeUserData = {
        ...data,
        endereco: {
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          ...data.endereco, // Mesclar com dados existentes se houver
        }
      };
      
      console.log('Dados do usuário carregados com sucesso:', safeUserData);
      setUserData(safeUserData);
      
      // Salvar também no localStorage como backup atualizado
      localStorage.setItem('userData', JSON.stringify(safeUserData));
      
    } catch (err) {
      console.error('Erro no fetchUserData:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Em caso de erro, tentar carregar do localStorage
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Garantir que endereco existe mesmo nos dados salvos
          const safeUserData = {
            ...defaultUserData,
            ...parsedData,
            endereco: {
              ...defaultUserData.endereco,
              ...parsedData.endereco,
            }
          };
          console.log('Usando dados do localStorage:', safeUserData);
          setUserData(safeUserData);
        } catch (parseError) {
          console.error('Erro ao parsear dados salvos:', parseError);
          setUserData(defaultUserData);
        }
      } else {
        console.log('Nenhum dado salvo encontrado, usando dados padrão');
        setUserData(defaultUserData);
      }
      
      // Não mostrar toast de erro durante desenvolvimento, apenas log
      console.warn('Usando dados de fallback devido ao erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar dados do usuário
  const updateUserData = async (newData: Partial<UserData>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar ID dos dados atuais ou extrair do localStorage
      let userId = userData.id;
      if (!userId) {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          userId = parsed.idUsuario || parsed.id || 1;
        } else {
          userId = 1; // ID padrão
        }
      }
      
      console.log('Atualizando dados do usuário:', userId, newData);
      
      // Merge com dados existentes, garantindo que endereco existe
      const dataToUpdate = {
        ...userData,
        ...newData,
        endereco: {
          ...userData.endereco,
          ...newData.endereco,
        }
      };
      
      const updatedData = await userService.updateUser(userId, dataToUpdate);
      
      // Garantir que endereco existe na resposta
      const safeUpdatedData = {
        ...updatedData,
        endereco: {
          ...defaultUserData.endereco,
          ...updatedData.endereco,
        }
      };
      
      setUserData(safeUpdatedData);
      
      // Atualizar localStorage
      localStorage.setItem('userData', JSON.stringify(safeUpdatedData));
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
      
      return safeUpdatedData;
    } catch (err) {
      console.error('Erro no updateUserData:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('Hook useUserData inicializado, carregando dados...');
    fetchUserData();
  }, []);

  return {
    userData,
    setUserData: updateUserData,
    loading,
    error,
    refetch: fetchUserData,
  };
};