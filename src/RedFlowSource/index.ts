import { RedFlowCluster } from "../RedFlowClustering/RedFlowCluster";
import { RedFlow } from "..";

export interface IOptions<SourceDataType = any> {
    data: SourceDataType
}

export class RedFlowSource<SourceDataType = any> {
    public data: SourceDataType;
    public belongToClusters: RedFlowCluster[] = [];

    constructor(options: IOptions) {
        this.data = options.data;
    }

    public linkCluster(cluster: RedFlowCluster) {
        this.belongToClusters.push(cluster);
        cluster.clusterSources.push(this);
        return this;
    }

    public detach() { // TODO: memory leak (ref garbage collection! Ref release)
        let cluster: RedFlowCluster;
        const clusters = this.belongToClusters;
        const detachedClusters: RedFlowCluster[] = [];

        if (clusters.length > 0) {
            // __________________________________ remove from the redFlows sources ref
            const redFlowsSources = (clusters[0].redFlow as RedFlow).sources.get();
            let sourceIndex = redFlowsSources.indexOf(this);
            if (sourceIndex > -1) {
                redFlowsSources.splice(
                    sourceIndex,
                    1
                );
            }

            // __________________________________ remove from cluster (and cluster detach if necessary)
            for (let i = 0; i < clusters.length; i++) {
                cluster = clusters[i];

                sourceIndex = cluster.clusterSources.indexOf(this);
                if (sourceIndex > -1) {
                    cluster.clusterSources.splice(sourceIndex, 1);
                    if (cluster.clusterSources.length === 0) {
                        detachedClusters.push(cluster);
                        cluster.detach();
                    }
                }
            }
        }

        return detachedClusters;
    }
}

export function sourcifyMany<SourceDataType = any>(sources: SourceDataType[]) {
    return sources.map((source) => {
        return new RedFlowSource<SourceDataType>({
            data: source
        }); // TODO: see about more sources later
    });
}
