import React from 'react';
import { ConfigProvider, Layout, Menu } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PostalCleanPage from './pages/PostalCleanPage';
import StandardPostalPage from './pages/StandardPostalPage';

const { Content, Sider } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider width={200} style={{ background: '#fff' }}>
            <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              邮编清洗工具
            </div>
            <Menu
              mode="inline"
              defaultSelectedKeys={['/']}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                {
                  key: '/',
                  label: <Link to="/">线路导入清洗</Link>,
                },
                {
                  key: '/standard',
                  label: <Link to="/standard">标准邮编管理</Link>,
                },
              ]}
            />
          </Sider>
          <Content style={{ padding: '24px' }}>
            <Routes>
              <Route path="/" element={<PostalCleanPage />} />
              <Route path="/postal-clean" element={<PostalCleanPage />} />
              <Route path="/standard" element={<StandardPostalPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
