import React from 'react';
import { Avatar, Typography, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const StudentHeader: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #4338ca 100%)',
        borderRadius: 24,
        padding: '26px 30px',
        marginBottom: 24,
        boxShadow: '0 10px 35px rgba(37, 99, 235, 0.18)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Glow Background */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(10px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          filter: 'blur(12px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <Avatar
            size={74}
            icon={<UserOutlined />}
            src="https://api.dicebear.com/7.x/notionists/svg?seed=An"
            style={{
              border: '3px solid rgba(255,255,255,0.75)',
              boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
              background: '#fff',
            }}
          />

          <div>
            <Space
              size={10}
              align="center"
              style={{ marginBottom: 6 }}
            >
              <Title
                level={3}
                style={{
                  margin: 0,
                  color: '#fff',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                Đặng Thái An
              </Title>

              <Tag
                style={{
                  margin: 0,
                  border: 'none',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '4px 12px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Sinh viên
              </Tag>
            </Space>

            <Space
              size={18}
              wrap
              style={{
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 14,
                }}
              >
                MSV: <strong>B24DCCC002</strong>
              </Text>

              <Text
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 14,
                }}
              >
                CNTT • PTIT
              </Text>
            </Space>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  minWidth: 120,
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    display: 'block',
                  }}
                >
                  GPA hiện tại
                </Text>

                <Text
                  strong
                  style={{
                    color: '#fff',
                    fontSize: 20,
                  }}
                >
                  3.5 / 4.0
                </Text>
              </div>

              <div
                style={{
                  minWidth: 120,
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    display: 'block',
                  }}
                >
                  Học kỳ hiện tại
                </Text>

                <Text
                  strong
                  style={{
                    color: '#fff',
                    fontSize: 20,
                  }}
                >
                  HK2
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              transition: '0.25s',
            }}
          >
            <CalendarOutlined
              style={{
                fontSize: 22,
                color: '#fff',
              }}
            />
          </div>

          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              transition: '0.25s',
            }}
          >
            <BookOutlined
              style={{
                fontSize: 22,
                color: '#fff',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;