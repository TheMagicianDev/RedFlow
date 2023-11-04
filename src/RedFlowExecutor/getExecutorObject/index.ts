import { RedFlow } from "../..";
import { ChildRedFlowExecutor } from "../ChildRedFlowExecutor";

export type IExecutorsBase = {
    [childRedFlowId in number | string]: ChildRedFlowExecutor
}

export interface IGetExecutorsObjData <
    RedFlowType extends RedFlow = RedFlow,
    ExecutorsObjType extends {} = any
> {
    redFlow: RedFlowType,
    cluster: RedFlowType['clustering']['clusters'][0]['parentCluster']
}

/**
 *
 * @param data {}
 * cluster is the parent cluster of the child RedFlow (that the executors obj will provide access to)
 */
export function getExecutorsObj <
    RedFlowType extends RedFlow = RedFlow,
    ExecutorsObjType extends IExecutorsBase = IExecutorsBase
> (
    {
        redFlow,
        cluster
    }: IGetExecutorsObjData <
        RedFlowType,
        ExecutorsObjType
    >
): ExecutorsObjType {
    const executorsObj: ExecutorsObjType = {} as ExecutorsObjType;

    if (redFlow) {
        for (const [childRedFlowId, childRedFlow] of redFlow.childrenRedFlows.entries()) {
            executorsObj[childRedFlowId as any] = new ChildRedFlowExecutor({
                childRedFlow,
                cluster
            });
        }
    }

    return executorsObj;
}
