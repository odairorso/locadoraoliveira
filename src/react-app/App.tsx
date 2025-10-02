import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/react-app/components/Layout";
import HomePage from "@/react-app/pages/Home";
import ClientesPage from "@/react-app/pages/Clientes";
import VeiculosPage from "@/react-app/pages/Veiculos";
import LocacoesPage from "@/react-app/pages/Locacoes";
import ManutencaoPage from "@/react-app/pages/Manutencao";
import CheckListPage from "@/react-app/pages/Checklist";
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
          <Route path="/manutencao" element={<ManutencaoPage />} />
          <Route path="/vendas" element={<CheckListPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}