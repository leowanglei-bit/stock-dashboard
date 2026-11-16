'use client';

import { Card, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const STACK = [
  ['框架', 'Next.js 16 App Router（静态导出）＋ React 19 ＋ TypeScript'],
  ['UI', 'Ant Design 6（cssinjs 主题）＋ Tailwind CSS 3 ＋ CSS Modules'],
  ['字体', 'Inter（自托管 woff2，不依赖外部字体服务）'],
  ['行情', '新浪 / 腾讯行情接口，双通道自动切换'],
  ['同步', 'Supabase（浏览器端直连，匿名访问）'],
  ['部署', 'GitHub Actions 构建后发布到 GitHub Pages'],
];

export default function AboutPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Title level={4} style={{ margin: 0 }}>
        关于
      </Title>

      <Card size="small">
        <Paragraph>
          灵犀茶馆 · 藏经阁：多板块同列的股票看盘工具。自定义板块、拖拽排序、实时行情，
          数据只存本机与自己的云端库，无账号、无埋点。
        </Paragraph>
        <Text type="secondary">
          心有灵犀 谈笑间 众生皆有回响 ｜ 味归平淡 静思处 乾坤尽纳一盏
        </Text>
      </Card>

      <Card size="small" title="技术栈">
        <dl className="m-0 grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
          {STACK.map(([k, v]) => (
            <div key={k} className="contents">
              <dt style={{ color: 'var(--text-dim)' }}>{k}</dt>
              <dd className="m-0" style={{ color: 'var(--foreground)' }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card size="small" title="说明">
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          行情数据来自公开接口，可能有延迟或缺失，仅供个人参考，不构成任何投资建议。
          板块与股票清单保存在本机 localStorage；配置了云端同步时，会额外写入你自己的 Supabase 表。
        </Paragraph>
      </Card>
    </div>
  );
}
