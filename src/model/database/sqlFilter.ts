import { DatabaseFilter } from './databaseFilter';
/**
 * This class represents a SQL specific filter.
 */
export class SqlFilter implements DatabaseFilter {
    private _filter: string;

    constructor(filter: string) {
        this._filter = filter;
    }

    get filter(): string {
        return this._filter;
    }

    set filter(filter: string) {
        this._filter = filter;
    }

    get(): string {
        return this._filter;
    }
}
