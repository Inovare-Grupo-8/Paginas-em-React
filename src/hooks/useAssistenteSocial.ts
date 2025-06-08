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
    crp: string;
    especialidade: string;
    telefone: string;
    email: string;
    bio?: string;
    fotoUrl?: string;
    endereco?: Endereco;
}

export const useAssistenteSocial = () => {
    const fetchPerfil = async (): Promise<AssistenteSocialOutput> => {
        try {
            const response = await fetch('/api/assistentes-sociais/perfil', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
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
            const response = await fetch('/api/assistentes-sociais/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
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
    };

    return {
        fetchPerfil,
        atualizarPerfil
    };
};

export default useAssistenteSocial;
