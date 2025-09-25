import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Space,
  message,
  Typography,
  Upload,
  Spin,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import { useNavigate, useParams } from "react-router-dom";
import { blogApi } from "../../../app/api/blog";
import type { BlogPost } from "../../../app/api/blog";
import type { RcFile, UploadFile } from "antd/es/upload/interface";

const { Title } = Typography;
const { Option } = Select;

interface BlogPostFormProps {
  editMode?: boolean;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  // Define a type for the TinyMCE editor reference
  interface TinyMCEEditor {
    getContent: () => string;
    setContent: (content: string) => void;
  }

  const editorRef = useRef<TinyMCEEditor | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [initialContent, setInitialContent] = useState<string>("");

  // Fetch blog post details for edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available tags
        const tagsResponse = await blogApi.getTags();
        const tagsData = tagsResponse.data;
        if ("result" in tagsData) {
          setTags(tagsData.result as string[]);
        } else {
          setTags(tagsData as string[]);
        }

        // Fetch post details if in edit mode
        if (editMode && id) {
          setLoading(true);
          const postId = parseInt(id);
          const response = await blogApi.getPostById(postId);
          const post =
            "result" in response.data
              ? (response.data.result as BlogPost)
              : (response.data as BlogPost);

          // Set form values
          form.setFieldsValue({
            title: post.title,
            excerpt: post.excerpt,
            tags: post.tags,
            featured: post.featured,
            published: post.publishedAt ? true : false,
          });

          if (post.imageUrl) {
            setImageUrl(post.imageUrl);
            setFileList([
              {
                uid: "-1",
                name: "image.png",
                status: "done",
                url: post.imageUrl,
              },
            ]);
          }

          // Store content in state to handle timing issues with editor initialization
          if (post.content) {
            setInitialContent(post.content);
            // Also try to set immediately if editor is already initialized
            if (editorRef.current) {
              editorRef.current.setContent(post.content);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [editMode, id, form]);

  // Handle form submission
  interface FormValues {
    title: string;
    excerpt?: string;
    tags?: string[];
    featured?: boolean;
    published?: boolean;
  }

  const handleSubmit = async (values: FormValues) => {
    if (!editorRef.current) {
      message.error("Editor is not initialized");
      return;
    }

    const content = editorRef.current.getContent();
    if (!content) {
      message.error("Content cannot be empty");
      return;
    }

    setSaving(true);

    try {
      const postData: Partial<BlogPost> = {
        title: values.title,
        excerpt: values.excerpt,
        content,
        tags: values.tags || [],
        featured: values.featured || false,
        published: values.published || false,
      };

      // Add image file if available in fileList
      if (fileList.length > 0 && fileList[0].originFileObj) {
        postData.image = fileList[0].originFileObj;
      }

      if (editMode && id) {
        await blogApi.updatePost(parseInt(id), postData);
        message.success("Blog post updated successfully");
      } else {
        await blogApi.createPost(postData as Omit<BlogPost, "id">);
        message.success("Blog post created successfully");
      }

      navigate("/admin/blog-posts");
    } catch (error) {
      console.error("Failed to save post:", error);
      message.error("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  // Handle tag input
  const handleTagChange = (value: string[]) => {
    // Check if there are any new tags that don't exist in the predefined list
    const newItems = value.filter((tag) => !tags.includes(tag));
    setNewTags(newItems);
  };

  // Handle file upload
  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);

    // Clear the file if empty fileList
    if (fileList.length === 0) {
      setImageUrl(undefined);
    }
  };

  // Custom image upload handler for TinyMCE
  interface BlobInfo {
    blob: () => Blob;
  }

  const handleEditorImageUpload = async (
    blobInfo: BlobInfo,
  ) => {
    // This is a placeholder for image upload functionality
    // In a real application, you would upload the image to your server or cloud storage
    // For now, we'll just create a data URL as an example
    return new Promise<string>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          // In production, replace this with actual image upload logic
          resolve(dataUrl);
        };
        reader.readAsDataURL(blobInfo.blob());
      } catch (e) {
        console.error("Image upload failed:", e);
        reject("Image upload failed");
      }
    });
  };

  // Before upload handler for the featured image
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }

    const isLessThan2MB = file.size / 1024 / 1024 < 2;
    if (!isLessThan2MB) {
      message.error("Image must be smaller than 2MB!");
    }

    if (isImage && isLessThan2MB) {
      // Store the file object for FormData upload
      setImageUrl(URL.createObjectURL(file));
    }

    // Return false to prevent automatic upload
    return false;
  };

  if (loading) {
    return (
      <Card style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space style={{ display: "flex", justifyContent: "space-between" }}>
          <Title level={4}>
            {editMode ? "Edit Blog Post" : "Create New Blog Post"}
          </Title>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/blog-posts")}
          >
            Back to Posts
          </Button>
        </Space>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            featured: false,
            published: false,
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Please enter a title" },
              { max: 200, message: "Title must be less than 200 characters" },
            ]}
          >
            <Input placeholder="Enter post title" />
          </Form.Item>

          <Form.Item
            name="excerpt"
            label="Excerpt"
            rules={[
              {
                max: 1000,
                message: "Excerpt must be less than 1000 characters",
              },
            ]}
          >
            <Input.TextArea placeholder="Brief summary of the post" rows={3} />
          </Form.Item>

          <Form.Item label="Featured Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                style={{ maxWidth: "200px", marginTop: "10px" }}
              />
            )}
          </Form.Item>

          <Form.Item
            label="Content"
            rules={[{ required: true, message: "Please enter content" }]}
          >
            <Editor
              apiKey="ihi0luk0eydsmetb1pogrw9yc763goyeua3658cczv8gn8u5"
              initialValue={initialContent}
              onInit={(_evt: unknown, editor: TinyMCEEditor) => {
                editorRef.current = editor;
                // Set content when editor initializes if we have content
                if (initialContent && editor) {
                  editor.setContent(initialContent);
                }
              }}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "preview",
                  "help",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                images_upload_handler: handleEditorImageUpload,
              }}
            />
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Select or create tags"
              onChange={handleTagChange}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  {newTags.length > 0 && (
                    <div style={{ padding: "8px", color: "#1890ff" }}>
                      New tags will be created: {newTags.join(", ")}
                    </div>
                  )}
                </div>
              )}
            >
              {tags.map((tag) => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Space>
            <span>Featured:</span>
            <Form.Item
              name="featured"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>
            <span> Published:</span>

            <Form.Item
              name="published"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {editMode ? "Update Post" : "Save Post"}
              </Button>

              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  if (!editorRef.current) {
                    message.error("Editor is not initialized");
                    return;
                  }

                  const content = editorRef.current.getContent();
                  if (!content) {
                    message.error("Content cannot be empty");
                    return;
                  }

                  // Create a temporary post object for preview
                  const formValues = form.getFieldsValue();
                  const previewPost: BlogPost = {
                    title: formValues.title || "Untitled",
                    content: content,
                    excerpt: formValues.excerpt,
                    tags: formValues.tags || [],
                    featured: formValues.featured || false,
                    published: formValues.published || false,
                    // Use existing data or defaults
                    ...(editMode && id ? { id: parseInt(id) } : {}),
                    ...(imageUrl ? { imageUrl } : {}),
                  };

                  // Navigate to preview with the post data
                  navigate("/admin/blog-preview/draft", {
                    state: { post: previewPost },
                  });
                }}
              >
                Preview
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
};

export default BlogPostForm;
