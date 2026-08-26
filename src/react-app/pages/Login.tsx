import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, ArrowRight, Eye, EyeOff, User, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { formatCPF, formatCNPJ, formatPhone } from '@/react-app/utils/formatters';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, registerClient } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro'>('login');

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estados de Cadastro (Cliente)
  const [nome, setNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [cadPassword, setCadPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCadPassword, setShowCadPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Por favor, informe o e-mail e a senha de acesso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.error || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !cadEmail.trim() || !telefone.trim() || !documento.trim() || !cadPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (cadPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (cadPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    const res = await registerClient({
      nome: nome.trim(),
      email: cadEmail.trim(),
      telefone: telefone.trim(),
      cpf_cnpj: documento.trim(),
      senha: cadPassword
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/catalogo');
      }, 1200);
    } else {
      setError(res.error || 'Erro ao realizar cadastro.');
    }
  };

  const handleEnterAsGuest = () => {
    navigate('/catalogo');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glows de Fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo & Marca */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/20 text-black">
            <Car className="w-9 h-9" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-3xl font-black text-white tracking-tight">
          Oliveira <span className="text-amber-400">Veículos</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Acesso ao Sistema • Gestão, Locações e Catálogo
        </p>

        {/* Abas Alternadoras: Entrar vs Cadastre-se */}
        <div className="mt-6 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Fazer Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('cadastro'); setError(null); }}
            className={`py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'cadastro'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-6 px-6 sm:px-8 rounded-3xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 text-center font-bold flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= ABA 1: LOGIN ================= */}
          {activeTab === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail de Acesso *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ex: seuemail@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================= ABA 2: CADASTRO ================= */}
          {activeTab === 'cadastro' && (
            <form className="space-y-3.5" onSubmit={handleCadastro}>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={cadEmail}
                    onChange={(e) => setCadEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Celular / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(67) 99999-9999"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">CPF ou CNPJ *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={documento}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setDocumento(raw.length > 11 ? formatCNPJ(e.target.value) : formatCPF(e.target.value));
                      }}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Criar Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type={showCadPassword ? 'text' : 'password'}
                      required
                      value={cadPassword}
                      onChange={(e) => setCadPassword(e.target.value)}
                      placeholder="Mín. 6 dígitos"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCadPassword(!showCadPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCadPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Confirmar *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type={showCadPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Criando Conta...' : 'Cadastrar e Acessar Catálogo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Atalho Catálogo de Carros Sem Login */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              onClick={handleEnterAsGuest}
              className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl py-2 px-3 transition-colors w-full justify-center"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>Ver Catálogo de Carros (Sem Login)</span>
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Oliveira Veículos • Naviraí - MS • Contato: (67) 99622-9840
        </p>
      </div>
    </div>
  );
}
