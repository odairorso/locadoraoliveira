import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { 
  ClienteCreateSchema, 
  VeiculoCreateSchema,
  LocacaoCreateSchema,
  type Cliente, 
  type Veiculo,
  type Locacao,
  type ApiResponse,
  type DashboardStats 
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Dashboard endpoint
app.get("/api/dashboard", async (c) => {
  try {
    const db = c.env.DB;
    
    // Count active rentals
    const activeRentals = await db.prepare("SELECT COUNT(*) as count FROM locacoes WHERE status = 'ativa'").first();
    
    // Count available vehicles
    const availableVehicles = await db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'disponivel'").first();
    
    // Count rented vehicles
    const rentedVehicles = await db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'locado'").first();
    
    // Calculate current month revenue
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const revenue = await db.prepare("SELECT COALESCE(SUM(valor_total), 0) as total FROM locacoes WHERE strftime('%Y-%m', created_at) = ? AND status != 'cancelada'").bind(currentMonth).first();
    
    const stats: DashboardStats = {
      locacoesAtivas: (activeRentals as any)?.count || 0,
      veiculosDisponiveis: (availableVehicles as any)?.count || 0,
      veiculosLocados: (rentedVehicles as any)?.count || 0,
      receitaMes: (revenue as any)?.total || 0
    };

    return c.json({ success: true, data: stats } as ApiResponse<DashboardStats>);
  } catch (error) {
    console.error("Dashboard error:", error);
    return c.json({ success: false, error: "Erro ao carregar dashboard" } as ApiResponse<never>, 500);
  }
});

// Cliente endpoints
app.get("/api/clientes", async (c) => {
  try {
    const db = c.env.DB;
    const search = c.req.query("search") || "";
    
    let query = "SELECT * FROM clientes";
    let params: string[] = [];
    
    if (search) {
      query += " WHERE nome LIKE ? OR cpf LIKE ?";
      params = [`%${search}%`, `%${search}%`];
    }
    
    query += " ORDER BY nome ASC";
    
    const stmt = db.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    
    return c.json({ success: true, data: result.results } as ApiResponse<Cliente[]>);
  } catch (error) {
    console.error("Get clientes error:", error);
    return c.json({ success: false, error: "Erro ao buscar clientes" } as ApiResponse<never>, 500);
  }
});

app.post("/api/clientes", zValidator("json", ClienteCreateSchema), async (c) => {
  try {
    const db = c.env.DB;
    const data = c.req.valid("json");
    
    // Check if CPF already exists
    const existing = await db.prepare("SELECT id FROM clientes WHERE cpf = ?").bind(data.cpf).first();
    if (existing) {
      return c.json({ success: false, error: "CPF já cadastrado" } as ApiResponse<never>, 400);
    }
    
    const result = await db.prepare(`
      INSERT INTO clientes (nome, cpf, celular, endereco, bairro, cidade, estado, cep, email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(data.nome, data.cpf, data.celular, data.endereco, data.bairro || null, data.cidade || null, data.estado || null, data.cep || null, data.email).run();
    
    if (result.success) {
      const cliente = await db.prepare("SELECT * FROM clientes WHERE id = ?").bind(result.meta.last_row_id).first();
      return c.json({ success: true, data: cliente } as ApiResponse<Cliente>);
    } else {
      return c.json({ success: false, error: "Erro ao criar cliente" } as ApiResponse<never>, 500);
    }
  } catch (error) {
    console.error("Create cliente error:", error);
    return c.json({ success: false, error: "Erro ao criar cliente" } as ApiResponse<never>, 500);
  }
});

app.put("/api/clientes/:id", zValidator("json", ClienteCreateSchema), async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    // Check if CPF already exists for another client
    const existing = await db.prepare("SELECT id FROM clientes WHERE cpf = ? AND id != ?").bind(data.cpf, id).first();
    if (existing) {
      return c.json({ success: false, error: "CPF já cadastrado para outro cliente" } as ApiResponse<never>, 400);
    }
    
    const result = await db.prepare(`
      UPDATE clientes 
      SET nome = ?, cpf = ?, celular = ?, endereco = ?, bairro = ?, cidade = ?, estado = ?, cep = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(data.nome, data.cpf, data.celular, data.endereco, data.bairro || null, data.cidade || null, data.estado || null, data.cep || null, data.email, id).run();
    
    if (result.success && result.meta.changes > 0) {
      const cliente = await db.prepare("SELECT * FROM clientes WHERE id = ?").bind(id).first();
      return c.json({ success: true, data: cliente } as ApiResponse<Cliente>);
    } else {
      return c.json({ success: false, error: "Cliente não encontrado" } as ApiResponse<never>, 404);
    }
  } catch (error) {
    console.error("Update cliente error:", error);
    return c.json({ success: false, error: "Erro ao atualizar cliente" } as ApiResponse<never>, 500);
  }
});

app.delete("/api/clientes/:id", async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    
    // Check if client has active rentals
    const activeRentals = await db.prepare("SELECT id FROM locacoes WHERE cliente_id = ? AND status = 'ativa'").bind(id).first();
    if (activeRentals) {
      return c.json({ success: false, error: "Cliente possui locações ativas" } as ApiResponse<never>, 400);
    }
    
    const result = await db.prepare("DELETE FROM clientes WHERE id = ?").bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true } as ApiResponse<never>);
    } else {
      return c.json({ success: false, error: "Cliente não encontrado" } as ApiResponse<never>, 404);
    }
  } catch (error) {
    console.error("Delete cliente error:", error);
    return c.json({ success: false, error: "Erro ao excluir cliente" } as ApiResponse<never>, 500);
  }
});

// Veículo endpoints
app.get("/api/veiculos", async (c) => {
  try {
    const db = c.env.DB;
    const search = c.req.query("search") || "";
    const status = c.req.query("status") || "";
    
    let query = "SELECT * FROM veiculos";
    let params: string[] = [];
    let conditions: string[] = [];
    
    if (search) {
      conditions.push("(modelo LIKE ? OR marca LIKE ? OR placa LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY marca ASC, modelo ASC";
    
    const stmt = db.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    
    return c.json({ success: true, data: result.results } as ApiResponse<Veiculo[]>);
  } catch (error) {
    console.error("Get veiculos error:", error);
    return c.json({ success: false, error: "Erro ao buscar veículos" } as ApiResponse<never>, 500);
  }
});

app.post("/api/veiculos", zValidator("json", VeiculoCreateSchema), async (c) => {
  try {
    const db = c.env.DB;
    const data = c.req.valid("json");
    
    // Check if placa or renavam already exists
    const existing = await db.prepare("SELECT id FROM veiculos WHERE placa = ? OR renavam = ?").bind(data.placa, data.renavam).first();
    if (existing) {
      return c.json({ success: false, error: "Placa ou Renavam já cadastrados" } as ApiResponse<never>, 400);
    }
    
    const result = await db.prepare(`
      INSERT INTO veiculos (modelo, marca, ano, placa, renavam, cor, valor_diaria, valor_veiculo, tipo_operacao, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.modelo, 
      data.marca, 
      data.ano, 
      data.placa, 
      data.renavam, 
      data.cor, 
      data.valor_diaria || null, 
      data.valor_veiculo, 
      data.tipo_operacao, 
      data.status || 'disponivel'
    ).run();
    
    if (result.success) {
      const veiculo = await db.prepare("SELECT * FROM veiculos WHERE id = ?").bind(result.meta.last_row_id).first();
      return c.json({ success: true, data: veiculo } as ApiResponse<Veiculo>);
    } else {
      return c.json({ success: false, error: "Erro ao criar veículo" } as ApiResponse<never>, 500);
    }
  } catch (error) {
    console.error("Create veiculo error:", error);
    return c.json({ success: false, error: "Erro ao criar veículo" } as ApiResponse<never>, 500);
  }
});

// Locação endpoints
app.get("/api/locacoes", async (c) => {
  try {
    const db = c.env.DB;
    const search = c.req.query("search") || "";
    const status = c.req.query("status") || "";
    
    let query = `
      SELECT l.*, 
             c.nome as cliente_nome,
             (v.marca || ' ' || v.modelo || ' - ' || v.placa) as veiculo_info
      FROM locacoes l
      JOIN clientes c ON l.cliente_id = c.id
      JOIN veiculos v ON l.veiculo_id = v.id
    `;
    let params: string[] = [];
    let conditions: string[] = [];
    
    if (search) {
      conditions.push("(c.nome LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ? OR v.placa LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push("l.status = ?");
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY l.created_at DESC";
    
    const stmt = db.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    
    return c.json({ success: true, data: result.results } as ApiResponse<(Locacao & { cliente_nome: string; veiculo_info: string })[]>);
  } catch (error) {
    console.error("Get locacoes error:", error);
    return c.json({ success: false, error: "Erro ao buscar locações" } as ApiResponse<never>, 500);
  }
});

app.post("/api/locacoes", zValidator("json", LocacaoCreateSchema), async (c) => {
  try {
    const db = c.env.DB;
    const data = c.req.valid("json");
    
    // Check if vehicle is available
    const veiculo = await db.prepare("SELECT status FROM veiculos WHERE id = ?").bind(data.veiculo_id).first();
    if (!veiculo || (veiculo as any).status !== 'disponivel') {
      return c.json({ success: false, error: "Veículo não está disponível" } as ApiResponse<never>, 400);
    }
    
    // Check for overlapping rentals
    const overlap = await db.prepare(`
      SELECT id FROM locacoes 
      WHERE veiculo_id = ? AND status = 'ativa'
      AND (
        (data_locacao <= ? AND data_entrega >= ?) OR
        (data_locacao <= ? AND data_entrega >= ?) OR
        (data_locacao >= ? AND data_entrega <= ?)
      )
    `).bind(
      data.veiculo_id,
      data.data_locacao, data.data_locacao,
      data.data_entrega, data.data_entrega,
      data.data_locacao, data.data_entrega
    ).first();
    
    if (overlap) {
      return c.json({ success: false, error: "Veículo já possui locação no período informado" } as ApiResponse<never>, 400);
    }
    
    // Create rental
    const result = await db.prepare(`
      INSERT INTO locacoes (cliente_id, veiculo_id, data_locacao, data_entrega, valor_diaria, valor_total, valor_caucao, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.cliente_id, 
      data.veiculo_id, 
      data.data_locacao, 
      data.data_entrega, 
      data.valor_diaria, 
      data.valor_total, 
      data.valor_caucao || 0,
      data.status || 'ativa',
      data.observacoes || null
    ).run();
    
    if (result.success) {
      // Update vehicle status to 'locado'
      await db.prepare("UPDATE veiculos SET status = 'locado' WHERE id = ?").bind(data.veiculo_id).run();
      
      const locacao = await db.prepare("SELECT * FROM locacoes WHERE id = ?").bind(result.meta.last_row_id).first();
      return c.json({ success: true, data: locacao } as ApiResponse<Locacao>);
    } else {
      return c.json({ success: false, error: "Erro ao criar locação" } as ApiResponse<never>, 500);
    }
  } catch (error) {
    console.error("Create locacao error:", error);
    return c.json({ success: false, error: "Erro ao criar locação" } as ApiResponse<never>, 500);
  }
});

app.put("/api/locacoes/:id", zValidator("json", LocacaoCreateSchema), async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    // Get current rental
    const currentLocacao = await db.prepare("SELECT * FROM locacoes WHERE id = ?").bind(id).first() as any;
    if (!currentLocacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const result = await db.prepare(`
      UPDATE locacoes 
      SET cliente_id = ?, veiculo_id = ?, data_locacao = ?, data_entrega = ?, 
          valor_diaria = ?, valor_total = ?, valor_caucao = ?, status = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.cliente_id, 
      data.veiculo_id, 
      data.data_locacao, 
      data.data_entrega, 
      data.valor_diaria, 
      data.valor_total, 
      data.valor_caucao || 0,
      data.status, 
      data.observacoes || null, 
      id
    ).run();
    
    if (result.success && result.meta.changes > 0) {
      // Update vehicle status based on rental status
      if (data.status === 'finalizada' || data.status === 'cancelada') {
        await db.prepare("UPDATE veiculos SET status = 'disponivel' WHERE id = ?").bind(data.veiculo_id).run();
      } else if (data.status === 'ativa' && currentLocacao.status !== 'ativa') {
        await db.prepare("UPDATE veiculos SET status = 'locado' WHERE id = ?").bind(data.veiculo_id).run();
      }
      
      const locacao = await db.prepare("SELECT * FROM locacoes WHERE id = ?").bind(id).first();
      return c.json({ success: true, data: locacao } as ApiResponse<Locacao>);
    } else {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
  } catch (error) {
    console.error("Update locacao error:", error);
    return c.json({ success: false, error: "Erro ao atualizar locação" } as ApiResponse<never>, 500);
  }
});

app.delete("/api/locacoes/:id", async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    
    // Get rental info before deleting
    const locacao = await db.prepare("SELECT veiculo_id, status FROM locacoes WHERE id = ?").bind(id).first() as any;
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const result = await db.prepare("DELETE FROM locacoes WHERE id = ?").bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      // If rental was active, make vehicle available again
      if (locacao.status === 'ativa') {
        await db.prepare("UPDATE veiculos SET status = 'disponivel' WHERE id = ?").bind(locacao.veiculo_id).run();
      }
      
      return c.json({ success: true } as ApiResponse<never>);
    } else {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
  } catch (error) {
    console.error("Delete locacao error:", error);
    return c.json({ success: false, error: "Erro ao excluir locação" } as ApiResponse<never>, 500);
  }
});

// Contract data endpoint for preview
app.get("/api/locacoes/:id/contrato-data", async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    
    // Get rental with client and vehicle info
    const locacao = await db.prepare(`
      SELECT l.*, 
             c.nome as cliente_nome, c.cpf as cliente_cpf, 
             c.endereco, c.bairro, c.cidade, c.estado, c.cep,
             v.marca, v.modelo, v.ano, v.placa, v.valor_veiculo
      FROM locacoes l
      JOIN clientes c ON l.cliente_id = c.id
      JOIN veiculos v ON l.veiculo_id = v.id
      WHERE l.id = ?
    `).bind(id).first() as any;
    
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    // Format address
    let endereco_completo = locacao.endereco;
    if (locacao.bairro) endereco_completo += `, ${locacao.bairro}`;
    if (locacao.cidade) endereco_completo += ` - ${locacao.cidade}`;
    if (locacao.estado) endereco_completo += `/${locacao.estado}`;
    if (locacao.cep) endereco_completo += ` - ${locacao.cep}`;
    
    const contractData = {
      id: locacao.id,
      cliente_nome: locacao.cliente_nome,
      cliente_cpf: locacao.cliente_cpf,
      endereco_completo,
      veiculo_marca: locacao.marca,
      veiculo_modelo: locacao.modelo,
      veiculo_ano: locacao.ano,
      veiculo_placa: locacao.placa,
      valor_veiculo: locacao.valor_veiculo,
      valor_veiculo_formatted: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(locacao.valor_veiculo),
      valor_diaria: locacao.valor_diaria,
      valor_diaria_formatted: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(locacao.valor_diaria),
      valor_total: locacao.valor_total,
      valor_total_formatted: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(locacao.valor_total),
      data_locacao: locacao.data_locacao,
      data_locacao_formatted: new Date(locacao.data_locacao + 'T00:00:00').toLocaleDateString('pt-BR'),
      data_entrega: locacao.data_entrega,
      data_entrega_formatted: new Date(locacao.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR'),
      data_atual: new Date().toLocaleDateString('pt-BR'),
      valor_caucao: locacao.valor_caucao || 0,
      valor_caucao_formatted: locacao.valor_caucao > 0 ? new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(locacao.valor_caucao) : 'ISENTO',
      valor_caucao_extenso: locacao.valor_caucao > 0 ? `(${locacao.valor_caucao})` : '(isento)',
      observacoes: locacao.observacoes
    };
    
    return c.json({ success: true, data: contractData } as ApiResponse<any>);
  } catch (error) {
    console.error("Get contract data error:", error);
    return c.json({ success: false, error: "Erro ao carregar dados do contrato" } as ApiResponse<never>, 500);
  }
});

// Contract generation endpoint
app.get("/api/locacoes/:id/contrato", async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    
    // Get rental with client and vehicle info
    const locacao = await db.prepare(`
      SELECT l.*, 
             c.nome as cliente_nome, c.cpf as cliente_cpf, 
             c.endereco, c.bairro, c.cidade, c.estado, c.cep,
             v.marca, v.modelo, v.ano, v.placa, v.valor_veiculo
      FROM locacoes l
      JOIN clientes c ON l.cliente_id = c.id
      JOIN veiculos v ON l.veiculo_id = v.id
      WHERE l.id = ?
    `).bind(id).first() as any;
    
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    // Format address
    let endereco_completo = locacao.endereco;
    if (locacao.bairro) endereco_completo += `, ${locacao.bairro}`;
    if (locacao.cidade) endereco_completo += ` - ${locacao.cidade}`;
    if (locacao.estado) endereco_completo += `/${locacao.estado}`;
    if (locacao.cep) endereco_completo += ` - ${locacao.cep}`;
    
    // Generate the complete contract HTML following the exact format provided
    const contractHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Locação de Veículo</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { height: 80px; margin-bottom: 20px; }
    h1 { margin: 20px 0; font-size: 18px; font-weight: bold; }
    h3 { margin: 20px 0 10px 0; font-weight: bold; }
    p { margin: 10px 0; text-align: justify; }
    .signature-section { margin-top: 50px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature { text-align: center; width: 200px; }
    .signature-line { border-top: 1px solid black; padding-top: 5px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://mocha-cdn.com/01988471-cbda-7e3e-9eda-75676806ade8/ChatGPT-Image-6-de-ago.-de-2025,-07_.png" alt="Oliveira Veículos" class="logo">
    <h1>CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
  </div>

  <p><strong>Entre:</strong></p>
  
  <p>a pessoa jurídica OR DOS SANTOS DE OLIVEIRA LTDA, inscrita sob o CNPJ n.º 17.909.442/0001-58, com sede em Av campo grande 707 centro, neste ato representada, conforme poderes especialmente conferidos, por: João Roberto dos Santos de Oliveira, na qualidade de: Administrador, CPF n.º 008.714.291-01, carteira de identidade n.º 1447272 doravante denominada <strong>LOCADORA</strong>, e:</p>
  
  <p><strong>${locacao.cliente_nome}</strong>, CPF n.º <strong>${locacao.cliente_cpf}</strong>, residente em: <strong>${endereco_completo}</strong>, doravante denominado <strong>LOCATÁRIO</strong>.</p>

  <p>As partes acima identificadas têm entre si justo e acertado o presente contrato de locação de veículo, ficando desde já aceito nas cláusulas e condições abaixo descritas.</p>

  <h3>CLÁUSULA 1ª – DO OBJETO</h3>
  <p>Por meio deste contrato, que firmam entre si a LOCADORA e o LOCATÁRIO, regula-se a locação do veículo:</p>
  <p><strong>${locacao.marca} ${locacao.modelo} ano ${locacao.ano}</strong></p>
  <p>Com placa <strong>${locacao.placa}</strong>, e com o valor de mercado aproximado em <strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(locacao.valor_veiculo)}</strong>.</p>
  <p>Parágrafo único. O presente contrato é acompanhado de um laudo de vistoria, que descreve o veículo e o seu estado de conservação no momento em que o mesmo foi entregue ao LOCATÁRIO.</p>

  <h3>CLÁUSULA 2ª – DO VALOR DO ALUGUEL</h3>
  <p>O valor da diária do aluguel, livremente ajustado pelas partes, é de <strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(locacao.valor_diaria)}</strong>.</p>
  <p>§ 1º. O LOCATÁRIO deverá efetuar o pagamento do valor acordado, por meio de pix, utilizando a chave 17909442000158, ou em espécie, ou cartão.</p>
  <p>§ 2º. Em caso de atraso no pagamento do aluguel, será aplicada multa de 5% (cinco por cento), sobre o valor devido, bem como juros de mora de 3% (três por cento) ao mês, mais correção monetária, apurada conforme variação do IGP-M no período.</p>
  <p>§ 3º. O LOCATÁRIO, não vindo a efetuar o pagamento do aluguel por um período de atraso superior à 7 (sete) dias, fica sujeito a ter a posse do veículo configurada como Apropriação Indébita, implicando também a possibilidade de adoção de medidas judiciais, inclusive a Busca e Apreensão do veículo e/ou lavratura de Boletim de Ocorrência, cabendo ao LOCATÁRIO ressarcir a LOCADORA das despesas oriundas da retenção indevida do bem, arcando ainda com as despesas judiciais e/ou extrajudiciais que a LOCADORA venha a ter para efetuar a busca, apreensão e efetiva reintegração da posse do veículo.</p>
  <p>§ 4º. Será de responsabilidade do LOCATÁRIO as despesas referentes à utilização do veículo.</p>
  <p>§ 5º. O valor do aluguel firmado neste contrato será reajustado a cada 12 (doze) meses, tendo como base o índice IGP. Em caso de falta deste índice, o reajuste do valor da locação terá por base a média da variação dos índices inflacionários do ano corrente ao da execução da locação.</p>

  <h3>CLÁUSULA 3ª – DO PRAZO DO ALUGUEL</h3>
  <p>O prazo de locação do referido veículo é de <strong>${new Date(locacao.data_locacao + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(locacao.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>.</p>
  <p>§ 1º. Ao final do prazo estipulado, caso as partes permaneçam inertes, a locação prorrogar-se-á automaticamente por tempo indeterminado.</p>
  <p>§ 2º. Caso a LOCADORA não queira prorrogar a locação ao terminar o prazo estipulado neste contrato, e o referido veículo não for devolvido, será cobrado o valor do aluguel proporcional aos dias de atraso acumulado de multa diária de <strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(locacao.valor_diaria)}</strong>.</p>
  <p>§ 3º. Finda a locação, o LOCATÁRIO deverá devolver o veículo nas mesmas condições em que recebeu, salvo os desgastes decorrentes do uso normal, sob pena de indenização por perdas e danos a ser apurada.</p>

  <h3>CLÁUSULA 4ª – DO COMBUSTÍVEL</h3>
  <p>O veículo será entregue ao LOCATÁRIO com um tanque de combustível completo, e sua quantidade será marcada no laudo de vistoria no momento da retirada.</p>
  <p>§ 1º. Ao final do prazo estipulado, o LOCATÁRIO deverá devolver o veículo à LOCADORA com o tanque de combustível completo.</p>
  <p>§ 2º. Caso não ocorra o cumprimento do parágrafo anterior, será cobrado o valor correspondente a leitura do marcador em oitavos, com base em tabela própria, e o valor do litro será informado no momento da retirada pela LOCADORA.</p>
  <p>§ 3º. Caso seja constatado a utilização de combustível adulterado, o LOCATÁRIO responderá pelo mesmo e pelos danos decorrentes de tal utilização.</p>
  <p>§ 4º. Fica desde já acordado que o LOCATÁRIO não terá direito a ressarcimento caso devolva o veículo com uma quantidade de combustível superior a que recebeu.</p>

  <h3>CLÁUSULA 5ª – DA LIMPEZA</h3>
  <p>O veículo será entregue ao LOCATÁRIO limpo e deverá ser devolvido à LOCADORA nas mesmas condições higiênicas que foi retirado.</p>
  <p>§ 1º. Caso o veículo seja devolvido sujo, interna ou externamente, será cobrada uma taxa de lavagem simples ou especial, dependendo do estado do veículo na devolução.</p>
  <p>§ 2º. Caso haja a necessidade de lavagem especial, será cobrada, além da taxa de lavagem, o valor mínimo de (uma) diária de locação, ou quantas diárias forem necessárias até a disponibilização do veículo para locação, limitado a 5 (cinco) diárias do veículo com base na tarifa vigente.</p>

  <h3>CLÁUSULA 6ª – DA UTILIZAÇÃO</h3>
  <p>§ 1º. Deverá também o LOCATÁRIO utilizar o veículo alugado sempre de acordo com os regulamentos estabelecidos pelo Conselho Nacional de Trânsito (CONTRAN) e pelo Departamento Estadual de Trânsito (DETRAN).</p>
  <p>§ 2º. A utilização do veículo de forma diferente do descrito acima estará sujeita à cobrança de multa, assim como poderá a LOCADORA dar por rescindido o presente contrato independente de qualquer notificação, e sem maiores formalidades poderá também proceder com o recolhimento do veículo sem que seja ensejada qualquer pretensão para ação indenizatória, reparatória ou compensatória pelo LOCATÁRIO.</p>
  <p>§ 3º. Qualquer modificação no veículo só poderá ser feita com a autorização expressa da LOCADORA.</p>
  <p>§ 4º. O LOCATÁRIO declara estar ciente que quaisquer danos causados, materiais ou pessoais, decorrente da utilização do veículo ora locado, será de sua responsabilidade.</p>

  <h3>CLÁUSULA 7ª – RESTRIÇÃO TERRITORIAL</h3>
  <p>O LOCATÁRIO se compromete a utilizar o veículo exclusivamente dentro do território nacional brasileiro, sendo expressamente proibida sua saída para qualquer outro país. O descumprimento desta cláusula implicará em multa de R$ 280,00 (duzentos e oitenta reais) e rescisão imediata do presente contrato, sem prejuízo das demais medidas legais cabíveis.</p>

  <h3>CLÁUSULA 8ª – DAS MULTAS E INFRAÇÕES</h3>
  <p>As multas ou quaisquer outras infrações às leis de trânsito, cometidas durante o período da locação do veículo, serão de responsabilidade do LOCATÁRIO, devendo ser liquidadas quando da notificação pelos órgãos competentes ou no final do contrato, o que ocorrer primeiro.</p>
  <p>§ 1º. Em caso de apreensão do veículo, serão cobradas do LOCATÁRIO todas as despesas de serviço dos profissionais envolvidos para liberação do veículo alugado, assim como todas as taxas cobradas pelos órgãos competentes, e também quantas diárias forem necessárias até a disponibilização do veículo para locação.</p>
  <p>§ 2º. O LOCATÁRIO declara-se ciente e concorda que se ocorrer qualquer multa ou infração de trânsito durante a vigência deste contrato, seu nome poderá ser indicado pela LOCADORA junto ao Órgão de Trânsito autuante, na qualidade de condutor do veículo, tendo assim a pontuação recebida transferida para sua carteira de habilitação.</p>
  <p>§ 3º. A LOCADORA poderá preencher os dados relativos à "apresentação do Condutor", previsto na Resolução 404/12 do CONTRAN, caso tenha sido lavrada autuação por infrações de trânsito enquanto o veículo esteve em posse e responsabilidade do LOCATÁRIO, situação na qual a LOCADORA apresentará para o Órgão de Trânsito competente a cópia do presente contrato celebrado com o LOCATÁRIO.</p>
  <p>§ 4º. Descabe qualquer discussão sobre a procedência ou improcedência das infrações de trânsito aplicadas, e poderá o LOCATÁRIO, a seu critério e às suas expensas, recorrer das multas, junto ao Órgão de Trânsito competente, o que não o eximirá do pagamento do valor da multa, mas lhe dará o direito ao reembolso, caso o recurso seja julgado procedente.</p>

  <h3>CLÁUSULA 9ª – DA VEDAÇÃO À SUBLOCAÇÃO E EMPRÉSTIMO DO VEÍCULO</h3>
  <p>Será permitido o uso do veículo objeto do presente contrato, apenas pelo LOCATÁRIO, sendo vedada, no todo ou em parte, a sublocação, transferência, empréstimo, comodato ou cessão da locação, seja a qualquer título, sem expressa anuência da LOCADORA, sob pena de imediata rescisão, aplicação de multa e de demais penalidades contratuais e legais cabíveis.</p>
  <p>Parágrafo único. Ocorrendo a utilização do veículo por terceiros com a concordância do LOCATÁRIO, este se responsabilizará por qualquer ação civil ou criminal que referida utilização possa gerar, isentando assim a LOCADORA de qualquer responsabilidade, ou ônus.</p>

  <h3>CLÁUSULA 10ª – DA MANUTENÇÃO</h3>
  <p>A manutenção do veículo, referente a troca das peças oriundas do desgaste natural de sua utilização, é de responsabilidade do LOCATÁRIO, sem ônus para a LOCADORA.</p>
  <p>Parágrafo único. Se durante o período da manutenção o LOCATÁRIO não dispor do bem, ou de outro de categoria igual ou similar, terá desconto no aluguel, proporcional ao período de manutenção.</p>

  <h3>CLÁUSULA 11ª – DA UTILIZAÇÃO DO SEGURO</h3>
  <p>Ocorrendo a necessidade da utilização do seguro veicular, registrado em nome da LOCADORA, devido à perda, extravio, furto, roubo, destruição parcial ou total, ou colisão do veículo por ora locado, fica desde já estipulada indenização devida pelo LOCATÁRIO que deverá, para efeito de cobertura do valor da franquia do seguro veicular, pagar à LOCADORA o valor de R$ 3.520,00 (três mil e quinhentos e vinte reais).</p>

  <h3>CLÁUSULA 12ª – DOS DEVERES DO LOCATÁRIO</h3>
  <p>Sem prejuízo de outras disposições deste contrato, constituem obrigações do LOCATÁRIO:</p>
  <p>I – pagar o aluguel e os encargos da locação, legal ou contratualmente exigíveis, no prazo estipulado;</p>
  <p>II – usar o veículo como foi convencionado, de acordo com a sua natureza e com o objetivo a que se destina;</p>
  <p>III – cuidar e zelar do veículo como se fosse sua propriedade;</p>
  <p>IV – restituir o veículo, no final da locação, no estado em que o recebeu, conforme o laudo de vistoria, salvo as deteriorações decorrentes do seu uso normal;</p>
  <p>V – levar imediatamente ao conhecimento da LOCADORA o surgimento de qualquer dano, ou ocorrência, cuja reparação, e ou indenização, a esta enquadre;</p>
  <p>VI – reparar rapidamente os danos sob sua responsabilidade;</p>
  <p>VII – não modificar a forma interna ou externa do veículo sem o consentimento prévio e por escrito da LOCADORA.</p>

  <h3>CLÁUSULA 13ª – DOS DEVERES DA LOCADORA</h3>
  <p>Sem prejuízo de outras disposições deste contrato, constituem obrigações da LOCADORA:</p>
  <p>I – entregar ao LOCATÁRIO o veículo alugado em estado de servir ao uso a que se destina;</p>
  <p>II – ser integralmente responsável pelos problemas, defeitos e vícios anteriores à locação.</p>

  <h3>CLÁUSULA 14ª – DA GARANTIA</h3>
  <p>O cumprimento das obrigações previstas neste contrato, inclusive o pagamento pontual do aluguel, estará garantido por caução dada em dinheiro, perfazendo o montante de ${locacao.valor_caucao > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(locacao.valor_caucao) : 'R$ ISENTO'} ${locacao.valor_caucao > 0 ? `(${locacao.valor_caucao})` : '(isento)'}, entregue à LOCADORA no ato de assinatura deste contrato.</p>
  <p>§ 1º. Ao final da locação, tendo sido todas as obrigações devidamente cumpridas, o LOCATÁRIO estará autorizado a levantar a respectiva soma.</p>
  <p>§ 2º. A critério das partes, o valor dado como caução poderá ser revertido para o pagamento de aluguéis devidos.</p>

  <h3>CLÁUSULA 15ª – DA RESCISÃO</h3>
  <p>As partes poderão rescindir o contrato unilateralmente, sem apresentação de justificativa.</p>
  <p>Parágrafo único. Em cumprimento ao princípio da boa-fé, as partes se comprometem a informar uma à outra qualquer fato que possa porventura intervir na relação jurídica formalizada através do presente contrato.</p>

  <h3>CLÁUSULA 16ª – DAS PENALIDADES</h3>
  <p>A parte que violar as obrigações previstas neste contrato se sujeitará ao pagamento de indenização e ressarcimento pelas perdas, danos, lucros cessantes, danos indiretos e quaisquer outros prejuízos patrimoniais ou morais percebidos pela outra parte em decorrência deste descumprimento, sem prejuízo de demais penalidades legais ou contratuais cabíveis.</p>
  <p>§ 1º. Caso ocorra uma violação, este contrato poderá ser rescindido de pleno direito pela parte prejudicada, sem a necessidade aviso prévio.</p>
  <p>§ 2º. Ocorrendo uma tolerância de uma das partes em relação ao descumprimento das cláusulas contidas neste instrumento não se configura em renúncia ou alteração da norma infringida.</p>

  <h3>CLÁUSULA 17ª – DO FORO</h3>
  <p>Fica desde já eleito o foro da comarca de Naviraí para serem resolvidas eventuais pendências decorrentes deste contrato.</p>

  <p>Por estarem assim certos e ajustados, firmam os signatários este instrumento em 02 (duas) vias de igual teor e forma.</p>

  ${locacao.observacoes ? `<p><strong>OBSERVAÇÕES:</strong> ${locacao.observacoes}</p>` : ''}

  <div class="signature-section">
    <p>Naviraí, ${new Date().toLocaleDateString('pt-BR')}.</p>
    
    <br><br><br>
    
    <p><strong>LOCADORA:</strong> João Roberto dos Santos de Oliveira<br>
    neste ato representando a pessoa jurídica Or dos Santos de Oliveira</p>
    
    <div style="margin-top: 80px;">
      <div style="border-top: 1px solid black; width: 300px;">
        <!-- Linha de assinatura da LOCADORA -->
      </div>
    </div>
    
    <br><br><br><br>
    
    <p><strong>LOCATÁRIO:</strong> ${locacao.cliente_nome}</p>
    
    <div style="margin-top: 80px;">
      <div style="border-top: 1px solid black; width: 300px;">
        <!-- Linha de assinatura do LOCATÁRIO -->
      </div>
    </div>
  </div>

</body>
</html>
    `;
    
    // Return HTML for now (in production, this would be a PDF)
    return c.html(contractHTML);
    
  } catch (error) {
    console.error("Generate contract error:", error);
    return c.json({ success: false, error: "Erro ao gerar contrato" } as ApiResponse<never>, 500);
  }
});

export default app;
