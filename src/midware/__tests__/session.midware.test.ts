import { SessionMidware } from '../session.midware';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { errorHandling } from '../../model/errors';

let sessionMidware: SessionMidware;
let errorCallback = jest.fn();
let req = getMockReq();
let { res, next, clearMockRes } = getMockRes();
jest.mock('../../model/errors');
beforeEach(() => {
    req = getMockReq();
    errorCallback.mockClear();
    clearMockRes();
    sessionMidware = new SessionMidware(errorCallback);
});

describe('validateSession', () => {
    it('session undefined', () => {
        sessionMidware.validateSession(req, res, next);
        expect(errorCallback).toHaveBeenCalledWith(res);
        expect(next).not.toHaveBeenCalled();
    });
    it('session date undefined', () => {
        req = getMockReq({ session: {} });
        sessionMidware.validateSession(req, res, next);
        expect(errorCallback).toHaveBeenCalledWith(res);
        expect(next).not.toHaveBeenCalled();
    });
    it('session date expired', () => {
        req = getMockReq({ session: { validUntil: 0 } });
        sessionMidware.validateSession(req, res, next);
        expect(errorCallback).toHaveBeenCalledWith(res);
        expect(next).not.toHaveBeenCalled();
    });
    it('session valid', () => {
        req = getMockReq({ session: { validUntil: Number.MAX_VALUE } });
        sessionMidware.validateSession(req, res, next);
        expect(errorCallback).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
    it('default errorHandling', () => {
        sessionMidware = new SessionMidware();
        sessionMidware.validateSession(req, res, next);
        expect(errorHandling).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
