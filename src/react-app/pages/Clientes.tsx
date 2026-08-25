import { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Building2, User, X } from 'lucide-react';
import { useApi, useMutation } from '@/react-app/hooks/useApi';
import LoadingSpinner from '@/react-app/components/LoadingSpinner';
import ErrorMessage from '@/react-app/components/ErrorMessage';
import { formatCPF, formatCNPJ, formatPhone } from '@/react-app/utils/formatters';
import type { Cliente, ClienteCreate } from '@/shared/types';

const FORM_DEFAULTS: ClienteCreate = {
  nome: '',
  tipo_pessoa: 'pf',
  cpf_cnpj: '',
  celular: '',
  endereco: '',
  bairro: '',
  cidade: 'Naviraí',
  estado: 'MS',
  cep: '',
  email: '',
};

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteCreate>(FORM_DEFAULTS);

  const { data: clientes, loading, error, refetch } = useApi<Cliente[]>('/api/clientes');
  const { mutate: createCliente, loading: creating } = useMutation<Cliente, ClienteCreate>();
  const { mutate: updateCliente, loading: updating } = useMutation<Cliente, ClienteCreate>();
  const { mutate: deleteCliente, loading: deleting } = useMutation();

  const isLoading = creating || updating || deleting;

  const normalize = (text: string | null | undefined) => 
    (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const filteredClientes = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) return [];
    if (!search || !search.trim()) return clientes;
    const term = normalize(search);
    const digitsOnly = search.replace(/\D/g, '');

    return clientes.filter(c => {
      const nome = normalize(c.nome);
      const doc = normalize(c.cpf_cnpj);
      const cel = normalize(c.celular);
      const email = normalize(c.email);
      const cidade = normalize(c.cidade);
      const bairro = normalize(c.bairro);

      const docDigits = (c.cpf_cnpj || '').replace(/\D/g, '');
      const celDigits = (c.celular || '').replace(/\D/g, '');

      return (
        nome.includes(term) ||
        doc.includes(term) ||
        cel.includes(term) ||
        email.includes(term) ||
        cidade.includes(term) ||
        bairro.includes(term) ||
        (digitsOnly.length >= 3 && (docDigits.includes(digitsOnly) || celDigits.includes(digitsOnly)))
      );
    });
  }, [clientes, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let result;
    if (editingClient) {
      result = await updateCliente(`/api/clientes/${editingClient.id}`, formData, 'PUT');
    } else {
      result = await createCliente('/api/clientes', formData);
    }

    if (result) {
      resetForm();
      refetch();
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingClient(cliente);
    setFormData({
      nome: cliente.nome,
      tipo_pessoa: cliente.tipo_pessoa || 'pf',
      cpf_cnpj: cliente.cpf_cnpj,
      celular: cliente.celular,
      endereco: cliente.endereco,
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || 'Naviraí',
      estado: cliente.estado || 'MS',
      cep: cliente.cep || '',
      email: cliente.email,
    });
    setShowForm(true);
  };

  const handleDelete = async (cliente: Cliente) => {
    if (confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome}?`)) {
      const result = await deleteCliente(`/api/clientes/${cliente.id}`, {}, 'DELETE');
      if (result) {
        refetch();
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData(FORM_DEFAULTS);
  };

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return formData.tipo_pessoa === 'pj' ? formatCNPJ(numbers) : formatCPF(numbers);
  };

  const getCpfCnpjLabel = (tipo: string = 'pf') => {
    return tipo === 'pj' ? 'CNPJ' : 'CPF';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Clientes</h1>
          <p className="text-xs sm:text-sm text-slate-400">Gerencie a base de clientes e motoristas</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          + Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar cliente por nome, CPF ou telefone..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-bold">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={resetForm} className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {getCpfCnpjLabel(formData.tipo_pessoa)} *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={formData.tipo_pessoa === 'pj' ? 18 : 14}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Celular *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: formatPhone(e.target.value) })}
                    placeholder="(67) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço (Rua e Número) *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Ex: Av. Campo Grande, 707"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Centro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Naviraí"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
                >
                  {isLoading ? 'Salvando...' : editingClient ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div>
        {loading ? (
          <LoadingSpinner text="Carregando clientes..." />
        ) : error ? (
          <ErrorMessage message={`Erro ao carregar clientes: ${error}`} />
        ) : !filteredClientes || filteredClientes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <p className="text-slate-400 text-sm">Nenhum cliente encontrado</p>
            {search && <p className="text-xs text-slate-500 mt-1">Nenhum resultado para "{search}"</p>}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                        {cliente.tipo_pessoa === 'pj' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">{cliente.nome}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-slate-500 font-semibold text-[10px]">CPF/CNPJ:</span>
                        <span className="font-mono font-bold text-blue-400">{cliente.cpf_cnpj}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="font-medium">{cliente.celular}</span>
                      </div>
                      {cliente.email && (
                        <div className="flex items-center space-x-2 text-slate-300 col-span-full">
                          <Mail className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                          <span className="truncate">{cliente.email}</span>
                        </div>
                      )}
                      {cliente.endereco && (
                        <div className="flex items-start space-x-2 text-slate-400 col-span-full">
                          <MapPin className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{cliente.endereco}, {cliente.bairro} - {cliente.cidade}/{cliente.estado}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(cliente)}
                      className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente)}
                      className="p-2 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/20 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
