import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Select,
  Switch,
  Typography,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import type { TablePaginationConfig } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { blogApi } from "../../../app/api/blog";
import type { BlogFilterParams, BlogPost } from "../../../app/api/blog";
import { useNavigate } from "react-router-dom";
import type { SorterResult, FilterValue } from "antd/es/table/interface";

interface Author {
  id: number;
  name: string;
  email: string;
  imageUrl?: string;
  bio?: string;
  role: string;
}

const { Title } = Typography;
const { Option } = Select;

const BlogPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<BlogFilterParams>({
    page: 0,
    size: 10,
    sortBy: "publishedAt",
    sortDirection: "DESC",
  });
  const [tags, setTags] = useState<string[]>([]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await blogApi.getPostsWithFilter(filters);
      // Extract data from response, handling both direct and wrapped responses
      const responseData = response.data;
      // Type assertion for data
      const data = (
        "result" in responseData ? responseData.result : responseData
      ) as {
        posts: {
          content: BlogPost[];
          pageable: {
            pageNumber: number;
            pageSize: number;
          };
          totalElements: number;
        };
      };

      // Now data is properly typed
      setPosts(data.posts.content);
      setPagination({
        current: data.posts.pageable.pageNumber + 1,
        pageSize: data.posts.pageable.pageSize,
        total: data.posts.totalElements,
      });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      message.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await blogApi.getTags();
      // API response is wrapped in a result property
      const responseData = response.data;
      if (
        responseData &&
        typeof responseData === "object" &&
        "result" in responseData
      ) {
        setTags(responseData.result as string[]);
      } else {
        // Direct array response
        setTags(responseData as string[]);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      message.error("Failed to load tags");
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchPosts();
  }, [fetchTags, fetchPosts]);

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<BlogPost> | SorterResult<BlogPost>[]
  ) => {
    const sorterObj = Array.isArray(sorter) ? sorter[0] : sorter;
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ? pagination.current - 1 : 0,
      size: pagination.pageSize || 10,
      sortBy: sorterObj.field?.toString() || "publishedAt",
      sortDirection: sorterObj.order === "descend" ? "DESC" : "ASC",
    }));
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 0,
    }));
  };

  const handleTagFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      tag: value,
      page: 0,
    }));
  };

  const handlePublishedFilter = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      published: checked,
      page: 0,
    }));
  };

  const handleFeaturedFilter = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      featured: checked,
      page: 0,
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      await blogApi.deletePost(id);
      message.success("Blog post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      message.error("Failed to delete blog post");
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      await blogApi.markPostAsFeatured(post.id!);
      message.success(
        `Post ${post.featured ? "removed from" : "marked as"} featured`
      );
      fetchPosts();
    } catch (error) {
      console.error("Failed to update post:", error);
      message.error("Failed to update featured status");
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: BlogPost) => (
        <Space>
          {record.featured && (
            <Tooltip title="Featured Post">
              <StarFilled style={{ color: "#faad14" }} />
            </Tooltip>
          )}
          <span>{text}</span>
        </Space>
      ),
      sorter: true,
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      render: (author: Author | undefined) => author?.name || "Unknown",
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: string[]) => (
        <span>
          {tags?.map((tag) => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      key: "publishedAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "Draft",
      sorter: true,
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: BlogPost) => (
        <Space size="small">
          <Tooltip
            title={
              record.featured ? "Remove from featured" : "Mark as featured"
            }
          >
            <Button
              icon={
                record.featured ? (
                  <StarFilled style={{ color: "#faad14" }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={() => handleToggleFeatured(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/blog-edit/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Preview">
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/blog-preview/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this post?"
            onConfirm={() => handleDelete(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space style={{ display: "flex", justifyContent: "space-between" }}>
          <Title level={4}>Blog Posts Management</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/blog-create")}
          >
            Create New Post
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="Search posts..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 200 }}
          />

          <Select
            placeholder="Filter by tag"
            style={{ width: 150 }}
            onChange={handleTagFilter}
            allowClear
          >
            {tags.map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>

          <Space>
            <span>Published only:</span>
            <Switch
              onChange={handlePublishedFilter}
              checked={filters.published || false}
            />
          </Space>

          <Space>
            <span>Featured only:</span>
            <Switch
              onChange={handleFeaturedFilter}
              checked={filters.featured || false}
            />
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Space>
    </Card>
  );
};

export default BlogPostsPage;
