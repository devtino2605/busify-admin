import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Tag,
  Space,
  Avatar,
  Divider,
  Skeleton,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { blogApi } from "../../../app/api/blog";
import type { BlogPost } from "../../../app/api/blog";
import "../styles/BlogPostContent.css";

// Add custom styles for the preview container
const previewStyles = {
  blogPreviewContainer: {
    padding: "20px 0",
    maxWidth: "1200px",
    margin: "0 auto",
  },
};

const { Title, Text } = Typography;

interface LocationState {
  post?: BlogPost;
}

const BlogPostPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState<boolean>(true);
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    // If post was passed in location state, use it
    if (state?.post) {
      setPost(state.post);
      setLoading(false);
      return;
    }

    // Otherwise load from API
    const fetchPost = async () => {
      if (!id) {
        message.error("Post ID not provided");
        navigate("/admin/blog-posts");
        return;
      }

      try {
        setLoading(true);
        const postId = parseInt(id);
        const response = await blogApi.getPostById(postId);
        const fetchedPost =
          "result" in response.data
            ? (response.data.result as BlogPost)
            : (response.data as BlogPost);
        setPost(fetchedPost);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        message.error("Failed to load blog post for preview");
        navigate("/admin/blog-posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate, state]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unpublished";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (!post) {
    return (
      <Card>
        <Title level={4}>Post not found</Title>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/blog-posts")}
        >
          Back to Posts
        </Button>
      </Card>
    );
  }

  return (
    <div style={previewStyles.blogPreviewContainer}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/admin/blog-posts")}
              >
                Back to Posts
              </Button>
              {post.id && (
                <Button
                  onClick={() => navigate(`/admin/blog-edit/${post.id}`)}
                  style={{ marginLeft: 8 }}
                  type="primary"
                >
                  Edit Post
                </Button>
              )}
            </div>
            <Tag
              color={post.published ? "success" : "default"}
              style={{ fontSize: "14px" }}
            >
              {post.published ? "Published" : "Draft"} Preview
            </Tag>
          </div>

          <div style={{ marginTop: 24, maxWidth: "800px", margin: "0 auto" }}>
            {post.imageUrl && (
              <div style={{ marginBottom: 24 }}>
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </div>
            )}

            <Title
              level={1}
              style={{ fontSize: "2.5em", marginBottom: "0.5em" }}
            >
              {post.title}
            </Title>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              {post.author && (
                <Space>
                  <Avatar
                    src={
                      post.author.imageUrl ||
                      "https://joeschmoe.io/api/v1/random"
                    }
                  />
                  <Text strong>{post.author.name}</Text>
                </Space>
              )}
              <Text type="secondary">
                {formatDate(post.publishedAt || post.createdAt)}
              </Text>
              {post.readingTime && (
                <Text type="secondary">{post.readingTime} min read</Text>
              )}

              {post.featured && <Tag color="gold">Featured Post</Tag>}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {post.tags.map((tag) => (
                  <Tag
                    color="blue"
                    key={tag}
                    style={{ marginRight: "8px", marginBottom: "8px" }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            {post.excerpt && (
              <div
                style={{
                  fontSize: "18px",
                  fontStyle: "italic",
                  color: "#555",
                  marginBottom: 24,
                  padding: "15px",
                  borderLeft: "4px solid #1890ff",
                  backgroundColor: "rgba(24, 144, 255, 0.05)",
                }}
              >
                {post.excerpt}
              </div>
            )}

            <Divider />

            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Divider />

            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div>
                {post.viewCount !== undefined && (
                  <Text type="secondary">{post.viewCount} views</Text>
                )}
              </div>
              <Text type="secondary">
                Last updated: {formatDate(post.updatedAt)}
              </Text>
            </div>

            {/* Buttons at the bottom for easy navigation */}
            <div
              style={{
                marginTop: 40,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/admin/blog-posts")}
              >
                Back to Posts
              </Button>
              {post.id && (
                <Button
                  type="primary"
                  onClick={() => navigate(`/admin/blog-edit/${post.id}`)}
                >
                  Edit Post
                </Button>
              )}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default BlogPostPreview;
