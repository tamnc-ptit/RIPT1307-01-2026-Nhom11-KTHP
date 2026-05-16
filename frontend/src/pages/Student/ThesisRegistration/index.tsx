// src/pages/StudentDashboard/ThesisRegistration/index.tsx
import StudentStatusBanner from '../components/StudentStatusBanner';
import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Typography, Button, Tag, Space, Avatar,
  Tooltip, Steps, Modal, Form, Input, Select, Divider,
  Badge, List, Alert, message, Popconfirm
} from 'antd';
import {
  FormOutlined, CheckCircleFilled, CalendarOutlined,
  UserOutlined, ExclamationCircleOutlined, StarFilled,
  InfoCircleOutlined, CheckOutlined, RocketOutlined,
  SendOutlined, LockOutlined, FileTextOutlined, SyncOutlined,
  SearchOutlined, ReadOutlined, ProjectOutlined,
  ClockCircleOutlined, SafetyCertificateOutlined, SaveOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ===================== TYPES =====================
type RegistrationStatus = 'not_registered' | 'pending' | 'approved' | 'rejected';

// ===================== MOCK DATA =====================
const mockAdvisors = [
  { id: 'ptkhanh', name: 'Cô Phạm Thị Khánh', role: 'Giảng viên hướng dẫn', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', email: 'ptkhanh@ptit.edu.vn', quota: 3, maxQuota: 5, domains: ['Web Development', 'Software Engineering'] },
  { id: 'nvb', name: 'Thầy Nguyễn Văn Nam', role: 'Giảng viên', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Binh', email: 'nvb@ptit.edu.vn', quota: 5, maxQuota: 5, domains: ['AI', 'Machine Learning'] },
  { id: 'ltc', name: 'Cô Lê Thị Hồng', role: 'Giảng viên', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chi', email: 'ltc@ptit.edu.vn', quota: 1, maxQuota: 4, domains: ['Data Science', 'Blockchain'] },
];

const mockSuggestedTopics = [
  { id: 1, title: 'Hệ thống quản lý khóa luận tốt nghiệp (Thesis Workspace)', domain: 'Web Development', advisor: 'ptkhanh', difficulty: 'Medium' },
  { id: 2, title: 'Ứng dụng AI Chatbot hỗ trợ tư vấn tuyển sinh', domain: 'AI', advisor: 'nvb', difficulty: 'Hard' },
  { id: 3, title: 'Phân tích dữ liệu hành vi người dùng trên nền tảng E-learning', domain: 'Data Science', advisor: 'ltc', difficulty: 'Medium' },
];

// ===================== UTILS =====================
const statusMeta: Record<RegistrationStatus, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  not_registered: { label: 'Chưa đăng ký', color: '#8c8c8c', bg: '#fafafa', icon: <FormOutlined />, description: 'Bạn chưa nộp phiếu đăng ký đề tài nào.' },
  pending: { label: 'Chờ xét duyệt', color: '#fa8c16', bg: '#fff7e6', icon: <SyncOutlined spin />, description: 'Phiếu đăng ký đang chờ Giảng viên và Bộ môn xét duyệt.' },
  approved: { label: 'Đã duyệt đề tài', color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleFilled />, description: 'Đề tài của bạn đã được duyệt. Hãy bắt đầu thực hiện!' },
  rejected: { label: 'Bị từ chối', color: '#ff4d4f', bg: '#fff2f0', icon: <ExclamationCircleOutlined />, description: 'Đề tài bị từ chối. Vui lòng xem lý do và đăng ký lại.' },
};

// ===================== SUB-COMPONENTS =====================

/** Main Registration Form */
const RegistrationForm: React.FC<{
  status: RegistrationStatus;
  onSubmit: (values: any) => void;
  onSaveDraft: () => void; // Thêm prop Lưu nháp
  selectedAdvisorId?: string;
  onAdvisorChange: (id: string) => void;
  form: any;
  advisors: typeof mockAdvisors;
}> = ({ status, onSubmit, onSaveDraft, selectedAdvisorId, onAdvisorChange, form, advisors }) => {
  const isLocked = status === 'pending' || status === 'approved';

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20, background: isLocked ? 'linear-gradient(135deg, #f8fcff 0%, #f0f9ff 100%)' : '#fff' }} bodyStyle={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: isLocked ? 'linear-gradient(135deg, #1677ff, #4096ff)' : 'linear-gradient(135deg, #52c41a, #73d13d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLocked ? <LockOutlined style={{ color: '#fff', fontSize: 16 }} /> : <FormOutlined style={{ color: '#fff', fontSize: 16 }} />}
        </div>
        <div>
          <Text strong style={{ fontSize: 16, color: '#1a1a2e' }}>Phiếu Đăng Ký Đề Tài</Text>
          <div><Text style={{ fontSize: 12, color: '#8c8c8c' }}>{isLocked ? 'Không thể chỉnh sửa sau khi đã nộp phiếu' : 'Điền đầy đủ thông tin để gửi yêu cầu xét duyệt'}</Text></div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onSubmit} disabled={isLocked} initialValues={{ domain: 'Web Development' }}>
        <Row gutter={20}>
          <Col xs={24}>
            <Form.Item name="title" label={<Text strong>Tên đề tài (Tiếng Việt)</Text>} rules={[{ required: true, message: 'Vui lòng nhập tên đề tài!' }]}>
              <Input size="large" placeholder="Nhập tên đề tài dự kiến..." style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="domain" label={<Text strong>Hướng nghiên cứu</Text>} rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực!' }]}>
              <Select size="large" placeholder="Chọn lĩnh vực">
                <Option value="Web Development">Phát triển phần mềm (Web/App)</Option>
                <Option value="AI">Trí tuệ nhân tạo (AI)</Option>
                <Option value="Data Science">Khoa học Dữ liệu (Data Science)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="advisor" label={<Text strong>Giảng viên hướng dẫn</Text>} rules={[{ required: true, message: 'Vui lòng chọn giảng viên!' }]}>
              <Select size="large" placeholder="Chọn giảng viên" onChange={onAdvisorChange} optionLabelProp="label">
                {advisors.map(adv => (
                  <Option key={adv.id} value={adv.id} label={adv.name} disabled={adv.quota >= adv.maxQuota}>
                    <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Space>
                        <Avatar size="small" src={adv.avatar} style={{ opacity: adv.quota >= adv.maxQuota ? 0.5 : 1 }} />
                        <span style={{ color: adv.quota >= adv.maxQuota ? '#bfbfbf' : 'inherit' }}>{adv.name}</span>
                      </Space>
                      {adv.quota >= adv.maxQuota && <Tag color="error" style={{ margin: 0, borderRadius: 4 }}>Đã kín ({adv.quota}/{adv.maxQuota})</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="description" label={<Text strong>Mô tả ngắn gọn mục tiêu đề tài</Text>} rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}>
              <TextArea rows={4} placeholder="Trình bày tóm tắt mục tiêu, công nghệ dự kiến sử dụng và kết quả đạt được..." style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        {!isLocked && (
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button size="large" icon={<SaveOutlined />} onClick={onSaveDraft} style={{ borderRadius: 10, height: 44, fontWeight: 600 }}>
              Lưu nháp
            </Button>
            <Button type="primary" size="large" htmlType="submit" icon={<SendOutlined />} style={{ borderRadius: 10, height: 44, paddingInline: 32, background: 'linear-gradient(135deg, #1677ff, #4096ff)', border: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}>
              Gửi Đăng Ký
            </Button>
          </div>
        )}
      </Form>
    </Card>
  );
};

/** Advisor Info Card */
const AdvisorCard: React.FC<{ advisorId?: string; advisors: typeof mockAdvisors }> = ({ advisorId, advisors }) => {
  const advisor = advisors.find(a => a.id === advisorId);

  if (!advisor) {
    return (
      <Card bordered={false} style={{ borderRadius: 16, border: '1px dashed #d9d9d9', background: '#fafafa', textAlign: 'center' }} bodyStyle={{ padding: '40px 20px' }}>
        <UserOutlined style={{ fontSize: 40, color: '#bfbfbf', marginBottom: 16 }} />
        <Text style={{ color: '#8c8c8c', display: 'block' }}>Vui lòng chọn giảng viên hướng dẫn để xem thông tin</Text>
      </Card>
    );
  }

  const isFull = advisor.quota >= advisor.maxQuota;

  return (
    <Card bordered={false} style={{ borderRadius: 16, background: 'linear-gradient(145deg, #0a0f2c 0%, #0d1b4b 40%, #0a2472 100%)', border: 'none', boxShadow: '0 8px 40px rgba(22,119,255,0.22)', position: 'relative', overflow: 'hidden' }} bodyStyle={{ padding: 24 }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(64,150,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Avatar size={80} src={advisor.avatar} style={{ border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginBottom: 12 }} />
        <Title level={4} style={{ color: '#fff', margin: 0 }}>{advisor.name}</Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{advisor.role}</Text>
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
            <Text style={{ color: '#fff', fontSize: 13 }}>{advisor.domains.join(', ')}</Text>
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

/** Timeline Registration Process */
const RegistrationProcess: React.FC<{ status: RegistrationStatus }> = ({ status }) => {
  let currentStep = 0;
  if (status === 'pending') currentStep = 1;
  if (status === 'approved') currentStep = 2;
  if (status === 'rejected') currentStep = 0;

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginTop: 20 }} bodyStyle={{ padding: '24px 24px 10px' }}>
      <Title level={5} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ProjectOutlined style={{ color: '#722ed1' }} /> Tiến trình đăng ký
      </Title>
      <Steps direction="vertical" current={currentStep} status={status === 'rejected' ? 'error' : 'process'} items={[
        { title: 'Mở cổng đăng ký', description: 'Từ 01/01/2026' },
        { title: 'Nộp phiếu đăng ký', description: status === 'not_registered' ? 'Đang chờ nộp' : 'Đã nộp thành công' },
        { title: 'Xét duyệt', description: status === 'approved' ? 'Đã duyệt' : (status === 'rejected' ? 'Bị từ chối' : 'GVHD và Bộ môn đang xét duyệt') },
        { title: 'Quyết định giao đề tài', description: 'Có chữ ký xác nhận của Khoa' },
      ]} />
    </Card>
  );
};

// ===================== MAIN COMPONENT =====================
const ThesisRegistrationPage: React.FC = () => {
  const [form] = Form.useForm();
  
  const [status, setStatus] = useState<RegistrationStatus>('not_registered');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | undefined>(undefined);
  const [advisors, setAdvisors] = useState(mockAdvisors);
  const [suggestedTopics, setSuggestedTopics] = useState(mockSuggestedTopics);
  const daysLeft = 14;

  // Khôi phục dữ liệu nháp khi mới vào trang (F5)
  useEffect(() => {
    const draftData = localStorage.getItem('thesis_registration_draft');
    if (draftData && status === 'not_registered') {
      const parsedData = JSON.parse(draftData);
      form.setFieldsValue(parsedData);
      if (parsedData.advisor) {
        setSelectedAdvisor(parsedData.advisor);
      }
      message.info('Đã tự động khôi phục dữ liệu bạn đang nhập dở!');
    }
  }, [form, status]);

  // Hàm xử lý Lưu Nháp
  const handleSaveDraft = () => {
    const currentValues = form.getFieldsValue();
    localStorage.setItem('thesis_registration_draft', JSON.stringify(currentValues));
    message.success('Đã lưu nháp! Bạn có thể tải lại trang (F5) mà không sợ mất dữ liệu.');
  };

  const handleSelectSuggested = (topic: typeof mockSuggestedTopics[0]) => {
    form.setFieldsValue({
      title: topic.title,
      domain: topic.domain,
      advisor: topic.advisor,
    });
    setSelectedAdvisor(topic.advisor);
    message.success('Đã điền tự động thông tin đề tài!');
  };

  const handleFormSubmit = (values: any) => {
    Modal.confirm({
      title: 'Xác nhận nộp phiếu đăng ký',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn gửi yêu cầu này? Sau khi gửi, bạn không thể tự ý sửa đổi thông tin cho đến khi có kết quả xét duyệt.',
      okText: 'Gửi đăng ký',
      cancelText: 'Hủy',
      onOk: () => {
        // Xóa bản nháp trong localStorage sau khi gửi thành công
        localStorage.removeItem('thesis_registration_draft');
        setStatus('pending');
        message.success({ content: 'Đã gửi phiếu đăng ký đề tài thành công! Vui lòng chờ xét duyệt.', duration: 4 });
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 50%, #f2f8ff 100%)', padding: '24px', fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .topic-card-hover { transition: all 0.3s ease; }
        .topic-card-hover:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(22,119,255,0.15) !important; border-color: #1677ff !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e', fontWeight: 800 }}>Đăng ký Đề tài Khóa luận</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Đặng Thái An • MSSV: B24DCCC002 • Lớp: D24CQCN</Text>
        </div>
      </div>

      {/* Gọi Component Banner dùng chung */}
      {(() => {
        const meta = statusMeta[status];
        return (
          <StudentStatusBanner icon={meta.icon} label={meta.label} description={meta.description} color={meta.color} bg={meta.bg}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 800, color: daysLeft <= 3 ? '#ff4d4f' : '#1677ff', display: 'block', lineHeight: 1.1 }}>{daysLeft}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>ngày tới hạn</Text>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.06)' }} />
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 800, color: '#722ed1', display: 'block', lineHeight: 1.1 }}>Học kỳ 2</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>Năm học 2025-2026</Text>
            </div>
          </StudentStatusBanner>
        );
      })()}

      <Row gutter={[20, 20]}>
        {/* Left column */}
        <Col xs={24} xl={16}>
          <RegistrationForm 
            status={status} 
            onSubmit={handleFormSubmit} 
            onSaveDraft={handleSaveDraft}
            selectedAdvisorId={selectedAdvisor}
            onAdvisorChange={setSelectedAdvisor}
            form={form}
            advisors={advisors}
          />

          {status === 'not_registered' && (
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }} bodyStyle={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={5} style={{ margin: 0 }}><SearchOutlined /> Gợi ý đề tài từ Giảng viên</Title>
              </div>
              <Row gutter={[16, 16]}>
                {suggestedTopics.map((topic) => (
                  <Col xs={24} md={12} key={topic.id}>
                    <Card className="topic-card-hover" style={{ borderRadius: 12, border: '1px solid #e8e8e8', cursor: 'pointer', height: '100%' }} bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }} onClick={() => handleSelectSuggested(topic)}>
                      <Tag color={topic.difficulty === 'Hard' ? 'red' : 'blue'} style={{ width: 'fit-content', marginBottom: 8 }}>{topic.domain}</Tag>
                      <Text strong style={{ fontSize: 14, marginBottom: 12, flex: 1 }}>{topic.title}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                        <Avatar size="small" icon={<UserOutlined />} src={advisors.find(a => a.id === topic.advisor)?.avatar} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{advisors.find(a => a.id === topic.advisor)?.name}</Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} xl={8}>
          <AdvisorCard advisorId={selectedAdvisor} advisors={advisors} />
          <RegistrationProcess status={status} />

          {/* Quick Rules */}
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginTop: 20, background: 'linear-gradient(135deg, #fffbe6, #fff7e0)' }} bodyStyle={{ padding: 18 }}>
            <Space size={8} style={{ marginBottom: 10 }}>
              <SafetyCertificateOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>Quy định đăng ký</Text>
            </Space>
            <ul style={{ paddingLeft: 20, margin: 0, color: '#595959', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Mỗi sinh viên chỉ được phép có 01 phiếu đăng ký hợp lệ.</li>
              <li>Giảng viên hướng dẫn có quyền từ chối nếu đề tài không phù hợp hoặc đã hết chỉ tiêu (Quota).</li>
              <li>Đề tài có thể được yêu cầu đổi tên trong quá trình xét duyệt của Hội đồng khoa.</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ThesisRegistrationPage;