import { HostName, Name, Hash, Url } from 'shared-utilities';

/**
 * Interface for our config file
 *
 * @author Lennart Rak, Gregor Peters
 * @version 1.0
 */
export interface Config {
    port: number;
    hostname: HostName;

    basePath: string;
    userPath: string;
    eventPath: string;
    cameraPath: string;
    doorPath: string;

    sessionMaxAge: number;

    whitelist: Array<string>;

    doorMicrocontroller: DoorConfig;

    rtspUrlH: Url;
    rtspUrlL: Url;

    database: string /* Oder besser Enum? */;
}

export interface DoorConfig {
    psk: {
        name: Name;
        value: Hash;
    };
    endpoint: {
        name: Name;
        value: Url;
    };
    seed: Hash;
    openPath: string;
    updateNfcTokenPath: string;
    deleteNfcTokenPath: string;
    getValidationPath: string;
}
