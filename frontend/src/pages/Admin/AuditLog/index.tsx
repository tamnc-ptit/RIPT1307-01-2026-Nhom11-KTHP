import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Typography, message, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getAuditLogs } from "../../../services/admin";
import dayjs from "dayjs";
import { AuditLogItem, AuditLogResponse } from "../../../types/AdminTypes/AuditLogTypes";

const { Title } = Typography;



const ACTION_COLOR: Record<string, string> = {
  CREATE: "green",
  DELETE: "red",
  UPDATE: "orange",
  APPROVE: "blue",
  REJECT: "purple",
};

const AuditLog: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  const fetchLogs = async (page: number, limit: number, searchText: string) => {
    setLoading(true);
    try {
      const response = (await getAuditLogs({
        page,
        limit,
        search: searchText || undefined,
      })) as AuditLogResponse;

      if (response && Array.isArray(response.data)) {
        setData(response.data);
        setTotal(response.total ?? 0);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch {
      message.error("Không thể tải nhật ký hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(current, pageSize, search);
  }, [current, pageSize, search]);

  const handleSearch = () => {
    setCurrent(1);
    setSearch(searchInput);
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (text: string) =>
        text ? dayjs(text).format("DD/MM/YYYY HH:mm:ss") : "—",
    },
    {
      title: "Người thực hiện",
      dataIndex: "actor_name",
      key: "actor_name",
      width: 160,
      render: (text: string | null) => (
        <Typography.Text strong>{text || "Hệ thống"}</Typography.Text>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 110,
      render: (action: string) => (
        <Tag color={ACTION_COLOR[action] ?? "blue"}>{action}</Tag>
      ),
    },
    {
      title: "Bảng tác động",
      dataIndex: "target_table",
      key: "target_table",
      width: 130,
      render: (text: string | null) =>
        text ? <Tag color="geekblue">{text}</Tag> : <span>—</span>,
    },
    {
      title: "ID đối tượng",
      dataIndex: "target_id",
      key: "target_id",
      width: 100,
      align: "center" as const,
      render: (id: number | null) => id ?? "—",
    },
    {
      title: "Dữ liệu thay đổi",
      key: "values",
      render: (_: unknown, record: AuditLogItem) => (
        <div style={{ maxWidth: 380, fontSize: 12 }}>
          {record.old_value && (
            <div style={{ color: "#cf1322" }}>
              <strong>Cũ:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>
                {record.old_value}
              </span>
            </div>
          )}
          {record.new_value && (
            <div style={{ color: "#389e0d", marginTop: 4 }}>
              <strong>Mới:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>
                {record.new_value}
              </span>
            </div>
          )}
          {!record.old_value && !record.new_value && (
            <span style={{ color: "#aaa" }}>—</span>
          )}
        </div>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 130,
      render: (text: string | null) => text || "N/A",
    },
  ];

  return (
    <Card style={{ margin: 24 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        📜 Nhật Ký Hệ Thống (Audit Logs)
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên người thực hiện, hành động..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 340 }}
        />
        <Typography.Text
          type="link"
          style={{ cursor: "pointer" }}
          onClick={handleSearch}
        >
          Tìm kiếm
        </Typography.Text>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
        locale={{ emptyText: "Không có nhật ký nào" }}
        pagination={{
          current,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} bản ghi`,
          onChange: (page, size) => {
            setCurrent(page);
            setPageSize(size ?? 10);
          },
        }}
      />
    </Card>
  );
};

export default AuditLog;
