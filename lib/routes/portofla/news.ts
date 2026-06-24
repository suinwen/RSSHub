import { Route } from '@/types';

export const route: Route = {
    path: '/news',
    name: 'Port of Los Angeles News',
    url: 'https://portoflosangeles.org',
    maintainers: ['suinwen'],
    handler: async (ctx) => {
        const response = await ctx.got(
            'https://portoflosangeles.org/news/news-release-archive'
        );

        const $ = ctx.cheerio.load(response.data);

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
