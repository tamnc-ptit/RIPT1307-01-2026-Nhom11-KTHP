import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Tag, Modal, Form, message, Spin } from 'antd';
import { FormOutlined, CheckCircleFilled, ExclamationCircleOutlined, SyncOutlined, SearchOutlined } from '@ant-design/icons';
import { useModel, request } from 'umi';
import { LecturerERD, TopicSuggestionERD, ThesisStatus } from '../../../types/StudentTypes/RegistrationTypes';
import { thesisRegistrationService } from '../../../services/thesis';

import StudentStatusBanner from '../components/StudentStatusBanner';
import StudentHeader from '../components/StudentHeader';
import AdvisorCard from './components/AdvisorCard';
import RegistrationForm from './components/RegistrationForm';
import RegistrationProcess from './components/RegistrationProcess';

const { Title, Text } = Typography;

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
        const token = localStorage.getItem('token');

        // 1. Kiểm tra trạng thái đăng ký thực tế từ Backend (chỉ gọi khi có token)
        let actualStatus: ThesisStatus = 'not_registered';
        if (token) {
          try {
            const dashboardRes = await request('/api/student/dashboard', {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` }
            });
            actualStatus = dashboardRes?.data?.status || dashboardRes?.status || 'not_registered';
            setStatus(actualStatus);
          } catch (err) {
            console.error("Lỗi khi kiểm tra trạng thái đề tài:", err);
          }
        }

        // 2. Tải danh sách giảng viên và gợi ý
        const lecturers = await thesisRegistrationService.getLecturers();
        const firstLecturer = lecturers[0]; 
    
        const tops = await thesisRegistrationService.getSuggestedTopics(firstLecturer?.id);
        
        setMyLecturer(firstLecturer);
        setSuggestedTopics(tops);
        
        if (firstLecturer) {
            form.setFieldsValue({ lecturer_id: firstLecturer.id });
        }

        // 3. Chỉ điền bản nháp nếu sinh viên THỰC SỰ chưa đăng ký
        const draftData = localStorage.getItem('thesis_registration_draft');
        if (draftData && actualStatus === 'not_registered') {
          const parsedData = JSON.parse(draftData);
          form.setFieldsValue({ ...parsedData, lecturer_id: firstLecturer?.id });
        }
        
      } catch (error) {
        message.error('Không thể tải dữ liệu ban đầu. Vui lòng thử lại.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, [form]);

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
    console.log(">>> Dữ liệu form lấy được:", values);

    // Lấy ID tài khoản thực tế đang đăng nhập hệ thống
    const studentId = currentUser?.id;

    if (!studentId) {
      message.error("Lỗi: Không tìm thấy thông tin tài khoản! Vui lòng Đăng xuất và Đăng nhập lại.");
      return;
    }

    Modal.confirm({
      title: 'Xác nhận nộp phiếu',
      content: 'Không thể sửa đổi thông tin sau khi nộp. Bạn có chắc chắn muốn gửi yêu cầu?',
      onOk: async () => {
        setIsSubmitting(true);
        try {
          // Gửi dữ liệu đi kèm ID chính xác của sinh viên hiện tại
          const payload = { 
              ...values, 
              student_id: studentId,
              session_id: 1 
          };
          
          console.log(">>> Payload chuẩn bị bắn xuống Backend:", payload);
          
          const response = await thesisRegistrationService.submitRegistration(payload);
          console.log(">>> Kết quả trả về từ Backend:", response);
          
          localStorage.removeItem('thesis_registration_draft');
          setStatus('pending');
          message.success('Đã gửi phiếu đăng ký thành công!');
        } catch (error: any) {
          console.error(">>> LỖI GỬI FORM (CHI TIẾT):", error);
          const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi nộp phiếu!';
          message.error(errorMsg);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const meta = statusMeta[status];

  return (
    <Spin spinning={loadingInitial} tip="Đang tải dữ liệu...">
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 50%, #f2f8ff 100%)', padding: '24px', fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif" }}>
        
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
                        <Tag color="blue">{topic.domain || 'Đề tài'}</Tag>
                        <Text strong style={{ display: 'block', marginTop: 12 }}>{topic.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>{topic.description}</Text>
                      </Card>
                    </Col>
                  ))}
                  {suggestedTopics.length === 0 && (
                      <Col span={24}>
                          <Text type="secondary">Chưa có đề tài gợi ý nào từ giảng viên này.</Text>
                      </Col>
                  )}
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