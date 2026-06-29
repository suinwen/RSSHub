import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/news',
    name: 'Press Releases',
    maintainers: ['suinwen'],
    example: '/ustr/news',
    categories: ['government'],
    view: ViewType.Articles,

    handler: async () => {
        const url =
            'https://ustr.gov/about-us/policy-offices/press-office/press-releases';

        const html = await ofetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        const $ = load(html);

        const links = $('a')
            .toArray()
            .map((el) => {
                const title = $(el).text().trim();
                const href = $(el).attr('href');

                if (
                    href &&
                    href.includes('/press-releases/') &&
                    title.length > 10
                ) {
                    return {
                        title,
                        link: href.startsWith('http')
                            ? href
                            : `https://ustr.gov${href}`,
                    };
                }

                return null;
            })
            .filter(Boolean)
            .filter(
                (v, i, arr) =>
                    arr.findIndex(
                        (x) => x?.link === v?.link
                    ) === i
            )
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
                                    Referer:
                                        'https://ustr.gov/',
                                },
                            }
                        );

                        const article = load(articleHtml);

                        const content = article(
                            'article .field--name-body'
                        )
                            .first()
                            .clone();

                        content.find('script').remove();
                        content.find('style').remove();
                        content.find('noscript').remove();

                        // 修正图片地址
                        content.find('img').each((_, img) => {
                            const src = article(img).attr('src');

                            if (
                                src &&
                                src.startsWith('/')
                            ) {
                                article(img).attr(
                                    'src',
                                    `https://ustr.gov${src}`
                                );
                            }
                        });

                        const pubDate =
                            article('time')
                                .first()
                                .attr('datetime') ??
                            article(
                                '.field--name-field-date'
                            )
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
                        console.log(
                            `Skip: ${entry.link}`
                        );

                        return {
                            title: entry.title,
                            link: entry.link,
                        };
                    }
                })
            )
        ).filter(Boolean);

        return {
            title: 'USTR Press Releases',
            link: url,
            description:
                'United States Trade Representative Press Releases',
            item,
        };
    },
};
