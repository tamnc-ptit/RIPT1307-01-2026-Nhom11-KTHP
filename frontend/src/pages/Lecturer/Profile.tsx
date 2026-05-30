import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Input, Tag, Button, Space, message, Spin, Form, Badge } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, EditOutlined, SaveOutlined, PlusOutlined, BookOutlined } from "@ant-design/icons";
import { getProfile, updateProfile } from "@/services/lecturer";
import { useModel } from "umi";

const { Title, Text } = Typography;

const LecturerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  
  // Tag Research Direction state
  const [tags, setTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      setProfile(res);
      form.setFieldsValue({
        phone: res.phone || "",
        degree: res.degree || "",
      });
      // Parse domain csv to tags
      if (res.domain) {
        setTags(res.domain.split(",").map((t: string) => t.trim()).filter(Boolean));
      } else {
        setTags([]);
      }
    } catch (e) {
      message.error("Lỗi khi tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      const domainStr = tags.join(",");
      await updateProfile({
        phone: values.phone,
        degree: values.degree,
        domain: domainStr,
      });
      message.success("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
      fetchProfile();
    } catch (e) {
      message.error("Cập nhật hồ sơ thất bại");
    }
  };

  // Add & Delete research direction tag handlers
  const handleCloseTag = (removedTag: string) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
    if (!isEditing) {
      // Auto-save tag modifications if not editing form
      saveTagsDirectly(newTags);
    }
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputConfirm = () => {
    if (inputValue && tags.indexOf(inputValue) === -1) {
      const newTags = [...tags, inputValue];
      setTags(newTags);
      if (!isEditing) {
        saveTagsDirectly(newTags);
      }
    }
    setInputVisible(false);
    setInputValue("");
  };

  const saveTagsDirectly = async (newTags: string[]) => {
    try {
      await updateProfile({
        phone: form.getFieldValue("phone") || "",
        degree: form.getFieldValue("degree") || "",
        domain: newTags.join(","),
      });
      message.success("Đã cập nhật định hướng nghiên cứu!");
    } catch (e) {
      message.error("Không thể cập nhật tag");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" tip="Đang tải hồ sơ giảng viên..." />
      </div>
    );
  }

  // Quota Calculations
  const quota = profile?.quota || 0;
  const maxQuota = profile?.maxQuota || 5;
  const quotaPercentage = Math.min(100, Math.round((quota / maxQuota) * 100));

  // Compute colors for visual quota
  let quotaColor = "#52c41a"; // green
  if (quotaPercentage >= 100) quotaColor = "#ff4d4f"; // red
  else if (quotaPercentage >= 75) quotaColor = "#faad14"; // orange/yellow

  return (
    <div style={{ padding: "40px 30px", background: "#f5f7fa", minHeight: "100vh", fontFamily: "Outfit, sans-serif" }}>
      <Row gutter={[24, 24]} justify="center">
        {/* Profile Card with Glassmorphism */}
        <Col xs={24} lg={16}>
          <div style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 12px 40px rgba(31, 38, 135, 0.08)",
            padding: "40px",
            overflow: "hidden"
          }}>
            <Row gutter={[24, 24]} align="middle">
              {/* Avatar section */}
              <Col xs={24} sm={6} style={{ textAlign: "center" }}>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 8px 24px rgba(30, 60, 114, 0.2)",
                  color: "#fff",
                  fontSize: "48px",
                  fontWeight: "bold"
                }}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : <UserOutlined />}
                </div>
                <div style={{ marginTop: "16px" }}>
                  <Badge status="success" text="Đang hoạt động" style={{ fontWeight: "bold" }} />
                </div>
              </Col>

              {/* Info details */}
              <Col xs={24} sm={18}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", width: "100%" }}>
                  <div>
                    <Title level={2} style={{ margin: 0, color: "#1e3c72" }}>{profile?.name}</Title>
                    <Text type="secondary" style={{ fontSize: "16px" }}>Mã GV: GV-{profile?.id}</Text>
                  </div>
                  {!isEditing ? (
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />} 
                      onClick={() => setIsEditing(true)}
                      style={{ background: "#1e3c72", borderColor: "#1e3c72", borderRadius: "8px", fontWeight: "bold" }}
                    >
                      Sửa thông tin
                    </Button>
                  ) : (
                    <Space>
                      <Button onClick={() => setIsEditing(false)} style={{ borderRadius: "8px" }}>Hủy</Button>
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />} 
                        onClick={() => form.submit()}
                        style={{ background: "#52c41a", borderColor: "#52c41a", borderRadius: "8px", fontWeight: "bold" }}
                      >
                        Lưu lại
                      </Button>
                    </Space>
                  )}
                </div>

                <div style={{ margin: "20px 0", borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }} />

                <Form form={form} layout="vertical" onFinish={handleSave} disabled={!isEditing}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        label={<Text strong style={{ color: "#4f5d75" }}><BookOutlined style={{ marginRight: 8 }} />Học vị / Học hàm</Text>} 
                        name="degree"
                      >
                        <Input placeholder="Ví dụ: Tiến sĩ, Phó Giáo sư..." style={{ borderRadius: "8px" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        label={<Text strong style={{ color: "#4f5d75" }}><PhoneOutlined style={{ marginRight: 8 }} />Số điện thoại liên hệ</Text>} 
                        name="phone"
                      >
                        <Input placeholder="Nhập số điện thoại" style={{ borderRadius: "8px" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>

                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <MailOutlined style={{ marginRight: "10px", color: "#8c8c8c" }} />
                    <Text type="secondary" style={{ fontSize: "14px" }}>Email học viện: </Text>
                    <Text strong style={{ fontSize: "14px", color: "#2c3e50" }}>{profile?.email}</Text>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Research Directions Section */}
            <div style={{ marginTop: "32px", background: "rgba(30, 60, 114, 0.03)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(30, 60, 114, 0.08)" }}>
              <Title level={4} style={{ color: "#1e3c72", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0" }}>
                🎯 Định hướng Nghiên cứu & Hướng dẫn tốt nghiệp
              </Title>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleCloseTag(tag)}
                    color="blue"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "500",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
                {inputVisible ? (
                  <Input
                    type="text"
                    size="small"
                    style={{ width: 120, borderRadius: "6px" }}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleInputConfirm}
                    onPressEnter={handleInputConfirm}
                    autoFocus
                  />
                ) : (
                  <Tag 
                    onClick={showInput} 
                    style={{ 
                      background: "#fff", 
                      borderStyle: "dashed", 
                      padding: "6px 12px", 
                      borderRadius: "6px", 
                      cursor: "pointer", 
                      fontSize: "14px" 
                    }}
                  >
                    <PlusOutlined /> Thêm định hướng mới
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </Col>

        {/* Quota Progress widget */}
        <Col xs={24} lg={8}>
          <div style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 12px 40px rgba(31, 38, 135, 0.08)",
            padding: "40px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Title level={4} style={{ color: "#1e3c72", marginBottom: "30px", textAlign: "center" }}>
              📊 Chỉ tiêu Hướng dẫn (Quota)
            </Title>
            
            {/* Custom SVG circle indicator */}
            <div style={{ position: "relative", width: "180px", height: "180px", marginBottom: "20px" }}>
              <svg width="100%" height="100%" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="55" fill="transparent" stroke="#f0f2f5" strokeWidth="12" />
                <circle 
                  cx="70" 
                  cy="70" 
                  r="55" 
                  fill="transparent" 
                  stroke={quotaColor} 
                  strokeWidth="12" 
                  strokeDasharray="345.575" 
                  strokeDashoffset={345.575 - (quotaPercentage / 100) * 345.575} 
                  transform="rotate(-90 70 70)"
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "40px", fontWeight: "bold", color: "#1e3c72", lineHeight: "1" }}>{quota}</div>
                <div style={{ fontSize: "14px", color: "#8c8c8c", marginTop: "6px" }}>trên {maxQuota} SV</div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Text strong style={{ fontSize: "16px", color: quotaColor }}>
                {quotaPercentage}% Chỉ tiêu hướng dẫn
              </Text>
              <div style={{ color: "#8c8c8c", fontSize: "12px", marginTop: "8px" }}>
                * Đếm theo tổng số lượng sinh viên đã phê duyệt đề tài và đang thực hiện trong học kỳ này.
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LecturerProfile;
