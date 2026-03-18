import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Table, Space, Tag, Progress, message, Modal } from 'antd';
import { DeleteOutlined, ExportOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import { postalApi, RouteImport } from '../services/api';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

const PostalCleanPage: React.FC = () => {
  const [imports, setImports] = useState<RouteImport[]>([]);
  const [uploadingRoutes, setUploadingRoutes] = useState(false);
  const [cleaningId, setCleaningId] = useState<number | null>(null);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
      const response = await postalApi.getUserRouteImports();
      if (response.data.success) {
        setImports(response.data.data);
      }
    } catch (error) {
      // 错误处理
    }
  };

  const handleRoutesUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploadingRoutes(true);

    try {
      const response = await postalApi.uploadUserRoutes(file as File);
      if (response.data.success) {
        messageApi.success('线路导入成功');
        loadImports();
        onSuccess?.(null);
      } else {
        messageApi.error(response.data.error || '导入失败');
        onError?.(null);
      }
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || '导入失败');
      onError?.(error);
    } finally {
      setUploadingRoutes(false);
    }
  };

  const handleClean = async (id: number) => {
    setCleaningId(id);
    setCleaningProgress(0);

    const interval = setInterval(() => {
      setCleaningProgress(prev => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await postalApi.cleanRouteData(id);
      if (response.data.success) {
        messageApi.success('清洗完成');
        loadImports();
      } else {
        messageApi.error(response.data.error || '清洗失败');
      }
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || '清洗失败');
    } finally {
      clearInterval(interval);
      setCleaningProgress(100);
      setTimeout(() => {
        setCleaningId(null);
        setCleaningProgress(0);
      }, 500);
    }
  };

  const handleExport = async (id: number) => {
    try {
      const response = await postalApi.exportResult(id);
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cleaned_routes.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      
      messageApi.success('导出成功');
    } catch (error: any) {
      messageApi.error('导出失败');
    }
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条导入记录吗？',
      onOk: async () => {
        try {
          await postalApi.deleteUserRouteImport(id);
          messageApi.success('删除成功');
          loadImports();
        } catch (error) {
          messageApi.error('删除失败');
        }
      }
    });
  };

  const handleView = async (id: number) => {
    try {
      const response = await postalApi.getUserRouteImportById(id);
      if (response.data.success) {
        const importRecord = response.data.data;
        if (importRecord) {
          const importData = JSON.parse(importRecord.importData);
          
          // 动态生成列定义
          let columns = [];
          if (importData.length > 0) {
            const firstRow = importData[0];
            columns = Object.keys(firstRow).map(key => ({
              title: key,
              dataIndex: key,
              key: key,
            }));
          }
          
          // 显示查看模态框
          modal.info({
            title: `查看导入记录：${importRecord.fileName}`,
            content: (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <Table 
                  dataSource={importData} 
                  columns={columns}
                  rowKey={(record, index) => index}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            ),
            width: 1000,
          });
        }
      } else {
        messageApi.error('获取导入记录失败');
      }
    } catch (error) {
      messageApi.error('查看导入记录失败');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="default">待处理</Tag>;
      case 'processing':
        return <Tag color="processing"><SyncOutlined spin /> 处理中</Tag>;
      case 'completed':
        return <Tag color="success">已完成</Tag>;
      case 'failed':
        return <Tag color="error">失败</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RouteImport) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<ExportOutlined />}
            onClick={() => handleExport(record.id)}
            disabled={record.status !== 'completed'}
          >
            导出
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
          {cleaningId === record.id && record.status !== 'completed' && (
            <Progress percent={cleaningProgress} size="small" />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      {modalContextHolder}
      <Card title="线路导入清洗">
        <Dragger
          name="file"
          multiple={false}
          accept=".xlsx,.xls"
          customRequest={handleRoutesUpload}
          disabled={uploadingRoutes}
        >
          <p className="ant-upload-drag-icon">
            <ExportOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个 Excel 文件上传</p>
        </Dragger>

        <Table
          dataSource={imports}
          columns={columns}
          rowKey="id"
          style={{ marginTop: 16 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default PostalCleanPage;
