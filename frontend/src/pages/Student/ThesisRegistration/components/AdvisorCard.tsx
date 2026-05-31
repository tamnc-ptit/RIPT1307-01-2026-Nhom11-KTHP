import React from 'react';
import { Card, Typography, Avatar, Divider, Space } from 'antd';
import { UserOutlined, ReadOutlined, SendOutlined } from '@ant-design/icons';
import { LecturerERD } from '../../../../types/LecturerTypes/ThesisTypes';

const { Title, Text } = Typography;

interface AdvisorCardProps {
  advisor?: LecturerERD;
}

const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor }) => {
  if (!advisor) {
    return (
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, border: '1px dashed #d9d9d9', background: '#fafafa', textAlign: 'center' }} 
        bodyStyle={{ padding: '40px 20px' }}
      >
        <UserOutlined style={{ fontSize: 40, color: '#bfbfbf', marginBottom: 16 }} />
        <Text style={{ color: '#8c8c8c', display: 'block' }}>Vui lòng chọn giảng viên hướng dẫn</Text>
      </Card>
    );
  }

  const isFull = advisor.quota >= advisor.maxQuota;

  return (
    <Card 
      bordered={false} 
      style={{ borderRadius: 16, background: 'linear-gradient(145deg, #0a0f2c 0%, #0d1b4b 40%, #0a2472 100%)', border: 'none', boxShadow: '0 8px 40px rgba(22,119,255,0.22)', position: 'relative', overflow: 'hidden' }} 
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Avatar size={80} src={advisor.avatar} style={{ border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: 12 }} />
        <Title level={4} style={{ color: '#fff', margin: 0 }}>{advisor.name}</Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Giảng viên hướng dẫn</Text>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Chỉ tiêu hướng dẫn</Text>
          <Text strong style={{ color: isFull ? '#ff4d4f' : '#52c41a', fontSize: 12 }}>{advisor.quota} / {advisor.maxQuota} sinh viên</Text>
        </div>
        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ReadOutlined style={{ color: '#4096ff' }} />
            <Text style={{ color: '#fff', fontSize: 13 }}>{advisor.domains?.join(', ') || 'Chưa cập nhật'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SendOutlined style={{ color: '#4096ff' }} />
            <Text style={{ color: '#fff', fontSize: 13 }}>{advisor.email}</Text>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default AdvisorCard;