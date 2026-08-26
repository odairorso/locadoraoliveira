import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Users, 
  FileText, 
  BarChart3, 
  Menu, 
  X,
  Home,
  Wrench,
  ClipboardList,
  QrCode,
  Settings,
  CalendarCheck,
  LogOut,
  ShieldCheck,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { useAppTheme } from '@/react-app/contexts/ThemeContext';
import ShareVehicleModal from '@/react-app/components/ShareVehicleModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, perfil, isAdmin, isFuncionario, logout } = useAuth();
  const { themeModel, setThemeModel } = useAppTheme();

  const isGold = themeModel === 'gold_minimal';

  // Itens de navegação completos baseados no perfil
  const getNavItems = () => {
    if (role === 'cliente' || role === 'visitante') {
      return [
        { name: 'Catálogo de Carros (Livre)', href: '/catalogo', icon: Car, color: 'text-amber-400' },
        { name: 'Meu Perfil & Senha', href: '/meu-perfil', icon: User, color: 'text-emerald-400' },
        { name: 'Fazer Login / Minha Conta', href: '/login', icon: ShieldCheck, color: 'text-blue-400' }
      ];
    }

    const items = [
      { name: 'Dashboard / Início', href: '/', icon: Home, color: 'text-blue-400' },
      { name: 'Gestão de Veículos (Frota)', href: '/veiculos', icon: Car, color: 'text-emerald-400' },
      { name: 'Clientes Cadastrados', href: '/clientes', icon: Users, color: 'text-cyan-400' },
      { name: 'Locações & Contratos', href: '/locacoes', icon: FileText, color: 'text-indigo-400' },
      { name: 'Solicitações de Reserva', href: '/reservas', icon: CalendarCheck, color: 'text-amber-400' },
      { name: 'Check List & Vistorias', href: '/checklist', icon: ClipboardList, color: 'text-purple-400' },
      { name: 'Manutenção de Carros', href: '/manutencao', icon: Wrench, color: 'text-rose-400' },
      { name: 'Catálogo Público (Cliente)', href: '/catalogo', icon: Car, color: 'text-blue-300' },
      { name: 'Meu Perfil & Senha', href: '/meu-perfil', icon: User, color: 'text-emerald-400' },
    ];

    if (isAdmin) {
      items.push({ name: 'Relatórios Financeiros & Lucro', href: '/relatorios', icon: BarChart3, color: 'text-amber-400' });
      items.push({ name: 'Configurações & Chave PIX', href: '/configuracoes', icon: Settings, color: 'text-slate-300' });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black pb-24 md:pb-0">
      
      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />

          <div className="relative flex-1 flex flex-col max-w-[310px] w-full bg-[#0d111a] border-r border-slate-800 shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {/* Header da Gaveta */}
            <div className="flex items-center justify-between pt-10 pb-3 px-4 border-b border-slate-800 bg-[#090d15]">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  isGold 
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-black shadow-amber-500/20' 
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
                }`}>
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-black text-white leading-tight">Oliveira</h1>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">v2.7.0</span>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isGold ? 'text-amber-400' : 'text-blue-400'}`}>
                    Veículos & Locação
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>



            {/* Seletor de Modelo Visual Mobile */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-800/80 bg-[#090d15]/50">
              <span className="text-[10px] font-extrabold text-slate-400 block mb-1.5 uppercase tracking-wider text-center">
                🎨 Escolha o Modelo Visual do App:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setThemeModel('gold_minimal')}
                  className={`py-2 px-2 text-xs font-black rounded-xl border transition-all flex flex-col items-center justify-center ${
                    isGold
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30 font-black'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-[11px]">🌟 Dourado Clean</span>
                  <span className="text-[9px] opacity-80 font-normal">Modelo 1 (Print)</span>
                </button>
                <button
                  onClick={() => setThemeModel('vibrant_multicolor')}
                  className={`py-2 px-2 text-xs font-black rounded-xl border transition-all flex flex-col items-center justify-center ${
                    !isGold
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 font-black'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-blue-500/40'
                  }`}
                >
                  <span className="text-[11px]">🌈 Colorido</span>
                  <span className="text-[9px] opacity-80 font-normal">Modelo 2</span>
                </button>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex-1 h-0 py-3 overflow-y-auto px-3 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 my-1">
                Navegação
              </p>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-xl transition-all active:scale-98 ${
                      isActive
                        ? isGold
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 border border-amber-400/50'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white bg-slate-950/40 border border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? (isGold ? 'text-black' : 'text-white') : item.color}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 opacity-60 ${isActive ? (isGold ? 'text-black' : 'text-white') : 'text-slate-500'}`} />
                  </Link>
                );
              })}
            </div>

            {/* Rodapé do Usuário */}
            <div className="p-4 border-t border-slate-800 bg-[#090d15]">
              {perfil || role !== 'visitante' ? (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0 ${
                      isGold ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                    }`}>
                      {(() => {
                        const n = perfil?.nome || 'Usuário';
                        const p = n.trim().split(' ');
                        return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {perfil?.nome || 'Usuário Conectado'}
                      </p>
                      <p className={`text-[10px] font-semibold ${isGold ? 'text-amber-400' : 'text-blue-400'}`}>
                        {isAdmin ? '👑 Administrador' : role === 'funcionario' ? '👔 Funcionário' : '🚗 Cliente'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta / Trocar Usuário</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs shadow-md active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Acessar / Fazer Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d111a] border-r border-slate-800 shadow-2xl">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center px-6 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg mr-3 ${
                isGold 
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-black shadow-amber-500/20' 
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
              }`}>
                <Car className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-extrabold text-white">Oliveira</h1>
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">v2.7.0</span>
                </div>
                <p className={`text-xs font-semibold ${isGold ? 'text-amber-400' : 'text-blue-400'}`}>Veículos App</p>
              </div>
            </div>



            {/* Seletor de Modelo Visual Desktop */}
            <div className="px-4 mb-3">
              <div className="bg-[#080b11] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-extrabold text-slate-400 block mb-1.5 uppercase tracking-wider text-center">
                  🎨 Modelo Visual do App:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setThemeModel('gold_minimal')}
                    className={`py-1.5 px-1 text-[11px] font-black rounded-lg transition-all text-center ${
                      isGold ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
                    }`}
                  >
                    🌟 Dourado Clean
                  </button>
                  <button
                    onClick={() => setThemeModel('vibrant_multicolor')}
                    className={`py-1.5 px-1 text-[11px] font-black rounded-lg transition-all text-center ${
                      !isGold ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'
                    }`}
                  >
                    🌈 Colorido
                  </button>
                </div>
              </div>
            </div>

            {/* Nav List */}
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                      isActive
                        ? isGold
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 font-black'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`mr-3 h-4 w-4 ${isActive ? (isGold ? 'text-black' : 'text-white') : item.color}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Footer Desktop */}
          <div className="p-4 border-t border-slate-800 bg-[#090d15]">
            {perfil ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0 ${
                    isGold ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                  }`}>
                    {(() => {
                      const n = perfil.nome || 'Usuário';
                      const p = n.trim().split(' ');
                      return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {perfil.nome}
                    </p>
                    <p className={`text-[10px] truncate ${isGold ? 'text-amber-400' : 'text-blue-400'}`}>
                      {isAdmin ? '👑 Dono / Administrador' : role === 'funcionario' ? '👔 Funcionário' : '🚗 Cliente'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar / Acesso Equipe</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar for Mobile */}
        <header className="sticky top-0 z-30 md:hidden bg-[#0c1018]/95 backdrop-blur-xl border-b border-slate-800 pt-10 pb-3.5 px-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center active:scale-95 transition-all shadow-md ${
                isGold ? 'text-amber-400 hover:text-white' : 'text-blue-400 hover:text-white'
              }`}
              title="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                isGold ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
              }`}>
                <Car className="w-4 h-4 font-bold" />
              </div>
              <div>
                <span className="font-black text-sm text-white tracking-tight block leading-tight">Oliveira Veículos</span>
                <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 inline-block leading-none">v2.7.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowShareModal(true)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors active:scale-95 ${
                isGold 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black' 
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white'
              }`}
              title="Compartilhar Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c1018]/95 backdrop-blur-2xl border-t border-slate-800 px-1 pt-1.5 pb-3 shadow-2xl">
        <div className="flex items-center justify-around">
          {/* 1. Início */}
          <Link
            to={isFuncionario ? '/' : '/catalogo'}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              location.pathname === '/'
                ? isGold ? 'text-amber-400 font-bold scale-105' : 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-semibold">Início</span>
          </Link>

          {/* 2. Gestão de Veículos */}
          {isFuncionario ? (
            <Link
              to="/veiculos"
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                location.pathname === '/veiculos'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">Veículos</span>
            </Link>
          ) : (
            <Link
              to="/catalogo"
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                location.pathname === '/catalogo'
                  ? isGold ? 'text-amber-400 font-bold scale-105' : 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">Catálogo</span>
            </Link>
          )}

          {/* 3. Clientes */}
          {isFuncionario && (
            <Link
              to="/clientes"
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                location.pathname === '/clientes'
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">Clientes</span>
            </Link>
          )}

          {/* 4. Locações */}
          {isFuncionario ? (
            <Link
              to="/locacoes"
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                location.pathname === '/locacoes'
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">Locações</span>
            </Link>
          ) : (
            <a
              href="https://wa.me/5567996229840"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center py-1 px-2.5 rounded-xl text-emerald-400 hover:text-emerald-300"
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">WhatsApp</span>
            </a>
          )}

          {/* 5. Menu Geral */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all"
          >
            <SlidersHorizontal className={`w-5 h-5 ${isGold ? 'text-amber-400' : 'text-blue-400'}`} />
            <span className="text-[10px] mt-0.5 font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <ShareVehicleModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}