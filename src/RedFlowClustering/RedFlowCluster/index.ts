import { RedFlowSource } from "../../RedFlowSource";
import { RedFlow } from "../..";
import { IExecutorsBase, getExecutorsObj } from "../../RedFlowExecutor/getExecutorObject";
import { RedFlowClustersNiche } from "../RedFlowClustersNiche";

export type RedFlowExecMethod = (data: any) => any

export interface IOptions <
    ClusterIdType = any,
    SourceDataType = any,
    ParentClusterType extends RedFlowCluster = any,
    RedFlowType extends RedFlow<ClusterIdType, SourceDataType> = any,
> {
    parentCluster?: ParentClusterType
    redFlow?: RedFlowType
}

export class RedFlowCluster <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterDataType = any,
    ParentClusterType extends RedFlowCluster = any,
    RedFlowType extends RedFlow<ClusterIdType, SourceDataType> = any,
    ExecutorsObjType extends IExecutorsBase = IExecutorsBase,
    ContextType extends {} = any
> {
    public clusterData?: ClusterDataType;
    public clusterSources: RedFlowSource<SourceDataType>[] = [];
    public parentCluster?: ParentClusterType;
    public clusteringId?: ClusterIdType;
    public redFlow?: RedFlowType;
    public redFlowChildrenExecutors: ExecutorsObjType;
    public ctx: ContextType = {} as ContextType;

    constructor(
        options: IOptions <
            ClusterIdType,
            SourceDataType,
            ParentClusterType,
            RedFlowType
        >
    ) {
        this.parentCluster = options.parentCluster;
        this.redFlow = options.redFlow;
        this.redFlowChildrenExecutors = getExecutorsObj<RedFlowType, ExecutorsObjType>({
            cluster: this,
            redFlow: options.redFlow!
        });
    }

    public linkSource(source: RedFlowSource<SourceDataType>) {
        this.clusterSources.push(source);
        source.belongToClusters.push(this);
        return this;
    }

    public detach() {
        // _____________________________ detach children first (the whole bottom graph if it take place)
        this._detachChildren(); // there is recursion going on
        // _______________________________________________________ removing from the RedFlow clusters list
        let clusterIndex: number = this.redFlow!.clustering.clusters.indexOf(this);
        this.redFlow!.clustering.clusters.splice(clusterIndex, 1); // TODO: make redFlow ref mandatory

        // _______________________________________________________ remove it form the parent niche
        if (this.parentCluster) {
            const clustersNiche = this.redFlow!.clustering.clustersMap.get(this.parentCluster) as RedFlowClustersNiche;

            if (clustersNiche) {
                // ______________________________________ remove form the niche
                clusterIndex = clustersNiche.clusters.indexOf(this);
                clustersNiche.clusters.splice(clusterIndex, 1);
                // ______________________________________ remove from the ids clusters mapping
                for (const [id, cluster] of clustersNiche.idsClustersMap.entries()) {
                    if (cluster === this) {
                        clustersNiche.idsClustersMap.delete(id);
                        break;
                    }
                }
            }
        } else {
            /**
             * Not a parent
             */
            const idsClustersMap = this.redFlow!.clustering.noParentIdsClustersMap;

            if (idsClustersMap) {
                for (const [id, cluster] of idsClustersMap.entries()) {
                    if (cluster === this) {
                        idsClustersMap.delete(id);
                        break;
                    }
                }
            }
        }
        /**
         * TODO: check the reference through the whole framework! and flow! Does it get removed! Or memory leakage!
         */

         /**
          * TODO:
          * insure complete cleaning
          */
    }

    private _detachChildren() {
        for (const childRedFlow of this.redFlow!.childrenRedFlows.values()) {
            const clusterNiche = childRedFlow.clustering.clustersMap.get(this);

            if (clusterNiche) {
                let cluster: RedFlowCluster;
                for (let i = 0; i < clusterNiche.clusters.length; i++) {
                    cluster = clusterNiche.clusters[i];
                    cluster.detach();
                }

                childRedFlow.clustering.clustersMap.delete(this);
            }
        }
    }
}
