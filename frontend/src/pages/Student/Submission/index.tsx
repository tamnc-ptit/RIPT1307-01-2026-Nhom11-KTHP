// src/pages/Student/Submission/index.tsx
import StudentStatusBanner from '../components/StudentStatusBanner';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Row, Col, Card, Typography, Button, Upload, Tag, Space, Avatar,
  Tooltip, Steps, Modal, Form, Input, Select, DatePicker, Divider,
  Timeline, Badge, Progress, Drawer, List, Alert, Statistic, Result,
  message, Popconfirm,
} from 'antd';
import {
  CloudUploadOutlined, FileDoneOutlined, CheckCircleFilled, CalendarOutlined,
  ClockCircleOutlined, EnvironmentOutlined, TeamOutlined, UserOutlined,
  ExclamationCircleOutlined, FilePdfOutlined, DeleteOutlined, EyeOutlined,
  DownloadOutlined, HistoryOutlined, BellOutlined, StarFilled, TrophyOutlined,
  SafetyCertificateOutlined, InfoCircleOutlined, PaperClipOutlined,
  CheckOutlined, CloseOutlined, ReloadOutlined, FileTextOutlined,
  WarningOutlined, RocketOutlined, FireOutlined, ThunderboltOutlined,
  SendOutlined, LockOutlined, UnlockOutlined, LinkOutlined,
  FileZipOutlined, SyncOutlined, ArrowRightOutlined, FileOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

// ===================== TYPES =====================
type SubmissionStatus = 'not_submitted' | 'pending_review' | 'revision_needed' | 'approved' | 'final_submitted';
type ChecklistItem = { id: string; label: string; done: boolean; required: boolean };

// ===================== MOCK DATA =====================
const mockCouncil = {
  date: 'Thứ Sáu, 27/06/2025',
  time: '08:30 – 10:00',
  room: 'Phòng B4.01, Tòa nhà B',
  address: 'Trường Đại học ABC, 123 Nguyễn Văn Cừ, Q.5, TP.HCM',
  members: [
    { name: 'PGS.TS. Nguyễn Văn An', role: 'Chủ tịch hội đồng', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=An', email: 'nvantam@abc.edu.vn' },
    { name: 'TS. Trần Thị Bình', role: 'Phản biện 1', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Binh', email: 'ttbinh@abc.edu.vn' },
    { name: 'ThS. Lê Minh Cường', role: 'Phản biện 2', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Chi', email: 'lmcuong@abc.edu.vn' },
    { name: 'Cô Phạm Thị Khánh', role: 'GVHD (Thư ký)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', email: 'ptkhanh@abc.edu.vn' },
  ],
};

const mockHistory = [
  { version: 'v1.0', fileName: 'KhoaLuan_NguyenVanA_v1.pdf', size: '4.2 MB', date: '01/06/2025 09:15', status: 'revision_needed', feedback: 'Cần bổ sung thêm chương 3, phần thực nghiệm còn sơ sài.', fileUrl: '#' },
  { version: 'v2.0', fileName: 'KhoaLuan_NguyenVanA_v2.pdf', size: '5.8 MB', date: '10/06/2025 14:30', status: 'revision_needed', feedback: 'Chỉnh lại format tài liệu tham khảo theo chuẩn IEEE.', fileUrl: '#' },
  { version: 'v3.0', fileName: 'KhoaLuan_NguyenVanA_v3.pdf', size: '6.1 MB', date: '15/06/2025 10:00', status: 'approved', feedback: 'Đã đạt yêu cầu. Được phép nộp bản chính thức.', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
];

const initialChecklist: ChecklistItem[] = [
  { id: 'format', label: 'File PDF đúng định dạng theo mẫu của trường', done: true, required: true },
  { id: 'signature', label: 'Có chữ ký xác nhận của Giảng viên hướng dẫn', done: true, required: true },
  { id: 'plagiarism', label: 'Báo cáo kiểm tra đạo văn (plagiarism < 25%)', done: false, required: true },
  { id: 'abstract', label: 'Có tóm tắt tiếng Anh (Abstract)', done: true, required: true },
  { id: 'appendix', label: 'Phụ lục mã nguồn đính kèm', done: false, required: false },
  { id: 'commit', label: 'Link GitHub/repository đã được public', done: false, required: false },
];

// ===================== UTILS (HÀM TÍNH TOÁN NGÀY GIỜ ĐỘNG) =====================
const statusMeta: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  not_submitted: { label: 'Chưa nộp', color: '#8c8c8c', bg: '#fafafa', icon: <CloudUploadOutlined />, description: 'Bạn chưa nộp bất kỳ phiên bản nào.' },
  pending_review: { label: 'Chờ xét duyệt', color: '#fa8c16', bg: '#fff7e6', icon: <SyncOutlined spin />, description: 'Bản nộp đang chờ giảng viên hướng dẫn xem xét.' },
  revision_needed: { label: 'Cần chỉnh sửa', color: '#ff4d4f', bg: '#fff2f0', icon: <WarningOutlined />, description: 'Giảng viên yêu cầu chỉnh sửa trước khi nộp lại.' },
  approved: { label: 'Đã duyệt', color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleFilled />, description: 'Bản nộp đã được duyệt. Hãy nộp bản chính thức!' },
  final_submitted: { label: 'Đã nộp chính thức', color: '#1677ff', bg: '#e6f4ff', icon: <FileDoneOutlined />, description: 'Luận văn đã được nộp chính thức. Chờ lịch bảo vệ.' },
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

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      days: String(days).padStart(2, '0'), 
      hours: String(hours).padStart(2, '0'), 
      minutes: String(minutes).padStart(2, '0'), 
      totalDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) 
    };
  } catch (e) {
    return { days: '00', hours: '00', minutes: '00', totalDays: 0 };
  }
};

// ===================== SUB-COMPONENTS =====================

/** Checklist card */
const SubmissionChecklist: React.FC<{ items: ChecklistItem[]; onChange: (id: string) => void; }> = ({ items, onChange }) => {
  const requiredDone = items.filter(i => i.required && i.done).length;
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

/** Upload dragger (Cải tiến nộp nhiều file cùng lúc) */
const UploadZone: React.FC<{
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  status: SubmissionStatus;
  onSubmit: () => void;
  checklistOk: boolean;
  finalFiles?: Array<{ name: string; size: string; time: string; url: string }>;
}> = ({ fileList, setFileList, status, onSubmit, checklistOk, finalFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const hasFile = fileList.length > 0;

  // Cấu hình hỗ trợ nộp tối đa 2 file (Báo cáo + Source code)
  const props: UploadProps = {
    name: 'file',
    multiple: true,
    maxCount: 2,
    accept: '.pdf,.zip,.docx',
    fileList,
    beforeUpload: (file, currentFileList) => {
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error(`File ${file.name} vượt quá 50MB!`);
        return Upload.LIST_IGNORE;
      }
      
      // Cập nhật mảng động khi chọn nhiều file liền lúc
      setFileList(prev => {
        const filtered = prev.filter(f => f.name !== file.name);
        return [...filtered, { ...file, uid: file.uid, name: file.name, size: file.size, status: 'done' } as UploadFile].slice(-2);
      });
      return false;
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
    },
    onDrop: () => setIsDragging(false),
  };

  const isLocked = status === 'final_submitted';
  const isApproved = status === 'approved';

  const handleActionFile = (url: string, mode: 'view' | 'download', name?: string) => {
    if (!url || url === '#') {
      message.error('Không tìm thấy đường dẫn file hợp lệ!');
      return;
    }
    if (mode === 'view') {
      window.open(url, '_blank');
    } else {
      message.info('Đang chuẩn bị tải xuống...');
      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'download.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20, background: isLocked ? 'linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%)' : 'rgba(255,255,255,0.97)' }} bodyStyle={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: isLocked ? 'linear-gradient(135deg, #1677ff, #4096ff)' : 'linear-gradient(135deg, #13c2c2, #36cfc9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLocked ? <LockOutlined style={{ color: '#fff', fontSize: 16 }} /> : <CloudUploadOutlined style={{ color: '#fff', fontSize: 16 }} />}
        </div>
        <div>
          <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>{isLocked ? 'Đã nộp luận văn chính thức' : 'Tải lên tài liệu bảo vệ'}</Text>
          <div><Text style={{ fontSize: 12, color: '#8c8c8c' }}>{isLocked ? 'Không thể thay đổi sau khi nộp chính thức' : 'Tải lên tối đa 2 file (PDF báo cáo & ZIP mã nguồn) • Max 50MB/file'}</Text></div>
        </div>
      </div>

      {isLocked && finalFiles && finalFiles.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {finalFiles.map((file, idx) => (
            <div key={idx} style={{ background: '#f0f7ff', border: '1px solid #b7eb8f', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <Space size={12}>
                {file.name.endsWith('.zip') ? <FileZipOutlined style={{ fontSize: 28, color: '#fa8c16' }} /> : <FilePdfOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />}
                <div>
                  <Text strong style={{ fontSize: 14, color: '#1677ff', display: 'block' }}>{file.name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Nộp lúc: {file.time} • Dung lượng: {file.size}</Text>
                </div>
              </Space>
              <Space>
                {!file.name.endsWith('.zip') && <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6 }} onClick={() => handleActionFile(file.url, 'view')}>Xem</Button>}
                <Button size="small" type="primary" ghost icon={<DownloadOutlined />} style={{ borderRadius: 6 }} onClick={() => handleActionFile(file.url, 'download', file.name)}>Tải về</Button>
              </Space>
            </div>
          ))}
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
              <Text type="secondary" style={{ fontSize: 12 }}>Chấp nhận file PDF báo cáo và ZIP mã nguồn tốt nghiệp (Tối đa 2 file)</Text>
            </Dragger>
          </div>

          {status === 'revision_needed' && <Alert type="warning" showIcon icon={<WarningOutlined />} message="Cần chỉnh sửa" description="Giảng viên yêu cầu bạn chỉnh sửa và nộp lại. Xem phản hồi chi tiết ở lịch sử bên dưới." style={{ borderRadius: 10, marginTop: 14 }} />}
          {isApproved && !hasFile && <Alert type="success" showIcon icon={<CheckCircleFilled />} message="Bản v3.0 đã được duyệt!" description="Tải lên bản báo cáo in hoàn chỉnh kèm mã nguồn dự án để tiến hành nộp chính thức." style={{ borderRadius: 10, marginTop: 14 }} />}

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Tooltip title={!checklistOk ? 'Hoàn tất các mục bắt buộc trong checklist trước' : ''}>
              <Button type="primary" size="large" icon={<FileDoneOutlined />} disabled={!hasFile || !checklistOk} onClick={onSubmit} style={{ borderRadius: 10, height: 44, paddingInline: 24, background: hasFile && checklistOk ? 'linear-gradient(135deg, #52c41a, #73d13d)' : undefined, border: 'none', fontWeight: 700, boxShadow: hasFile && checklistOk ? '0 4px 12px rgba(82,196,26,0.35)' : undefined, transition: 'all 0.25s' }}>
                Nộp chính thức ({fileList.length}/2 file)
              </Button>
            </Tooltip>
            {hasFile && <Button size="large" icon={<SendOutlined />} onClick={() => message.info('Đã gửi yêu cầu kiểm tra trước cho GVHD!')} style={{ borderRadius: 10, height: 44 }}>Gửi bản nháp cho GVHD</Button>}
          </div>
        </>
      )}
    </Card>
  );
};

/** Submission history */
const SubmissionHistory: React.FC<{ history: typeof mockHistory }> = ({ history }) => {
  const [detailModal, setDetailModal] = useState<typeof mockHistory[0] | null>(null);
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
          const isLatest = i === history.length - 1;
          const isOk = h.status === 'approved';
          return {
            dot: (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: isOk ? 'linear-gradient(135deg, #52c41a, #73d13d)' : 'linear-gradient(135deg, #ff7a45, #ff4d4f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLatest ? `0 0 0 4px ${isOk ? '#f6ffed' : '#fff2f0'}` : 'none' }}>
                {isOk ? <CheckOutlined style={{ color: '#fff', fontSize: 13 }} /> : <ReloadOutlined style={{ color: '#fff', fontSize: 13 }} />}
              </div>
            ),
            children: (
              <div style={{ background: isLatest ? (isOk ? '#f6ffed' : '#fff2f0') : '#fafafa', border: `1.5px solid ${isLatest ? (isOk ? '#b7eb8f' : '#ffccc7') : '#f0f0f0'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 4, transition: 'all 0.2s' }}>
                <Row justify="space-between" align="top" wrap={false} gutter={8}>
                  <Col flex="auto" style={{ minWidth: 0 }}>
                    <Space size={6} wrap>
                      <Tag color={isOk ? 'success' : 'error'} style={{ borderRadius: 5, fontWeight: 700, fontSize: 11 }}>{h.version}</Tag>
                      <Text strong style={{ fontSize: 13 }}>{h.fileName}</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Space size={10} wrap>
                        <Text type="secondary" style={{ fontSize: 11 }}>{h.date}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{h.size}</Text>
                      </Space>
                    </div>
                    <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 7, borderLeft: `3px solid ${isOk ? '#52c41a' : '#ff4d4f'}` }}>
                      <Text style={{ fontSize: 12, color: '#595959' }}>{h.feedback}</Text>
                    </div>
                  </Col>
                  <Col style={{ flexShrink: 0 }}>
                    <Space direction="vertical" size={4}>
                      <Tooltip title="Xem phản hồi chi tiết"><Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 7 }} onClick={() => setDetailModal(h)} /></Tooltip>
                      <Tooltip title="Tải file"><Button size="small" icon={<DownloadOutlined />} style={{ borderRadius: 7 }} onClick={() => window.open(h.fileUrl, '_blank')} /></Tooltip>
                    </Space>
                  </Col>
                </Row>
              </div>
            ),
          };
        })} />
      </Card>

      <Modal open={!!detailModal} onCancel={() => setDetailModal(null)} footer={null} title={<Space><FileTextOutlined /><Text strong>Phản hồi chi tiết – {detailModal?.version}</Text></Space>} width={520} styles={{ content: { borderRadius: 16 } }}>
        {detailModal && (
          <div>
            <div style={{ background: '#fafafa', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <Row gutter={16}>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>File</Text><div><Text strong style={{ fontSize: 13 }}>{detailModal.fileName}</Text></div></Col>
                <Col span={12}><Text type="secondary" style={{ fontSize: 11 }}>Nộp lúc</Text><div><Text strong style={{ fontSize: 13 }}>{detailModal.date}</Text></div></Col>
              </Row>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Nhận xét của GVHD:</Text>
            <div style={{ marginTop: 8, padding: '12px 14px', background: detailModal.status === 'approved' ? '#f6ffed' : '#fff2f0', border: `1.5px solid ${detailModal.status === 'approved' ? '#b7eb8f' : '#ffccc7'}`, borderRadius: 10 }}>
              <Text style={{ fontSize: 13, color: '#1a1a2e' }}>{detailModal.feedback}</Text>
            </div>
            <div style={{ marginTop: 14, textAlign: 'right' }}><Button onClick={() => setDetailModal(null)} style={{ borderRadius: 8 }}>Đóng</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
};

/** Defense council card */
const DefenseCouncilCard: React.FC<{ council: typeof mockCouncil; countdown: any }> = ({ council, countdown }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Card bordered={false} style={{ borderRadius: 16, background: 'linear-gradient(145deg, #0a0f2c 0%, #0d1b4b 40%, #0a2472 100%)', border: 'none', boxShadow: '0 8px 40px rgba(22,119,255,0.22)', overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: 24 }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(64,150,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(114,46,209,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Space size={10}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,215,0,0.15)', border: '1.5px solid rgba(255,215,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrophyOutlined style={{ color: '#ffd700', fontSize: 18 }} />
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 15, display: 'block' }}>Hội đồng bảo vệ</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Khóa luận tốt nghiệp 2025</Text>
            </div>
          </Space>
          <Button size="small" icon={<InfoCircleOutlined />} onClick={() => setDrawerOpen(true)} style={{ borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12 }}>
            Chi tiết
          </Button>
        </div>

        {[
          { icon: <CalendarOutlined style={{ color: '#4096ff', fontSize: 15 }} />, label: 'Ngày bảo vệ', value: council.date, highlight: true },
          { icon: <ClockCircleOutlined style={{ color: '#ffd700', fontSize: 15 }} />, label: 'Thời gian', value: council.time, highlight: false },
          { icon: <EnvironmentOutlined style={{ color: '#52c41a', fontSize: 15 }} />, label: 'Phòng / Địa điểm', value: council.room, highlight: false },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
            {row.icon}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, display: 'block' }}>{row.label}</Text>
              <Text strong style={{ color: row.highlight ? '#4096ff' : '#fff', fontSize: 13 }}>{row.value}</Text>
            </div>
          </div>
        ))}

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0 14px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}><TeamOutlined style={{ marginRight: 5 }} />Hội đồng ({council.members.length} người)</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {council.members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: i === 0 ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10 }}>
              <Avatar size={32} src={m.avatar} icon={<UserOutlined />} style={{ border: `2px solid ${i === 0 ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.15)'}`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ color: i === 0 ? '#ffd700' : '#fff', fontSize: 12, display: 'block', lineHeight: 1.3 }}>{m.name}{i === 0 && <StarFilled style={{ marginLeft: 4, fontSize: 10, color: '#ffd700' }} />}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{m.role}</Text>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '12px', background: 'linear-gradient(135deg, rgba(22,119,255,0.15), rgba(114,46,209,0.1))', border: '1px solid rgba(22,119,255,0.25)', borderRadius: 10, textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, display: 'block' }}>Còn lại đến ngày bảo vệ</Text>
          <Row justify="center" gutter={16} style={{ marginTop: 6 }}>
            {[{ val: countdown.days, unit: 'ngày' }, { val: countdown.hours, unit: 'giờ' }, { val: countdown.minutes, unit: 'phút' }].map((t, i) => (
              <Col key={i}>
                <Text style={{ color: '#4096ff', fontSize: 22, fontWeight: 800, display: 'block', lineHeight: 1 }}>{t.val}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{t.unit}</Text>
              </Col>
            ))}
          </Row>
        </div>
      </Card>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={<Space><TrophyOutlined style={{ color: '#ffd700' }} /><Text strong>Thông tin Hội đồng bảo vệ</Text></Space>} width={420} styles={{ body: { padding: 20 } }}>
        <Alert type="info" showIcon message="Lưu ý quan trọng" description="Có mặt tại phòng trước 15 phút. Mang theo CMND/CCCD và thẻ sinh viên." style={{ borderRadius: 10, marginBottom: 20 }} />
        {[
          { icon: <CalendarOutlined />, color: '#1677ff', label: 'Ngày bảo vệ', value: council.date },
          { icon: <ClockCircleOutlined />, color: '#fa8c16', label: 'Thời gian', value: council.time },
          { icon: <EnvironmentOutlined />, color: '#52c41a', label: 'Phòng', value: council.room },
          { icon: <LinkOutlined />, color: '#722ed1', label: 'Địa chỉ đầy đủ', value: council.address },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: item.color + '15', border: `1.5px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 15 }}>{item.icon}</div>
            <div><Text type="secondary" style={{ fontSize: 11 }}>{item.label}</Text><div><Text strong style={{ fontSize: 13 }}>{item.value}</Text></div></div>
          </div>
        ))}
        <Divider>Thành viên hội đồng</Divider>
        {council.members.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', marginBottom: 8, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Avatar size={36} src={m.avatar} icon={<UserOutlined />} style={{ border: '2px solid #e6f4ff', flexShrink: 0 }} />
            <div style={{ flex: 1 }}><Text strong style={{ fontSize: 13, display: 'block' }}>{m.name}</Text><Text type="secondary" style={{ fontSize: 11 }}>{m.role}</Text></div>
            <Tooltip title={`Gửi email: ${m.email}`}><Button size="small" icon={<SendOutlined />} style={{ borderRadius: 7 }} /></Tooltip>
          </div>
        ))}
        <div style={{ marginTop: 20 }}>
          <Button type="primary" block icon={<CalendarOutlined />} style={{ borderRadius: 10, height: 40, fontWeight: 600 }} onClick={() => { message.success('Đã thêm vào lịch!'); setDrawerOpen(false); }}>
            Thêm vào lịch cá nhân
          </Button>
        </div>
      </Drawer>
    </>
  );
};

const SubmissionGuide: React.FC = () => (
  <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 20, background: 'linear-gradient(135deg, #fffbe6, #fff7e0)' }} bodyStyle={{ padding: 18 }}>
    <Space size={8} style={{ marginBottom: 14 }}><ThunderboltOutlined style={{ color: '#fa8c16', fontSize: 16 }} /><Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>Hướng dẫn nộp luận văn</Text></Space>
    <Timeline items={[
      { color: '#52c41a', children: <Text style={{ fontSize: 12 }}>Hoàn tất checklist và được GVHD duyệt bản nháp</Text> },
      { color: '#1677ff', children: <Text style={{ fontSize: 12 }}>Tải lên file PDF theo đúng mẫu bìa của trường</Text> },
      { color: '#722ed1', children: <Text style={{ fontSize: 12 }}>Nộp chính thức trước <Text strong style={{ color: '#ff4d4f' }}>20/06/2025</Text></Text> },
      { color: '#fa8c16', children: <Text style={{ fontSize: 12 }}>Chuẩn bị slide và có mặt trước ngày bảo vệ 15 phút</Text> },
    ]} />
  </Card>
);


// ===================== MAIN COMPONENT =====================
const Submission: React.FC = () => {
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('approved');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);

  // STATE DATA
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [history, setHistory] = useState(mockHistory);
  const [council, setCouncil] = useState(mockCouncil);

  // STATE COUNTDOWN ĐỘNG
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', totalDays: 0 });

  // Update đồng hồ đếm ngược mỗi phút
  useEffect(() => {
    const updateTime = () => setCountdown(calculateCountdown(council.date, council.time));
    updateTime(); // Gọi ngay lần đầu
    const timer = setInterval(updateTime, 60000); // 1 phút tính lại 1 lần
    return () => clearInterval(timer);
  }, [council.date, council.time]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const requiredOk = checklist.filter(i => i.required && !i.done).length === 0;
  const hasApproved = history.some(h => h.status === 'approved');

  // MẢNG FILE ĐỘNG: Tạo danh sách các file cuối cùng khi nộp chính thức thành công
  const finalFiles = useMemo(() => {
    if (submissionStatus !== 'final_submitted') return undefined;
    
    // Nếu có file do sinh viên vừa chọn thì map ra, không thì dùng mock cứng làm mẫu
    if (fileList.length > 0) {
      return fileList.map(f => ({
        name: f.name,
        size: f.size ? `${(Number(f.size) / 1024 / 1024).toFixed(1)} MB` : '5.0 MB',
        time: 'Vừa xong',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }));
    }
    
    return [
      { name: 'KhoaLuan_NguyenVanA_BaoCao.pdf', size: '6.1 MB', time: '15/06/2025 10:00', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'KhoaLuan_NguyenVanA_SourceCode.zip', size: '24.5 MB', time: '15/06/2025 10:05', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ];
  }, [submissionStatus, fileList]);

  const handleFinalSubmit = () => {
    if (!requiredOk) { message.error('Hoàn tất tất cả mục bắt buộc trước!'); return; }
    if (fileList.length === 0) { message.error('Vui lòng chọn tài liệu luận văn (PDF/ZIP)!'); return; }
    setConfirmModal(true);
  };

  const confirmSubmit = () => {
    setConfirmModal(false);
    setSubmissionStatus('final_submitted');
    message.success({ content: 'Đã nộp toàn bộ tài liệu khóa luận chính thức! Chúc bạn bảo vệ thành công 🎉', duration: 5 });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 50%, #f2f8ff 100%)', padding: '24px', fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .checklist-item-hover:hover { transform: translateX(3px); box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
        .ant-timeline-item-tail { border-inline-start: 2px dashed #e8e8e8 !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e', fontWeight: 800 }}>Nộp luận văn & Bảo vệ</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Nguyễn Văn A • MSSV: 20200001 • Lớp: CNPM2020</Text>
        </div>
        <Space wrap>
          <Tag icon={<RocketOutlined />} color="blue" style={{ borderRadius: 8, padding: '4px 10px', fontWeight: 600 }}>Đề tài: Hệ thống QLKL tốt nghiệp</Tag>
          <Tag icon={<UserOutlined />} color="purple" style={{ borderRadius: 8, padding: '4px 10px' }}>GVHD: Cô Phạm Thị Khánh</Tag>
        </Space>
      </div>

      {/* Status banner (Sử dụng countdown.totalDays) */}
      {(() => {
        const meta = statusMeta[submissionStatus];
        return (
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
        );
      })()}

      {/* Main layout */}
      <Row gutter={[20, 20]}>
        {/* Left column */}
        <Col xs={24} xl={15}>
          <SubmissionGuide />
          <SubmissionChecklist items={checklist} onChange={toggleChecklistItem} />
          
          {/* Truyền file info và các props vào UploadZone */}
          <UploadZone
            fileList={fileList}
            setFileList={setFileList}
            status={submissionStatus}
            onSubmit={handleFinalSubmit}
            checklistOk={requiredOk}
            finalFiles={finalFiles}
          />
          <SubmissionHistory history={history} />
        </Col>

        {/* Right column */}
        <Col xs={24} xl={9}>
          {/* Defense Council Card (Truyền giá trị động vào Countdown) */}
          <DefenseCouncilCard council={council} countdown={countdown} />

          {/* Preparation checklist */}
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginTop: 20 }} bodyStyle={{ padding: 18 }}>
            <Space size={8} style={{ marginBottom: 14 }}><FireOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /><Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>Chuẩn bị cho buổi bảo vệ</Text></Space>
            {[
              { label: 'Slide thuyết trình (10-15 slides)', done: false, color: '#1677ff' },
              { label: 'Demo/video minh họa sản phẩm', done: false, color: '#722ed1' },
              { label: 'Bản in báo cáo (3 bộ)', done: false, color: '#13c2c2' },
              { label: 'Luyện tập thuyết trình', done: false, color: '#fa8c16' },
              { label: 'Chuẩn bị câu hỏi phản biện', done: false, color: '#52c41a' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 6, background: '#fafafa', borderRadius: 9, border: '1px solid #f0f0f0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <Text style={{ fontSize: 13, flex: 1 }}>{item.label}</Text>
                <Button size="small" type="text" icon={<CheckOutlined style={{ color: '#d9d9d9' }} />} style={{ padding: 0 }} />
              </div>
            ))}
          </Card>

          {/* Quick links */}
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginTop: 20 }} bodyStyle={{ padding: 18 }}>
            <Text strong style={{ fontSize: 14, color: '#1a1a2e', display: 'block', marginBottom: 12 }}>Tài nguyên hữu ích</Text>
            {[
              { label: 'Mẫu bìa luận văn', icon: <FilePdfOutlined />, color: '#ff4d4f' },
              { label: 'Quy định trình bày luận văn', icon: <FileTextOutlined />, color: '#1677ff' },
              { label: 'Tool kiểm tra plagiarism', icon: <SafetyCertificateOutlined />, color: '#52c41a' },
              { label: 'Lịch bảo vệ toàn khoa', icon: <CalendarOutlined />, color: '#722ed1' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 6, background: '#fafafa', borderRadius: 9, cursor: 'pointer', border: '1px solid #f0f0f0', transition: 'all 0.2s' }} className="checklist-item-hover" onClick={() => message.info(`Đang mở: ${item.label}`)}>
                <span style={{ color: item.color, fontSize: 15 }}>{item.icon}</span>
                <Text style={{ fontSize: 13, flex: 1 }}>{item.label}</Text>
                <ArrowRightOutlined style={{ color: '#d9d9d9', fontSize: 11 }} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Confirm submit modal */}
      <Modal open={confirmModal} onCancel={() => setConfirmModal(false)} footer={null} width={460} styles={{ content: { borderRadius: 16, padding: 0, overflow: 'hidden' } }} centered>
        <div style={{ background: 'linear-gradient(135deg, #0a0f2c, #0d1b4b)', padding: '28px 28px 0', textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: 52, color: '#ffd700' }} />
          <Title level={4} style={{ color: '#fff', marginTop: 10 }}>Xác nhận nộp chính thức</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Sau khi xác nhận, hệ thống khóa bài nộp và chuyển đến hội đồng.</Text>
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
                    <div><Text type="secondary" style={{ fontSize: 11 }}>{file.size ? `${(Number(file.size) / 1024 / 1024).toFixed(1)} MB` : 'Sẵn sàng'} • Đã duyệt ✓</Text></div>
                  </div>
                </Space>
              </div>
            ))}
          </div>
          <Row gutter={10}>
            <Col span={12}><Button block style={{ borderRadius: 10, height: 42 }} onClick={() => setConfirmModal(false)}>Hủy</Button></Col>
            <Col span={12}>
              <Button type="primary" block style={{ borderRadius: 10, height: 42, background: 'linear-gradient(135deg, #52c41a, #73d13d)', border: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(82,196,26,0.35)' }} onClick={confirmSubmit}>
                Nộp chính thức
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default Submission;