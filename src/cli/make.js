import { head, error, createDir, createFile } from './utils.js';

function getMakeName(args) {
	const name = args[1];
	if (!name) {
		error('Bitte einen Namen angeben. (z. B. "User" oder "admin/Dashboard")');
		process.exit(1);
	}
	return name;
}

export async function cmdMakeController(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();

	// Erzeugt sauberes PascalCase (z. B. user-profile -> UserProfile)
	const className = name
		.replace(/[-_]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
		.replace(/^./, c => c.toUpperCase());

	const subDir = parts.length > 0 ? '/' + parts.join('/').toLowerCase() : '';
	const routePath = rawName.toLowerCase();

	const relDir = `mvc/controllers${subDir}`;
	const fileName = `${relDir}/${className}Controller.js`;

	const content = `import { BBController } from 'bifrost';

export default class ${className}Controller extends BBController {
\tstatic path    = '/${routePath}';
\tstatic methods = ['get'];

\tasync get() {
\t\tawait this.render('${routePath}', { title: '${className}' });
\t}
}
`;
	
	head(`Generiere Controller: ${className}Controller`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);

	if (args.includes('--service') || args.includes('-s')) {
		await cmdMakeService(args, force, cwd);
	}
	if (args.includes('--model') || args.includes('-m')) {
		await cmdMakeModel(args, force, cwd);
	}
}

export async function cmdMakeForm(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();

	// Gleiche Logik für Form-Klassen
	const className = name
		.replace(/[-_]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
		.replace(/^./, c => c.toUpperCase());

	const subDir = parts.length > 0 ? '/' + parts.join('/').toLowerCase() : '';

	const relDir = `mvc/forms${subDir}`;
	const fileName = `${relDir}/${className}Form.js`;

	const content = `import { BBForm } from 'bifrost';

export class ${className}Form extends BBForm {
\tfields() {
\t\treturn {
\t\t\tname:  { type: 'text', label: 'Name', rules: ['required'] },
\t\t\temail: { type: 'email', label: 'E-Mail', rules: ['required', 'email'] }
\t\t};
\t}
}
`;
	
	head(`Generiere Form: ${className}Form`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}

export async function cmdMakeService(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();

	const className = name
		.replace(/[-_]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
		.replace(/^./, c => c.toUpperCase());

	const subDir = parts.length > 0 ? '/' + parts.join('/').toLowerCase() : '';

	const relDir = `mvc/services${subDir}`;
	const fileName = `${relDir}/${className}Service.js`;

	const content = `export class ${className}Service {
\tconstructor() {
\t\t// Service-Initialisierung
\t}

\tasync findAll() {
\t\treturn [];
\t}
}
`;
	
	head(`Generiere Service: ${className}Service`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}

export async function cmdMakeModel(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();

	const className = name
		.replace(/[-_]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
		.replace(/^./, c => c.toUpperCase());

	const subDir = parts.length > 0 ? '/' + parts.join('/').toLowerCase() : '';

	const relDir = `mvc/models${subDir}`;
	const fileName = `${relDir}/${className}.js`;

	const content = `export class ${className} {
\tconstructor(data = {}) {
\t\tObject.assign(this, data);
\t}
}
`;
	
	head(`Generiere Model: ${className}`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}

export async function cmdMakeView(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();
	const subDir = parts.length > 0 ? '/' + parts.join('/').toLowerCase() : '';

	const relDir = `mvc/views${subDir}`;
	const fileName = `${relDir}/${name.toLowerCase()}.galdr.html`;
	const title = name.charAt(0).toUpperCase() + name.slice(1);

	const content = `{% layout "base" %}

<h1>${title}</h1>
<p>Hier entsteht die neue View.</p>

{% endlayout %}
`;
	
	head(`Generiere View: ${fileName}`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}