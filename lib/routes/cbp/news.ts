import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/news',
    name: 'Media Releases',
    maintainers: ['suinwen'],
    example: '/cbp/news',
    categories: ['government'],
    view: ViewType.Articles,

    handler: async () => {
        const url = 'https://www.cbp.gov/newsroom/media-releases/all';

        const html = await ofetch(url);

        const $ = load(html);

        const links = $('.views-row')
            .toArray()
            .map((el) => {
                const a = $(el).find('a').first();

                const title = a.text().trim();
                const href = a.attr('href');

                if (href && title.length > 5) {
                    return {
                        title,
                        link: href.startsWith('http')
                            ? href
                            : `https://www.cbp.gov${href}`,
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
                            '.field--name-body'
                        ).clone();

                        content.find('script').remove();
                        content.find('style').remove();
                        content.find('noscript').remove();

                        const pubDate =
                            article('time').attr('datetime');

                        return {
                            title: entry.title,
                            link: entry.link,
                            pubDate,
                            description: content.html() ?? '',
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
            title: 'CBP Media Releases',
            link: url,
            description:
                'Latest U.S. Customs and Border Protection media releases',
            item,
        };
    },
};
