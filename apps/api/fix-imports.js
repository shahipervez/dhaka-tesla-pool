import fs from 'fs';
import path from 'path';

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findFiles(filePath, filter, fileList);
    } else if (filter(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const enumNames = ['Role', 'Area', 'RideStatus', 'PoolStatus', 'PaymentMethod'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const prismaImportRegex = /import\s+({[^}]*})\s+from\s+['"]@prisma\/client['"];?/g;
  
  content = content.replace(prismaImportRegex, (match, importsStr) => {
    // parse the imports
    const imports = importsStr.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    const enumsToImport = [];
    const prismaImports = [];

    for (const imp of imports) {
      if (enumNames.includes(imp)) {
        enumsToImport.push(imp);
      } else {
        prismaImports.push(imp);
      }
    }

    if (enumsToImport.length === 0) {
      return match;
    }

    changed = true;
    let newImportStatements = '';
    
    if (prismaImports.length > 0) {
      newImportStatements += `import { ${prismaImports.join(', ')} } from '@prisma/client';\n`;
    }
    
    // figure out relative path to src/enums.js
    // filePath is e.g. src/routes/driver.ts
    // relDir is routes
    const relDir = path.dirname(filePath).replace(/\\/g, '/');
    let enumsPath = '';
    if (relDir === 'src') {
      enumsPath = './enums.js';
    } else {
      const parts = relDir.split('src/');
      if (parts.length > 1) {
        const sub = parts[1];
        const depth = sub.split('/').length;
        enumsPath = '../'.repeat(depth) + 'enums.js';
      } else {
        enumsPath = './enums.js';
      }
    }
    
    newImportStatements += `import { ${enumsToImport.join(', ')} } from '${enumsPath}';`;
    return newImportStatements;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

const files = findFiles('src', (f) => f.endsWith('.ts'));
files.forEach(processFile);

