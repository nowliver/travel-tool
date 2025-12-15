# LiteTravel - Architecture Documentation

> **Last Updated**: 2025-12-15  
> **Version**: 2.1.0  
> **Status**: Active Development

---

## 📐 System Overview

LiteTravel is a **full-stack** travel planning application combining map visualization with itinerary management. The architecture follows a **React + Zustand** frontend with a **FastAPI** backend for user authentication and data persistence.

### Core Concepts
- **Full-Stack Architecture**: React frontend + FastAPI backend + SQLite/PostgreSQL
- **JWT Authentication**: Secure user sessions with token-based auth
- **Hybrid Storage**: Local-first with optional cloud sync for logged-in users
- **Multi-Source Content**: Aggregated data from AMap, Ctrip, Xiaohongshu (v2.1+)
- **Mock-First Strategy**: All services have mock implementations for offline development
- **POI-Driven Interaction**: Map interactions revolve around Points of Interest (POI)
- **Service Layer Isolation**: UI components never call APIs directly

---

## 🔐 Backend Architecture (NEW in v2.0)

### Technology Stack
- **Framework**: Python FastAPI
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLAlchemy
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Pydantic schemas

### Backend Directory Structure
```
backend/
├── app/
│   ├── api/              # API Endpoints
│   │   ├── auth.py       # POST /register, /login, /logout, GET /me
│   │   ├── plans.py      # CRUD for /plans
│   │   ├── content.py    # GET /content/search (v2.1+)
│   │   └── deps.py       # get_current_user dependency
│   ├── core/             # Core Configuration
│   │   ├── config.py     # Environment settings (JWT_SECRET_KEY, DATABASE_URL, AMAP_KEY)
│   │   └── security.py   # JWT encode/decode, password hashing
│   ├── db/               # Database Layer
│   │   └── base.py       # SQLAlchemy engine, session, Base class
│   ├── models/           # SQLAlchemy Models
│   │   ├── user.py       # User entity
│   │   └── itinerary.py  # ItineraryPlan entity
│   ├── schemas/          # Pydantic Schemas
│   │   ├── user.py       # UserCreate, UserLogin, Token, UserResponse
│   │   ├── itinerary.py  # ItineraryCreate, ItineraryUpdate, ItineraryResponse
│   │   └── content.py    # ContentCategory, AttractionItem, HotelItem, etc. (v2.1+)
│   └── services/         # Business Logic Services (v2.1+)
│       ├── sources/      # Data source integrations
│       │   ├── base.py   # BaseSource abstract class
│       │   └── amap.py   # 高德地图 POI API
│       ├── llm/          # LLM processing (future)
│       └── content/      # Content aggregation (future)
├── .env                  # Environment variables (not committed)
├── main.py               # FastAPI app entry point
├── pyproject.toml        # uv dependencies (v2.0+)
└── uv.lock               # Dependency lock file
```

### Content Service Architecture (v2.1+)

```
用户请求 → /api/content/search
    ↓
ContentAPI (content.py)
    ↓
DataSource 层 (sources/)
    ├── AmapSource (amap.py)     → 高德地图 POI API
    ├── CtripSource (future)     → 携程酒店/机票
    └── XiaohongshuSource (future) → 小红书攻略
    ↓
统一 Schema 转换 (schemas/content.py)
    ↓
(Future) LLM 整合层 (llm/)
    ↓
返回标准化响应
```

#### Content Categories

| 类别 | 数据源 | Schema |
|------|--------|--------|
| 景点 (attraction) | 高德 + 小红书 | `AttractionItem` |
| 住宿 (hotel) | 携程 + 美团 | `HotelItem` |
| 美食 (dining) | 高德 + 小红书 | `DiningItem` |
| 出行 (commute) | 携程 + 高德 | `CommuteItem` |

### Data Models

#### User
```python
class User:
    id: str (UUID)
    email: str (unique, indexed)
    hashed_password: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

#### ItineraryPlan
```python
class ItineraryPlan:
    id: str (UUID)
    user_id: str (ForeignKey -> User)
    title: str
    description: str (optional)
    content_json: JSON  # Contains {meta, days} matching frontend TripStoreState
    created_at: datetime
    updated_at: datetime
```

### Authentication Flow
```
User Register/Login
  ↓
[POST /api/auth/register or /login]
  ↓
Backend validates credentials → bcrypt.verify()
  ↓
Generate JWT token with user_id in payload
  ↓
Return { access_token, user }
  ↓
Frontend stores token in localStorage
  ↓
Subsequent requests include: Authorization: Bearer <token>
  ↓
[get_current_user dependency] decodes token → returns User
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/login` | No | Authenticate and get token |
| GET | `/api/auth/me` | Yes | Get current user info |
| POST | `/api/auth/logout` | Yes | Logout (client discards token) |
| GET | `/api/plans` | Yes | List user's itineraries |
| POST | `/api/plans` | Yes | Create new itinerary |
| GET | `/api/plans/{id}` | Yes | Get itinerary details |
| PUT | `/api/plans/{id}` | Yes | Update itinerary |
| DELETE | `/api/plans/{id}` | Yes | Delete itinerary |

### Environment Variables
```
JWT_SECRET_KEY=<secret-key>      # MUST change in production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours
DATABASE_URL=sqlite:///./litetravel.db
```

---

## 🗺️ Core Components Map

### Layout Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| `Shell` | `src/components/layout/Shell.tsx` | Root layout container (sidebar + map split) |
| `ResizeHandle` | `src/components/layout/ResizeHandle.tsx` | Draggable sidebar width control (12px hit area) |
| `FloatingNavLayer` | `src/components/layout/FloatingNavLayer.tsx` | Floating navigation drawer (Attractions/Hotel/Dining/Commute) |

### Map Components

| Component | Path | Key Props | Responsibility |
|-----------|------|-----------|----------------|
| `MapContainer` | `src/components/map/MapContainer.tsx` | - | AMap integration, event handlers, marker management |
| `LocationDetailBar` | `src/components/map/LocationDetailBar.tsx` | `poi`, `isOpen`, `onAddToFavorites`, `onAddToPlan` | Bottom sheet for POI details and actions |

**MapContainer State**:
```typescript
selectedPOI: {
  name: string;
  location: GeoLocation;
  address?: string;
  type?: NodeType;
} | null

isDetailBarOpen: boolean
```

**MapContainer Event Handlers**:
- `map.on("rightclick")` → Show context menu with "Add to Favorites/Plan"
- `map.on("click")` → 
  - If Marker click → Open `LocationDetailBar`
  - If blank area → Clear highlights & close menus

### Itinerary Components

| Component | Path | Key Features |
|-----------|------|--------------|
| `ItineraryPanel` | `src/components/itinerary/ItineraryPanel.tsx` | Day management, search, drag-drop orchestration |
| `NodeCard` | `src/components/itinerary/NodeCard.tsx` | Right-click context menu (Add to Favorites / Locate / Delete) |
| `DayTabs` | `src/components/itinerary/DayTabs.tsx` | Day switcher with `@dnd-kit` droppable zones |

### UI Utilities

| Component | Path | Features |
|-----------|------|----------|
| `ContextMenu` | `src/components/ui/ContextMenu.tsx` | Config-driven, sub-menu support, click-away dismiss |
| `AttractionsView` | `src/components/views/AttractionsView.tsx` | Favorites list with locate/delete actions |

---

## 🏗️ Logical Architecture

### User Interaction Flows

#### Flow 1: Right-Click on Map (空白区域)
```
User Right-Clicks Map (Blank Area)
  ↓
[MapContainer] Captures `e.pixel` → Convert to viewport coords
  ↓
[MapService] fetchAddressByLocation(lng, lat)
  ↓
[ContextMenu] Shows: "Add to Favorites" | "Add to Plan (Day 1/2/3...)"
  ↓
User Selects Action → Store.addFavorite() or Store.addNode()
```

**Coordinate Fix**:
```typescript
// ❌ Old (Incorrect)
{ clientX: e.pixel.x, clientY: e.pixel.y }

// ✅ Fixed (Correct)
const containerRect = containerRef.current?.getBoundingClientRect();
{ 
  clientX: containerRect.left + e.pixel.x,
  clientY: containerRect.top + e.pixel.y 
}
```

#### Flow 2: Click on Map Marker (POI 交互)
```
User Clicks Marker
  ↓
[MapContainer] Detects isMarkerClick (via DOM target inspection)
  ↓
[MapService] fetchAddressByLocation() → Get POI details
  ↓
[MapContainer] setSelectedPOI() + setIsDetailBarOpen(true)
  ↓
[LocationDetailBar] Slides up from bottom with:
  - POI name/address
  - "Add to Favorites" button
  - "Add to Plan" dropdown (Day 1/2/3...)
```

**Marker Detection Logic**:
```typescript
const isMarkerClick = target && (
  target.classList?.contains('amap-marker') ||
  target.closest('.amap-marker') ||
  target.closest('[class*="amap-marker"]')
);
```

#### Flow 3: Click on Map Blank Area (清除状态)
```
User Clicks Map (Non-Marker Area)
  ↓
[MapContainer] Clears:
  - highlightedLocation (yellow marker)
  - contextMenu
  - clickedLocation
  - selectedPOI + isDetailBarOpen
```

#### Flow 4: Right-Click on Itinerary Item
```
User Right-Clicks NodeCard
  ↓
[ContextMenu] Shows:
  - Add to Favorites
  - Locate on Map
  - Delete (danger style)
  ↓
User Selects → Execute corresponding Store action
```

---

## 📦 State Management

### Zustand Store (`src/store/tripStore.ts`)

**Core State**:
```typescript
{
  // Trip data
  meta: TripMeta;
  days: DayPlan[];
  
  // UI State
  sidebarWidth: number; // px (280-520)
  isResizingSidebar: boolean;
  confirmedCity: string | null; // Triggers map jump
  highlightedLocation: { location, name } | null; // Yellow marker
  
  // Favorites
  favorites: FavoriteItem[];
}
```

**Key Actions**:
- `addNode(dayIndex, node)` → Generates UUID for node ID
- `addFavorite(item)` → Auto-generates `id` and `addedAt`
- `setHighlightedLocation(loc)` → Triggers yellow marker on map
- `setSidebarWidth(width)` → Updates layout (FloatingNavLayer tracks this)

---

## 🛠️ Service Layer

### API Services (NEW in v2.0)

Frontend services for backend communication located in `src/services/api/`:

| Service | Path | Responsibility |
|---------|------|----------------|
| `apiClient` | `api/apiClient.ts` | Base HTTP client with JWT token management |
| `authService` | `api/authService.ts` | Login, register, logout, session management |
| `planService` | `api/planService.ts` | CRUD operations for itinerary plans |

**API Client Features**:
```typescript
// Automatic token injection
const headers = { Authorization: `Bearer ${token}` };

// Token management
setAuthToken(token)    // Store in localStorage
removeAuthToken()      // Clear on logout
isAuthenticated()      // Check if token exists
```

**Auth Service Interface**:
```typescript
interface AuthService {
  register(credentials): Promise<User>;
  login(credentials): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): boolean;
}
```

**Plan Service Interface**:
```typescript
interface PlanService {
  listPlans(): Promise<ItineraryListItem[]>;
  getPlan(id): Promise<ItineraryPlan>;
  createPlan(data): Promise<ItineraryPlan>;
  updatePlan(id, data): Promise<ItineraryPlan>;
  deletePlan(id): Promise<void>;
  savePlan(id, title, meta, days): Promise<ItineraryPlan>;
}
```

### Auth Store (`src/store/authStore.ts`)

Zustand store for authentication state:
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  login(email, password): Promise<void>;
  register(email, password): Promise<void>;
  logout(): Promise<void>;
  initialize(): Promise<void>;  // Called on app mount
}
```

### Map Service (`src/services/mapService.ts`)

**Interface**:
```typescript
interface MapServiceApi {
  search(keyword, city?, bounds?): Promise<MapSearchResult[]>;
  searchCity(keyword): Promise<CitySearchResult[]>;
  fetchAddressByLocation(lng, lat): Promise<AddressResult>;
  getRoute(start, end): Promise<RouteResult>;
}
```

**Return Types**:
```typescript
AddressResult = {
  name: string;      // POI 名称（经过清洗，优先使用 POI/AOI/Building 名称）
  address?: string;  // 短地址（已去除省市）或完整地址
}
```

**API Configuration**:
- **Endpoint**: `/amap/v3/geocode/regeo`
- **Parameters**: 
  - `extensions=all` - 返回 POI 和 AOI 详细信息
  - `radius=1000` - 搜索半径 1000 米
- **Mock Fallback**: If `!import.meta.env.VITE_AMAP_KEY` → Use `mockMapService`
- **Proxy**: Real API calls use Vite proxy (`/amap/*`) to avoid CORS

### POI Data Formatting (`src/services/utils/formatPOI.ts`)

**清洗策略 (Smart Formatting Strategy)**:

执行顺序（降级链）:
1. **Step 1 (POI)**: 读取 `regeocode.pois[0].name`
   - 如果存在，使用 POI 名称作为 `name`
   - 地址优先使用 `pois[0].address`，否则使用处理后的 `formatted_address`

2. **Step 2 (AOI)**: 如果无 POI，读取 `regeocode.aois[0].name`
   - 使用 AOI 名称作为 `name`
   - 地址使用处理后的 `formatted_address`

3. **Step 3 (Building)**: 如果都无，读取 `addressComponent.building.name`
   - 使用建筑物名称作为 `name`
   - 地址使用处理后的 `formatted_address`

4. **Step 4 (Fallback)**: 最后降级为 `formatted_address`
   - 去除省市名称后作为 `name`
   - 完整地址保留在 `address` 字段

**去冗余处理**:
- `removeProvinceAndCity()`: 从 `formatted_address` 中移除 `province` 和 `city` 字符串
- 例如: `"湖南省长沙市岳麓区登高路58号"` → `"岳麓区登高路58号"`

**Type Definitions** (`src/types/amap.d.ts`):
```typescript
interface AmapRegeoResponse {
  status: string;
  regeocode?: AmapRegeocode;
}

interface AmapRegeocode {
  formatted_address: string;
  addressComponent: AmapAddressComponent;
  pois?: AmapPOI[];    // extensions=all 时返回
  aois?: AmapAOI[];    // extensions=all 时返回
}
```

---

## 🔧 Technical Constraints

### Coordinate Systems
- **AMap `e.pixel`**: Container-relative coords (需转换)
- **Browser `clientX/Y`**: Viewport coords (菜单定位使用)
- **AMap `lnglat`**: Geographic coords (WGS-84)

### Event Bubbling
- Context menu uses `e.stopPropagation()` to prevent double-triggers
- Map click handler checks `isMarkerClick` to avoid clearing POI state

### Drag & Drop
- Uses `@dnd-kit` (not `react-beautiful-dnd`)
- `SortableContext` for same-day reorder
- `DndContext.onDragEnd` handles cross-day moves

---

## 📝 Code Style Guide

### Component Props Pattern
```typescript
// ✅ Good: Named exports with Props interface
export interface FooProps { ... }
export function Foo({ ... }: FooProps) { ... }
```

### Service Calls
```typescript
// ❌ Bad: Direct fetch in components
const res = await fetch('/amap/...');

// ✅ Good: Use service layer
const result = await mapService.fetchAddressByLocation(lng, lat);
```

### Zustand Selectors
```typescript
// ❌ Bad: Creates new array every render
const allNodes = useTripStore((s) => s.days.flatMap(...));

// ✅ Good: Derive in useEffect
const days = useTripStore((s) => s.days);
useEffect(() => {
  const allNodes = days.flatMap(...);
}, [days]);
```

---

## 🚀 Recent Changes

### v1.2.0 (2025-12-10)

#### POI 数据清洗优化
1. **Smart POI Formatting**
   - 实现降级策略：POI → AOI → Building → formatted_address
   - 自动去除地址中的省市名称，生成短地址
   - 使用 `extensions=all` 获取完整 POI/AOI 信息

2. **Type Safety**
   - 新增 `src/types/amap.d.ts` 完整 API 响应类型定义
   - 基于官方文档的结构定义，确保类型一致性

3. **Utils 模块化**
   - 创建 `src/services/utils/formatPOI.ts` 独立清洗函数
   - 纯函数设计，易于测试和维护

### v1.1.0

#### Bug Fixes
1. **Fixed Context Menu Positioning**  
   - Issue: Menu appeared offset from cursor  
   - Fix: Convert `e.pixel` to viewport coords using container `getBoundingClientRect()`

2. **Added Blank Click Handler**  
   - Issue: Highlight markers couldn't be dismissed  
   - Fix: `map.on("click")` checks `isMarkerClick` and clears state for blank areas

#### New Features
3. **LocationDetailBar Component**  
   - Bottom sheet for POI details  
   - Slides up on Marker click, slides down on blank click  
   - Moved "Add to Favorites/Plan" from context menu to here

4. **POI-Driven Interaction**  
   - Click Marker → Show POI details  
   - Right-Click → Show quick actions menu  
   - Blank Click → Clear all overlays

---

## 🔮 Future Enhancements

### Short-Term
- [ ] Add POI ratings/photos in `LocationDetailBar`
- [ ] Implement "双击地图 = 快速添加到当前日" shortcut
- [ ] Add loading spinner for `fetchAddressByLocation`

### Long-Term
- [ ] Migrate to Next.js for SSR
- [ ] Replace mock with real Python backend
- [ ] Add collaborative editing (WebSocket)

---

## 📚 References

- [AMap JS API v2.0](https://lbs.amap.com/api/javascript-api/summary)
- [AMap Regeo API Documentation](https://lbs.amap.com/api/webservice/guide/api/georegeo)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [@dnd-kit Documentation](https://docs.dndkit.com/)

---

*This document is actively maintained. Please update when adding new components or changing core flows.*
