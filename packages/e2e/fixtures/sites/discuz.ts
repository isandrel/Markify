/**
 * Discuz! X stand-in shared by every Discuz! forum (恩山, 卡饭, Hostloc, …):
 * thread pages in the standard layout, rewritten (`thread-{tid}-{page}-1.html`)
 * and dynamic (`forum.php?mod=viewthread`); board lists (`forum-{fid}-1.html`,
 * `forum.php?mod=forumdisplay`) and the guide (`forum.php?mod=guide`), with
 * sticky threads; the forum's notice page for a thread a guest may not read.
 * A new Discuz! site is one `discuzSite({...})` call.
 */
import { html, page, type FakeResponse, type FakeSite } from '../types';

export interface DiscuzPostSpec { author: string; time: string; html: string; recent?: boolean }
export interface DiscuzThreadSpec {
    title: string;
    fid: string;
    views: number;
    posts: DiscuzPostSpec[];
    tags?: string[];
    /** Shown instead of the thread (a reading permission). */
    notice?: string;
}
export interface DiscuzSpec {
    origin: string;
    /** Path of the forum on its host ('' or '/forum'). */
    prefix: string;
    name: string;
    boards: Record<string, string>;
    threads: Record<string, DiscuzThreadSpec>;
    /** Board list: sticky thread ids, then normal ones. */
    board: { fid: string; sticky: string[]; ids: string[] };
    guide: string[];
    perPage: number;
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function layout(spec: DiscuzSpec, title: string, body: string): FakeResponse {
    return page(html(`${title} - ${spec.name} - Powered by Discuz!`, `<div id="wp" class="wp">${body}</div>`));
}

function threadPage(spec: DiscuzSpec, tid: string, pageNumber: number): FakeResponse {
    const thread = spec.threads[tid];
    if (!thread) return layout(spec, '提示信息', '<div id="messagetext" class="alert_error"><p>抱歉，指定的主题不存在或已被删除或正在被审核</p></div>');
    if (thread.notice) return layout(spec, '提示信息', `<div id="messagetext" class="alert_error"><p>${thread.notice}</p></div>`);
    const pages = Math.max(1, Math.ceil(thread.posts.length / spec.perPage));
    const shown = thread.posts.slice((pageNumber - 1) * spec.perPage, pageNumber * spec.perPage);
    const posts = shown.map((post, index) => {
        const floor = (pageNumber - 1) * spec.perPage + index + 1;
        const pid = `${tid}${String(floor).padStart(3, '0')}`;
        // Recent posts show "N 小时前" with the time in a title; older ones show the time itself.
        const time = post.recent ? `发表于 <span title="${post.time}">3&nbsp;小时前</span>` : `发表于 ${post.time}`;
        // The first post leaves a div unclosed, as signatures and plug-ins do.
        return `<div id="post_${pid}" ><table id="pid${pid}" class="plhin"><tr><td class="pls" rowspan="2">`
            + `<div id="favatar${pid}" class="pls favatar"><div class="pi"><div class="authi"><a href="space-uid-1.html" class="xw1">${post.author}</a></div></div></div>`
            + (floor === 1 ? `<div class="hm ptn"><span class="xg1">查看:</span> <span class="xi1">${thread.views}</span><span class="pipe">|</span><span class="xg1">回复:</span> <span class="xi1">${thread.posts.length - 1}</span></div>` : '')
            + `</td><td class="plc"><div class="pi"><strong><a href="thread-${tid}-1-1.html" id="postnum${pid}"><em>${floor}</em><sup>#</sup></a></strong>`
            + `<div class="pti"><div class="authi"><em id="authorposton${pid}">${time}</em></div></div></div>`
            + `<div class="pct"><div class="pcb"><div class="t_fsz"><table><tr><td class="t_f" id="postmessage_${pid}">${post.html}</td></tr></table>`
            + (floor === 1 ? '<div class="sign">' : '')
            + `</div></div></div></td></tr></table></div>`;
    }).join('');
    const pager = pages > 1 ? `<div class="pg"><label><input type="text" name="custompage" class="px" size="2" title="输入页码，按回车快速跳转" value="${pageNumber}" /><span title="共 ${pages} 页"> / ${pages} 页</span></label></div>` : '';
    const tags = thread.tags?.length ? `<div class="ptg mbm mtn">${thread.tags.map((tag, i) => `<a title="${tag}" href="misc.php?mod=tag&amp;id=${i}">${tag}</a>`).join(', ')}</div>` : '';
    const crumbs = `<div id="pt" class="bm cl"><div class="z"><a href="./" class="nvhm">首页</a><em>›</em><a href="forum.php">论坛</a><em>›</em>`
        + `<a href="forum-${thread.fid}-1.html">${spec.boards[thread.fid]}</a><em>›</em><a href="thread-${tid}-1-1.html">${escape(thread.title)}</a></div></div>`;
    return layout(spec, thread.title, `${crumbs}<div id="ct" class="wp cl"><div id="postlist" class="pl bm"><table><tr><td class="plc ptm pbn vwthd">`
        + `<h1 class="ts"><span id="thread_subject">${escape(thread.title)}</span></h1></td></tr></table>${tags}${pager}${posts}<div id="postlistreply" class="pl"></div></div>${pager}</div>`);
}

/** Standard board/guide rows; `lastReply` is shown with a title (recent) or as the link text. */
export function discuzRows(spec: DiscuzSpec, ids: string[], sticky = false): string {
    return ids.map((tid, index) => {
        const thread = spec.threads[tid];
        const last = thread.posts[thread.posts.length - 1];
        const lastReply = index % 2 ? `<a href="forum.php?mod=redirect&amp;tid=${tid}&amp;goto=lastpost#lastpost">${last.time.slice(0, 16)}</a>`
            : `<a href="forum.php?mod=redirect&amp;tid=${tid}&amp;goto=lastpost#lastpost"><span title="${last.time.slice(0, 16)}">3&nbsp;小时前</span></a>`;
        return `<tbody id="${sticky ? 'stickthread' : 'normalthread'}_${tid}"><tr><td class="icn"><a href="thread-${tid}-1-1.html"><img src="static/image/common/folder_new.gif" /></a></td>`
            + `<th class="new"><a href="thread-${tid}-1-1.html" class="s xst">${escape(thread.title)}</a></th>`
            + `<td class="by"><cite><a href="space-uid-1.html">${thread.posts[0].author}</a></cite><em><span>${thread.posts[0].time.slice(0, 10)}</span></em></td>`
            + `<td class="num"><a href="thread-${tid}-1-1.html" class="xi2">${thread.posts.length - 1}</a><em>${thread.views}</em></td>`
            + `<td class="by"><cite><a href="space-username-x.html">${last.author}</a></cite><em>${lastReply}</em></td></tr></tbody>`;
    }).join('');
}

function board(spec: DiscuzSpec, fid: string): FakeResponse {
    return layout(spec, spec.boards[fid], `<div id="pt" class="bm cl"><div class="z"><a href="forum-${fid}-1.html">${spec.boards[fid]}</a></div></div>`
        + `<div id="threadlist" class="tl bm bmw"><div class="bm_c"><form><table summary="forum_${fid}" id="threadlisttableid">`
        + `${discuzRows(spec, spec.board.sticky, true)}<tbody id="separatorline"><tr><td colspan="5"></td></tr></tbody>${discuzRows(spec, spec.board.ids)}</table></form></div></div>`
        + `<div id="sd"><table>${discuzRows(spec, spec.board.ids.slice(0, 1))}</table></div>`);
}

export function discuzSite(spec: DiscuzSpec): FakeSite {
    const respond = (url: URL): FakeResponse => {
        const path = url.pathname.slice(spec.prefix.length);
        const rewritten = path.match(/^\/thread-(\d+)-(\d+)-\d+\.html$/);
        if (rewritten) return threadPage(spec, rewritten[1], Number(rewritten[2]));
        const forum = path.match(/^\/forum-(\d+)-\d+\.html$/);
        if (forum && spec.boards[forum[1]]) return board(spec, forum[1]);
        if (path === '/forum.php') {
            const mod = url.searchParams.get('mod');
            if (mod === 'viewthread') return threadPage(spec, url.searchParams.get('tid') ?? '', Number(url.searchParams.get('page') ?? 1));
            if (mod === 'forumdisplay' && spec.boards[url.searchParams.get('fid') ?? '']) return board(spec, url.searchParams.get('fid')!);
            if (mod === 'guide') return layout(spec, '导读', `<div id="threadlist" class="tl bm"><table>${discuzRows(spec, spec.guide)}</table></div>`);
        }
        return page(html('404', 'not found'), 404);
    };
    return { origins: [spec.origin], respond };
}

const longReply = Array.from({ length: 4 }, (_, i) => ({ author: `user${i + 3}`, time: `2026-10-0${i + 2} 09:0${i}:00`, html: `第 ${i + 3} 楼的回复` }));

/** A rich first post: quote, code, lazy image, smilie, anti-copy filler, an attachment and its hidden pop-up. */
const richFirstPost = [
    '<i class="pstatus"> 本帖最后由 neo 于 2026-10-01 10:00 编辑 </i><br />',
    '固件下载见附件<font class="jammer">x7Q2</font>。<img src="static/image/smiley/default/smile.gif" smilieid="1" border="0" alt="" /><br />',
    '<div class="quote"><blockquote><font size="2"><font color="#999999">trinity 发表于 2026-09-30</font></font><br />原帖内容</blockquote></div><br />',
    '<div class="blockcode"><div id="code_ab1"><ol><li>nvram set a=1<br /></li><li>reboot &amp;&amp; echo &lt;ok&gt;</li></ol></div><em onclick="copycode($(\'code_ab1\'));">复制代码</em></div>',
    '<ignore_js_op><img id="aimg_9" aid="9" src="static/image/common/none.gif" zoomfile="data/attachment/forum/202610/01/shot.png" file="data/attachment/forum/202610/01/shot.png" class="zoom" />',
    '<div class="tip tip_4 aimg_tip" id="aimg_9_menu" style="position: absolute; display: none"><div class="xs0"><p><strong>shot.png</strong> <em class="xg1">(120 KB, 下载次数: 3)</em></p></div></div></ignore_js_op><br />',
    '<span class="attach"><a href="forum.php?mod=attachment&amp;aid=MTA=" target="_blank">firmware.bin</a></span>',
].join('');

export const RIGHT = 'https://www.right.com.cn';
export const rightSpec: DiscuzSpec = {
    origin: RIGHT, prefix: '/forum', name: '恩山无线论坛', perPage: 5,
    boards: { '49': '路由器交流', '182': '软件分享' },
    threads: {
        '700001': {
            title: '[固件] 小米路由器 4A 刷机教程 "OpenWrt"', fid: '49', views: 1234, tags: ['小米', 'OpenWrt'],
            posts: [{ author: 'neo', time: '2026-10-01 08:30:00', html: richFirstPost }, { author: 'trinity', time: '2026-10-01 09:00:00', html: '感谢分享' }, ...longReply.slice(0, 3),
                { author: 'morpheus', time: '2026-10-14 21:05:09', html: '第二页的回复', recent: true }, { author: 'smith', time: '2026-10-15 12:58:00', html: '最后一楼', recent: true }],
        },
        '700002': { title: '求助：路由器无法上网', fid: '49', views: 56, posts: [{ author: 'carol', time: '2026-10-02 10:00:00', html: '怎么办？' }, { author: 'dave', time: '2026-10-02 11:00:00', html: '重启试试' }] },
        '700003': { title: 'VIP 专区帖子', fid: '49', views: 9, posts: [{ author: 'erin', time: '2026-10-03 10:00:00', html: 'secret' }], notice: '抱歉，本帖要求阅读权限高于 50 才能浏览' },
        '700009': { title: '版规（置顶）', fid: '49', views: 99999, posts: [{ author: 'admin', time: '2020-01-01 00:00:00', html: '版规' }] },
    },
    board: { fid: '49', sticky: ['700009'], ids: ['700001', '700002', '700003'] },
    guide: ['700002', '700001'],
};
export const right = discuzSite(rightSpec);

export const KAFAN = 'https://bbs.kafan.cn';
export const kafanSpec: DiscuzSpec = {
    origin: KAFAN, prefix: '', name: '卡饭论坛', perPage: 10,
    boards: { '1': '卡巴斯基' },
    threads: {
        '800001': { title: '卡巴斯基版本选择问题', fid: '1', views: 179, posts: [{ author: '咖啡28576', time: '2026-10-15 08:47:44', html: '优选版和标准版有什么区别？', recent: true }, { author: 'kernel32', time: '2026-10-15 09:47:02', html: '标准版够用了', recent: true }] },
        '800002': { title: '论坛账户问题', fid: '1', views: 5, posts: [{ author: 'Tarchia', time: '2022-5-5 21:44:42', html: '账户问题请发邮件' }] },
    },
    board: { fid: '1', sticky: [], ids: ['800001', '800002'] },
    guide: ['800001'],
};
export const kafan = discuzSite(kafanSpec);
