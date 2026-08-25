import React, { useState, useEffect } from 'react';
import { 
  Calendar, MessageCircle, 
  Car, User, Search, QrCode,
  Trash2, Edit2, X, Save
} from 'lucide-react';
import { supabase } from '@/react-app/supabase';
import { formatCurrency, formatPhone, formatCPF } from '@/react-app/utils/formatters';
import PixModal from '@/react-app/components/PixModal';
import { useNetworkReconnect } from '@/react-app/hooks/useNetworkReconnect';
import type { SolicitacaoReserva, Veiculo } from '@/shared/types';

export default function ReservasPage() {
  const [reservas, setReservas] = useState<SolicitacaoReserva[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [search, setSearch] = useState('');
  
  const [selectedPixReserva, setSelectedPixReserva] = useState<SolicitacaoReserva | null>(null);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  // Estados para Modal de Edição de Reserva
  const [editingReserva, setEditingReserva] = useState<SolicitacaoReserva | null>(null);
  const [editVeiculoId, setEditVeiculoId] = useState<number>(0);
  const [editClienteNome, setEditClienteNome] = useState('');
  const [editClienteCpf, setEditClienteCpf] = useState('');
  const [editClienteTelefone, setEditClienteTelefone] = useState('');
  const [editDataInicio, setEditDataInicio] = useState('');
  const [editDataFim, setEditDataFim] = useState('');
  const [editDias, setEditDias] = useState<number>(1);
  const [editValorDiaria, setEditValorDiaria] = useState<number>(0);
  const [editValorTotal, setEditValorTotal] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'pendente' | 'aprovada' | 'rejeitada' | 'cancelada'>('pendente');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => {
    carregarReservas();
    carregarVeiculos();
    carregarConfig();
  }, []);

  // Reconecta automaticamente quando trocar de rede (Wi-Fi -> 4G)
  useNetworkReconnect(() => {
    carregarReservas();
    carregarVeiculos();
    carregarConfig();
  });

  const carregarConfig = async () => {
    try {
      const { data } = await supabase.from('configuracoes_empresa').select('*').limit(1).single();
      if (data) setConfigEmpresa(data);
    } catch { /* no-op: configuracao opcional */ }
  };

  const carregarVeiculos = async () => {
    try {
      const { data } = await supabase
        .from('veiculos')
        .select('*')
        .order('marca', { ascending: true });
      if (data) setVeiculos(data);
    } catch { /* no-op: veiculos opcional */ }
  };

  const carregarReservas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_reserva')
        .select('*, veiculo:veiculos(*)')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setReservas(data);
      } else {
        setReservas([]);
      }
    } catch (e) {
      console.warn('Erro ao carregar reservas:', e);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async (id: number, novoStatus: 'aprovada' | 'rejeitada' | 'cancelada') => {
    try {
      await supabase
        .from('solicitacoes_reserva')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      setReservas(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handleExcluirReserva = async (id: number, nomeCliente: string) => {
    if (!confirm(`Deseja realmente excluir a solicitação de reserva de "${nomeCliente}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitacoes_reserva')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReservas(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      alert('Erro ao excluir reserva: ' + (e?.message || 'Falha ao conectar com o banco.'));
    }
  };

  const abrirEdicao = (r: SolicitacaoReserva) => {
    setEditingReserva(r);
    setEditVeiculoId(r.veiculo_id);
    setEditClienteNome(r.cliente_nome || '');
    setEditClienteCpf(r.cliente_cpf || '');
    setEditClienteTelefone(r.cliente_telefone || '');
    setEditDataInicio(r.data_inicio || '');
    setEditDataFim(r.data_fim || '');
    setEditDias(r.dias || 1);
    setEditValorDiaria(r.valor_diaria || 0);
    setEditValorTotal(r.valor_total || 0);
    setEditStatus(r.status);
    setEditObservacoes(r.observacoes || '');
  };

  const handleVeiculoChange = (vId: number) => {
    setEditVeiculoId(vId);
    const vSel = veiculos.find(v => v.id === vId);
    if (vSel) {
      const diaria = Number(vSel.valor_diaria || 0);
      setEditValorDiaria(diaria);
      setEditValorTotal(diaria * editDias);
    }
  };

  const recalcularDatas = (inicio: string, fim: string, diaria: number) => {
    if (inicio && fim) {
      const d1 = new Date(inicio);
      const d2 = new Date(fim);
      const diffTime = d2.getTime() - d1.getTime();
      const numDias = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setEditDias(numDias);
      setEditValorTotal(numDias * (diaria || editValorDiaria));
    }
  };

  const salvarEdicaoReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReserva) return;

    setSalvandoEdicao(true);
    try {
      const dadosAtualizados = {
        veiculo_id: editVeiculoId,
        cliente_nome: editClienteNome.trim(),
        cliente_cpf: editClienteCpf.trim(),
        cliente_telefone: editClienteTelefone.trim(),
        data_inicio: editDataInicio,
        data_fim: editDataFim,
        dias: editDias,
        valor_diaria: editValorDiaria,
        valor_total: editValorTotal,
        status: editStatus,
        observacoes: editObservacoes.trim(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('solicitacoes_reserva')
        .update(dadosAtualizados)
        .eq('id', editingReserva.id);

      if (error) throw error;

      // Recarregar reservas atualizadas
      await carregarReservas();
      setEditingReserva(null);
    } catch (err: any) {
      alert('Erro ao salvar alterações da reserva: ' + (err?.message || 'Falha na conexão.'));
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleWhatsAppCliente = (r: SolicitacaoReserva) => {
    const msg = `Olá ${r.cliente_nome}! Aqui é da Oliveira Veículos sobre a sua solicitação de locação do ${
      r.veiculo ? `${r.veiculo.marca} ${r.veiculo.modelo}` : 'veículo'
    } (Período: ${r.data_inicio} até ${r.data_fim}). Podemos confirmar a sua reserva?`;

    const cleanNum = (r.cliente_telefone || '').replace(/\D/g, '');
    const num = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const reservasFiltradas = reservas.filter(r => {
    const matchStatus = filterStatus === 'todas' || r.status === filterStatus;
    const matchSearch = search === '' || 
      r.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      r.cliente_cpf.includes(search) ||
      (r.veiculo?.modelo || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Central de Reservas do App</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Solicitações de Reserva
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie, edite ou exclua pedidos de reserva enviados pelos clientes.
          </p>
        </div>

        <button
          onClick={carregarReservas}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          <span>Atualizar Pedidos</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, CPF ou carro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['todas', 'pendente', 'aprovada', 'rejeitada'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Reservas */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Carregando solicitações...</div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhuma solicitação encontrada</h3>
          <p className="text-xs text-slate-500 mt-1">
            Quando os clientes pedirem carros pelo aplicativo ou link, as solicitações aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservasFiltradas.map((reserva) => (
            <div
              key={reserva.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Reserva #{reserva.id}
                    </span>
                    <h3 className="text-base font-bold text-white flex items-center space-x-1.5 mt-0.5">
                      <User className="w-4 h-4 text-blue-400" />
                      <span>{reserva.cliente_nome}</span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        reserva.status === 'aprovada'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : reserva.status === 'rejeitada'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {reserva.status}
                    </span>

                    {/* Botão Editar Reserva */}
                    <button
                      onClick={() => abrirEdicao(reserva)}
                      title="Editar Reserva"
                      className="p-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Excluir Reserva */}
                    <button
                      onClick={() => handleExcluirReserva(reserva.id!, reserva.cliente_nome)}
                      title="Excluir Reserva"
                      className="p-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-500/30 transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Veículo & Período */}
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-white font-semibold">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>{reserva.veiculo ? `${reserva.veiculo.marca} ${reserva.veiculo.modelo} (${reserva.veiculo.ano})` : 'Veículo Selecionado'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    <span>Período: {reserva.data_inicio} a {reserva.data_fim}</span>
                    <span className="text-slate-300 font-bold">{reserva.dias} dias</span>
                  </div>
                </div>

                {/* Dados de Contato e Total */}
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p>CPF: <span className="text-slate-200">{reserva.cliente_cpf}</span></p>
                  <p>WhatsApp: <span className="text-slate-200">{reserva.cliente_telefone}</span></p>
                  {reserva.observacoes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-lg mt-1 border border-slate-800">
                      "{reserva.observacoes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Valor & Ações */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Previsto:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatCurrency(reserva.valor_total)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleWhatsAppCliente(reserva)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedPixReserva(reserva)}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver PIX</span>
                  </button>
                </div>

                {reserva.status === 'pendente' && (
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => handleAtualizarStatus(reserva.id!, 'aprovada')}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all"
                    >
                      Aprovar Reserva
                    </button>
                    <button
                      onClick={() => handleAtualizarStatus(reserva.id!, 'rejeitada')}
                      className="py-2 px-3 bg-slate-800 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição da Reserva */}
      {editingReserva && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <h3 className="text-sm font-bold">
                  Editar Reserva #{editingReserva.id}
                </h3>
              </div>
              <button 
                onClick={() => setEditingReserva(null)} 
                className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarEdicaoReserva} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Seleção do Carro */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  🚗 Veículo Escolhido *
                </label>
                <select
                  required
                  value={editVeiculoId}
                  onChange={(e) => handleVeiculoChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Selecione um veículo...</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.ano}) - Placa: {v.placa} - Diária: R$ {v.valor_diaria || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período (Datas) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data Início *</label>
                  <input
                    type="date"
                    required
                    value={editDataInicio}
                    onChange={(e) => {
                      setEditDataInicio(e.target.value);
                      recalcularDatas(e.target.value, editDataFim, editValorDiaria);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data Devolução *</label>
                  <input
                    type="date"
                    required
                    value={editDataFim}
                    onChange={(e) => {
                      setEditDataFim(e.target.value);
                      recalcularDatas(editDataInicio, e.target.value, editValorDiaria);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dias, Diária e Total */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Dias</label>
                  <input
                    type="number"
                    min={1}
                    value={editDias}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setEditDias(d);
                      setEditValorTotal(d * editValorDiaria);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Diária (R$)</label>
                  <input
                    type="number"
                    min={0}
                    value={editValorDiaria}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditValorDiaria(val);
                      setEditValorTotal(editDias * val);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-400 font-bold mb-0.5">Total (R$)</label>
                  <input
                    type="number"
                    min={0}
                    value={editValorTotal}
                    onChange={(e) => setEditValorTotal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg text-emerald-400 font-extrabold text-center"
                  />
                </div>
              </div>

              {/* Dados do Cliente */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={editClienteNome}
                  onChange={(e) => setEditClienteNome(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={editClienteCpf}
                    onChange={(e) => setEditClienteCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={editClienteTelefone}
                    onChange={(e) => setEditClienteTelefone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status da Reserva</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pendente">⏳ Pendente</option>
                  <option value="aprovada">✅ Aprovada</option>
                  <option value="rejeitada">❌ Rejeitada</option>
                  <option value="cancelada">🚫 Cancelada</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editObservacoes}
                  onChange={(e) => setEditObservacoes(e.target.value)}
                  placeholder="Informações adicionais da reserva..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReserva(null)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 disabled:opacity-60 flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PIX da Reserva */}
      {selectedPixReserva && (
        <PixModal
          isOpen={!!selectedPixReserva}
          onClose={() => setSelectedPixReserva(null)}
          valor={selectedPixReserva.valor_total}
          descricao={`Reserva #${selectedPixReserva.id} - ${selectedPixReserva.cliente_nome}`}
          referenciaId={selectedPixReserva.id}
          nomeCliente={selectedPixReserva.cliente_nome}
          chavePix={configEmpresa?.chave_pix || '17909442000158'}
          tipoChavePix={configEmpresa?.tipo_chave_pix || 'CNPJ'}
          titularPix={configEmpresa?.titular_pix || 'L DOS SANTOS DE OLIVEIRA LTDA'}
          cidadePix={configEmpresa?.cidade_pix || 'NAVIRAI'}
          whatsapp={configEmpresa?.whatsapp || '5567996229840'}
        />
      )}
    </div>
  );
}
