const webPush = jest.createMockFromModule('web-push') as any;

webPush.sendNotification = jest.fn(() => {
    return Promise.resolve(
        {
            statusCode: 200,
            body: "Nice Cock",
            headers: {
                "Nice": "Cock"
            }
        }
    );
});

export default webPush;