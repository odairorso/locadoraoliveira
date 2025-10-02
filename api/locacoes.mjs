import { createClient } from '@supabase/supabase-js';

function generateContractHTML(contractData) {
  // Helper for conditional rendering of observations
  const observacoesHTML = contractData.observacoes 
    ? `<div style="margin: 20px 0;">
        <h3 style="font-weight: bold;">OBSERVAÇÕES:</h3>
        <p style="margin: 10px 0; text-align: justify;">${contractData.observacoes}</p>
      </div>`
    : '';

  // NOTE: The `valor_caucao_extenso` field is missing from the data passed to this template.
  // It has been removed from the CLÁUSULA 14ª to prevent rendering issues.
  // This should be added to the `contractData` object construction if available.

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Contrato de Locação</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; color: #000; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { margin: 20px 0; font-size: 1.5em; }
        h3 { margin: 20px 0 10px 0; font-size: 1em; font-weight: bold; }
        p { margin: 10px 0; }
        .signature-section { margin-top: 50px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature { text-align: center; width: 300px; }
        .signature-line { border-top: 1px solid black; padding-top: 5px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; line-height: 1.4; font-size: 12px; color: black;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: bold;">Oliveira Veiculos</h1>
          <p>Av. Campo Grande, 707 - Centro, Navirai - MS, 79947-033</p>
          <p>Tel 3461-9864  Cel-67 99622-9840 67 999913-5153</p>
          <h1 style="font-size: 20px; font-weight: bold; margin-top: 16px;">CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
        </div>

        <div>
          <p style="margin: 10px 0;"><strong>Entre:</strong></p>
          <p style="margin: 10px 0; text-align: justify;">
            a pessoa jurídica L DOS SANTOS DE OLIVEIRA LTDA, inscrita sob o CNPJ n.º 17.909.442/0001-58, 
            com sede em Av campo grande 707 centro, neste ato representada, conforme poderes especialmente 
            conferidos, por: João Roberto dos Santos de Oliveira, na qualidade de: Administrador, 
            CPF n.º 008.714.291-01, carteira de identidade n.º 1447272 doravante denominada <strong>LOCADORA</strong>, e:
          </p>
          <p style="margin: 10px 0; text-align: justify;">
            <strong>${contractData?.cliente_nome || '[Nome do Cliente]'}</strong>, CPF n.º <strong>${contractData?.cliente_cpf || '[CPF]'}</strong>, 
            residente em: <strong>${contractData?.endereco_completo || '[Endereço]'}</strong>,
            doravante denominado <strong>LOCATÁRIO</strong>.
          </p>
          <p style="margin: 10px 0;">As partes acima identificadas têm entre si justo e acertado o presente contrato de locação de veículo, ficando desde já aceito nas cláusulas e condições abaixo descritas.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 1ª – DO OBJETO</h3>
          <p style="margin: 8px 0; text-align: justify;">Por meio deste contrato, que firmam entre si a LOCADORA e o LOCATÁRIO, regula-se a locação do veículo:</p>
          <p style="margin: 8px 0; text-align: justify;"><strong>${contractData?.veiculo_marca || '[Marca]'} ${contractData?.veiculo_modelo || '[Modelo]'} ano ${contractData?.veiculo_ano || '[Ano]'}</strong></p>
          <p style="margin: 8px 0; text-align: justify;">Com placa <strong>${contractData?.veiculo_placa || '[Placa]'}</strong>, e com o valor de mercado aproximado em <strong>${contractData?.valor_veiculo_formatted || '[Valor]'}</strong>.</p>
          <p style="margin: 8px 0; text-align: justify;">Parágrafo único. O presente contrato é acompanhado de um laudo de vistoria, que descreve o veículo e o seu estado de conservação no momento em que o mesmo foi entregue ao LOCATÁRIO.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 2ª – DO VALOR DO ALUGUEL</h3>
          <p style="margin: 8px 0; text-align: justify;">O valor da diária do aluguel, livremente ajustado pelas partes, é de <strong>${contractData?.valor_diaria_formatted || '[Valor da Diária]'}</strong>. O valor total da locação é de <strong>${contractData?.valor_total_formatted || '[Valor Total]'}</strong> para o período estabelecido.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. O LOCATÁRIO deverá efetuar o pagamento do valor acordado, por meio de pix, utilizando a chave 17909442000158, ou em espécie, ou cartão.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. Em caso de atraso no pagamento do aluguel, será aplicada multa de 5% (cinco por cento), sobre o valor devido, bem como juros de mora de 3% (três por cento) ao mês, mais correção monetária, apurada conforme variação do IGP-M no período.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 3º. O LOCATÁRIO, não vindo a efetuar o pagamento do aluguel por um período de atraso superior à 7 (sete) dias, fica sujeito a ter a posse do veículo configurada como Apropriação Indébita, implicando também a possibilidade de adoção de medidas judiciais, inclusive a Busca e Apreensão do veículo e/ou lavratura de Boletim de Ocorrência, cabendo ao LOCATÁRIO ressarcir a LOCADORA das despesas oriundas da retenção indevida do bem, arcando ainda com as despesas judiciais e/ou extrajudiciais que a LOCADORA venha a ter para efetuar a busca, apreensão e efetiva reintegração da posse do veículo.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 4º. Será de responsabilidade do LOCATÁRIO as despesas referentes à utilização do veículo.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 5º. O valor do aluguel firmado neste contrato será reajustado a cada 12 (doze) meses, tendo como base o índice IGP. Em caso de falta deste índice, o reajuste do valor da locação terá por base a média da variação dos índices inflacionários do ano corrente ao da execução da locação.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 3ª – DO PRAZO DO ALUGUEL</h3>
          <p style="margin: 8px 0; text-align: justify;">O prazo de locação do referido veículo é de <strong>${contractData?.data_locacao_formatted || '[Data Início]'} a ${contractData?.data_entrega_formatted || '[Data Fim]'}</strong>.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. Ao final do prazo estipulado, caso as partes permaneçam inertes, a locação prorrogar-se-á automaticamente por tempo indeterminado.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. Caso a LOCADORA não queira prorrogar a locação ao terminar o prazo estipulado neste contrato, e o referido veículo não for devolvido, será cobrado o valor do aluguel proporcional aos dias de atraso acumulado de multa diária de <strong>${contractData?.valor_diaria_formatted || '[Valor da Diária]'}</strong>.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 3º. Finda a locação, o LOCATÁRIO deverá devolver o veículo nas mesmas condições em que recebeu, salvo os desgastes decorrentes do uso normal, sob pena de indenização por perdas e danos a ser apurada.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 4ª – DO COMBUSTÍVEL</h3>
          <p style="margin: 8px 0; text-align: justify;">O veículo será entregue ao LOCATÁRIO com um tanque de combustível completo, e sua quantidade será marcada no laudo de vistoria no momento da retirada.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. Ao final do prazo estipulado, o LOCATÁRIO deverá devolver o veículo à LOCADORA com o tanque de combustível completo.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. Caso não ocorra o cumprimento do parágrafo anterior, será cobrado o valor correspondente a leitura do marcador em oitavos, com base em tabela própria, e o valor do litro será informado no momento da retirada pela LOCADORA.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 3º. Caso seja constatado a utilização de combustível adulterado, o LOCATÁRIO responderá pelo mesmo e pelos danos decorrentes de tal utilização.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 4º. Fica desde já acordado que o LOCATÁRIO não terá direito a ressarcimento caso devolva o veículo com uma quantidade de combustível superior a que recebeu.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 5ª – DA LIMPEZA</h3>
          <p style="margin: 8px 0; text-align: justify;">O veículo será entregue ao LOCATÁRIO limpo e deverá ser devolvido à LOCADORA nas mesmas condições higiênicas que foi retirado.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. Caso o veículo seja devolvido sujo, interna ou externamente, será cobrada uma taxa de lavagem simples ou especial, dependendo do estado do veículo na devolução.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. Caso haja a necessidade de lavagem especial, será cobrada, além da taxa de lavagem, o valor mínimo de (uma) diária de locação, ou quantas diárias forem necessárias até a disponibilização do veículo para locação, limitado a 5 (cinco) diárias do veículo com base na tarifa vigente.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 6ª – DA UTILIZAÇÃO</h3>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. Deverá também o LOCATÁRIO utilizar o veículo alugado sempre de acordo com os regulamentos estabelecidos pelo Conselho Nacional de Trânsito (CONTRAN) e pelo Departamento Estadual de Trânsito (DETRAN).</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. A utilização do veículo de forma diferente do descrito acima estará sujeita à cobrança de multa, assim como poderá a LOCADORA dar por rescindido o presente contrato independente de qualquer notificação, e sem maiores formalidades poderá também proceder com o recolhimento do veículo sem que seja ensejada qualquer pretensão para ação indenizatória, reparatória ou compensatória pelo LOCATÁRIO.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 3º. Qualquer modificação no veículo só poderá ser feita com a autorização expressa da LOCADORA.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 4º. O LOCATÁRIO declara estar ciente que quaisquer danos causados, materiais ou pessoais, decorrente da utilização do veículo ora locado, será de sua responsabilidade.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 7ª – RESTRIÇÃO TERRITORIAL</h3>
          <p style="margin: 8px 0; text-align: justify;">O LOCATÁRIO se compromete a utilizar o veículo exclusivamente dentro do território nacional brasileiro, sendo expressamente proibida sua saída para qualquer outro país. O descumprimento desta cláusula implicará em multa de R$ 280,00 (duzentos e oitenta reais) e rescisão imediata do presente contrato, sem prejuízo das demais medidas legais cabíveis.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 8ª – DAS MULTAS E INFRAÇÕES</h3>
          <p style="margin: 8px 0; text-align: justify;">As multas ou quaisquer outras infrações às leis de trânsito, cometidas durante o período da locação do veículo, serão de responsabilidade do LOCATÁRIO, devendo ser liquidadas quando da notificação pelos órgãos competentes ou no final do contrato, o que ocorrer primeiro.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 1º. Em caso de apreensão do veículo, serão cobradas do LOCATÁRIO todas as despesas de serviço dos profissionais envolvidos para liberação do veículo alugado, assim como todas as taxas cobradas pelos órgãos competentes, e também quantas diárias forem necessárias até a disponibilização do veículo para locação.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 2º. O LOCATÁRIO declara-se ciente e concorda que se ocorrer qualquer multa ou infração de trânsito durante a vigência deste contrato, seu nome poderá ser indicado pela LOCADORA junto ao Órgão de Trânsito autuante, na qualidade de condutor do veículo, tendo assim a pontuação recebida transferida para sua carteira de habilitação.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 3º. A LOCADORA poderá preencher os dados relativos à "apresentação do Condutor", previsto na Resolução 404/12 do CONTRAN, caso tenha sido lavrada autuação por infrações de trânsito enquanto o veículo esteve em posse e responsabilidade do LOCATÁRIO, situação na qual a LOCADORA apresentará para o Órgão de Trânsito competente a cópia do presente contrato celebrado com o LOCATÁRIO.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 4º. Descabe qualquer discussão sobre a procedência ou improcedência das infrações de trânsito aplicadas, e poderá o LOCATÁRIO, a seu critério e às suas expensas, recorrer das multas, junto ao Órgão de Trânsito competente, o que não o eximirá do pagamento do valor da multa, mas lhe dará o direito ao reembolso, caso o recurso seja julgado procedente.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 9ª – DA VEDAÇÃO À SUBLOCAÇÃO E EMPRÉSTIMO DO VEÍCULO</h3>
          <p style="margin: 10px 0; text-align: justify;">Será permitido o uso do veículo objeto do presente contrato, apenas pelo LOCATÁRIO, sendo vedada, no todo ou em parte, a sublocação, transferência, empréstimo, comodato ou cessão da locação, seja a qualquer título, sem expressa anuência da LOCADORA, sob pena de imediata rescisão, aplicação de multa e de demais penalidades contratuais e legais cabíveis.</p>
          <p style="margin: 10px 0; text-align: justify;">Parágrafo único. Ocorrendo a utilização do veículo por terceiros com a concordância do LOCATÁRIO, este se responsabilizará por qualquer ação civil ou criminal que referida utilização possa gerar, isentando assim a LOCADORA de qualquer responsabilidade, ou ônus.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 10ª – DA MANUTENÇÃO</h3>
          <p style="margin: 10px 0; text-align: justify;">A manutenção do veículo, referente a troca das peças oriundas do desgaste natural de sua utilização, é de responsabilidade do LOCATÁRIO, sem ônus para a LOCADORA.</p>
          <p style="margin: 10px 0; text-align: justify;">Parágrafo único. Se durante o período da manutenção o LOCATÁRIO não dispor do bem, ou de outro de categoria igual ou similar, terá desconto no aluguel, proporcional ao período de manutenção.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 11ª – DA UTILIZAÇÃO DO SEGURO</h3>
          <p style="margin: 10px 0; text-align: justify;">Ocorrendo a necessidade da utilização do seguro veicular, registrado em nome da LOCADORA, devido à perda, extravio, furto, roubo, destruição parcial ou total, ou colisão do veículo por ora locado, fica desde já estipulada indenização devida pelo LOCATÁRIO que deverá, para efeito de cobertura do valor da franquia do seguro veicular, pagar à LOCADORA o valor de R$ 3.520,00 (três mil e quinhentos e vinte reais).</p>
          <p style="margin: 10px 0; text-align: justify;">Parágrafo único. O LOCATÁRIO declara estar ciente de que a locação foi realizada sem a contratação de seguro veicular, assumindo, assim, total responsabilidade civil e material por quaisquer danos, perdas, furtos, roubos, destruição, sinistros ou acidentes ocorridos com o veículo durante o período de vigência deste contrato, obrigando-se a ressarcir integralmente a LOCADORA em todas essas situações, isentando-a de quaisquer ônus, indenizações ou coberturas decorrentes da ausência de seguro.</p>
          <p style="margin-top: 30px; text-align: left;">ASS.________________________________________________________</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 12ª – DOS DEVERES DO LOCATÁRIO</h3>
          <p style="margin: 10px 0; text-align: justify;">Sem prejuízo de outras disposições deste contrato, constituem obrigações do LOCATÁRIO:</p>
          <p style="margin: 10px 0; text-align: justify;">I – pagar o aluguel e os encargos da locação, legal ou contratualmente exigíveis, no prazo estipulado;</p>
          <p style="margin: 10px 0; text-align: justify;">II – usar o veículo como foi convencionado, de acordo com a sua natureza e com o objetivo a que se destina;</p>
          <p style="margin: 10px 0; text-align: justify;">III – cuidar e zelar do veículo como se fosse sua propriedade;</p>
          <p style="margin: 10px 0; text-align: justify;">IV – restituir o veículo, no final da locação, no estado em que o recebeu, conforme o laudo de vistoria, salvo as deteriorações decorrentes do seu uso normal;</p>
          <p style="margin: 10px 0; text-align: justify;">V – levar imediatamente ao conhecimento da LOCADORA o surgimento de qualquer dano, ou ocorrência, cuja reparação, e ou indenização, a esta enquadre;</p>
          <p style="margin: 10px 0; text-align: justify;">VI – reparar rapidamente os danos sob sua responsabilidade;</p>
          <p style="margin: 10px 0; text-align: justify;">VII – não modificar a forma interna ou externa do veículo sem o consentimento prévio e por escrito da LOCADORA.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 13ª – DOS DEVERES DA LOCADORA</h3>
          <p style="margin: 10px 0; text-align: justify;">Sem prejuízo de outras disposições deste contrato, constituem obrigações da LOCADORA:</p>
          <p style="margin: 10px 0; text-align: justify;">I – entregar ao LOCATÁRIO o veículo alugado em estado de servir ao uso a que se destina;</p>
          <p style="margin: 10px 0; text-align: justify;">II – ser integralmente responsável pelos problemas, defeitos e vícios anteriores à locação.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 14ª – DA GARANTIA</h3>
          <p style="margin: 10px 0; text-align: justify;">O cumprimento das obrigações previstas neste contrato, inclusive o pagamento pontual do aluguel, estará garantido por caução dada em dinheiro, perfazendo o montante de ${contractData.valor_caucao_formatted}, entregue à LOCADORA no ato de assinatura deste contrato.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 1º. Ao final da locação, tendo sido todas as obrigações devidamente cumpridas, o LOCATÁRIO estará autorizado a levantar a respectiva soma.</p>
          <p style="margin: 10px 0; text-align: justify;">§ 2º. A critério das partes, o valor dado como caução poderá ser revertido para o pagamento de aluguéis devidos.</p>

          <h3 style="margin: 20px 0 10px 0; font-weight: bold;">CLÁUSULA 15ª – DA RESCISÃO</h3>
          <p style="margin: 10px 0; text-align: justify;">As partes poderão rescindir o contrato unilateralmente, sem apresentação de justificativa.</p>
          <p style="margin: 10px 0; text-align: justify;">Parágrafo único. Em cumprimento ao princípio da boa-fé, as partes se comprometem a informar uma à outra qualquer fato que possa porventura intervir na relação jurídica formalizada através do presente contrato.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 16ª – DAS PENALIDADES</h3>
          <p style="margin: 8px 0; text-align: justify;">A parte que violar as obrigações previstas neste contrato se sujeitará ao pagamento de indenização e ressarcimento pelas perdas, danos, lucros cessantes, danos indiretos e quaisquer outros prejuízos patrimoniais ou morais percebidos pela outra parte em decorrência deste descumprimento, sem prejuízo de demais penalidades legais ou contratuais cabíveis.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 1º. Caso ocorra uma violação, este contrato poderá ser rescindido de pleno direito pela parte prejudicada, sem a necessidade aviso prévio.</p>
          <p style="margin: 8px 0; text-align: justify;">§ 2º. Ocorrendo uma tolerância de uma das partes em relação ao descumprimento das cláusulas contidas neste instrumento não se configura em renúncia ou alteração da norma infringida.</p>

          <h3 style="margin: 15px 0 8px 0; font-weight: bold;">CLÁUSULA 17ª – DO FORO</h3>
          <p style="margin: 8px 0; text-align: justify;">Fica desde já eleito o foro da comarca de Naviraí para serem resolvidas eventuais pendências decorrentes deste contrato.</p>

          <p style="margin: 8px 0; text-align: justify;">Por estarem assim certos e ajustados, firmam os signatários este instrumento em 02 (duas) vias de igual teor e forma.</p>

          ${observacoesHTML}

          <div style="margin-top: 30px;">
            <p style="margin: 8px 0;">Naviraí, ${contractData?.data_atual_formatted || '[Data Atual]'}</p>
            <div style="margin-top: 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="border-top: 1px solid black; padding-top: 5px; margin-top: 20px; display: inline-block; min-width: 300px;">
                  <strong>LOCADORA</strong><br />
                  João Roberto dos Santos de Oliveira<br />
                  neste ato representando a pessoa jurídica<br />
                  L dos Santos de Oliveira
                </div>
              </div>
              <div style="text-align: center;">
                <div style="border-top: 1px solid black; padding-top: 5px; margin-top: 20px; display: inline-block; min-width: 300px;">
                  <strong>LOCATÁRIO</strong><br />
                  ${contractData.cliente_nome}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default async function handler(request, response) {
  // Log básico para debug
  console.log('=== LOCACOES HANDLER ===');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('========================');
  
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ success: false, error: 'Missing Supabase URL or Anon Key' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { method } = request;
    const { search, status } = request.query;
    
    // Derive ID from URL path for all methods for consistency
    const urlObj = new URL(request.url, 'http://localhost');
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    let idFromPath = null;
    let isContratoData = false;
    let isContratoHtml = false;

    // Check if the last part is a number (ID) or a specific endpoint like 'contrato-data'
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (!isNaN(parseInt(lastPart))) {
        idFromPath = lastPart; // ID is the last part
      } else if (pathParts.length > 1 && !isNaN(parseInt(pathParts[pathParts.length - 2]))) {
        idFromPath = pathParts[pathParts.length - 2]; // ID is the second to last part (e.g., /id/contrato-data)
        if (lastPart === 'contrato-data') {
          isContratoData = true;
        } else if (lastPart === 'contrato') {
          isContratoHtml = true;
        }
      }
    }

    const finalId = idFromPath; // Use the ID derived from the path

    console.log('Final ID derived from path:', finalId);
    console.log('isContratoData:', isContratoData);
    console.log('isContratoHtml:', isContratoHtml);

    if (method === 'GET') {
      if (isContratoData || isContratoHtml) {
        if (!finalId) {
          return response.status(400).json({ success: false, error: 'ID da locação é obrigatório para contrato' });
        }
        
        console.log('DEBUG: Buscando locação com ID:', finalId);
        
        const { data: locacao, error: locacaoError } = await supabase
          .from('locacoes')
          .select(`*, cliente:clientes (*), veiculo:veiculos (*)`)
          .eq('id', parseInt(finalId))
          .single();
        
        console.log('DEBUG: Resultado da busca locação:', { locacao, locacaoError });

        if (locacaoError) {
          console.error('Erro ao buscar locação:', locacaoError);
          return response.status(500).json({ success: false, error: "Erro ao buscar dados da locação.", details: locacaoError.message });
        }

        if (!locacao) {
          return response.status(404).json({ success: false, error: "Locação não encontrada" });
        }

        const cliente = locacao.cliente || {};
        const veiculo = locacao.veiculo || {};

        // Format address properly, avoiding empty parts
        let endereco_parts = [];
        if (cliente.endereco) endereco_parts.push(cliente.endereco);
        if (cliente.bairro) endereco_parts.push(cliente.bairro);
        
        let cidade_estado = [];
        if (cliente.cidade) cidade_estado.push(cliente.cidade);
        if (cliente.estado) cidade_estado.push(cliente.estado);
        
        let enderecoCompleto = endereco_parts.join(', ');
        if (cidade_estado.length > 0) {
          enderecoCompleto += ' - ' + cidade_estado.join('/');
        }
        if (cliente.cep) {
          enderecoCompleto += ', CEP: ' + cliente.cep;
        }
        const formatCurrency = (value) => value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value)) : 'R$ 0,00';
        const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '';

        const contractData = {
          id: locacao.id,
          cliente_nome: cliente.nome || '[Cliente não encontrado]',
          cliente_cpf: cliente.cpf || '[CPF não encontrado]',
          endereco_completo: enderecoCompleto,
          veiculo_marca: veiculo.marca || '[Marca não encontrada]',
          veiculo_modelo: veiculo.modelo || '[Modelo não encontrado]',
          veiculo_ano: veiculo.ano || '',
          veiculo_placa: veiculo.placa || '',
          valor_veiculo_formatted: formatCurrency(veiculo.valor_veiculo),
          valor_diaria_formatted: formatCurrency(locacao.valor_diaria),
          valor_total_formatted: formatCurrency(locacao.valor_total),
          valor_caucao_formatted: formatCurrency(locacao.valor_caucao),
          data_locacao_formatted: formatDate(locacao.data_locacao),
          data_entrega_formatted: formatDate(locacao.data_entrega),
          data_atual_formatted: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
          observacoes: locacao.observacoes
        };

        // Se for contrato-data, retorna JSON
        if (isContratoData) {
          return response.status(200).json({ success: true, data: contractData });
        }
        
        // Se for contrato, retorna HTML
        const htmlContent = generateContractHTML(contractData);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        return response.status(200).send(htmlContent);
      }

      let query = supabase.from('locacoes').select('id, status, data_locacao, data_entrega, valor_total, observacoes, cliente_id, veiculo_id, valor_diaria, valor_caucao, cliente:clientes ( id, nome, cpf ), veiculo:veiculos ( id, marca, modelo, placa, ano )');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(l => ({ 
        ...l, 
        cliente_nome: l.cliente?.nome, 
        veiculo_info: `${l.veiculo?.marca} ${l.veiculo?.modelo} - ${l.veiculo?.placa}`,
        clientes: l.cliente,
        veiculos: l.veiculo
      }));
      return response.status(200).json({ success: true, data: formattedData });
    }

    if (method === 'POST') {
      const { veiculo_id, data_locacao, data_entrega } = request.body;
      const { data: veiculo, error: veiculoError } = await supabase.from('veiculos').select('status').eq('id', veiculo_id).single();

      if (veiculoError) throw veiculoError;
      if (!veiculo || veiculo.status !== 'disponivel') {
        return response.status(400).json({ success: false, error: "Veículo não está disponível" });
      }

      const { data: overlap, error: overlapError } = await supabase.from('locacoes').select('id').eq('veiculo_id', veiculo_id).eq('status', 'ativa').or(`data_locacao.lte.${data_entrega},data_entrega.gte.${data_locacao}`).single();

      if (overlapError && overlapError.code !== 'PGRST116') throw overlapError;
      if (overlap) {
        return response.status(400).json({ success: false, error: "Veículo já possui locação no período informado" });
      }

      const { data: newLocacao, error } = await supabase.from('locacoes').insert([request.body]).select().single();
      if (error) throw error;

      // Após criar a locação, insere o registro financeiro correspondente
      if (newLocacao && newLocacao.valor_total > 0) {
        const { error: movError } = await supabase.from('movimentacoes_financeiras').insert({
          tipo: 'entrada',
          categoria: 'locacao',
          descricao: `Recebimento da Locação #${newLocacao.id}`,
          valor: newLocacao.valor_total,
          data_movimentacao: newLocacao.data_locacao,
          locacao_id: newLocacao.id,
          cliente_id: newLocacao.cliente_id,
        });

        if (movError) {
          console.error('ALERTA: A locação foi criada, mas falhou ao inserir o registro financeiro:', movError);
          // Não retorna erro para o cliente, mas loga o problema para manutenção
        }
      }

      // Criar automaticamente uma vistoria de saída quando um carro é locado
      console.log('=== INICIANDO CRIAÇÃO AUTOMÁTICA DE VISTORIA ===');
      console.log('newLocacao:', newLocacao);
      
      if (newLocacao) {
        try {
          console.log('Buscando dados do veículo ID:', veiculo_id);
          // Buscar dados do veículo para a vistoria
          const { data: veiculo, error: veiculoError } = await supabase
            .from('veiculos')
            .select('marca, modelo, placa, cor, ano')
            .eq('id', veiculo_id)
            .single();

          console.log('Dados do veículo:', veiculo);
          console.log('Erro do veículo:', veiculoError);

          // Buscar dados do cliente para incluir o nome como condutor padrão
          const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select('nome, cpf')
            .eq('id', newLocacao.cliente_id)
            .single();

          console.log('Dados do cliente:', cliente);
          console.log('Erro do cliente:', clienteError);

          if (!veiculoError && veiculo) {
            const vistoriaData = {
              cliente_id: newLocacao.cliente_id,
              veiculo_id: veiculo_id,
              locacao_id: newLocacao.id,
              tipo_vistoria: 'saida',
              placa: veiculo.placa,
              modelo: `${veiculo.marca} ${veiculo.modelo}`,
              cor: veiculo.cor,
              quilometragem: 0, // Valor padrão, será preenchido posteriormente
              nivel_combustivel: 'cheio', // Valor padrão
              nome_condutor: cliente?.nome || '', // Usar o nome do cliente como condutor padrão
              rg_condutor: null,
              observacoes: `Vistoria criada automaticamente para a locação #${newLocacao.id}`,
              avarias: null,
              assinatura_cliente: null,
              assinatura_vistoriador: null,
              nome_vistoriador: 'Sistema', // Valor padrão para criação automática
              fotos: '[]',
              // Inicializar todos os itens do checklist como false
              item_calota: false,
              item_pneu: false,
              item_antena: false,
              item_bateria: false,
              item_estepe: false,
              item_macaco: false,
              item_chave_roda: false,
              item_triangulo: false,
              item_extintor: false,
              item_tapetes: false,
              item_som: false,
              item_documentos: false,
              item_higienizacao: false
            };

            console.log('Dados da vistoria a serem inseridos:', vistoriaData);
            
            const { data: vistoriaResult, error: vistoriaError } = await supabase
              .from('vistorias')
              .insert([vistoriaData])
              .select();

            console.log('Resultado da inserção da vistoria:', vistoriaResult);
            console.log('Erro da inserção da vistoria:', vistoriaError);

            if (vistoriaError) {
              console.error('ALERTA: A locação foi criada, mas falhou ao criar a vistoria automática:', vistoriaError);
              // Não retorna erro para o cliente, mas loga o problema para manutenção
            } else {
              console.log(`Vistoria automática criada com sucesso para a locação #${newLocacao.id}`);
            }
          } else {
            console.log('Não foi possível buscar dados do veículo ou houve erro:', veiculoError);
          }
        } catch (vistoriaCreationError) {
          console.error('ERRO GERAL na criação automática de vistoria:', vistoriaCreationError);
          // Não retorna erro para o cliente, mas loga o problema para manutenção
        }
      } else {
        console.log('newLocacao é null ou undefined');
      }

      await supabase.from('veiculos').update({ status: 'locado' }).eq('id', veiculo_id);
      return response.status(200).json({ success: true, data: newLocacao });
    }

    if (method === 'PUT') {
      if (!finalId) {
        return response.status(400).json({ success: false, error: 'ID da locação inválido ou ausente.' });
      }
      const locacaoId = parseInt(finalId, 10);

      // 1. Fetch the existing location to get the veiculo_id
      const { data: currentLocacao, error: fetchError } = await supabase
        .from('locacoes')
        .select('veiculo_id, status')
        .eq('id', locacaoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar locação para atualização:', fetchError);
        return response.status(404).json({ success: false, error: 'Locação não encontrada.' });
      }

      // 2. Build the update object ONLY with fields present in the request body
      const updateData = {};
      const allowedFields = ['cliente_id', 'veiculo_id', 'data_locacao', 'data_entrega', 'valor_diaria', 'valor_total', 'valor_caucao', 'status', 'observacoes'];
      
      for (const key in request.body) {
        if (allowedFields.includes(key)) {
          updateData[key] = request.body[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ success: false, error: 'Nenhum campo válido para atualização foi fornecido.' });
      }

      // 3. Perform the update
      const { data: updatedLocacao, error: updateError } = await supabase
        .from('locacoes')
        .update(updateData)
        .eq('id', locacaoId)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar locação:', updateError);
        return response.status(500).json({ success: false, error: 'Falha ao atualizar a locação no banco de dados.', details: updateError.message });
      }

      // 4. If status changed to 'finalizada' or 'cancelada', update vehicle status
      const newStatus = updateData.status;
      if (newStatus && (newStatus === 'finalizada' || newStatus === 'cancelada')) {
        const { error: vehicleUpdateError } = await supabase
          .from('veiculos')
          .update({ status: 'disponivel' })
          .eq('id', currentLocacao.veiculo_id);
          
        if (vehicleUpdateError) {
            console.error('Erro ao atualizar status do veículo:', vehicleUpdateError);
            // Log the error, but don't block the response
        }
      }

      return response.status(200).json({ success: true, data: updatedLocacao });
    }

    if (method === 'DELETE') {
      console.log('=== INICIANDO DELETE DE LOCAÇÃO ===');
      console.log('ID da locação:', finalId);
      
      if (!finalId) return response.status(400).json({ success: false, error: 'Missing ID' });
      
      // Buscar dados da locação antes de deletar
      const { data: locacao, error: locacaoError } = await supabase.from('locacoes').select('veiculo_id').eq('id', finalId).single();
      console.log('Dados da locação encontrada:', locacao);
      console.log('Erro ao buscar locação:', locacaoError);
      
      if (locacaoError) {
        console.error('Erro ao buscar locação para deletar:', locacaoError);
        throw locacaoError;
      }

      // PRIMEIRO: Deletar movimentações financeiras relacionadas
      console.log('Deletando movimentações financeiras da locação:', finalId);
      const { error: movimentacoesDeleteError } = await supabase
        .from('movimentacoes_financeiras')
        .delete()
        .eq('locacao_id', finalId);
      
      console.log('Erro ao deletar movimentações financeiras:', movimentacoesDeleteError);
      
      if (movimentacoesDeleteError) {
        console.error('Erro ao deletar movimentações financeiras:', movimentacoesDeleteError);
        throw movimentacoesDeleteError;
      }

      // SEGUNDO: Deletar a locação
      console.log('Deletando a locação:', finalId);
      const { error: deleteError } = await supabase.from('locacoes').delete().eq('id', finalId);
      console.log('Erro ao deletar locação:', deleteError);
      
      if (deleteError) {
        console.error('Erro ao deletar locação:', deleteError);
        throw deleteError;
      }

      // TERCEIRO: Atualizar status do veículo
      console.log('Atualizando status do veículo para disponível:', locacao.veiculo_id);
      const { error: vehicleUpdateError } = await supabase.from('veiculos').update({ status: 'disponivel' }).eq('id', locacao.veiculo_id);
      console.log('Erro ao atualizar veículo:', vehicleUpdateError);
      
      if (vehicleUpdateError) {
        console.error('Erro ao atualizar status do veículo após deletar locação:', vehicleUpdateError);
        // Não bloqueia a resposta, mas loga o erro
      }

      console.log('Locação e movimentações financeiras deletadas com sucesso');
      return response.status(200).json({ success: true });
    }

    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).json({ success: false, error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error("Erro na função locações:", error);
    return response.status(500).json({ success: false, error: "Erro interno do servidor.", details: error.message });
  }
}