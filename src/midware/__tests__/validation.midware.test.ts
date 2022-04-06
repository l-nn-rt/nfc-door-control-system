import { getMockRes, getMockReq } from '@jest-mock/express';
import { Event, VideoQuality } from 'shared-utilities';
import { ValidationMidware } from '../validation.midware';

let { res, next, clearMockRes } = getMockRes();
let req = getMockReq();

beforeEach(() => {
    req = getMockReq();
    clearMockRes();
});
describe('validateEvent', () => {
    it('body empty', () => {
        ValidationMidware.validateEvent(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('type invalid', () => {
        req.body.type = 'invalid';
        ValidationMidware.validateEvent(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it.each(Object.keys(Event))('valid type %p', (type) => {
        req.body.type = type;
        ValidationMidware.validateEvent(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
describe('validateQuality', () => {
    it('body empty', () => {
        ValidationMidware.validateQuality(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('quality invalid', () => {
        req.query.quality = 'invalid';
        ValidationMidware.validateQuality(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it.each(Object.keys(VideoQuality))('valid quality %p', (quality) => {
        req.query.quality = quality;
        ValidationMidware.validateQuality(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

describe('validateEventSubscriber', () => {
    it('body empty', () => {
        ValidationMidware.validateEventSubscriber(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('valid', () => {
        req.body.endpoint = 'http://some-url.com/endpoint';
        ValidationMidware.validateEventSubscriber(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
describe('validateUserLogin', () => {
    it('body empty', () => {
        ValidationMidware.validateUserLogin(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('valid', () => {
        req.body.username = 'SoMeUserName\'"!*';
        req.body.password = 'SoMePassWord42\'"!*';
        ValidationMidware.validateUserLogin(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
describe('validateNfcToken', () => {
    it('body empty', () => {
        ValidationMidware.validateNfcToken(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('valid', () => {
        req.body.nfcToken = 'SoMeToken\'"!*';
        ValidationMidware.validateNfcToken(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

describe('validateDoorLogin', () => {
    it('body empty', () => {
        ValidationMidware.validateDoorLogin(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('valid', () => {
        req.body.url = 'http://some-url.com/endpoint';
        ValidationMidware.validateDoorLogin(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
describe('validateUsername', () => {
    it('body empty', () => {
        ValidationMidware.validateUsername(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });
    it('valid', () => {
        req.body.username = 'SoMeUserName\'"!*';
        ValidationMidware.validateUsername(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
describe('validateSubscription', () => {
    it('body empty', () => {
        ValidationMidware.validateSubscription(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('endpoint missing', () => {
        req.body.keys = { auth: 'someAuth', p256dh: 'something' };
        ValidationMidware.validateSubscription(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('auth missing', () => {
        req.body.endpoint = 'http://some-url.com/endpoint';
        req.body.keys = { p256dh: 'something' };
        ValidationMidware.validateSubscription(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('p256dh missing', () => {
        req.body.endpoint = 'http://some-url.com/endpoint';
        req.body.keys = { auth: 'something' };
        ValidationMidware.validateSubscription(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(490);
    });

    it('valid', () => {
        req.body.endpoint = 'http://some-url.com/endpoint';
        req.body.keys = { auth: 'someAuth', p256dh: 'something' };
        req.body.endpoint = 'http://some-url.com/endpoint';
        ValidationMidware.validateSubscription(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
