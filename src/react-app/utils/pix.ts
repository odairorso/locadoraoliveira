/**
 * Gerador de Payload PIX (BRCode / EMVCo) Padrão Banco Central do Brasil
 */

function pad2(num: number): string {
  return num.toString().padStart(2, '0');
}

function formatEmvField(id: string, value: string): string {
  const len = pad2(value.length);
  return `${id}${len}${value}`;
}

/**
 * Cálculo de CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  chave: string;
  tipoChave?: string;
  nome: string;
  cidade: string;
  valor?: number;
  identificador?: string;
}

export function generatePixPayload({
  chave,
  tipoChave = 'CNPJ',
  nome,
  cidade,
  valor,
  identificador = '***'
}: PixPayloadParams): string {
  // Limpar dados para formato padrão do Banco Central
  let cleanKey = chave.trim();
  const lowerTipo = tipoChave.toLowerCase();

  if (lowerTipo.includes('cnpj') || lowerTipo.includes('cpf')) {
    cleanKey = cleanKey.replace(/\D/g, '');
  } else if (lowerTipo.includes('celular') || lowerTipo.includes('telefone')) {
    const digits = cleanKey.replace(/\D/g, '');
    cleanKey = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }

  const cleanNome = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .substring(0, 25);

  const cleanCidade = cidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .substring(0, 15);

  // 00 - Payload Format Indicator
  const pfi = formatEmvField('00', '01');

  // 26 - Merchant Account Info (GUI + Chave Pix)
  const gui = formatEmvField('00', 'BR.GOV.BCB.PIX');
  const key = formatEmvField('01', cleanKey);
  const merchantAccountInfo = formatEmvField('26', `${gui}${key}`);

  // 52 - Merchant Category Code
  const mcc = formatEmvField('52', '0000');

  // 53 - Transaction Currency (986 = BRL)
  const currency = formatEmvField('53', '986');

  // 54 - Transaction Amount
  let amountField = '';
  if (valor && valor > 0) {
    amountField = formatEmvField('54', valor.toFixed(2));
  }

  // 58 - Country Code
  const country = formatEmvField('58', 'BR');

  // 59 - Merchant Name
  const merchantName = formatEmvField('59', cleanNome || 'L DOS SANTOS OLIVEIRA');

  // 60 - Merchant City
  const merchantCity = formatEmvField('60', cleanCidade || 'NAVIRAI');

  // 62 - Additional Data Field (TxID)
  const cleanTxId = (identificador || '***').substring(0, 25);
  const txid = formatEmvField('05', cleanTxId);
  const additionalData = formatEmvField('62', txid);

  // Raw payload com o prefixo do CRC 6304
  const rawPayload = `${pfi}${merchantAccountInfo}${mcc}${currency}${amountField}${country}${merchantName}${merchantCity}${additionalData}6304`;

  // Calcular e anexar o checksum CRC16
  const crc = calculateCRC16(rawPayload);

  return `${rawPayload}${crc}`;
}
