import { DatabaseEntry } from './databaseEntry';
/**
 * A {@link DatabaseEntry} has {@link DatabaseEntryProperty}
 */
export class DatabaseEntryProperty<T> {
    private _name: string;
    private _value?: T;

    constructor(name: string, value?: T) {
        this._name = name;
        this._value = value;
    }

    get name(): string {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
    }

    get value(): T | undefined {
        return this._value;
    }

    set value(value: T | undefined) {
        this._value = value;
    }
}
