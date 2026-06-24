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
            'https://www.portoflosangeles.org/news/news-release-archive'
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
            .filter(Boolean)
            .slice(0, 30);

        const item = (
            await Promise.all(
                links.map(async (entry: any) => {
                    try {
                        const articleHtml = await ofetch(entry.link, {
                            timeout: 10000,
                        });

                        const article = load(articleHtml);

                        const content = article(
                            '#section-about .clearfix'
                        ).clone();

                        // 删除重复标题
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
                    } catch (error) {
                        console.log(`Skip: ${entry.link}`);

                        return {
                            title: entry.title,
                            link: entry.link,
                        };
                    }
                })
            )
        ).filter(Boolean);

        return {
            title: 'Port of Los Angeles News',
            link: 'https://www.portoflosangeles.org',
            description:
                'Latest news releases from the Port of Los Angeles',
            item,
        };
    },
};
