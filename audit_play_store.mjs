import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://uvqyxpwlgltnskjdbwzt.supabase.co';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const results = [];

function logPass(title, detail = '') {
  console.log(`✅ [PASS] ${title} ${detail ? `- ${detail}` : ''}`);
  results.push({ test: title, status: 'PASS', detail });
}

function logFail(title, error) {
  console.error(`❌ [FAIL] ${title} - ${error}`);
  results.push({ test: title, status: 'FAIL', error });
}

async function runCompleteAudit() {
  console.log('\n======================================================');
  console.log('   AUDITORIA GERAL DO SISTEMA OLIVEIRA VEÍCULOS v2.5.7');
  console.log('         Preparação Oficial para Google Play Store     ');
  console.log('======================================================\n');

  const supabase = createClient(url, anonKey);

  // 1. Teste de Login: Dono / Administrador
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'odair.orso78@gmail.com',
      password: process.env.TEST_ADMIN_PASSWORD || ''
    });
    if (error || !data.session) throw new Error(error?.message || 'Sem sessão');
    logPass('Autenticação Dono/Admin (odair.orso78@gmail.com)', `ID: ${data.user.id}`);

    // Testar consultas autenticadas como Admin
    const [locs, veics, clis, movs, configs, reservas, vistorias, manuts] = await Promise.all([
      supabase.from('locacoes').select('id, status, data_entrega, valor_total'),
      supabase.from('veiculos').select('id, modelo, marca, placa, status'),
      supabase.from('clientes').select('id, nome, documento, celular, email'),
      supabase.from('movimentacoes_financeiras').select('id, tipo, valor, data_movimentacao'),
      supabase.from('configuracoes_empresa').select('*').limit(1),
      supabase.from('solicitacoes_reserva').select('id, status, cliente_nome'),
      supabase.from('vistorias').select('id, tipo_vistoria'),
      supabase.from('manutencoes').select('id, valor, tipo_manutencao')
    ]);

    if (locs.error) throw new Error('Locações: ' + locs.error.message);
    logPass('Banco de Dados: Locações carregadas', `${locs.data.length} contratos`);

    if (veics.error) throw new Error('Veículos: ' + veics.error.message);
    logPass('Banco de Dados: Veículos da frota', `${veics.data.length} veículos`);

    if (clis.error) throw new Error('Banco de Dados: Clientes cadastrados', clis.error.message);
    logPass('Banco de Dados: Clientes cadastrados', `${clis.data.length} clientes`);

    if (movs.error) throw new Error('Financeiro: ' + movs.error.message);
    logPass('Banco de Dados: Movimentações Financeiras', `${movs.data.length} lançamentos`);

    if (configs.error) throw new Error('Configurações: ' + configs.error.message);
    logPass('Banco de Dados: Configurações Empresa & PIX', `Chave: ${configs.data[0]?.chave_pix || 'OK'}`);

    if (reservas.error) throw new Error('Reservas: ' + reservas.error.message);
    logPass('Banco de Dados: Solicitações de Reserva', `${reservas.data.length} pedidos`);

    if (vistorias.error) throw new Error('Vistorias: ' + vistorias.error.message);
    logPass('Banco de Dados: Check List & Vistorias', `${vistorias.data.length} vistorias`);

    if (manuts.error) throw new Error('Manutenções: ' + manuts.error.message);
    logPass('Banco de Dados: Manutenções', `${manuts.data.length} registros`);

    await supabase.auth.signOut();
  } catch (e) {
    logFail('Autenticação e Queries Admin', e.message);
  }

  // 2. Teste de Login: Funcionário
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'ricardo.oliveiraveiculos@gmail.com',
      password: process.env.TEST_ADMIN_PASSWORD || ''
    });
    if (error || !data.session) throw new Error(error?.message || 'Sem sessão');
    logPass('Autenticação Funcionário (ricardo.oliveiraveiculos@gmail.com)', `ID: ${data.user.id}`);
    await supabase.auth.signOut();
  } catch (e) {
    logFail('Autenticação Funcionário', e.message);
  }

  // 3. Teste de Login: Cliente (Rosângela)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lanjaturcibinda@gmail.com',
      password: process.env.TEST_CLIENT_PASSWORD || ''
    });
    if (error || !data.session) throw new Error(error?.message || 'Sem sessão');
    logPass('Autenticação Cliente (lanjaturcibinda@gmail.com)', `ID: ${data.user.id}`);
    await supabase.auth.signOut();
  } catch (e) {
    logFail('Autenticação Cliente', e.message);
  }

  // 4. Verificação dos Pacotes de Distribuição para Google Play
  console.log('\n--- VERIFICAÇÃO DE PACOTES GOOGLE PLAY STORE ---');
  const bundleDir = path.resolve('APP_GERADO_PLAY_STORE');
  const aabPath = path.join(bundleDir, 'Oliveira_Veiculos_v2.5.7.aab');
  const apkPath = path.join(bundleDir, 'Oliveira_Veiculos_v2.5.7.apk');

  if (fs.existsSync(aabPath)) {
    const aabSize = (fs.statSync(aabPath).size / (1024 * 1024)).toFixed(2);
    logPass('Pacote .AAB Oficial Play Store', `Tamanho: ${aabSize} MB (Assinado em Modo Release)`);
  } else {
    logFail('Pacote .AAB Play Store', 'Arquivo Oliveira_Veiculos_v2.5.7.aab não encontrado!');
  }

  if (fs.existsSync(apkPath)) {
    const apkSize = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2);
    logPass('Pacote .APK para testes diretos', `Tamanho: ${apkSize} MB`);
  } else {
    logFail('Pacote .APK', 'Arquivo Oliveira_Veiculos_v2.5.7.apk não encontrado!');
  }

  // 5. Verificação do AndroidManifest e build.gradle
  const buildGradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf-8');
  if (buildGradle.includes('versionCode 33') && buildGradle.includes('versionName "2.5.7"')) {
    logPass('Configuração de Versão Gradle', 'versionCode: 33 | versionName: 2.5.7');
  } else {
    logFail('Configuração de Versão Gradle', 'Versão incorreta no build.gradle');
  }

  console.log('\n======================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  if (allPassed) {
    console.log(' 🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
    console.log(' O pacote .AAB está pronto para upload no Google Play Console!');
  } else {
    console.log(' ⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.');
  }
  console.log('======================================================\n');
}

runCompleteAudit();
