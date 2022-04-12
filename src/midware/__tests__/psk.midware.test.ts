import { ERROR_MESSAGES } from '../../res/error.messages';
import { LanguageService } from '../../services/language.service';
import { AuthenticationError} from '../../model/errors';
import { getMockRes, getMockReq } from '@jest-mock/express';
import { errorHandling } from '../../model/errors';
import databaseFactoryMock from '../../controller/database/__mocks__/databaseFactory';
import { DoorSingleton } from '../../model/doorSingleton.model';
import { PskMidware } from '../psk.midware';
import databaseConnectionMock from '../../controller/database/__mocks__/databaseConnection';
import doorSingletonMock from '../../model/__mocks__/doorSingleton.mock';

let pskMidware: PskMidware;

jest.mock('../../database/databaseFactory');
jest.mock('../../model/microcontroller');
jest.mock('../../model/doorSingleton.model');
jest.mock('../../model/errors');
let { res, next, clearMockRes } = getMockRes();
let req = getMockReq();
const correctPsk = 'mockPsk';
const wrongPsk = 'wrongPsk';
beforeAll(() => {
    DoorSingleton.getInstance = jest.fn().mockReturnValue(doorSingletonMock);
    //@ts-ignore
    doorSingletonMock.microcontroller.psk = correctPsk;
});
beforeEach(() => {
    jest.mock('../../database/databaseFactory').clearAllMocks();
    jest.mock('../../model/doorSingleton.model').clearAllMocks();
    jest.mock('../../model/errors').clearAllMocks();

    pskMidware = new PskMidware(databaseFactoryMock);
    req = getMockReq();
    clearMockRes();
});

describe('validatePSK', () => {
    it('psk not set', async () => {
        await pskMidware.validatePSK(req, res, next);
        expect(errorHandling).toHaveBeenCalledWith(
            new AuthenticationError(
                LanguageService.getInstance().translate(ERROR_MESSAGES.PSK_MISSING)
            ),
            res
        );
        expect(next).not.toHaveBeenCalled();
    });
    it('psk invalid', async () => {
        req.headers.psk = wrongPsk;
        await pskMidware.validatePSK(req, res, next);
        expect(errorHandling).toHaveBeenCalledWith(
            new AuthenticationError(
                LanguageService.getInstance().translate(ERROR_MESSAGES.PSK_INVALID)
            ),
            res
        );
        expect(next).not.toHaveBeenCalled();
    });
    it('database error', async () => {
        req.headers.psk = correctPsk;
        const error = new Error();
        databaseFactoryMock.createMidwareConnection.mockRejectedValueOnce(error);
        await pskMidware.validatePSK(req, res, next);
        expect(errorHandling).toHaveBeenCalledWith(error, res);
        expect(next).not.toHaveBeenCalled();
    });
    it('psk correct', async () => {
        req.headers.psk = correctPsk;
        databaseFactoryMock.createMidwareConnection.mockResolvedValueOnce(databaseConnectionMock);
        await pskMidware.validatePSK(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.locals.databaseConnection).toBe(databaseConnectionMock);
    });
});
