const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const apiUrl = 'https://content.govdelivery.com/accounts/USDHSCBP/widgets/USDHSCBP_WIDGET_2.json';

    const response = await got.get(apiUrl);
    const items = response.data;

    const result = await Promise.all(
        items.map(async (item) => {
            const link = item.href.replace(/\?wgt_ref=.*$/, '');
            let description = item.subject;

            // 尝试抓取详细内容
            try {
                const detailResponse = await got.get(link);
                const $ = cheerio.load(detailResponse.data);
                const bulletinBody = $('.bulletin_body, .bulletin, article, .main-content').html();
                if (bulletinBody) {
                    description = bulletinBody;
                }
            } catch {
                // 抓取失败则使用标题作为内容
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

    ctx.set('data', {
        title: 'CBP CSMS - Cargo Systems Messaging Service',
        link: 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service',
        description: 'U.S. Customs and Border Protection (CBP) Cargo Systems Messaging Service - trade community updates on ACE and automated systems.',
        language: 'en',
        item: result,
    });
};
