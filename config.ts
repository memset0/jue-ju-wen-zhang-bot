import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'YAML';

const configDir = path.join(__dirname, './config.yml');
const configParser = YAML.parse;
const config = configParser(fs.readFileSync(configDir).toString());

export default {
	...config,
	query(path, defaultValue = undefined) {
		const keyList = path.split('.');
		let ctx = config;
		for (const key of keyList) {
			if (!Object.keys(ctx).includes(key)) {
				return defaultValue;
			}
			ctx = ctx[key];
		}
		return ctx;
	},
};