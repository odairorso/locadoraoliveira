import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;

    // Extrai o ID da URL para ser usado por GET (específico), PUT e DELETE
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathParts = url.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const id = /^[0-9]+$/.test(lastPart) ? lastPart : null;

    if (method === 'GET') {
      // Se um ID foi encontrado na URL, busca a vistoria específica
      if (id) {
        const { data: vistoria, error: vistoriaError } = await supabase
          .from('vistorias')
          .select(`
            *,
            clientes:cliente_id(nome, cpf, telefone),
            veiculos:veiculo_id(marca, modelo, placa, cor, ano)
          `)
          .eq('id', parseInt(id))
          .single();

        if (vistoriaError) {
          return response.status(404).json({
            success: false,
            error: 'Vistoria não encontrada'
          });
        }

        return response.status(200).json({
          success: true,
          data: vistoria
        });
      }
      
      const veiculosComEntrada = url.searchParams.get('veiculos_com_entrada');
      if (veiculosComEntrada === 'true') {
        // Buscar vistorias de entrada que não têm vistoria de saída correspondente
        const { data: vistoriasEntrada, error: entradaError } = await supabase
          .from('vistorias')
          .select(`
            id,
            veiculo_id,
            cliente_id,
            nome_condutor,
            placa,
            modelo,
            created_at,
            clientes:cliente_id(nome)
          `)
          .eq('tipo_vistoria', 'entrada')
          .order('created_at', { ascending: false });

        if (entradaError) throw entradaError;

        // Filtrar apenas veículos que não têm vistoria de saída
        const veiculosSemSaida = [];
        for (const entrada of vistoriasEntrada || []) {
          const { data: saidaExistente } = await supabase
            .from('vistorias')
            .select('id')
            .eq('tipo_vistoria', 'saida')
            .eq('veiculo_id', entrada.veiculo_id)
            .eq('cliente_id', entrada.cliente_id)
            .gte('created_at', entrada.created_at);

          if (!saidaExistente || saidaExistente.length === 0) {
            veiculosSemSaida.push({
              ...entrada,
              cliente_nome: entrada.clientes?.nome || 'Cliente não encontrado'
            });
          }
        }

        return response.status(200).json({
          success: true,
          data: veiculosSemSaida
        });
      }

      // Buscar clientes e veículos para o formulário
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, cpf, celular')
        .order('nome', { ascending: true });

      if (clientesError) throw clientesError;

      const { data: veiculos, error: veiculosError } = await supabase
        .from('veiculos')
        .select('id, marca, modelo, placa, cor, ano')
        .order('marca', { ascending: true });

      if (veiculosError) throw veiculosError;

      // Buscar vistorias existentes com dados relacionados
      const { data: vistorias, error: vistoriasError } = await supabase
        .from('vistorias')
        .select(`
          *,
          clientes:cliente_id(nome, cpf),
          veiculos:veiculo_id(marca, modelo, placa)
        `)
        .order('created_at', { ascending: false });

      if (vistoriasError) throw vistoriasError;

      return response.status(200).json({
        success: true,
        data: {
          clientes: clientes || [],
          veiculos: veiculos || [],
          vistorias: vistorias || []
        }
      });
    }

    if (method === 'POST') {
      const vistoriaData = request.body;

      // Validar dados obrigatórios
      if (!vistoriaData.clienteId || !vistoriaData.veiculoId || !vistoriaData.tipoVistoria) {
        return response.status(400).json({
          success: false,
          error: 'Campos obrigatórios: clienteId, veiculoId, tipoVistoria'
        });
      }

      // Preparar dados para inserção baseado na estrutura real da tabela
      const insertData = {
        cliente_id: parseInt(vistoriaData.clienteId),
        veiculo_id: parseInt(vistoriaData.veiculoId),
        tipo_vistoria: vistoriaData.tipoVistoria,
        data_vistoria: new Date().toISOString(),
        quilometragem: vistoriaData.quilometragem || null,
        nivel_combustivel: vistoriaData.combustivel || null,
        nome_condutor: vistoriaData.condutor || '',
        rg_condutor: vistoriaData.rgCondutor || null,
        placa: vistoriaData.placa || null,
        modelo: vistoriaData.modelo || null,
        cor: vistoriaData.cor || null,
        observacoes: vistoriaData.observacoes || null,
        avarias: vistoriaData.avariasJson || null,
        assinatura_cliente: vistoriaData.assinaturaClienteUrl || null,
        assinatura_vistoriador: vistoriaData.assinaturaVistoriadorUrl || null,
        nome_vistoriador: vistoriaData.nomeVistoriador || null,
        locacao_id: vistoriaData.locacaoId || null,
        fotos: vistoriaData.fotos ? JSON.stringify(vistoriaData.fotos) : '[]'
      };

      // Adicionar checklist items baseado na estrutura real
      if (vistoriaData.checklist) {
        const checklistMapping = {
          calota: 'item_calota',
          pneu: 'item_pneu',
          antena: 'item_antena',
          bateria: 'item_bateria',
          estepe: 'item_estepe',
          macaco: 'item_macaco',
          chaveRoda: 'item_chave_roda',
          triangulo: 'item_triangulo',
          extintor: 'item_extintor',
          tapetes: 'item_tapetes',
          som: 'item_som',
          documentos: 'item_documentos',
          higienizacao: 'item_higienizacao'
        };

        Object.keys(checklistMapping).forEach(frontendKey => {
          const dbKey = checklistMapping[frontendKey];
          if (vistoriaData.checklist[frontendKey] !== undefined) {
            insertData[dbKey] = vistoriaData.checklist[frontendKey];
          }
        });
      }

      const { data: newVistoria, error } = await supabase
        .from('vistorias')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      return response.status(200).json({ success: true, data: newVistoria });
    }

    if (method === 'PUT') {
      // O 'id' agora é extraído da URL no início do handler
      const vistoriaData = request.body;

      if (!id) {
        return response.status(400).json({
          success: false,
          error: 'ID da vistoria é obrigatório'
        });
      }

      // Preparar dados para atualização
      const updateData = {};
      
      if (vistoriaData.quilometragem !== undefined) updateData.quilometragem = vistoriaData.quilometragem;
      if (vistoriaData.combustivel !== undefined) updateData.nivel_combustivel = vistoriaData.combustivel;
      if (vistoriaData.condutor !== undefined) updateData.nome_condutor = vistoriaData.condutor;
      if (vistoriaData.rgCondutor !== undefined) updateData.rg_condutor = vistoriaData.rgCondutor;
      if (vistoriaData.observacoes !== undefined) updateData.observacoes = vistoriaData.observacoes;
      if (vistoriaData.avariasJson !== undefined) updateData.avarias = vistoriaData.avariasJson;
      if (vistoriaData.assinaturaClienteUrl !== undefined) updateData.assinatura_cliente = vistoriaData.assinaturaClienteUrl;
      if (vistoriaData.assinaturaVistoriadorUrl !== undefined) updateData.assinatura_vistoriador = vistoriaData.assinaturaVistoriadorUrl;
      if (vistoriaData.nomeVistoriador !== undefined) updateData.nome_vistoriador = vistoriaData.nomeVistoriador;
      if (vistoriaData.fotos !== undefined) updateData.fotos = JSON.stringify(vistoriaData.fotos);

      // Atualizar checklist se fornecido
      if (vistoriaData.checklist) {
        const checklistMapping = {
          calota: 'item_calota',
          pneu: 'item_pneu',
          antena: 'item_antena',
          bateria: 'item_bateria',
          estepe: 'item_estepe',
          macaco: 'item_macaco',
          chaveRoda: 'item_chave_roda',
          triangulo: 'item_triangulo',
          extintor: 'item_extintor',
          tapetes: 'item_tapetes',
          som: 'item_som',
          documentos: 'item_documentos',
          higienizacao: 'item_higienizacao'
        };

        Object.keys(checklistMapping).forEach(frontendKey => {
          const dbKey = checklistMapping[frontendKey];
          if (vistoriaData.checklist[frontendKey] !== undefined) {
            updateData[dbKey] = vistoriaData.checklist[frontendKey];
          }
        });
      }

      updateData.updated_at = new Date().toISOString();

      const { data: updatedVistoria, error } = await supabase
        .from('vistorias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return response.status(200).json({ success: true, data: updatedVistoria });
    }

    if (method === 'DELETE') {
      const { id } = request.query;

      if (!id) {
        return response.status(400).json({
          success: false,
          error: 'ID da vistoria é obrigatório'
        });
      }

      const { error } = await supabase
        .from('vistorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return response.status(200).json({ success: true, message: 'Vistoria excluída com sucesso' });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função vistorias:", error);
    return response.status(500).json({
      success: false,
      error: "Erro interno do servidor.",
      details: error.message
    });
  }
}