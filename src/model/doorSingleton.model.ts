import { LanguageService } from '../services/language.service';
import { Url, Hash } from 'shared-utilities';
import { ERROR_MESSAGES } from '../res/error.messages';
import { Microcontroller } from './microcontroller';

/**
 * Door singleton containing a microcontroller which has a psk to validate itself
 *
 * @author Lennart Rak, Gregor Peters
 * @version 1.0
 */
export class DoorSingleton {
    private readonly _microcontroller: Microcontroller;
    private static instance: DoorSingleton;

    private constructor(endpoint: Url, psk: Hash, seed: Hash) {
        this._microcontroller = new Microcontroller(endpoint, psk, seed);
    }

    static getInstance(endpoint?: Url, psk?: Hash, seed?: Hash): DoorSingleton {
        if (this.instance == undefined) {
            if (!endpoint || !psk || !seed) {
                throw new Error(
                    LanguageService.getInstance().translate(ERROR_MESSAGES.INIT_ARGS_MANDATORY)
                );
            }
            this.instance = new DoorSingleton(endpoint, psk, seed);
        }
        return this.instance;
    }

    get microcontroller(): Microcontroller {
        return this._microcontroller;
    }
}
