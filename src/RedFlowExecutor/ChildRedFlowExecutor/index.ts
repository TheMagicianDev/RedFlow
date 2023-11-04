import { RedFlowCluster } from '../../RedFlowClustering/RedFlowCluster';
import { RedFlow } from '../..';
import { IExecutorsBase } from '../getExecutorObject';

export type RedFlowExecMethod <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
    ChildClusterType extends RedFlowCluster = RedFlowCluster,
    ExecutorsObjType extends IExecutorsBase = any
> = (
    data: IRedFlowExecMethodData <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        RedFlowType,
        ChildClusterType,
        ExecutorsObjType
    >
) => any

export interface IRedFlowExecMethodData <
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
    ctx: ChildClusterType['ctx'] // TODO: check out and write about it
}

export interface IOptions <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
> {
    cluster: ClusterType,
    childRedFlow: RedFlowType
}

/**
 * the cluster is the cluster on where to run the execution on his clusters (parent cluster)
 * RedFlow is the child redFlow to run the execution on it's cluster
 *
 */
export class ChildRedFlowExecutor<
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
    ExecutorsObjType extends IExecutorsBase = any
> {
    public cluster: ClusterType;
    public childRedFlow: RedFlowType;

    constructor(
        options: IOptions <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            RedFlowType
        >
    ) {
        this.childRedFlow = options.childRedFlow;
        this.cluster = options.cluster;
    }

    public exec(
        callback: RedFlowExecMethod <
            ClusterIdType,
            SourceDataType,
            RedFlowType['clustering']['clusters'][0]['parentCluster'],
            RedFlowType,
            ClusterType, // Child RedFlow cluster type // TODO: check it's working nicely write about it
            ClusterType['redFlowChildrenExecutors']
        >
    ) {
        const clustersNiche = this.childRedFlow.clustering.clustersMap.get(this.cluster);
        if (clustersNiche) {
            const clusters = clustersNiche.clusters;
            let cluster: ClusterType;

            for (let i = 0; i < clusters.length; i++) {
                cluster = clusters[i] as ClusterType;

                callback({
                    cluster,
                    parentCluster: this.cluster,
                    executors: cluster.redFlowChildrenExecutors,
                    redFlow: this.childRedFlow,
                    ctx: cluster.ctx
                });
            }
        }
    }
}
