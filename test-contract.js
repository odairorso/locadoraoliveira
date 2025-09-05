// Teste direto da função de geração de contrato sem Supabase
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler o arquivo da API e extrair a função generateContractHTML
const apiContent = readFileSync(join(__dirname, 'api', 'locacoes.mjs'), 'utf8');

// Extrair a função generateContractHTML
const generateContractHTMLMatch = apiContent.match(/function generateContractHTML\([^}]+\{[\s\S]*?^}/m);

if (!generateContractHTMLMatch) {
  console.error('Não foi possível encontrar a função generateContractHTML');
  process.exit(1);
}

// Criar uma função de teste
const testData = {
  locatario_nome: 'João Silva',
  locatario_cpf: '123.456.789-00',
  locatario_endereco: 'Rua Teste, 123',
  veiculo_marca: 'Toyota',
  veiculo_modelo: 'Corolla',
  veiculo_ano: '2020',
  veiculo_placa: 'ABC-1234',
  valor_aluguel: 1500,
  data_inicio: '2024-01-15',
  data_fim: '2024-02-15'
};

// Executar a função extraída
eval(generateContractHTMLMatch[0]);

const html = generateContractHTML(testData);

// Verificar quantas vezes aparece "CLÁUSULA 11"
const clause11Matches = (html.match(/CLÁUSULA 11/g) || []).length;
console.log(`Número de ocorrências de "CLÁUSULA 11": ${clause11Matches}`);

// Verificar quantas vezes aparece o parágrafo único da cláusula 11
const uniqueParagraphMatches = (html.match(/O LOCATÁRIO declara estar ciente de que a locação foi realizada sem a contratação de seguro/g) || []).length;
console.log(`Número de ocorrências do parágrafo único da cláusula 11: ${uniqueParagraphMatches}`);

// Salvar o HTML para inspeção
import { writeFileSync } from 'fs';
writeFileSync('contract-test-output.html', html);
console.log('Contrato salvo em contract-test-output.html para inspeção');

if (clause11Matches > 1 || uniqueParagraphMatches > 1) {
  console.log('❌ PROBLEMA ENCONTRADO: Duplicação detectada na cláusula 11!');
  
  // Mostrar onde estão as duplicações
  const lines = html.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('CLÁUSULA 11') || line.includes('O LOCATÁRIO declara estar ciente de que a locação foi realizada sem a contratação de seguro')) {
      console.log(`Linha ${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('✅ Nenhuma duplicação encontrada na cláusula 11');
}