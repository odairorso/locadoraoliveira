import { BrowserRouter as Router, Routes, Route } from "react-router";
import Layout from "@/react-app/components/Layout";
import HomePage from "@/react-app/pages/Home";
import ClientesPage from "@/react-app/pages/Clientes";
import VeiculosPage from "@/react-app/pages/Veiculos";
import LocacoesPage from "@/react-app/pages/Locacoes";
import RelatoriosPage from "@/react-app/pages/Relatorios";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/veiculos" element={<VeiculosPage />} />
          <Route path="/locacoes" element={<LocacoesPage />} />
          <Route path="/vendas" element={<div className="p-8 text-center text-gray-500">Módulo de Vendas em desenvolvimento</div>} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
