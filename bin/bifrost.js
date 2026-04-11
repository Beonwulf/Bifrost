#!/usr/bin/env node
/**
 * Bifröst CLI
 *
 * Usage:
 *   npx bifrost init                           — Projekt-Grundgerüst anlegen
 *   npx bifrost init --force                   — Vorhandene Dateien überschreiben
 *   npx bifrost flags                          — flags.css mit Standard-Flaggen generieren
 *   npx bifrost flags --codes de,en,fr,es      — Nur gewählte Ländercodes
 *   npx bifrost flags --out public/css/flags.css
 */

import { cmdInit } from '../src/cli/init.js';
import { cmdFlags } from '../src/cli/flags.js';
import { cmdMakeController, cmdMakeForm, cmdMakeView, cmdMakeService, cmdMakeModel } from '../src/cli/make.js';
import { SCAFFOLD } from '../src/cli/scaffold.js';

const args    = process.argv.slice(2);
const command = args[0];
const force   = args.includes('--force');
const cwd     = process.cwd();

// ── Dispatch ──────────────────────────────────────────────────────────────────

switch (command) {
	case 'init':
		await cmdInit(args, force, cwd, SCAFFOLD);
		break;

	case 'flags':
		await cmdFlags(args, cwd);
		break;

	case 'make:controller':
		await cmdMakeController(args, force, cwd);
		break;

	case 'make:form':
		await cmdMakeForm(args, force, cwd);
		break;

	case 'make:view':
		await cmdMakeView(args, force, cwd);
		break;

	case 'make:service':
		await cmdMakeService(args, force, cwd);
		break;

	case 'make:model':
		await cmdMakeModel(args, force, cwd);
		break;

	default:
		console.log(`
\x1b[1mBifröst CLI\x1b[0m

Verfügbare Befehle:

  \x1b[36mbifrost init\x1b[0m                         Projekt-Grundgerüst anlegen
  \x1b[36mbifrost init --force\x1b[0m                 Vorhandene Dateien überschreiben

  \x1b[36mbifrost flags\x1b[0m                        flags.css mit 30 Standard-Flaggen generieren
  \x1b[36mbifrost flags --codes de,en,fr,es\x1b[0m   Nur gewählte ISO-Ländercodes
  \x1b[36mbifrost flags --out public/css/flags.css\x1b[0m  Ausgabepfad überschreiben

  \x1b[36mbifrost make:controller <Name>\x1b[0m       Controller generieren (Optionen: --service, --model)
  \x1b[36mbifrost make:form <Name>\x1b[0m             Form-Klasse in mvc/forms generieren
  \x1b[36mbifrost make:view <Name>\x1b[0m             View-Template in mvc/views generieren
  \x1b[36mbifrost make:service <Name>\x1b[0m          Service-Klasse in mvc/services generieren
  \x1b[36mbifrost make:model <Name>\x1b[0m            Model-Klasse in mvc/models generieren
`);
}
