import fs from 'fs';
import path from 'path';

function findInDir(dir, pattern) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findInDir(fullPath, pattern);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

console.log('=== Buscando setInterval ===');
findInDir('src/react-app', /setInterval/);

console.log('\n=== Buscando onAuthStateChange ===');
findInDir('src/react-app', /onAuthStateChange/);

console.log('\n=== Buscando refreshSession ===');
findInDir('src/react-app', /refreshSession/);

console.log('\n=== Buscando resetSupabase ou disconnect ===');
findInDir('src/react-app', /resetSupabase/);
