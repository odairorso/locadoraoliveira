import fetch from 'node-fetch';

async function debugData() {
    try {
        console.log('🔍 Verificando dados de vistorias...');
        
        // Buscar todas as vistorias
        const vistoriasResponse = await fetch('http://localhost:5174/api/vistorias');
        const vistoriasResult = await vistoriasResponse.json();
        
        console.log('\n📋 Resposta da API vistorias:', JSON.stringify(vistoriasResult, null, 2));
        
        if (!vistoriasResult.success) {
            console.log('❌ Erro na API de vistorias:', vistoriasResult.error);
            return;
        }
        
        const vistoriasArray = vistoriasResult.data.vistorias || [];
        console.log('📋 Total de vistorias:', vistoriasArray.length);
        
        // Separar por tipo
        const vistoriasEntrada = vistoriasArray.filter(v => v.tipo === 'entrada');
        const vistoriasSaida = vistoriasArray.filter(v => v.tipo === 'saida');
        
        console.log('✅ Vistorias de entrada:', vistoriasEntrada.length);
        console.log('🚪 Vistorias de saída:', vistoriasSaida.length);
        
        if (vistoriasEntrada.length > 0) {
            console.log('\n📝 Vistorias de entrada encontradas:');
            vistoriasEntrada.forEach(v => {
                console.log(`- ID: ${v.id}, Veículo: ${v.veiculo_id}, Locação: ${v.locacao_id}, Status: ${v.status}`);
            });
        }
        
        if (vistoriasSaida.length > 0) {
            console.log('\n📝 Vistorias de saída encontradas:');
            vistoriasSaida.forEach(v => {
                console.log(`- ID: ${v.id}, Veículo: ${v.veiculo_id}, Locação: ${v.locacao_id}, Status: ${v.status}`);
            });
        }
        
        // Buscar locações ativas
        const locacoesResponse = await fetch('http://localhost:5174/api/locacoes?status=ativa');
        const locacoesResult = await locacoesResponse.json();
        
        if (!locacoesResult.success) {
            console.log('❌ Erro na API de locações:', locacoesResult.error);
            return;
        }
        
        const locacoes = locacoesResult.data || [];
        
        console.log('\n🚗 Locações ativas:', locacoes.length);
        if (locacoes.length > 0) {
            locacoes.forEach(l => {
                console.log(`- ID: ${l.id}, Veículo: ${l.veiculo_id}, Cliente: ${l.cliente_nome}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error.message);
    }
}

debugData();