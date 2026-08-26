import { useState, useEffect, useMemo } from 'react';
import { 
  Car, Search, Sparkles, Share2, 
  MessageCircle, Snowflake, Gauge, CheckCircle2,
  ArrowRight, Zap, UserPlus, X, Check
} from 'lucide-react';
import { supabase } from '@/react-app/supabase';
import { formatCurrency } from '@/react-app/utils/formatters';
import ShareVehicleModal from '@/react-app/components/ShareVehicleModal';
import { useNetworkReconnect } from '@/react-app/hooks/useNetworkReconnect';
import type { Veiculo, SolicitacaoReserva, ConfiguracaoEmpresa } from '@/shared/types';

export default function CatalogoClientePage() {
  // O catálogo expõe apenas campos públicos do veículo (sem renavam/campos internos)
  const [veiculos, setVeiculos] = useState<Partial<Veiculo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [selectedVeiculo, setSelectedVeiculo] = useState<Partial<Veiculo> | null>(null);
  
  // Modais
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCadastroClienteModal, setShowCadastroClienteModal] = useState(false);
  const [veiculoToShare, setVeiculoToShare] = useState<Partial<Veiculo> | null>(null);

  // Cadastro de Cliente Direto
  const [cadastroForm, setCadastroForm] = useState({
    nome: '',
    cpf_cnpj: '',
    celular: '',
    email: '',
    cidade: 'Naviraí',
    estado: 'MS',
    endereco: '',
    bairro: ''
  });
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);

  // Configurações da Empresa
  const [configEmpresa, setConfigEmpresa] = useState<ConfiguracaoEmpresa>({
    nome_empresa: 'Oliveira Veículos',
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
    link_playstore: 'https://play.google.com/store/apps/details?id=com.locadoraoliveira.app'
  });

  // Formulário de Reserva Completo
  const [reservaForm, setReservaForm] = useState({
    cliente_nome: '',
    cliente_cpf: '',
    cliente_telefone: '',
    cliente_email: '',
    endereco: '',
    bairro: '',
    cidade: 'Naviraí',
    estado: 'MS',
    cep: '79950-000',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    observacoes: ''
  });

  const [reservaSucesso, setReservaSucesso] = useState(false);
  const [reservaCriadaId, setReservaCriadaId] = useState<number | null>(null);
  const [enviandoReserva, setEnviandoReserva] = useState(false);


  useEffect(() => {
    fetchVeiculos();
    fetchConfig();

    const params = new URLSearchParams(window.location.search);
    const veiculoId = params.get('veiculo');
    if (veiculoId) {
      supabase
        .from('veiculos')
        .select('id, marca, modelo, ano, placa, cor, valor_diaria, valor_veiculo, tipo_operacao, status, foto_principal, fotos, transmissao, combustivel, passageiros, tem_ar_condicionado, tem_direcao_hidraulica, tem_vidro_eletrico, descricao')
        .eq('id', veiculoId)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedVeiculo(data);
            setShowReservaModal(true);
          }
        });
    }
  }, []);

  // Reconecta automaticamente quando trocar de rede (Wi-Fi -> 4G)
  useNetworkReconnect(() => {
    fetchVeiculos();
    fetchConfig();
  });

  const fetchConfig = async () => {
    try {
      const { data } = await supabase.from('configuracoes_empresa').select('*').limit(1).single();
      if (data) setConfigEmpresa(data);
    } catch { /* no-op: configuracoes opcional */ }
  };

  const fetchVeiculos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('veiculos')
        // Colunas públicas do catálogo: SEM renavam (documento do veículo)
        .select('id, marca, modelo, ano, placa, cor, valor_diaria, valor_veiculo, tipo_operacao, status, foto_principal, fotos, transmissao, combustivel, passageiros, tem_ar_condicionado, tem_direcao_hidraulica, tem_vidro_eletrico, descricao')
        .order('valor_diaria', { ascending: true });

      if (data && !error) {
        setVeiculos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter(v => {
      const matchSearch = searchTerm === '' || 
        `${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      if (categoriaFiltro === 'economico') return (v.valor_diaria || 0) <= 280;
      if (categoriaFiltro === 'sedan_suv') return (v.valor_diaria || 0) > 280;

      return true;
    });
  }, [veiculos, searchTerm, categoriaFiltro]);

  const calcularTotalReserva = () => {
    if (!selectedVeiculo || !reservaForm.data_inicio || !reservaForm.data_fim) return { dias: 1, total: 0, valido: false };
    // '+T00:00:00' evita que 'yyyy-mm-dd' seja interpretado como UTC meia-noite
    const inicio = new Date(reservaForm.data_inicio + 'T00:00:00');
    const fim = new Date(reservaForm.data_fim + 'T00:00:00');
    if (fim < inicio) return { dias: 0, total: 0, valido: false };
    const diffTime = fim.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const diaria = selectedVeiculo.valor_diaria || 0;
    return {
      dias: diffDays,
      total: diffDays * diaria,
      valido: true
    };
  };

  const handleOpenReserva = (veiculo: Partial<Veiculo>) => {
    setSelectedVeiculo(veiculo);
    setShowReservaModal(true);
    setReservaSucesso(false);
  };

  const handleOpenShare = (veiculo: Partial<Veiculo>, e: React.MouseEvent) => {
    e.stopPropagation();
    setVeiculoToShare(veiculo);
    setShowShareModal(true);
  };

  // Salvar cadastro direto de cliente
  const handleSalvarCadastroCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastroForm.nome || !cadastroForm.celular) {
      alert('Por favor, preencha pelo menos Nome e Celular/WhatsApp.');
      return;
    }

    setCadastrando(true);
    try {
      const { error } = await supabase.from('clientes').insert([{
        nome: cadastroForm.nome,
        documento: cadastroForm.cpf_cnpj || '000.000.000-00',
        celular: cadastroForm.celular,
        email: cadastroForm.email || '',
        endereco: cadastroForm.endereco || 'Naviraí',
        bairro: cadastroForm.bairro || 'Centro',
        cidade: cadastroForm.cidade || 'Naviraí',
        estado: cadastroForm.estado || 'MS',
        cep: '79950-000',
        tipo_documento: 'CPF'
      }]);

      if (!error) {
        setCadastroSucesso(true);
      } else {
        alert('Não foi possível cadastrar: ' + (error.message || 'erro desconhecido'));
      }
    } catch (err: any) {
      alert('Não foi possível cadastrar: ' + (err?.message || 'erro desconhecido'));
    } finally {
      setCadastrando(false);
    }
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeiculo) return;

    const { dias, total, valido } = calcularTotalReserva();
    if (!valido) {
      alert('A data final deve ser maior ou igual à data inicial.');
      return;
    }

    setEnviandoReserva(true);

    try {
      // 1. Cadastra cliente se não existir
      if (reservaForm.cliente_nome) {
        try {
          await supabase.from('clientes').insert([{
            nome: reservaForm.cliente_nome,
            documento: reservaForm.cliente_cpf || '000.000.000-00',
            celular: reservaForm.cliente_telefone || '',
            email: reservaForm.cliente_email || '',
            endereco: reservaForm.endereco || 'Naviraí',
            bairro: reservaForm.bairro || 'Centro',
            cidade: reservaForm.cidade || 'Naviraí',
            estado: reservaForm.estado || 'MS',
            cep: reservaForm.cep || '79950-000',
            tipo_documento: 'CPF'
          }]).select().single();
        } catch (clientErr) {
          console.log('Cliente já existe ou registrado:', clientErr);
        }
      }

      // 2. Insere na tabela solicitacoes_reserva
      const payload: Partial<SolicitacaoReserva> = {
        veiculo_id: selectedVeiculo.id,
        cliente_nome: reservaForm.cliente_nome,
        cliente_cpf: reservaForm.cliente_cpf,
        cliente_telefone: reservaForm.cliente_telefone,
        cliente_email: reservaForm.cliente_email,
        data_inicio: reservaForm.data_inicio,
        data_fim: reservaForm.data_fim,
        dias,
        valor_diaria: selectedVeiculo.valor_diaria || 0,
        valor_total: total,
        forma_pagamento: 'pix',
        status: 'pendente',
        observacoes: reservaForm.observacoes
      };

      const { data, error } = await supabase
        .from('solicitacoes_reserva')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setReservaCriadaId(data?.id || Math.floor(Math.random() * 9000) + 1000);
      setReservaSucesso(true);
    } catch (err: any) {
      console.error('Erro ao enviar reserva:', err);
      alert('Não foi possível enviar a solicitação: ' + (err?.message || 'Tente novamente mais tarde.'));
    } finally {
      setEnviandoReserva(false);
    }
  };

  const getVehiclePhoto = (veiculo: Partial<Veiculo>) => {
    if (veiculo.foto_principal) return veiculo.foto_principal;
    if (veiculo.fotos && veiculo.fotos.length > 0) return veiculo.fotos[0];
    
    const m = (veiculo.modelo || '').toLowerCase();
    if (m.includes('onix')) return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
    if (m.includes('polo')) return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80';
    if (m.includes('gol')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
    if (m.includes('saveiro')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';
    if (m.includes('t cross') || m.includes('t-cross')) return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-24 selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-emerald-600/10 blur-[140px]" />
        <div className="absolute bottom-20 -left-40 w-[500px] h-[500px] bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Hero Header Section */}
      <div className="relative z-10 pt-6 sm:pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Locadora Oficial • Naviraí - MS</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Escolha seu <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Próximo Carro</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl font-normal leading-relaxed">
              Carros revisados, com ar-condicionado, seguro e a melhor diária de Mato Grosso do Sul. Pague via PIX com liberação imediata.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Botão Cadastre-se Direto */}
            <button
              onClick={() => {
                setCadastroSucesso(false);
                setShowCadastroClienteModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastre-se como Cliente</span>
            </button>

            <a
              href={`https://wa.me/${configEmpresa.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: (67) 99622-9840</span>
            </a>

            <button
              onClick={() => {
                setVeiculoToShare(null);
                setShowShareModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar Link</span>
            </button>
          </div>
        </div>

        {/* Floating Filter & Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-2xl border border-white/[0.08] p-3 rounded-2xl shadow-2xl">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por modelo, marca (Onix, Gol, Polo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'todos', label: `Todos (${veiculosFiltrados.length})` },
              { id: 'economico', label: 'Econômicos (até R$ 280)' },
              { id: 'sedan_suv', label: 'Sedans & Utilitários' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoriaFiltro === cat.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">Carregando catálogo de veículos...</p>
          </div>
        ) : veiculosFiltrados.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl mt-6 p-8">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-bold text-white">Nenhum veículo encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {veiculosFiltrados.map((veiculo) => {
              const disponivel = veiculo.status === 'disponivel';
              return (
                <div
                  key={veiculo.id}
                  onClick={() => disponivel && handleOpenReserva(veiculo)}
                  className={`group relative bg-slate-900/90 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
                    disponivel 
                      ? 'hover:border-blue-500/50 hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer' 
                      : 'opacity-70'
                  }`}
                >
                  {/* Photo with Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={getVehiclePhoto(veiculo)}
                      alt={`${veiculo.marca} ${veiculo.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-lg ${
                        disponivel 
                          ? 'bg-emerald-500/90 text-black' 
                          : 'bg-rose-500/90 text-white'
                      }`}>
                        {disponivel ? 'Disponível Agora' : 'Locado no Momento'}
                      </span>
                    </div>

                    {/* Share Button on Card */}
                    <button
                      onClick={(e) => handleOpenShare(veiculo, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg"
                      title="Compartilhar Veículo"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Price Tag on Photo */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <p className="text-xl font-black text-white leading-none">
                          {veiculo.marca} {veiculo.modelo}
                        </p>
                        <p className="text-xs text-blue-400 font-mono mt-1">
                          Ano {veiculo.ano} • Placa {veiculo.placa}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">a partir de</span>
                        <span className="text-lg font-black text-emerald-400 leading-none">
                          {formatCurrency(veiculo.valor_diaria || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400">/dia</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Features */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-300">
                        <Snowflake className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">Ar Cond.</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-300">
                        <Gauge className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{veiculo.transmissao || 'Manual'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{veiculo.combustivel || 'Flex'}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      disabled={!disponivel}
                      className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                        disponivel
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 active:scale-98'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>{disponivel ? 'Solicitar Reserva Online' : 'Indisponível no momento'}</span>
                      {disponivel && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DIRETO DE CLIENTE */}
      {showCadastroClienteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowCadastroClienteModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {cadastroSucesso ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Cadastro Realizado com Sucesso!</h3>
                <p className="text-xs text-slate-300">
                  Seus dados foram salvos no sistema da **Oliveira Veículos**. Agora você pode solicitar locações e reservar carros diretamente com liberação rápida!
                </p>
                <button
                  onClick={() => setShowCadastroClienteModal(false)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Continuar no Catálogo
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Cadastre-se na Oliveira Veículos</h3>
                    <p className="text-xs text-slate-400">Preencha seus dados para alugar mais rápido</p>
                  </div>
                </div>

                <form onSubmit={handleSalvarCadastroCliente} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={cadastroForm.nome}
                      onChange={e => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">CPF *</label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={cadastroForm.cpf_cnpj}
                        onChange={e => setCadastroForm({ ...cadastroForm, cpf_cnpj: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">WhatsApp / Celular *</label>
                      <input
                        type="tel"
                        required
                        placeholder="(67) 99999-9999"
                        value={cadastroForm.celular}
                        onChange={e => setCadastroForm({ ...cadastroForm, celular: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">E-mail (Opcional)</label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={cadastroForm.email}
                      onChange={e => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Cidade</label>
                      <input
                        type="text"
                        value={cadastroForm.cidade}
                        onChange={e => setCadastroForm({ ...cadastroForm, cidade: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Bairro / Endereço</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        value={cadastroForm.bairro}
                        onChange={e => setCadastroForm({ ...cadastroForm, bairro: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cadastrando}
                    className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50"
                  >
                    {cadastrando ? 'Cadastrando...' : 'Concluir Meu Cadastro'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RESERVA DE VEÍCULO */}
      {showReservaModal && selectedVeiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowReservaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {reservaSucesso ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Solicitação de Reserva Enviada!</h3>
                <p className="text-xs text-slate-300">
                  Sua solicitação para o **{selectedVeiculo.marca} {selectedVeiculo.modelo}** (Protocolo #{reservaCriadaId}) foi gravada no sistema!
                </p>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1">
                  <p className="text-slate-400">Total estimado: <strong className="text-emerald-400">{formatCurrency(calcularTotalReserva().total)}</strong> ({calcularTotalReserva().dias} diárias)</p>
                  <p className="text-slate-400">Cliente: <strong className="text-white">{reservaForm.cliente_nome}</strong></p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`https://wa.me/${configEmpresa.whatsapp}?text=Olá! Acabei de solicitar a reserva do ${selectedVeiculo.marca} ${selectedVeiculo.modelo} (Protocolo %23${reservaCriadaId}) pelo aplicativo.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chamar no WhatsApp para Liberar Veículo</span>
                  </a>
                  <button
                    onClick={() => setShowReservaModal(false)}
                    className="w-full py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-black text-white mb-1">
                  Reservar {selectedVeiculo.marca} {selectedVeiculo.modelo}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Diária de {formatCurrency(selectedVeiculo.valor_diaria || 0)}/dia
                </p>

                <form onSubmit={handleConfirmarReserva} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Seu CPF / Documento *</label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={reservaForm.cliente_cpf}
                        onChange={e => setReservaForm({ ...reservaForm, cliente_cpf: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">WhatsApp / Celular *</label>
                      <input
                        type="tel"
                        required
                        placeholder="(67) 99999-9999"
                        value={reservaForm.cliente_telefone}
                        onChange={e => setReservaForm({ ...reservaForm, cliente_telefone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Seu Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={reservaForm.cliente_nome}
                      onChange={e => setReservaForm({ ...reservaForm, cliente_nome: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={reservaForm.cliente_email}
                      onChange={e => setReservaForm({ ...reservaForm, cliente_email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Endereço Completo (Rua e Número) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Brasil, 123"
                      value={reservaForm.endereco}
                      onChange={e => setReservaForm({ ...reservaForm, endereco: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Bairro *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Centro"
                        value={reservaForm.bairro}
                        onChange={e => setReservaForm({ ...reservaForm, bairro: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Cidade *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Naviraí"
                        value={reservaForm.cidade}
                        onChange={e => setReservaForm({ ...reservaForm, cidade: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Estado *</label>
                      <input
                        type="text"
                        required
                        placeholder="MS"
                        value={reservaForm.estado}
                        onChange={e => setReservaForm({ ...reservaForm, estado: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">CEP *</label>
                      <input
                        type="text"
                        required
                        placeholder="79950-000"
                        value={reservaForm.cep}
                        onChange={e => setReservaForm({ ...reservaForm, cep: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Data Retirada *</label>
                      <input
                        type="date"
                        required
                        value={reservaForm.data_inicio}
                        onChange={e => setReservaForm({ ...reservaForm, data_inicio: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Data Devolução *</label>
                      <input
                        type="date"
                        required
                        value={reservaForm.data_fim}
                        onChange={e => setReservaForm({ ...reservaForm, data_fim: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Estimado ({calcularTotalReserva().dias} diárias):</span>
                    <span className="text-base font-black text-emerald-400">{formatCurrency(calcularTotalReserva().total)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={enviandoReserva}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-blue-600/30 active:scale-98 disabled:opacity-50"
                  >
                    {enviandoReserva ? 'Enviando...' : 'Salvar Cadastro e Confirmar Reserva'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTILHAMENTO */}
      {showShareModal && (
        <ShareVehicleModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          veiculo={veiculoToShare || undefined}
        />
      )}
    </div>
  );
}
