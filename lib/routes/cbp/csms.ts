import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/csms',
    name: 'Cargo Systems Messaging Service',
    maintainers: ['suinwen'],
    example: '/cbp/csms',
    categories: ['government'],
    view: ViewType.Articles,

    handler: async () => {
        const rootUrl = 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service';
        const apiUrl = 'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2.json';

        const items = await ofetch(apiUrl);

        const limit = 30;
        const detailItems = (
            await Promise.all(
                items.slice(0, limit).map(async (item: any) => {
                    try {
                        const html = await ofetch(item.href, {
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            },
                        });

                        const $ = load(html);
                        const bodyEl = $('#bulletin_body');
                        bodyEl.find('style').remove();

                        return {
                            title: item.subject,
                            description: bodyEl.html() ?? item.subject,
                            link: item.href,
                            pubDate: parseDate(item.pub_date),
                            guid: item.href,
                        };
                    } catch (error) {
                        console.log(`Skip: ${item.href}`);

                        return {
                            title: item.subject,
                            link: item.href,
                            pubDate: parseDate(item.pub_date),
                            guid: item.href,
                        };
                    }
                })
            )
        ).filter(Boolean);

        return {
            title: 'CBP Cargo Systems Messaging Service (CSMS)',
            link: rootUrl,
            description: 'U.S. Customs and Border Protection - Cargo Systems Messaging Service',
            item: detailItems,
        };
    },
};
