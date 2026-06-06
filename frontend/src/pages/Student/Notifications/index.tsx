import React, { useEffect, useState } from 'react';
import { Card, Typography, Badge, Button, Spin, message, Row, Col, Empty } from 'antd';
import { CheckOutlined, BellOutlined } from '@ant-design/icons';
import { getMyNotifications, markNotificationAsRead } from '@/services/student/notification';
import moment from 'moment';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Gọi API lấy dữ liệu
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getMyNotifications();
      if (res && Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (error) {
      message.error('Lỗi khi tải thông báo từ hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Xử lý khi click "Đánh dấu đã đọc"
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      // Cập nhật lại giao diện ngay lập tức thay vì gọi lại API
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
      message.success('Đã đánh dấu là đã đọc');
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
      <Card 
        variant="borderless" 
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <div style={{ padding: '8px 12px', background: '#e6f4ff', borderRadius: 8 }}>
            <BellOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>Thông báo của bạn</Title>
        </div>

        <Spin spinning={loading}>
          {notifications.length === 0 && !loading ? (
            <Empty description="Bạn chưa có thông báo nào" style={{ margin: '40px 0' }} />
          ) : (
            <Row gutter={[24, 24]}>
              {notifications.map((item) => (
                <Col xs={24} lg={12} key={item.id}>
                  <Card 
                    type="inner" 
                    style={{ 
                      background: item.is_read ? '#fafafa' : '#ffffff',
                      border: item.is_read ? '1px solid #f0f0f0' : '1px solid #91caff',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Title level={5} style={{ margin: 0, color: item.is_read ? '#8c8c8c' : '#000' }}>
                          {item.title}
                        </Title>
                        {/* Chấm đỏ nếu chưa đọc */}
                        {!item.is_read && <Badge status="error" />}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {moment(item.created_at).format('DD/MM/YYYY, HH:mm')}
                      </Text>
                    </div>

                    <div style={{ marginTop: 12, marginBottom: 16, minHeight: 44 }}>
                      <Text style={{ color: item.is_read ? '#8c8c8c' : '#262626' }}>
                        {item.message}
                      </Text>
                    </div>

                    <div>
                      {!item.is_read ? (
                        <Button 
                          type="link" 
                          icon={<CheckOutlined />} 
                          onClick={() => handleMarkAsRead(item.id)}
                          style={{ padding: 0 }}
                        >
                          Đánh dấu đã đọc
                        </Button>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          <CheckOutlined style={{ marginRight: 4 }} /> Đã xem
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default StudentNotifications;