import { Route } from '@/types';

import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';
import * as cheerio from 'cheerio';

export const route: Route = {
    path: '/cbp/csms',
    categories: ['government'],
    example: '/cbp/csms',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['www.cbp.gov/trade/automated/cargo-systems-messaging-service'],
        },
    ],
    name: 'CBP Cargo Systems Messaging Service',
    maintainers: ['suinwen'],
    handler,
};

async function handler() {
    const rootUrl = 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service';
    const apiUrl = 'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2.json';

    const items: { subject: string; pub_date: string; href: string }[] = await ofetch(apiUrl);

    const limit = 30;
    const detailItems = await Promise.all(
        items.slice(0, limit).map(async (item) => {
            const response = await ofetch(item.href);
            const $ = cheerio.load(response);
            const bodyEl = $('#bulletin_body');
            bodyEl.find('style').remove();
            const description = bodyEl.html() || item.subject;

            return {
                title: item.subject,
                description,
                link: item.href,
                pubDate: parseDate(item.pub_date),
                guid: item.href,
            };
        })
    );

    return {
        title: 'CBP Cargo Systems Messaging Service (CSMS)',
        link: rootUrl,
        description: 'U.S. Customs and Border Protection - Cargo Systems Messaging Service',
        language: 'en-us',
        item: detailItems,
    };
}
