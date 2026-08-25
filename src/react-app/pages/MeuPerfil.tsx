import { useState, useEffect } from 'react';
import { User, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { supabase } from '@/react-app/supabase';
import { formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/react-app/utils/formatters';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function MeuPerfil() {
  const { user, perfil, role } = useAuth();
  const navigate = useNavigate();

  // Estados dos dados cadastrais (padrão do sistema)
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [nome, setNome] = useState(perfil?.nome || '');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [celular, setCelular] = useState(perfil?.telefone || '');
  const [email] = useState(user?.email || '');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [cidade, setCidade] = useState('Naviraí');
  const [estado, setEstado] = useState('MS');

  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [carregandoDadosIniciais, setCarregandoDadosIniciais] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [msgDados, setMsgDados] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const labelRole =
    role === 'admin' ? '👑 Administrador' :
    role === 'funcionario' ? '👔 Funcionário' :
    '🚗 Cliente';

  // Buscar dados existentes na tabela clientes ou perfis ao carregar a página
  useEffect(() => {
    async function carregarDadosCompletos() {
      const userEmail = user?.email?.toLowerCase()?.trim();
      if (!userEmail) {
        setCarregandoDadosIniciais(false);
        return;
      }

      try {
        // 1. Tenta buscar da tabela clientes primeiro (onde ficam os dados completos para contratos)
        const { data: clienteDb } = await supabase
          .from('clientes')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle();

        if (clienteDb) {
          setNome(clienteDb.nome || '');
          setTipoPessoa(clienteDb.tipo_pessoa === 'pj' ? 'pj' : 'pf');
          setCpfCnpj(clienteDb.cpf_cnpj || clienteDb.documento || '');
          setCelular(clienteDb.celular || clienteDb.telefone || '');
          setEndereco(clienteDb.endereco || '');
          setBairro(clienteDb.bairro || '');
          setCep(clienteDb.cep || '');
          setCidade(clienteDb.cidade || 'Naviraí');
          setEstado(clienteDb.estado || 'MS');
        } else {
          // 2. Se não encontrar em clientes, busca de perfis
          const { data: perfilDb } = await supabase
            .from('perfis')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();

          if (perfilDb) {
            setNome(perfilDb.nome || '');
            setCelular(perfilDb.telefone || '');
            if (perfilDb.endereco) setEndereco(perfilDb.endereco);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados complementares:', err);
      } finally {
        setCarregandoDadosIniciais(false);
      }
    }

    carregarDadosCompletos();
  }, [user]);

  const handleCpfCnpjChange = (val: string) => {
    const formatted = tipoPessoa === 'pj' ? formatCNPJ(val) : formatCPF(val);
    setCpfCnpj(formatted);
  };

  const handleCelularChange = (val: string) => {
    setCelular(formatPhone(val));
  };

  const handleCepChange = (val: string) => {
    setCep(formatCEP(val));
  };

  const salvarDados = async () => {
    if (!nome.trim()) {
      setMsgDados({ tipo: 'erro', texto: 'O nome completo é obrigatório.' });
      return;
    }

    setLoadingDados(true);
    setMsgDados(null);

    try {
      const userEmail = user?.email?.toLowerCase()?.trim();
      if (!userEmail) throw new Error('Sessão de usuário não identificada.');

      // 1. Atualizar metadados no Supabase Auth
      await supabase.auth.updateUser({
        data: {
          name: nome.trim(),
          phone: celular.trim()
        }
      });

      // 2. Atualizar ou Criar registro na tabela 'clientes' (necessário para contratos e locações)
      const dadosCliente = {
        nome: nome.trim(),
        tipo_documento: tipoPessoa === 'pj' ? 'CNPJ' : 'CPF',
        documento: cpfCnpj.trim(),
        celular: celular.trim(),
        email: userEmail,
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        cep: cep.trim(),
      };

      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .ilike('email', userEmail)
        .maybeSingle();

      if (clienteExistente?.id) {
        await supabase
          .from('clientes')
          .update(dadosCliente)
          .eq('id', clienteExistente.id);
      } else {
        await supabase
          .from('clientes')
          .insert([dadosCliente]);
      }

      // 3. Atualizar na tabela 'perfis'
      await supabase.from('perfis').upsert([{
        email: userEmail,
        nome: nome.trim(),
        telefone: celular.trim(),
        role,
        ativo: true
      }], { onConflict: 'email' });

      setMsgDados({ tipo: 'ok', texto: 'Dados cadastrais salvos com sucesso! Prontos para geração de contratos.' });
    } catch (e: any) {
      setMsgDados({ tipo: 'erro', texto: e?.message || 'Erro ao salvar os dados.' });
    } finally {
      setLoadingDados(false);
    }
  };

  const trocarSenha = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A nova senha precisa ter pelo menos 6 caracteres.' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'As senhas não conferem. Digite igual nos dois campos.' });
      return;
    }

    setLoadingSenha(true);
    setMsgSenha(null);

    try {
      // Validar senha atual com login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: senhaAtual
      });

      if (loginError) {
        setMsgSenha({ tipo: 'erro', texto: 'Senha atual incorreta. Verifique e tente novamente.' });
        setLoadingSenha(false);
        return;
      }

      // Atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
      if (updateError) throw updateError;

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso!' });
    } catch (e: any) {
      setMsgSenha({ tipo: 'erro', texto: e?.message || 'Erro ao alterar a senha.' });
    } finally {
      setLoadingSenha(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Meu Perfil & Cadastro</h1>
          <p className="text-xs text-slate-400 truncate">{labelRole} • {user?.email}</p>
        </div>
      </div>

      {/* Card Dados Cadastrais Padrão Sistema Web */}
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Dados Cadastrais (Padrão Contrato)</h2>
          </div>
          {carregandoDadosIniciais && (
            <span className="text-xs text-amber-400 animate-pulse">Carregando dados...</span>
          )}
        </div>

        {/* Tipo de Pessoa */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Pessoa *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoPessoa('pf');
                setCpfCnpj('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                tipoPessoa === 'pf'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Pessoa Física</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoPessoa('pj');
                setCpfCnpj('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                tipoPessoa === 'pj'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pessoa Jurídica</span>
            </button>
          </div>
        </div>

        {/* Nome Completo / Razão Social */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {tipoPessoa === 'pj' ? 'Razão Social *' : 'Nome Completo *'}
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={tipoPessoa === 'pj' ? 'Razão social da empresa' : 'Nome completo'}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* CPF/CNPJ e Celular */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {tipoPessoa === 'pj' ? 'CNPJ *' : 'CPF *'}
            </label>
            <input
              type="text"
              required
              maxLength={tipoPessoa === 'pj' ? 18 : 14}
              value={cpfCnpj}
              onChange={(e) => handleCpfCnpjChange(e.target.value)}
              placeholder={tipoPessoa === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Celular *</label>
            <input
              type="text"
              required
              maxLength={15}
              value={celular}
              onChange={(e) => handleCelularChange(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail *</label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs cursor-not-allowed"
          />
        </div>

        {/* Endereço (Rua e Número) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço (Rua e Número) *</label>
          <input
            type="text"
            required
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Ex: Rua Trevo, 757"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Bairro e CEP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro *</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Centro"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">CEP *</label>
            <input
              type="text"
              maxLength={9}
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade *</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Naviraí"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Estado *</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            >
              {ESTADOS_BRASIL.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {msgDados && (
          <div className={`flex items-center space-x-2 p-3.5 rounded-xl text-xs font-bold ${
            msgDados.tipo === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {msgDados.tipo === 'ok'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{msgDados.texto}</span>
          </div>
        )}

        <button
          type="button"
          onClick={salvarDados}
          disabled={loadingDados}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg shadow-amber-500/20 disabled:opacity-60"
        >
          {loadingDados ? (
            <span>Salvando dados...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Dados Cadastrais</span>
            </>
          )}
        </button>
      </div>

      {/* Card Alterar Senha */}
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-black text-white">Alterar Senha de Acesso</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Senha Atual *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                placeholder="Digite a senha atual"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSenhaAtual(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nova Senha * (min. 6 dígitos)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmar Nova Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {msgSenha && (
          <div className={`flex items-center space-x-2 p-3.5 rounded-xl text-xs font-bold ${
            msgSenha.tipo === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {msgSenha.tipo === 'ok'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{msgSenha.texto}</span>
          </div>
        )}

        <button
          type="button"
          onClick={trocarSenha}
          disabled={loadingSenha}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-60"
        >
          {loadingSenha ? (
            <span>Alterando senha...</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirmar Nova Senha</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
