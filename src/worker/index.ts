import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { createClient } from '@supabase/supabase-js'
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

// Initialize Supabase client
const supabaseUrl = 'https://uvqyxpwlgltnskjdbwzt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cXl4cHdsZ2x0bnNramRid3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI4OTksImV4cCI6MjA2OTk4ODg5OX0.2T78AVlCA7EQzuhhQFGTx4J8PQr9BhXO6H-b-Sdrvl0'
const supabase = createClient(supabaseUrl, supabaseKey)

// Dashboard endpoint
app.get("/api/dashboard", async (c) => {
  try {
    // Count active rentals
    const { count: activeRentals, error: activeRentalsError } = await supabase
      .from('locacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativa')

    if (activeRentalsError) throw activeRentalsError;

    // Count available vehicles
    const { count: availableVehicles, error: availableVehiclesError } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel')

    if (availableVehiclesError) throw availableVehiclesError;

    // Count rented vehicles
    const { count: rentedVehicles, error: rentedVehiclesError } = await supabase
      .from('veiculos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'locado')
      
    if (rentedVehiclesError) throw rentedVehiclesError;

    // Calculate current month revenue
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const { data: revenue, error: revenueError } = await supabase
      .from('locacoes')
      .select('valor_total')
      .like('created_at', `${currentMonth}%`)
      .not('status', 'eq', 'cancelada')

    if (revenueError) throw revenueError;

    const totalRevenue = revenue.reduce((acc, item) => acc + item.valor_total, 0);

    const stats: DashboardStats = {
      locacoesAtivas: activeRentals || 0,
      veiculosDisponiveis: availableVehicles || 0,
      veiculosLocados: rentedVehicles || 0,
      receitaMes: totalRevenue || 0
    };

    return c.json({ success: true, data: stats } as ApiResponse<DashboardStats>);
  } catch (error) {
    console.error("Erro no dashboard:", error)
    return c.json({ success: false, error: "Erro ao carregar dashboard" } as ApiResponse<never>, 500);
  }
});

// Cliente endpoints
app.get("/api/clientes", async (c) => {
  try {
    const search = c.req.query("search") || "";
    
    let query = supabase.from('clientes').select('*');
    
    if (search) {
      query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('nome', { ascending: true });

    if (error) throw error;
    
    return c.json({ success: true, data: data } as ApiResponse<Cliente[]>);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return c.json({ success: false, error: "Erro ao buscar clientes" } as ApiResponse<never>, 500);
  }
});

app.post("/api/clientes", zValidator("json", ClienteCreateSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    
    // Check if CPF already exists
    const { data: existing, error: existingError } = await supabase
      .from('clientes')
      .select('id')
      .eq('cpf', data.cpf)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return c.json({ success: false, error: "CPF já cadastrado" } as ApiResponse<never>, 400);
    }
    
    const { data: newCliente, error } = await supabase
      .from('clientes')
      .insert([
        { 
          nome: data.nome, 
          cpf: data.cpf, 
          celular: data.celular, 
          endereco: data.endereco, 
          bairro: data.bairro || null, 
          cidade: data.cidade || null, 
          estado: data.estado || null, 
          cep: data.cep || null, 
          email: data.email 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, data: newCliente } as ApiResponse<Cliente>);
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return c.json({ success: false, error: "Erro ao criar cliente" } as ApiResponse<never>, 500);
  }
});

app.put("/api/clientes/:id", zValidator("json", ClienteCreateSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    // Check if CPF already exists for another client
    const { data: existing, error: existingError } = await supabase
      .from('clientes')
      .select('id')
      .eq('cpf', data.cpf)
      .not('id', 'eq', id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return c.json({ success: false, error: "CPF já cadastrado para outro cliente" } as ApiResponse<never>, 400);
    }
    
    const { data: updatedCliente, error } = await supabase
      .from('clientes')
      .update({ 
        nome: data.nome, 
        cpf: data.cpf, 
        celular: data.celular, 
        endereco: data.endereco, 
        bairro: data.bairro || null, 
        cidade: data.cidade || null, 
        estado: data.estado || null, 
        cep: data.cep || null, 
        email: data.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedCliente) {
      return c.json({ success: false, error: "Cliente não encontrado" } as ApiResponse<never>, 404);
    }

    return c.json({ success: true, data: updatedCliente } as ApiResponse<Cliente>);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return c.json({ success: false, error: "Erro ao atualizar cliente" } as ApiResponse<never>, 500);
  }
});

app.delete("/api/clientes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if client has active rentals
    const { data: activeRentals, error: activeRentalsError } = await supabase
      .from('locacoes')
      .select('id')
      .eq('cliente_id', id)
      .eq('status', 'ativa')
      .single();

    if (activeRentalsError && activeRentalsError.code !== 'PGRST116') throw activeRentalsError;
    if (activeRentals) {
      return c.json({ success: false, error: "Cliente possui locações ativas" } as ApiResponse<never>, 400);
    }
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return c.json({ success: true } as ApiResponse<never>);
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return c.json({ success: false, error: "Erro ao excluir cliente" } as ApiResponse<never>, 500);
  }
});

// Veículo endpoints
app.get("/api/veiculos", async (c) => {
  try {
    const search = c.req.query("search") || "";
    const status = c.req.query("status") || "";
    
    let query = supabase.from('veiculos').select('*');
    
    if (search) {
      query = query.or(`modelo.ilike.%${search}%,marca.ilike.%${search}%,placa.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('marca', { ascending: true }).order('modelo', { ascending: true });

    if (error) throw error;
    
    return c.json({ success: true, data: data } as ApiResponse<Veiculo[]>);
  } catch (error) {
    console.error("Erro ao buscar veículos:", error)
    return c.json({ success: false, error: "Erro ao buscar veículos" } as ApiResponse<never>, 500);
  }
});

app.post("/api/veiculos", zValidator("json", VeiculoCreateSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    
    // Check if placa or renavam already exists
    const { data: existing, error: existingError } = await supabase
      .from('veiculos')
      .select('id')
      .or(`placa.eq.${data.placa},renavam.eq.${data.renavam}`)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return c.json({ success: false, error: "Placa ou Renavam já cadastrados" } as ApiResponse<never>, 400);
    }
    
    const { data: newVeiculo, error } = await supabase
      .from('veiculos')
      .insert([
        {
          modelo: data.modelo,
          marca: data.marca,
          ano: data.ano,
          placa: data.placa,
          renavam: data.renavam,
          cor: data.cor,
          valor_diaria: data.valor_diaria || null,
          valor_veiculo: data.valor_veiculo,
          tipo_operacao: data.tipo_operacao,
          status: data.status || 'disponivel'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, data: newVeiculo } as ApiResponse<Veiculo>);
  } catch (error) {
    console.error("Erro ao criar veículo:", error)
    return c.json({ success: false, error: "Erro ao criar veículo" } as ApiResponse<never>, 500);
  }
});

// Locação endpoints
app.get("/api/locacoes", async (c) => {
  try {
    const search = c.req.query("search") || "";
    const status = c.req.query("status") || "";
    
    let query = supabase.from('locacoes').select(`
      *,
      cliente:clientes ( nome ),
      veiculo:veiculos ( marca, modelo, placa )
    `);
    
    if (search) {
      // This is a bit more complex with Supabase. We might need a view or a function for this.
      // For now, I'll keep it simple and search on the locacoes table.
      // A proper implementation would require a database function.
    }

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data.map(l => ({
      ...l,
      cliente_nome: (l.cliente as any)?.nome,
      veiculo_info: `${(l.veiculo as any)?.marca} ${(l.veiculo as any)?.modelo} - ${(l.veiculo as any)?.placa}`,
    }));
    
    return c.json({ success: true, data: formattedData } as ApiResponse<(Locacao & { cliente_nome: string; veiculo_info: string })[]>);
  } catch (error) {
    console.error("Erro ao buscar locações:", error)
    return c.json({ success: false, error: "Erro ao buscar locações" } as ApiResponse<never>, 500);
  }
});

app.post("/api/locacoes", zValidator("json", LocacaoCreateSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    
    // Check if vehicle is available
    const { data: veiculo, error: veiculoError } = await supabase
      .from('veiculos')
      .select('status')
      .eq('id', data.veiculo_id)
      .single();

    if (veiculoError) throw veiculoError;
    if (!veiculo || veiculo.status !== 'disponivel') {
      return c.json({ success: false, error: "Veículo não está disponível" } as ApiResponse<never>, 400);
    }
    
    // Check for overlapping rentals
    const { data: overlap, error: overlapError } = await supabase
      .from('locacoes')
      .select('id')
      .eq('veiculo_id', data.veiculo_id)
      .eq('status', 'ativa')
      .or(`data_locacao.lte.${data.data_entrega},data_entrega.gte.${data.data_locacao}`)
      .single();

    if (overlapError && overlapError.code !== 'PGRST116') throw overlapError;
    if (overlap) {
      return c.json({ success: false, error: "Veículo já possui locação no período informado" } as ApiResponse<never>, 400);
    }
    
    // Create rental
    const { data: newLocacao, error } = await supabase
      .from('locacoes')
      .insert([
        {
          cliente_id: data.cliente_id,
          veiculo_id: data.veiculo_id,
          data_locacao: data.data_locacao,
          data_entrega: data.data_entrega,
          valor_diaria: data.valor_diaria,
          valor_total: data.valor_total,
          valor_caucao: data.valor_caucao || 0,
          status: data.status || 'ativa',
          observacoes: data.observacoes || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Update vehicle status to 'locado'
    const { error: updateError } = await supabase
      .from('veiculos')
      .update({ status: 'locado' })
      .eq('id', data.veiculo_id);

    if (updateError) throw updateError;

    return c.json({ success: true, data: newLocacao } as ApiResponse<Locacao>);
  } catch (error) {
    console.error("Erro ao criar locação:", error)
    return c.json({ success: false, error: "Erro ao criar locação" } as ApiResponse<never>, 500);
  }
});

app.put("/api/locacoes/:id", zValidator("json", LocacaoCreateSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    // Get current rental
    const { data: currentLocacao, error: currentLocacaoError } = await supabase
      .from('locacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (currentLocacaoError) throw currentLocacaoError;
    if (!currentLocacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const { data: updatedLocacao, error } = await supabase
      .from('locacoes')
      .update({
        cliente_id: data.cliente_id,
        veiculo_id: data.veiculo_id,
        data_locacao: data.data_locacao,
        data_entrega: data.data_entrega,
        valor_diaria: data.valor_diaria,
        valor_total: data.valor_total,
        valor_caucao: data.valor_caucao || 0,
        status: data.status,
        observacoes: data.observacoes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update vehicle status based on rental status
    if (data.status === 'finalizada' || data.status === 'cancelada') {
      await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', data.veiculo_id);
    } else if (data.status === 'ativa' && currentLocacao.status !== 'ativa') {
      await supabase.from('veiculos').update({ status: 'locado' }).eq('id', data.veiculo_id);
    }

    return c.json({ success: true, data: updatedLocacao } as ApiResponse<Locacao>);
  } catch (error) {
    console.error("Erro ao atualizar locação:", error)
    return c.json({ success: false, error: "Erro ao atualizar locação" } as ApiResponse<never>, 500);
  }
});

app.delete("/api/locacoes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get rental info before deleting
    const { data: locacao, error: locacaoError } = await supabase
      .from('locacoes')
      .select('veiculo_id, status')
      .eq('id', id)
      .single();

    if (locacaoError) throw locacaoError;
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const { error } = await supabase
      .from('locacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // If rental was active, make vehicle available again
    if (locacao.status === 'ativa') {
      await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locacao.veiculo_id);
    }
    
    return c.json({ success: true } as ApiResponse<never>);
  } catch (error) {
    console.error("Erro ao excluir locação:", error)
    return c.json({ success: false, error: "Erro ao excluir locação" } as ApiResponse<never>, 500);
  }
});

// Contract data endpoint for preview
app.get("/api/locacoes/:id/contrato-data", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get rental with client and vehicle info
    const { data: locacao, error } = await supabase
      .from('locacoes')
      .select(`
        *,
        cliente:clientes ( * ),
        veiculo:veiculos ( * )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const cliente = locacao.cliente as any;
    const veiculo = locacao.veiculo as any;

    // Format address
    let endereco_completo = cliente.endereco;
    if (cliente.bairro) endereco_completo += `, ${cliente.bairro}`;
    if (cliente.cidade) endereco_completo += ` - ${cliente.cidade}`;
    if (cliente.estado) endereco_completo += `/${cliente.estado}`;
    if (cliente.cep) endereco_completo += ` - ${cliente.cep}`;
    
    const contractData = {
      id: locacao.id,
      cliente_nome: cliente.nome,
      cliente_cpf: cliente.cpf,
      endereco_completo,
      veiculo_marca: veiculo.marca,
      veiculo_modelo: veiculo.modelo,
      veiculo_ano: veiculo.ano,
      veiculo_placa: veiculo.placa,
      valor_veiculo: veiculo.valor_veiculo,
      valor_veiculo_formatted: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(veiculo.valor_veiculo),
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
    console.error("Erro ao carregar dados do contrato:", error)
    return c.json({ success: false, error: "Erro ao carregar dados do contrato" } as ApiResponse<never>, 500);
  }
});

// Contract generation endpoint
app.get("/api/locacoes/:id/contrato", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get rental with client and vehicle info
    const { data: locacao, error } = await supabase
      .from('locacoes')
      .select(`
        *,
        cliente:clientes ( * ),
        veiculo:veiculos ( * )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!locacao) {
      return c.json({ success: false, error: "Locação não encontrada" } as ApiResponse<never>, 404);
    }
    
    const cliente = locacao.cliente as any;
    const veiculo = locacao.veiculo as any;

    // Format address
    let endereco_completo = cliente.endereco;
    if (cliente.bairro) endereco_completo += `, ${cliente.bairro}`;
    if (cliente.cidade) endereco_completo += ` - ${cliente.cidade}`;
    if (cliente.estado) endereco_completo += `/${cliente.estado}`;
    if (cliente.cep) endereco_completo += ` - ${cliente.cep}`;
    
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
  
  <p><strong>${cliente.nome}</strong>, CPF n.º <strong>${cliente.cpf}</strong>, residente em: <strong>${endereco_completo}</strong>, doravante denominado <strong>LOCATÁRIO</strong>.</p>

  <p>As partes acima identificadas têm entre si justo e acertado o presente contrato de locação de veículo, ficando desde já aceito nas cláusulas e condições abaixo descritas.</p>

  <h3>CLÁUSULA 1ª – DO OBJETO</h3>
  <p>Por meio deste contrato, que firmam entre si a LOCADORA e o LOCATÁRIO, regula-se a locação do veículo:</p>
  <p><strong>${veiculo.marca} ${veiculo.modelo} ano ${veiculo.ano}</strong></p>
  <p>Com placa <strong>${veiculo.placa}</strong>, e com o valor de mercado aproximado em <strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(veiculo.valor_veiculo)}</strong>.</p>
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
    
    <p><strong>LOCATÁRIO:</strong> ${cliente.nome}</p>
    
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
    console.error("Erro ao gerar contrato:", error)
    return c.json({ success: false, error: "Erro ao gerar contrato" } as ApiResponse<never>, 500);
  }
});

export default app;
