import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Tag, Modal, Form, message, Spin } from 'antd';
import { FormOutlined, CheckCircleFilled, ExclamationCircleOutlined, SyncOutlined, SearchOutlined } from '@ant-design/icons';
import { useModel } from 'umi';
import { LecturerERD, TopicSuggestionERD } from '../../../types/AdminTypes/ThesisTypes';
import { ThesisStatus } from '../../../types/LecturerTypes/ThesisTypes';
import { thesisRegistrationService } from '../../../services/thesis';

import StudentStatusBanner from '../components/StudentStatusBanner';
import StudentHeader from '../components/StudentHeader';
import AdvisorCard from './components/AdvisorCard';
import RegistrationForm from './components/RegistrationForm';
import RegistrationProcess from './components/RegistrationProcess';

const { Title, Text } = Typography;

// ── CÔNG TẮC MOCK DATA ──────────────────────────────────────────────
const USE_MOCK_API = true;

const MOCK_MY_LECTURER: LecturerERD = {
  id: 1,
  name: 'PGS.TS. Nguyễn Văn An',
  email: 'nvan@ptit.edu.vn',
  quota: 2,
  maxQuota: 5,
  domains: ['AI', 'Data Science'],
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=An',
  role: 'lecturer',
};

const MOCK_TOPICS: TopicSuggestionERD[] = [
  {
    id: 101, session_id: 1, status: 'open', max_groups: 1,
    title: 'Hệ thống Quản lý Khóa luận Tốt nghiệp',
    description: 'Xây dựng quy trình quản lý, nộp bài và chấm điểm đồ án bằng ReactJS và Node.js',
    domain: 'Web Development', lecturer_id: 1,
  },
  {
    id: 102, session_id: 1, status: 'open', max_groups: 1,
    title: 'Phân tích dữ liệu bằng Python và Pandas',
    description: 'Ứng dụng Pandas để làm sạch và trực quan hóa dữ liệu lớn',
    domain: 'Data Science', lecturer_id: 1,
  },
];
// ────────────────────────────────────────────────────────────────────

const statusMeta: Record<ThesisStatus, any> = {
  not_registered: { label: 'Chưa đăng ký', color: '#8c8c8c', bg: '#fafafa', icon: <FormOutlined />, description: 'Bạn chưa nộp phiếu đăng ký đề tài nào.' },
  pending:        { label: 'Chờ xét duyệt', color: '#fa8c16', bg: '#fff7e6', icon: <SyncOutlined spin />, description: 'Phiếu đăng ký đang chờ Giảng viên và Bộ môn xét duyệt.' },
  approved:       { label: 'Đã duyệt đề tài', color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleFilled />, description: 'Đề tài của bạn đã được duyệt. Hãy bắt đầu thực hiện!' },
  rejected:       { label: 'Bị từ chối', color: '#ff4d4f', bg: '#fff2f0', icon: <ExclamationCircleOutlined />, description: 'Đề tài bị từ chối. Vui lòng xem lý do và đăng ký lại.' },
};

const ThesisRegistrationPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const [form] = Form.useForm();
  const [status, setStatus] = useState<ThesisStatus>('not_registered');
  const [myLecturer, setMyLecturer] = useState<LecturerERD | undefined>(undefined);
  const [suggestedTopics, setSuggestedTopics] = useState<TopicSuggestionERD[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysLeft = 14;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingInitial(true);

        if (USE_MOCK_API) {
          setTimeout(() => {
            setMyLecturer(MOCK_MY_LECTURER);
            setSuggestedTopics(MOCK_TOPICS);
            form.setFieldsValue({ lecturer_id: MOCK_MY_LECTURER.id });

            const draftData = localStorage.getItem('thesis_registration_draft');
            if (draftData && status === 'not_registered') {
              const parsedData = JSON.parse(draftData);
              form.setFieldsValue({ ...parsedData, lecturer_id: MOCK_MY_LECTURER.id });
            }
            setLoadingInitial(false);
          }, 800);
        } else {
          const lecturer = await thesisRegistrationService.getMyLecturer();
          const tops = await thesisRegistrationService.getSuggestedTopics();
          setMyLecturer(lecturer);
          setSuggestedTopics(tops);
          form.setFieldsValue({ lecturer_id: lecturer.id });

          const draftData = localStorage.getItem('thesis_registration_draft');
          if (draftData && status === 'not_registered') {
            const parsedData = JSON.parse(draftData);
            form.setFieldsValue({ ...parsedData, lecturer_id: lecturer.id });
          }
          setLoadingInitial(false);
        }
      } catch (error) {
        message.error('Không thể tải dữ liệu. Vui lòng thử lại.');
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, [form, status]);

  const handleSaveDraft = () => {
    localStorage.setItem('thesis_registration_draft', JSON.stringify(form.getFieldsValue()));
    message.success('Đã lưu nháp!');
  };

  const handleSelectSuggested = (topic: TopicSuggestionERD) => {
    form.setFieldsValue({
      title: topic.title,
      description: topic.description,
      domain: topic.domain,
      lecturer_id: myLecturer?.id,
      suggestion_id: topic.id,
    });
    message.success('Đã điền tự động thông tin từ gợi ý của Giảng viên!');
  };

  const handleFormSubmit = (values: any) => {
    Modal.confirm({
      title: 'Xác nhận nộp phiếu',
      content: 'Không thể sửa đổi thông tin sau khi nộp. Bạn có chắc chắn muốn gửi yêu cầu?',
      onOk: async () => {
        setIsSubmitting(true);
        if (USE_MOCK_API) {
          setTimeout(() => {
            localStorage.removeItem('thesis_registration_draft');
            setStatus('pending');
            message.success('Đã gửi phiếu đăng ký thành công!');
            setIsSubmitting(false);
          }, 1500);
        } else {
          // const payload = { ...values, student_id: currentUser?.id };
          // await thesisRegistrationService.submitRegistration(payload);
          localStorage.removeItem('thesis_registration_draft');
          setStatus('pending');
          message.success('Đã gửi phiếu đăng ký thành công!');
          setIsSubmitting(false);
        }
      },
    });
  };

  const meta = statusMeta[status];

  return (
    <Spin spinning={loadingInitial} tip="Đang tải dữ liệu...">
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 50%, #f2f8ff 100%)', padding: '24px', fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif" }}>
        
        {/* ── HEADER CHUẨN HÓA ── */}
        <StudentHeader />

        <StudentStatusBanner icon={meta.icon} label={meta.label} description={meta.description} color={meta.color} bg={meta.bg}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 800, color: '#1677ff', display: 'block' }}>{daysLeft}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>ngày tới hạn</Text>
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.06)' }} />
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 800, color: '#722ed1', display: 'block' }}>Học kỳ 2</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>Năm học 2025-2026</Text>
          </div>
        </StudentStatusBanner>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={16}>
            <RegistrationForm
              form={form}
              status={status}
              myLecturer={myLecturer}
              onSubmit={handleFormSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
            />

            {status === 'not_registered' && (
              <Card bordered={false} style={{ borderRadius: 16, border: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ marginBottom: 20 }}>
                  <SearchOutlined /> Gợi ý đề tài từ Giảng viên
                </Title>
                <Row gutter={[16, 16]}>
                  {suggestedTopics.map(topic => (
                    <Col xs={24} md={12} key={topic.id}>
                      <Card
                        style={{ borderRadius: 12, cursor: 'pointer', height: '100%' }}
                        hoverable
                        onClick={() => handleSelectSuggested(topic)}
                      >
                        <Tag color="blue">{topic.domain}</Tag>
                        <Text strong style={{ display: 'block', marginTop: 12 }}>{topic.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>{topic.description}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </Col>

          <Col xs={24} xl={8}>
            <AdvisorCard advisor={myLecturer} />
            <RegistrationProcess status={status} />
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default ThesisRegistrationPage;