import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/react-app/contexts/AuthContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import Layout from "@/react-app/components/Layout";
import HomePage from "@/react-app/pages/Home";
import ClientesPage from "@/react-app/pages/Clientes";
import VeiculosPage from "@/react-app/pages/Veiculos";
import LocacoesPage from "@/react-app/pages/Locacoes";
import ManutencaoPage from "@/react-app/pages/Manutencao";
import RelatoriosPage from "@/react-app/pages/Relatorios";
import ChecklistDashboard from "@/react-app/pages/ChecklistDashboard";
import VistoriaForm from "@/react-app/pages/VistoriaForm";
import VistoriaDetalhes from "@/react-app/pages/VistoriaDetalhes";
import CatalogoClientePage from "@/react-app/pages/CatalogoCliente";
import LoginPage from "@/react-app/pages/Login";
import ConfiguracoesPage from "@/react-app/pages/Configuracoes";
import ReservasPage from "@/react-app/pages/Reservas";
import MeuPerfilPage from "@/react-app/pages/MeuPerfil";

function AppRoutes() {
  const { isFuncionario, isAdmin, isCliente, user, loading } = useAuth();
  const isLoggedIn = !!user || isFuncionario || isCliente;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-amber-400 font-bold text-sm tracking-wide">Carregando Sistema Oliveira...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Rota inicial: se funcionário/dono abre Dashboard, se cliente abre Catálogo, se visitante abre Login */}
        <Route path="/" element={
          isFuncionario 
            ? <HomePage /> 
            : (isCliente ? <CatalogoClientePage /> : <LoginPage />)
        } />
        <Route path="/catalogo" element={<CatalogoClientePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Meu Perfil — disponível para qualquer usuário logado */}
        <Route path="/meu-perfil" element={isLoggedIn ? <MeuPerfilPage /> : <LoginPage />} />
        
        {/* Rotas restritas para Dono e Funcionários */}
        <Route path="/reservas" element={isFuncionario ? <ReservasPage /> : <Navigate to="/login" replace />} />
        <Route path="/clientes" element={isFuncionario ? <ClientesPage /> : <Navigate to="/login" replace />} />
        <Route path="/veiculos" element={isFuncionario ? <VeiculosPage /> : <Navigate to="/login" replace />} />
        <Route path="/locacoes" element={isFuncionario ? <LocacoesPage /> : <Navigate to="/login" replace />} />
        <Route path="/manutencao" element={isFuncionario ? <ManutencaoPage /> : <Navigate to="/login" replace />} />
        <Route path="/checklist" element={isFuncionario ? <ChecklistDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/checklist/novo" element={isFuncionario ? <VistoriaForm /> : <Navigate to="/login" replace />} />
        <Route path="/checklist/visualizar/:id" element={isFuncionario ? <VistoriaDetalhes /> : <Navigate to="/login" replace />} />
        <Route path="/checklist/editar/:id" element={isFuncionario ? <VistoriaForm /> : <Navigate to="/login" replace />} />
        
        {/* Rota exclusiva do Dono / Admin */}
        <Route path="/relatorios" element={isAdmin ? <RelatoriosPage /> : <Navigate to="/login" replace />} />
        <Route path="/configuracoes" element={isAdmin ? <ConfiguracoesPage /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}