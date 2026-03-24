import { BBController } from '../src/routing/BBController.js';

const FEATURES = [
    { name: 'Layouts',   desc: 'Wiederverwendbare Basis-Layouts mit <code>{% layout "base" %}</code>' },
    { name: 'Partials',  desc: 'Einbindbare Schnipsel mit <code>{% partial name %}</code>' },
    { name: 'Include',   desc: 'Partials mit eigenem Kontext: <code>{% include "x" with $obj %}</code>' },
    { name: 'Filter',    desc: 'Pipes: <code>{{ val | upper | truncate:80 }}</code>' },
    { name: 'if/elseif', desc: 'Volle Bedingungslogik inkl. elseif-Ketten' },
    { name: 'each',      desc: 'Schleifen über Arrays und Objekte mit <code>{% each $items %}</code>' },
    { name: 'set',       desc: 'Template-lokale Variablen mit <code>{% set $x = ... %}</code>' },
    { name: 'Components',desc: 'Named Slots via <code>{% component "name" %}</code>' },
];

export default class GaldrController extends BBController {
    static path    = '/galdr';
    static methods = ['get'];
    static menu    = [{ main: 4, lang: 'nav.galdr' }];

    title       = 'Galdr — Template-Engine';
    description = 'Galdr Template-Engine Dokumentation';

    async get() {
        await this.render('galdr', { features: FEATURES });
    }
}
