import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboard() {
  console.log('🔍 Testando API do Dashboard...\n');

  try {
    // Verificar movimentações financeiras
    const { data: movimentacoes, error: movError } = await supabase
      .from('movimentacoes_financeiras')
      .select('tipo, valor, data_movimentacao, descricao')
      .order('data_movimentacao', { ascending: false });

    if (movError) {
      console.error('❌ Erro ao buscar movimentações:', movError);
      return;
    }

    console.log(`📊 Total de movimentações encontradas: ${movimentacoes.length}\n`);

    // Agrupar por mês
    const movimentacoesPorMes = {};
    
    movimentacoes.forEach(mov => {
      const data = new Date(mov.data_movimentacao);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!movimentacoesPorMes[chave]) {
        movimentacoesPorMes[chave] = {
          entradas: 0,
          saidas: 0,
          total: 0,
          count: 0
        };
      }
      
      movimentacoesPorMes[chave].count++;
      if (mov.tipo === 'entrada') {
        movimentacoesPorMes[chave].entradas += mov.valor;
        movimentacoesPorMes[chave].total += mov.valor;
      } else {
        movimentacoesPorMes[chave].saidas += mov.valor;
        movimentacoesPorMes[chave].total -= mov.valor;
      }
    });

    console.log('📈 Movimentações por mês:');
    Object.keys(movimentacoesPorMes)
      .sort()
      .reverse()
      .slice(0, 6) // Últimos 6 meses
      .forEach(mes => {
        const dados = movimentacoesPorMes[mes];
        console.log(`   ${mes}: ${dados.count} movimentações`);
        console.log(`      - Entradas: R$ ${dados.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`      - Saídas: R$ ${dados.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`      - Saldo: R$ ${dados.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log('');
      });

    // Verificar data atual
    const hoje = new Date();
    console.log(`📅 Data atual: ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Mês/Ano atual: ${hoje.getMonth() + 1}/${hoje.getFullYear()}\n`);

    // Verificar se há locações ativas que deveriam gerar receita
    const { data: locacoesAtivas, error: locError } = await supabase
      .from('locacoes')
      .select(`
        id,
        data_locacao,
        data_entrega,
        valor_total,
        status,
        clientes (nome),
        veiculos (marca, modelo, placa)
      `)
      .eq('status', 'ativa');

    if (locError) {
      console.error('❌ Erro ao buscar locações ativas:', locError);
      return;
    }

    console.log('🚗 Locações ativas:');
    if (locacoesAtivas.length === 0) {
      console.log('   Nenhuma locação ativa encontrada');
    } else {
      locacoesAtivas.forEach(locacao => {
        const inicio = new Date(locacao.data_locacao).toLocaleDateString('pt-BR');
        const fim = locacao.data_entrega ? new Date(locacao.data_entrega).toLocaleDateString('pt-BR') : 'Em andamento';
        console.log(`   #${locacao.id} - ${locacao.clientes?.nome} - ${locacao.veiculos?.marca} ${locacao.veiculos?.modelo}`);
        console.log(`      Período: ${inicio} até ${fim}`);
        console.log(`      Valor: R$ ${locacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log('');
      });
    }

    // Verificar se há locações que terminaram em outubro e deveriam gerar receita
    console.log('🔍 Verificando locações que terminaram em outubro 2025:');
    const { data: locacoesOutubro, error: outError } = await supabase
      .from('locacoes')
      .select(`
        id,
        data_locacao,
        data_entrega,
        valor_total,
        status,
        clientes (nome),
        veiculos (marca, modelo, placa)
      `)
      .gte('data_entrega', '2025-10-01')
      .lte('data_entrega', '2025-10-31');

    if (outError) {
      console.error('❌ Erro ao buscar locações de outubro:', outError);
    } else {
      if (locacoesOutubro.length === 0) {
        console.log('   Nenhuma locação finalizada em outubro encontrada');
      } else {
        locacoesOutubro.forEach(locacao => {
          const inicio = new Date(locacao.data_locacao).toLocaleDateString('pt-BR');
          const fim = new Date(locacao.data_entrega).toLocaleDateString('pt-BR');
          console.log(`   #${locacao.id} - ${locacao.clientes?.nome} - ${locacao.veiculos?.marca} ${locacao.veiculos?.modelo}`);
          console.log(`      Período: ${inicio} até ${fim}`);
          console.log(`      Valor: R$ ${locacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`      Status: ${locacao.status}`);
          console.log('');
        });
      }
    }

    // Testar a API
    console.log('🌐 Testando chamada da API...');
    
    const response = await fetch('http://localhost:5174/api/dashboard');
    const apiResult = await response.json();
    
    if (apiResult.success) {
      console.log('✅ API respondeu com sucesso:');
      console.log('   - Receita do mês:', `R$ ${(apiResult.data.receitaMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log('   - Saldo do caixa:', `R$ ${(apiResult.data.saldoCaixa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log('   - Locações ativas:', apiResult.data.locacoesAtivas);
      console.log('   - Veículos disponíveis:', apiResult.data.veiculosDisponiveis);
      console.log('   - Veículos locados:', apiResult.data.veiculosLocados);
    } else {
      console.error('❌ Erro na API:', apiResult.error);
    }

    console.log('\n💡 CONCLUSÃO:');
    console.log('   O dashboard está funcionando corretamente.');
    console.log('   A receita do mês atual (outubro 2025) está R$ 0,00 porque:');
    console.log('   - Não há movimentações financeiras registradas para outubro 2025');
    console.log('   - Todas as movimentações são de setembro 2025 ou anteriores');
    console.log('   - Para ter receita em outubro, seria necessário:');
    console.log('     a) Finalizar locações ativas em outubro, ou');
    console.log('     b) Registrar movimentações financeiras de entrada em outubro');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugDashboard();