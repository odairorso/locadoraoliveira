// Teste simples da API
console.log('🔍 Testando API de vistorias...');

try {
    const response = await fetch('http://localhost:5174/api/vistorias');
    const text = await response.text();
    
    console.log('📋 Status da resposta:', response.status);
    console.log('📋 Resposta bruta:', text);
    
    try {
        const json = JSON.parse(text);
        console.log('📋 JSON parseado:', JSON.stringify(json, null, 2));
        
        if (json.success && json.data && json.data.vistorias) {
            console.log('✅ Vistorias encontradas:', json.data.vistorias.length);
            
            const vistoriasEntrada = json.data.vistorias.filter(v => v.tipo_vistoria === 'entrada');
            const vistoriasSaida = json.data.vistorias.filter(v => v.tipo_vistoria === 'saida');
            
            console.log('📝 Vistorias de entrada:', vistoriasEntrada.length);
            console.log('📝 Vistorias de saída:', vistoriasSaida.length);
            
            if (vistoriasEntrada.length > 0) {
                console.log('🔍 Primeira vistoria de entrada:', vistoriasEntrada[0]);
            }
            
            if (vistoriasSaida.length > 0) {
                console.log('🔍 Primeira vistoria de saída:', vistoriasSaida[0]);
            }
        }
    } catch (parseError) {
        console.log('❌ Erro ao fazer parse do JSON:', parseError.message);
    }
    
} catch (error) {
    console.log('❌ Erro na requisição:', error.message);
}