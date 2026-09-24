import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve('dist/client');
const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH;

if (!basePath || !/^\/[A-Za-z0-9._-]+$/.test(basePath))
    throw new Error('NEXT_PUBLIC_SITE_BASE_PATH must be a repository path such as /sidequest');

const prefixedAssets = path.join(output, basePath.slice(1), '_next');
const assets = path.join(output, '_next');
if (!fs.existsSync(prefixedAssets) || fs.existsSync(assets))
    throw new Error('The expected static asset directory is missing or duplicated');
fs.renameSync(prefixedAssets, assets);
fs.rmdirSync(path.dirname(prefixedAssets));

for (const route of ['index', 'deus-ex', 'witcher-3', 'ac-valhalla'])
{
    const html = path.join(output, `${route}.html`);
    if (!fs.existsSync(html))
        throw new Error(`Static page is missing: ${html}`);

    const content = fs.readFileSync(html, 'utf8');
    if (!content.includes(`${basePath}/_next/static/`))
        throw new Error(`Static assets do not use ${basePath}: ${html}`);

    if (route !== 'index')
    {
        const directory = path.join(output, route);
        fs.mkdirSync(directory, {recursive: true});
        fs.copyFileSync(html, path.join(directory, 'index.html'));
    }
}

fs.writeFileSync(path.join(output, '.nojekyll'), '');
