import { RedFlowCluster } from "../RedFlowCluster";
import { RedFlowSource } from "../../RedFlowSource";
import { RedFlow } from "../..";

export interface ICreateAndOrGetClusterReturn<
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster<ClusterIdType, SourceDataType> = RedFlowCluster<ClusterIdType, SourceDataType>
> {
    isNew: boolean,
    cluster: ClusterType
}

export type OnNewClusterCallback <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
    // TODO: here and every where ! Add the ParentClusterType restriction to ClusterType
> = (data: IOnMappingAction<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>) => void

export type OnSourceToClusterMappingCallback <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> = OnNewClusterCallback <ClusterIdType, SourceDataType, ClusterType, ParentClusterType>;

export interface IOnMappingAction <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    cluster: ClusterType,
    source: RedFlowSource<SourceDataType>
}

export interface IOptions <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    > = RedFlow<ClusterIdType, SourceDataType, ClusterType>
> {
    parentCluster?: ParentClusterType,
    redFlow?: RedFlowType,
    onNewCluster?: OnNewClusterCallback<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>,
    onSourceToClusterMapping?: OnSourceToClusterMappingCallback <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentClusterType
        >
}

/**
 * A creator helper that allow us to cluster the sources by typical id type
 * (
 *      The creator will be exposed at the mapper level!
 *      Where it will be used to allow the mapping and the clustering to happens!
 * )
 *
 * idsClusterMap should not be changed! But mutated! The ref is shared with it's creator!
 * And the creator will die! And it will live!
 */
export class SourcesClusterCreator <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    > = RedFlow<ClusterIdType, SourceDataType, ClusterType>
> {
    /**
     * Ref from the creator
     */
    public idsClustersMap: Map <
        ClusterIdType,
        ClusterType
    >;
    public readonly redFlow?: RedFlowType;
    public readonly parentCluster?: ParentClusterType;
    private _onNewCluster?: OnNewClusterCallback<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>;
    private _onSourceToClusterMapping?: OnSourceToClusterMappingCallback <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        ParentClusterType
    >;
    public source?: RedFlowSource<SourceDataType>;

    constructor(
        options: IOptions <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentClusterType,
            RedFlowType
        >
    ) {
        this.parentCluster = options.parentCluster;
        this.redFlow = options.redFlow;
        this.idsClustersMap = new Map<
            ClusterIdType,
            ClusterType
        >();
        this._onNewCluster = options.onNewCluster;
        this._onSourceToClusterMapping = options.onSourceToClusterMapping;
    }

    public createAndOrGetCluster(id: ClusterIdType): ICreateAndOrGetClusterReturn <
        ClusterIdType,
        SourceDataType,
        ClusterType
    > {
        let cluster = this.idsClustersMap.get(id) as ClusterType;
        let isNew = false;

        console.log('create and or get cluster');

        if (!cluster) {
            /**
             * No cluster created yet
             */
            console.log('create cluster =====');
            console.log({
                parentCluster: this.parentCluster,
                redFlow: this.redFlow as any
            });

            cluster = new RedFlowCluster({
                parentCluster: this.parentCluster,
                redFlow: this.redFlow as any
            }) as ClusterType;

            cluster.clusteringId = id;
            this.idsClustersMap.set(id, cluster);

            if (this._onNewCluster) {
                this._onNewCluster({
                    cluster,
                    source: this.source!
                });
            }

            isNew = true;
        }

        if (this._onSourceToClusterMapping) {
            this._onSourceToClusterMapping({
                cluster,
                source: this.source!
            });
        }

        return {
            isNew,
            cluster
        };
    }

    public getClustersList() {
        return [...this.idsClustersMap.values()];
    }

    public getClustersIterator() {
        return this.idsClustersMap.values();
    }

    public getIdClusterMap() {
        return this.idsClustersMap;
    }
}

/**
 * TODO:
 * Think if we need to pass the id cluster map to the RedFlow (yes it's nice or may be not! Or we make it optional)
 */
