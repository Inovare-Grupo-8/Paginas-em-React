/**
 * Utilitários para gerenciar dados do usuário no localStorage
 */

export interface UserData {
    idUsuario: number;
    nome: string;
    email: string;
    token: string;
    tipo: string;
    [key: string]: any;
}

/**
 * Atualiza o email do usuário no localStorage
 * @param newEmail - Novo email para atualizar
 */
export const updateEmailInLocalStorage = (newEmail: string): void => {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user: UserData = JSON.parse(userData);
            if (user.email !== newEmail) {
                const updatedUserData = {
                    ...user,
                    email: newEmail
                };
                localStorage.setItem('userData', JSON.stringify(updatedUserData));
                console.log('📧 Email atualizado no localStorage:', newEmail);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar email no localStorage:', error);
    }
};

/**
 * Atualiza dados específicos do usuário no localStorage
 * @param updates - Objeto com os campos a serem atualizados
 */
export const updateUserDataInLocalStorage = (updates: Partial<UserData>): void => {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user: UserData = JSON.parse(userData);
            const updatedUserData = {
                ...user,
                ...updates
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            console.log('📋 Dados do usuário atualizados no localStorage:', Object.keys(updates));
        }
    } catch (error) {
        console.error('Erro ao atualizar dados do usuário no localStorage:', error);
    }
};

/**
 * Obtém os dados do usuário do localStorage
 * @returns UserData ou null se não encontrado
 */
export const getUserDataFromLocalStorage = (): UserData | null => {
    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Erro ao obter dados do usuário do localStorage:', error);
        return null;
    }
};

/**
 * Remove os dados do usuário do localStorage (logout)
 */
export const clearUserDataFromLocalStorage = (): void => {
    try {
        localStorage.removeItem('userData');
        console.log('🚪 Dados do usuário removidos do localStorage');
    } catch (error) {
        console.error('Erro ao remover dados do usuário do localStorage:', error);
    }
};
