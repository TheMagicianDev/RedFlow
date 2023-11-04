# RedFlow

Code multi level clustering execution flow system! Linked like a flow chart! To make multi-layered execution that group elements that need to run through the same resources and process. To optimize and save resources consumption.

> This is far from being any doc. Just a full dump. Of something i did 4 years ago (2019). Once i get time. Or get to re-use RedFlow. I'll make a real doc. And may update the module. I will add some examples soon enough.

## Concept and usage

The RedFlow is a cool tool or framework that allow easy setup and put in place of cluster based computation! Where you have source elements and then the elements that share the same properties! Will be clustered together and share the same process or resources!

Setup Redflow = Classify (signature) => Execute as if it was just one element. With good context api. Setup things in a natural way.

With RedFlow this is easy to be setup! And it go on multi levels! With big automation! The flow is simple to be created! Simple as if there was no clustering and no such a hassle! The idea was to make such a setup all simple fluid and right away! With as minimal as caring and setup! And as intuitive as it can be!
No hassle!

And when adding/removing new elements everything is handled automatically 

The big picture image! Is a graph of RedFlow will be created!
Many RedFlow can be created! And they will be linked! And chained! There will be parent to child relation!
At every RedFlow clustering will happens!
And when that happen Execution methods will run!
An exec for every cluster! You do whatever action!
You can use the RedFlow to call an execution at any time!

For the child RedFlow clustering will happen per each parent cluster!
And a whole graph is created! But that chaining concept!

Within a parent RedFlow execution! We call a child RedFlow execution!
When the parent execution happen! It will happen at one cluster!
That cluster is passed down to the child RedFlow!
And the execution method of that child RedFlow will run on all the cluster of that parent cluster!
So we just setup the linking and mapping! And we can have nice executor that run awesomely in an awesome flow which we call red Flow!

You gonna create a RedFlow! and set it up! It's mapping and sources! Also adding new sources (elements) will be automatically clustered and added in the graph!

## Example

```ts
export interface ICandleStreamClusterData {
    exchange: ExchangeName,
    symbol: string_symbol,
    interval: string_interval
}

export interface ICandlesStreamClusterContext {
    dataManager: DataManager
}

export type ICandlesStreamExecutors = {
    botCore: ChildRedFlowExecutor <
        string,
        IWork,
        RedFlowCluster <
            string, IWork, IBotCoreAndStrategyData, any, any, any, IBotCoreAndStrategyContext
        >
    >
}

export interface IBotCoreAndStrategyData {
    leverage: number,
    botOptions: IBotOptions,
    // settingsContext: ISettingsContext
}

export interface IBotCoreAndStrategyContext {
    botManager: BotManager,
    buySellClusterManager: BuySellClusterManager,
}


export type CandlesStreamRedFlow = RedFlow <
    string,
    IWork,
    RedFlowCluster <
        string, IWork, ICandleStreamClusterData, any, any, ICandlesStreamExecutors, ICandlesStreamClusterContext
    >
>;

export type BotCoreAndStrategyRedFlow = RedFlow <
    string,
    IWork,
    RedFlowCluster <
        string, IWork, IBotCoreAndStrategyData, any, any, any, IBotCoreAndStrategyContext
    >
>;

type OnInitBotAndBuySellCallback = (
    getBotManagerData: IGetBotManagerData,
    d: IBotCoreExecData
) => void

export class RedFlowManager {
    public rf_candlesStream!: CandlesStreamRedFlow;
    public rf_botCoreAndStrategy!: BotCoreAndStrategyRedFlow;
    private _onBotInitBotAndBuySellCallback?: OnInitBotAndBuySellCallback;

    constructor() {
        this._initRedFlows();
    }

    private _initRedFlows() {
        console.log('init red flow s:::::::::');

        const signatureBuilder = new ExtraReduceBuilder({
            objOpenSymbol: '{',
            objCloseSymbol: '}'
        }); // TODO: switch this to full if needed

        this._initCandlesStreamRedFlow();
        this._initBotCoreAndStrategyRedFlow(signatureBuilder);
        this._linkRedFlows();

        // Helper to print the RedFlow graph
        printRedFlowGraph(this.rf_candlesStream as any as RedFlow);
    }

    private _initCandlesStreamRedFlow() {
        this.rf_candlesStream = new RedFlow({
            clusteringMapper: ({
                source,
                sourcesClusterCreator,
                parentCluster
            }) => {
                const {
                    exchange,
                    interval,
                    symbol
                } = source.data;

                console.log('::::::::::::::::::::::::::::::::::::::')
                // Creation of cluster if not exist already. Seamless api. After this you can set cluster Data ...
                const { isNew, cluster } = sourcesClusterCreator.createAndOrGetCluster(
                    `${exchange}_${interval}_${symbol}`
                );

                console.log('map ===========================');
                console.log(`${exchange}_${interval}_${symbol}`);

                if (isNew) {
                    console.log('new !!!!!!!! And cluster data setting !');
                    cluster.clusterData = {
                        exchange,
                        interval,
                        symbol
                    };
                }
            },
            parentRedFlow: undefined,
            sources: []
        });

        // On source adding event handling
        this.rf_candlesStream.onSourceAdd(({
            cluster,
            isNewCluster,
            ctx
        }) => {
            // In our case we would update the context and set the DataManager
            // Only if it's a new cluster
            if (isNewCluster) {
                const {
                    exchange,
                    symbol,
                    interval
                } = cluster.clusterData!;

                console.log('candle stream > add source');
                console.log({
                    exchange,
                    symbol,
                    interval,
                    cluster
                });

                ctx.dataManager = new DataManager({
                    exchange,
                    symbol,
                    interval,
                    exchangeClientOptions: undefined
                });
            }
        });
    }

    private _initBotCoreAndStrategyRedFlow(signatureBuilder: ExtraReduceBuilder) {
        this.rf_botCoreAndStrategy = new RedFlow({
            clusteringMapper: ({
                source,
                sourcesClusterCreator,
                parentCluster
            }) => {
                // Cluster creation (classification)
                const { isNew, cluster } = sourcesClusterCreator.createAndOrGetCluster(
                    signatureBuilder.getSignature({
                        leverage: source.data.leverage,
                        botOptions: source.data.botOptions,
                        // settingsContext: source.data.settingsContext
                    })
                );

                console.log('bot core mapping > ');
                console.log('user :::::');
                console.log(source.data.userId);

                if (isNew) {
                    console.log('NEW §§§§§ - Setting cluster data');
                    // Cluster data 
                    cluster.clusterData = {
                        leverage: source.data.leverage,
                        botOptions: source.data.botOptions,
                        // settingsContext: source.data.settingsContext
                    };
                }
            },
            parentRedFlow: undefined,
            sources: []
        });

        this.rf_botCoreAndStrategy.onSourceAdd((d) => {
            console.log('bot core > add source');
            if (d.isNewCluster) {
                if (this._onBotInitBotAndBuySellCallback) {
                    console.log('on bot init bot buy sell callback !::::::::')
                    const {
                        exchange,
                        symbol,
                        interval
                    } = d.parentCluster!.clusterData; // Accessing parent cluster in the RedFlow flow structure

                    // We can access contexts of Upper Flow Clusters
                    const dataManager: DataManager = d.parentCluster!.ctx.dataManager;

                    // And use them At a second layer of clustering. Here we are taking operations. Starting RealTime feed stream. And initializing the bot .... 
                    // - A one cluster (set of people that all need the same resources)
                    // - Will all use the same feed stream and all will be managed by the same bot instance. And this is a critical optimization
                    this._onBotInitBotAndBuySellCallback(
                        {
                            exchange,
                            symbol,
                            interval,
                            leverage: d.cluster.clusterData!.leverage,
                            botOptions: d.cluster.clusterData!.botOptions,
                            dataManager
                        },
                        d
                    )

                    dataManager.startRealTimeFeedStream((candle) => {
                        this.rf_botCoreAndStrategy.execOnParentCluster(
                            d.parentCluster!,
                            (bcd) => {
                                bcd.ctx.botManager.feed(candle);
                            }
                        );
                    });
                }
            } else {
                d.cluster.ctx.buySellClusterManager.addManager(d.source);
            }
        })
    }

    public onInitBotAndBuySell(
        callback: OnInitBotAndBuySellCallback
    ) {
        this._onBotInitBotAndBuySellCallback = callback;
    }

    private _linkRedFlows() {
        // Linking the RedFlows to make a RedFlow chain. So the flow get created. Or multi-layered clustering (classification) ...
        this.rf_candlesStream.linkChild('botCore', this.rf_botCoreAndStrategy);
    }
}

```

And here a usage of source

```ts
export type IBotCoreExecData = IRedFlowExecMethodData <
    string,
    IWork,
    RedFlowCluster <
        string, IWork, ICandleStreamClusterData, any, any, any, ICandlesStreamClusterContext
    >,
    RedFlow,
    RedFlowCluster <
        string, IWork, IBotCoreAndStrategyData, any, any, any, IBotCoreAndStrategyContext
    >,
    any
>;

// Def from RedFlow file

export interface IRedFlowExecMethodData <
    ClusterIdType = any,
    SourceDataType = any,
    ClusterType extends RedFlowCluster = RedFlowCluster,
    RedFlowType extends RedFlow = RedFlow,
    ChildClusterType extends RedFlowCluster = RedFlowCluster,
    ExecutorsObjType extends IExecutorsBase = any
> {
    cluster: ChildClusterType // TODO: Write an amazing article
    parentCluster?: ClusterType,
    executors: ExecutorsObjType,
    redFlow: RedFlowType,
    ctx: ChildClusterType['ctx'] // TODO: check out and write about it
}

// BuySellClusterManager fille

export class BuySellClusterManager {
    private _exchange: ExchangeName;
    private _symbol: string_symbol;
    private _interval: string_interval;
    private _leverage: number;
    private _dataManager: DataManager;
    private _botCoreRFExecData: IBotCoreExecData; // <===
    public buySellManagers: BuySellManager[] = [];
    private _coreCtx?: Context;
    private _logger: Logger<LoggerExtendsNames>;

    constructor(options: IOptions) {
        this._exchange = options.exchange;
        this._symbol = options.symbol;
        this._interval = options.interval;
        this._leverage = options.leverage;
        this._dataManager = options.dataManager;
        this._botCoreRFExecData = options.botCoreRFExecData;
        this._coreCtx = options.coreCtx;
        this._logger = new Logger<LoggerExtendsNames>('BuySellClusterManager');

        this._logger.log('Construct: CoreCtx:');
        this._logger.log(this._coreCtx);
        this.initManagers();
    }

    public initManagers() {
        // ✨ Getting the cluster sources
        // - Sources are the object 
        const sources = this._botCoreRFExecData.cluster.clusterSources;

        this._logger.extend('initManagers')
            ('sources ::::::')
        this._logger.extend('initManagers')
            (sources);

        let source: RedFlowSource<IWork>;
        for (let i = 0; i < sources.length; i++) {
            source = sources[i];
            this.addManager(source); // ✨ Using the sources in some part of the app that is in relation and need it
        }
    }

    public addManager(source: RedFlowSource<IWork>) {
        this._logger.extend('addManager')
            ('Source: ::::');
        this._logger.extend('addManager')
            (source);

        this.buySellManagers.push(
            new BuySellManager({
                exchange: this._exchange,
                symbol: this._symbol,
                leverage: this._leverage,
                dataManager: this._dataManager,
                orderStrategy: source.data.buySellSettings.orderStrategy,
                walletSettings: source.data.buySellSettings.walletSettings,
                isIsolated: true,
                buySellCtx: this._getBuySellCTX(source), // construct something from the source data
                coreCtx: this._coreCtx
            })
        );
    }

    private _getBuySellCTX(source: RedFlowSource<IWork>): Context {
        const context = new Context();

        context.feesManager = this._coreCtx?.feesManager;
        context.stopLossManager = this._coreCtx?.stopLossManager;

        const settingsCtx = source.data.buySellSettings.context || {};
        for (const [key, value] of Object.entries(settingsCtx)) {
            context.store.set(key, value);
        }
        context.store.set('exchangeClientOptions', source.data.userApiCredential);

        return context;
    }

    public onBuy(data: OnBuyOrSellData) {
        // Looping through the different manager - one source, clust -- multiple managers or handlers for the cluster people handling
        for (let i = 0; i < this.buySellManagers.length; i++) {
            // buySellManager = this.buySellManagers[i];
            // buySellManager.onBuy(data);
            this.buySellManagers[i].processSignal({
                type: BuySellType.BUY,
                ...data
            });
        }
    }

    public onSell(data: OnBuyOrSellData) {
        for (let i = 0; i < this.buySellManagers.length; i++) {
            // buySellManager = this.buySellManagers[i];
            // buySellManager.onBuy(data);
            this.buySellManagers[i].processSignal({
                type: BuySellType.SELL,
                ...data
            })
        }
    }
```

And here how to use the Redflow to handle Natural sequential execution

```ts
export class KidoSuperLightMultiApiAgent {
    private _redFlowManager: RedFlowManager;
    private _workersSourcesByUserId: Map<string | number, RedFlowSource<IWork>>; // (id => WorkSource)
    private _events: IEvents;
    private _logger: Logger<LoggerExtendsNames>;

    constructor(options: IOptions) {
        this._redFlowManager = new RedFlowManager();
        this._redFlowManager.onInitBotAndBuySell(
            this._initBotAndBuySell.bind(this)
        );
        this._workersSourcesByUserId = new Map<string | number, RedFlowSource<IWork>>();
        this._events = options.events || {};
        this._logger = new Logger<LoggerExtendsNames>('KSLMAA');

        this._initWorks(options.works);
    }

    private _initWorks(works: IWork[]) {
        this._logger.extend('_initWorks')
            ('init works ....');

        const worksSources = sourcifyMany(works);
        this._byUserIdSourcesClassify(worksSources);

        const candlesStreamRedFlow = this._redFlowManager.rf_candlesStream;
        // Settings the sources
        candlesStreamRedFlow.sources.set(worksSources);
        // Init the flow
        candlesStreamRedFlow.initFlow();
        this._logger.extend('_initWorks')
            ('print red flow graph ::::');
        printRedFlowGraph(candlesStreamRedFlow as any as RedFlow);

        // Execute something using the RedFlow. It does execute it for every cluster.
        candlesStreamRedFlow.exec(({
            cluster,
            executors,
            ctx
        }) => {
            const {
                exchange,
                symbol,
                interval
            } = cluster.clusterData!;

            this._logger.extend('_initWorks')('candles stream red flow exec :::::');
            this._logger.extend('_initWorks')('cluster::');
            this._logger.extend('_initWorks')(cluster);
            this._logger.extend('_initWorks')('::::::::::::::::://////>');

            ctx.dataManager = new DataManager({
                exchange,
                symbol,
                interval,
                exchangeClientOptions: undefined
            });

            // _______________________________________ init the bots managers for each cluster
            this._logger.extend('_initWorks')
                ('bot core exec ini bot and buy sell :::::::::::::::: ...');

            executors.botCore.exec((d) => {
                this._logger.extend('_initWorks')
                    ('cluster :::::::');
                this._logger.extend('_initWorks')
                    (d.cluster);

                this._initBotAndBuySell(
                    {
                        exchange,
                        interval,
                        symbol,
                        leverage: d.cluster.clusterData!.leverage,
                        botOptions: d.cluster.clusterData!.botOptions,
                        dataManager: ctx.dataManager,
                    },
                    d
                )
            });

            // ________________________________________ init feed streams
            ctx.dataManager.startRealTimeFeedStream((candle) => {
                this._logger.extend('_initWorks')
                    ('FEED new candle ::::::::');
                // Executors does hold sub RedFlow Executor. For chained multi-layered clusters level execution 
                executors.botCore.exec((d) => {
                    this._logger.extend('_initWorks')
                        (`exchange: ${exchange}, symbol: ${candle.symbol}, interval: ${candle.interval}`);
                    this._logger.extend('_initWorks')
                        ('Cluster ====')
                    this._logger.extend('_initWorks')
                        (d.cluster);
                    d.ctx.botManager.feed(candle);
                });
            });
        });
    }

    private _initBotAndBuySell(
        getBotManagerData: IGetBotManagerData,
        d: IBotCoreExecData
    ) {
        d.ctx.botManager = this._getBotManager(
            getBotManagerData,
            d
        );

        this._logger.extend('_initBotAndBuySell')
            ('init bot and bs');
        this._logger.extend('_initBotAndBuySell')
            (d.cluster.ctx.botManager.getCtx());

        d.ctx.buySellClusterManager = new BuySellClusterManager({
            exchange: getBotManagerData.exchange,
            symbol: getBotManagerData.symbol,
            interval: getBotManagerData.interval,
            leverage: getBotManagerData.leverage,
            botCoreRFExecData: d,
            dataManager: getBotManagerData.dataManager,
            coreCtx: d.cluster.ctx.botManager.getCtx()
        });
    }

    private _getBotManager(
        {
            interval,
            symbol,
            leverage,
            botOptions,
            dataManager
            // TODO: add core context
        }: IGetBotManagerData,
        d: IBotCoreExecData
    ) {
        const botManager = new BotManager({
            botOptions: {
                symbol,
                interval,
                strategiesSettings: {
                    calculateSignal: {
                        strategy: botOptions.strategiesSettings.calculateSignal.strategy,
                        initData: {
                            leverage,
                            ...botOptions.strategiesSettings.calculateSignal.initData
                        }
                    },
                },
                autoFillMissedDataUsingHistoricalProvider: true,
                candleBufferSize: botOptions.candleBufferSize,
                feesOptions: botOptions.feesOptions,
                middlewaresSettings: botOptions.middlewaresSettings,
                useStopLoss: botOptions.useStopLoss,
                stopLossSettings: botOptions.stopLossSettings
            },
            dataManager,
            autoStartRealTimeFeed: false,
            ctx: this._getBotCoreCtx(botOptions)
        });

        // ________________________________________________ bind events
        const bot = botManager.getBotInstance();
        bot.on<'candleProcessed'>('candleProcessed', (data) => {
            const {
                buySellEvent,
                candle,
                candlesBuffer,
                isStopLoss
            } = data;

            this._logger.extend('candleProcessed')
                ('hi hoooooo candle process signal ...');

            if (buySellEvent !== undefined) {
                this._logger.extend('candleProcessed')
                    ('Buy sell event :::::::::');
                this._logger.extend('candleProcessed')
                    (buySellEvent);

                switch (buySellEvent) {
                    case BuySellType.BUY:
                        d.ctx.buySellClusterManager.onBuy({
                            candle,
                            candlesBuffer,
                            isStopLoss
                        });
                        break;
                    case BuySellType.SELL:
                        d.ctx.buySellClusterManager.onSell({
                            candle,
                            candlesBuffer,
                            isStopLoss
                        });
                        break;
                }
            }
        });

        return botManager;
    }

    private _getBotCoreCtx(botOptions: IBotOptions) {
        const context = new Context();
        const entries = Object.entries(botOptions.coreCtx || {});
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            context.store.set(key, value);
        }

        return context;
    }

    private _byUserIdSourcesClassify(sources: RedFlowSource<IWork>[]) {
        for (let i = 0; i < sources.length; i++) {
            this._workersSourcesByUserId.set(
                sources[i].data.userId,
                sources[i]
            );
        }
    }

    // _____________________________________________ adding removing works

    // - Adding removing sources dynamically.

    public addWorks(works: IWork[]) {
        const worksSources: RedFlowSource<IWork>[] = sourcifyMany(works);
        this._byUserIdSourcesClassify(worksSources);
        this._redFlowManager.rf_candlesStream.addSources(worksSources);
    }

    public removeWork(userId: string | number) {
        const source = this._workersSourcesByUserId.get(userId);
        if (source) {
            const detachedClusters = source.detach();
            for (const cluster of detachedClusters) {
                if (cluster.ctx.dataManager) {
                    /**
                     * if the cluster is from candlesStream RedFlow
                     * Then we stop the real time stream
                     */
                    (cluster.ctx.dataManager as DataManager).clearRealTimeStream();
                }
            }
        }
    }
}
```

> Those examples are just for demonstration. From a very old version of a certain bot. Where later on a full redesign and re-write was done. Only focus with the RedFlow part.

### All the RedFlow framework elements

#### RedFlowClustering

It's where the mapping and clustering happen at a one RedFlow level
Also is the holder of the clusters for a the given RedFlow!
you access the clustering and then the clusters if you want!

link() => used to link link parent clusters (they get passed)
And they will be add to that clustering and so to the current RedFlow!
Also the per parent cluster clustering of the sources will happen

#### SourcesClusterCreator

It get passed to the clustersMapper in the RedFlowClustering! It allow us to map and cluster the sources by an id!
An important thing we have a creator and not a return for the mapper!
In order to have good flexibility ! The creator will return an object { isNew, cluster } ! So we can decide what to append to the cluster as data when it's new! But also we can be flexible if we want to only handle that first when it's newly created! Or keeping updating it!
Or dynamically at some condition!

if (isNew) {
    cluster.data = { someData };
}

### Execution

Two ways or mod

#### Using the redFlow ref directly

redFlow.execOnCluster(cluster, execMethod) we pass the cluster explicitly!
Good too when we want to run on some other cluster if so we desire too! (even generally that's not something we want to)

#### Using the parent exec method RedFlow executor ref!

In the param which is an object! We can access the named RedFlows executors (set at linking)!
Through the property executor.
(generated at every execution! It will know automatically what parent cluster it hold! And it will allow the execution to go smoothly)

Ex:
executor.signalStrategy.exec(() => {})
executor.ctx. (for context) TODO:
So we have two ways! Either we use the executors like this directly
(executors can have some nice properties)

Or by using the redFlow reference directly! And we pass for it the cluster! That we can get from the parent executor param! At the property `parentCluster`

### RedFlow settings

### RedFlow chaining

Linking

### Clustering and mapping

SourcesClusterCreator

### Adding new sources

Add to entry cluster! Then down traversal ([parentCluster, source] couple)

### Removing sources

(may be using the id mapping)
Down Graph traversal

## Developers Reference

### RedFlow

#### sources

sources property in RedFlow is shared through all the redFlow of same graph!
So never change the reference! And in all operation mutate it!
(   TODO:
    IDEA FOR LATER! If you want to avoid that problem! We can have a Reference object (we create it)!
    We can use proxies for direct assignment! And we will be able to reassign! But keep a common ref to the same resource !!!
)

## TODO

Adding remove elements! Settings and strategies to if the cluster get removed or stay ... etc
And the management of the behavior

hooks for it! And where it matters (have good design)

Add an easy graph initiator in place of linking the RedFlow to each other! we pass an array that represent the graph [r1, [[r2, [r4, [r5]]], r3]]

TODO: add cluster context

Later add RedFlow linking unlinking After graph is initiated!
(in fact it's in already in position! You link the RedFlow then you execute on it the initFlow! It should work! Analyse it)

TODO: IMPORTANT/
Add a helper class to manage sources by id! So get id get the source!
Use it to make actions (remove) ...
