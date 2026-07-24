import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/csms',
    name: 'Cargo Systems Messaging Service',
    maintainers: ['suinwen'],
    example: '/cbp/csms',
    categories: ['government'],
    view: ViewType.Articles,

    handler: async () => {
        const url =
            'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2';

        const html = await ofetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        const $ = load(html);

        const links = $('.gdw_story')
            .toArray()
            .map((el) => {
                const a = $(el)
                    .find('.gdw_story_title a')
                    .first();

                const title = a.text().trim();
                const href = a.attr('href');

                const pubDate = $(el)
                    .find('.pub_date')
                    .text()
                    .trim();

                if (href && title) {
                    return {
                        title,
                        link: href.split('?')[0],
                        pubDate,
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
                        const articleHtml =
                            await ofetch(entry.link, {
                                timeout: 10000,
                                headers: {
                                    'User-Agent':
                                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                                },
                            });

                        const article = load(articleHtml);

                        const content = article(
                            '#bulletin_body'
                        )
                            .clone();

                        content.find('script').remove();
                        content.find('style').remove();

                        // 图片地址修正
                        content.find('img').each((_, img) => {
                            const src =
                                article(img).attr(
                                    'src'
                                );

                            if (
                                src &&
                                src.startsWith('/')
                            ) {
                                article(img).attr(
                                    'src',
                                    `https://content.govdelivery.com${src}`
                                );
                            }
                        });

                        const title =
                            article(
                                '.bulletin_subject'
                            )
                                .first()
                                .text()
                                .trim() ||
                            entry.title;

                        const date =
                            article('.dateline')
                                .first()
                                .text()
                                .trim() ||
                            entry.pubDate;

                        return {
                            title,
                            link: entry.link,
                            pubDate: date,
                            description:
                                content.html() ?? '',
                        };
                    } catch (e) {
                        console.log(
                            `Skip ${entry.link}`
                        );

                        return {
                            title: entry.title,
                            link: entry.link,
                            pubDate:
                                entry.pubDate,
                        };
                    }
                })
            )
        ).filter(Boolean);

        return {
            title:
                'CBP Cargo Systems Messaging Service',
            link:
                'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',
            description:
                'Latest CBP CSMS messages',
            item,
        };
    },
};
