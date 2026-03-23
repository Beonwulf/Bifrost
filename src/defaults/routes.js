/**
 * Bifröst Default-Handler
 *
 * Wird von BifrostApp automatisch registriert —
 * nur aktiv, wenn der App-Nutzer keinen eigenen Handler via
 * app.setErrorHandler(404, ...) gesetzt hat.
 *
 * Diese Datei ist NICHT der richtige Ort für App-spezifische Fehlerseiten.
 * Eigene Handler gehören in die App-Schicht (z.B. BeonBot).
 */

import { Galdr } from '../template/Galdr.js';


export const handler404 = async ($req, $res) => {
	if ($res.writableEnded) return;
	const html = await Galdr.renderBuiltin('404', { url: $req.url ?? '' });
	$res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
	$res.end(html);
};

export const handler500 = async ($req, $res, $err) => {
	if ($res.writableEnded) return;
	console.error('⚠️ Bifröst 500:', $err);
	const html = await Galdr.renderBuiltin('500');
	$res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
	$res.end(html);
};
