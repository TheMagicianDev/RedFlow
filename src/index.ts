import { RedFlowSource } from "./RedFlowSource";
import { RedFlowCluster } from "./RedFlowClustering/RedFlowCluster";
import { RedFlowClustering, ClusterMapper } from "./RedFlowClustering";
import { RedFlowExecMethod } from "./RedFlowExecutor/ChildRedFlowExecutor";
import { RedFlowSourcesRef } from "./RedFlowSource/SourcesRef";
import { IExecutorsBase } from "./RedFlowExecutor/getExecutorObject";

export type RedFlowOnSourceAddMethod <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
    ChildClusterType extends RedFlowCluster = RedFlowCluster,
    ExecutorsObjType extends IExecutorsBase = any
> = (
    data: IRedFlowOnSourceAddMethodData <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        RedFlowType,
        ChildClusterType,
        ExecutorsObjType
    >
) => any
export interface IRedFlowOnSourceAddMethodData <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
    ChildClusterType extends RedFlowCluster = RedFlowCluster,
    ExecutorsObjType extends IExecutorsBase = any
> {
    cluster: ChildClusterType // TODO: check this out! Confirm it works well! Write an amazing article
    parentCluster?: ClusterType,
    executors: ExecutorsObjType,
    redFlow: RedFlowType,
    ctx: ChildClusterType['ctx'], // TODO: check out and write about it
    isNewCluster: boolean,
    source: RedFlowSource<SourceDataType>
}

export interface IOptions <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster<
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentRedFlow extends RedFlow = any,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    sources: RedFlowSource<SourceDataType>[],
    parentRedFlow: ParentRedFlow | undefined,
    clusteringMapper: ClusterMapper <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        ParentClusterType
    >;
}

export class RedFlow <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster<
        ClusterIdType,
        SourceDataType,
        any,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentRedFlowType extends RedFlow = any,
    ParentClusterType extends RedFlowCluster = RedFlowCluster,
> {
    public sources: RedFlowSourcesRef<SourceDataType>;
    public parentRedFlow?: ParentRedFlowType;
    public clustering: RedFlowClustering <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        RedFlow<ClusterIdType, SourceDataType, ClusterType>,
        ParentClusterType
    >
    public childrenRedFlows: Map<string | number, RedFlow>;
    public onSourceAddCallback?: RedFlowOnSourceAddMethod <
        ClusterIdType,
        SourceDataType,
        ParentClusterType,
        RedFlow<ClusterIdType, SourceDataType>,
        ClusterType, // Child RedFlow cluster type // TODO: check it's working nicely write about it
        ClusterType['redFlowChildrenExecutors']
    >;

    constructor(
        options: IOptions <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentRedFlowType,
            ParentClusterType
        >
    ) {
        this.sources = new RedFlowSourcesRef(options.sources || []);
        this.parentRedFlow = options.parentRedFlow;
        this.clustering = new RedFlowClustering <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            RedFlow<ClusterIdType, SourceDataType, ClusterType>,
            ParentClusterType
        >({
            clusteringMapper: options.clusteringMapper,
            redFlow: this as any
        });
        this.childrenRedFlows = new Map<string | number, RedFlow>();
    }

    /**
     * Initiate the flow graph
     * You need to link first then initiate
     */
    public initFlow() {
        if (this.sources.get().length > 0) {
            this.clustering.cluster();
            this._loopCluster(this.childrenRedFlows.values());
        }
        return this;
    }

    private _loopCluster(redFlows: RedFlow[] | Iterable<RedFlow>) {
        console.log('loop cluster =====');
        for (const redFlow of redFlows) {
            console.log('redFlow');
            console.log(redFlow);

            redFlow.cluster();

            this._loopCluster(redFlow.childrenRedFlows.values());
        }
    }

    public cluster() {
        this.clustering.cluster();
        return this;
    }

    public addSources(sources: RedFlowSource<SourceDataType>[]) {
        this.clustering.addSources(sources);
        return this;
    }

    public removeSource(source: RedFlowSource<SourceDataType>) {
        source.detach(); // TODO: add an make it return a boolean
    }

    // ______________________________________________ linking
    public linkChild<ChildRedFlowType extends RedFlow = any>(childId: string | number, child: ChildRedFlowType) {
        // TODO: If any more information add them as an object as third param
        this.childrenRedFlows.set(childId, child);
        child.sources = this.sources;
        child.parentRedFlow = this;
        // [IMPORTANT] WHEN LINKING we link the sources ref! (All share the same)
        /**
         * It should always be updated by mutation
         */
        return this;
    }

    public linkToParent<PRFT extends ParentRedFlowType = any>(childId: string | number, parent: PRFT) {
        parent.linkChild<any>(childId, this);
        return this;
    }

    // _______________________________________________ execution
    public exec(
        execCallback: RedFlowExecMethod <
            ClusterIdType,
            SourceDataType,
            ParentClusterType,
            RedFlow<ClusterIdType, SourceDataType>,
            ClusterType, // Child RedFlow cluster type // TODO: check it's working nicely write about it
            ClusterType['redFlowChildrenExecutors']
        >
    ) {
        const clusters = this.clustering.clusters;
        let cluster: ClusterType;

        for (let i = 0; i < clusters.length; i++) {
            cluster = clusters[i];

            execCallback({
                cluster,
                parentCluster: undefined,
                executors: cluster.redFlowChildrenExecutors,
                redFlow: this as any,
                ctx: cluster.ctx
            });
        }
    }

    public execOnParentCluster(
        parentCluster: ParentClusterType,
        execCallback: RedFlowExecMethod <
            ClusterIdType,
            SourceDataType,
            ParentClusterType,
            RedFlow<ClusterIdType, SourceDataType>,
            ClusterType, // Child RedFlow cluster type // TODO: check it's working nicely write about it
            ClusterType['redFlowChildrenExecutors']
        >
    ) {
        const clustersNiche = this.clustering.clustersMap.get(parentCluster);

        if (clustersNiche) {
            const clusters = clustersNiche.clusters;
            let cluster: ClusterType;

            for (let i = 0; i < clusters.length; i++) {
                cluster = clusters[i];

                execCallback({
                    cluster,
                    parentCluster,
                    executors: cluster.redFlowChildrenExecutors,
                    redFlow: this as any,
                    ctx: cluster.ctx
                });
            }
        }
    }

    public onSourceAdd(
        callback: RedFlowOnSourceAddMethod <
            ClusterIdType,
            SourceDataType,
            ParentClusterType,
            RedFlow<ClusterIdType, SourceDataType>,
            ClusterType, // Child RedFlow cluster type // TODO: check it's working nicely write about it
            ClusterType['redFlowChildrenExecutors']
        >
    ) {
        this.onSourceAddCallback = callback;
        return this;
    }


    public hasCluster(cluster: ClusterType) {
        return this.clustering.clusters.indexOf(cluster) > -1;
    }

    public getSourceCluster(source: RedFlowSource<SourceDataType>) {
        let cluster: RedFlowCluster;
        for (let i = 0; i < source.belongToClusters.length; i++) {
            cluster = source.belongToClusters[i];

            if (this.clustering.clusters.indexOf(cluster as any)) {
                return true;
            }
        }

        return false;
    }
}

/**
 * TODO:
 * add onInit hook (firstExec)
 * (See and benchmark for the method pointer check to avoid check)
 */
