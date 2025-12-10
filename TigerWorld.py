import pygame
import sys
import random
import time
import os
from collections import deque

# For Audio Recording
import pyaudio
import wave

# OpenCV for Video Recording
import cv2
import numpy as np

# ------------------------------------------------------------------
# Number of BFS runs *per* script execution
# ------------------------------------------------------------------
NUM_RUNS = 1

# Set your audio loopback device index
LOOPBACK_DEVICE_INDEX = 0

# Screen dimensions
BORDER = 20
WIDTH = 500
HEIGHT = 500

# Colors
BLACK = (0, 0, 0)
BROWN = (139, 69, 19)
GOLD = (255, 215, 0)
WALL_COLOR = (120, 60, 0)

# Emojis
TIGER_EMOJI = '🐯'
# A fun set of “tiger-friendly” food emojis
FOOD_EMOJIS = [
    '🍗', '🍖', '🍔', '🍟', '🍕',
    '🌭', '🍣', '🍤', '🍲', '🍜',
    '🥩', '🍱', '🧀', '🍗', '🥓'
]

# Footprint emoji for the trail
TRAIL_EMOJI = '🐾'

# Font
FONT_NAME = 'segoeuiemoji'
FONT_SIZE = 28
maze_font = None

# Maze settings
MAZE_ROWS = 15
MAZE_COLS = 15
CELL_SIZE = None

# ------------------------------------------------------------------
# Audio Recording Functions
# ------------------------------------------------------------------
def start_audio_recording(audio_filepath, p):
    FORMAT = pyaudio.paInt16
    CHANNELS = 2
    RATE = 44100
    CHUNK = 1024

    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK,
                    input_device_index=LOOPBACK_DEVICE_INDEX)
    
    wf = wave.open(audio_filepath, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    
    return stream, wf

def capture_audio_chunk(stream, wf):
    try:
        data = stream.read(1024, exception_on_overflow=False)
        wf.writeframes(data)
    except IOError:
        pass

def stop_audio_recording(stream, wf):
    stream.stop_stream()
    stream.close()
    wf.close()

# ------------------------------------------------------------------
# Maze & BFS Helpers
# ------------------------------------------------------------------
def generate_random_maze(rows, cols):
    maze = [['#' for _ in range(cols)] for _ in range(rows)]
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    
    def in_bounds(x, y):
        return 0 <= x < cols and 0 <= y < rows
    
    def carve(x, y):
        maze[y][x] = '.'
        random.shuffle(directions)
        for dx, dy in directions:
            nx, ny = x + 2*dx, y + 2*dy
            if in_bounds(nx, ny) and maze[ny][nx] == '#':
                maze[y + dy][x + dx] = '.'
                carve(nx, ny)
    
    carve(0, 0)
    return maze

def bfs_path(grid, start, goal):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    sx, sy = start
    gx, gy = goal
    
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

def find_nearest_food(start, foods, grid):
    if not foods:
        return None
    
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
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

def build_collector_path(grid, start, food_positions, goal):
    path = []
    current = start
    leftover_food = set(food_positions)
    
    while leftover_food:
        nearest = find_nearest_food(current, leftover_food, grid)
        if nearest is None:
            return []
        seg = bfs_path(grid, current, nearest)
        if not seg:
            return []
        # Avoid duplicating the start cell when extending the path
        if path:
            seg = seg[1:]
        path.extend(seg)
        current = nearest
        leftover_food.remove(nearest)
    
    final_seg = bfs_path(grid, current, goal)
    if not final_seg:
        return []
    if path:
        final_seg = final_seg[1:]
    path.extend(final_seg)
    return path

# ------------------------------------------------------------------
# Opening screen with swirling tiger emojis
# ------------------------------------------------------------------
def show_opening_screen(screen, video_writer, audio_stream, audio_wf, font):
    """
    Show "WELCOME TO TIGER-WORLD" for ~3 seconds.
    Animate some tiger emojis swirling around the text.
    """
    TIGER_COUNT = 5
    RADIUS = 80     # how far they orbit from text center
    swirl_speed = 2.0  # radians per second
    
    large_font = pygame.font.SysFont('segoeuiemoji', 36, bold=True)
    welcome_text = "WELCOME TO TIGER-WORLD"
    text_surf = large_font.render(welcome_text, True, GOLD)
    
    center_x = WIDTH // 2
    center_y = HEIGHT // 2
    
    start_time = time.time()
    
    while time.time() - start_time < 3:
        # black background
        screen.fill(BLACK)
        
        # draw text
        screen.blit(
            text_surf,
            (center_x - text_surf.get_width()//2,
             center_y - text_surf.get_height()//2)
        )
        
        # swirl tiger emojis
        elapsed = time.time() - start_time
        for i in range(TIGER_COUNT):
            angle = (elapsed * swirl_speed) + i*(2*np.pi/TIGER_COUNT)
            px = center_x + RADIUS * np.cos(angle)
            py = center_y + RADIUS * np.sin(angle)
            
            # Render the tiger
            tiger_surf = font.render(TIGER_EMOJI, True, BROWN)
            screen.blit(tiger_surf, (px - tiger_surf.get_width()/2,
                                     py - tiger_surf.get_height()/2))
        
        pygame.display.flip()
        
        # capture audio
        capture_audio_chunk(audio_stream, audio_wf)
        # capture video
        frame_str = pygame.image.tostring(screen, 'RGB')
        frame_np = np.frombuffer(frame_str, dtype=np.uint8).reshape((HEIGHT, WIDTH, 3))
        frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
        video_writer.write(frame_bgr)
        
        # check for close
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
        
        pygame.time.wait(30)

# ------------------------------------------------------------------
# Closing screen with repeated tiger sounds
# ------------------------------------------------------------------
def show_closing_screen(screen, video_writer, audio_stream, audio_wf, font):
    thanks_text = (
        "🐯 THANKS FOR WATCHING 🐯\n"
        "🐯 TIGER-WORLD! 🐯\n"
        "🐯 LIKE,\n"
        "🐯 SHARE,\n"
        "& 🐯 SUBSCRIBE!"
    )
    screen.fill(BLACK)
    
    close_font = pygame.font.SysFont('segoeuiemoji', 32, italic=True)
    
    lines = thanks_text.split("\n")
    y_offset = HEIGHT//2 - 50
    for line in lines:
        line_surf = close_font.render(line, True, GOLD)
        x_pos = WIDTH//2 - line_surf.get_width()//2
        screen.blit(line_surf, (x_pos, y_offset))
        y_offset += line_surf.get_height() + 10
    
    pygame.display.flip()
    
    # repeated tiger sound over ~5 seconds
    try:
        tiger_sound = pygame.mixer.Sound('tiger_sound.wav')
    except:
        tiger_sound = None
    
    start_time = time.time()
    last_sound = 0
    
    while time.time() - start_time < 5:
        if tiger_sound and (time.time() - last_sound > 1):
            tiger_sound.play()
            last_sound = time.time()
        
        capture_audio_chunk(audio_stream, audio_wf)
        
        frame_str = pygame.image.tostring(screen, 'RGB')
        frame_np = np.frombuffer(frame_str, dtype=np.uint8).reshape((HEIGHT, WIDTH, 3))
        frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
        video_writer.write(frame_bgr)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
        
        pygame.time.wait(30)

# ------------------------------------------------------------------
# Maze BFS Sequence
# ------------------------------------------------------------------
def run_one_maze(run_index, p, session_dir):
    global maze_font
    
    print(f"\n--- Starting Maze Run #{run_index+1} ---")
    
    # Generate Maze
    maze_layout = generate_random_maze(MAZE_ROWS, MAZE_COLS)
    maze_grid = []
    for y in range(MAZE_ROWS):
        row = []
        for x in range(MAZE_COLS):
            if maze_layout[y][x] == '.':
                row.append(random.choice(FOOD_EMOJIS))
            else:
                row.append('#')
        maze_grid.append(row)
    
    # Gather foods
    all_food_positions = []
    for y in range(MAZE_ROWS):
        for x in range(MAZE_COLS):
            if maze_grid[y][x] not in ['#', ' ']:
                all_food_positions.append((x, y))
    
    start_cell = (0, 0)
    goal_cell  = (MAZE_COLS - 1, MAZE_ROWS - 1)
    collector_cells = build_collector_path(maze_grid, start_cell, all_food_positions, goal_cell)
    success = (len(collector_cells) > 0)
    
    OFFSET_X = (WIDTH - MAZE_COLS * CELL_SIZE)//2
    OFFSET_Y = (HEIGHT - MAZE_ROWS * CELL_SIZE)//2
    path_pixels = [
        (OFFSET_X + x*CELL_SIZE + CELL_SIZE//2,
         OFFSET_Y + y*CELL_SIZE + CELL_SIZE//2)
        for (x,y) in collector_cells
    ]
    
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption(f"Run {run_index+1}/{NUM_RUNS}")
    
    if maze_font is None:
        maze_font = pygame.font.SysFont(FONT_NAME, FONT_SIZE)
    
    clock = pygame.time.Clock()
    
    # Start audio
    audio_filepath = os.path.join(session_dir, f"run_{run_index+1}.wav")
    audio_stream, audio_wf = start_audio_recording(audio_filepath, p)
    
    # Start video
    video_filepath = os.path.join(session_dir, f"run_{run_index+1}.mp4")
    fps = 30
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(video_filepath, fourcc, fps, (WIDTH, HEIGHT))
    
    # 1) Opening
    show_opening_screen(screen, video_writer, audio_stream, audio_wf, maze_font)
    
    # 2) Maze BFS
    current_target = 0
    if path_pixels:
        tiger_x, tiger_y = path_pixels[0]
    else:
        tiger_x, tiger_y = OFFSET_X + CELL_SIZE//2, OFFSET_Y + CELL_SIZE//2
    
    # Load sounds
    try:
        munch_sound = pygame.mixer.Sound('munch.wav')
        tiger_sound = pygame.mixer.Sound('tiger_sound.wav')
    except:
        munch_sound = None
        tiger_sound = None
    
    finished = False
    trail_positions = []
    
    while not finished:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
        
        if path_pixels and current_target < len(path_pixels):
            tx, ty = path_pixels[current_target]
            dx = tx - tiger_x
            dy = ty - tiger_y
            dist = max(1, (dx**2 + dy**2)**0.5)
            speed = 3
            tiger_x += (dx/dist)*speed
            tiger_y += (dy/dist)*speed
            if abs(dx) < 2 and abs(dy) < 2:
                cx, cy = collector_cells[current_target]
                if maze_grid[cy][cx] not in ['#',' ']:
                    maze_grid[cy][cx] = ' '
                    if munch_sound:
                        munch_sound.play()
                # Leave a tiger paw print where we've been
                trail_positions.append((int(tx), int(ty)))
                current_target += 1
        else:
            finished = True
        
        screen.fill(BLACK)
        
        # Draw Maze
        for yy in range(MAZE_ROWS):
            for xx in range(MAZE_COLS):
                cell_px = OFFSET_X + xx*CELL_SIZE
                cell_py = OFFSET_Y + yy*CELL_SIZE
                if maze_grid[yy][xx] == '#':
                    pygame.draw.rect(screen, WALL_COLOR, (cell_px, cell_py, CELL_SIZE, CELL_SIZE))
                else:
                    if maze_grid[yy][xx] != ' ':
                        em_surf = maze_font.render(maze_grid[yy][xx], True, GOLD)
                        sx = cell_px + (CELL_SIZE - em_surf.get_width())//2
                        sy = cell_py + (CELL_SIZE - em_surf.get_height())//2
                        screen.blit(em_surf, (sx, sy))
        
        # Draw the trail
        for (px, py) in trail_positions:
            paw_surf = maze_font.render(TRAIL_EMOJI, True, GOLD)
            screen.blit(paw_surf, (px - paw_surf.get_width()//2,
                                   py - paw_surf.get_height()//2))
        
        # The Tiger
        tiger_surf = maze_font.render(TIGER_EMOJI, True, BROWN)
        screen.blit(tiger_surf, (tiger_x - tiger_surf.get_width()//2,
                                 tiger_y - tiger_surf.get_height()//2))
        
        # BFS Progress
        total_steps = len(path_pixels)
        info_surf = maze_font.render(f"Snacks: {current_target}/{total_steps}", True, GOLD)
        screen.blit(info_surf, (10, HEIGHT - 25))
        
        pygame.display.flip()
        clock.tick(60)
        
        # capture audio/video
        capture_audio_chunk(audio_stream, audio_wf)
        frame_str = pygame.image.tostring(screen, 'RGB')
        frame_np = np.frombuffer(frame_str, dtype=np.uint8).reshape((HEIGHT, WIDTH, 3))
        frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
        video_writer.write(frame_bgr)
    
    # 3) Maze done
    screen.fill(BLACK)
    if success:
        end_txt = "🐯 YOU MASTERED THE MAZE! 🐯"
    else:
        end_txt = "No path to reach all the goodies!"
    
    end_surf = maze_font.render(end_txt, True, GOLD)
    screen.blit(end_surf, (WIDTH//2 - end_surf.get_width()//2,
                           HEIGHT//2 - end_surf.get_height()//2))
    pygame.display.flip()
    
    t0 = time.time()
    while time.time() - t0 < 2:
        capture_audio_chunk(audio_stream, audio_wf)
        frame_str = pygame.image.tostring(screen, 'RGB')
        frame_np = np.frombuffer(frame_str, dtype=np.uint8).reshape((HEIGHT, WIDTH, 3))
        frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
        video_writer.write(frame_bgr)
        clock.tick(30)
    
    # 4) Closing screen
    show_closing_screen(screen, video_writer, audio_stream, audio_wf, maze_font)
    
    # finalize
    video_writer.release()
    stop_audio_recording(audio_stream, audio_wf)
    
    print(f" => Video: {video_filepath}\n => Audio: {audio_filepath}")

# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
def main():
    global CELL_SIZE
    
    # Instead of current folder, store in D:\TigerWorld
    base_dir = r"D:\TigerWorld"
    if not os.path.exists(base_dir):
        os.makedirs(base_dir, exist_ok=True)
    
    # create a unique subfolder inside D:\TigerWorld
    timestamp_str = time.strftime("%Y%m%d_%H%M%S")
    session_dir = os.path.join(base_dir, f"maze_session_{timestamp_str}")
    os.makedirs(session_dir, exist_ok=True)
    
    # init PyAudio
    p = pyaudio.PyAudio()
    
    # define cell size
    CELL_SIZE = min((WIDTH - BORDER*2)//MAZE_COLS,
                    (HEIGHT - BORDER*2)//MAZE_ROWS)
    
    for i in range(NUM_RUNS):
        pygame.init()
        run_one_maze(i, p, session_dir)
        pygame.quit()
    
    p.terminate()
    
    print(f"\nAll {NUM_RUNS} BFS runs completed!\nFiles are stored in: {session_dir}\n")


if __name__=="__main__":
    main()
