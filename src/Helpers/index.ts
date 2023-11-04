import { RedFlowSource } from "../RedFlowSource";
import { RedFlow } from "..";
import { RedFlowCluster } from "../RedFlowClustering/RedFlowCluster";

export function sourcifyCollection<SourceDataType = any>(sources: SourceDataType[]) {
    return sources.map(
        (source) =>
            new RedFlowSource<SourceDataType>({
                data: source
            })
    );
}


export function printRedFlowGraph(
    redFlow: RedFlow,
    printStr: string = '',
    level: number = 1
) {
    console.log('level ' + level + ' :');
    console.log('==================================');

    printStr += 'level ' + level + ' :\n';
    printStr += '==================================\n';
    printStr += '\n';

    if (!redFlow.parentRedFlow) {
        const clusters = redFlow.clustering.clusters;
        let cluster: RedFlowCluster;
        for (let i = 0; i < clusters.length; i++) {
            cluster = clusters[i];
            console.log(clusters);
        }
    } else {
        /**
         * There is parent
         */
        for (const [parentCluster, clustersNiche] of redFlow.clustering.clustersMap.entries()) {
            console.log('parentCluster ==');
            console.log(parentCluster);
            console.log('Clusters niche');
            console.dir(clustersNiche);
        }
    }
    level++;
    console.log('children ====>');
    let childNum = 1;
    for (const child of redFlow.childrenRedFlows.values()) {
        console.log('child ' + childNum + ' :');
        printRedFlowGraph(
            child,
            printStr,
            level
        );
        childNum++;
    }
}
