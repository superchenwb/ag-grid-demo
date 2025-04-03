"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    GridApi,
    GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ModuleRegistry,
  ValidationModule,
} from "ag-grid-community";
import {
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
  TreeDataModule,
  RowApiModule,
} from "ag-grid-enterprise";
import { mockAPI, ResponseData, TreeNode } from "./data-simulator";
ModuleRegistry.registerModules([
  ColumnsToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  TreeDataModule,
  RowApiModule,
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
  ValidationModule /* Development Only */,
]);

const deepApply = (params: IServerSideGetRowsParams, result: ResponseData) => {
  const request = params.request;
  result?.rowData?.forEach((item: TreeNode) => {
    const children = item.children;
    item.children = null;
    if (children && item.tempId) {
      const _route = [...request.groupKeys, item.tempId];
      params.api.applyServerSideRowData({
        route: _route,
        successParams: children,
      });
      deepApply(params, children);
    }
  });
};

const createServerSideDatasource = () => {
  const dataSource: IServerSideDatasource = {
    getRows: async (params) => {
      const request = params.request;
      // console.log('ServerSideDatasource.getRows: params = ', request);

      const result: ResponseData = await mockAPI(request);
      // console.log('result ', request.groupKeys, result);
      // 查看loading效果
      // if (request.groupKeys.length > 2) {
      //   return
      // }
      params.success(result);

      // 如果有额外的子级数据，则直接填充进来
      deepApply(params, result);
    },
  };
  return dataSource;
};

export const GridExample = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const [columns] = useState([
    { field: "id", hide: true },
    // { field: 'text', headerName: '编辑字段', editable: true, cellEditor: 'agTextCellEditor' },
    { field: "lineNum", headerName: "BOM行标识" },
    { field: "bomStatus", headerName: "BOM状态" },
    { field: "activeStatus", headerName: "生效状态" },
    { field: "operationType", headerName: "操作" },
    { field: "levelPath", headerName: "层级" },
    { field: "subPartMaterialName", headerName: "零件名称" },
    { field: "magnificationTimes", headerName: "放大倍数" },
    { field: "quantityRange", headerName: "用量范围(%)" },
    { field: "quantityFormula", headerName: "用量" },
    { field: "countPath", headerName: "合计用量" },
    { field: "subPartMeasurementUnit", headerName: "计量单位" },
    { field: "partTypeName", headerName: "零件类型" },
    { field: "subPart.ecuType.ecuTypeCode", headerName: "控制器类型" },
    { field: "devType", headerName: "开发策略" },
    { field: "suggestSourcing", headerName: "建议来源" },
    {
      field: "baseVppsColumn",
      headerName: "装配位置",
      children: [
        { field: "vppsCode", headerName: "结构编码" },
        { field: "vsgCode", headerName: "结构简码" },
        { field: "fpcCode", headerName: "位置码" },
        { field: "zhDesc", headerName: "中文描述" },
        { field: "enDesc", headerName: "英文描述" },
      ],
    },
    { field: "newUsageValue", headerName: "使用规则" },
    { field: "newUsageDesc", headerName: "规则描述" },
    { field: "weightTag", headerName: "重量标记" },
    { field: "costTag", headerName: "成本标记" },
    { field: "assemblyDesc", headerName: "使用备注" },
    { field: "changeCode", headerName: "变更单编号" },
    { field: "effectiveFrom", headerName: "生效日期起" },
    { field: "effectiveTo", headerName: "生效日期止" },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      minWidth: 120,
      flex: 1,
      sortable: false,
    };
  }, []);
  const autoGroupColumnDef = useMemo(() => {
    return {
      field: "subPartCode",
      headerName: "零件",
      minWidth: 300,
    };
  }, []);
  const isServerSideGroupOpenByDefault = useCallback(() => {
    // open first two levels by default
    return true;
  }, []);
  const isServerSideGroup = useCallback((dataItem: TreeNode) => {
    // indicate if node is a group
    return !dataItem.leaf;
  }, []);
  const getServerSideGroupKey = useCallback((dataItem: TreeNode) => {
    // specify which group key to use
    return dataItem.tempId;
  }, []);
  const serverSideDatasource = createServerSideDatasource();
  const apiRef = useRef<GridApi>(null);
  const onGridReady = (params: GridReadyEvent) => {
    apiRef.current = params.api;
  };

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        <AgGridReact
          columnDefs={columns}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          rowModelType={"serverSide"}
          treeData={true}
          isServerSideGroupOpenByDefault={isServerSideGroupOpenByDefault}
          isServerSideGroup={isServerSideGroup}
          getServerSideGroupKey={getServerSideGroupKey}
          serverSideDatasource={serverSideDatasource}
          cacheBlockSize={20} // 缓存块大小
          maxBlocksInCache={3} // 缓存块数
          maxConcurrentDatasourceRequests={2} // 最大并发请求数
          blockLoadDebounceMillis={60} // 防抖时间
          suppressServerSideFullWidthLoadingRow={true}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};
