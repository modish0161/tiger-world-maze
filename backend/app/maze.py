"""Maze generation and pathfinding algorithms for Tiger World game"""
import random
from collections import deque
from typing import List, Tuple, Set, Optional

# Tiger-themed food emojis - meaty foods for the tiger!
FOOD_EMOJIS = [
    '🍗', '🍖', '🍔', '🍟', '🍕',
    '🌭', '🍣', '🍤', '🍲', '🍜',
    '🥩', '🍱', '🧀', '🥓'
]

def generate_random_maze(rows: int, cols: int) -> List[List[str]]:
    """
    Generate a random maze using recursive DFS.
    Returns a 2D list of '#' (walls) or '.' (paths).
    Post-processes to add loops and alternative paths for better gameplay.
    GUARANTEES a valid path from start (0,0) to goal (rows-1, cols-1).
    """
    maze = [['#' for _ in range(cols)] for _ in range(rows)]
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    
    def in_bounds(x: int, y: int) -> bool:
        return 0 <= x < cols and 0 <= y < rows
    
    def carve(x: int, y: int):
        maze[y][x] = '.'
        random.shuffle(directions)
        
        for dx, dy in directions:
            nx, ny = x + 2*dx, y + 2*dy
            if in_bounds(nx, ny) and maze[ny][nx] == '#':
                maze[y + dy][x + dx] = '.'
                carve(nx, ny)
    
    # Start carving from top-left corner
    carve(0, 0)
    
    # Ensure start and goal positions are open
    start_x, start_y = 0, 0
    goal_x, goal_y = cols - 1, rows - 1
    maze[start_y][start_x] = '.'
    maze[goal_y][goal_x] = '.'
    
    # CRITICAL: Ensure there's a valid path from start to goal
    # Use BFS to check if goal is reachable
    def is_path_exists() -> bool:
        visited = set()
        queue = deque([(start_x, start_y)])
        visited.add((start_x, start_y))
        
        while queue:
            cx, cy = queue.popleft()
            if (cx, cy) == (goal_x, goal_y):
                return True
            
            for dx, dy in directions:
                nx, ny = cx + dx, cy + dy
                if in_bounds(nx, ny) and maze[ny][nx] == '.' and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
        
        return False
    
    # If no path exists, carve one from goal backwards to start
    def carve_path_to_goal():
        """Carve a guaranteed path from start to goal using BFS pathfinding."""
        # Find the nearest reachable cell from goal and carve towards it
        visited = set()
        parent = {}
        queue = deque([(start_x, start_y)])
        visited.add((start_x, start_y))
        
        # First, find all cells reachable from start
        reachable_from_start = set()
        while queue:
            cx, cy = queue.popleft()
            reachable_from_start.add((cx, cy))
            
            for dx, dy in directions:
                nx, ny = cx + dx, cy + dy
                if in_bounds(nx, ny) and maze[ny][nx] == '.' and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
        
        # Now BFS from goal through walls to find nearest reachable cell
        visited = set()
        queue = deque([(goal_x, goal_y, [(goal_x, goal_y)])])
        visited.add((goal_x, goal_y))
        
        while queue:
            cx, cy, path = queue.popleft()
            
            # If we found a cell reachable from start, carve the path
            if (cx, cy) in reachable_from_start:
                for (px, py) in path:
                    maze[py][px] = '.'
                return
            
            for dx, dy in directions:
                nx, ny = cx + dx, cy + dy
                if in_bounds(nx, ny) and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny, path + [(nx, ny)]))
    
    # Check and fix path if needed
    if not is_path_exists():
        carve_path_to_goal()
    
    # IMPORTANT: Remove random walls to create loops and alternative paths
    # This allows players to escape from ghosts more easily
    walls_to_remove = []
    for y in range(1, rows - 1):
        for x in range(1, cols - 1):
            if maze[y][x] == '#':
                # Count adjacent paths
                adjacent_paths = 0
                for dx, dy in directions:
                    nx, ny = x + dx, y + dy
                    if in_bounds(nx, ny) and maze[ny][nx] == '.':
                        adjacent_paths += 1
                
                # If this wall has 2+ adjacent paths, it's a candidate for removal
                if adjacent_paths >= 2:
                    walls_to_remove.append((x, y))
    
    # Remove 25-40% of candidate walls to create multiple paths
    removal_rate = random.uniform(0.25, 0.4)
    walls_to_remove_count = int(len(walls_to_remove) * removal_rate)
    random.shuffle(walls_to_remove)
    
    for i in range(walls_to_remove_count):
        x, y = walls_to_remove[i]
        maze[y][x] = '.'
    
    return maze


def create_maze_grid(maze_layout: List[List[str]]) -> List[List[str]]:
    """
    Convert maze layout to emoji grid.
    Replaces '.' paths with random food emojis.
    """
    rows = len(maze_layout)
    cols = len(maze_layout[0]) if rows > 0 else 0
    
    maze_grid = []
    for y in range(rows):
        row = []
        for x in range(cols):
            if maze_layout[y][x] == '.':
                row.append(random.choice(FOOD_EMOJIS))
            else:
                row.append('#')
        maze_grid.append(row)
    
    return maze_grid


def bfs_path(grid: List[List[str]], start: Tuple[int, int], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
    """
    Return a path of (x,y) tuples from start to goal using BFS.
    '#' cells are walls, everything else is passable.
    """
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    sx, sy = start
    gx, gy = goal
    
    # Boundary checks
    if not (0 <= sx < cols and 0 <= sy < rows):
        return []
    if not (0 <= gx < cols and 0 <= gy < rows):
        return []
    if grid[sy][sx] == '#' or grid[gy][gx] == '#':
        return []
    
    queue = deque()
    queue.append((sx, sy, [(sx, sy)]))
    visited = set([(sx, sy)])
    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]
    
    while queue:
        cx, cy, path = queue.popleft()
        if (cx, cy) == (gx, gy):
            return path
        
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < cols and 0 <= ny < rows:
                if grid[ny][nx] != '#' and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny, path + [(nx, ny)]))
    
    return []


def find_nearest_food(start: Tuple[int, int], foods: Set[Tuple[int, int]], grid: List[List[str]]) -> Optional[Tuple[int, int]]:
    """
    Find the nearest food item from start position using BFS.
    Returns coordinates of nearest food or None if unreachable.
    """
    if not foods:
        return None
    
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    sx, sy = start
    
    queue = deque()
    queue.append((sx, sy))
    visited = set([(sx, sy)])
    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]
    
    while queue:
        cx, cy = queue.popleft()
        if (cx, cy) in foods:
            return (cx, cy)
        
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < cols and 0 <= ny < rows:
                if grid[ny][nx] != '#' and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
    
    return None


def build_collector_path(grid: List[List[str]], start: Tuple[int, int], 
                        food_positions: List[Tuple[int, int]], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
    """
    Build a path that visits all food items (greedy nearest-first) then goes to goal.
    Returns list of (x, y) coordinates representing the complete path.
    """
    path = []
    current = start
    leftover_food = set(food_positions)
    
    while leftover_food:
        nearest = find_nearest_food(current, leftover_food, grid)
        if nearest is None:
            return []  # No path to any remaining food
        
        segment = bfs_path(grid, current, nearest)
        if not segment:
            return []
        
        # Avoid duplicating the starting point
        if path:
            segment = segment[1:]
        
        path.extend(segment)
        current = nearest
        leftover_food.remove(nearest)
    
    # Finally go from last food to goal
    final_segment = bfs_path(grid, current, goal)
    if not final_segment:
        return []
    
    if path:
        final_segment = final_segment[1:]
    path.extend(final_segment)
    
    return path


def get_all_food_positions(grid: List[List[str]]) -> List[Tuple[int, int]]:
    """Extract all food positions from the maze grid."""
    food_positions = []
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    
    for y in range(rows):
        for x in range(cols):
            if grid[y][x] not in ['#', ' ']:
                food_positions.append((x, y))
    
    return food_positions
