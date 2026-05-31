// src/pages/Student/components/StudentStatusBanner/index.tsx
import React from 'react';
import { Typography, Tag, Space } from 'antd';

const { Text } = Typography;

interface StudentStatusBannerProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bg: string;
  children?: React.ReactNode; 
}

const StudentStatusBanner: React.FC<StudentStatusBannerProps> = ({
  icon, label, description, color, bg, children
}) => {
  return (
    <div style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, boxShadow: `0 4px 16px ${color}15` }}>
      <Space size={12} align="center">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, boxShadow: `0 4px 12px ${color}40`, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{label}</Tag>
          <Text style={{ display: 'block', fontSize: 13, color: '#595959' }}>{description}</Text>
        </div>
      </Space>
      {children && (
        <Space size={24} wrap>
          {children}
        </Space>
      )}
    </div>
  );
};

export default StudentStatusBanner;