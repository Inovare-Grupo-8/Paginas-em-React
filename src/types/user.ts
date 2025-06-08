export interface UserData {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  genero: string;
  endereco: {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

export interface UserContextType {
  userData: UserData;
  setUserData: (data: UserData) => void;
  updateUserData: (updates: Partial<UserData>) => void;
}

export const defaultUserData: UserData = {
  nome: "João",
  sobrenome: "Silva", 
  email: "",
  telefone: "",
  dataNascimento: "",
  genero: "",
  endereco: {
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: ""
  }
};
