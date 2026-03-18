import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Space, message, Upload } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { postalApi, StandardPostalCode } from '../services/api';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

const StandardPostalPage: React.FC = () => {
  const [postalCodes, setPostalCodes] = useState<StandardPostalCode[]>([]);
  const [postalCount, setPostalCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<{ province?: string; city?: string; district?: string; postalCode?: string }>({});

  const loadPostalCount = useCallback(async () => {
    try {
      const response = await postalApi.getStandardPostalCodeCount();
      if (response.data.success) {
        setPostalCount(response.data.count);
      }
    } catch (error) {
      // 错误处理
    }
  }, []);

  const loadPostalCodes = useCallback(async (skip: number = 0, take: number = 20, filterParams?: { province?: string; city?: string; district?: string; postalCode?: string }) => {
    setLoading(true);
    const currentFilters = filterParams !== undefined ? filterParams : filters;
    try {
      const response = await postalApi.getStandardPostalCodes(skip, take, currentFilters);
      if (response.data.success) {
        setPostalCodes(response.data.data);
      } else {
        messageApi.error('获取邮编列表失败');
      }
    } catch (error: any) {
      messageApi.error('获取邮编列表失败');
    } finally {
      setLoading(false);
    }
  }, [messageApi, filters]);

  const handlePaginationChange = (page: number, pageSize: number) => {
    const newPagination = {
      current: page,
      pageSize,
    };
    setPagination(newPagination);
    loadPostalCodes((page - 1) * pageSize, pageSize, filters);
  };

  const handleFilter = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 });
    loadPostalCodes(0, pagination.pageSize, newFilters);
  };

  const handleFilterReset = (field: string) => {
    const newFilters = { ...filters };
    delete newFilters[field];
    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 });
    loadPostalCodes(0, pagination.pageSize, newFilters);
  };

  useEffect(() => {
    loadPostalCount();
    loadPostalCodes();
  }, [loadPostalCount, loadPostalCodes]);

  const handleStandardUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    try {
      await postalApi.uploadStandardPostalCode(file as File);
      messageApi.success('标准邮编上传成功');
      loadPostalCount();
      loadPostalCodes();
      onSuccess?.(null);
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || '上传失败');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleClearStandard = async () => {
    try {
      await postalApi.clearStandardPostalCode();
      messageApi.success('已清除所有标准邮编');
      loadPostalCount();
      loadPostalCodes();
    } catch (error) {
      messageApi.error('清除失败');
    }
  };

  const columns = [
    {
      title: '省',
      dataIndex: 'province',
      key: 'province',
      filterDropdown: (props: any) => {
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }}>
            <input
              placeholder="输入省份"
              value={selectedKeys[0] || ''}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  handleFilter('province', selectedKeys[0] || '');
                }}
                size="small"
                style={{ width: 90 }}
              >
                确定
              </Button>
              <Button onClick={() => {
                clearFilters?.();
                handleFilterReset('province');
              }} size="small" style={{ width: 90 }}>
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value: string, record: StandardPostalCode) => record.province.includes(value),
      sorter: (a: StandardPostalCode, b: StandardPostalCode) => a.province.localeCompare(b.province),
    },
    {
      title: '市',
      dataIndex: 'city',
      key: 'city',
      filterDropdown: (props: any) => {
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }}>
            <input
              placeholder="输入城市"
              value={selectedKeys[0] || ''}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  handleFilter('city', selectedKeys[0] || '');
                }}
                size="small"
                style={{ width: 90 }}
              >
                确定
              </Button>
              <Button onClick={() => {
                clearFilters?.();
                handleFilterReset('city');
              }} size="small" style={{ width: 90 }}>
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value: string, record: StandardPostalCode) => record.city.includes(value),
      sorter: (a: StandardPostalCode, b: StandardPostalCode) => a.city.localeCompare(b.city),
    },
    {
      title: '区',
      dataIndex: 'district',
      key: 'district',
      filterDropdown: (props: any) => {
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }}>
            <input
              placeholder="输入区县"
              value={selectedKeys[0] || ''}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  handleFilter('district', selectedKeys[0] || '');
                }}
                size="small"
                style={{ width: 90 }}
              >
                确定
              </Button>
              <Button onClick={() => {
                clearFilters?.();
                handleFilterReset('district');
              }} size="small" style={{ width: 90 }}>
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value: string, record: StandardPostalCode) => record.district.includes(value),
      sorter: (a: StandardPostalCode, b: StandardPostalCode) => a.district.localeCompare(b.district),
    },
    {
      title: '邮编',
      dataIndex: 'postalCode',
      key: 'postalCode',
      filterDropdown: (props: any) => {
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }}>
            <input
              placeholder="输入邮编"
              value={selectedKeys[0] || ''}
              onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  handleFilter('postalCode', selectedKeys[0] || '');
                }}
                size="small"
                style={{ width: 90 }}
              >
                确定
              </Button>
              <Button onClick={() => {
                clearFilters?.();
                handleFilterReset('postalCode');
              }} size="small" style={{ width: 90 }}>
                重置
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value: string, record: StandardPostalCode) => record.postalCode.includes(value),
      sorter: (a: StandardPostalCode, b: StandardPostalCode) => a.postalCode.localeCompare(b.postalCode),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card 
          extra={
            <Space>
              <Dragger
                name="file"
                multiple={false}
                customRequest={handleStandardUpload}
                beforeUpload={(file) => {
                  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel';
                  if (!isExcel) {
                    messageApi.error('只能上传 Excel 文件');
                    return false;
                  }
                  return true;
                }}
                showUploadList={false}
                disabled={uploading}
                accept=".xlsx,.xls"
                style={{ width: 200 }}
              >
                <Button loading={uploading} type="primary">
                  {uploading ? '上传中...' : '上传标准邮编'}
                </Button>
              </Dragger>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleClearStandard} 
                disabled={postalCount === 0}
              >
                清除
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={postalCodes}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              total: postalCount,
              onChange: handlePaginationChange,
            }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default StandardPostalPage;