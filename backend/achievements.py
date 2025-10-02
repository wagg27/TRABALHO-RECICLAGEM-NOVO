# Achievement definitions
ACHIEVEMENTS = [
    {
        "id": "first_steps",
        "name": "Primeiros Passos",
        "description": "Alcance 10 metros de altura",
        "icon": "🏃‍♂️",
        "unlock_criteria": {"type": "height", "value": 10},
        "unlock_height": 10
    },
    {
        "id": "getting_high",
        "name": "Subindo Alto",
        "description": "Alcance 50 metros de altura",
        "icon": "🌤️",
        "unlock_criteria": {"type": "height", "value": 50},
        "unlock_height": 50
    },
    {
        "id": "sky_walker",
        "name": "Caminhante do Céu",
        "description": "Alcance 100 metros de altura",
        "icon": "☁️",
        "unlock_criteria": {"type": "height", "value": 100},
        "unlock_height": 100
    },
    {
        "id": "stratosphere",
        "name": "Estratosfera",
        "description": "Alcance 200 metros de altura",
        "icon": "🌌",
        "unlock_criteria": {"type": "height", "value": 200},
        "unlock_height": 200
    },
    {
        "id": "redemption",
        "name": "Redenção",
        "description": "Complete o jogo alcançando o símbolo da reciclagem",
        "icon": "♻️",
        "unlock_criteria": {"type": "completion", "value": True},
        "unlock_height": 300
    },
    {
        "id": "speed_runner",
        "name": "Velocista",
        "description": "Complete o jogo em menos de 5 minutos",
        "icon": "⚡",
        "unlock_criteria": {"type": "completion_time", "value": 300},
        "unlock_height": 300
    },
    {
        "id": "persistent",
        "name": "Persistente",
        "description": "Jogue 10 partidas",
        "icon": "💪",
        "unlock_criteria": {"type": "games_played", "value": 10},
        "unlock_height": 0
    },
    {
        "id": "master_jumper",
        "name": "Mestre dos Saltos",
        "description": "Complete o jogo 3 vezes",
        "icon": "👑",
        "unlock_criteria": {"type": "completions", "value": 3},
        "unlock_height": 300
    }
]

def get_achievements_for_height(height: int):
    """Return achievements that should be unlocked for a given height"""
    return [
        achievement for achievement in ACHIEVEMENTS 
        if achievement["unlock_criteria"]["type"] == "height" 
        and achievement["unlock_height"] <= height
    ]

def get_completion_achievements():
    """Return achievements that require game completion"""
    return [
        achievement for achievement in ACHIEVEMENTS 
        if achievement["unlock_criteria"]["type"] in ["completion", "completion_time", "completions"]
    ]