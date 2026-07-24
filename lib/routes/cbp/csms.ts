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

        const js = await ofetch(widgetUrl, {
            responseType: 'text',
            headers: {
                Referer: 'https://www.cbp.gov/',
                Accept: '*/*',
                'User-Agent':
                    'Mozilla/5.0',
            },
        });

        /**
         * GovDelivery 返回:
         * GDWidgets[0].update([...])
         *
         * 提取中括号内容
         */
        const start = js.indexOf(
            'GDWidgets[0].update('
        );

        if (start === -1) {
            throw new Error(
                'GovDelivery data not found'
            );
        }

        const jsonStart =
            js.indexOf('[', start);

        const jsonEnd =
            js.lastIndexOf(']');

        if (
            jsonStart === -1 ||
            jsonEnd === -1
        ) {
            throw new Error(
                'GovDelivery JSON block not found'
            );
        }

        const jsonText = js.substring(
            jsonStart,
            jsonEnd + 1
        );

        const links = JSON.parse(jsonText)
            .slice(0, 30)
            .map((item: any) => ({
                title: item.subject,
                link: item.href.split('?')[0],
                pubDate: item.pub_date,
            }));


        const item = await Promise.all(
            links.map(async (entry: any) => {
                try {
                    const html = await ofetch(
                        entry.link,
                        {
                            responseType: 'text',
                            timeout: 15000,
                            headers: {
                                'User-Agent':
                                    'Mozilla/5.0',
                            },
                        }
                    );

                    const $ = load(html);

                    const content =
                        $('#bulletin_body')
                            .clone();

                    content.find(
                        'script,style'
                    ).remove();


                    return {
                        title:
                            $('.bulletin_subject')
                                .first()
                                .text()
                                .trim() ||
                            entry.title,

                        link: entry.link,

                        pubDate:
                            $('.dateline')
                                .first()
                                .text()
                                .trim() ||
                            entry.pubDate,

                        description:
                            content.html() || '',
                    };

                } catch (e) {

                    console.log(
                        'Skip:',
                        entry.link
                    );

                    return {
                        title: entry.title,
                        link: entry.link,
                        pubDate: entry.pubDate,
                    };
                }
            })
        );


        return {
            title:
                'CBP Cargo Systems Messaging Service',

            link:
                'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',

            description:
                'Latest CBP CSMS Messages',

            item,
        };
    },
};
