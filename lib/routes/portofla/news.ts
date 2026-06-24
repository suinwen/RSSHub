import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/news',
    name: 'News Releases',
    maintainers: ['suinwen'],
    example: '/portofla/news',
    categories: ['new-media'],
    view: ViewType.Articles,

    handler: async () => {
        const html = await ofetch(
            'https://portoflosangeles.org/news/news-release-archive'
        );

        const $ = load(html);

        const links = $('a')
            .toArray()
            .map((el) => {
                const title = $(el).text().trim();
                const href = $(el).attr('href');

                if (
                    href &&
                    href.includes('/references/') &&
                    title.length > 10
                ) {
                    return {
                        title,
                        link: href.startsWith('http')
                            ? href
                            : `https://www.portoflosangeles.org${href}`,
                    };
                }

                return null;
            })
            .filter(Boolean);

        const item = await Promise.all(
            links.map(async (entry: any) => {
                const articleHtml = await ofetch(entry.link);

                const article = load(articleHtml);

                const content = article('div.clearfix').clone();

                // 删除正文中的标题
                content.find('h1').remove();

                // 删除空白元素
                content.find('.lead').remove();
                content.find('.clear').remove();

                const description = content.html() ?? '';

                return {
                    title: entry.title,
                    link: entry.link,
                    description,
                };
            })
        );

        return {
            title: 'Port of Los Angeles News',
            link: 'https://www.portoflosangeles.org',
            item,
        };
    },
};
