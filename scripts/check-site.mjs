import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const htmlFiles = readdirSync(root).filter((file) => extname(file) === '.html').sort();
const failures = [];

function read(file) {
    return readFileSync(join(root, file), 'utf8');
}

function fail(message) {
    failures.push(message);
}

for (const file of htmlFiles) {
    const html = read(file);

    if (!/<title>[^<]+<\/title>/.test(html)) {
        fail(`${file}: missing <title>`);
    }

    if (!/<meta\s+name="description"\s+content="[^"]+"/.test(html)) {
        fail(`${file}: missing meta description`);
    }

    const resourcePattern = /<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g;
    let match;
    while ((match = resourcePattern.exec(html)) !== null) {
        const target = match[1];
        if (/^(https?:|mailto:|#)/.test(target)) {
            continue;
        }
        if (target.endsWith('.html')) {
            continue;
        }
        if (!existsSync(join(root, target))) {
            fail(`${file}: missing referenced asset ${target}`);
        }
    }

    const linkPattern = /<a\b[^>]+href="([^"]+)"/g;
    while ((match = linkPattern.exec(html)) !== null) {
        const target = match[1].split('#')[0];
        if (!target || /^(https?:|mailto:)/.test(target)) {
            continue;
        }
        if (target.endsWith('.html') && !existsSync(join(root, target))) {
            fail(`${file}: missing linked page ${target}`);
        }
    }
}

const sitemapPath = join(root, 'sitemap.xml');
const robotsPath = join(root, 'robots.txt');

if (!existsSync(sitemapPath)) {
    fail('missing sitemap.xml');
} else {
    const sitemap = read('sitemap.xml');
    for (const file of htmlFiles) {
        if (file === 'index.html') {
            continue;
        }
        const expected = `https://rodert.github.io/jsonformat/${file}`;
        if (!sitemap.includes(expected)) {
            fail(`sitemap.xml: missing ${file}`);
        }
    }
}

if (!existsSync(robotsPath)) {
    fail('missing robots.txt');
} else {
    const robots = read('robots.txt');
    if (!robots.includes('Sitemap: https://rodert.github.io/jsonformat/sitemap.xml')) {
        fail('robots.txt: missing sitemap directive');
    }
}

if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log(`site check ok (${htmlFiles.length} html pages)`);
