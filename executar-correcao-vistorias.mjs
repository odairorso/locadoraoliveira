#!/usr/bin/env node

// Script para executar a correção de vistorias inconsistentes
import corrigirVistoriasInconsistentes from './corrigir-vistorias-inconsistentes.mjs';

console.log('=== Correção de Vistorias Inconsistentes ===');
console.log('Este script irá verificar e corrigir possíveis inconsistências nas vistorias.');
console.log('Pressione Ctrl+C para cancelar.\n');

// Aguardar um momento para o usuário ler a mensagem
setTimeout(() => {
  corrigirVistoriasInconsistentes()
    .then(() => {
      console.log('\n✅ Processo de correção concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante o processo de correção:', error);
      process.exit(1);
    });
}, 2000);