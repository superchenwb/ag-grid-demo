// test.ts

import { MockMethod, MockConfig } from "vite-plugin-mock";

export interface TreeNode {
  tempId: string; // id
  parentId?: string; // 父级id
  subPartCode: string; // 零件号
  leaf: boolean; // 是否是最终子节点
  lineNum?: string; // BOM行号
  depth: number;
}

interface RequestParams {
  groupKeys?: string[]; // 当前父节点ID（空表示根节点）
  startRow: number; // 起始行索引（从0开始）
  endRow: number; // 结束行索引
}

export interface ResponseData {
  rowData: TreeNode[];
  rowCount: number; // 总数据量（用于计算滚动条）
  children?: ResponseData;
  parentId?: string;
}

class TreePagingSimulator {
  private readonly dataStore = new Map<string, any[]>();

  constructor(
    private config = {
      maxDepth: 3, // 最大树深度
      childProbability: 0.3, // 子节点生成概率
      totalNodes: 1000, // 根节点总数
    }
  ) {
    // 生成数据
    this.generateFlatTree();
  }

  // 主请求函数
  getData(params: RequestParams): ResponseData {
    const { groupKeys, startRow, endRow } = params;
    console.log("getData---", groupKeys, startRow, endRow);
    const cacheKey = this.getCacheKey(groupKeys?.pop() || "root");
    // 获取当前父节点的全部数据
    const allData = this.dataStore.get(cacheKey) || [];

    // 截取请求范围数据
    const slicedData = allData.slice(startRow, endRow);
    const remaining = endRow - startRow - slicedData.length;
    let children: ResponseData | undefined = undefined;
    const childrenParentId = slicedData[0].tempId;
    // 查找子节点补足数量
    if (remaining > 0) {
      // 获取当前父节点的全部数据
      const allData = this.dataStore.get(childrenParentId) || [];
      // 截取请求范围数据
      const slicedData = allData.slice(startRow, endRow);
      if (slicedData.length) {
        children = {
          rowData: slicedData,
          rowCount: allData.length,
          parentId: childrenParentId,
        };
      }
    }
    return {
      rowData: slicedData,
      rowCount: allData.length,
      children: children, // 保持第一个节点的children引用
    };
  }

  nextId = 1;
  private readonly data: TreeNode[] = [];
  private generateFlatTree() {
    const rootNode = {
      leaf: false,
      tempId: "0",
      subPartCode: "002-01",
      depth: 0,
    };
    this.data.push(rootNode);
    this.dataStore.set("root", [rootNode]);
    // 预生成子节点映射表
    const pendingParentNodes: TreeNode[] = [rootNode];
    for (let i = 1; i < this.config.totalNodes; i++) {
      // 优先从待处理父节点中选择（确保每个非叶子节点至少有一个子节点）
      const parent =
        pendingParentNodes.length > 0
          ? pendingParentNodes.shift()!
          : this.findRandomParent();

      // 为当前父节点生成至少10个子节点
      const childCount = Math.max(
        10, // 最小10个子节点
        Math.floor(Math.random() * 20) // 随机生成10-30个子节点
      );
      for (let j = 0; j < childCount; j++) {
        const isLeaf =
          j >= 10 ? Math.random() < this.config.childProbability : false;
        const node: TreeNode = {
          tempId: `${this.nextId++}`,
          parentId: parent.tempId,
          leaf: isLeaf,
          lineNum: `BOM ${this.nextId}`,
          subPartCode: `零件 ${this.nextId}`,
          depth: parent.depth + 1,
          bomStatus: this.nextId,
          activeStatus: this.nextId,
          operationType: this.nextId,
          levelPath: this.nextId,
          quantity: this.nextId,
          countPath: this.nextId,
          subPartMeasurementUnit: this.nextId,
          subPartPartTypePartTypeName: this.nextId,
        };
        // 关键修复：如果当前节点不是叶子节点，加入待处理队列
        if (!isLeaf) {
          pendingParentNodes.push(node);
        }
        this.data.push(node);
        if (this.dataStore.has(parent.tempId)) {
          this.dataStore.get(parent.tempId)?.push(node);
        } else {
          this.dataStore.set(parent.tempId, [node]);
        }
      }
    }

    for (const item of this.data) {
      if (!item.leaf) {
        if (!this.dataStore.has(item.tempId)) {
          item.leaf = true;
        }
      }
    }
  }

  // 随机查找有效父节点
  private findRandomParent(): TreeNode {
    const maxDepth = Math.min(
      this.config.maxDepth - 1,
      Math.floor(Math.log2(this.data.length))
    );

    // 从后往前查找有效父节点
    for (let i = this.data.length - 1; i >= 0; i--) {
      const node = this.data[i];
      if (!node.leaf && node.depth <= maxDepth) {
        return node;
      }
    }
    return this.data[0]; // 默认返回根节点
  }

  private getCacheKey(parentId?: string) {
    return parentId || "root";
  }

  // 添加请求延迟
  withDelay(delayMs = 300) {
    return async (params: RequestParams) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.getData(params);
    };
  }
}

// 使用示例
const simulator = new TreePagingSimulator();
export const mockAPI = simulator.withDelay(500);

export default function (config: MockConfig) {
  return [
    {
      url: "/api/getRows",
      method: "post",
      response: (req, res) => {
        const data = simulator.getData(req.body);
        console.log("data---", data);
        return data;
      },
    },
  ];
}
