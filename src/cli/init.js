import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { head, info, ok, error, createDir, createFile, CDN_BASE, svgToDataUri } from './utils.js';

export async function cmdInit(args, force = false, cwd = process.cwd(), SCAFFOLD) {
	head('🌈 Bifröst Init');
	console.log(`   Zielverzeichnis: \x1b[2m${cwd}\x1b[0m`);
	if (force) info('--force: Vorhandene Dateien werden überschrieben.');

	head('Ordner');
	for (const dir of SCAFFOLD.dirs) {
		await createDir(dir, cwd);
	}

	head('Dateien');
	for (const [rel, content] of Object.entries(SCAFFOLD.files)) {
		await createFile(rel, content, force, cwd);
	}

	head('🏳  Flaggen generieren (de, en, fr, es, it)');
	try {
		const initCodes = ['de', 'gb', 'fr', 'es', 'it'];
		const outPath   = join(cwd, 'public/css/flags.css');

		const results = await Promise.allSettled(
			initCodes.map(async ($code) => {
				const res = await fetch(`${CDN_BASE}/${$code}.svg`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const svg = await res.text();
				return { code: $code, uri: svgToDataUri(svg) };
			})
		);

		const lines = [
			`/* Bifröst Flags — generiert von bifrost init — ${new Date().toISOString().slice(0, 10)} */`,
			`/* Weitere Flaggen: npx bifrost flags --codes de,en,... */`,
			'',
		];
		for (const r of results) {
			if (r.status === 'fulfilled') {
				ok(`.flag--${r.value.code}`);
				lines.push(`.flag--${r.value.code} { background-image: ${r.value.uri}; }`);
			} else {
				const idx  = results.indexOf(r);
				error(`${initCodes[idx]}: ${r.reason?.message} (übersprungen)`);
			}
		}
		lines.push('');
		await writeFile(outPath, lines.join('\n'), 'utf8');
		ok('public/css/flags.css');
	} catch ($err) {
		error(`Flaggen konnten nicht geladen werden: ${$err.message}`);
		info('Kein Internet? Später ausführen: npx bifrost flags --codes de,en,fr,es,it');
	}

	head('Fertig');
	console.log(`\n   Starte die App mit:\n\n     \x1b[36mnode app.js\x1b[0m\n\n   Dann öffne: \x1b[36mhttp://localhost:3000\x1b[0m\n`);
}