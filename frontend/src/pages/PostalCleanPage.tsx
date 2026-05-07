import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Table, Space, Tag, Progress, message, Modal, Radio } from 'antd';
import { DeleteOutlined, ExportOutlined, SyncOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
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
  const [cleanLevel, setCleanLevel] = useState<string>('3');
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [currentCleanId, setCurrentCleanId] = useState<number | null>(null);

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

  const handleClean = (id: number) => {
    setCleanLevel('3');
    setCurrentCleanId(id);
    setShowCleanModal(true);
  };

  const handleCleanModalOk = async () => {
    if (currentCleanId !== null) {
      await startClean(currentCleanId, parseInt(cleanLevel));
    }
    setShowCleanModal(false);
  };

  const handleCleanModalCancel = () => {
    setShowCleanModal(false);
  };

  const startClean = async (id: number, level: number) => {
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
      const response = await postalApi.cleanRouteData(id, level);
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
      const result = await postalApi.exportResult(id);
      
      const blob = new Blob([result.data.blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.fileName;
      
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
          // 使用清洗后的结果数据（包含_multipleMatch字段）
          const resultData = importRecord.resultData ? JSON.parse(importRecord.resultData) : JSON.parse(importRecord.importData);
          
          // 过滤掉内部字段和不需要的列
          const columnsToExclude = ['_isSingleCityColumn', '_multipleMatch', '省 (oTMS)', '市 (oTMS)', '区 (oTMS)', '市 (town)', '县 (County)'];
          const filteredData = resultData.map((record: Record<string, any>) => {
            const filtered: Record<string, any> = {};
            Object.keys(record).forEach(key => {
              if (!columnsToExclude.includes(key)) {
                filtered[key] = record[key];
              }
            });
            return filtered;
          });
          
          // 动态生成列定义
          let columns = [];
          if (filteredData.length > 0) {
            const firstRow = filteredData[0];
            columns = Object.keys(firstRow).map(key => ({
              title: key,
              dataIndex: key,
              key: key,
            }));
          }
          
          // 行样式函数：多匹配记录显示黄色背景
          const rowClassName = (record: Record<string, any>, index: number) => {
            const originalRecord = resultData[index];
            const hasMultipleMatch = originalRecord && (originalRecord['_multipleMatch'] === true || originalRecord['_multipleMatch'] === 'true');
            if (hasMultipleMatch) {
              return 'multiple-match-row';
            }
            return '';
          };
          
          // 显示查看模态框
          modal.info({
            title: `查看导入记录：${importRecord.fileName}`,
            content: (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <Table 
                  dataSource={filteredData.map((item, idx) => ({ ...item, key: idx }))} 
                  columns={columns}
                  rowClassName={rowClassName}
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
            icon={<PlayCircleOutlined />}
            onClick={() => handleClean(record.id)}
            disabled={record.status !== 'pending'}
          >
            清洗
          </Button>
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
      <Modal
        title="选择清洗级别"
        open={showCleanModal}
        onOk={handleCleanModalOk}
        onCancel={handleCleanModalCancel}
        okText="开始清洗"
        cancelText="取消"
        width={400}
      >
        <p>请选择开始清洗的级别，从对应级别开始向上匹配，不再考虑匹配低级别：</p>
        <Radio.Group value={cleanLevel} onChange={(e) => setCleanLevel(e.target.value)}>
          <Radio value="1">第一级（省/直辖市）</Radio>
          <br />
          <Radio value="2">第二级（市）</Radio>
          <br />
          <Radio value="3">第三级（区县）</Radio>
        </Radio.Group>
      </Modal>
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
