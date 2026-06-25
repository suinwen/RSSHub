import { load } from 'cheerio';

import type { Route } from '@/types';
import { ViewType } from '@/types';
import ofetch from '@/utils/ofetch';

export const route: Route = {
    path: '/news',
    name: 'CBP',
    maintainers: ['suinwen'],
    example: '/cbp/news',
    categories: ['government'],
    view: ViewType.Articles,

    handler: async () => {
        const url = 'https://www.cbp.gov/newsroom/media-releases/all';

        const html = await ofetch(url);

        const $ = load(html);

        return {
            title: 'CBP',
            link: url,
            item: [],
        };
    },
};
