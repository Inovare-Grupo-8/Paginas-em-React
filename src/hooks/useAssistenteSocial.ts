import { useEffect } from 'react';
import { updateEmailInLocalStorage } from '../utils/localStorage';

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
            const token = user.token;
            const usuarioId = user.idUsuario;
            
            console.log('🔍 Debug - token:', token ? 'Token exists' : 'No token');
            console.log('🔍 Debug - usuarioId:', usuarioId);
            
            if (!usuarioId) {
                throw new Error('ID do usuário não encontrado');
            }

            const url = `http://localhost:8080/perfil/assistente-social?usuarioId=${usuarioId}`;
            console.log('🔍 Debug - URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 Debug - Error response:', errorText);
                throw new Error('Erro ao buscar perfil');
            }

            const data = await response.json();
            
            // Se houver uma foto, adiciona a URL base
            if (data.fotoUrl) {
                data.fotoUrl = `http://localhost:8080${data.fotoUrl}`;
            }

            console.log('🔍 Debug - Profile data:', data);
            return data;
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
            });            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }            const result = await response.json();
            
            // Atualizar localStorage se o email foi alterado
            if (result.email) {
                updateEmailInLocalStorage(result.email);
            }

            return result;
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
            };            const response = await fetch(`http://localhost:8080/perfil/assistente-social/endereco?usuarioId=${usuarioId}`, {
                method: 'PUT',
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
        }    };    // Função específica para atualizar dados pessoais e profissionais
    const atualizarDadosPessoais = async (dados: { 
        nome: string; 
        email: string; 
        sobrenome: string;
        telefone: string;
        crp?: string;
        bio?: string;
        especialidade?: string;
    }): Promise<{ 
        nome: string; 
        email: string; 
        sobrenome: string;
        telefone: string;
        crp?: string;
        bio?: string;
        especialidade?: string;
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
            }            const result = await response.json();
            
            // Atualizar localStorage se o email foi alterado
            if (result.email) {
                updateEmailInLocalStorage(result.email);
            }
            
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

    const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

    // Função para validar o tamanho da imagem
    const validateImageSize = (file: File): boolean => {
        return file.size <= MAX_FILE_SIZE;
    };

    // Função para comprimir a imagem se necessário
    const compressImage = async (file: File): Promise<File> => {
        if (file.size <= MAX_FILE_SIZE) {
            return file;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calcular nova dimensão mantendo aspecto
                    if (width > height) {
                        if (width > 800) {
                            height = Math.round((height * 800) / width);
                            width = 800;
                        }
                    } else {
                        if (height > 800) {
                            width = Math.round((width * 800) / height);
                            height = 800;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                reject(new Error('Falha ao comprimir imagem'));
                            }
                        },
                        'image/jpeg',
                        0.7
                    );
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const uploadFoto = async (file: File): Promise<string> => {
        try {
            if (!validateImageSize(file)) {
                const compressedFile = await compressImage(file);
                if (!validateImageSize(compressedFile)) {
                    throw new Error('Imagem muito grande. O tamanho máximo permitido é 1MB.');
                }
                file = compressedFile;
            }

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

            const formData = new FormData();
            formData.append('file', file);
            formData.append('usuarioId', usuarioId.toString());

            const response = await fetch(`http://localhost:8080/perfil/assistente-social/foto?usuarioId=${usuarioId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao fazer upload da foto: ${errorText}`);
            }

            const result = await response.json();
            // Concatena a URL base com o caminho relativo retornado pelo servidor
            const photoUrl = `http://localhost:8080${result.url}`;
            return photoUrl;
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
            throw error;
        }
    };

    return {
        fetchPerfil,
        atualizarPerfil,
        atualizarDadosPessoais,
        atualizarDadosProfissionais,
        buscarEndereco,
        atualizarEndereco,
        uploadFoto
    };
};

export default useAssistenteSocial;
