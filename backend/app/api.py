"""REST API endpoints for Tiger World game"""
from flask import Blueprint, jsonify, request
from app.game import (
    create_new_game,
    get_game_state,
    update_game_progress,
    complete_game,
    get_leaderboard,
    get_level_config
)

bp = Blueprint('api', __name__)


@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'Tiger World API'})


@bp.route('/game/new', methods=['POST'])
def new_game():
    """
    Create a new game session.
    Body: { "level": 1 }
    """
    data = request.get_json() or {}
    level = data.get('level', 1)
    
    game_state = create_new_game(level=level)
    
    # Don't send optimal_path to client (would spoil the game)
    response = {
        'id': game_state['id'],
        'level': game_state['level'],
        'rows': game_state['rows'],
        'cols': game_state['cols'],
        'maze_grid': game_state['maze_grid'],
        'start': game_state['start'],
        'goal': game_state['goal'],
        'total_foods': game_state['total_foods'],
        'status': game_state['status']
    }
    
    return jsonify(response), 201


@bp.route('/game/<game_id>', methods=['GET'])
def get_game(game_id):
    """Get current game state."""
    game = get_game_state(game_id)
    
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    # Return limited info (don't spoil the solution)
    response = {
        'id': game['id'],
        'level': game['level'],
        'rows': game['rows'],
        'cols': game['cols'],
        'maze_grid': game['maze_grid'],
        'foods_collected': game['foods_collected'],
        'total_foods': game['total_foods'],
        'score': game['score'],
        'status': game['status']
    }
    
    return jsonify(response)


@bp.route('/game/<game_id>/progress', methods=['POST'])
def update_progress(game_id):
    """
    Update game progress.
    Body: { "foods_collected": 5, "time_elapsed": 12.5 }
    """
    data = request.get_json() or {}
    foods_collected = data.get('foods_collected', 0)
    time_elapsed = data.get('time_elapsed', 0)
    
    game = update_game_progress(game_id, foods_collected, time_elapsed)
    
    if 'error' in game:
        return jsonify(game), 404
    
    return jsonify({
        'id': game['id'],
        'foods_collected': game['foods_collected'],
        'score': game['score'],
        'status': game['status']
    })


@bp.route('/game/<game_id>/complete', methods=['POST'])
def finish_game(game_id):
    """
    Complete a game and add to leaderboard.
    Body: { "player_name": "Player1", "time_elapsed": 45.2 }
    """
    data = request.get_json() or {}
    player_name = data.get('player_name', 'Anonymous')
    time_elapsed = data.get('time_elapsed', 0)
    
    game = complete_game(game_id, player_name, time_elapsed)
    
    if 'error' in game:
        return jsonify(game), 404
        
    # Save to Database
    try:
        from app.models import Score
        from app import db
        new_score = Score(
            player_name=player_name,
            score=game['score'],
            level=game['level']
        )
        db.session.add(new_score)
        db.session.commit()
    except Exception as e:
        print(f"Error saving score: {e}")
    
    return jsonify({
        'id': game['id'],
        'score': game['score'],
        'status': game['status'],
        'completion_time': game['completion_time']
    })


@bp.route('/leaderboard', methods=['GET'])
def get_leaderboard_list():
    """Get top scores from database."""
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 100)
    
    try:
        from app.models import Score
        scores = Score.query.order_by(Score.score.desc()).limit(limit).all()
        top_scores = [s.to_dict() for s in scores]
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        top_scores = []
    
    return jsonify({
        'leaderboard': top_scores,
        'count': len(top_scores)
    })


@bp.route('/levels/<int:level>', methods=['GET'])
def get_level_info(level):
    """Get information about a specific level."""
    config = get_level_config(level)
    return jsonify(config)


@bp.route('/levels', methods=['GET'])
def get_all_levels():
    """Get information about all available levels."""
    levels = [get_level_config(i) for i in range(1, 11)]
    return jsonify({'levels': levels})
