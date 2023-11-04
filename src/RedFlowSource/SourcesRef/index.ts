import { RedFlowSource } from "..";

export class RedFlowSourcesRef<SourceDataType = any> {
    private _sources: RedFlowSource<SourceDataType>[];

    constructor(sources: RedFlowSource<SourceDataType>[]) {
        this._sources = sources;
    }

    public set(sources: RedFlowSource<SourceDataType>[]) {
        this._sources = sources;
    }

    public get() {
        return this._sources;
    }
}