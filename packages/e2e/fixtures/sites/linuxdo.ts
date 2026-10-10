/** LINUX DO: a Discourse site, configured like every other Discourse fixture. */
import { discourseSite, type DiscourseSpec } from './discourse';

export const LINUXDO = 'https://linux.do';

export const linuxdoSpec: DiscourseSpec = {
    origin: LINUXDO,
    siteTitle: 'LINUX DO',
    topics: {
        '400001': {
            title: '[开源] 把网页转成 Markdown 的油猴脚本',
            category: '开发调优',
            pages: [
                'neo | 2026-02-01 08:00:00 UTC | #1\n\n## 功能\n\n- 一键导出\n- 批量 ZIP\n\n```js\nconsole.log("hi")\n```',
                'trinity | 2026-02-01 09:00:00 UTC | #21\n\n第二页：感谢分享 :+1:',
            ],
        },
        '400002': { title: '求助：Docker 容器无法访问外网 / DNS 问题', category: '搞七捻三', pages: ['morpheus | 2026-02-02 | #1\n\n试试 `--dns 1.1.1.1`。'] },
        '400003': { title: '三级用户专属讨论', category: '高级区', pages: [], status: 403 },
        '400004': { title: '已删除的话题', category: '搞七捻三', pages: [], status: 404 },
        // Discourse-only syntax that must not survive into the Markdown.
        '400005': {
            title: '分享一个 "Docker" 配置: 附截图',
            category: '开发调优',
            tags: ['docker', '教程'],
            author: 'morpheus',
            pages: [[
                'morpheus | 2026-02-03 10:00:00 UTC | #1',
                '',
                '截图：![screen|690x388](upload://a1B2c3.png)',
                '日志：[run.log|attachment](upload://d4E5.log) (2 KB)',
                '',
                '[details="docker-compose.yml"]',
                '```yaml',
                'services: {}',
                '```',
                '[/details]',
                '',
                'neo | 2026-02-03 11:00:00 UTC | #2',
                '',
                '[quote="morpheus, post:1, topic:400005"]',
                '截图在上面',
                '[/quote]',
                '',
                '收到 [spoiler]红色药丸[/spoiler]',
            ].join('\n')],
        },
    },
    category: { path: 'develop/4', name: '开发调优', ids: ['400001', '400002', '400003'] },
    tag: { name: 'docker', ids: ['400002'] },
    latest: ['400001', '400002', '400004'],
    search: { query: 'markdown', ids: ['400001', '400002'] },
    rich: {
        id: '400005',
        expect: [
            '截图：![screen|690x388](https://linux.do/uploads/short-url/a1B2c3.png)',
            '日志：[run.log](https://linux.do/uploads/short-url/d4E5.log) (2 KB)',
            '<details>\n<summary>docker-compose.yml</summary>\n\n```yaml\nservices: {}\n```\n\n</details>',
            '> **morpheus** [#1](https://linux.do/t/400005/1):\n>\n> 截图在上面',
            '收到 红色药丸',
        ],
    },
};

export const linuxDo = discourseSite(linuxdoSpec);
