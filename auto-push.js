import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para executar comandos git
function runGitCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.log(`Stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Função para fazer auto-push
async function autoPush() {
  try {
    console.log('🔍 Verificando mudanças...');
    
    // Verificar se há mudanças
    const status = await runGitCommand('git status --porcelain');
    
    if (status.trim() === '') {
      console.log('✅ Nenhuma mudança detectada.');
      return;
    }
    
    console.log('📝 Mudanças detectadas, fazendo commit e push...');
    
    // Adicionar todos os arquivos
    await runGitCommand('git add .');
    
    // Fazer commit com timestamp
    const timestamp = new Date().toLocaleString('pt-BR');
    await runGitCommand(`git commit -m "Auto-commit: ${timestamp}"`);
    
    // Fazer push
    await runGitCommand('git push origin main');
    
    console.log('🚀 Push realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no auto-push:', error.message);
  }
}

// Executar auto-push
autoPush();

// Para monitoramento automático, instale chokidar: npm install chokidar
// e descomente o código abaixo