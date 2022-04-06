import {SessionMidware} from "../session.midware";

const sessionMidwareMock = jest.createMockFromModule(
    '../session.midware'
) as jest.Mocked<SessionMidware>;

sessionMidwareMock.validateSession = jest.fn();

export default sessionMidwareMock;
