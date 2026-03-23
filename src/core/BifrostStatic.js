import { mimeTypes } from '../utils/mimeTypes.js';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';


const gzip = promisify(zlib.gzip);


export class BifrostStatic {


	static #compression = false;

	static enableCompression() { BifrostStatic.#compression = true; }
	static disableCompression() { BifrostStatic.#compression = false; }
	static useCompression() { return BifrostStatic.#compression; }


	static createStaticRune( $rootDir ) {
		return async (req, res, next) => {
			if (req.url.startsWith('/socket.io')) {
				return await next(); // Sofort weiterreichen an Socket.io
			}
			// Verhindert Directory Traversal Angriffe (Sicherheit!)
			const safePath = req.url === '/' ? '/index.html' : req.url;
			const filePath = join(process.cwd(), $rootDir, safePath);
			const acceptEncoding = req.headers['accept-encoding'] || '';


			try {
				const stats = await stat(filePath);

				if (stats.isFile()) {
					const ext = extname(filePath).toLowerCase();
					const contentType = mimeTypes[ext] || 'application/octet-stream';

					let content = await readFile(filePath);

					if( BifrostStatic.useCompression() === true ) {
						// Hier passiert die Kompression VOR dem Senden der Header
						if (acceptEncoding.includes('gzip')) {
							content = await gzip(content);
							res.setHeader('Content-Encoding', 'gzip');
						}
					}
					/**
					 * für Sharedarraybuffer
					 */
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

					res.setHeader('Content-Type', contentType);
        			res.setHeader('Content-Length', content.length);
					res.writeHead(200);
					res.end(content);
					return; // Wir beenden hier, kein next() nötig!
				}
			}
			catch (err) {
				// Wenn Datei nicht existiert, einfach zum nächsten Handler (z.B. API oder 404)
				return await next(); // UNBEDINGT weiterreichen!
			}

			await next();
		};
	}


	static createBodyParserRune() {
		return async (req, res, next) => {
			if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
				let body = '';
				for await (const chunk of req) body += chunk;
				try {
					req.body = JSON.parse(body);
				} catch (e) {
					req.body = {};
				}
			}

			// Weiter zur nächsten Rune
			await next();
		};
	}


	static createResponseHelperRune() {
		return async (req, res, next) => {
			// Wir fügen eine bequeme .json() Methode hinzu
			res.json = (data, status = 200) => {
				res.writeHead(status, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(data));
			};

			// Und eine .error() Methode für einheitliche Fehlermeldungen
			res.error = (message, status = 400) => {
				res.json({ error: message }, status);
			};

			await next();
		};
	}


}
