import {Message} from '../model/dictionary.model';
import {Language} from '../model/language.enum';

export class LanguageService {
    private _language: Language;
    private static instance: LanguageService;

    private constructor() {
        this._language = Language.EN;
        this.language = Language.EN;
    }

    public static getInstance(): LanguageService {
        if (!LanguageService.instance) {
            LanguageService.instance = new LanguageService();
        }
        return LanguageService.instance;
    }

    set language(value: Language) {
        this._language = value;
    }

    public translate(msg: Message): string {
        return msg[this._language];
    }
}
