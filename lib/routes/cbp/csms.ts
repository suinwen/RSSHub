import { load } from 'cheerio';

import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/cbp/csms',
    categories: ['government'],
    example: '/gov/cbp/csms',
    parameters: undefined,
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
            target: '/cbp/csms',
        },
    ],
    name: 'CBP Cargo Systems Messaging Service',
    maintainers: ['suinwen'],
    handler,
    url: 'www.cbp.gov/trade/automated/cargo-systems-messaging-service',
    description: 'U.S. Customs and Border Protection CSMS - trade community updates on ACE and automated systems.',
};

interface CsmsItem {
    subject: string;
    pub_date: string;
    href: string;
}

async function handler() {
    const apiUrl = 'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2.json';

    const items: CsmsItem[] = await ofetch(apiUrl);

    const result = await Promise.all(
        items.slice(0, 15).map(async (item) => {
            const link = item.href.replace(/\?wgt_ref=.*$/, '');
            let description = item.subject;

            try {
                const response = await ofetch(link);
                const $ = load(response);
                const bulletinBody = $('.bulletin_body').html();
                if (bulletinBody) {
                    description = bulletinBody;
                }
            } catch {
                // detail fetch failed, use subject as description
            }

            return {
                title: item.subject,
                description,
                link,
                pubDate: parseDate(item.pub_date),
                author: 'CBP CSMS',
            };
        })
    );

    return {
        title: 'CBP CSMS - Cargo Systems Messaging Service',
        link: 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',
        description: 'U.S. Customs and Border Protection (CBP) Cargo Systems Messaging Service - trade community updates on ACE and automated systems.',
        language: 'en',
        item: result,
    };
}
