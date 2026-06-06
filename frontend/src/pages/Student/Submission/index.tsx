import StudentStatusBanner from '../components/StudentStatusBanner';
import StudentHeader from '../components/StudentHeader';
import React, { useState, useEffect } from 'react';
import { useParams, useModel } from 'umi'; 
import {
  Row, Col, Card, Typography, Button, Upload, Tag, Space,
  Tooltip, Timeline, Modal, Badge, Progress,
  Alert, message, Spin
} from 'antd';
import {
  CloudUploadOutlined, FileDoneOutlined, CheckCircleFilled, WarningOutlined,
  ClockCircleOutlined, EyeOutlined, DownloadOutlined, HistoryOutlined,
  SafetyCertificateOutlined, CheckOutlined, ReloadOutlined, 
  LockOutlined, SyncOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

import { ISubmission, SubmissionStatus } from '../../../types/LecturerTypes/SubmissionTypes';
import { getSubmissionsByMilestone, submitMilestone } from '../../../services/submission';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const SubmissionPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const params = useParams<{ thesisId: string; milestoneId: string }>();
  
  const thesisId = Number(params.thesisId);
  const milestoneId = Number(params.milestoneId);

  const { initialState } = useModel('@@initialState');
  const studentId = initialState?.currentUser?.id || Number(localStorage.getItem('userId')) || 5;



  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<ISubmission[]>([]);
  const [detailModal, setDetailModal] = useState<ISubmission | null>(null);

  const [checklist, setChecklist] = useState([
    { id: '1', label: 'File PDF đúng định dạng', done: true, required: true },
    { id: '2', label: 'Đã kiểm tra đạo văn < 20%', done: false, required: true },
  ]);

  const fetchSubmissionHistory = async () => {
    if (!thesisId || !milestoneId || isNaN(thesisId) || isNaN(milestoneId)) {
      setLoadingInitial(false);
      return;
    }
    
    try {
      setLoadingInitial(true);
      const res = await getSubmissionsByMilestone(milestoneId, thesisId);
      if (res && res.data) {
        setHistory(res.data);
      }
    } catch (error) {
      messageApi.error('Không thể tải lịch sử nộp bài!');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchSubmissionHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId, milestoneId]);

  const executeApiSubmit = async () => {
    try {
      setIsSubmitting(true);
      const primaryFile = fileList[0].originFileObj as File;

      const uploadedUrl = `/uploads/thesis${thesisId}/std${studentId}_${primaryFile.name}`;

      const payload = {
        milestone_id: milestoneId,
        thesis_id: thesisId,
        student_id: studentId,
        file_name: primaryFile.name,
        file_url: uploadedUrl,
        note: 'Sinh viên nộp báo cáo qua hệ thống Workspace'
      };

      const res = await submitMilestone(payload);
      if (res) {
        messageApi.success('Nộp bài thành công!');
        setFileList([]);
        setConfirmModal(false);
        fetchSubmissionHistory();
      }
    } catch (error) {
      messageApi.error('Lỗi hệ thống khi nộp bài. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUIStatus = () => {
    if (history.length === 0) return { label: 'Chưa nộp', color: '#8c8c8c', bg: '#f5f5f5', icon: <CloudUploadOutlined /> };
    const latest = history[0];
    if (latest.status === SubmissionStatus.SUBMITTED) return { label: 'Đã nộp - Chờ chấm', color: '#1677ff', bg: '#e6f4ff', icon: <SyncOutlined spin /> };
    if (latest.status === SubmissionStatus.GRADED) return { label: 'Đã có điểm', color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleFilled /> };
    return { label: 'Nộp muộn', color: '#ff4d4f', bg: '#fff2f0', icon: <WarningOutlined /> };
  };

  const statusMeta = getUIStatus();

  const currentSubmissionId = history.length > 0 ? (history[0].id || (history[0] as any).submission_id) : null;

  return (
    <Spin spinning={loadingInitial}>
      {contextHolder}
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        <StudentHeader />
        
        <StudentStatusBanner 
          label={statusMeta.label} 
          color={statusMeta.color} 
          bg={statusMeta.bg} 
          icon={statusMeta.icon}
          description={`Mã đề tài: ${thesisId} | Mã đợt nộp: ${milestoneId}`}
        />

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          {/* CỘT TRÁI: NỘP BÀI VÀ LỊCH SỬ */}
          <Col xs={24} lg={16}>
            <Card title="Tài liệu bài làm" variant="borderless" style={{ borderRadius: 12 }}>
              {statusMeta.label === 'Đã có điểm' ? (
                <Alert message="Bạn đã hoàn thành đợt nộp này." type="success" showIcon />
              ) : (
                <Dragger
                  name="file"
                  multiple={false}
                  fileList={fileList}
                  beforeUpload={(file) => {
                    setFileList([{ ...file, uid: '-1', name: file.name, status: 'done', originFileObj: file } as any]);
                    return false;
                  }}
                  onRemove={() => setFileList([])}
                >
                  <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
                  <p className="ant-upload-text">Nhấp hoặc kéo tệp vào khu vực này để nộp bài</p>
                  <p className="ant-upload-hint">Hỗ trợ PDF, ZIP, DOCX. Tối đa 50MB.</p>
                </Dragger>
              )}
              
              <Button 
                type="primary" 
                block 
                size="large" 
                disabled={fileList.length === 0 || statusMeta.label === 'Đã có điểm'} 
                onClick={() => setConfirmModal(true)}
                style={{ marginTop: 20, height: 45, borderRadius: 8 }}
              >
                Xác nhận gửi bài làm
              </Button>
            </Card>

            <Card title="Lịch sử nộp bài" style={{ marginTop: 20, borderRadius: 12 }}>
              <Timeline 
                mode="left"
                items={history.map((item, idx) => ({
                  label: new Date(item.submitted_at).toLocaleDateString(),
                  children: (
                    <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 8, border: '1px solid #eee' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>{item.file_name}</Text>
                          {item.score !== undefined && item.score !== null && <Tag color="green">{item.score} điểm</Tag>}
                        </div>
                        <Button size="small" icon={<DownloadOutlined />} onClick={() => window.open(item.file_url)}>Tải bản nộp</Button>
                      </Space>
                    </div>
                  )
                }))}
              />
            </Card>
          </Col>

          {/* CỘT PHẢI: CHECKLIST VÀ COMMENT */}
          <Col xs={24} lg={8}>
            <Card title="Checklist bắt buộc" variant="borderless" style={{ borderRadius: 12 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                   <Badge status={item.done ? "success" : "error"} />
                   <Text delete={item.done}>{item.label}</Text>
                </div>
              ))}
            </Card>

           
          </Col>
        </Row>

        <Modal
          title="Xác nhận nộp bài"
          open={confirmModal}
          onOk={executeApiSubmit}
          confirmLoading={isSubmitting}
          onCancel={() => setConfirmModal(false)}
        >
          <p>Hệ thống sẽ lưu vết bản nộp: <b>{fileList[0]?.name}</b></p>
          <p>Bạn chắc chắn muốn nộp chứ?</p>
        </Modal>
      </div>
    </Spin>
  );
};

export default SubmissionPage;