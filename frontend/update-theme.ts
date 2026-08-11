import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Perform replacements to add light mode variants
    const replacements = [
      ['bg-sidebar-dark', 'bg-white dark:bg-sidebar-dark'],
      ['text-gray-300', 'text-gray-600 dark:text-gray-300'],
      ['text-gray-400', 'text-gray-500 dark:text-gray-400'],
      ['border-white/5', 'border-gray-200 dark:border-white/5'],
      ['border-white/10', 'border-gray-200 dark:border-white/10'],
      ['bg-white/10', 'bg-gray-100 dark:bg-white/10'],
      ['bg-white/5', 'bg-gray-50 dark:bg-white/5'],
      ['bg-white/20', 'bg-gray-200 dark:bg-white/20'],
      ['text-white', 'text-gray-900 dark:text-white'],
      ['bg-card-dark', 'bg-white dark:bg-card-dark'],
      ['hover:bg-white/5', 'hover:bg-gray-100 dark:hover:bg-white/5'],
      ['hover:bg-white/10', 'hover:bg-gray-200 dark:hover:bg-white/10'],
      ['hover:text-white', 'hover:text-gray-900 dark:hover:text-white'],
      ['border-white/20', 'border-gray-300 dark:border-white/20'],
    ];

    let modified = content;
    for (const [find, replace] of replacements) {
      // Use regex with word boundaries where possible, or just replace all for now
      // Since it's tailwind classes, let's use a simple replace loop to avoid complex boundaries breaking things,
      // but ensure we don't double replace.
      // So first check if it already has the dark variant:
      if (!modified.includes(replace)) {
         modified = modified.split(find).join(replace);
      }
    }
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
