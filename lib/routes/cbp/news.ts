const html = await ofetch(url, {
    headers: {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
});

throw new Error(html.substring(0, 1000));
