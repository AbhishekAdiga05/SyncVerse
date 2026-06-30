import fs from 'fs/promises';
import path from 'path';
import { transform } from 'esbuild';

async function walk(dir) {
  let files = await fs.readdir(dir);
  for (let file of files) {
    let full = path.join(dir, file);
    let stat = await fs.stat(full);
    if (stat.isDirectory() && file !== 'node_modules') {
      await walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let code = await fs.readFile(full, 'utf8');
      try {
        let res = await transform(code, { loader: full.endsWith('.tsx') ? 'tsx' : 'ts', jsx: 'preserve' });
        let newName = full.replace(/\.tsx?$/, full.endsWith('.tsx') ? '.jsx' : '.js');
        await fs.writeFile(newName, res.code);
        await fs.unlink(full);
        console.log(`Converted ${full}`);
      } catch (e) {
        console.error(`Failed to convert ${full}`, e);
      }
    }
  }
}
walk('src').then(() => console.log('Done'));
