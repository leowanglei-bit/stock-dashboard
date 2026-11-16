'use client';

import { Button, Card, Segmented, Select, Space, Tag, Typography } from 'antd';
import { useDashboard } from '@/src/store/context';

const { Title, Text } = Typography;

const INTERVALS = [
  { label: '每 1 秒', value: 1000 },
  { label: '每 3 秒', value: 3000 },
  { label: '每 5 秒', value: 5000 },
  { label: '每 10 秒', value: 10000 },
  { label: '每 30 秒', value: 30000 },
];

export default function SettingsPage() {
  const d = useDashboard();
  const boardCount = Object.keys(d.boards).length;
  const stockCount = Object.values(d.boards).reduce((n, b) => n + b.stocks.length, 0);

  const statusText =
    d.apiStatus === 'unavailable' ? '网络不可用' : d.apiStatus === 'fetching' ? '加载中' : '正常';

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Title level={4} style={{ margin: 0 }}>
        设置
      </Title>

      <Card size="small" title="行情刷新">
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>刷新间隔</Text>
            <Select
              value={d.intervalMs}
              onChange={d.setIntervalMs}
              options={INTERVALS}
              style={{ width: 140 }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>自动更新</Text>
            <Space>
              <Tag color={d.simulationActive ? 'green' : 'default'}>
                {d.simulationActive ? '更新中' : '已暂停'}
              </Tag>
              <Button onClick={d.toggleSimulation}>{d.simulationActive ? '暂停' : '继续'}</Button>
              <Button onClick={d.refreshPrices}>立即刷新</Button>
            </Space>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>接口状态</Text>
            <Space size="middle">
              <Tag color={d.apiStatus === 'ok' ? 'green' : d.apiStatus === 'unavailable' ? 'red' : 'blue'}>
                {statusText}
              </Tag>
              <Text type="secondary">{d.lastUpdateTime ? `最后更新 ${d.lastUpdateTime}` : '尚未取到行情'}</Text>
            </Space>
          </div>
        </Space>
      </Card>

      <Card size="small" title="外观">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text>主题</Text>
          <Segmented
            value={d.theme}
            onChange={(v) => d.setTheme(v as 'dark' | 'light')}
            options={[
              { label: '暗色', value: 'dark' },
              { label: '亮色', value: 'light' },
            ]}
          />
        </div>
      </Card>

      <Card size="small" title="数据">
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>本机数据</Text>
            <Text type="secondary">
              {boardCount} 个板块 · {stockCount} 只股票
            </Text>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text>云端同步</Text>
            <Space>
              <Tag color={d.serverMode ? 'green' : 'default'}>
                {d.serverMode ? '已启用（Supabase）' : '未配置'}
              </Tag>
              <Button onClick={() => void d.pullFromServer()} disabled={!d.serverMode}>
                从云端拉取
              </Button>
            </Space>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Text>清空本机数据</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                只删本机 localStorage，云端数据不受影响
              </Text>
            </div>
            <Button danger onClick={d.clearLocalData}>
              清空
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
}
