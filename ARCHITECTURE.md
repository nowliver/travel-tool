# LiteTravel - Architecture Documentation

> **Last Updated**: 2025-12-10  
> **Version**: 1.2.0  
> **Status**: Active Development

---

## 📐 System Overview

LiteTravel is a web-based travel planning application combining map visualization with itinerary management. The architecture follows a **React + Zustand** state management pattern with **AMap (高德地图)** integration for geospatial features.

### Core Concepts
- **Mock-First Strategy**: All services have mock implementations for offline development
- **POI-Driven Interaction**: Map interactions revolve around Points of Interest (POI)
- **Service Layer Isolation**: UI components never call APIs directly

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
