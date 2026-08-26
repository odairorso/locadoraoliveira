import { useState, useMemo } from 'react';
import { X, Copy, Check, QrCode, MessageCircle, ShieldCheck, FileCode2 } from 'lucide-react';
import { formatCurrency } from '@/react-app/utils/formatters';
import { generatePixPayload } from '@/react-app/utils/pix';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  valor: number;
  descricao?: string;
  referenciaId?: string | number;
  nomeCliente?: string;
  chavePix?: string;
  tipoChavePix?: string;
  titularPix?: string;
  cidadePix?: string;
  whatsapp?: string;
}

export default function PixModal({
  isOpen,
  onClose,
  valor,
  descricao = 'Locação de Veículo - Oliveira Veículos',
  referenciaId,
  nomeCliente,
  chavePix = '17909442000158',
  tipoChavePix = 'CNPJ',
  titularPix = 'L DOS SANTOS DE OLIVEIRA LTDA',
  cidadePix = 'NAVIRAI',
  whatsapp = '5567996229840'
}: PixModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Gera o Payload Oficial BRCode / EMV com CRC16 válido aceito por todos os bancos
  const pixCopiaECola = useMemo(() => {
    return generatePixPayload({
      chave: chavePix,
      tipoChave: tipoChavePix,
      nome: titularPix,
      cidade: cidadePix,
      valor: valor,
      identificador: referenciaId ? `LOC${referenciaId}` : '***'
    });
  }, [chavePix, tipoChavePix, titularPix, cidadePix, valor, referenciaId]);

  if (!isOpen) return null;

  // QR Code URL oficial com payload completo e válido
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    pixCopiaECola
  )}&margin=10`;

  const copyToClipboard = async (text: string, isPayload: boolean) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      if (isPayload) {
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 3000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleWhatsApp = () => {
    const msg = `Olá! Fiz o pagamento via PIX no valor de ${formatCurrency(valor)} para a locação na Oliveira Veículos.${
      referenciaId ? `\nReferência/Locação: #${referenciaId}` : ''
    }${nomeCliente ? `\nCliente: ${nomeCliente}` : ''}\n\nSegue o comprovante em anexo:`;

    const cleanNumber = whatsapp.replace(/\D/g, '');
    const finalNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    window.open(`https://wa.me/${finalNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm overflow-y-auto box-border animate-fade-in">
      <div className="relative w-[calc(100vw-24px)] max-w-sm mx-auto bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col box-border">
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 p-3.5 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md flex-shrink-0">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 pr-6">
              <h3 className="text-base sm:text-lg font-bold truncate">Pagamento via PIX</h3>
              <p className="text-xs text-emerald-100 truncate">Rápido, seguro e aprovação imediata</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Valor a pagar */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor a Pagar</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(valor)}
            </div>
            {descricao && (
              <p className="text-xs text-slate-400 mt-1">{descricao}</p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner border border-slate-200">
            <img
              src={qrCodeUrl}
              alt="QR Code Pix"
              className="w-48 h-48 object-contain rounded-lg"
              onError={(e) => {
                // Fallback caso imagem não carregue
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-[11px] font-medium text-slate-500 mt-2 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              Chave Pix Oficial da Oliveira Veículos
            </span>
          </div>

          {/* Código Pix Copia e Cola (Oficial Banco Central) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <FileCode2 className="w-3.5 h-3.5" /> Pix Copia e Cola (Com Valor R$ {valor.toFixed(2)}):
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={pixCopiaECola}
                className="w-full bg-slate-950 border border-emerald-500/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-mono focus:outline-none select-all truncate"
              />
              <button
                onClick={() => copyToClipboard(pixCopiaECola, true)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-md active:scale-95 ${
                  copiedPayload
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Pix</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Chave Pix Simples (CNPJ / E-mail) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Ou chave direta ({tipoChavePix}):</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={chavePix}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-mono focus:outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(chavePix, false)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                  copiedKey
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiada!' : 'Copiar Chave'}</span>
              </button>
            </div>
          </div>

          {/* Dados do Titular e Cidade */}
          <div className="text-[11px] text-slate-400 space-y-0.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span>Beneficiário:</span>
              <span className="text-slate-300 font-medium">{titularPix}</span>
            </div>
            <div className="flex justify-between">
              <span>Cidade:</span>
              <span className="text-slate-300 font-medium">{cidadePix} - MS</span>
            </div>
          </div>

          {/* Ações / Enviar Comprovante */}
          <div className="pt-1 space-y-2.5">
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all transform active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Comprovante via WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Já realizei o pagamento / Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
