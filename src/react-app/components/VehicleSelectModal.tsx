import React, { useState, useMemo } from 'react';
import { Search, Car, X, Check, ChevronRight } from 'lucide-react';
import type { Veiculo } from '@/shared/types';
import { formatCurrency } from '@/react-app/utils/formatters';

interface VehicleSelectModalProps {
  selectedVehicleId: number;
  onSelectVehicle: (veiculo: Veiculo) => void;
  veiculos: Veiculo[];
  loading?: boolean;
  label?: string;
  required?: boolean;
}

export default function VehicleSelectModal({
  selectedVehicleId,
  onSelectVehicle,
  veiculos,
  loading = false,
  label = 'Veículo *',
}: VehicleSelectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedVehicle = useMemo(() => {
    return veiculos.find((v) => v.id === selectedVehicleId) || null;
  }, [veiculos, selectedVehicleId]);

  const filteredVeiculos = useMemo(() => {
    if (!searchTerm.trim()) return veiculos;
    const term = searchTerm.toLowerCase().trim();

    return veiculos.filter((v) => {
      const modeloMatch = v.modelo ? v.modelo.toLowerCase().includes(term) : false;
      const marcaMatch = v.marca ? v.marca.toLowerCase().includes(term) : false;
      const placaMatch = v.placa ? v.placa.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').includes(term.replace(/[^a-zA-Z0-9]/g, '')) : false;
      const corMatch = v.cor ? v.cor.toLowerCase().includes(term) : false;

      return modeloMatch || marcaMatch || placaMatch || corMatch;
    });
  }, [veiculos, searchTerm]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300">
        {label}
      </label>

      {/* Botão Gatilho / Card do Veículo Selecionado */}
      {selectedVehicle ? (
        <div
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-md active:scale-98 group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-black font-black text-xs flex items-center justify-center shadow-md flex-shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-bold text-white truncate">
                  {selectedVehicle.marca} {selectedVehicle.modelo}
                </p>
                <span className="font-mono text-[11px] font-black bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {selectedVehicle.placa}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                <span>{selectedVehicle.cor} • {selectedVehicle.ano}</span>
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(selectedVehicle.valor_diaria || 0)}/dia
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-all flex items-center space-x-1 flex-shrink-0"
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
          className="w-full bg-slate-950/80 hover:bg-slate-900 border border-dashed border-emerald-500/60 hover:border-emerald-500 rounded-xl p-3.5 flex items-center justify-between text-left transition-all active:scale-98 shadow-sm group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                Toque para selecionar o veículo
              </p>
              <p className="text-[11px] text-slate-400">
                Pesquise por Modelo, Marca ou Placa
              </p>
            </div>
          </div>
          <Search className="w-4 h-4 text-emerald-400 opacity-70 group-hover:opacity-100" />
        </button>
      )}

      {/* MODAL DE BUSCA DE VEÍCULO */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0d121c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-[#080b12] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Selecionar Veículo</h3>
                  <p className="text-[11px] text-slate-400">
                    {veiculos.length} {veiculos.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}
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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o modelo, marca ou placa..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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

            {/* Lista de Veículos */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {filteredVeiculos.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Car className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">
                    Nenhum veículo encontrado para "{searchTerm}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Tente buscar por outra marca, modelo ou placa.
                  </p>
                </div>
              ) : (
                filteredVeiculos.map((veiculo) => {
                  const isSelected = veiculo.id === selectedVehicleId;

                  return (
                    <div
                      key={veiculo.id}
                      onClick={() => {
                        onSelectVehicle(veiculo);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-black'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Car className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-white truncate">
                              {veiculo.marca} {veiculo.modelo}
                            </p>
                            <span className="font-mono text-[10px] font-black bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded border border-slate-700">
                              {veiculo.placa}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{veiculo.cor} • {veiculo.ano}</span>
                            <span className="text-emerald-400 font-bold">
                              {formatCurrency(veiculo.valor_diaria || 0)}/dia
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center flex-shrink-0 ml-2">
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

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#080b12] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
              <span>Exibindo {filteredVeiculos.length} de {veiculos.length}</span>
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
