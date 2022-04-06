import { Url, Hash } from 'shared-utilities';

export class Microcontroller {
    private _endpoint: Url;
    private readonly _psk: Hash;
    private readonly _seed: Hash;

    public constructor(endpoint: Url, psk: Hash, seed: Hash) {
        this._endpoint = endpoint;
        this._psk = psk;
        this._seed = seed;
    }

    get endpoint(): Url {
        return this._endpoint;
    }

    set endpoint(value: Url) {
        this._endpoint = value;
    }

    get psk(): Hash {
        return this._psk;
    }

    get seed(): Hash {
        return this._seed;
    }
}
