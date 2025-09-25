import axios from "./index";
import type { ApiResponse } from "./index";

// Types
export interface BlogPost {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  imageUrl?: string; // URL of the image (response)
  image?: File; // File object for upload (request)
  tags: string[];
  featured: boolean;
  published: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id: number;
    name: string;
    email: string;
    imageUrl?: string;
    bio?: string;
    role: string;
  };
  readingTime?: number;
  viewCount?: number;
}

export interface BlogPostPageDTO {
  posts: {
    content: BlogPost[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
  };
}

// Filter parameters
export interface BlogFilterParams {
  search?: string;
  published?: boolean;
  featured?: boolean;
  tag?: string;
  myPosts?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * Helper function to build FormData from BlogPost object
 */
const buildBlogFormData = (post: Partial<BlogPost>): FormData => {
  const formData = new FormData();

  // Add basic fields
  if (post.title !== undefined) {
    formData.append("title", post.title);
  }

  if (post.excerpt !== undefined) {
    formData.append("excerpt", post.excerpt);
  }

  if (post.content !== undefined) {
    formData.append("content", post.content);
  }

  // Add image if available
  if (post.image) {
    formData.append("image", post.image);
  }

  // Handle tags array
  if (post.tags && post.tags.length > 0) {
    formData.append("tags", JSON.stringify(post.tags));
  }

  // Handle boolean fields
  if (post.featured !== undefined) {
    formData.append("featured", String(post.featured));
  }

  if (post.published !== undefined) {
    formData.append("published", String(post.published));
  }

  return formData;
};

// APIs
export const blogApi = {
  // Get all blog posts with filtering
  getPostsWithFilter: (params: BlogFilterParams = {}) => {
    return axios.get<ApiResponse<BlogPostPageDTO>>("/api/blogs/posts/filter", {
      params,
    });
  },

  // Get a single blog post by ID
  getPostById: (id: number) => {
    return axios.get<ApiResponse<BlogPost>>(`/api/blogs/posts/${id}`);
  },

  // Create a new blog post with FormData for file upload
  createPost: (post: Omit<BlogPost, "id">) => {
    const formData = buildBlogFormData(post);

    return axios.post<ApiResponse<BlogPost>>("/api/blogs/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update a blog post with FormData for file upload
  updatePost: (id: number, post: Partial<BlogPost>) => {
    const formData = buildBlogFormData(post);

    return axios.put<ApiResponse<BlogPost>>(
      `/api/blogs/posts/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  markPostAsFeatured: (id: number) => {
    return axios.put<ApiResponse<BlogPost>>(
      `/api/blogs/posts/${id}/featured`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  markPostAsPublished: (id: number) => {
    return axios.put<ApiResponse<BlogPost>>(
      `/api/blogs/posts/${id}/published`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  // Delete a blog post
  deletePost: (id: number) => {
    return axios.delete<ApiResponse<void>>(`/api/blogs/posts/${id}`);
  },

  // Get all available tags
  getTags: () => {
    return axios.get<ApiResponse<string[]>>("/api/blogs/tags");
  },
};

export default blogApi;
