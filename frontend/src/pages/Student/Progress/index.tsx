// src/pages/Student/Progress/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Steps, Typography, Row, Col, Tag, Badge, Avatar, Space,
  Input, Button, Progress as AntProgress, Divider, message, Modal, Slider,
  Tooltip, Alert, DatePicker, Select, Form, Checkbox, List, Upload 
} from 'antd';
import {
  UserOutlined, CalendarOutlined, BellOutlined, SendOutlined, 
  PaperClipOutlined, FireOutlined, RocketOutlined, TrophyOutlined, 
  CheckOutlined, SyncOutlined, EllipsisOutlined, MessageOutlined, 
  EditOutlined, PlusOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ===================== MOCK DATA =====================
const mockTasks = [
  { id: 1, title: 'Viết đề cương chi tiết', status: 'done', priority: 'high', deadline: '10/05/2025', progress: 100, description: 'Đề cương đã được duyệt' },
  { id: 2, title: 'Thiết kế Database & Backend API', status: 'in-progress', priority: 'high', deadline: '20/05/2025', progress: 65, description: 'Đang hoàn thiện các endpoints' },
  { id: 3, title: 'Tích hợp UI/UX Frontend', status: 'in-progress', priority: 'medium', deadline: '01/06/2025', progress: 30, description: 'Đang code các màn hình chính' },
  { id: 4, title: 'Viết báo cáo khóa luận', status: 'todo', priority: 'medium', deadline: '15/06/2025', progress: 0, description: 'Chưa bắt đầu' },
  { id: 5, title: 'Chuẩn bị slide bảo vệ', status: 'todo', priority: 'low', deadline: '25/06/2025', progress: 0, description: 'Chưa bắt đầu' },
];

const mockFeedbacks = [
  { id: 1, author: 'Cô Phạm Thị Khánh', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', content: 'Em chú ý chuẩn hóa lại các bảng trong Database, đặc biệt là phần quan hệ giữa User và Role nhé.', isUrgent: false, time: '2 giờ trước', taskRef: 'Thiết kế Database & Backend API', isMe: false },
  { id: 2, author: 'Tôi', avatar: '', content: 'Dạ vâng ạ, em sẽ chỉnh lại ngay trong hôm nay.', isUrgent: false, time: '1 giờ trước', taskRef: '', isMe: true },
  { id: 3, author: 'Cô Phạm Thị Khánh', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', content: 'GẤP: Cập nhật slide báo cáo tiến độ tuần này trước 5 giờ chiều nay!', isUrgent: true, time: '10 phút trước', taskRef: 'Chuẩn bị slide bảo vệ', isMe: false },
  { id: 4, author: 'Cô Phạm Thị Khánh', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Khanh', content: 'GẤP: Cập nhật slide báo cáo tiến độ tháng này trước 9 giờ chiều mai!', isUrgent: true, time: '20 phút trước', taskRef: 'Chuẩn bị slide bảo vệ', isMe: false },
];

// ===================== STATUS CONFIG =====================
const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  done: { color: '#52c41a', bg: '#f6ffed', icon: <CheckOutlined />, label: 'Hoàn thành' },
  'in-progress': { color: '#1677ff', bg: '#e6f4ff', icon: <SyncOutlined spin />, label: 'Đang làm' },
  todo: { color: '#8c8c8c', bg: '#fafafa', icon: <EllipsisOutlined />, label: 'Chưa làm' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#ff4d4f', label: 'Cao' },
  medium: { color: '#fa8c16', label: 'Trung bình' },
  low: { color: '#52c41a', label: 'Thấp' },
};

// ===================== SUB-COMPONENTS =====================

const TaskCard: React.FC<{ task: typeof mockTasks[0]; onUpdate: (id: number, newProgress: number) => void; }> = ({ task, onUpdate }) => {
  const cfg = statusConfig[task.status] || statusConfig['todo'];
  const pri = priorityConfig[task.priority] || priorityConfig['medium'];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProgress, setEditProgress] = useState(task.progress);

  const handleOpenModal = () => { setEditProgress(task.progress); setIsModalOpen(true); };
  const handleConfirmUpdate = () => { onUpdate(task.id, editProgress); setIsModalOpen(false); };

  return (
    <>
      <div style={{ background: cfg.bg, border: `1.5px solid ${task.status === 'in-progress' ? '#1677ff33' : '#f0f0f0'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, transition: 'all 0.25s ease', cursor: 'default', position: 'relative', overflow: 'hidden' }} className="task-card-hover">
        {task.status === 'in-progress' && <div style={{ position: 'absolute', top: 0, left: 0, width: `${task.progress}%`, height: 3, background: 'linear-gradient(90deg, #1677ff, #69b1ff)', borderRadius: '12px 0 0 0', transition: 'width 1s ease' }} />}
        {task.status === 'done' && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #52c41a, #95de64)', borderRadius: '12px 12px 0 0' }} />}

        <Row justify="space-between" align="top" wrap={false}>
          <Col flex="auto" style={{ minWidth: 0 }}>
            <Space size={6} align="center" wrap><span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span><Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>{task.title}</Text></Space>
            <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>{task.description}</Text></div>
            {task.status === 'in-progress' && (
              <div style={{ marginTop: 8 }}>
                <AntProgress percent={task.progress} size="small" strokeColor={{ from: '#1677ff', to: '#69b1ff' }} showInfo={false} style={{ margin: 0 }} />
                <Text style={{ fontSize: 11, color: '#1677ff' }}>{task.progress}% hoàn thành</Text>
              </div>
            )}
          </Col>
          <Col style={{ marginLeft: 12, flexShrink: 0 }}>
            <Space direction="vertical" size={6} align="end">
              <Space>
                <Tag style={{ background: pri.color + '18', color: pri.color, border: `1px solid ${pri.color}40`, borderRadius: 6, fontSize: 11, margin: 0 }}>{pri.label}</Tag>
                <Button type="text" size="small" icon={<EditOutlined style={{ color: '#1677ff' }} />} onClick={handleOpenModal} style={{ padding: '0 4px', height: '22px', background: '#e6f4ff', borderRadius: '6px' }} />
              </Space>
              <Space size={3}><CalendarOutlined style={{ fontSize: 11, color: '#8c8c8c' }} /><Text style={{ fontSize: 11, color: '#8c8c8c' }}>{task.deadline}</Text></Space>
            </Space>
          </Col>
        </Row>
      </div>

      <Modal title={<Space><SyncOutlined style={{ color: '#1677ff' }} /><Text strong>Cập nhật tiến độ</Text></Space>} open={isModalOpen} onOk={handleConfirmUpdate} onCancel={() => setIsModalOpen(false)} okText="Lưu" cancelText="Hủy" width={400} styles={{ content: { borderRadius: 16 } }}>
        <div style={{ padding: '20px 0 10px' }}>
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>{task.title}</Text>
          <Row gutter={16} align="middle">
            <Col span={18}><Slider min={0} max={100} onChange={setEditProgress} value={editProgress} tooltip={{ formatter: (val) => `${val}%` }} /></Col>
            <Col span={6}><div style={{ background: '#f0f5ff', border: '1px solid #1677ff', borderRadius: 8, padding: '4px 0', textAlign: 'center' }}><Text strong style={{ color: '#1677ff', fontSize: 16 }}>{editProgress}%</Text></div></Col>
          </Row>
          <div style={{ marginTop: 12 }}><Text type="secondary" style={{ fontSize: 12 }}>* Kéo thanh trượt lên 100% để đánh dấu hoàn thành.</Text></div>
        </div>
      </Modal>
    </>
  );
};

const ChatBubble: React.FC<{ msg: typeof mockFeedbacks[0] }> = ({ msg }) => {
  const isMe = msg.isMe;
  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
      {!isMe && <Badge dot={msg.isUrgent} color="#ff4d4f" offset={[-2, 2]}><Avatar size={38} src={msg.avatar} icon={<UserOutlined />} style={{ flexShrink: 0, border: '2px solid #e6f4ff' }} /></Badge>}
      <div style={{ maxWidth: '72%' }}>
        {!isMe && (
          <Space size={6} style={{ marginBottom: 4, paddingLeft: 4 }}>
            <Text strong style={{ fontSize: 12, color: '#1a1a2e' }}>{msg.author}</Text>
            {msg.isUrgent && <Tag icon={<FireOutlined />} color="error" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 5px' }}>Gấp</Tag>}
          </Space>
        )}
        <div style={{ background: isMe ? 'linear-gradient(135deg, #1677ff, #4096ff)' : msg.isUrgent ? '#fff2f0' : '#f5f5f5', color: isMe ? '#fff' : msg.isUrgent ? '#cf1322' : '#1a1a2e', border: msg.isUrgent && !isMe ? '1.5px solid #ffccc7' : 'none', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s ease', position: 'relative', whiteSpace: 'pre-wrap' }}>
          {msg.taskRef && <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><PaperClipOutlined /><span>{msg.taskRef}</span></div>}
          <Text style={{ color: 'inherit', fontSize: 13, lineHeight: 1.6 }}>{msg.content}</Text>
        </div>
        <Text style={{ fontSize: 11, color: '#bfbfbf', display: 'block', textAlign: isMe ? 'right' : 'left', marginTop: 3, paddingLeft: 4 }}>{msg.time}</Text>
      </div>
      {isMe && <Avatar size={38} icon={<UserOutlined />} style={{ flexShrink: 0, background: '#1677ff', border: '2px solid #e6f4ff' }} />}
    </div>
  );
};

const ProgressSection: React.FC<{ tasks: typeof mockTasks; onUpdateTask: (id: number, newProgress: number) => void; onAddTask: (taskData: { title: string; description: string; priority: string; deadline: string }) => void; }> = ({ tasks, onUpdateTask, onAddTask }) => {
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [todos, setTodos] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [todoInput, setTodoInput] = useState('');

  // ĐÃ SỬA: Bỏ argument `e`, sử dụng `todoInput` state để tương thích với cả Enter và Click icon Send
  const handleAddTodo = () => {
    if (todoInput.trim()) {
      setTodos([...todos, { id: Date.now(), text: todoInput.trim(), done: false }]);
      setTodoInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleCreateTask = () => {
    form.validateFields().then((values) => {
      const formattedDeadline = values.deadline ? values.deadline.format('DD/MM/YYYY') : '';
      onAddTask({
        title: values.title,
        description: values.description || 'Chưa có mô tả',
        priority: values.priority,
        deadline: formattedDeadline
      });
      form.resetFields();
      setIsCreateModalOpen(false);
    }).catch((info) => {
      console.log('Validate Failed:', info);
    });
  };

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.97)', border: '1px solid #f0f0f0', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #722ed1, #9254de)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RocketOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>Tiến độ khóa luận</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái hiện tại: <Text strong style={{ color: '#1677ff' }}>Đang thực hiện</Text></Text>
        </div>
      </div>
      <Steps current={1} size="small" style={{ marginBottom: 32 }} items={[
        { title: <Text strong style={{ fontSize: 13 }}>Chờ duyệt</Text>, description: <Text style={{ fontSize: 11 }} type="secondary">Đã gửi đề xuất</Text>, icon: <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #52c41a, #95de64)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckOutlined style={{ color: '#fff', fontSize: 14 }} /></div> },
        { title: <Text strong style={{ fontSize: 13 }}>Đang thực hiện</Text>, description: <Text style={{ fontSize: 11 }} type="secondary">Giai đoạn code</Text>, icon: <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1677ff, #4096ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(22,119,255,0.15)' }}><SyncOutlined spin style={{ color: '#fff', fontSize: 14 }} /></div> },
        { title: <Text strong style={{ fontSize: 13 }}>Chờ bảo vệ</Text>, description: <Text style={{ fontSize: 11 }} type="secondary">Nộp quyển</Text> },
        { title: <Text strong style={{ fontSize: 13 }}>Hoàn thành</Text>, description: <Text style={{ fontSize: 11 }} type="secondary">Kết thúc</Text>, icon: <TrophyOutlined /> },
      ]} />
      <Divider style={{ margin: '0 0 20px 0' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <Title level={5} style={{ margin: 0 }}>Danh sách công việc</Title>
        <Space wrap>
          <Tag color="success" style={{ borderRadius: 6 }}>{completedCount} xong</Tag>
          <Tag color="processing" style={{ borderRadius: 6 }}>{inProgressCount} đang làm</Tag>
          <Tag style={{ borderRadius: 6 }}>{todoCount} chờ</Tag>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} style={{ borderRadius: 6, fontSize: 12, background: 'linear-gradient(135deg, #1677ff, #4096ff)', border: 'none', marginLeft: 4 }}>Thêm công việc</Button>
        </Space>
      </div>

      {tasks.map(task => <TaskCard key={task.id} task={task} onUpdate={onUpdateTask} />)}

      <Divider style={{ margin: '24px 0 16px 0' }} />
      <Title level={5} style={{ margin: '0 0 12px 0', fontSize: 14 }}>Công việc cá nhân (Sub-tasks)</Title>
      <List
        size="small"
        dataSource={todos}
        locale={{ emptyText: 'Chưa có công việc nhỏ nào được thêm.' }}
        renderItem={item => (
          <List.Item style={{ padding: '6px 0', borderBottom: 'none' }}>
            <Checkbox checked={item.done} onChange={() => toggleTodo(item.id)}>
              <Text delete={item.done} style={{ color: item.done ? '#bfbfbf' : '#1a1a2e', transition: 'all 0.3s' }}>{item.text}</Text>
            </Checkbox>
          </List.Item>
        )}
      />
      
      {/* ĐÃ SỬA: Thêm suffix với nút SendOutlined */}
      <Input
        placeholder='Ví dụ: "Hẹn gặp Vinh bàn API lúc 2h" (Ấn Enter hoặc icon gửi)'
        value={todoInput}
        onChange={e => setTodoInput(e.target.value)}
        onPressEnter={handleAddTodo}
        prefix={<PlusOutlined style={{ color: '#bfbfbf' }} />}
        suffix={
          <SendOutlined 
            onClick={handleAddTodo} 
            style={{ 
              color: todoInput.trim() ? '#1677ff' : '#bfbfbf', 
              cursor: todoInput.trim() ? 'pointer' : 'default',
              transition: 'color 0.3s',
              padding: 4
            }} 
          />
        }
        style={{ borderRadius: 8, marginTop: 8 }}
      />

      <Modal 
        title={<Space><PlusOutlined style={{ color: '#1677ff' }} /><Text strong>Thêm công việc mới</Text></Space>} 
        open={isCreateModalOpen} 
        onOk={handleCreateTask} 
        onCancel={() => { form.resetFields(); setIsCreateModalOpen(false); }} 
        okText="Thêm" 
        cancelText="Hủy" 
        width={450} 
        styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" name="add_task_form" initialValues={{ priority: 'medium' }} style={{ marginTop: 16 }}>
          <Form.Item name="title" label={<Text strong style={{ fontSize: 13 }}>Tên công việc</Text>} rules={[{ required: true, message: 'Vui lòng nhập tên công việc!' }]}>
            <Input placeholder="Ví dụ: Thiết kế API Login, Fix bug UI..." style={{ borderRadius: 8 }} />
          </Form.Item>
          
          <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Mô tả ngắn</Text>}>
            <TextArea placeholder="Nhập ghi chú hoặc yêu cầu chi tiết..." autoSize={{ minRows: 2, maxRows: 4 }} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label={<Text strong style={{ fontSize: 13 }}>Độ ưu tiên</Text>} rules={[{ required: true }]}>
                <Select style={{ width: '100%' }}>
                  <Option value="high"><span style={{ color: '#ff4d4f' }}>●</span> Cao</Option>
                  <Option value="medium"><span style={{ color: '#fa8c16' }}>●</span> Trung bình</Option>
                  <Option value="low"><span style={{ color: '#52c41a' }}>●</span> Thấp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label={<Text strong style={{ fontSize: 13 }}>Hạn chót (Deadline)</Text>} rules={[{ required: true, message: 'Chọn ngày!' }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%', borderRadius: 8 }} placeholder="Chọn ngày" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

const FeedbackSection: React.FC<{ feedbacks: typeof mockFeedbacks; onSendMessage: (msg: string) => void }> = ({ feedbacks, onSendMessage }) => {
  const [inputVal, setInputVal] = useState('');
  const [showUrgent, setShowUrgent] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbacks, showUrgent]);

  const urgentCount = feedbacks.filter(f => f.isUrgent && !f.isMe).length;
  
  const displayedFeedbacks = showUrgent ? feedbacks.filter(f => f.isUrgent) : feedbacks;

  const handleSend = () => {
    if (inputVal.trim()) {
      onSendMessage(inputVal.trim());
      setInputVal('');
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.97)', border: '1px solid #f0f0f0', height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #eb2f96, #f759ab)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>Phản hồi giảng viên</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Cô Phạm Thị Khánh – GVHD</Text>
          </div>
        </div>
        
        {urgentCount > 0 && (
          <Tooltip title={showUrgent ? "Xem tất cả tin nhắn" : "Chỉ xem tin nhắn khẩn"}>
            <Badge count={urgentCount} style={{ boxShadow: '0 2px 8px rgba(255,77,79,0.4)' }}>
              <div 
                onClick={() => setShowUrgent(!showUrgent)} 
                style={{ width: 36, height: 36, borderRadius: 10, background: showUrgent ? '#ff4d4f' : '#fff2f0', border: '1.5px solid #ffccc7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <BellOutlined style={{ color: showUrgent ? '#fff' : '#ff4d4f', fontSize: 16 }} />
              </div>
            </Badge>
          </Tooltip>
        )}
      </div>

      {showUrgent && (
        <Alert message={`Đang lọc ${urgentCount} tin nhắn khẩn. Bấm vào chuông để tắt.`} type="error" showIcon style={{ marginBottom: 10, borderRadius: 8, padding: '4px 10px' }} />
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 240, maxHeight: 400 }}>
        {displayedFeedbacks.length > 0 
          ? displayedFeedbacks.map(msg => <ChatBubble key={msg.id} msg={msg} />)
          : <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Không có tin nhắn nào phù hợp.</Text>
        }
        <div ref={chatEndRef} />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Upload 
          showUploadList={false} 
          beforeUpload={(file) => {
            message.success(`Đã đính kèm file: ${file.name}`);
            setInputVal(prev => prev ? `${prev}\n[File đính kèm: ${file.name}]` : `[File đính kèm: ${file.name}]`);
            return false; // Trả về false để chặn việc tự động upload file lên server
          }}
        >
          <Tooltip title="Đính kèm file">
            <Button icon={<PaperClipOutlined style={{ fontSize: 16, color: '#595959' }} />} style={{ borderRadius: 10, height: 38, width: 38, padding: 0 }} />
          </Tooltip>
        </Upload>
        
        <TextArea value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Trả lời giảng viên..." autoSize={{ minRows: 1, maxRows: 3 }} style={{ borderRadius: 10, flex: 1, resize: 'none', fontSize: 13 }} onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} style={{ borderRadius: 10, height: 38, width: 38, background: 'linear-gradient(135deg, #1677ff, #4096ff)', border: 'none', flexShrink: 0, boxShadow: '0 2px 8px rgba(22,119,255,0.35)', padding: 0 }} />
      </div>
    </Card>
  );
};

// ===================== MAIN DASHBOARD COMPONENT =====================
const Progress: React.FC = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [feedbacks, setFeedbacks] = useState(mockFeedbacks);

  const handleUpdateTask = (taskId: number, newProgress: number) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        let newStatus = task.status;
        if (newProgress === 100) newStatus = 'done';
        else if (newProgress === 0) newStatus = 'todo';
        else newStatus = 'in-progress';
        return { ...task, progress: newProgress, status: newStatus };
      }
      return task;
    }));
    message.success('Đã cập nhật tiến độ công việc!');
  };

  const handleAddTask = (taskData: { title: string; description: string; priority: string; deadline: string }) => {
    const newTask = {
      id: Date.now(),
      title: taskData.title,
      status: 'todo',
      priority: taskData.priority,
      deadline: taskData.deadline,
      progress: 0,
      description: taskData.description
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    message.success('Đã thêm công việc mới thành công!');
  };

  const handleSendMessage = (textMsg: string) => {
    const newMessage = {
      id: Date.now(),
      author: 'Tôi',
      avatar: '',
      content: textMsg,
      isUrgent: false,
      time: 'Vừa xong',
      taskRef: '',
      isMe: true
    };
    setFeedbacks([...feedbacks, newMessage]);
  };

  const progressPercent = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) 
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef4ff 50%, #f0f9ff 100%)', padding: '24px', fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .task-card-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10) !important; }
        .ant-steps-item-process .ant-steps-item-icon { background: transparent !important; border: none !important; }
        .ant-steps-item-finish .ant-steps-item-icon { background: #f6ffed !important; border-color: #52c41a !important; }
        .ant-card { transition: box-shadow 0.25s ease !important; }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}>
              <TrophyOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>Theo dõi Tiến độ</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>Cập nhật công việc & Trao đổi với Giảng viên</Text>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: 'linear-gradient(135deg, #e6f4ff, #f0f9ff)', border: '1px solid #91caff', borderRadius: 12, padding: '8px 16px', textAlign: 'center' }}>
            <Text strong style={{ color: '#1677ff', fontSize: 18 }}>{progressPercent}%</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Tiến độ tổng</Text>
          </div>
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 12, padding: '8px 16px', textAlign: 'center' }}>
            <Text strong style={{ color: '#52c41a', fontSize: 18 }}>42</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Ngày còn lại</Text>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <ProgressSection tasks={tasks} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} />
        </Col>
        <Col xs={24} xl={10}>
          <FeedbackSection feedbacks={feedbacks} onSendMessage={handleSendMessage} />
        </Col>
      </Row>
    </div>
  );
};

export default Progress;