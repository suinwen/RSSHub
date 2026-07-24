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
        const widgetUrl =
            'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2/0.json';

        // 获取 GovDelivery Widget（返回的是 JS，不是 JSON）
        const js = await ofetch(widgetUrl, {
            responseType: 'text',
            headers: {
                Referer: 'https://www.cbp.gov/',
                Accept: '*/*',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            },
        });

        const match = js.match(
            /GDWidgets\[0\]\.update\(([\s\S]*?)\);/
        );

        if (!match) {
            throw new Error('Unable to parse GovDelivery Widget');
        }

        const links = JSON.parse(match[1])
            .slice(0, 30)
            .map((item: any) => ({
                title: item.subject,
                link: item.href.split('?')[0],
                pubDate: item.pub_date,
            }));

        const item = await Promise.all(
            links.map(async (entry: any) => {
                try {
                    const articleHtml = await ofetch(entry.link, {
                        responseType: 'text',
                        timeout: 10000,
                        headers: {
                            Referer: 'https://www.cbp.gov/',
                            'User-Agent':
                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
                        },
                    });

                    const article = load(articleHtml);

                    const content = article('#bulletin_body').clone();

                    content.find('script').remove();
                    content.find('style').remove();
                    content.find('noscript').remove();

                    // 修正图片路径
                    content.find('img').each((_, el) => {
                        const src = article(el).attr('src');
                        if (src && src.startsWith('/')) {
                            article(el).attr(
                                'src',
                                'https://content.govdelivery.com' + src
                            );
                        }
                    });

                    // 修正链接
                    content.find('a').each((_, el) => {
                        const href = article(el).attr('href');
                        if (href && href.startsWith('/')) {
                            article(el).attr(
                                'href',
                                'https://content.govdelivery.com' + href
                            );
                        }
                    });

                    return {
                        title:
                            article('.bulletin_subject')
                                .first()
                                .text()
                                .trim() || entry.title,

                        link: entry.link,

                        pubDate: entry.pubDate,

                        description: content.html() || '',
                    };
                } catch (e) {
                    console.log(`Skip: ${entry.link}`);

                    return {
                        title: entry.title,
                        link: entry.link,
                        pubDate: entry.pubDate,
                    };
                }
            })
        );

        return {
            title: 'CBP Cargo Systems Messaging Service',
            link: 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',
            description: 'Latest CBP CSMS Messages',
            item,
        };
    },
};
