import { MESSAGES } from './../../res/messages';
import { LanguageService } from './../../services/language.service';
import { errorHandling, InvalidCredentialsError, UnknownError } from './../../model/errors';
import { getMockRes, getMockReq } from '@jest-mock/express';
import { AuthenticationMidware } from './../authentication.midware';
import databaseFactoryMock from '../../database/__mocks__/databaseFactory';
import databaseConnectionMock from '../../database/__mocks__/databaseConnection';

jest.mock('../../database/databaseFactory');
jest.mock('../../model/errors');
let authenticationMidware: AuthenticationMidware;

let { res, next, clearMockRes } = getMockRes();
let req = getMockReq();
beforeEach(() => {
    authenticationMidware = new AuthenticationMidware(databaseFactoryMock);
    req = getMockReq();
    clearMockRes();
});
describe('authenticate', () => {
    it('auth undefined', () => {
        authenticationMidware.authenticate(req, res, next).finally(() => {
            expect(next).not.toHaveBeenCalled();
            expect(res.set).toHaveBeenCalledWith(
                'WWW-Authenticate',
                'Basic realm="' + LanguageService.getInstance().translate(MESSAGES.LOGIN) + '"'
            );
            expect(res.sendStatus).toHaveBeenCalledWith(401);
        });
    });

    it('credentials pattern invalid', () => {
        req.headers.authorization = 'Wrong pattern';
        authenticationMidware.authenticate(req, res, next).finally(() => {
            expect(next).not.toHaveBeenCalled();
            expect(res.set).toHaveBeenCalledWith(
                'WWW-Authenticate',
                'Basic realm="' + LanguageService.getInstance().translate(MESSAGES.LOGIN) + '"'
            );
            expect(res.sendStatus).toHaveBeenCalledWith(401);
        });
    });

    it('credentials incorrect', () => {
        databaseFactoryMock.createConnection.mockRejectedValueOnce(new InvalidCredentialsError());
        req.headers.authorization = 'Basic TGVubmFydDpnZWhlaW0=';
        authenticationMidware.authenticate(req, res, next).finally(() => {
            expect(next).not.toHaveBeenCalled();
            expect(res.set).toHaveBeenCalledWith(
                'WWW-Authenticate',
                'Basic realm="' + LanguageService.getInstance().translate(MESSAGES.LOGIN) + '"'
            );
            expect(res.sendStatus).toHaveBeenCalledWith(401);
        });
    });
    it('unknown error', () => {
        let unknownError = new UnknownError();
        databaseFactoryMock.createConnection.mockRejectedValueOnce(unknownError);
        req.headers.authorization = 'Basic TGVubmFydDpnZWhlaW0=';
        authenticationMidware.authenticate(req, res, next).finally(() => {
            expect(next).not.toHaveBeenCalled();
            expect(errorHandling).toHaveBeenCalledWith(unknownError, res);
        });
    });
    it('credentials correct', () => {
        databaseFactoryMock.createConnection.mockResolvedValueOnce(databaseConnectionMock);
        req.headers.authorization = 'Basic TGVubmFydDpnZWhlaW0=';
        authenticationMidware.authenticate(req, res, next).finally(() => {
            expect(next).toHaveBeenCalled();
            expect(res.locals.databaseConnection).toBe(databaseConnectionMock);
        });
    });
});
