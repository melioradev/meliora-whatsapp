// Copies the published Meliora Accessibility and Meliora Consent builds into vendor/, so the demo page (and GitHub
// Pages) can load them from this site. `--check` fails when vendor/ differs from the versions in package.json.
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const PACKAGES = ['meliora-accessibility', 'meliora-consent'];
const check = process.argv.includes('--check');
let stale = [];
for (const name of PACKAGES) {
  const from = path.join(root, 'node_modules', name, 'dist');
  const to = path.join(root, 'vendor', name);
  await mkdir(to, {recursive: true});
  for (const file of await readdir(from)) {
    const body = await readFile(path.join(from, file));
    const target = path.join(to, file);
    if (check) {
      const current = await readFile(target).catch(() => null);
      if (!current || !current.equals(body)) stale.push(path.relative(root, target));
    } else {
      await writeFile(target, body);
    }
  }
}
if (stale.length) { console.error(`vendor/ is out of date (run npm run vendor): ${stale.join(', ')}`); process.exit(1); }
if (!check) console.log(`vendor/: ${PACKAGES.join(', ')}`);
