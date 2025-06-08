import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Calendar, Mail, DollarSign, CheckCircle, XCircle, Heart, MapPin, Phone, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Props interface
interface ClassificacaoUsuariosProps {
  onUsuarioClassificado?: () => void;
}

// Interface para dados completos do usuário conforme novo backend
interface UsuarioCompleto {
  id: number;
  email: string;
  tipo: string;
  dataCadastro: string;

  // Dados da Ficha (podem ser null se não completaram segunda fase)
  nome?: string;
  sobrenome?: string;
  cpf?: string | null;
  dataNascimento?: string | null; // Data em formato ISO
  renda?: number | null;
  genero?: string | null;
  areaInteresse?: string | null;
  profissao?: string | null;

  // Dados do Endereço
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;

  // Telefones
  telefones?: Array<{
    numero: string;
    tipo: string;
  }>;
}

export function ClassificacaoUsuarios({ onUsuarioClassificado }: ClassificacaoUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassificando, setIsClassificando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);

  // Carregar usuários não classificados
  useEffect(() => {
    carregarUsuariosNaoClassificados();
  }, []);

  const carregarUsuariosNaoClassificados = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/usuarios/nao-classificados', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error('Erro ao carregar usuários não classificados:', response.status);
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const classificarUsuario = async (id: number, tipo: 'aprovar' | 'rejeitar') => {
    try {
      setIsClassificando(true);
      const endpoint = tipo === 'aprovar' ? 'aprovar' : 'rejeitar';

      const response = await fetch(`http://localhost:8080/usuarios/${id}/classificar/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remover o usuário da lista após classificação
        setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
        setDialogAberto(false);
        setUsuarioSelecionado(null);

        // Notificar componente pai se callback foi fornecido
        if (onUsuarioClassificado) {
          onUsuarioClassificado();
        }
      } else {
        console.error('Erro ao classificar usuário:', response.status);
      }
    } catch (error) {
      console.error('Erro ao conectar com a API:', error);
    } finally {
      setIsClassificando(false);
    }
  };

  const abrirDetalhes = (usuario: UsuarioCompleto) => {
    setUsuarioSelecionado(usuario);
    setDialogAberto(true);
  };
  const formatarData = (dataISO: string | null | undefined) => {
    if (!dataISO) return 'Não informado';
    try {
      return format(new Date(dataISO), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };
  const formatarRenda = (renda: number | null | undefined) => {
    if (!renda) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(renda);
  };
  const formatarCPF = (cpf: string | null | undefined) => {
    if (!cpf) return 'Não informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarTelefone = (telefone: { numero: string; tipo: string }) => {
    return `${telefone.numero} (${telefone.tipo})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED4231] mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Classificação de Usuários</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {usuarios.length} pendente{usuarios.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {usuarios.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum usuário pendente de classificação
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Todos os usuários foram classificados ou não há novos cadastros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>                    <div>
                      <h3 className="font-semibold text-lg">
                        {usuario.nome || 'Nome não informado'} {usuario.sobrenome || ''}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {usuario.email}
                        </span>
                        {usuario.dataNascimento && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatarData(usuario.dataNascimento)}
                          </span>
                        )}
                        {usuario.renda && (
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatarRenda(usuario.renda)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => abrirDetalhes(usuario)}
                      variant="outline"
                      size="sm"
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      onClick={() => classificarUsuario(usuario.id, 'aprovar')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      disabled={isClassificando}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => classificarUsuario(usuario.id, 'rejeitar')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                      disabled={isClassificando}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para detalhes do usuário */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Detalhes do Usuário</span>
            </DialogTitle>
            <DialogDescription>
              Informações completas para análise de classificação
            </DialogDescription>
          </DialogHeader>

          {usuarioSelecionado && (
            <div className="space-y-6">              {/* Informações Pessoais */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informações Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome Completo</label>
                    <p className="font-medium">
                      {usuarioSelecionado.nome || 'Não informado'} {usuarioSelecionado.sobrenome || ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="font-medium">{usuarioSelecionado.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CPF</label>
                    <p className="font-medium">{formatarCPF(usuarioSelecionado.cpf)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Nascimento</label>
                    <p className="font-medium">{formatarData(usuarioSelecionado.dataNascimento)}</p>
                  </div>
                  {usuarioSelecionado.genero && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gênero</label>
                      <p className="font-medium">{usuarioSelecionado.genero}</p>
                    </div>
                  )}
                  {usuarioSelecionado.profissao && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Profissão</label>
                      <p className="font-medium">{usuarioSelecionado.profissao}</p>
                    </div>
                  )}
                </div>
              </div>              {/* Informações Financeiras */}
              {usuarioSelecionado.renda && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Informações Financeiras</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Renda Mensal</label>
                    <p className="font-medium text-lg">{formatarRenda(usuarioSelecionado.renda)}</p>
                  </div>
                </div>
              )}

              {/* Área de Orientação */}
              {usuarioSelecionado.areaInteresse && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Área de Interesse</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Área de Orientação Desejada</label>
                    <p className="font-medium">{usuarioSelecionado.areaInteresse}</p>
                  </div>
                </div>
              )}

              {/* Alerta para cadastro incompleto */}
              {(!usuarioSelecionado.nome || !usuarioSelecionado.cpf || !usuarioSelecionado.dataNascimento || !usuarioSelecionado.renda) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Cadastro Incompleto
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>Este usuário não completou a segunda fase do cadastro. Algumas informações podem estar em falta. Se desejar entrar em contato com esse usuario, você assistente social pode ajudar a completar o cadastro antes da classificação.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Endereço */}
              {usuarioSelecionado.logradouro && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Endereço
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="font-medium">
                      {usuarioSelecionado.logradouro}, {usuarioSelecionado.numero}
                      {usuarioSelecionado.complemento && ` - ${usuarioSelecionado.complemento}`}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {usuarioSelecionado.bairro}, {usuarioSelecionado.cidade} - {usuarioSelecionado.uf}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">CEP: {usuarioSelecionado.cep}</p>
                  </div>
                </div>
              )}

              {/* Telefone */}
              {usuarioSelecionado.telefones && usuarioSelecionado.telefones.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Contato
                  </h3>
                  <div className="space-y-2">
                    {usuarioSelecionado.telefones.map((telefone, index) => (
                      <p key={index} className="font-medium">
                        {formatarTelefone(telefone)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => setDialogAberto(false)}
                  variant="outline"
                  disabled={isClassificando}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => classificarUsuario(usuarioSelecionado.id, 'rejeitar')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isClassificando}
                >
                  {isClassificando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeitar (Valor Social)
                </Button>
                <Button
                  onClick={() => classificarUsuario(usuarioSelecionado.id, 'aprovar')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isClassificando}
                >
                  {isClassificando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar (Gratuidade)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClassificacaoUsuarios;
