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

        const html = await ofetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        return {
            title: 'CBP DEBUG',
            link: url,
            item: [
                {
                    title: 'debug',
                    link: url,
                    description:
                        '<pre>' +
                        html.substring(0, 3000)
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;') +
                        '</pre>',
                },
            ],
        };
    },
};
