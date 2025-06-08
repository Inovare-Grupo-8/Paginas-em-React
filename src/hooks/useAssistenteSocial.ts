import { useEffect } from 'react';

interface Endereco {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

export interface AssistenteSocialInput {
    nome: string;
    sobrenome: string;
    cpf?: string;
    crp: string;
    especialidade: string;
    telefone: string;
    email: string;
    senha?: string;
    bio?: string;
    endereco?: Endereco;
}

export interface AssistenteSocialOutput {
    idUsuario: number;
    nome: string;
    sobrenome: string;
    cpf?: string;
    crp: string;
    especialidade: string;
    telefone: string;
    email: string;
    bio?: string;
    fotoUrl?: string;
    endereco?: Endereco;
    // Dados profissionais vindos do backend
    registroProfissional?: string;
    biografiaProfissional?: string;
}

export const useAssistenteSocial = () => {
    const fetchPerfil = async (): Promise<AssistenteSocialOutput> => {
        try {
            // Pegar dados do usuário logado do localStorage
            const userData = localStorage.getItem('userData');
            
            console.log('🔍 Debug - userData:', userData);
            
            if (!userData) {
                throw new Error('Usuário não está logado');
            }
            
            const user = JSON.parse(userData);
            const token = user.token; // Token está dentro do objeto user
            const usuarioId = user.idUsuario;
            
            console.log('🔍 Debug - token:', token ? 'Token exists' : 'No token');
            console.log('🔍 Debug - usuarioId:', usuarioId);
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            const url = `http://localhost:8080/perfil/assistente-social?usuarioId=${usuarioId}`;
            console.log('🔍 Debug - URL:', url);
            console.log('🔍 Debug - Authorization header:', `Bearer ${token || ''}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                }
            });

            console.log('🔍 Debug - Response status:', response.status);
            console.log('🔍 Debug - Response statusText:', response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 Debug - Error response:', errorText);
                throw new Error('Erro ao buscar perfil');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            throw error;
        }
    };

    const atualizarPerfil = async (dados: AssistenteSocialInput): Promise<AssistenteSocialOutput> => {
        try {
            // Pegar dados do usuário logado do localStorage
            const userData = localStorage.getItem('userData');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }
            
            const user = JSON.parse(userData);
            const token = user.token; // Token está dentro do objeto user
            const usuarioId = user.idUsuario;
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/dados-pessoais?usuarioId=${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    };    const atualizarDadosProfissionais = async (dados: {
        crp: string;
        especialidade: string;
        bio?: string;
    }): Promise<{
        crp: string;
        especialidade: string;
        bio?: string;
    }> => {
        try {
            const userData = localStorage.getItem('userData');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }
            
            const user = JSON.parse(userData);
            const token = user.token;
            const usuarioId = user.idUsuario;
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            // Converter para o formato esperado pelo backend
            const dadosParaEnviar = {
                funcao: "ASSISTENCIA_SOCIAL",
                registroProfissional: dados.crp,
                especialidade: dados.especialidade,
                biografiaProfissional: dados.bio,
                especialidades: []
            };

            console.log('Enviando dados profissionais para o backend:', dadosParaEnviar);

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/dados-profissionais?usuarioId=${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify(dadosParaEnviar)
            });

            console.log('Status da resposta:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                throw new Error(`Erro ao atualizar dados profissionais: ${response.status}. ${errorText}`);
            }

            // Handle 204 No Content response
            if (response.status === 204) {
                console.log('Dados profissionais atualizados com sucesso (204 No Content)');
                return dados; // Return the original data since update was successful
            }

            const result = await response.json();
            console.log('Resposta do backend:', result);

            // Return the server response data if available, otherwise fallback to original data
            return {
                crp: result.registroProfissional || dados.crp,
                especialidade: result.especialidade || dados.especialidade,
                bio: result.biografiaProfissional || dados.bio
            };
        } catch (error) {
            console.error('Erro ao atualizar dados profissionais:', error);
            throw error;
        }
    };

    const buscarEndereco = async (): Promise<Endereco | null> => {
        try {
            // Pegar dados do usuário logado do localStorage
            const userData = localStorage.getItem('userData');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }
            
            const user = JSON.parse(userData);
            const token = user.token;
            const usuarioId = user.idUsuario;
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/endereco?usuarioId=${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Endereço não encontrado
                }
                throw new Error('Erro ao buscar endereço');
            }

            const enderecoOutput = await response.json();
            
            // Converter EnderecoOutput para Endereco
            return {
                rua: enderecoOutput.logradouro || '',
                numero: enderecoOutput.numero || '',
                complemento: enderecoOutput.complemento || '',
                bairro: enderecoOutput.bairro || '',
                cidade: enderecoOutput.cidade || '',
                estado: enderecoOutput.uf || '',
                cep: enderecoOutput.cep || ''
            };
        } catch (error) {
            console.error('Erro ao buscar endereço:', error);
            throw error;
        }
    };

    const atualizarEndereco = async (endereco: {
        cep: string;
        numero: string;
        complemento?: string;
    }): Promise<void> => {
        try {
            // Pegar dados do usuário logado do localStorage
            const userData = localStorage.getItem('userData');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }
            
            const user = JSON.parse(userData);
            const token = user.token;
            const usuarioId = user.idUsuario;
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            // Preparar dados para envio no formato esperado pelo backend
            const enderecoInput = {
                cep: endereco.cep,
                numero: endereco.numero,
                complemento: endereco.complemento || ''
            };

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/endereco?usuarioId=${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify(enderecoInput)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar endereço');
            }
        } catch (error) {
            console.error('Erro ao atualizar endereço:', error);
            throw error;
        }    };

    // Função específica para atualizar apenas dados pessoais básicos
    const atualizarDadosPessoais = async (dados: { 
        nome: string; 
        email: string; 
        sobrenome: string;
        telefone: string;
    }): Promise<{ 
        nome: string; 
        email: string; 
        sobrenome: string;
        telefone: string;
    }> => {
        try {
            // Pegar dados do usuário logado do localStorage
            const userData = localStorage.getItem('userData');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }

            const user = JSON.parse(userData);
            const token = user.token;
            const usuarioId = user.idUsuario;
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/dados-pessoais?usuarioId=${usuarioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                throw new Error(`Erro ao atualizar dados pessoais: ${response.status}`);
            }

            const result = await response.json();
            return {
                nome: result.nome || dados.nome,
                email: result.email || dados.email,
                sobrenome: result.sobrenome || dados.sobrenome,
                telefone: result.telefone || dados.telefone
            };
        } catch (error) {
            console.error('Erro ao atualizar dados pessoais:', error);
            throw error;
        }
    };

    return {
        fetchPerfil,
        atualizarPerfil,
        atualizarDadosPessoais,
        atualizarDadosProfissionais,
        buscarEndereco,
        atualizarEndereco
    };
};

export default useAssistenteSocial;
