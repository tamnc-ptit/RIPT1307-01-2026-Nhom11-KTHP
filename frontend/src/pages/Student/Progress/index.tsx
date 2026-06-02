import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Row, Col, Tag, Space, Input, Button, Progress as AntProgress,
  Divider, message, Modal, Slider, DatePicker, Select, Form, Checkbox, List, Spin, Timeline, Upload, Popconfirm
} from 'antd';
import {
  CalendarOutlined, SendOutlined, RocketOutlined, CheckOutlined, SyncOutlined,
  EditOutlined, PlusOutlined, ClockCircleOutlined, CloudUploadOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { request, useModel } from 'umi';
import moment from 'moment';

import { Milestone, MilestoneStatus } from '../../../types/LecturerTypes/MilestonesTypes';
import StudentHeader from '../components/StudentHeader';
import { getProgressByThesis } from '../../../services/progress';
import { ProgressResponse } from '../../../types/StudentTypes/ProgressTypes';

const USE_MOCK_API = false;

const MOCK_TASKS: Milestone[] = [
  { id: 1, thesis_id: 1, created_by: 1, title: 'Hoàn thiện tài liệu đặc tả', description: 'Viết xong SRS và chốt với mentor', deadline: '20/05/2026', status: 'completed' as MilestoneStatus, created_at: '2026-05-10T08:00:00Z' },
  { id: 2, thesis_id: 1, created_by: 1, title: 'Thiết kế Database ERD', description: 'Hoàn thiện các bảng dữ liệu cho hệ thống', deadline: '25/05/2026', status: 'pending' as MilestoneStatus, created_at: '2026-05-10T08:00:00Z' },
];

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusConfig: Record<MilestoneStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  completed: { color: '#52c41a', bg: '#f6ffed', icon: <CheckOutlined />, label: 'Hoàn thành' },
  pending: { color: '#1677ff', bg: '#e6f4ff', icon: <SyncOutlined spin />, label: 'Đang thực hiện' },
  overdue: { color: '#ff4d4f', bg: '#fff2f0', icon: <ClockCircleOutlined />, label: 'Quá hạn' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#ff4d4f', label: 'Cao' },
  medium: { color: '#fa8c16', label: 'Trung bình' },
  low: { color: '#52c41a', label: 'Thấp' },
};

const getDerivedProgress = (status: MilestoneStatus) => (status === 'completed' ? 100 : 0);

const TaskCard: React.FC<{ task: Milestone; onUpdate: (id: number, newStatus: MilestoneStatus) => void; updatingId: number | null }> = ({ task, onUpdate, updatingId }) => {
  const cfg = statusConfig[task.status] || statusConfig.pending;
  const pri = priorityConfig.medium;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProgress, setEditProgress] = useState(getDerivedProgress(task.status));

  const handleOpenModal = () => { setEditProgress(getDerivedProgress(task.status)); setIsModalOpen(true); };
  const handleConfirmUpdate = () => { onUpdate(task.id, editProgress === 100 ? 'completed' : 'pending'); setIsModalOpen(false); };

  const currentPercent = getDerivedProgress(task.status);
  const isUpdating = updatingId === task.id;

  return (
    <>
      <div className="task-card-hover" style={{ background: cfg.bg, border: task.status === 'pending' ? '1.5px solid #1677ff33' : '1.5px solid #f0f0f0', borderRadius: 12, padding: '14px 16px', marginBottom: 10, transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden', opacity: isUpdating ? 0.6 : 1 }}>
        {task.status === 'pending' && <div style={{ position: 'absolute', top: 0, left: 0, width: `${currentPercent}%`, height: 3, background: 'linear-gradient(90deg, #1677ff, #69b1ff)' }} />}
        {task.status === 'completed' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #52c41a, #95de64)' }} />}
        <Row justify="space-between" align="top" wrap={false}>
          <Col flex="auto">
            <Space size={6}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <Text strong>{task.title}</Text>
            </Space>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{task.description}</Text>
            </div>
            {task.status === 'pending' && (
              <div style={{ marginTop: 8 }}>
                <AntProgress percent={currentPercent} size="small" showInfo={false} strokeColor={{ from: '#1677ff', to: '#69b1ff' }} />
                <Text style={{ fontSize: 11, color: '#1677ff' }}>Đang tiến hành theo kế hoạch</Text>
              </div>
            )}
          </Col>
          <Col style={{ marginLeft: 12 }}>
            <Space direction="vertical" size={6} align="end">
              <Space>
                <Tag style={{ background: `${pri.color}18`, color: pri.color, border: `1px solid ${pri.color}40`, borderRadius: 6, margin: 0 }}>{pri.label}</Tag>
                <Button type="text" size="small" disabled={isUpdating} icon={isUpdating ? <SyncOutlined spin style={{ color: '#1677ff' }} /> : <EditOutlined style={{ color: '#1677ff' }} />} onClick={handleOpenModal} style={{ background: '#e6f4ff', borderRadius: 6 }} />
              </Space>
              <Space size={4}>
                <CalendarOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{task.deadline}</Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>

      <Modal open={isModalOpen} onOk={handleConfirmUpdate} onCancel={() => setIsModalOpen(false)} okText="Lưu" cancelText="Hủy" width={400} title={<Space><SyncOutlined style={{ color: '#1677ff' }} /><Text strong>Cập nhật trạng thái công việc</Text></Space>}>
        <div style={{ paddingTop: 20 }}>
          <Text strong>{task.title}</Text>
          <Row gutter={16} align="middle" style={{ marginTop: 20 }}>
            <Col span={18}><Slider min={0} max={100} step={100} value={editProgress} onChange={setEditProgress} /></Col>
            <Col span={6}><div style={{ background: '#f0f5ff', border: '1px solid #1677ff', borderRadius: 8, textAlign: 'center', padding: '4px 0' }}><Text strong style={{ color: '#1677ff' }}>{editProgress === 100 ? 'Xong' : 'Chưa'}</Text></div></Col>
          </Row>
        </div>
      </Modal>
    </>
  );
};

const ProgressSection: React.FC<{ tasks: Milestone[]; onUpdateTask: (id: number, newStatus: MilestoneStatus) => void; onAddTask: (taskData: any) => void; updatingId: number | null; isAdding: boolean }> = ({ tasks, onUpdateTask, onAddTask, updatingId, isAdding }) => {
  const [form] = Form.useForm();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [todos, setTodos] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [todoInput, setTodoInput] = useState('');

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'pending').length;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;

  const handleAddTodo = () => {
    if (!todoInput.trim()) return;
    setTodos([...todos, { id: Date.now(), text: todoInput.trim(), done: false }]);
    setTodoInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleCreateTask = () => {
    form.validateFields().then((values) => {
      onAddTask({ title: values.title, description: values.description || 'Chưa có mô tả', deadline: values.deadline ? values.deadline.format('DD/MM/YYYY') : '' });
      form.resetFields();
      setIsCreateModalOpen(false);
    }).catch(() => {});
  };

  return (
    <Card bordered={false} style={{ borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #722ed1, #9254de)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RocketOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Mục tiêu & Kế hoạch</Title>
          <Text type="secondary">Trạng thái hiện tại: <Text strong style={{ color: '#1677ff' }}>Đang thực hiện</Text></Text>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <Title level={5} style={{ margin: 0 }}>Danh sách công việc</Title>
        <Space wrap>
          <Tag color="success">{completedCount} xong</Tag>
          <Tag color="processing">{inProgressCount} đang làm</Tag>
          {overdueCount > 0 && <Tag color="error">{overdueCount} quá hạn</Tag>}
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} style={{ borderRadius: 6 }}>Thêm công việc</Button>
        </Space>
      </div>

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onUpdate={onUpdateTask} updatingId={updatingId} />
      ))}

      <Divider />
      <Title level={5} style={{ fontSize: 14 }}>Ghi chú nhanh (Sub-tasks)</Title>
      <List size="small" dataSource={todos} locale={{ emptyText: 'Chưa có ghi chú nào được thêm.' }} renderItem={(item) => (
        <List.Item style={{ borderBottom: 'none', padding: '6px 0' }}>
          <Checkbox checked={item.done} onChange={() => toggleTodo(item.id)}><Text delete={item.done}>{item.text}</Text></Checkbox>
        </List.Item>
      )} />
      <Input value={todoInput} onChange={(e) => setTodoInput(e.target.value)} onPressEnter={handleAddTodo} placeholder="Ví dụ: Hẹn mentor review API" prefix={<PlusOutlined />} suffix={<SendOutlined onClick={handleAddTodo} style={{ color: todoInput.trim() ? '#1677ff' : '#bfbfbf', cursor: 'pointer' }} />} style={{ marginTop: 8, borderRadius: 8 }} />

      <Modal open={isCreateModalOpen} onOk={handleCreateTask} onCancel={() => { form.resetFields(); setIsCreateModalOpen(false); }} okText="Thêm" cancelText="Hủy" width={450} confirmLoading={isAdding} closable={!isAdding} maskClosable={!isAdding} title={<Space><PlusOutlined style={{ color: '#1677ff' }} /><Text strong>Thêm công việc mới</Text></Space>}>
        <Form form={form} layout="vertical" initialValues={{ priority: 'medium' }} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Tên công việc" rules={[{ required: true, message: 'Vui lòng nhập tên công việc!' }]}><Input disabled={isAdding} /></Form.Item>
          <Form.Item name="description" label="Mô tả ngắn"><TextArea autoSize={{ minRows: 2, maxRows: 4 }} disabled={isAdding} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="priority" label="Độ ưu tiên"><Select disabled={isAdding}><Option value="high">Cao</Option><Option value="medium">Trung bình</Option><Option value="low">Thấp</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="deadline" label="Hạn chót" rules={[{ required: true, message: 'Chọn ngày!' }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabled={isAdding} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

const ProgressReportSection: React.FC<{ thesisId: number; studentId: number; tasks: Milestone[] }> = ({ thesisId, studentId, tasks }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getProgressByThesis(thesisId);
      if (res && res.data) {
        setProgressHistory(res.data);
      }
    } catch (error) {
      message.error('Lỗi khi tải lịch sử báo cáo!');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [thesisId]);

  const handleSubmitProgress = async () => {
    try {
      const values = await form.validateFields();
      
      if (fileList.length === 0) {
        message.error('Vui lòng đính kèm file báo cáo!');
        return;
      }

      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('milestone_id', values.milestone_id);
      formData.append('thesis_id', thesisId.toString());
      formData.append('student_id', studentId.toString());
      formData.append('file_name', values.fileName);
      formData.append('description', values.description || '');
      formData.append('file', fileList[0].originFileObj as Blob);

      // KẸP THÊM TOKEN KHI GỌI API NỘP BÀI
      const token = localStorage.getItem('token');
      await request('/api/student/progress', { 
        method: 'POST', 
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Đã nộp báo cáo tiến độ thành công!');
      form.resetFields();
      setFileList([]);
      fetchHistory(); 
    } catch (error) {
      if (error && (error as any).errorFields) return; 
      message.error('Lỗi khi nộp báo cáo!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: number) => {
    try {
      // KẸP THÊM TOKEN KHI GỌI API THU HỒI
      const token = localStorage.getItem('token');
      await request(`/api/student/submissions/${submissionId}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Đã thu hồi báo cáo thành công!');
      fetchHistory();
    } catch (error) {
      message.error('Lỗi khi thu hồi báo cáo!');
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1677ff, #36cfc9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileTextOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Báo cáo Tiến độ</Title>
          <Text type="secondary">Nộp file báo cáo và nhận xét từ giảng viên</Text>
        </div>
      </div>

      <Row gutter={[32, 24]}>
        <Col xs={24} lg={12}>
          <Title level={5}>Nộp báo cáo mới</Title>
          <Form form={form} layout="vertical">
            
            <Form.Item 
              name="milestone_id" 
              label="Đợt báo cáo (Cột mốc)" 
              rules={[{ required: true, message: 'Vui lòng chọn đợt báo cáo!' }]}
            >
              <Select placeholder="-- Chọn cột mốc cần nộp --" disabled={isSubmitting}>
                {tasks.map(task => (
                  <Option key={task.id} value={task.id}>
                    {task.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="fileName" label="Tên file / Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tên file/tiêu đề!' }]}>
              <Input placeholder="Ví dụ: Báo cáo Tuần 3 - Thiết kế API" disabled={isSubmitting} />
            </Form.Item>
            
            <Form.Item label="Đính kèm tài liệu" required>
              <Upload 
                maxCount={1} 
                beforeUpload={(file) => {
                  setFileList([file]);
                  return false; 
                }}
                onRemove={() => setFileList([])}
                fileList={fileList}
              >
                <Button icon={<UploadOutlined />} disabled={isSubmitting}>Chọn file (PDF, Word, ZIP)</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="description" label="Nội dung công việc đã làm">
              <TextArea rows={4} placeholder="Tóm tắt ngắn gọn các việc đã hoàn thành..." disabled={isSubmitting} />
            </Form.Item>

            <Button type="primary" icon={<CloudUploadOutlined />} loading={isSubmitting} onClick={handleSubmitProgress} block style={{ borderRadius: 8, height: 40 }}>
              Gửi Báo Cáo
            </Button>
          </Form>
        </Col>

        <Col xs={24} lg={12}>
          <Title level={5}>Lịch sử nộp ({progressHistory.length})</Title>
          <Spin spinning={loadingHistory}>
            {progressHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#bfbfbf' }}>Chưa có báo cáo nào được nộp.</div>
            ) : (
              <Timeline 
                style={{ marginTop: 16 }} 
                items={progressHistory.map((item) => {
                  let color = 'blue';
                  let statusText = 'Đang chờ duyệt';
                  if (item.status === 'approved') { color = 'green'; statusText = 'Đã duyệt'; }
                  if (item.status === 'rejected') { color = 'red'; statusText = 'Cần chỉnh sửa'; }

                  return {
                    key: item.id,
                    color: color,
                    children: (
                      <>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong>{item.file_name}</Text>
                          <Tag color={color} style={{ marginLeft: 8 }}>{statusText}</Tag>
                        </div>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} /> 
                          {moment(item.created_at).format('DD/MM/YYYY HH:mm')}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 13 }}>{item.description}</Text>
                        </div>
                        <div>
                          <a href={item.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                            Xem tài liệu đính kèm
                          </a>
                        </div>
                        {(item.status !== 'approved' && item.status !== 'rejected') && (
                          <div style={{ marginTop: 8 }}>
                            <Popconfirm
                              title="Thu hồi báo cáo"
                              description="Bạn có chắc chắn muốn thu hồi báo cáo này không?"
                              onConfirm={() => handleDeleteSubmission(item.submission_id || item.id)}
                              okText="Thu hồi"
                              cancelText="Hủy"
                            >
                              <Button danger size="small" type="text" icon={<DeleteOutlined />}>
                                Thu hồi
                              </Button>
                            </Popconfirm>
                          </div>
                        )}
                        {item.feedback && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fafafa', borderLeft: '3px solid #d9d9d9' }}>
                            <Text strong style={{ fontSize: 13 }}>GV Nhận xét:</Text> <br />
                            <Text style={{ fontSize: 13 }}>{item.feedback}</Text>
                          </div>
                        )}
                      </>
                    )
                  };
                })} 
              />
            )}
          </Spin>
        </Col>
      </Row>
    </Card>
  );
};

const Progress: React.FC = () => {
  const [tasks, setTasks] = useState<Milestone[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const { initialState } = useModel('@@initialState');
  const CURRENT_STUDENT_ID = initialState?.currentUser?.id || 5; 
  const CURRENT_THESIS_ID = initialState?.currentUser?.thesis_id || 1;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingInitial(true);
        if (USE_MOCK_API) {
          setTimeout(() => { setTasks(MOCK_TASKS); setLoadingInitial(false); }, 600);
        } else {
          // KẸP THÊM TOKEN KHI FETCH DATA
          const token = localStorage.getItem('token');
          const res = await request(`/api/student/theses/${CURRENT_THESIS_ID}/milestones`, { 
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res?.data) setTasks(res.data);
          setLoadingInitial(false);
        }
      } catch (error) {
        message.error('Lỗi khi tải dữ liệu Kế hoạch');
        setLoadingInitial(false);
      }
    };
    fetchTasks();
  }, [CURRENT_THESIS_ID]);

  const handleUpdateTask = async (taskId: number, newStatus: MilestoneStatus) => {
    try {
      setUpdatingId(taskId);
      if (USE_MOCK_API) {
        setTimeout(() => {
          setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
          message.success('Đã cập nhật trạng thái!');
          setUpdatingId(null);
        }, 800);
      } else {
        // KẸP THÊM TOKEN KHI UPDATE
        const token = localStorage.getItem('token');
        await request(`/api/student/milestones/${taskId}`, { 
          method: 'PATCH', 
          data: { status: newStatus },
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
        message.success('Đã cập nhật trạng thái!');
        setUpdatingId(null);
      }
    } catch {
      message.error('Lỗi cập nhật!');
      setUpdatingId(null);
    }
  };

  const handleAddTask = async (taskData: Omit<Milestone, 'id' | 'thesis_id' | 'created_by' | 'status' | 'created_at'>) => {
    try {
      setIsAdding(true);
      const payload = { ...taskData, thesis_id: CURRENT_THESIS_ID, status: 'pending' as MilestoneStatus };
      if (USE_MOCK_API) {
        setTimeout(() => {
          setTasks((prev) => [...prev, { ...payload, id: Date.now(), created_by: CURRENT_STUDENT_ID, created_at: new Date().toISOString() }]);
          message.success('Đã thêm công việc mới!');
          setIsAdding(false);
        }, 1000);
      } else {
        // KẸP THÊM TOKEN KHI ADD TASK
        const token = localStorage.getItem('token');
        const res = await request('/api/student/milestones', { 
          method: 'POST', 
          data: payload,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res?.data) setTasks((prev) => [...prev, res.data]);
        message.success('Đã thêm công việc mới!');
        setIsAdding(false);
      }
    } catch {
      message.error('Lỗi khi thêm công việc!');
      setIsAdding(false);
    }
  };

  return (
    <Spin spinning={loadingInitial} tip="Đang tải dữ liệu...">
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef4ff 50%, #f0f9ff 100%)', padding: 24, fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
          .task-card-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10); }
        `}</style>

        <StudentHeader />

        <div style={{ marginTop: 24 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} xl={10}>
              <ProgressSection tasks={tasks} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} updatingId={updatingId} isAdding={isAdding} />
            </Col>
            
            <Col xs={24} xl={14}>
              <ProgressReportSection 
                thesisId={CURRENT_THESIS_ID} 
                studentId={CURRENT_STUDENT_ID} 
                tasks={tasks} 
              />
            </Col>
          </Row>
        </div>
      </div>
    </Spin>
  );
};

export default Progress;