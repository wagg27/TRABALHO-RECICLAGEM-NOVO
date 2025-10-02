# Plastic Bag King - Contratos de API

## A) Contratos de API

### 1. Scores/Leaderboard
```
POST /api/scores
Body: { player_name: string, height: number, completion_time?: number, completed: boolean }
Response: { success: boolean, score_id: string, new_record: boolean }

GET /api/leaderboard?limit=10
Response: { leaderboard: [{ id, name, height, completions, best_time }] }

GET /api/stats
Response: { total_plays, average_height, completion_rate, total_play_time }
```

### 2. Achievements
```
GET /api/achievements
Response: { achievements: [{ id, name, description, icon, unlocked }] }

POST /api/achievements/unlock
Body: { achievement_id: string, player_name: string }
Response: { success: boolean, achievement: object }
```

### 3. Game Sessions
```
POST /api/session/start
Body: { player_name?: string }
Response: { session_id: string }

PUT /api/session/{session_id}
Body: { height: number, completed: boolean, play_time: number }
Response: { success: boolean }
```

## B) Dados Mockados Atual (mock.js)

- `mockGameStats`: estatísticas gerais do jogo
- `mockLeaderboard`: ranking dos jogadores
- `mockAchievements`: conquistas disponíveis
- `mockAPI`: funções simulando chamadas de API

## C) Implementação Backend

### Modelos MongoDB:
1. **GameScore**: player_name, height, completed, completion_time, created_at
2. **GameSession**: session_id, player_name, start_time, end_time, final_height, completed
3. **Achievement**: id, name, description, icon, unlock_criteria
4. **PlayerAchievement**: player_name, achievement_id, unlocked_at

### Endpoints Principais:
- Salvar pontuação e detectar novos recordes
- Calcular estatísticas em tempo real
- Sistema de conquistas baseado em altura
- Sessões de jogo para tracking de progresso

## D) Integração Frontend & Backend

### Substituir em GameEngine.js:
- Chamadas para `mockAPI.saveScore()` por API real
- Sistema de sessões para tracking contínuo
- Unlock de achievements baseado na altura atingida

### Modificar em GameScreen.jsx:
- Integrar leaderboard real na tela de vitória
- Mostrar achievements desbloqueadas
- Salvar progresso automaticamente

### Adicionar Componentes:
- LeaderboardModal: ranking completo
- AchievementsPanel: progresso das conquistas
- StatsDisplay: estatísticas pessoais e globais