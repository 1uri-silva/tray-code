const { resolve, basename } = require('path');
const { spawn } = require('child_process');

const { app, Tray, Menu, dialog } = require('electron');
const Store = require('electron-store');

const schema = {
	projects: {
		type: 'string',
	},
};

const store = new Store({ schema });

let mainTray = {};

function renderMenu(tray = mainTray) {
	const data = store.get('path');
	const dataParsed = data ? JSON.parse(data) : [];

	const items = dataParsed.map(({ name, path }) => ({
		label: name,
		submenu: [
			{
				label: 'open',
				click: () =>
					spawn('code', [path], {
						shell: true,
						stdio: 'inherit',
					}),
			},
			// { type: 'separator' },
			// {
			// 	label: 'remove',
			// 	click: () => {
			// 		store.set(
			// 			'projects',
			// 			JSON.stringify(dataParsed.filter((item) => item.path !== path))
			// 		);
			// 		console.log(renderMenu());
			// 	},
			// },
		],
	}));

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'new project',
			click: () => {
				dialog
					.showOpenDialog({ properties: ['openDirectory'] })
					.then(({ canceled, filePaths }) => {
						if (!filePaths) return;

						const [path] = filePaths;
						const name = basename(path);

						!canceled
							? store.set(
									'path',
									JSON.stringify([
										...dataParsed,
										{
											path,
											name,
										},
									])
							  )
							: null;
					});
				// console.log(renderMenu());
			},
		},
		{ type: 'separator' },
		...items,
		{ type: 'separator' },
		{
			type: 'normal',
			label: 'Close tray',
			role: 'quit',
			enabled: true,
		},
	]);

	tray.setContextMenu(contextMenu);
	tray.on('click', tray.popUpContextMenu);
}

app.whenReady().then(() => {
	mainTray = new Tray(resolve(__dirname, '.', 'assets', 'vs-code.png'));

	renderMenu(mainTray);
});
