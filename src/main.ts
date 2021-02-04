import config from '../config';
import { App, Session } from 'koishi-core';

let data = {};

export interface Sentence {
	writer: number;
	source: string;
};

export class Article {
	group: number;
	title: string;
	data: Array<Sentence>;

	back(): Sentence {
		return this.data[this.data.length - 1];
	}

	count(user: number): number {
		let rsp = 0;
		for (let i = 0; i < this.data.length; i++)
			if (this.data[i].writer == user) {
				rsp++;
			}
		return rsp;
	}

	countBack(user: number): number {
		let rsp = 0;
		for (let i = this.data.length - 1; i >= 0; i--)
			if (this.data[i].writer == user) {
				rsp++;
			} else {
				break;
			}
		return rsp;
	}

	toJSON() {
		return JSON.stringify({
			group: this.group,
			title: this.title,
			data: this.data,
		});
	}

	toMessage(): string {
		let rsp = '';
		if (this.title) {
			rsp += '《' + this.title + '》\n';
		}
		for (let i = 0; i < this.data.length; i++) {
			rsp += this.data[i].source;
		}
		if (!this.title) {
			rsp += '...';
		}
		return rsp;
	}

	constructor(groupId: number, startSentence: Sentence | null) {
		this.title = '';
		this.group = groupId;
		this.data = [];
		if (startSentence) {
			this.data.push(startSentence);
		}
	}
}

export function getArticle(groupId: number): Article | null {
	if (!data[groupId]) {
		return null;
	} else {
		return data[groupId];
	}
}

export function setArticle(groupId: number, article: Article | null): void {
	data[groupId] = article;
}

export default async function (app: App) {
	await new Promise((resolve) => {
		app.on('connect', <() => void>resolve);
	});

	app.group()
		.command('jjwz.add <sentence>', '添加绝句')
		.action(async ({ session }, sentence: string): Promise<void> => {
			sentence = session.message.slice(9);
			let article = getArticle(session.groupId);
			if (!article) {
				session.$send('纳尼，你群尚无在写绝句文章！');
				return;
			}
			if (sentence.length > config.lengthLimit) {
				session.$send('你怎么写这么长');
				return;
			}
			if (article.countBack(session.userId) >= config.comboLimit) {
				session.$send('你不能连续' + (config.comboLimit == 1 ? '' : ` ${config.comboLimit} 次`) + '添加绝句');
				return;
			}
			article.data.push({
				writer: session.userId,
				source: sentence,
			});
			session.$send(article.toMessage());
		});

	app.group()
		.command('jjwz.del', '删除绝句')
		.action(async ({ session }): Promise<void> => {
			let article = getArticle(session.groupId);
			if (!article) {
				session.$send('纳尼，你群尚无在写绝句文章！');
				return;
			}
			if (!article.countBack(session.userId)) {
				session.$send('最后一条不是你添加的绝句哦');
				return;
			}
			article.data.pop();
			session.$send(article.toMessage());
		});

	app.group()
		.command('jjwz.edit <sentence>', '修改绝句')
		.action(async ({ session }, sentence: string): Promise<void> => {
			sentence = session.message.slice(10);
			let article = getArticle(session.groupId);
			if (!article) {
				session.$send('纳尼，你群尚无在写绝句文章！');
				return;
			}
			if (sentence.length > config.lengthLimit) {
				session.$send('你怎么写这么长');
				return;
			}
			if (!article.countBack(session.userId)) {
				session.$send('最后一条不是你添加的绝句哦');
				return;
			}
			article.back().source = sentence;
			session.$send(article.toMessage());
		});

	app.group()
		.command('jjwz.new <sentence>', '新建绝句文章')
		.action(async ({ session }, sentence: string): Promise<void> => {
			sentence = session.message.slice(9);
			let article: Article | null = getArticle(session.groupId);
			if (article) {
				session.$send('绝句文章在写中哦');
				return;
			}
			article = new Article(
				session.groupId,
				sentence
					? { writer: session.userId, source: sentence }
					: null
			);
			setArticle(session.groupId, article);
			if (sentence) {
				session.$send(article.toMessage());
			}
		});

	app.group()
		.command('jjwz.end <title>', '结束绝句文章')
		.action(async ({ session }, title: string): Promise<void> => {
			let article = getArticle(session.groupId);
			if (!article) {
				session.$send('纳尼，你群尚无在写绝句文章！');
				return;
			}
			setArticle(session.groupId, null);
			article.title = title;
			console.log(article.toJSON());
			session.$send(article.toMessage());
		});
};