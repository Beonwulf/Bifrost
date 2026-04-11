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
	const className = name.charAt(0).toUpperCase() + name.slice(1);
	const subDir = parts.length > 0 ? '/' + parts.join('/') : '';
	const pathName = rawName.toLowerCase();

	const relDir = `mvc/controllers${subDir}`;
	const fileName = `${relDir}/${className}Controller.js`;

	const content = `import { BBController } from 'bifrost';\n\nexport default class ${className}Controller extends BBController {\n\tstatic path    = '/${pathName}';\n\tstatic methods = ['get'];\n\n\tasync get() {\n\t\tawait this.render('${pathName}/index', { title: '${className}' });\n\t}\n}\n`;
	
	head(`Generiere Controller: ${className}Controller`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}

export async function cmdMakeForm(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();
	const className = name.charAt(0).toUpperCase() + name.slice(1);
	const subDir = parts.length > 0 ? '/' + parts.join('/') : '';

	const relDir = `mvc/forms${subDir}`;
	const fileName = `${relDir}/${className}Form.js`;

	const content = `import { BBForm } from 'bifrost';\n\nexport class ${className}Form extends BBForm {\n\tfields() {\n\t\treturn {\n\t\t\tname:  { type: 'text', label: 'Name', rules: ['required'] },\n\t\t\temail: { type: 'email', label: 'E-Mail', rules: ['required', 'email'] }\n\t\t};\n\t}\n}\n`;
	
	head(`Generiere Form: ${className}Form`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}

export async function cmdMakeView(args, force = false, cwd = process.cwd()) {
	const rawName = getMakeName(args);
	const parts = rawName.split('/');
	const name = parts.pop();
	const subDir = parts.length > 0 ? '/' + parts.join('/') : '';

	const relDir = `mvc/views${subDir}`;
	const fileName = `${relDir}/${name.toLowerCase()}.galdr.html`;

	const content = `{% layout "base" %}\n\n<h1>${name.charAt(0).toUpperCase() + name.slice(1)}</h1>\n<p>Hier entsteht die neue View.</p>\n\n{% endlayout %}\n`;
	
	head(`Generiere View: ${fileName}`);
	await createDir(relDir, cwd);
	await createFile(fileName, content, force, cwd);
}