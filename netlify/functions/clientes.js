exports.handler = async (event, context) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const search = queryParams.search || '';
  const limit = queryParams.limit || '';
  
  // Mock data for clients
  let clientes = [
    {
      id: 1,
      nome: "Cliente Teste 1",
      cpf: "111.111.111-11",
      celular: "(11) 91111-1111",
      email: "teste1@example.com",
      endereco: "Rua A, 123",
      bairro: "Centro",
      cidade: "Cidade Teste",
      estado: "TS",
      cep: "11111-111",
      data_nascimento: "1985-05-15",
      rg: "12.345.678-9",
      cnh: "12345678901",
      status: "ativo",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z"
    },
    {
      id: 2,
      nome: "Cliente Teste 2",
      cpf: "222.222.222-22",
      celular: "(22) 92222-2222",
      email: "teste2@example.com",
      endereco: "Rua B, 456",
      bairro: "Bairro Teste",
      cidade: "Cidade Teste",
      estado: "TS",
      cep: "22222-222",
      data_nascimento: "1990-08-22",
      rg: "98.765.432-1",
      cnh: "98765432109",
      status: "ativo",
      created_at: "2024-01-02T14:30:00Z",
      updated_at: "2024-01-02T14:30:00Z"
    },
    {
      id: 3,
      nome: "Maria Silva",
      cpf: "333.333.333-33",
      celular: "(33) 93333-3333",
      email: "maria.silva@example.com",
      endereco: "Av. Principal, 789",
      bairro: "Jardim das Flores",
      cidade: "Cidade Nova",
      estado: "SP",
      cep: "33333-333",
      data_nascimento: "1988-12-10",
      rg: "11.222.333-4",
      cnh: "11223344556",
      status: "ativo",
      created_at: "2024-01-03T09:15:00Z",
      updated_at: "2024-01-03T09:15:00Z"
    }
  ];
  
  // Filter by search term if provided
  if (search) {
    const searchLower = search.toLowerCase();
    clientes = clientes.filter(c => 
      c.nome.toLowerCase().includes(searchLower) ||
      c.cpf.includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply limit if provided
  if (limit) {
    const limitInt = parseInt(limit);
    if (!isNaN(limitInt)) {
      clientes = clientes.slice(0, limitInt);
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
      data: clientes,
      total: clientes.length,
      error: null
    })
  };
};