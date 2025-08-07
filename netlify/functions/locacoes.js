exports.handler = async (event, context) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const status = queryParams.status || '';
  const cliente_id = queryParams.cliente_id || '';
  
  // Mock data for rentals
  let locacoes = [
    {
      id: 1,
      cliente_id: 1,
      cliente_nome: "Cliente Teste 1",
      veiculo_id: 2,
      veiculo_info: "Honda Civic 2021 - DEF-5678",
      data_inicio: "2024-01-15",
      data_fim: "2024-01-20",
      data_devolucao: null,
      valor_diaria: 130.00,
      valor_total: 650.00,
      status: "ativa",
      observacoes: "Locação para viagem de negócios",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      cliente_id: 2,
      cliente_nome: "Cliente Teste 2",
      veiculo_id: 1,
      veiculo_info: "Toyota Corolla 2022 - ABC-1234",
      data_inicio: "2024-01-10",
      data_fim: "2024-01-12",
      data_devolucao: "2024-01-12",
      valor_diaria: 120.00,
      valor_total: 240.00,
      status: "finalizada",
      observacoes: "Devolução sem problemas",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-12T16:00:00Z"
    },
    {
      id: 3,
      cliente_id: 1,
      cliente_nome: "Cliente Teste 1",
      veiculo_id: 4,
      veiculo_info: "Ford EcoSport 2023 - JKL-3456",
      data_inicio: "2024-01-22",
      data_fim: "2024-01-25",
      data_devolucao: null,
      valor_diaria: 110.00,
      valor_total: 330.00,
      status: "reservada",
      observacoes: "Reserva para final de semana",
      created_at: "2024-01-20T14:00:00Z",
      updated_at: "2024-01-20T14:00:00Z"
    }
  ];
  
  // Filter by status if provided
  if (status) {
    locacoes = locacoes.filter(l => l.status === status);
  }
  
  // Filter by cliente_id if provided
  if (cliente_id) {
    const clienteIdInt = parseInt(cliente_id);
    if (!isNaN(clienteIdInt)) {
      locacoes = locacoes.filter(l => l.cliente_id === clienteIdInt);
    }
  }
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    },
    body: JSON.stringify({
      success: true,
      data: locacoes,
      total: locacoes.length,
      error: null
    })
  };
};