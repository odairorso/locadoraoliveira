import React, { useState, useMemo } from 'react';
import { Search, User, X, Check, Phone, FileText, ChevronRight } from 'lucide-react';
import type { Cliente } from '@/shared/types';
import { formatCPF, formatCNPJ, formatPhone } from '@/react-app/utils/formatters';

interface ClientSelectModalProps {
  selectedClientId: number;
  onSelectClient: (client: Cliente) => void;
  clientes: Cliente[];
  loading?: boolean;
  label?: string;
  required?: boolean;
}

export default function ClientSelectModal({
  selectedClientId,
  onSelectClient,
  clientes,
  loading = false,
  label = 'Cliente *',
}: ClientSelectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedClient = useMemo(() => {
    return clientes.find((c) => c.id === selectedClientId) || null;
  }, [clientes, selectedClientId]);

  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/\D/g, '');

    return clientes.filter((c) => {
      const nomeMatch = c.nome ? c.nome.toLowerCase().includes(term) : false;
      const docRaw = (c.cpf_cnpj || c.documento || '').replace(/\D/g, '');
      const docMatch = docRaw.includes(cleanTerm);
      const telRaw = (c.celular || c.telefone || '').replace(/\D/g, '');
      const telMatch = telRaw.includes(cleanTerm);
      const emailMatch = c.email ? c.email.toLowerCase().includes(term) : false;

      return nomeMatch || docMatch || telMatch || emailMatch;
    });
  }, [clientes, searchTerm]);

  const formatDoc = (doc?: string) => {
    if (!doc) return 'Não informado';
    const clean = doc.replace(/\D/g, '');
    if (clean.length > 11) return formatCNPJ(clean);
    if (clean.length === 11) return formatCPF(clean);
    return doc;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300">
        {label}
      </label>

      {/* Botão Gatilho / Card do Cliente Selecionado */}
      {selectedClient ? (
        <div
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 border-2 border-amber-500/50 hover:border-amber-500 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-md active:scale-98 group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-black font-black text-xs flex items-center justify-center shadow-md flex-shrink-0">
              {getInitials(selectedClient.nome)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {selectedClient.nome}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>{formatDoc(selectedClient.cpf_cnpj || selectedClient.documento)}</span>
                </span>
                {(selectedClient.celular || selectedClient.telefone) && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <Phone className="w-3 h-3" />
                    <span>{formatPhone(selectedClient.celular || selectedClient.telefone || '')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-all flex items-center space-x-1 flex-shrink-0"
          >
            <span>Trocar</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => setIsOpen(true)}
          className="w-full bg-slate-950/80 hover:bg-slate-900 border border-dashed border-amber-500/60 hover:border-amber-500 rounded-xl p-3.5 flex items-center justify-between text-left transition-all active:scale-98 shadow-sm group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                Toque para selecionar o cliente
              </p>
              <p className="text-[11px] text-slate-400">
                Pesquise rapidamente por Nome, CPF ou WhatsApp
              </p>
            </div>
          </div>
          <Search className="w-4 h-4 text-amber-400 opacity-70 group-hover:opacity-100" />
        </button>
      )}

      {/* MODAL DE BUSCA DE CLIENTE */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0d121c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-[#080b12] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Selecionar Cliente</h3>
                  <p className="text-[11px] text-slate-400">
                    {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campo de Pesquisa em Tempo Real */}
            <div className="p-3 bg-[#0d121c] border-b border-slate-800/80 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome, CPF ou celular..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Clientes */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {filteredClientes.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <User className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">
                    Nenhum cliente encontrado para "{searchTerm}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Verifique a ortografia ou o número de CPF digitado.
                  </p>
                </div>
              ) : (
                filteredClientes.map((cliente) => {
                  const isSelected = cliente.id === selectedClientId;

                  return (
                    <div
                      key={cliente.id}
                      onClick={() => {
                        onSelectClient(cliente);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 text-black font-black'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {getInitials(cliente.nome)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {cliente.nome}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-amber-400/80" />
                              <span className="font-mono">{formatDoc(cliente.cpf_cnpj || cliente.documento)}</span>
                            </span>
                            {(cliente.celular || cliente.telefone) && (
                              <span className="flex items-center space-x-1 text-emerald-400/90">
                                <Phone className="w-3 h-3" />
                                <span>{formatPhone(cliente.celular || cliente.telefone || '')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center flex-shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer com contagem */}
            <div className="p-3 border-t border-slate-800 bg-[#080b12] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
              <span>Exibindo {filteredClientes.length} de {clientes.length}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
