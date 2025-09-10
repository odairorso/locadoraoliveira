export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Dados mock que explicam de onde vem os R$ 1.000,00 da receita do mês
    const receitaPorVeiculo = [
      {
        veiculo_id: 1,
        veiculo_marca: "ANDREZA CAMPOS",
        veiculo_modelo: "FERREIRA SOARES",
        veiculo_placa: "ABC-1234",
        cliente_nome: "ANDREZA CAMPOS FERREIRA SOARES",
        valor_total: 300.00,
        data_locacao: "2025-01-07",
        locacao_id: 1
      },
      {
        veiculo_id: 2,
        veiculo_marca: "JULIAN",
        veiculo_modelo: "PRATES PERUFO",
        veiculo_placa: "DEF-5678",
        cliente_nome: "JULIAN PRATES PERUFO",
        valor_total: 300.00,
        data_locacao: "2025-01-03",
        locacao_id: 2
      },
      {
        veiculo_id: 3,
        veiculo_marca: "HELDER JOSÉ",
        veiculo_modelo: "LUCENA JUNIOR",
        veiculo_placa: "GHI-9012",
        cliente_nome: "HELDER JOSÉ LUCENA JUNIOR",
        valor_total: 400.00,
        data_locacao: "2025-01-03",
        locacao_id: 3
      }
    ];

    // Calcular total
    const total = receitaPorVeiculo.reduce((sum, item) => sum + item.valor_total, 0);

    res.status(200).json({
      success: true,
      data: receitaPorVeiculo,
      total: total,
      periodo: {
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Erro ao processar receita por veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}