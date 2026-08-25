import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Car, 
  Share2, Image
} from 'lucide-react';
import { useApi, useMutation } from '@/react-app/hooks/useApi';
import ErrorMessage from '@/react-app/components/ErrorMessage';
import { formatCurrency } from '@/react-app/utils/formatters';
import { getStatusColor, getStatusText } from '@/react-app/utils/statusHelpers';
import ShareVehicleModal from '@/react-app/components/ShareVehicleModal';
import type { Veiculo, VeiculoCreate } from '@/shared/types';

export default function VeiculosPage() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Veiculo | null>(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [vehicleToShare, setVehicleToShare] = useState<Veiculo | null>(null);

  const [formData, setFormData] = useState<VeiculoCreate>({
    modelo: '',
    marca: '',
    ano: new Date().getFullYear(),
    placa: '',
    renavam: '',
    cor: '',
    valor_diaria: null,
    valor_veiculo: 0,
    tipo_operacao: 'ambos',
    status: 'disponivel',
    foto_principal: '',
    transmissao: 'manual',
    tem_ar_condicionado: true,
    tem_direcao_hidraulica: true,
    tem_vidro_eletrico: true,
    descricao: ''
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data: veiculos, loading, error, refetch } = useApi<Veiculo[]>(`/api/veiculos?${queryParams.toString()}`);
  const { mutate: createVeiculo, loading: creating } = useMutation<Veiculo, VeiculoCreate>();
  const { mutate: updateVeiculo, loading: updating } = useMutation<Veiculo, VeiculoCreate>();
  const { mutate: deleteVeiculo, loading: deleting } = useMutation();

  const isLoading = creating || updating || deleting;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [location.search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let result;
    if (editingVehicle) {
      result = await updateVeiculo(`/api/veiculos/${editingVehicle.id}`, formData, 'PUT');
    } else {
      result = await createVeiculo('/api/veiculos', formData);
    }

    if (result) {
      resetForm();
      refetch();
    }
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingVehicle(veiculo);
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = veiculo;
    setFormData({
      ...rest,
      foto_principal: veiculo.foto_principal || '',
      transmissao: veiculo.transmissao || 'manual',
      tem_ar_condicionado: veiculo.tem_ar_condicionado ?? true,
      tem_direcao_hidraulica: veiculo.tem_direcao_hidraulica ?? true,
      tem_vidro_eletrico: veiculo.tem_vidro_eletrico ?? true,
      descricao: veiculo.descricao || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (veiculo: Veiculo) => {
    if (confirm(`Tem certeza que deseja excluir o veículo ${veiculo.marca} ${veiculo.modelo}?`)) {
      const result = await deleteVeiculo(`/api/veiculos/${veiculo.id}`, {}, 'DELETE');
      if (result) refetch();
    }
  };

  const handleShare = (veiculo: Veiculo) => {
    setVehicleToShare(veiculo);
    setShowShareModal(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      modelo: '',
      marca: '',
      ano: new Date().getFullYear(),
      placa: '',
      renavam: '',
      cor: '',
      valor_diaria: null,
      valor_veiculo: 0,
      tipo_operacao: 'ambos',
      status: 'disponivel',
      foto_principal: '',
      transmissao: 'manual',
      tem_ar_condicionado: true,
      tem_direcao_hidraulica: true,
      tem_vidro_eletrico: true,
      descricao: ''
    });
  };

  const formatPlate = (value: string) => {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
  };

  // Helper de fotos
  const getVehiclePhoto = (veiculo: Veiculo) => {
    if (veiculo.foto_principal) return veiculo.foto_principal;
    if (veiculo.fotos && veiculo.fotos.length > 0) return veiculo.fotos[0];
    
    const m = veiculo.modelo.toLowerCase();
    if (m.includes('onix')) return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
    if (m.includes('polo')) return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80';
    if (m.includes('gol')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80';
    if (m.includes('saveiro')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80';
    if (m.includes('t cross') || m.includes('t-cross')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Veículos da Frota</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie o cadastro, fotos, valores de diária e compartilhe links com clientes.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Veículo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por modelo, marca ou placa..."
            className="pl-10 pr-4 py-2.5 w-full border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-950 text-white text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3.5 py-2.5 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-950 text-white text-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="disponivel">Disponível</option>
          <option value="locado">Locado</option>
          <option value="vendido">Vendido</option>
          <option value="manutencao">Em Manutenção</option>
        </select>
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm overflow-y-auto z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm sm:text-base font-bold">
                {editingVehicle ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
              </h3>
              <button onClick={resetForm} className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: Chevrolet / VW / Fiat"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ex: Onix LT / Gol MPI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ano *</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || 2024 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Placa *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: formatPlate(e.target.value) })}
                    placeholder="RVC8A72"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cor *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="Ex: Branca / Prata"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Renavam *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  value={formData.renavam}
                  onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                  placeholder="Número do Renavam"
                />
              </div>

              {/* Foto do Veículo com Upload e Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Foto do Veículo (Para o App / Catálogo)</label>
                
                {formData.foto_principal && (
                  <div className="relative mb-3 aspect-[16/9] w-full max-w-sm mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-md group">
                    <img
                      src={formData.foto_principal}
                      alt="Pré-visualização do veículo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_principal: '' })}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all shadow"
                      title="Remover foto"
                    >
                      ✕ Remover Foto
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Botão de Upload do Computador/Celular */}
                  <div>
                    <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm">
                      <Image className="w-4 h-4 text-blue-400" />
                      <span>📁 Escolher Foto do Computador/Celular</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, foto_principal: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Ou Campo de Link / URL */}
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      value={formData.foto_principal || ''}
                      onChange={(e) => setFormData({ ...formData, foto_principal: e.target.value })}
                      placeholder="Ou cole o link da foto (URL)..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Operação *</label>
                  <select
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.tipo_operacao}
                    onChange={(e) => setFormData({ ...formData, tipo_operacao: e.target.value as any })}
                  >
                    <option value="locacao">Somente Locação</option>
                    <option value="venda">Somente Venda</option>
                    <option value="ambos">Locação e Venda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="locado">Locado</option>
                    <option value="vendido">Vendido</option>
                    <option value="manutencao">Em Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor da Diária (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 font-bold text-emerald-400"
                    value={formData.valor_diaria || ''}
                    onChange={(e) => setFormData({ ...formData, valor_diaria: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Ex: 280.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor do Veículo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.valor_veiculo}
                    onChange={(e) => setFormData({ ...formData, valor_veiculo: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 75000.00"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 rounded-xl shadow-lg disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : editingVehicle ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div>
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Carregando veículos...</div>
        ) : error ? (
          <ErrorMessage message={`Erro ao carregar veículos: ${error}`} />
        ) : !veiculos || veiculos.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Nenhum veículo encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {veiculos.map((veiculo) => {
              const photo = getVehiclePhoto(veiculo);

              return (
                <div
                  key={veiculo.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Imagem do Carro */}
                    <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                      <img
                        src={photo}
                        alt={`${veiculo.marca} ${veiculo.modelo}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow ${getStatusColor(veiculo.status)}`}>
                          {getStatusText(veiculo.status)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleShare(veiculo)}
                        title="Compartilhar Link do Carro"
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-slate-900/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors backdrop-blur-sm shadow"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Dados */}
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">{veiculo.marca}</span>
                          <h3 className="text-lg font-bold text-white leading-tight">{veiculo.modelo}</h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                          {veiculo.ano}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Placa:</span>
                          <span className="font-mono font-bold text-slate-200">{veiculo.placa}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Cor:</span>
                          <span className="text-slate-200 font-medium">{veiculo.cor}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Diária:</span>
                          <span className="text-emerald-400 font-extrabold">
                            {veiculo.valor_diaria ? formatCurrency(veiculo.valor_diaria) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Valor FIPE/Mercado:</span>
                          <span className="text-slate-300 font-medium">{formatCurrency(veiculo.valor_veiculo)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleShare(veiculo)}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Enviar Link</span>
                    </button>

                    <button
                      onClick={() => handleEdit(veiculo)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(veiculo)}
                      className="p-2 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/20 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <ShareVehicleModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          veiculo={vehicleToShare}
        />
      )}
    </div>
  );
}