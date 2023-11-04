import { RedFlowSource } from "../../RedFlowSource";
import { RedFlowCluster } from "../RedFlowCluster";
import { SourcesClusterCreator } from "../SourcesClusterCreator";
import { RedFlow } from "../..";

export type RedFlowExecMethod = (data: any) => any

export interface IOptions <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster<ClusterIdType, SourceDataType, ParentClusterType> = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    parentCluster?: ParentClusterType,
    clusters: ClusterType[],
    redFlow: ClusterType['redFlow'],
    idsClustersMap: Map <
        ClusterIdType,
        ClusterType
    >;
}

export class RedFlowClustersNiche <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster<ClusterIdType, SourceDataType, ParentClusterType> = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster,
> {
    public parentCluster?: ParentClusterType;
    public clusters: ClusterType[];
    public nicheData: any; // TODO: either make it a generic type! Or a Map (store like) [Consider performance]
    public redFlow: ClusterType['redFlow'];
    public idsClustersMap: Map <
        ClusterIdType,
        ClusterType
    >;

    constructor(
        options: IOptions <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentClusterType
        >
    ) {
        this.clusters = options.clusters;
        this.parentCluster = options.parentCluster;
        this.redFlow = options.redFlow;
        this.idsClustersMap = options.idsClustersMap;
    }

    public addManyClusters(clusters: ClusterType[]) {
        this.clusters = this.clusters.concat(clusters);
        return this;
    }

    public addCluster(cluster: ClusterType) {
        this.clusters.push(cluster);
        return this;
    }

    public * sources(): Iterator<RedFlowSource<SourceDataType>> {
        // TODO: an iterator
        let cluster: ClusterType;
        let source: RedFlowSource<SourceDataType>;
        for (let i = 0; i < this.clusters.length; i++) {
            cluster = this.clusters[i];
            for (let j = 0; j < cluster.clusterSources.length; j++) {
                source = cluster.clusterSources[j];
                yield source;
            }
        }
    }
}
