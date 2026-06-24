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
            'https://portoflosangeles.org/news/news-release-archive'
        );

        const $ = load(html);

        const item = $('a')
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
                        link: `https://portoflosangeles.org${href}`,
                    };
                }
            })
            .filter(Boolean);

        return {
            title: 'Port of Los Angeles News',
            link: 'https://portoflosangeles.org',
            item,
        };
    },
};
