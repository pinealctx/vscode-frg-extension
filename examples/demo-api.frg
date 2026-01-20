syntax = "v1"

info(
    title: "Demo API"
    desc: "A comprehensive FRG language example"
    version: "v1.0.0"
    author: "FRG Team"
)

// External type definitions
@externDefs {
    name:"time.Time", swaggerType:"string", importPath:"time"
    name:"json.RawMessage", swaggerType:"interface{}", importPath:"encoding/json"
}

// ==================== Common Types ====================

// Pagination request wrapper
type PageRequest {
    Page     int32  `json:"page" validate:"min=1"`
    PageSize int32  `json:"pageSize" validate:"min=1,max=100"`
}

// Pagination response wrapper
type PageResponse {
    Total int64 `json:"total"`
    Page  int32 `json:"page"`
    Size  int32 `json:"size"`
}

// Standard error response
type ErrorResponse {
    Code    int32  `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

// ==================== User & Auth ====================

type RegisterRequest {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    FullName string `json:"fullName" validate:"required"`
}

type LoginRequest {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type AuthResponse {
    AccessToken string `json:"accessToken"`
    TokenType   string `json:"tokenType"`
    ExpiresIn   int32  `json:"expiresIn"`
    RefreshToken string `json:"refreshToken,omitempty"`
}

type User {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    FullName  string    `json:"fullName"`
    Avatar    string    `json:"avatar,omitempty"`
    Status    UserStatus `json:"status"`
    CreatedAt time.Time  `json:"createdAt"`
    UpdatedAt time.Time  `json:"updatedAt"`
}

enum UserStatus {
    Active   = 1; // Active user
    Inactive = 2; // Inactive user
    Suspended = 3; // Suspended user
}

type UpdateProfileRequest {
    FullName string `json:"fullName" validate:"required"`
    Avatar   string `json:"avatar"`
}

type ChangePasswordRequest {
    OldPassword string `json:"oldPassword" validate:"required"`
    NewPassword string `json:"newPassword" validate:"required,min=8"`
}

// ==================== Blog/Content ====================

type Post {
    ID        string    `json:"id"`
    Title     string    `json:"title" validate:"required"`
    Content   string    `json:"content" validate:"required"`
    AuthorID  string    `json:"authorId"`
    Status    PostStatus `json:"status"`
    Tags      []string  `json:"tags,omitempty"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}

enum PostStatus {
    Draft     = 0; // Draft post
    Published = 1; // Published post
    Archived  = 2; // Archived post
}

type CreatePostRequest {
    Title   string   `json:"title" validate:"required"`
    Content string   `json:"content" validate:"required"`
    Tags    []string `json:"tags"`
}

type UpdatePostRequest {
    Title   string   `json:"title" validate:"required"`
    Content string   `json:"content" validate:"required"`
    Tags    []string `json:"tags"`
    Status  PostStatus `json:"status"`
}

type PostListResponse {
    Posts     []*Post       `json:"posts"`
    TotalCount int64        `json:"totalCount"`
}

// ==================== Search ====================

type SearchRequest {
    Query  string `json:"query" validate:"required,min=1,max=100"`
    Type   string `json:"type" validate:"required,oneof=all user post"`
    Filters map[string]string `json:"filters,omitempty"`
}

type SearchResult {
    Type string         `json:"type"`
    ID   string         `json:"id"`
    Title string         `json:"title"`
    Data json.RawMessage `json:"data,omitempty"`
}

// ==================== Services ====================

@attr(
    group: "auth"
    desc: "Authentication and user management operations"
)
service {
    // summary: Register new user
    // tags: Auth, Users
    @handler register
    post /api/v1/auth/register(RegisterRequest) returns(User)

    // summary: User login
    // tags: Auth
    @handler login
    post /api/v1/auth/login(LoginRequest) returns(AuthResponse)

    // summary: Get current user profile
    // tags: Users, Profile
    @handler getProfile
    get /api/v1/users/profile() returns(User)

    // summary: Update user profile
    // tags: Users, Profile
    @handler updateProfile
    put /api/v1/users/profile(UpdateProfileRequest) returns(User)

    // summary: Change password
    // tags: Users, Security
    @handler changePassword
    post /api/v1/users/password(ChangePasswordRequest) returns()
}

@attr(
    group: "posts"
    desc: "Blog post management"
)
service {
    // summary: Create a new post
    // tags: Posts, Content
    @handler createPost
    post /api/v1/posts(CreatePostRequest) returns(Post)

    // summary: Get post by ID
    // tags: Posts, Content
    @handler getPost
    get /api/v1/posts/:id() returns(Post)

    // summary: Update post
    // tags: Posts, Content
    @handler updatePost
    put /api/v1/posts/:id(UpdatePostRequest) returns(Post)

    // summary: Delete post
    // tags: Posts, Content
    @handler deletePost
    delete /api/v1/posts/:id() returns()

    // summary: List posts with pagination
    // tags: Posts, Content
    @handler listPosts
    get /api/v1/posts(PageRequest) returns(PostListResponse)

    // summary: Search posts
    // tags: Posts, Search
    @handler searchPosts
    post /api/v1/posts/search(SearchRequest) returns(PostListResponse)
}

@attr(
    group: "search"
    desc: "Global search across all content types"
)
service {
    // summary: Search across all content
    // tags: Search
    @handler search
    post /api/v1/search(SearchRequest) returns([]*SearchResult)
}
