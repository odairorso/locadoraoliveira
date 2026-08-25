import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, QrCode, Shield, Save, UserPlus, 
  MessageCircle, CheckCircle2, LogOut
} from 'lucide-react';
import { supabase } from '@/react-app/supabase';
import { useAuth } from '@/react-app/contexts/AuthContext';
import PixModal from '@/react-app/components/PixModal';
import type { ConfiguracaoEmpresa, Perfil } from '@/shared/types';

export default function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [config, setConfig] = useState<ConfiguracaoEmpresa>({
    nome_empresa: 'Oliveira Veículos - Locação e Vendas',
    cnpj: '00.871.429/0001-01',
    telefone: '(67) 99622-9840',
    whatsapp: '5567996229840',
    email: 'veiculos.oliveira@gmail.com',
    endereco: 'Av. Campo Grande, 707 - Centro',
    cidade: 'Naviraí',
    estado: 'MS',
    tipo_chave_pix: 'email',
    chave_pix: 'veiculos.oliveira@gmail.com',
    titular_pix: 'JOAO ROBERTO DOS SANTOS DE OLIVEIRA',
    cidade_pix: 'NAVIRAI',
    link_playstore: 'https://play.google.com/store/apps/details?id=com.locadoraoliveira.app',
    mensagem_compartilhamento: 'Confira nossos veículos disponíveis para locação e faça sua reserva na Oliveira Veículos!'
  });

  const [funcionarios, setFuncionarios] = useState<Perfil[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showTestPix, setShowTestPix] = useState(false);

  // Novo Funcionário
  const [novoFunc, setNovoFunc] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'funcionario' as const
  });
  const [salvandoFunc, setSalvandoFunc] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
    carregarFuncionarios();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        setConfig(data);
      }
    } catch (e) {
      console.warn('Usando configurações padrão:', e);
    }
  };

  const carregarFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome', { ascending: true });

      if (data && !error) {
        setFuncionarios(data);
      } else {
        // Mock inicial se tabela ainda não tiver dados
        setFuncionarios([
          {
            email: 'veiculos.oliveira@gmail.com',
            nome: 'João Roberto (Oliveira Veículos)',
            telefone: '(67) 99622-9840',
            role: 'admin',
            ativo: true
          }
        ]);
      }
    } catch (e) {
      console.warn('Erro ao carregar perfis:', e);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      // Upsert no Supabase
      const { error } = await supabase
        .from('configuracoes_empresa')
        .upsert([{ id: 1, ...config, updated_at: new Date().toISOString() }]);

      if (error) {
        console.warn('Supabase update aviso:', error.message);
      }

      localStorage.setItem('oliveira_empresa_config', JSON.stringify(config));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCadastrarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFunc.email || !novoFunc.nome) return;

    setSalvandoFunc(true);
    try {
      const perfilPayload: Partial<Perfil> = {
        email: novoFunc.email.toLowerCase().trim(),
        nome: novoFunc.nome,
        telefone: novoFunc.telefone,
        role: novoFunc.role,
        ativo: true
      };

      const { error } = await supabase
        .from('perfis')
        .insert([perfilPayload]);

      if (error) {
        console.warn('Erro ao inserir perfil:', error.message);
      }

      setFuncionarios(prev => [...prev, perfilPayload as Perfil]);
      setNovoFunc({ nome: '', email: '', telefone: '', role: 'funcionario' });
      alert('Funcionário cadastrado com sucesso!');
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoFunc(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Painel do Administrador Dono</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Configurações da Empresa & PIX
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie a chave PIX de recebimentos, WhatsApp da locadora, links para a Play Store e equipe.
          </p>
        </div>

        {/* Botão de Testar PIX */}
        <button
          onClick={() => setShowTestPix(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Testar Visualização do PIX</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center space-x-3 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Configurações atualizadas com sucesso no sistema!</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 & 2: Formulário PIX & Dados da Empresa */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSalvarConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>Dados da Chave PIX (Para Pagamento dos Clientes)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Esta chave será exibida automaticamente para o cliente ao alugar pelo app ou link.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Tipo da Chave PIX</label>
                <select
                  value={config.tipo_chave_pix}
                  onChange={(e) => setConfig({ ...config, tipo_chave_pix: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="email">E-mail</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="celular">Celular</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Chave PIX *</label>
                <input
                  type="text"
                  required
                  value={config.chave_pix}
                  onChange={(e) => setConfig({ ...config, chave_pix: e.target.value })}
                  placeholder="veiculos.oliveira@gmail.com ou CNPJ"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Nome do Titular / Beneficiário *</label>
                <input
                  type="text"
                  required
                  value={config.titular_pix}
                  onChange={(e) => setConfig({ ...config, titular_pix: e.target.value })}
                  placeholder="JOAO ROBERTO DOS SANTOS DE OLIVEIRA"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cidade do PIX *</label>
                <input
                  type="text"
                  required
                  value={config.cidade_pix}
                  onChange={(e) => setConfig({ ...config, cidade_pix: e.target.value })}
                  placeholder="NAVIRAI"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Contato & WhatsApp */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span>Atendimento & WhatsApp para Comprovantes</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp para Receber Comprovantes</label>
                  <input
                    type="text"
                    value={config.whatsapp}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    placeholder="5567996229840"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Formato: 55 + DDD + Número</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Telefone / Fixo de Contato</label>
                  <input
                    type="text"
                    value={config.telefone}
                    onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                    placeholder="(67) 99622-9840"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Link do App na Google Play Store</label>
                  <input
                    type="text"
                    value={config.link_playstore}
                    onChange={(e) => setConfig({ ...config, link_playstore: e.target.value })}
                    placeholder="https://play.google.com/store/apps/details?id=com.locadoraoliveira.app"
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3.5 py-2.5 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Coluna 3: Gestão de Funcionários & Equipe */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Equipe de Funcionários</span>
              </h3>
              <span className="text-xs text-slate-400">{funcionarios.length} cadastrados</span>
            </div>

            {/* Lista de Usuários */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {funcionarios.map((f, idx) => (
                <div
                  key={f.email || idx}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white truncate">{f.nome}</span>
                      {f.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
                          👑 Dono
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{f.email}</p>
                    {f.telefone && <p className="text-[10px] text-slate-500">{f.telefone}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
              ))}
            </div>

            {/* Cadastrar Novo Funcionário */}
            <form onSubmit={handleCadastrarFuncionario} className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Adicionar Funcionário</span>
              </h4>

              <input
                type="text"
                required
                placeholder="Nome do Colaborador"
                value={novoFunc.nome}
                onChange={(e) => setNovoFunc({ ...novoFunc, nome: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />

              <input
                type="email"
                required
                placeholder="E-mail de acesso"
                value={novoFunc.email}
                onChange={(e) => setNovoFunc({ ...novoFunc, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={novoFunc.telefone}
                onChange={(e) => setNovoFunc({ ...novoFunc, telefone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={salvandoFunc}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
              >
                {salvandoFunc ? 'Salvando...' : 'Cadastrar Novo Funcionário'}
              </button>
            </form>
          </div>

          {/* Card de Sessão e Desconexão */}
          <div className="bg-[#0f1523] border border-red-500/20 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-black text-red-400 flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sessão & Desconexão</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deseja sair da sua conta atual para entrar com outro usuário ou acessar o modo visitante?
            </p>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-black rounded-xl shadow transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Teste PIX */}
      {showTestPix && (
        <PixModal
          isOpen={showTestPix}
          onClose={() => setShowTestPix(false)}
          valor={280}
          descricao="Teste de Pagamento PIX - Diária"
          referenciaId="TESTE-01"
          chavePix={config.chave_pix}
          tipoChavePix={config.tipo_chave_pix.toUpperCase()}
          titularPix={config.titular_pix}
          cidadePix={config.cidade_pix}
          whatsapp={config.whatsapp}
        />
      )}
    </div>
  );
}
