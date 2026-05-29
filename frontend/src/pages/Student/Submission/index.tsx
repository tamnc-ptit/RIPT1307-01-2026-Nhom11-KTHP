import StudentStatusBanner from '../components/StudentStatusBanner';
import StudentHeader from '../components/StudentHeader';
import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Typography, Button, Upload, Tag, Space,
  Tooltip, Timeline, Modal, Badge, Progress,
  Alert, message, Spin
} from 'antd';
import {
  CloudUploadOutlined, FileDoneOutlined, CheckCircleFilled,
  ClockCircleOutlined, FilePdfOutlined, EyeOutlined, DownloadOutlined, HistoryOutlined,
  SafetyCertificateOutlined, CheckOutlined, ReloadOutlined, FileTextOutlined, WarningOutlined,
  RocketOutlined, LockOutlined, FileZipOutlined, SyncOutlined, TrophyOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

import { ISubmission, SubmissionStatus } from '../../../types/LecturerTypes/SubmissionTypes';
import { getSubmissionsByMilestone, submitMilestone } from '../../../services/submission';

const { Title, Text } = Typography;
const { Dragger } = Upload;

// =====================================================================
// 🟢 CÔNG TẮC MOCK DATA
// =====================================================================
const USE_MOCK_API = true;

const mockSubmissionsList: ISubmission[] = [
  {
    id: 1, milestone_id: 5, thesis_id: 101,
    file_name: 'BaoCao_TienDo_Lan1.pdf', file_size: 4500000,
    file_url: '#', note: 'Em nộp bản nháp để cô xem qua cấu trúc', score: 6.5,
    status: SubmissionStatus.GRADED, submitted_at: '2026-05-15T09:15:00', graded_at: '2026-05-16T10:00:00'
  },
  {
    id: 2, milestone_id: 5, thesis_id: 101,
    file_name: 'KhoaLuan_NguyenVanA_Final.pdf', file_size: 6100000,
    file_url: '#', note: 'Đã sửa lại format theo yêu cầu', score: undefined,
    status: SubmissionStatus.SUBMITTED, submitted_at: new Date().toISOString(),
  }
];
// =====================================================================

type UIStatus = 'not_submitted' | 'submitted' | 'graded_failed' | 'graded_passed' | 'late';
type ChecklistItem = { id: string; label: string; done: boolean; required: boolean };

const mockCouncil = {
  date: 'Thứ Sáu, 27/06/2026',
  time: '08:30 – 10:00',
};

const initialChecklist: ChecklistItem[] = [
  { id: 'format',     label: 'File PDF đúng định dạng theo mẫu của trường',          done: true,  required: true },
  { id: 'signature',  label: 'Có chữ ký xác nhận của Giảng viên hướng dẫn',          done: true,  required: true },
  { id: 'plagiarism', label: 'Báo cáo kiểm tra đạo văn (plagiarism < 25%)',           done: false, required: true },
  { id: 'abstract',   label: 'Có tóm tắt tiếng Anh (Abstract)',                       done: true,  required: true },
];

// ===================== UTILS =====================
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getDerivedUIStatus = (history: ISubmission[]): UIStatus => {
  if (history.length === 0) return 'not_submitted';
  const latest = history[history.length - 1];
  if (latest.status === 'submitted') return 'submitted';
  if (latest.status === 'late') return 'late';
  if (latest.status === 'graded') {
    return (latest.score !== undefined && latest.score !== null && latest.score >= 5.0) ? 'graded_passed' : 'graded_failed';
  }
  return 'not_submitted';
};

const uiStatusMeta: Record<UIStatus, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  not_submitted: { label: 'Chưa nộp',                   color: '#8c8c8c', bg: '#fafafa',  icon: <CloudUploadOutlined />,   description: 'Bạn chưa nộp bất kỳ phiên bản nào.' },
  submitted:     { label: 'Chờ xét duyệt',              color: '#fa8c16', bg: '#fff7e6',  icon: <SyncOutlined spin />,      description: 'Bản nộp đang chờ giảng viên hướng dẫn chấm/nhận xét.' },
  graded_failed: { label: 'Cần chỉnh sửa',              color: '#ff4d4f', bg: '#fff2f0',  icon: <WarningOutlined />,        description: 'Giảng viên yêu cầu chỉnh sửa trước khi nộp lại.' },
  graded_passed: { label: 'Đã duyệt / Sẵn sàng bảo vệ',color: '#52c41a', bg: '#f6ffed',  icon: <CheckCircleFilled />,      description: 'Bản nộp đã đạt yêu cầu. Chờ lịch bảo vệ.' },
  late:          { label: 'Nộp muộn',                   color: '#ff4d4f', bg: '#fff2f0',  icon: <ClockCircleOutlined />,    description: 'Hệ thống ghi nhận bạn đã nộp bài sau thời gian quy định.' },
};

const calculateCountdown = (dateStr: string, timeStr: string) => {
  try {
    const datePart = dateStr.split(',')[1]?.trim();
    const timePart = timeStr.split('–')[0]?.trim();
    if (!datePart || !timePart) return { days: '00', hours: '00', minutes: '00', totalDays: 0 };
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    const targetDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;
    if (diff <= 0) return { days: '00', hours: '00', minutes: '00', totalDays: 0 };
    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days: String(days).padStart(2, '0'), hours: String(hours).padStart(2, '0'), minutes: String(minutes).padStart(2, '0'), totalDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) };
  } catch {
    return { days: '00', hours: '00', minutes: '00', totalDays: 0 };
  }
};

// ===================== SUB-COMPONENTS =====================
const SubmissionChecklist: React.FC<{ items: ChecklistItem[]; onChange: (id: string) => void }> = ({ items, onChange }) => {
  const requiredDone  = items.filter(i => i.required && i.done).length;
  const requiredTotal = items.filter(i => i.required).length;
  const pct = Math.round((requiredDone / requiredTotal) * 100);

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20 }} bodyStyle={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #52c41a, #73d13d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 16 }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>Checklist trước khi nộp</Text>
          <div><Text style={{ fontSize: 12, color: '#8c8c8c' }}>{requiredDone}/{requiredTotal} điều kiện bắt buộc</Text></div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Progress type="circle" percent={pct} size={44} strokeColor={pct === 100 ? '#52c41a' : '#1677ff'} strokeWidth={8} format={(p) => <span style={{ fontSize: 11, fontWeight: 700 }}>{p}%</span>} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} onClick={() => onChange(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: item.done ? '#f6ffed' : '#fafafa', border: `1.5px solid ${item.done ? '#b7eb8f' : '#f0f0f0'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s ease' }} className="checklist-item-hover">
            <div style={{ width: 22, height: 22, borderRadius: 6, background: item.done ? '#52c41a' : '#fff', border: `2px solid ${item.done ? '#52c41a' : '#d9d9d9'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
              {item.done && <CheckOutlined style={{ color: '#fff', fontSize: 11 }} />}
            </div>
            <Text style={{ fontSize: 13, flex: 1, color: item.done ? '#389e0d' : '#595959' }}>{item.label}</Text>
            {item.required && <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0, background: '#fff2f0', color: '#ff4d4f', border: '1px solid #ffccc7', padding: '0 5px' }}>Bắt buộc</Tag>}
          </div>
        ))}
      </div>
    </Card>
  );
};

const UploadZone: React.FC<{
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  uiStatus: UIStatus;
  onSubmit: () => void;
  checklistOk: boolean;
  history: ISubmission[];
}> = ({ fileList, setFileList, uiStatus, onSubmit, checklistOk, history }) => {
  const [isDragging, setIsDragging] = useState(false);
  const hasFile = fileList.length > 0;

  const props: UploadProps = {
    name: 'file', multiple: true, maxCount: 2, accept: '.pdf,.zip,.docx', fileList,
    beforeUpload: (file) => {
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) { message.error(`File ${file.name} vượt quá 50MB!`); return Upload.LIST_IGNORE; }
      setFileList(prev => {
        const filtered = prev.filter(f => f.name !== file.name);
        return [...filtered, { ...file, uid: file.uid, name: file.name, size: file.size, status: 'done', originFileObj: file } as UploadFile].slice(-2);
      });
      return false;
    },
    onRemove: (file) => setFileList(prev => prev.filter(f => f.uid !== file.uid)),
    onDrop: () => setIsDragging(false),
  };

  const isLocked = uiStatus === 'submitted' || uiStatus === 'graded_passed';

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20, background: isLocked ? 'linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%)' : 'rgba(255,255,255,0.97)' }} bodyStyle={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: isLocked ? 'linear-gradient(135deg, #1677ff, #4096ff)' : 'linear-gradient(135deg, #13c2c2, #36cfc9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLocked ? <LockOutlined style={{ color: '#fff', fontSize: 16 }} /> : <CloudUploadOutlined style={{ color: '#fff', fontSize: 16 }} />}
        </div>
        <div>
          <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>{isLocked ? 'Đã nộp thành công / Chờ bảo vệ' : 'Tải lên tài liệu'}</Text>
          <div><Text style={{ fontSize: 12, color: '#8c8c8c' }}>{isLocked ? 'Hệ thống đã khóa tải lên để chờ xét duyệt' : 'Tải lên tối đa 2 file (PDF báo cáo & ZIP mã nguồn) • Max 50MB/file'}</Text></div>
        </div>
      </div>

      {isLocked && history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#f0f7ff', border: '1px solid #b7eb8f', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Space size={12}>
              {history[history.length - 1].file_name.endsWith('.zip') ? <FileZipOutlined style={{ fontSize: 28, color: '#fa8c16' }} /> : <FilePdfOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />}
              <div>
                <Text strong style={{ fontSize: 14, color: '#1677ff', display: 'block' }}>{history[history.length - 1].file_name}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Nộp lúc: {formatDate(history[history.length - 1].submitted_at)} • {formatBytes(history[history.length - 1].file_size)}</Text>
              </div>
            </Space>
            <Space>
              <Button size="small" type="primary" ghost icon={<DownloadOutlined />} style={{ borderRadius: 6 }} onClick={() => window.open(history[history.length - 1].file_url, '_blank')}>Tải về</Button>
            </Space>
          </div>
        </div>
      ) : (
        <>
          <style>{`
            .upload-zone .ant-upload-drag { background: ${isDragging ? 'linear-gradient(135deg, #e6f4ff, #d6eaff) !important' : 'linear-gradient(135deg, #f8fcff 0%, #f0f9ff 100%) !important'} border: 2px dashed ${isDragging ? '#1677ff' : '#91caff'} !important; border-radius: 14px !important; transition: all 0.3s ease !important; padding: 28px 20px !important; }
            .upload-zone .ant-upload-drag:hover { border-color: #1677ff !important; background: linear-gradient(135deg, #e6f4ff, #d9ecff) !important; box-shadow: 0 0 0 4px rgba(22,119,255,0.1) !important; }
          `}</style>
          <div className="upload-zone" onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)}>
            <Dragger {...props}>
              <CloudUploadOutlined style={{ fontSize: 44, color: isDragging ? '#1677ff' : '#91caff', display: 'block', transition: 'all 0.3s' }} />
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', display: 'block', marginTop: 10 }}>{isDragging ? 'Thả các file vào đây...' : 'Kéo thả hoặc click để chọn tài liệu'}</Text>
            </Dragger>
          </div>

          {uiStatus === 'graded_failed' && (
            <Alert type="warning" showIcon icon={<WarningOutlined />} message="Cần chỉnh sửa" description="Giảng viên yêu cầu bạn chỉnh sửa và nộp lại. Xem phản hồi ở lịch sử bên dưới." style={{ borderRadius: 10, marginTop: 14 }} />
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Tooltip title={!checklistOk ? 'Hoàn tất các mục bắt buộc trong checklist trước' : ''}>
              <Button type="primary" size="large" icon={<FileDoneOutlined />} disabled={!hasFile || !checklistOk} onClick={onSubmit} style={{ borderRadius: 10, height: 44, paddingInline: 24, background: hasFile && checklistOk ? 'linear-gradient(135deg, #52c41a, #73d13d)' : undefined, border: 'none', fontWeight: 700, boxShadow: hasFile && checklistOk ? '0 4px 12px rgba(82,196,26,0.35)' : undefined, transition: 'all 0.25s' }}>
                Xác nhận nộp bài
              </Button>
            </Tooltip>
          </div>
        </>
      )}
    </Card>
  );
};

const SubmissionHistory: React.FC<{ history: ISubmission[] }> = ({ history }) => {
  const [detailModal, setDetailModal] = useState<ISubmission | null>(null);

  return (
    <>
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }} bodyStyle={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #722ed1, #9254de)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HistoryOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>Lịch sử nộp bài</Text>
          <Badge count={history.length} style={{ marginLeft: 4, background: '#722ed1' }} />
        </div>

        <Timeline items={history.map((h, i) => {
          const isLatest  = i === history.length - 1;
          const isPassed  = h.status === 'graded' && h.score !== undefined && h.score >= 5;
          const isPending = h.status === 'submitted';
          let circleColor = isPassed ? 'linear-gradient(135deg, #52c41a, #73d13d)' : 'linear-gradient(135deg, #ff7a45, #ff4d4f)';
          if (isPending) circleColor = 'linear-gradient(135deg, #1677ff, #4096ff)';

          return {
            dot: (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLatest ? `0 0 0 4px ${isPassed ? '#f6ffed' : (isPending ? '#e6f4ff' : '#fff2f0')}` : 'none' }}>
                {isPassed ? <CheckOutlined style={{ color: '#fff', fontSize: 13 }} /> : (isPending ? <SyncOutlined style={{ color: '#fff', fontSize: 13 }} /> : <ReloadOutlined style={{ color: '#fff', fontSize: 13 }} />)}
              </div>
            ),
            children: (
              <div style={{ background: isLatest ? (isPassed ? '#f6ffed' : (isPending ? '#f0f7ff' : '#fff2f0')) : '#fafafa', border: `1.5px solid ${isLatest ? (isPassed ? '#b7eb8f' : (isPending ? '#91caff' : '#ffccc7')) : '#f0f0f0'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 4, transition: 'all 0.2s' }}>
                <Row justify="space-between" align="top" wrap={false} gutter={8}>
                  <Col flex="auto" style={{ minWidth: 0 }}>
                    <Space size={6} wrap>
                      <Tag color={isPassed ? 'success' : (isPending ? 'processing' : 'error')} style={{ borderRadius: 5, fontWeight: 700, fontSize: 11 }}>Lần {i + 1}</Tag>
                      <Text strong style={{ fontSize: 13 }}>{h.file_name}</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Space size={10} wrap>
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(h.submitted_at)}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatBytes(h.file_size)}</Text>
                        {h.score !== undefined && <Text strong style={{ fontSize: 11, color: isPassed ? '#52c41a' : '#ff4d4f' }}>Điểm: {h.score}</Text>}
                      </Space>
                    </div>
                    {h.note && (
                      <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 7, borderLeft: `3px solid ${isPassed ? '#52c41a' : '#ff4d4f'}` }}>
                        <Text style={{ fontSize: 12, color: '#595959' }}>{h.note}</Text>
                      </div>
                    )}
                  </Col>
                  <Col style={{ flexShrink: 0 }}>
                    <Space direction="vertical" size={4}>
                      <Tooltip title="Xem chi tiết"><Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 7 }} onClick={() => setDetailModal(h)} /></Tooltip>
                      <Tooltip title="Tải file"><Button size="small" icon={<DownloadOutlined />} style={{ borderRadius: 7 }} onClick={() => window.open(h.file_url, '_blank')} /></Tooltip>
                    </Space>
                  </Col>
                </Row>
              </div>
            ),
          };
        })} />
      </Card>

      <Modal open={!!detailModal} onCancel={() => setDetailModal(null)} footer={null} title={<Space><FileTextOutlined /><Text strong>Chi tiết nộp bài</Text></Space>} width={520} styles={{ content: { borderRadius: 16 } }}>
        {detailModal && (
          <div>
            <div style={{ background: '#fafafa', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <Row gutter={16}>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>File</Text><div><Text strong style={{ fontSize: 13 }}>{detailModal.file_name}</Text></div></Col>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>Nộp lúc</Text><div><Text strong style={{ fontSize: 13 }}>{formatDate(detailModal.submitted_at)}</Text></div></Col>
              </Row>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú / Nhận xét:</Text>
            <div style={{ marginTop: 8, padding: '12px 14px', background: detailModal.score && detailModal.score >= 5 ? '#f6ffed' : (detailModal.status === 'submitted' ? '#f0f7ff' : '#fff2f0'), border: `1.5px solid ${detailModal.score && detailModal.score >= 5 ? '#b7eb8f' : (detailModal.status === 'submitted' ? '#91caff' : '#ffccc7')}`, borderRadius: 10 }}>
              <Text style={{ fontSize: 13, color: '#1a1a2e' }}>{detailModal.note || 'Chưa có ghi chú.'}</Text>
            </div>
            <div style={{ marginTop: 14, textAlign: 'right' }}><Button onClick={() => setDetailModal(null)} style={{ borderRadius: 8 }}>Đóng</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ===================== MAIN COMPONENT =====================
const SubmissionPage: React.FC = () => {
  const [fileList, setFileList]       = useState<UploadFile[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [checklist, setChecklist]     = useState<ChecklistItem[]>(initialChecklist);
  const [history, setHistory]         = useState<ISubmission[]>([]);
  const [council]                     = useState(mockCouncil);
  const [countdown, setCountdown]     = useState({ days: '00', hours: '00', minutes: '00', totalDays: 0 });

  const fetchSubmissionHistory = async () => {
    try {
      setLoadingInitial(true);
      if (USE_MOCK_API) {
        setTimeout(() => { setHistory(mockSubmissionsList); setLoadingInitial(false); }, 800);
      } else {
        const res = await getSubmissionsByMilestone(5);
        if (res?.success && res.data) setHistory(res.data);
        setLoadingInitial(false);
      }
    } catch {
      message.error('Lỗi kết nối: Không thể tải lịch sử nộp bài!');
      setLoadingInitial(false);
    }
  };

  useEffect(() => { fetchSubmissionHistory(); }, []);

  useEffect(() => {
    const updateTime = () => setCountdown(calculateCountdown(council.date, council.time));
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [council.date, council.time]);

  const toggleChecklistItem = (id: string) => setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  const requiredOk = checklist.filter(i => i.required && !i.done).length === 0;
  const uiStatus   = getDerivedUIStatus(history);
  const meta       = uiStatusMeta[uiStatus];

  const handleFinalSubmit = () => {
    if (!requiredOk)          { message.error('Hoàn tất tất cả mục bắt buộc trước!'); return; }
    if (fileList.length === 0) { message.error('Vui lòng chọn tài liệu!'); return; }
    setConfirmModal(true);
  };

  const executeApiSubmit = async () => {
    try {
      setIsSubmitting(true);
      const primaryFile = fileList[0].originFileObj as File;

      if (USE_MOCK_API) {
        setTimeout(() => {
          const newMock: ISubmission = {
            id: Date.now(), milestone_id: 5, thesis_id: 101,
            file_name: primaryFile.name, file_size: primaryFile.size,
            file_url: '#', note: 'File vừa nộp (Mock)',
            status: SubmissionStatus.SUBMITTED, submitted_at: new Date().toISOString(),
          };
          setHistory(prev => [...prev, newMock]);
          message.success({ content: 'Nộp bài thành công (Dữ liệu Mock)', duration: 4 });
          setFileList([]); setConfirmModal(false); setIsSubmitting(false);
        }, 1500);
      } else {
        const res = await submitMilestone(5, 101, primaryFile, 'Sinh viên nộp bài báo cáo');
        if (res?.success) {
          message.success({ content: 'Nộp bài thành công! Vui lòng chờ giảng viên đánh giá.', duration: 5 });
          setFileList([]); setConfirmModal(false);
          fetchSubmissionHistory();
        }
        setIsSubmitting(false);
      }
    } catch {
      message.error('Có lỗi xảy ra trong quá trình upload file. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  return (
    <Spin spinning={loadingInitial} tip="Đang tải dữ liệu...">
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 50%, #f2f8ff 100%)', padding: '24px', fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .checklist-item-hover:hover { transform: translateX(3px); box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
          .ant-timeline-item-tail { border-inline-start: 2px dashed #e8e8e8 !important; }
          * { box-sizing: border-box; }
        `}</style>

        {/* ── HEADER CHUẨN HÓA – xóa Page Header cũ ── */}
        <StudentHeader />

        <StudentStatusBanner icon={meta.icon} label={meta.label} description={meta.description} color={meta.color} bg={meta.bg}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 800, color: countdown.totalDays <= 7 ? '#ff4d4f' : '#1677ff', display: 'block', lineHeight: 1.1 }}>{countdown.totalDays}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>ngày còn lại</Text>
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.06)' }} />
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 800, color: '#722ed1', display: 'block', lineHeight: 1.1 }}>{history.length}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>lần nộp</Text>
          </div>
        </StudentStatusBanner>

        <Row gutter={[20, 20]}>
          <Col span={24}>
            <SubmissionChecklist items={checklist} onChange={toggleChecklistItem} />
            <UploadZone fileList={fileList} setFileList={setFileList} uiStatus={uiStatus} onSubmit={handleFinalSubmit} checklistOk={requiredOk} history={history} />
            <SubmissionHistory history={history} />
          </Col>
        </Row>

        <Modal open={confirmModal} onCancel={() => !isSubmitting && setConfirmModal(false)} closable={!isSubmitting} maskClosable={!isSubmitting} footer={null} width={460} styles={{ content: { borderRadius: 16, padding: 0, overflow: 'hidden' } }} centered>
          <div style={{ background: 'linear-gradient(135deg, #0a0f2c, #0d1b4b)', padding: '28px 28px 0', textAlign: 'center' }}>
            <TrophyOutlined style={{ fontSize: 52, color: '#ffd700' }} />
            <Title level={4} style={{ color: '#fff', marginTop: 10 }}>Xác nhận nộp bài</Title>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Sau khi nộp, hệ thống sẽ lưu vết phiên bản này.</Text>
            <div style={{ height: 24 }} />
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {fileList.map((file, i) => (
                <div key={i} style={{ background: '#f6ffed', border: '1.5px solid #b7eb8f', borderRadius: 10, padding: '10px 14px' }}>
                  <Space size={8}>
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{file.name}</Text>
                      <div><Text type="secondary" style={{ fontSize: 11 }}>{file.size ? formatBytes(file.size) : 'Sẵn sàng'} • Sẵn sàng ✓</Text></div>
                    </div>
                  </Space>
                </div>
              ))}
            </div>
            <Row gutter={10}>
              <Col span={12}>
                <Button disabled={isSubmitting} block style={{ borderRadius: 10, height: 42 }} onClick={() => setConfirmModal(false)}>Hủy</Button>
              </Col>
              <Col span={12}>
                <Button loading={isSubmitting} type="primary" block onClick={executeApiSubmit} style={{ borderRadius: 10, height: 42, background: 'linear-gradient(135deg, #52c41a, #73d13d)', border: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(82,196,26,0.35)' }}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi bài lên hệ thống'}
                </Button>
              </Col>
            </Row>
          </div>
        </Modal>
      </div>
    </Spin>
  );
};

export default SubmissionPage;