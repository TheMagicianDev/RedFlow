import { RedFlowSource } from "../RedFlowSource";
import { RedFlowCluster } from "./RedFlowCluster";
import { SourcesClusterCreator } from "./SourcesClusterCreator";
import { RedFlowClustersNiche } from "./RedFlowClustersNiche";
import { RedFlow } from "..";

export type ClusterMapper<
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> = (
        data: IClusterMapperDataClusterMapper<
                ClusterIdType,
                SourceDataType,
                ClusterType,
                ParentClusterType
            >
    ) => void;

export interface IClusterMapperDataClusterMapper <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    sourcesClusterCreator: SourcesClusterCreator<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>,
    source: RedFlowSource<SourceDataType>,
    parentCluster?: ParentClusterType
}

export interface IClusterSourcesData <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    sourcesClusterCreator: SourcesClusterCreator<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>,
    sources: RedFlowSource<SourceDataType>[],
    parentCluster?: ParentClusterType
}

export interface IOptions<
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    RedFlowType extends RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    > = RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    >,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    redFlow: RedFlowType,
    clusteringMapper: ClusterMapper<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>,
    parentClusters?: ParentClusterType[],
}

/**
 * The clustering component !
 * The ClusterIdType generally is a cluster! And come from the parent RedFlow
 *
 * @property clustersMap {Map<ParentClusterType, ClusterType>}
 * Hold the parent cluster to current redFlow clusters mapping
 * (a parent cluster will map to the many of the current red flow clusters through clustering (mapping the sources))
 * If the parent cluster as an info doesn't enter into the mapping then all the parent
 *  clusters will map to the same clustering in the current red Flow level! But each will have there own clusters!
 *
 * Which will make the whole red flow set of cluster! Each cluster know his parent
 *
 */
export class RedFlowClustering <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster <
        ClusterIdType,
        SourceDataType,
        ParentClusterType
    > = RedFlowCluster<ClusterIdType, SourceDataType>,
    RedFlowType extends RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    > = RedFlow <
        ClusterIdType,
        SourceDataType,
        ClusterType
    >,
    ParentClusterType extends RedFlowCluster = RedFlowCluster
> {
    public redFlow: RedFlowType;
    public clusters: ClusterType[] = [];
    public clustersMap: Map <
        ParentClusterType,
        RedFlowClustersNiche<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>
    >;
    /**
     * That's get used only when the redFlow how no parent
     */
    public noParentIdsClustersMap?: Map <
        ClusterIdType,
        ClusterType
    >;

    public clusteringMapper: ClusterMapper <
        ClusterIdType,
        SourceDataType,
        ClusterType,
        ParentClusterType
    >;

    constructor(
        options: IOptions<
            ClusterIdType,
            SourceDataType,
            ClusterType,
            RedFlowType,
            ParentClusterType
        >
    ) {
        this.redFlow = options.redFlow;
        this.clusteringMapper = options.clusteringMapper;

        this.clustersMap = new Map <
            ParentClusterType,
            RedFlowClustersNiche<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>
        >();
    }


    // __________________________________________________________________________________ cluster init

    public cluster() {
        if (this.redFlow.parentRedFlow) {
            console.log('cluster with parent');
            // ____________________ Treating parentCluster one by one (For each we will go for a clustering process)
            this._cluster_withParent();
        } else {
            console.log('cluster without parent');
            this._cluster_noParent();
        }
        return this;
    }

    private _cluster_withParent() {
        const parentClusters = this.redFlow.parentRedFlow!.clustering.clusters as any as ParentClusterType[];
        console.log("parentClusters ===============");
        console.log(parentClusters);

        let parentCluster: ParentClusterType;
        let sourcesClusterCreator: SourcesClusterCreator<
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentClusterType,
            RedFlowType
        >;
        let clustersNiche: RedFlowClustersNiche<ClusterIdType, SourceDataType, ClusterType, ParentClusterType>;

        for (let i = 0; i < parentClusters.length; i++) {
            parentCluster = parentClusters[i];

            sourcesClusterCreator = new SourcesClusterCreator <
                    ClusterIdType,
                    SourceDataType,
                    ClusterType,
                    ParentClusterType,
                    RedFlowType
                >({
                    parentCluster,
                    redFlow: this.redFlow as any,
                    onNewCluster: ({
                        cluster
                    }) => {
                        clustersNiche.addCluster(cluster);
                        this.clusters.push(cluster);
                        console.log('cluster list ::::::');
                        console.log(this.clusters);
                    },
                    onSourceToClusterMapping: ({
                        cluster,
                        source
                    }) => {
                        console.log('::::::::::::::::::::onSourceToClusterMapping::::::::::::::::::::::::://>')
                        // _____________________ adding source to it's cluster
                        cluster.linkSource(source);
                        // the source is set the mapper exec, and within it the creator! And this trigger
                    }
                });

            clustersNiche = new RedFlowClustersNiche<ClusterIdType, SourceDataType, ClusterType,  ParentClusterType>({
                parentCluster,
                clusters: [],
                redFlow: this.redFlow as any,
                idsClustersMap: sourcesClusterCreator.idsClustersMap
            });

            this.clustersMap.set(parentCluster, clustersNiche);

            // ___________________ For a parentCluster we loop through the sources and clustering them by the mapper
            this.clusterSources({
                sources: parentCluster.clusterSources,
                sourcesClusterCreator,
                parentCluster
            });
        }
    }

    private _cluster_noParent() {
        console.log('cluster no parent ))))))))))))))))))))))))))))))))))>>>>');
        const sourcesClusterCreator = new SourcesClusterCreator <
                ClusterIdType,
                SourceDataType,
                ClusterType,
                ParentClusterType,
                ClusterType['redFlow']
            > ({
                parentCluster: undefined,
                redFlow: this.redFlow as any,
                onNewCluster: ({
                    cluster
                }) => {
                    this.clusters.push(cluster);
                    console.log('cluster list ::::::');
                    console.log(this.clusters);
                },
                onSourceToClusterMapping: ({
                    cluster,
                    source
                }) => {
                    // _____________________ adding source to it's cluster
                    cluster.linkSource(source);
                    // the source is set the mapper exec, and within it the creator! And this trigger
                }
            });

        this.noParentIdsClustersMap = sourcesClusterCreator.idsClustersMap;

        // ___________________ For a parentCluster we loop through the sources and clustering them by the mapper
        this.clusterSources({
            sources: this.redFlow.sources.get(),
            sourcesClusterCreator,
            parentCluster: undefined
        });
    }

    public clusterSources(
        {
            sources,
            sourcesClusterCreator,
            parentCluster
        }: IClusterSourcesData <
            ClusterIdType,
            SourceDataType,
            ClusterType,
            ParentClusterType
        >
    ) {
        let source: RedFlowSource<SourceDataType>;

        for (let j = 0; j < sources.length; j++) {
            source = sources[j];

            sourcesClusterCreator.source = source;

            this.clusteringMapper({
                source,
                sourcesClusterCreator,
                parentCluster
            });
        }
    }


    // ________________________________________________________________________________ Add sources

    public addSources(sources: RedFlowSource<SourceDataType>[]) {
        // ___________________________________ we update the redFlow Sources

        /**
         * To note that the same ref of the source is passed to all the linked RedFlow in the graph
         * Adding to it will make it available through all! It's a one ref!
         * Also we need to always make sure to not break this! We always update by mutating
         */
        if (sources.length > 1000) {
            const redFlowSources = this.redFlow.sources.get();
            sources.forEach(redFlowSources.push as any, redFlowSources);
        } else {
            this.redFlow.sources.get().push(...sources);
        }

        // ____________________________________ Starting the adding and clustering by traversing the graph!
                                             // Source a time! And Source by source
        let source: RedFlowSource<SourceDataType>;
        for (let i = 0; i < sources.length; i++) {
            source = sources[i];

            this._addSourceNoParent(
                this.redFlow as any,
                source
            );
        }
    }

    private _addSourceNoParent(
        redFlow: RedFlow,
        sourceToAdd: RedFlowSource<SourceDataType>
    ) {
        let isNew = false;
        let _cluster: RedFlowCluster;

        const sourcesClusterCreator = new SourcesClusterCreator({
            parentCluster: undefined,
            redFlow,
            onNewCluster: ({
                cluster
            }) => {
                redFlow.clustering.clusters.push(cluster);
                isNew = true;
            },
            onSourceToClusterMapping: ({
                cluster,
                source
            }) => {
                // _____________________________ adding source to it's cluster
                cluster.linkSource(source);
                // the source is set the mapper exec, and within it the creator! And this trigger
                // _________________ set cluster (this cb will run before the mapping finish)
                _cluster = cluster;
            }
        });

        // ______ set the mapping so the clustering happens on the same clusters and mapping as in init
        if (this.noParentIdsClustersMap) {
            sourcesClusterCreator.idsClustersMap = this.noParentIdsClustersMap!;
        } else {
            /**
             * if not set already we set it then
             */ // TODO: check implication (check adding new))
            this.noParentIdsClustersMap = sourcesClusterCreator.idsClustersMap as any;
        }
        sourcesClusterCreator.source = sourceToAdd;

        redFlow.clustering.clusteringMapper({
            source: sourceToAdd,
            sourcesClusterCreator,
            parentCluster: undefined
        });

        // _____________________________ on source add
        /**
         * We are making sure to run after the clustering mapper finish
         * So the cluster wil hold the associated data
         */
        if (redFlow.onSourceAddCallback) {
            redFlow.onSourceAddCallback({
                source: sourceToAdd,
                cluster: _cluster! as ClusterType,
                ctx: _cluster!.ctx,
                executors: _cluster!.redFlowChildrenExecutors,
                isNewCluster: isNew,
                redFlow,
                parentCluster: undefined
            });
        }

        isNew = false;

        // ______________________________ traverse children
        for (const childRedFlow of redFlow.childrenRedFlows.values()) {
            this._addSourceTraverse(
                childRedFlow,
                sourceToAdd,
                _cluster!
            );
        }
    }

    private _addSourceTraverse(
        redFlow: RedFlow,
        sourceToAdd: RedFlowSource<SourceDataType>,
        parentCluster: RedFlowCluster
    ) {
        let clustersNiche = redFlow.clustering.clustersMap.get(parentCluster);

        console.log('_addSourceTraverse ::::::::::')
        console.log({
            redFlow,
            parentCluster
        });

        let isNew = false;
        let _cluster: RedFlowCluster;
        // TODO: Optimize this by having one ref
        const sourcesClusterCreator = new SourcesClusterCreator({
            parentCluster,
            redFlow,
            onNewCluster: ({
                cluster
            }) => {
                clustersNiche!.addCluster(cluster);
                redFlow.clustering.clusters.push(cluster);
                isNew = true;
            },
            onSourceToClusterMapping: ({
                cluster,
                source
            }) => {
                // _____________________ adding source to it's cluster
                cluster.linkSource(source);
                // the source is set the mapper exec, and within it the creator! And this

                // _________________ set cluster (this cb will run before the mapping finish)
                _cluster = cluster;
            }
        });

        // ______________________ case no clusterNiche (new created parent cluster)
        if (!clustersNiche) {
            clustersNiche = new RedFlowClustersNiche({
                clusters: [],
                redFlow,
                parentCluster,
                idsClustersMap: sourcesClusterCreator.idsClustersMap
            });

            redFlow.clustering.clustersMap.set(parentCluster, clustersNiche);
        } else {
            // ______ set the mapping so the clustering happens on the same clusters and mapping as ini init
            sourcesClusterCreator.idsClustersMap = clustersNiche.idsClustersMap;
        }

        sourcesClusterCreator.source = sourceToAdd;

        redFlow.clustering.clusteringMapper({
            source: sourceToAdd,
            sourcesClusterCreator,
            parentCluster
        });

        // _________________________________ on source add
        /**
         * We are making sure to run after the clustering mapper finish
         * So the cluster wil hold the associated data
         */
        if (redFlow.onSourceAddCallback) {
            redFlow.onSourceAddCallback({
                source: sourceToAdd,
                cluster: _cluster! as ClusterType,
                ctx: _cluster!.ctx,
                executors: _cluster!.redFlowChildrenExecutors,
                isNewCluster: isNew,
                redFlow,
                parentCluster
            });
        }

        isNew = false;

        // _________________________________ traverse children
        for (const childRedFlow of redFlow.childrenRedFlows.values()) {
            this._addSourceTraverse(
                childRedFlow,
                sourceToAdd,
                _cluster!
            );
        }
    }

    // public removeSourceById() {
    // }
}



/**
 * TODO: We can set a parameter in the whole system for setting the clusterSources or not
 * If there is many many sources (like thousands! Having them repeat so often is not a good
 * idea! Well it all depends! Need calculus! And a cool idea is to implement optional lazy
 * loading! With in disk persistance! Or some kind of a system that allow things to work!)
 *
 * (
 *      After analysis the idea doesn't seems all nice, the cluster need it's sources so parentCluster sources get used!
 *      And we will have a graph division of the sources (every level we get more clustering)
 *      But if don't ==> we pass down the same ref of the same entry RedFlow
 *
 *      Better not do it now (analyse more) and put in place the lazy loading
 * )
 *
 */
