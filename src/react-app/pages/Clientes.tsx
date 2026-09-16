import { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Building2, User, X, Check } from 'lucide-react';
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
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'pf' | 'pj'>('todos');
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

  // Contadores para os filtros
  const counts = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) return { todos: 0, pf: 0, pj: 0 };
    let pf = 0;
    let pj = 0;
    clientes.forEach(c => {
      const docDigits = (c.cpf_cnpj || (c as any).documento || '').replace(/\D/g, '');
      const isPj = c.tipo_pessoa === 'pj' || (c as any).tipo_documento?.toString().toLowerCase() === 'cnpj' || docDigits.length > 11;
      if (isPj) pj++;
      else pf++;
    });
    return { todos: clientes.length, pf, pj };
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) return [];
    
    let list = clientes;
    if (tipoFilter !== 'todos') {
      list = list.filter(c => {
        const docDigits = (c.cpf_cnpj || (c as any).documento || '').replace(/\D/g, '');
        const isPj = c.tipo_pessoa === 'pj' || (c as any).tipo_documento?.toString().toLowerCase() === 'cnpj' || docDigits.length > 11;
        return tipoFilter === 'pj' ? isPj : !isPj;
      });
    }

    if (!search || !search.trim()) return list;
    const term = normalize(search);
    const digitsOnly = search.replace(/\D/g, '');

    return list.filter(c => {
      const nome = normalize(c.nome);
      const doc = normalize(c.cpf_cnpj || (c as any).documento);
      const cel = normalize(c.celular);
      const email = normalize(c.email);
      const cidade = normalize(c.cidade);
      const bairro = normalize(c.bairro);

      const docDigits = (c.cpf_cnpj || (c as any).documento || '').replace(/\D/g, '');
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
  }, [clientes, search, tipoFilter]);

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
    const docDigits = (cliente.cpf_cnpj || (cliente as any).documento || '').replace(/\D/g, '');
    const isPj = cliente.tipo_pessoa === 'pj' || (cliente as any).tipo_documento?.toString().toLowerCase() === 'cnpj' || docDigits.length > 11;
    
    setEditingClient(cliente);
    setFormData({
      nome: cliente.nome,
      tipo_pessoa: isPj ? 'pj' : 'pf',
      cpf_cnpj: isPj ? formatCNPJ(docDigits) : formatCPF(docDigits),
      celular: cliente.celular ? formatPhone(cliente.celular) : '',
      endereco: cliente.endereco || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || 'Naviraí',
      estado: cliente.estado || 'MS',
      cep: cliente.cep || '',
      email: cliente.email || '',
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

  const handleDocChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 11) {
      setFormData(prev => ({
        ...prev,
        tipo_pessoa: 'pj',
        cpf_cnpj: formatCNPJ(digits.slice(0, 14))
      }));
    } else if (formData.tipo_pessoa === 'pj') {
      setFormData(prev => ({
        ...prev,
        cpf_cnpj: formatCNPJ(digits)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cpf_cnpj: formatCPF(digits)
      }));
    }
  };

  const formatDocDisplay = (doc?: string, tipo?: string) => {
    if (!doc) return 'Não informado';
    const digits = doc.replace(/\D/g, '');
    if (tipo === 'pj' || digits.length > 11) {
      return formatCNPJ(digits);
    }
    return formatCPF(digits);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Clientes & Empresas</h1>
          <p className="text-xs sm:text-sm text-slate-400">Base de clientes Pessoa Física (CPF) e Pessoa Jurídica (CNPJ)</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          + Novo Cliente / CNPJ
        </button>
      </div>

      {/* Filtros rápidos e Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs de Filtro */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-lg flex-shrink-0">
          <button
            onClick={() => setTipoFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              tipoFilter === 'todos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {counts.todos}
            </span>
          </button>
          <button
            onClick={() => setTipoFilter('pf')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              tipoFilter === 'pf'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pessoa Física</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {counts.pf}
            </span>
          </button>
          <button
            onClick={() => setTipoFilter('pj')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              tipoFilter === 'pj'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresas / CNPJ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {counts.pj}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, empresa, CPF, CNPJ, telefone ou cidade..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                {formData.tipo_pessoa === 'pj' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span>
                  {editingClient 
                    ? `Editar ${formData.tipo_pessoa === 'pj' ? 'Empresa / CNPJ' : 'Cliente'}` 
                    : `Cadastrar Novo ${formData.tipo_pessoa === 'pj' ? 'Cliente CNPJ' : 'Cliente'}`}
                </span>
              </h3>
              <button onClick={resetForm} className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Seletor Tipo de Cadastro */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Cliente *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const numbers = (formData.cpf_cnpj || '').replace(/\D/g, '').slice(0, 11);
                      setFormData({
                        ...formData,
                        tipo_pessoa: 'pf',
                        cpf_cnpj: formatCPF(numbers)
                      });
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      formData.tipo_pessoa === 'pf'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Pessoa Física (CPF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const numbers = (formData.cpf_cnpj || '').replace(/\D/g, '').slice(0, 14);
                      setFormData({
                        ...formData,
                        tipo_pessoa: 'pj',
                        cpf_cnpj: formatCNPJ(numbers)
                      });
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      formData.tipo_pessoa === 'pj'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Pessoa Jurídica (CNPJ)</span>
                  </button>
                </div>
              </div>

              {/* Nome / Razão Social */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {formData.tipo_pessoa === 'pj' ? 'Razão Social / Nome da Empresa *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder={formData.tipo_pessoa === 'pj' ? 'Ex: Oliveira & Santos Ltda' : 'Nome do cliente'}
                />
              </div>

              {/* Documento e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {formData.tipo_pessoa === 'pj' ? 'CNPJ *' : 'CPF *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={formData.tipo_pessoa === 'pj' ? 18 : 14}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    value={formData.cpf_cnpj}
                    onChange={(e) => handleDocChange(e.target.value)}
                    placeholder={formData.tipo_pessoa === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
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

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={formData.tipo_pessoa === 'pj' ? 'contato@empresa.com.br' : 'cliente@email.com'}
                />
              </div>

              {/* Endereço */}
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

              {/* Bairro e Cidade */}
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

              {/* Botoes de Acao */}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  {isLoading ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingClient ? 'Salvar Alterações' : 'Cadastrar'}</span>
                    </>
                  )}
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
            {filteredClientes.map((cliente) => {
              const docDigits = (cliente.cpf_cnpj || (cliente as any).documento || '').replace(/\D/g, '');
              const isPj = cliente.tipo_pessoa === 'pj' || (cliente as any).tipo_documento?.toString().toLowerCase() === 'cnpj' || docDigits.length > 11;
              const formattedDoc = formatDocDisplay(cliente.cpf_cnpj || (cliente as any).documento, isPj ? 'pj' : 'pf');

              return (
                <div
                  key={cliente.id}
                  className={`border rounded-2xl p-4 bg-slate-900/90 shadow-xl backdrop-blur-xl transition-all ${
                    isPj 
                      ? 'border-indigo-900/50 hover:border-indigo-600/50 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90' 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center space-x-2.5 mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isPj ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isPj ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">{cliente.nome}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${
                          isPj ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {isPj ? 'PJ / CNPJ' : 'PF / CPF'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <span className="text-slate-500 font-semibold text-[10px] uppercase">
                            {isPj ? 'CNPJ:' : 'CPF:'}
                          </span>
                          <span className={`font-mono font-bold ${isPj ? 'text-indigo-400' : 'text-blue-400'}`}>
                            {formattedDoc}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="font-medium">{cliente.celular ? formatPhone(cliente.celular) : 'Não informado'}</span>
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
                            <span className="truncate">{cliente.endereco}, {cliente.bairro || 'Centro'} - {cliente.cidade || 'Naviraí'}/{cliente.estado || 'MS'}</span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
