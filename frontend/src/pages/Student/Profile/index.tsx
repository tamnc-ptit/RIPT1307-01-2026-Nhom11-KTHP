import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Button, Typography, Form, Input, Badge, Progress, Space, Spin, message } from 'antd';
import { EditOutlined, SaveOutlined, BookOutlined, PlusOutlined } from '@ant-design/icons';
import { getStudentProfile, updateStudentProfile } from '@/services/student';

const { Title, Text } = Typography;

const StudentProfile: React.FC = () => {
  const [form] = Form.useForm();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch dữ liệu thật từ Backend
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await getStudentProfile();
      if (data) {
        setProfile(data);
        // Điền dữ liệu vào form
        form.setFieldsValue({
          class_name: data.class_name || 'Chưa cập nhật',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      message.error('Lỗi tải dữ liệu hồ sơ cá nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý lưu SĐT
  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await updateStudentProfile({ phone: values.phone });
      message.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
      // Cập nhật lại UI state cục bộ mà không cần gọi API lại
      setProfile((prev: any) => ({ ...prev, phone: values.phone }));
    } catch (error) {
      message.error('Cập nhật thất bại. Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Dữ liệu an toàn
  const studentName = profile?.name || 'Chưa cập nhật';
  const studentCode = profile?.student_code || 'Chưa có mã';
  const email = profile?.email || 'Chưa có email';
  const progressPercent = profile?.progress_percentage || 0;

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
        <Col xs={24} lg={16}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          >
            {/* Phần Header Profile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <Space size="large" align="start">
                <Badge dot status="success" offset={[-10, 80]} style={{ width: 12, height: 12 }}>
                  <Avatar 
                    size={90} 
                    style={{ backgroundColor: '#1677ff', fontSize: 36, fontWeight: 500 }}
                  >
                    {studentName.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
                
                <div style={{ marginTop: 8 }}>
                  <Title level={3} style={{ margin: 0, color: '#102a43' }}>{studentName}</Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>Mã SV: {studentCode}</Text>
                  
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Email sinh viên: </Text>
                    <Text strong>{email}</Text>
                  </div>
                </div>
              </Space>

              <Button 
                type={isEditing ? "primary" : "default"} 
                icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                loading={saving}
                onClick={() => {
                  if (isEditing) {
                    form.submit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                style={{ 
                  borderRadius: 6, 
                  backgroundColor: isEditing ? '#1677ff' : '#102a43', 
                  color: '#fff',
                  border: 'none'
                }}
              >
                {isEditing ? 'Lưu thông tin' : 'Sửa thông tin'}
              </Button>
            </div>

            {/* Form thông tin */}
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={handleSave}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label={<Text strong>Lớp / Chuyên ngành</Text>} name="class_name">
                    <Input 
                      disabled // Sinh viên không được tự sửa lớp
                      size="large" 
                      style={{ borderRadius: 6, backgroundColor: '#f5f7fa', color: '#000' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={<Text strong>Số điện thoại liên hệ</Text>} 
                    name="phone"
                    rules={[{ pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }]}
                  >
                    <Input 
                      disabled={!isEditing} 
                      size="large" 
                      placeholder="Chưa cập nhật số điện thoại"
                      style={{ borderRadius: 6, backgroundColor: isEditing ? '#fff' : '#f5f7fa', color: '#000' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {/* Phần Đề tài đang thực hiện */}
            <div style={{ 
              marginTop: 24, 
              padding: 24, 
              backgroundColor: '#f8fafc', 
              borderRadius: 12,
              border: '1px solid #e2e8f0' 
            }}>
              <Space align="center" style={{ marginBottom: 16 }}>
                <BookOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                <Title level={5} style={{ margin: 0, color: '#102a43' }}>Đề tài Đồ án đang thực hiện</Title>
              </Space>
              
              {/* Kiểm tra biến thesis_id từ API */}
              {profile?.thesis_id ? (
                <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <Text strong style={{ fontSize: 16 }}>{profile.thesis_title}</Text>
                  <br />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Giảng viên hướng dẫn: </Text>
                    <Text>{profile.lecturer_name || 'Đang chờ phân công'}</Text>
                  </div>
                </div>
              ) : (
                <Button type="dashed" style={{ borderRadius: 6 }} icon={<PlusOutlined />}>
                  Đăng ký đề tài mới
                </Button>
              )}
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: TRẠNG THÁI / TIẾN ĐỘ */}
        <Col xs={24} lg={8}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' } }}
          >
            <Title level={5} style={{ color: '#102a43', marginBottom: 32 }}>
              📊 Tiến độ Đồ án
            </Title>

            <Progress 
              type="dashboard" 
              percent={progressPercent} 
              size={180} 
              strokeColor="#52c41a"
              format={(percent) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 32, fontWeight: 'bold', color: '#102a43' }}>{percent}%</span>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>Hoàn thành</span>
                </div>
              )}
            />

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>{progressPercent}% Tiến độ chung</Text>
              <p style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8, padding: '0 16px' }}>
                * Được tính toán dựa trên tổng số lượng mốc (milestones) đã được giảng viên phê duyệt trên tổng số mốc yêu cầu.
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;