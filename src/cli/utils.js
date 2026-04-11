import { mkdir, access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ok    = ($msg) => console.log(`  \x1b[32m✔\x1b[0m  ${$msg}`);
export const skip  = ($msg) => console.log(`  \x1b[33m–\x1b[0m  ${$msg} \x1b[2m(bereits vorhanden, übersprungen)\x1b[0m`);
export const info  = ($msg) => console.log(`  \x1b[36mℹ\x1b[0m  ${$msg}`);
export const error = ($msg) => console.error(`  \x1b[31m✘\x1b[0m  ${$msg}`);
export const head  = ($msg) => console.log(`\n\x1b[1m${$msg}\x1b[0m`);

export async function exists($path) {
	try { await access($path); return true; } catch { return false; }
}

export async function createDir($rel, cwd = process.cwd()) {
	const full = join(cwd, $rel);
	await mkdir(full, { recursive: true });
	ok(`${$rel}/`);
}

export async function createFile($rel, $content, force = false, cwd = process.cwd()) {
	const full = join(cwd, $rel);
	if (!force && await exists(full)) {
		skip($rel);
		return;
	}
	await writeFile(full, $content, 'utf-8');
	ok($rel);
}

export const CDN_BASE = 'https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3';

export function svgToDataUri($svg) {
	const cleaned = $svg
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<\?xml[^?]*\?>/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	const encoded = cleaned
		.replace(/"/g, "'")
		.replace(/%/g, '%25')
		.replace(/#/g, '%23')
		.replace(/</g, '%3C')
		.replace(/>/g, '%3E');

	return `url("data:image/svg+xml,${encoded}")`;
}