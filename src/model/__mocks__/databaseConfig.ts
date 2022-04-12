import { DatabaseLocation } from '../database/databaseLocation';
import { DatabaseCredentials } from '../database/databaseCredentials';
import { Password, NfcToken, Username, Identifier, Url, Name } from 'shared-utilities';
import { DatabaseEntryProperty } from '../database/databaseEntryProperty';
import { DatabaseConfig } from '../databaseConfig';

const databaseConfigMock = jest.createMockFromModule(
    '../databaseConfig'
) as jest.Mocked<DatabaseConfig>;
databaseConfigMock.url = 'mockUrl.test:42';
databaseConfigMock.auth = {
    password: { name: 'passwordNameMock' } as DatabaseEntryProperty<Password>,
    permission: { name: 'permissionNameMock' } as DatabaseEntryProperty<string>,
    groups: {
        member: { name: 'memberNameMock' } as DatabaseEntryProperty<string>,
        default: {
            write: ['defaultWriteMock'],
            read: ['defaultReadMock']
        }
    }
};
databaseConfigMock.midware = {
    credentials: {
        name: 'midwareCredentialNameMock',
        password: 'midwareCredentialPasswordMock'
    } as any as DatabaseCredentials
};
databaseConfigMock.user = {
    location: { name: 'userLocationMock' } as DatabaseLocation,
    nfcToken: { name: 'nftTokenNameMock' } as DatabaseEntryProperty<NfcToken>,
    name: { name: 'userNameNameMock' } as DatabaseEntryProperty<Username>,
    identifier: { name: 'userIdentifierMock' } as DatabaseEntryProperty<Identifier>
};
databaseConfigMock.eventSubscriber = {
    location: { name: 'eventSubscriberLocationMock' } as DatabaseLocation,
    identifier: { name: 'eventSubscriberIdentifierMock' } as DatabaseEntryProperty<Identifier>,
    type: { name: 'typeMock' } as DatabaseEntryProperty<string>,
    event: { name: 'eventMock' } as DatabaseEntryProperty<Event>,
    endpoint: { name: 'subscriberEndpointMock' } as DatabaseEntryProperty<Url>,
    label: { name: 'labelMock' } as DatabaseEntryProperty<Name>
};
export default databaseConfigMock;
