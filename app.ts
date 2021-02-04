import { App } from 'koishi';

import config from './config';
import plugin from './src/main';

(async function () {
	require('koishi-adapter-cqhttp');
	const app = new App(config.server);
	const bot = app.bots.find(bot => bot);
	app.plugin(plugin);

	await app.start();
})();