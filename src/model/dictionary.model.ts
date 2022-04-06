import { Language } from './language.enum';

/**
 * Interface for Dictionary containing multiple messages with multiple languages
 *
 * @author Gregor Peters
 * @version 1.0
 */
export interface Dictionary {
    [message: string]: Message;
}

/**
 * Message type. Containing Messages all languages defined in {@link Language}
 *
 * @author Gregor Peters
 * @version 1.0
 */
export type Message = {
    [language in Language]: string;
};
