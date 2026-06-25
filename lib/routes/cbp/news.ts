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
        const url =
            'https://www.cbp.gov/newsroom/media-releases/all';

        const html = await ofetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        const $ = load(html);

        const links = $('li.usa-collection__item')
            .toArray()
            .map((el) => {
                const a = $(el)
                    .find('.usa-collection__heading a')
                    .first();

                const title = a.text().trim();
                const href = a.attr('href');

                if (href && title) {
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
                        const articleHtml = await ofetch(
                            entry.link,
                            {
                                timeout: 10000,
                                headers: {
                                    'User-Agent':
                                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                                },
                            }
                        );

                        const article = load(articleHtml);

                        const content = article(
                            '.field--name-body'
                        ).clone();

                        const intro = article(
                            '.field--name-field-page-header'
                        ).html();

                        if (intro) {
                            content.prepend(intro);
                        }

                        content.find('script').remove();
                        content.find('style').remove();
                        content.find('noscript').remove();

                        const pubDate = article(
                            '.field--name-field-date-release .field__item'
                        )
                            .first()
                            .text()
                            .trim();

                        return {
                            title: entry.title,
                            link: entry.link,
                            pubDate,
                            description:
                                content.html() ?? '',
                        };
                    } catch (error) {
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
