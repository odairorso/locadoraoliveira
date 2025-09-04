# 🚀 Sistema de Auto-Push para GitHub

Agora você não precisa mais fazer push manualmente toda hora! Este sistema automatiza o processo de commit e push para o GitHub.

## 📋 Como Usar

### Opção 1: Comando NPM (Recomendado)
```bash
npm run push
```

### Opção 2: Script Batch (Windows)
Clique duas vezes no arquivo `push.bat` ou execute:
```bash
.\push.bat
```

### Opção 3: Comando Direto
```bash
node auto-push.js
```

## ✨ O que o Script Faz

1. **Verifica mudanças**: Checa se há arquivos modificados
2. **Adiciona arquivos**: Executa `git add .`
3. **Faz commit**: Cria um commit com timestamp automático
4. **Faz push**: Envia para o GitHub automaticamente

## 📝 Exemplo de Uso

```bash
# Depois de fazer suas alterações no código:
npm run push

# Saída:
🔍 Verificando mudanças...
📝 Mudanças detectadas, fazendo commit e push...
🚀 Push realizado com sucesso!
```

## 🎯 Vantagens

- ✅ **Automático**: Não precisa lembrar dos comandos git
- ✅ **Rápido**: Um comando só faz tudo
- ✅ **Seguro**: Verifica mudanças antes de fazer push
- ✅ **Timestamp**: Commits com data/hora automática
- ✅ **Feedback**: Mostra o que está acontecendo

## 🔧 Personalização

Para personalizar a mensagem de commit, edite o arquivo `auto-push.js` na linha:
```javascript
await runGitCommand(`git commit -m "Auto-commit: ${timestamp}"`);
```

## 📱 Dica

Crie um atalho na área de trabalho para o `push.bat` para acesso ainda mais rápido!

---

**Agora você pode focar no código e deixar o Git por nossa conta! 🎉**