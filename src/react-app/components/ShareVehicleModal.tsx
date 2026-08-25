import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Car } from 'lucide-react';
import { formatCurrency } from '@/react-app/utils/formatters';
import type { Veiculo } from '@/shared/types';

interface ShareVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  veiculo?: Veiculo;
  linkPlayStore?: string;
}

export default function ShareVehicleModal({
  isOpen,
  onClose,
  veiculo,
  linkPlayStore = 'https://play.google.com/store/apps/details?id=com.locadoraoliveira.app'
}: ShareVehicleModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.origin.includes('localhost')
  );
  const baseUrl = isLocal ? 'https://locadoraoliveira.vercel.app' : window.location.origin;
  const shareUrl = veiculo
    ? `${baseUrl}/catalogo?veiculo=${veiculo.id}`
    : `${baseUrl}/catalogo`;

  const salesMessage = veiculo
    ? `🚗 *Oliveira Veículos - Locação de Carros*\n\nConfira o veículo disponível para locação:\n\n✨ *${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})*\n💰 Diária: *${formatCurrency(veiculo.valor_diaria || 0)}/dia*\n🎨 Cor: ${veiculo.cor}\n\n📲 *Veja fotos e reserve pelo link:*\n${shareUrl}\n\n📲 *Ou baixe nosso App na Play Store:*\n${linkPlayStore}\n\n📞 Contato: (67) 99622-9840`
    : `🚗 *Oliveira Veículos - Carros Disponíveis para Locação*\n\nConfira nossos veículos revisados e prontos para viagem ou trabalho!\n\n📲 *Acesse nosso catálogo completo:*\n${shareUrl}\n\n📲 *Baixe nosso App na Play Store:*\n${linkPlayStore}\n\n📞 Contato: (67) 99622-9840`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(salesMessage);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(salesMessage)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm overflow-y-auto box-border">
      <div className="relative w-[calc(100vw-24px)] max-w-sm mx-auto bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh] box-border">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-3.5 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md flex-shrink-0">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 pr-6">
              <h3 className="text-sm font-bold truncate">Compartilhar com Clientes</h3>
              <p className="text-[10px] text-blue-100 truncate">Envie o link para o cliente alugar ou ver fotos</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 box-border">
          {/* Card do Veículo Selecionado ou Catálogo */}
          {veiculo ? (
            <div className="flex items-center space-x-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-700/60">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {veiculo.marca} {veiculo.modelo} ({veiculo.ano})
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  Diária: <span className="text-emerald-400 font-semibold">{formatCurrency(veiculo.valor_diaria || 0)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-700/60 text-center">
              <p className="text-xs font-semibold text-white">Catálogo Completo de Veículos Disponíveis</p>
            </div>
          )}

          {/* Link Direto */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Link Direto (Web / App)</label>
            <div className="flex items-center gap-1.5 w-full min-w-0">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full min-w-0 block bg-slate-950 border border-slate-700 text-slate-200 text-[11px] px-2.5 py-2 rounded-xl font-mono focus:outline-none select-all truncate box-border"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex-shrink-0 flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                  copiedLink ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Pré-visualização da Mensagem */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-400">Mensagem para WhatsApp:</span>
              <button
                onClick={handleCopyMessage}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 text-[11px]"
              >
                {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMsg ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10.5px] text-slate-300 whitespace-pre-line max-h-24 overflow-y-auto font-sans leading-relaxed break-words">
              {salesMessage}
            </div>
          </div>

          {/* Ação WhatsApp */}
          <div className="pt-1">
            <button
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 text-center"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Enviar Diretamente no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
