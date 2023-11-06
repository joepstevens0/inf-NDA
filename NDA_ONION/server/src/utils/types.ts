export type GraphDataType={
    nodes:  {data: DataNode/*, position: Position*/}[];
    edges: {data: Edge}[];
}

export type DataNode={
    id: string;
    label: string;
    type: string;
}

export type Edge={
    source: string;
    target: string;
    label: string;
}

export type Position = {
    x: number;
    y: number;
}
