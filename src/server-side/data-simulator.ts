import { IServerSideGetRowsRequest } from 'ag-grid-community';

export interface TreeNode {
  tempId: string; // id
  parentId?: string; // 父级id
  subPartCode: string; // 零件号
  leaf: boolean; // 是否是最终子节点
  lineNum?: string; // BOM行号
  depth: number;
  children?: ResponseData;
}

export interface RequestParams {
  parentId?: string; // 当前父节点ID（空表示根节点）
  startRow: number; // 起始行索引（从0开始）
  endRow: number; // 结束行索引
}

export interface ResponseData {
  rowData: TreeNode[];
  rowCount: number; // 总数据量（用于计算滚动条）
  children?: ResponseData;
  parentId?: string;
}

const localApi = 'http://ag-grid-server.ip2fw-ms.prd.gantcloud.com/getRows';
// const mockApi = '/api/getRows';

export const mockAPI = (params: IServerSideGetRowsRequest) => {
  return fetch(localApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params),
  }).then(res => res.json());
};
