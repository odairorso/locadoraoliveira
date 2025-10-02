import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/checklist" element={<ChecklistDashboard />} />
          <Route path="/checklist/novo" element={<VistoriaForm />} />
          <Route path="/checklist/visualizar/:id" element={<VistoriaDetalhes />} />
          <Route path="/checklist/editar/:id" element={<VistoriaForm />} />
        </Routes>
      </Layout>
    </Router>
  );
}