import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BBController } from './BBController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Router {

	/**
	 * Liest alle JavaScript-Dateien aus $dir ein
	 * und führt deren default-Export aus (alte API, abwärtskompatibel).
	 * @param {object} $bifrost  Bifrost-Instanz
	 * @param {string} $dir      Absoluter Pfad zum Routen-Ordner
	 */
	static async loadRoutes($bifrost, $dir) {
		console.log(`🗺️  Lade Routen aus: ${$dir}`);

		try {
			const files = fs.readdirSync($dir).filter(f => f.endsWith('.js'));

			for (const file of files) {
				const filePath = pathToFileURL(path.join($dir, file)).href;
				const module = await import(filePath);

				if (typeof module.default === 'function') {
					module.default($bifrost);
					console.log(`   ✅ Route geladen: ${file}`);
				} else {
					console.warn(`   ⚠️ Warnung: ${file} exportiert keine Standardfunktion.`);
				}
			}
		} catch ($err) {
			console.error('❌ Fehler beim Laden der Routen:', $err);
		}
	}


	/**
	 * Scannt einen beliebigen Ordner nach BBController-Subklassen
	 * und registriert sie automatisch bei Bifrost.
	 *
	 * @param {Bifrost}    $bifrost   Bifrost-Instanz
	 * @param {BifrostApp} $app       App-Instanz (wird an Controller-Konstruktor übergeben)
	 * @param {string}     $dir       Absoluter Pfad zum Controllers-Ordner
	 */
	static async loadControllers($bifrost, $app, $dir) {
		console.log(`🗺️  Lade Controller aus: ${$dir}`);

		let files;
		try {
			files = fs.readdirSync($dir).filter(f => f.endsWith('.js'));
		} catch ($err) {
			console.error(`❌ Controller-Ordner nicht lesbar: ${$dir}`, $err);
			return;
		}

		for (const file of files) {
			const filePath = pathToFileURL(path.join($dir, file)).href;
			let module;
			try {
				module = await import(filePath);
			} catch ($err) {
				console.error(`❌ Import-Fehler: ${file}`, $err);
				continue;
			}

			const ControllerClass = module.default;

			// Nur BBController-Subklassen verarbeiten
			if (
				typeof ControllerClass !== 'function' ||
				!(ControllerClass.prototype instanceof BBController)
			) {
				console.warn(`   ⚠️ Kein BBController: ${file} — übersprungen`);
				continue;
			}

			const controllerPath    = ControllerClass.path;
			const controllerMethods = ControllerClass.methods ?? ['get'];

			for (const method of controllerMethods) {
				if (typeof $bifrost[method] !== 'function') {
					console.warn(`   ⚠️ Methode '${method}' nicht unterstützt (${file})`);
					continue;
				}

				$bifrost[method](controllerPath, async ($req, $res) => {
					const ctrl = new ControllerClass($req, $res, null, $app);

					// paramCb ausführen wenn vorhanden
					if (ControllerClass.paramName && typeof ControllerClass.paramCb === 'function') {
						const paramValue = $req.params?.[ControllerClass.paramName];
						await ControllerClass.paramCb(paramValue, $req);
					}

					// Lifecycle: prepare (z.B. Auth-Check)
					const proceed = await ctrl.prepare();
					if (proceed === false || $res.writableEnded) return;

					// Method-Dispatch
					const handler = ctrl[method];
					if (typeof handler === 'function') {
						await handler.call(ctrl);
					}
				});

				console.log(`   ✅ ${method.toUpperCase()} ${controllerPath} → ${ControllerClass.name}`);
			}
		}
	}

}
