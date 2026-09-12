import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const packageConfig = readFileSync(join(root, 'config/package.toml'), 'utf8');
const configured = packageConfig.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!configured) throw new Error('Could not read version from config/package.toml');
const requested = process.argv.slice(2).filter(value => value !== '--').at(-1) ?? configured;
if (requested !== configured) throw new Error(`Release version ${requested} does not match config version ${configured}`);
const source = join(root, `packages/userscript/dist/markify-v${configured}.user.js`);
const contents = readFileSync(source, 'utf8');
if (!contents.includes(`// @version      ${configured}`)) throw new Error(`Generated metadata does not contain version ${configured}`);
for (const manifest of ['package.json', 'packages/core/package.json', 'packages/userscript/package.json', 'packages/cli/package.json', 'packages/mcp/package.json']) {
    const version = JSON.parse(readFileSync(join(root, manifest), 'utf8')).version;
    if (version !== configured) throw new Error(`${manifest} version ${version} does not match ${configured}`);
}
const directory = join(root, 'dist');
mkdirSync(directory, { recursive: true });
const destination = join(directory, 'markify.user.js');
copyFileSync(source, destination);
console.log(JSON.stringify({ version: configured, source, destination }));
