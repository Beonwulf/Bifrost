import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { head, info, ok, error, CDN_BASE, svgToDataUri } from './utils.js';

const DEFAULT_FLAG_CODES = [
	'de', 'at', 'ch', 'gb', 'us', 'fr', 'es', 'it', 'pt', 'nl',
	'pl', 'ru', 'tr', 'jp', 'cn', 'kr', 'ar', 'se', 'dk', 'fi',
	'no', 'ua', 'cz', 'ro', 'hr', 'sk', 'hu', 'bg', 'gr', 'eu',
];

export async function cmdFlags(args, cwd = process.cwd()) {
	head('🏳  Bifröst Flags');

	const codesArg = args.find($a => $a.startsWith('--codes=') || ($a === '--codes'));
	let codes;
	if (codesArg === '--codes') {
		const idx = args.indexOf('--codes');
		codes = (args[idx + 1] ?? '').split(',').map($c => $c.trim().toLowerCase()).filter(Boolean);
	} else if (codesArg?.startsWith('--codes=')) {
		codes = codesArg.slice(8).split(',').map($c => $c.trim().toLowerCase()).filter(Boolean);
	} else {
		codes = DEFAULT_FLAG_CODES;
		info(`Keine --codes angegeben, nutze ${codes.length} Standard-Flaggen.`);
	}

	const outArg  = args.find($a => $a.startsWith('--out=') || ($a === '--out'));
	let outRel;
	if (outArg === '--out') {
		const idx = args.indexOf('--out');
		outRel = args[idx + 1] ?? 'public/css/flags.css';
	} else if (outArg?.startsWith('--out=')) {
		outRel = outArg.slice(6);
	} else {
		outRel = 'public/css/flags.css';
	}
	const outPath = join(cwd, outRel);

	console.log(`   Ländercodes:  \x1b[2m${codes.join(', ')}\x1b[0m`);
	console.log(`   Ausgabe:      \x1b[2m${outRel}\x1b[0m`);
	console.log(`   Quelle:       \x1b[2m${CDN_BASE}/{code}.svg\x1b[0m`);

	head('SVGs laden');

	const results = await Promise.allSettled(
		codes.map(async ($code) => {
			const url = `${CDN_BASE}/${$code}.svg`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const svg = await res.text();
			return { code: $code, uri: svgToDataUri(svg) };
		})
	);

	const succeeded = [];
	for (const result of results) {
		if (result.status === 'fulfilled') {
			ok(`.flag--${result.value.code}`);
			succeeded.push(result.value);
		} else {
			const code = codes[results.indexOf(result)];
			error(`${code}: ${result.reason?.message ?? 'Unbekannter Fehler'}`);
		}
	}

	if (succeeded.length === 0) {
		error('Keine Flaggen geladen. Prüfe die Internetverbindung.');
		process.exit(1);
	}

	head('CSS schreiben');
	const lines = [ `/* ============================================================`, `   Bifröst Flags — generiert am ${new Date().toISOString().slice(0, 10)}`, `   ${succeeded.length} Flaggen | Quelle: flag-icons (jsDelivr)`, `   Verwendung: <span class="flag flag--de" aria-label="Deutsch"></span>`, `   Neu generieren: npx bifrost flags`, `   ============================================================ */`, `` ];
	for (const { code, uri } of succeeded) lines.push(`.flag--${code} { background-image: ${uri}; }`);
	lines.push('');
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(outPath, lines.join('\n'), 'utf8');
	ok(`${outRel} (${succeeded.length} Flaggen)`);
	head('Fertig');
	console.log(`\n   Einbinden in \x1b[36mmvc/views/partials/head.galdr.html\x1b[0m:\n\n     \x1b[36m<link rel="stylesheet" href="/css/flags.css">\x1b[0m\n\n   Verwendung im Template:\n\n     \x1b[36m<span class="flag flag--de" aria-label="Deutsch"></span>\x1b[0m\n     \x1b[36m<span class="flag flag--gb" aria-label="English"></span>\x1b[0m\n`);
}