import { createClient } from '@supabase/supabase-js';

function generateContractHTML(contractData) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Locação - ${contractData.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      margin: 20px;
      color: #000;
    }
    .contract-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .contract-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .contract-text {
      text-align: justify;
      margin: 10px 0;
    }
    .clause-title {
      font-weight: bold;
      margin: 15px 0 5px 0;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }
    .signature {
      text-align: center;
      width: 300px;
    }
    .signature-line {
      border-top: 1px solid black;
      padding-top: 5px;
      margin-top: 30px;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="contract-header">
    <div class="contract-title">CONTRATO DE LOCAÇÃO DE VEÍCULO</div>
    <div>Contrato nº ${contractData.id}</div>
  </div>

  <div class="contract-text">
    <strong>LOCADORA:</strong> João Roberto dos Santos de Oliveira, brasileiro, empresário, portador do CPF nº 123.456.789-00, residente e domiciliado na Rua Exemplo, 123, Centro, Cidade - Estado, CEP 12345-678, neste ato representando a pessoa jurídica L dos Santos de Oliveira, inscrita no CNPJ sob o nº 12.345.678/0001-90.
  </div>

  <div class="contract-text">
    <strong>LOCATÁRIO:</strong> ${contractData.cliente_nome}, portador do CPF nº ${contractData.cliente_cpf}, residente e domiciliado em ${contractData.endereco_completo}.
  </div>

  <div class="contract-text">
    Têm entre si justo e acordado o presente contrato de locação de veículo, que se regerá pelas cláusulas e condições seguintes:
  </div>

  <div class="clause-title">CLÁUSULA 1ª - DO OBJETO</div>
  <div class="contract-text">
    O presente contrato tem por objeto a locação do veículo ${contractData.veiculo_marca} ${contractData.veiculo_modelo}, ano ${contractData.veiculo_ano}, placa ${contractData.veiculo_placa}, avaliado em ${contractData.valor_veiculo_formatted}.
  </div>

  <div class="clause-title">CLÁUSULA 2ª - DO PRAZO</div>
  <div class="contract-text">
    O prazo de locação será de ${contractData.data_locacao_formatted} até ${contractData.data_entrega_formatted}.
  </div>

  <div class="clause-title">CLÁUSULA 3ª - DO VALOR</div>
  <div class="contract-text">
    O valor da diária é de ${contractData.valor_diaria_formatted}, totalizando ${contractData.valor_total_formatted}. O LOCATÁRIO pagará ainda uma caução no valor de ${contractData.valor_caucao_formatted}.
  </div>

  <div class="clause-title">CLÁUSULA 4ª - DAS RESPONSABILIDADES</div>
  <div class="contract-text">
    O LOCATÁRIO assume total responsabilidade pelo veículo durante o período de locação, comprometendo-se a devolvê-lo nas mesmas condições em que o recebeu.
  </div>

  <div class="clause-title">CLÁUSULA 5ª - DA MANUTENÇÃO</div>
  <div class="contract-text">
    A manutenção do veículo, referente à troca de óleo, filtros e demais itens de desgaste natural, será de responsabilidade e ônus para a LOCADORA.
  </div>

  <div class="contract-text">
    Parágrafo único: Se durante o período de locação houver necessidade de manutenção no veículo, proporcional ao período de manutenção, será descontado do aluguel o valor correspondente ao período em que o veículo estiver indisponível.
  </div>

  <div class="clause-title">CLÁUSULA 6ª - DA UTILIZAÇÃO DO SEGURO</div>
  <div class="contract-text">
    Ocorrendo a necessidade de utilização do seguro do veículo, seja por sinistro parcial ou total, ou danos ao veículo por terceiros, a franquia do seguro será de responsabilidade do LOCATÁRIO, devendo arcar com o valor da franquia do seguro veicular.
  </div>

  <div class="contract-text">
    Parágrafo único: O LOCATÁRIO declara estar ciente de que assume total responsabilidade civil e material por qualquer dano causado ao veículo durante o período de vigência deste contrato, inclusive por danos causados por quaisquer ônus, indenizações ou outras despesas decorrentes do uso do veículo.
  </div>

  <div class="clause-title">CLÁUSULA 7ª - DOS DEVERES DO LOCATÁRIO</div>
  <div class="contract-text">
    São deveres do LOCATÁRIO:
    <br />I - pagar o aluguel e os encargos de contratação;
    <br />II - utilizar o veículo conforme convencionado, destinando-o exclusivamente ao uso particular;
    <br />III - cuidar diligentemente do veículo como se fosse seu;
    <br />IV - restituir o veículo no final da locação, no estado em que o recebeu;
    <br />V - não modificar a forma interna ou externa do veículo sem o consentimento prévio por escrito da LOCADORA;
    <br />VI - não utilizar o veículo em atividades ilícitas, corridas, competições ou atividades similares;
    <br />VII - manter o veículo em local seguro quando não estiver em uso.
  </div>

  <div class="clause-title">CLÁUSULA 8ª - DAS PENALIDADES</div>
  <div class="contract-text">
    O descumprimento de qualquer cláusula deste contrato sujeitará o LOCATÁRIO ao pagamento de multa equivalente a 20% (vinte por cento) do valor total do contrato, sem prejuízo das demais sanções legais.
  </div>

  <div class="clause-title">CLÁUSULA 9ª - DA RESCISÃO</div>
  <div class="contract-text">
    Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 24 (vinte e quatro) horas, ficando o LOCATÁRIO obrigado ao pagamento proporcional do período utilizado.
  </div>

  <div class="clause-title">CLÁUSULA 10ª - DO FORO</div>
  <div class="contract-text">
    Para dirimir quaisquer dúvidas oriundas deste contrato, as partes elegem o foro da comarca onde está situada a LOCADORA, renunciando a qualquer outro, por mais privilegiado que seja.
  </div>

  ${contractData.observacoes ? `
  <div class="clause-title">OBSERVAÇÕES</div>
  <div class="contract-text">${contractData.observacoes}</div>
  ` : ''}

  <div class="contract-text" style="margin-top: 30px;">
    ${contractData.data_atual_formatted}
  </div>

  <div class="signatures">
    <div class="signature">
      <div class="signature-line">
        <strong>LOCADORA</strong><br />
        João Roberto dos Santos de Oliveira<br />
        neste ato representando a pessoa jurídica<br />
        L dos Santos de Oliveira
      </div>
    </div>
    
    <div class="signature">
      <div class="signature-line">
        <strong>LOCATÁRIO</strong><br />
        ${contractData.cliente_nome}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export default async function handler(request, response) {
  // Log básico para debug
  console.log('=== LOCACOES HANDLER ===');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('========================');
  
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;
    const { search, status, path } = request.query;
    
    // Extract ID and endpoint from path parameter (sent by Vercel rewrite)
    let id = request.query.id;
    let isContratoData = false;
    
    if (path) {
      console.log('Path parameter:', path);
      // path will be something like "9/contrato-data" or "9/contrato"
      const pathParts = path.split('/');
      console.log('Path parts:', pathParts);
      
      if (pathParts.length >= 1) {
        id = pathParts[0];
        console.log('ID extraído do path:', id);
      }
      
      if (pathParts.includes('contrato-data')) {
        isContratoData = true;
        console.log('Endpoint contrato-data detectado');
      } else if (pathParts.includes('contrato')) {
        isContratoData = false;
        console.log('Endpoint contrato (HTML) detectado');
      }
    } else if (request.url.includes('contrato-data')) {
      // Fallback para URLs diretas (desenvolvimento local)
      console.log('URL completa:', request.url);
      const urlParts = request.url.split('/');
      const contratoDataIndex = urlParts.indexOf('contrato-data');
      if (contratoDataIndex > 1) {
        id = urlParts[contratoDataIndex - 1];
      }
      isContratoData = true;
      console.log('ID extraído da URL:', id);
    }

    if (method === 'GET') {
      if (isContratoData || path?.includes('contrato')) {
        if (!id) {
          return response.status(400).json({ success: false, error: 'ID da locação é obrigatório' });
        }
        
        console.log('DEBUG: Buscando locação com ID:', id);
        
        const { data: locacao, error: locacaoError } = await supabase
          .from('locacoes')
          .select(`*, cliente:clientes (*), veiculo:veiculos (*)`)
          .eq('id', parseInt(id))
          .single();
        
        console.log('DEBUG: Resultado da busca locação:', { locacao, locacaoError });

        if (locacaoError) {
          return response.status(404).json({ success: false, error: "Locação não encontrada" });
        }

        // Format address properly, avoiding empty parts
        let endereco_parts = [];
        if (locacao.cliente.endereco) endereco_parts.push(locacao.cliente.endereco);
        if (locacao.cliente.bairro) endereco_parts.push(locacao.cliente.bairro);
        
        let cidade_estado = [];
        if (locacao.cliente.cidade) cidade_estado.push(locacao.cliente.cidade);
        if (locacao.cliente.estado) cidade_estado.push(locacao.cliente.estado);
        
        let enderecoCompleto = endereco_parts.join(', ');
        if (cidade_estado.length > 0) {
          enderecoCompleto += ' - ' + cidade_estado.join('/');
        }
        if (locacao.cliente.cep) {
          enderecoCompleto += ', CEP: ' + locacao.cliente.cep;
        }
        const formatCurrency = (value) => value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value)) : 'R$ 0,00';
        const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '';

        const contractData = {
          id: locacao.id,
          cliente_nome: locacao.cliente.nome,
          cliente_cpf: locacao.cliente.cpf,
          endereco_completo: enderecoCompleto,
          veiculo_marca: locacao.veiculo.marca,
          veiculo_modelo: locacao.veiculo.modelo,
          veiculo_ano: locacao.veiculo.ano,
          veiculo_placa: locacao.veiculo.placa,
          valor_veiculo_formatted: formatCurrency(locacao.veiculo.valor_veiculo),
          valor_diaria_formatted: formatCurrency(locacao.valor_diaria),
          valor_total_formatted: formatCurrency(locacao.valor_total),
          valor_caucao_formatted: formatCurrency(locacao.valor_caucao),
          data_locacao_formatted: formatDate(locacao.data_locacao),
          data_entrega_formatted: formatDate(locacao.data_entrega),
          data_atual_formatted: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
          observacoes: locacao.observacoes
        };

        // Se for contrato-data, retorna JSON
        if (isContratoData) {
          return response.status(200).json({ success: true, data: contractData });
        }
        
        // Se for contrato, retorna HTML
        const htmlContent = generateContractHTML(contractData);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        return response.status(200).send(htmlContent);
      }

      let query = supabase.from('locacoes').select('id, status, data_locacao, data_entrega, valor_total, observacoes, cliente_id, veiculo_id, valor_diaria, valor_caucao, cliente:clientes ( nome ), veiculo:veiculos ( marca, modelo, placa )');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(l => ({ ...l, cliente_nome: l.cliente?.nome, veiculo_info: `${l.veiculo?.marca} ${l.veiculo?.modelo} - ${l.veiculo?.placa}` }));
      return response.status(200).json({ success: true, data: formattedData });
    }

    if (method === 'POST') {
      const { veiculo_id, data_locacao, data_entrega } = request.body;
      const { data: veiculo, error: veiculoError } = await supabase.from('veiculos').select('status').eq('id', veiculo_id).single();

      if (veiculoError) throw veiculoError;
      if (!veiculo || veiculo.status !== 'disponivel') {
        return response.status(400).json({ success: false, error: "Veículo não está disponível" });
      }

      const { data: overlap, error: overlapError } = await supabase.from('locacoes').select('id').eq('veiculo_id', veiculo_id).eq('status', 'ativa').or(`data_locacao.lte.${data_entrega},data_entrega.gte.${data_locacao}`).single();

      if (overlapError && overlapError.code !== 'PGRST116') throw overlapError;
      if (overlap) {
        return response.status(400).json({ success: false, error: "Veículo já possui locação no período informado" });
      }

      const { data: newLocacao, error } = await supabase.from('locacoes').insert([request.body]).select().single();
      if (error) throw error;

      await supabase.from('veiculos').update({ status: 'locado' }).eq('id', veiculo_id);
      return response.status(200).json({ success: true, data: newLocacao });
    }

    if (method === 'PUT') {
      const locacaoId = parseInt(id, 10);
      if (!locacaoId) {
        return response.status(400).json({ success: false, error: 'ID da locação inválido ou ausente.' });
      }

      // 1. Fetch the existing location to get the veiculo_id
      const { data: currentLocacao, error: fetchError } = await supabase
        .from('locacoes')
        .select('veiculo_id, status')
        .eq('id', locacaoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar locação para atualização:', fetchError);
        return response.status(404).json({ success: false, error: 'Locação não encontrada.' });
      }

      // 2. Build the update object ONLY with fields present in the request body
      const updateData = {};
      const allowedFields = ['cliente_id', 'veiculo_id', 'data_locacao', 'data_entrega', 'valor_diaria', 'valor_total', 'valor_caucao', 'status', 'observacoes'];
      
      for (const key in request.body) {
        if (allowedFields.includes(key)) {
          updateData[key] = request.body[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ success: false, error: 'Nenhum campo válido para atualização foi fornecido.' });
      }

      // 3. Perform the update
      const { data: updatedLocacao, error: updateError } = await supabase
        .from('locacoes')
        .update(updateData)
        .eq('id', locacaoId)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar locação:', updateError);
        return response.status(500).json({ success: false, error: 'Falha ao atualizar a locação no banco de dados.', details: updateError.message });
      }

      // 4. If status changed to 'finalizada' or 'cancelada', update vehicle status
      const newStatus = updateData.status;
      if (newStatus && (newStatus === 'finalizada' || newStatus === 'cancelada')) {
        const { error: vehicleUpdateError } = await supabase
          .from('veiculos')
          .update({ status: 'disponivel' })
          .eq('id', currentLocacao.veiculo_id);
          
        if (vehicleUpdateError) {
            console.error('Erro ao atualizar status do veículo:', vehicleUpdateError);
            // Log the error, but don't block the response
        }
      }

      return response.status(200).json({ success: true, data: updatedLocacao });
    }

    if (method === 'DELETE') {
      if (!id) return response.status(400).json({ success: false, error: 'Missing ID' });
      const { data: locacao, error: locacaoError } = await supabase.from('locacoes').select('veiculo_id').eq('id', id).single();
      if (locacaoError) throw locacaoError;

      await supabase.from('locacoes').delete().eq('id', id);
      await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locacao.veiculo_id);
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função locações:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}