// ============================================
// TOWER DEFENSE EDITOR - CÓDIGO OPTIMIZADO v3.6
// CON SISTEMA DE CÁMARA Y MINIMAPA
// ============================================

// ============================================
// CONFIGURACIÓN OPTIMIZADA
// ============================================
const CONFIG = {
    TILE_SIZE: 32,
    DEFAULT_SIZE: 64,
    MAX_ENTITIES: 1000,
    MAX_ANIMATIONS: 200,
    PLAYER_COLORS: ['#e53e3e','#4299e1','#38b2ac','#9f7aea','#ed8936','#a0613e','#a0aec0','#ecc94b'],
    TOWER_TYPES: {
        basic: { id:'basic', name:'Básica', icon:'🏹', color:'#3182ce', cost:50, damage:10, range:4, cooldown:30, sellRatio:0.7 },
        cannon: { id:'cannon', name:'Cañón', icon:'💣', color:'#e53e3e', cost:100, damage:25, range:3, cooldown:45, sellRatio:0.7 },
        magic: { id:'magic', name:'Mágica', icon:'🔮', color:'#805ad5', cost:150, damage:15, range:5, cooldown:25, sellRatio:0.7 },
        sniper: { id:'sniper', name:'Franco', icon:'🎯', color:'#38a169', cost:200, damage:40, range:8, cooldown:60, sellRatio:0.7 }
    },
    ENEMY_TYPES: {
        fast: { id:'fast', name:'Rápido', icon:'👻', color:'#ed8936', health:30, speed:1.8, reward:15, baseDamage:5, waitTime:60 },
        tank: { id:'tank', name:'Tanque', icon:'🛡️', color:'#718096', health:100, speed:0.8, reward:40, baseDamage:10, waitTime:90 },
        boss: { id:'boss', name:'Jefe', icon:'👹', color:'#c53030', health:200, speed:0.5, reward:100, baseDamage:15, waitTime:120 }
    },
    WAVE_CONFIG: {
        predefined: [
            { fast:5, tank:0, boss:0, rewardMult:1.0, name:"Oleada 1" },
            { fast:8, tank:1, boss:0, rewardMult:1.1, name:"Oleada 2" },
            { fast:10, tank:2, boss:0, rewardMult:1.2, name:"Oleada 3" },
            { fast:12, tank:3, boss:0, rewardMult:1.3, name:"Oleada 4" },
            { fast:15, tank:4, boss:0, rewardMult:1.4, name:"Oleada 5" }
        ]
    },
    BASE_DAMAGE_PERCENT: 5,
    BASE_WAIT_TIME: 60,
    SHOW_RANGE_BY_DEFAULT: true,
    GAME_SHOW_RANGE_BY_DEFAULT: false,
    MAX_HISTORY_STATES: 50,
    AUTO_SAVE_INTERVAL: 30000,
    SHOW_GRID_LABELS: true,
    SHOW_PATH_NUMBERS: true,
    TARGET_FPS: 60,
    PERFORMANCE_MODE: false,
    // NUEVO: Configuración de minimapa
    MINIMAP_SIZE: 150,
    MINIMAP_PADDING: 10,
    MINIMAP_VIEWPORT_COLOR: 'rgba(66, 153, 225, 0.3)',
    MINIMAP_VIEWPORT_BORDER: '2px solid #4299e1'
};

// ============================================
// SISTEMA DE CÁMARA GLOBAL (NUEVO)
// ============================================
window.GameCamera = {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastOffsetX: 0,
    lastOffsetY: 0,
    
    reset: function() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;
        this.isDragging = false;
    },
    
    startDrag: function(x, y) {
        this.isDragging = true;
        this.dragStartX = x - this.offsetX;
        this.dragStartY = y - this.offsetY;
        this.lastOffsetX = this.offsetX;
        this.lastOffsetY = this.offsetY;
    },
    
    drag: function(x, y) {
        if (this.isDragging) {
            this.offsetX = x - this.dragStartX;
            this.offsetY = y - this.dragStartY;
        }
    },
    
    stopDrag: function() {
        this.isDragging = false;
    },
    
    applyZoom: function(delta, mouseX, mouseY, canvasWidth, canvasHeight) {
        const oldZoom = this.zoom;
        const zoomDelta = delta < 0 ? 0.1 : -0.1;
        
        this.zoom = Math.max(0.25, Math.min(4, this.zoom + zoomDelta));
        
        // Ajustar offset para zoom centrado en el cursor
        this.offsetX = mouseX - (mouseX - this.offsetX) * (this.zoom / oldZoom);
        this.offsetY = mouseY - (mouseY - this.offsetY) * (this.zoom / oldZoom);
    }
};

// ============================================
// SISTEMA DE MINIMAPA (NUEVO)
// ============================================
window.MiniMap = {
    canvas: null,
    ctx: null,
    container: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    
    init: function() {
        // Crear canvas del minimapa
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'miniMapCanvas';
        this.canvas.width = CONFIG.MINIMAP_SIZE;
        this.canvas.height = CONFIG.MINIMAP_SIZE;
        this.canvas.style.cssText = `
            position: absolute;
            bottom: ${CONFIG.MINIMAP_PADDING}px;
            right: ${CONFIG.MINIMAP_PADDING}px;
            background: rgba(26, 26, 26, 0.9);
            border: 2px solid #4299e1;
            border-radius: 5px;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Agregar al contenedor del mapa
        this.container = document.getElementById('mapContainer');
        if (this.container) {
            this.container.appendChild(this.canvas);
            this.setupEvents();
        }
        
        // Crear minimapa para el modo juego
        this.createGameMiniMap();
    },
    
    createGameMiniMap: function() {
        const gameMiniMap = document.createElement('canvas');
        gameMiniMap.id = 'gameMiniMapCanvas';
        gameMiniMap.width = CONFIG.MINIMAP_SIZE;
        gameMiniMap.height = CONFIG.MINIMAP_SIZE;
        gameMiniMap.style.cssText = `
            position: absolute;
            bottom: ${CONFIG.MINIMAP_PADDING}px;
            right: ${CONFIG.MINIMAP_PADDING}px;
            background: rgba(26, 26, 26, 0.9);
            border: 2px solid #4299e1;
            border-radius: 5px;
            cursor: pointer;
            z-index: 200;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        
        document.querySelector('.game-area')?.appendChild(gameMiniMap);
    },
    
    setupEvents: function() {
        // Click en el minimapa para mover la vista
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = e.clientX - rect.left;
            this.dragStartY = e.clientY - rect.top;
            this.handleMiniMapClick(this.dragStartX, this.dragStartY);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleMiniMapClick(x, y);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    },
    
    handleMiniMapClick: function(x, y) {
        // Convertir coordenadas del minimapa a coordenadas del mundo
        const scale = CONFIG.MINIMAP_SIZE / Math.max(state.project.width, state.project.height) / CONFIG.TILE_SIZE;
        const worldX = (x / scale) / CONFIG.TILE_SIZE;
        const worldY = (y / scale) / CONFIG.TILE_SIZE;
        
        // Centrar la vista en esa posición
        const editorCanvas = document.getElementById('gameCanvas');
        if (editorCanvas) {
            const canvasWidth = editorCanvas.width / state.ui.zoom;
            const canvasHeight = editorCanvas.height / state.ui.zoom;
            
            state.ui.offsetX = -worldX * CONFIG.TILE_SIZE * state.ui.zoom + canvasWidth / 2;
            state.ui.offsetY = -worldY * CONFIG.TILE_SIZE * state.ui.zoom + canvasHeight / 2;
            state.ui.needsRender = true;
        }
    },
    
    renderEditorMiniMap: function() {
        if (!this.ctx || !state.project) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Limpiar minimapa
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcular escala
        const mapWidth = state.project.width * CONFIG.TILE_SIZE;
        const mapHeight = state.project.height * CONFIG.TILE_SIZE;
        const scale = Math.min(
            canvas.width / mapWidth,
            canvas.height / mapHeight
        );
        
        ctx.save();
        ctx.scale(scale, scale);
        
        // Dibujar fondo del mapa
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        
        // Dibujar entidades
        state.project.entities.forEach(entity => {
            ctx.fillStyle = entity.color;
            ctx.fillRect(
                entity.x * CONFIG.TILE_SIZE,
                entity.y * CONFIG.TILE_SIZE,
                entity.width * CONFIG.TILE_SIZE,
                entity.height * CONFIG.TILE_SIZE
            );
            
            // Icono pequeño
            const icon = this.getEntityIcon(entity);
            if (icon) {
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    icon,
                    entity.x * CONFIG.TILE_SIZE + (entity.width * CONFIG.TILE_SIZE) / 2,
                    entity.y * CONFIG.TILE_SIZE + (entity.height * CONFIG.TILE_SIZE) / 2
                );
            }
        });
        
        ctx.restore();
        
        // Dibujar viewport (área visible)
        this.drawViewport(ctx, scale);
    },
    
    renderGameMiniMap: function() {
        const canvas = document.getElementById('gameMiniMapCanvas');
        if (!canvas || !state.game.testing) return;
        
        const ctx = canvas.getContext('2d');
        
        // Limpiar minimapa
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcular escala
        const mapWidth = state.project.width * CONFIG.TILE_SIZE;
        const mapHeight = state.project.height * CONFIG.TILE_SIZE;
        const scale = Math.min(
            canvas.width / mapWidth,
            canvas.height / mapHeight
        );
        
        ctx.save();
        ctx.scale(scale, scale);
        
        // Dibujar fondo del mapa
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        
        // Dibujar camino
        ctx.fillStyle = '#4a5568';
        state.game.path.forEach(point => {
            ctx.fillRect(point.x * CONFIG.TILE_SIZE, point.y * CONFIG.TILE_SIZE, 
                        CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        });
        
        // Dibujar spawn
        if (state.game.spawn) {
            ctx.fillStyle = '#e53e3e';
            ctx.fillRect(state.game.spawn.x * CONFIG.TILE_SIZE, state.game.spawn.y * CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚩', 
                state.game.spawn.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
                state.game.spawn.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2);
        }
        
        // Dibujar base
        if (state.game.base) {
            ctx.fillStyle = '#e53e3e';
            ctx.fillRect(state.game.base.x * CONFIG.TILE_SIZE, state.game.base.y * CONFIG.TILE_SIZE,
                        state.game.base.width * CONFIG.TILE_SIZE, state.game.base.height * CONFIG.TILE_SIZE);
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏰',
                state.game.base.x * CONFIG.TILE_SIZE + (state.game.base.width * CONFIG.TILE_SIZE)/2,
                state.game.base.y * CONFIG.TILE_SIZE + (state.game.base.height * CONFIG.TILE_SIZE)/2);
        }
        
        // Dibujar torres
        ctx.fillStyle = '#3182ce';
        state.game.towers.forEach(tower => {
            ctx.fillRect(tower.x * CONFIG.TILE_SIZE, tower.y * CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        });
        
        // Dibujar enemigos
        ctx.fillStyle = '#ed8936';
        state.game.enemies.forEach(enemy => {
            ctx.fillRect(enemy.x * CONFIG.TILE_SIZE - CONFIG.TILE_SIZE/4,
                        enemy.y * CONFIG.TILE_SIZE - CONFIG.TILE_SIZE/4,
                        CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE/2);
        });
        
        ctx.restore();
        
        // Dibujar viewport del juego
        this.drawGameViewport(ctx, scale);
    },
    
    drawViewport: function(ctx, scale) {
        const editorCanvas = document.getElementById('gameCanvas');
        if (!editorCanvas) return;
        
        // Calcular área visible en el editor
        const viewportX = -state.ui.offsetX / state.ui.zoom / CONFIG.TILE_SIZE * scale;
        const viewportY = -state.ui.offsetY / state.ui.zoom / CONFIG.TILE_SIZE * scale;
        const viewportWidth = editorCanvas.width / state.ui.zoom / CONFIG.TILE_SIZE * scale;
        const viewportHeight = editorCanvas.height / state.ui.zoom / CONFIG.TILE_SIZE * scale;
        
        // Dibujar rectángulo del viewport
        ctx.strokeStyle = CONFIG.MINIMAP_VIEWPORT_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        
        ctx.fillStyle = CONFIG.MINIMAP_VIEWPORT_COLOR.replace('0.3', '0.1');
        ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    },
    
    drawGameViewport: function(ctx, scale) {
        const gameCanvas = document.getElementById('playCanvas');
        if (!gameCanvas || !window.GameCamera) return;
        
        // Calcular área visible en el juego
        const viewportX = -window.GameCamera.offsetX / window.GameCamera.zoom / CONFIG.TILE_SIZE * scale;
        const viewportY = -window.GameCamera.offsetY / window.GameCamera.zoom / CONFIG.TILE_SIZE * scale;
        const viewportWidth = gameCanvas.width / window.GameCamera.zoom / CONFIG.TILE_SIZE * scale;
        const viewportHeight = gameCanvas.height / window.GameCamera.zoom / CONFIG.TILE_SIZE * scale;
        
        // Dibujar rectángulo del viewport
        ctx.strokeStyle = CONFIG.MINIMAP_VIEWPORT_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
        
        ctx.fillStyle = CONFIG.MINIMAP_VIEWPORT_COLOR.replace('0.3', '0.1');
        ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    },
    
    getEntityIcon: function(entity) {
        const iconMap = {
            path: '·',
            spawn: 'S',
            base: 'B',
            tower_basic: 'T',
            tower_cannon: 'C',
            tower_magic: 'M',
            tower_sniper: 'F',
            enemy_fast: 'E',
            enemy_tank: 'K',
            enemy_boss: 'J'
        };
        
        let iconKey = entity.type;
        if (entity.subtype) {
            iconKey = `${entity.type}_${entity.subtype}`;
        }
        
        return iconMap[iconKey] || '?';
    },
    
    update: function() {
        if (state.game.testing) {
            this.renderGameMiniMap();
        } else {
            this.renderEditorMiniMap();
        }
    }
};

// ============================================
// SISTEMA DE FUNCIONES PERSONALIZADAS
// ============================================
const FUNCTION_SYSTEM = {
    EVENTS: {
        onGameStart: 'onGameStart',
        onGameOver: 'onGameOver',
        onWaveStart: 'onWaveStart',
        onWaveEnd: 'onWaveEnd',
        onWaveTick: 'onWaveTick',
        onTowerPlace: 'onTowerPlace',
        onEnemyKilled: 'onEnemyKilled',
        onBaseDamaged: 'onBaseDamaged'
    },
    
    ACTIONS: {
        spawnEnemy: 'spawnEnemy',
        addGold: 'addGold',
        addLife: 'addLife',
        modifyTower: 'modifyTower',
        showMessage: 'showMessage',
        createEffect: 'createEffect',
        setGameSpeed: 'setGameSpeed'
    },
    
    FUNCTIONS_KEY: 'td_custom_functions',
    
    ALLOWED_GLOBALS: ['Math', 'Date', 'JSON', 'Array', 'Object', 'Number', 'String', 'Boolean'],
    FORBIDDEN_KEYWORDS: ['eval', 'Function', 'setTimeout', 'setInterval', 'fetch', 'XMLHttpRequest', 'document', 'window', 'localStorage', 'require', 'import', 'export', 'alert', 'prompt', 'confirm']
};

// ============================================
// CLAVES DE ALMACENAMIENTO
// ============================================
const STORAGE_KEYS = {
    AUTO_SAVE: 'td_editor_autosave',
    PROJECT: 'td_editor_project',
    SETTINGS: 'td_editor_settings',
    WAVES: 'td_editor_waves',
    CUSTOM_FUNCTIONS: 'td_custom_functions'
};

// ============================================
// ESTADO GLOBAL UNIFICADO Y OPTIMIZADO
// ============================================
const state = {
    settings: {
        showRange: CONFIG.SHOW_RANGE_BY_DEFAULT,
        showGrid: true,
        audio: true,
        gridLabels: CONFIG.SHOW_GRID_LABELS,
        pathNumbers: CONFIG.SHOW_PATH_NUMBERS,
        performanceMode: CONFIG.PERFORMANCE_MODE,
        showMiniMap: true // NUEVO: Control del minimapa
    },
    
    project: { 
        name:'Nuevo Mapa', 
        width:64, 
        height:64, 
        entities:[], 
        customWaves:[],
        customFunctions: [],
        version: '3.6',
        pathDirty: true,
        cachedPath: []
    },
    
    ui: { 
        tool:'select', 
        player:1, 
        zoom:1, 
        offsetX:0, 
        offsetY:0, 
        mouseX:0, 
        mouseY:0, 
        dragging:false,
        selected:null,
        placingType:null,
        hoveringTower: null,
        needsRender: true,
        lastRenderTime: 0
    },
    
    game: { 
        testing:false, 
        speed:1, 
        life:100, 
        gold:200, 
        wave:1, 
        paused:false, 
        waveActive:false,
        enemiesSpawned:0,
        enemiesToSpawn:0,
        placingTower:null,
        towers:[], 
        enemies:[], 
        bullets:[], 
        path:[], 
        spawn:null, 
        base:null,
        waveTimers:[],
        nextEnemyId:1,
        score:0,
        baseBeingAttacked: false,
        baseAttackTimer: 0,
        functionTimers: [],
        lastUpdateTime: 0,
        updateAccumulator: 0
    },
    
    history: {
        undoStack: [],
        redoStack: [],
        enabled: true,
        lastSaveTime: 0
    },
    
    performance: {
        lastFPSUpdate: 0,
        frameCount: 0,
        fps: 60,
        renderTime: 0,
        updateTime: 0,
        lastUpdate: 0,
        activeAnimations: 0,
        activeEntities: 0
    },
    
    functionSystem: {
        customFunctions: [],
        activeFunctions: {}
    }
};

// ============================================
// SISTEMA DE EJECUCIÓN SEGURA DE FUNCIONES (OPTIMIZADO)
// ============================================
class FunctionSystem {
    constructor() {
        this.sandbox = this.createSandbox();
        this.loadFunctions();
    }
    
    createSandbox() {
        return {
            Math, Date, JSON, Array, Object, Number, String, Boolean,
            
            log: (msg, type = 'info') => {
                if (state.performance.updateTime < 16) {
                    logEvent(`[FUNC] ${msg}`, type);
                }
            },
            
            getGameState: () => ({
                wave: state.game.wave,
                gold: state.game.gold,
                life: state.game.life,
                enemies: state.game.enemies.length,
                towers: state.game.towers.length
            }),
            
            spawnEnemy: (type, count = 1) => {
                if (!state.game.testing || !state.game.spawn) return;
                
                const enemyType = CONFIG.ENEMY_TYPES[type];
                if (!enemyType) return;
                
                count = Math.min(count, 50);
                
                for (let i = 0; i < count; i++) {
                    if (state.game.enemies.length < 200) {
                        state.game.enemies.push({
                            id: state.game.nextEnemyId++,
                            x: state.game.spawn.centerX,
                            y: state.game.spawn.centerY,
                            type: type,
                            health: enemyType.health,
                            maxHealth: enemyType.health,
                            speed: enemyType.speed,
                            reward: enemyType.reward,
                            baseDamage: enemyType.baseDamage,
                            pathIndex: 0,
                            reachedBase: false,
                            reachedBaseProcessed: false
                        });
                    }
                }
            },
            
            addGold: (amount) => {
                if (state.game.testing) {
                    state.game.gold += amount;
                    state.game.score += amount;
                    animationSystem.addCoinEffect(
                        state.game.base.centerX,
                        state.game.base.centerY,
                        amount
                    );
                    audio.playCoin();
                }
            },
            
            addLife: (amount) => {
                if (state.game.testing) {
                    state.game.life = Math.min(100, state.game.life + amount);
                    animationSystem.addTextEffect(
                        state.game.base.centerX,
                        state.game.base.centerY,
                        `+${amount} Vida`,
                        '#48bb78'
                    );
                }
            },
            
            showMessage: (text, duration = 3000) => {
                showGameMessage(text);
            },
            
            createEffect: (x, y, type, color = '#ffffff') => {
                if (!state.game.testing) return;
                
                if (animationSystem.animations.length >= CONFIG.MAX_ANIMATIONS) return;
                
                switch(type) {
                    case 'explosion':
                        animationSystem.addHitEffect(x, y, 0, color);
                        break;
                    case 'text':
                        animationSystem.addTextEffect(x, y, 'Efecto!', color);
                        break;
                    case 'range':
                        animationSystem.addRangeIndicator(x, y, 3, color);
                        break;
                }
            },
            
            setGameSpeed: (speed) => {
                if (state.game.testing) {
                    state.game.speed = Math.max(0.25, Math.min(3, speed));
                    showGameMessage(`Velocidad: ${speed}x`);
                }
            },
            
            getRandom: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
            getWave: () => state.game.wave,
            getGold: () => state.game.gold,
            getLife: () => state.game.life,
            getEnemyCount: () => state.game.enemies.length,
            getTowerCount: () => state.game.towers.length
        };
    }
    
    validateCode(code) {
        for (const keyword of FUNCTION_SYSTEM.FORBIDDEN_KEYWORDS) {
            if (code.includes(keyword)) {
                throw new Error(`Palabra prohibida: ${keyword}`);
            }
        }
        
        try {
            new Function('sandbox', `
                with (sandbox) {
                    ${code}
                }
            `);
            return true;
        } catch (error) {
            throw new Error(`Error de sintaxis: ${error.message}`);
        }
    }
    
    loadFunctions() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_FUNCTIONS);
            if (saved) {
                state.functionSystem.customFunctions = JSON.parse(saved);
                this.organizeFunctionsByEvent();
            }
        } catch (e) {
            console.warn('Error cargando funciones:', e);
        }
    }
    
    saveFunctions() {
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_FUNCTIONS, 
                JSON.stringify(state.functionSystem.customFunctions));
            return true;
        } catch (e) {
            console.warn('Error guardando funciones:', e);
            return false;
        }
    }
    
    organizeFunctionsByEvent() {
        state.functionSystem.activeFunctions = {};
        
        for (const func of state.functionSystem.customFunctions) {
            if (func.enabled && func.event) {
                if (!state.functionSystem.activeFunctions[func.event]) {
                    state.functionSystem.activeFunctions[func.event] = [];
                }
                state.functionSystem.activeFunctions[func.event].push(func);
            }
        }
    }
    
    executeFunction(func, context = {}) {
        if (!func.enabled || !func.code) return false;
        
        try {
            const funcWrapper = new Function('sandbox', 'context', `
                with (sandbox) {
                    ${func.code}
                }
            `);
            
            funcWrapper(this.sandbox, context);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    triggerEvent(eventName, context = {}) {
        if (!state.game.testing) return;
        
        const functions = state.functionSystem.activeFunctions[eventName];
        if (!functions || functions.length === 0) return;
        
        for (const func of functions) {
            if (!this.executeFunction(func, context)) {
                break;
            }
        }
    }
    
    createTimerFunction(name, interval, code) {
        const timerId = setInterval(() => {
            if (state.game.testing && !state.game.paused) {
                try {
                    const funcWrapper = new Function('sandbox', `
                        with (sandbox) {
                            ${code}
                        }
                    `);
                    funcWrapper(this.sandbox);
                } catch (e) {
                    console.warn('Error en timer:', e);
                }
            }
        }, Math.max(100, interval));
        
        state.game.functionTimers.push(timerId);
        return timerId;
    }
    
    clearAllTimers() {
        state.game.functionTimers.forEach(timer => clearInterval(timer));
        state.game.functionTimers = [];
    }
    
    addFunction(funcData) {
        if (!funcData.name || !funcData.event || !funcData.code) {
            throw new Error('Faltan campos requeridos');
        }
        
        this.validateCode(funcData.code);
        
        const newFunc = {
            id: Date.now() + Math.random(),
            name: funcData.name,
            description: funcData.description || '',
            event: funcData.event,
            code: funcData.code,
            enabled: funcData.enabled !== false,
            created: new Date().toISOString()
        };
        
        state.functionSystem.customFunctions.push(newFunc);
        this.organizeFunctionsByEvent();
        this.saveFunctions();
        
        return newFunc;
    }
    
    updateFunction(id, updates) {
        const index = state.functionSystem.customFunctions.findIndex(f => f.id === id);
        if (index === -1) return false;
        
        if (updates.code) {
            this.validateCode(updates.code);
        }
        
        state.functionSystem.customFunctions[index] = {
            ...state.functionSystem.customFunctions[index],
            ...updates
        };
        
        this.organizeFunctionsByEvent();
        this.saveFunctions();
        return true;
    }
    
    deleteFunction(id) {
        const index = state.functionSystem.customFunctions.findIndex(f => f.id === id);
        if (index === -1) return false;
        
        state.functionSystem.customFunctions.splice(index, 1);
        this.organizeFunctionsByEvent();
        this.saveFunctions();
        return true;
    }
    
    getFunction(id) {
        return state.functionSystem.customFunctions.find(f => f.id === id);
    }
    
    exportFunctions() {
        return JSON.stringify(state.functionSystem.customFunctions, null, 2);
    }
    
    importFunctions(jsonString) {
        try {
            const functions = JSON.parse(jsonString);
            
            for (const func of functions) {
                if (!func.name || !func.event || !func.code) {
                    throw new Error('Formato inválido');
                }
                this.validateCode(func.code);
            }
            
            state.functionSystem.customFunctions = functions;
            this.organizeFunctionsByEvent();
            this.saveFunctions();
            
            return functions.length;
        } catch (e) {
            throw new Error(`Error importando: ${e.message}`);
        }
    }
    
    getFunctionTemplate(type) {
        const templates = {
            autoWave: {
                name: 'Auto-Oleada',
                description: 'Genera oleadas automáticamente',
                event: FUNCTION_SYSTEM.EVENTS.onWaveEnd,
                code: `// Auto-Oleada - Se ejecuta después de cada oleada
if (getWave() % 3 === 0) {
    const extra = Math.floor(getWave() / 3);
    spawnEnemy('fast', extra * 2);
    spawnEnemy('tank', extra);
    
    showMessage("¡Oleada especial! +" + (extra * 2) + " enemigos");
    log("Auto-oleada generada: " + extra + " extra");
}`
            },
            goldBonus: {
                name: 'Bonus de Oro',
                description: 'Da oro extra cada 5 oleadas',
                event: FUNCTION_SYSTEM.EVENTS.onWaveEnd,
                code: `// Bonus de oro cada 5 oleadas
if (getWave() % 5 === 0) {
    const bonus = 100 + (getWave() * 25);
    addGold(bonus);
    showMessage("¡Bonus! +$" + bonus + " oro");
    log("Bonus de oro otorgado: $" + bonus);
}`
            },
            arrowStorm: {
                name: 'Tormenta de Flechas',
                description: 'Lluvia de flechas aleatoria',
                event: FUNCTION_SYSTEM.EVENTS.onWaveTick,
                code: `// Tormenta de flechas aleatoria
if (getRandom(1, 100) <= 5) {
    const x = getRandom(0, 64);
    const y = getRandom(0, 48);
    createEffect(x, y, 'explosion', '#00ff00');
    showMessage("¡Tormenta de flechas!");
    
    log("Tormenta de flechas en (" + x + ", " + y + ")");
}`
            },
            healthRegen: {
                name: 'Regeneración de Vida',
                description: 'Regenera vida lentamente',
                event: FUNCTION_SYSTEM.EVENTS.onWaveTick,
                code: `// Regenera 1% de vida cada 10 segundos
if (getRandom(1, 600) === 1) {
    if (getLife() < 100) {
        addLife(1);
        log("Vida regenerada +1%");
    }
}`
            }
        };
        
        return templates[type] || {
            name: 'Nueva Función',
            description: '',
            event: FUNCTION_SYSTEM.EVENTS.onWaveStart,
            code: `// Variables: getWave(), getGold(), getLife(), getEnemyCount(), getTowerCount()
// Acciones: addGold(), addLife(), spawnEnemy(), showMessage(), createEffect(), setGameSpeed()

log("Función ejecutada en oleada " + getWave());`
        };
    }
}

// ============================================
// SISTEMA DE AUDIO
// ============================================
class AudioSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;
    }
    
    playClick() { if(this.enabled) this.playSound(1000, 'sine', 0.05); }
    playPlace() { if(this.enabled) this.playSound(800, 'sine', 0.1); }
    playDelete() { if(this.enabled) this.playSound(300, 'sawtooth', 0.1); }
    playSuccess() { if(this.enabled) this.playSound(600, 'sine', 0.2); }
    playError() { if(this.enabled) this.playSound(200, 'square', 0.15); }
    playShoot() { if(this.enabled) this.playSound(400, 'square', 0.08); }
    playCoin() { if(this.enabled) this.playSound(1200, 'sine', 0.15); }
    playWaveStart() { if(this.enabled) this.playSound(700, 'sine', 0.3); }
    playSelect() { if(this.enabled) this.playSound(500, 'sine', 0.1); }
    playHit() { if(this.enabled) this.playSound(300, 'sine', 0.1); }
    playBaseHit() { if(this.enabled) this.playSound(150, 'square', 0.2); }
    playWarning() { if(this.enabled) this.playSound(300, 'sawtooth', 0.3); }
    playUndo() { if(this.enabled) this.playSound(400, 'triangle', 0.1); }
    playRedo() { if(this.enabled) this.playSound(600, 'triangle', 0.1); }
    
    playSound(freq, type, dur) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.playSoundInternal(freq, type, dur);
                }).catch(e => {
                    console.warn('No se pudo reanudar AudioContext:', e);
                });
            } else {
                this.playSoundInternal(freq, type, dur);
            }
        } catch(e) {
            console.warn('Error de audio:', e);
        }
    }
    
    playSoundInternal(freq, type, dur) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + dur);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + dur);
        } catch(e) {
            // Silenciar errores de audio
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        const btn = document.getElementById('audioBtn');
        if (btn) {
            btn.textContent = this.enabled ? '🔊' : '🔇';
        }
        
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                audio: this.enabled,
                volume: this.volume,
                showGridLabels: state.settings.gridLabels,
                showPathNumbers: state.settings.pathNumbers
            }));
        } catch(e) {}
        
        return this.enabled;
    }
}

// ============================================
// SISTEMA DE ANIMACIONES
// ============================================
class AnimationSystem {
    constructor() {
        this.animations = [];
    }
    
    addHitEffect(x, y, damage, color = '#ffffff') {
        if (this.animations.length >= CONFIG.MAX_ANIMATIONS) return;
        
        this.animations.push({
            type: 'hit',
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            damage: damage,
            color: color,
            lifetime: 60,
            maxLifetime: 60
        });
    }
    
    addBaseHitEffect(x, y, damage) {
        if (this.animations.length >= CONFIG.MAX_ANIMATIONS) return;
        
        this.animations.push({
            type: 'baseHit',
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            damage: damage,
            lifetime: 30,
            maxLifetime: 30
        });
    }
    
    addCoinEffect(x, y, amount) {
        if (this.animations.length >= CONFIG.MAX_ANIMATIONS) return;
        
        this.animations.push({
            type: 'coin',
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            amount: amount,
            lifetime: 60,
            maxLifetime: 60
        });
    }
    
    addRangeIndicator(x, y, range, color = 'rgba(66,153,225,0.3)') {
        if (this.animations.length >= CONFIG.MAX_ANIMATIONS) return;
        
        this.animations.push({
            type: 'range',
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            range: range * CONFIG.TILE_SIZE,
            color: color,
            lifetime: 10,
            maxLifetime: 10
        });
    }
    
    addTextEffect(x, y, text, color = '#ffffff') {
        if (this.animations.length >= CONFIG.MAX_ANIMATIONS) return;
        
        this.animations.push({
            type: 'text',
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            text: text,
            color: color,
            lifetime: 90,
            maxLifetime: 90
        });
    }
    
    update() {
        for(let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.lifetime--;
            
            if(anim.lifetime <= 0) {
                this.animations.splice(i, 1);
            }
        }
        state.performance.activeAnimations = this.animations.length;
    }
    
    render(ctx) {
        if (state.settings.performanceMode) {
            return;
        }
        
        this.animations.forEach(anim => {
            const progress = 1 - (anim.lifetime / anim.maxLifetime);
            
            if(anim.type === 'hit') {
                const size = 10 + (progress * 20);
                const alpha = 1 - (progress * 0.8);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = anim.color;
                ctx.beginPath();
                ctx.arc(anim.x, anim.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                if(anim.damage && progress < 0.7) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`-${anim.damage}`, anim.x, anim.y - 20 + (progress * 30));
                }
                ctx.restore();
            }
            else if(anim.type === 'baseHit') {
                const size = 30 + (progress * 20);
                const alpha = 0.7 - (progress * 0.7);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(anim.x, anim.y, size, 0, Math.PI * 2);
                ctx.stroke();
                
                if(anim.damage) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`-${anim.damage}%`, anim.x, anim.y - 30);
                }
                ctx.restore();
            }
            else if(anim.type === 'coin') {
                const yOffset = progress * 40;
                const alpha = 1 - (progress * 0.8);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ecc94b';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`+$${anim.amount}`, anim.x, anim.y - yOffset);
                ctx.restore();
            }
            else if(anim.type === 'range') {
                const alpha = anim.lifetime / anim.maxLifetime;
                
                ctx.save();
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = anim.color;
                ctx.beginPath();
                ctx.arc(anim.x + CONFIG.TILE_SIZE/2, anim.y + CONFIG.TILE_SIZE/2, anim.range, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = anim.color.replace('0.3', '0.8');
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(anim.x + CONFIG.TILE_SIZE/2, anim.y + CONFIG.TILE_SIZE/2, anim.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
            else if(anim.type === 'text') {
                const yOffset = progress * 30;
                const alpha = 1 - (progress * 0.8);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = anim.color;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(anim.text, anim.x, anim.y - yOffset);
                ctx.restore();
            }
        });
    }
    
    clear() {
        this.animations = [];
    }
}

// ============================================
// INSTANCIAS GLOBALES
// ============================================
const audio = new AudioSystem();
const animationSystem = new AnimationSystem();
const functionSystem = new FunctionSystem();
let autoSaveTimer = null;

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function getColumnLabel(index) {
    let label = '';
    index++;
    
    while(index > 0) {
        let remainder = (index - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        index = Math.floor((index - 1) / 26);
    }
    
    return label;
}

function bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
        points.push({x: x0, y: y0});
        
        if(x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if(e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if(e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    
    return points;
}

// ============================================
// PATHFINDING CON CACHE
// ============================================
function getCachedPath() {
    if (state.project.pathDirty) {
        state.project.cachedPath = calculatePathSequence();
        state.project.pathDirty = false;
    }
    return state.project.cachedPath;
}

function validateMapConnectivity() {
    const spawn = state.project.entities.find(e => e.type === 'spawn' && e.player === 1);
    const base = state.project.entities.find(e => e.type === 'base' && e.player === 1);
    const pathTiles = state.project.entities.filter(e => e.type === 'path');
    
    if(!spawn || !base || pathTiles.length === 0) {
        return false;
    }
    
    const width = state.project.width;
    const height = state.project.height;
    const grid = Array(height).fill().map(() => Array(width).fill(false));
    
    pathTiles.forEach(path => {
        for(let y = path.y; y < path.y + path.height; y++) {
            for(let x = path.x; x < path.x + path.width; x++) {
                if(x >= 0 && x < width && y >= 0 && y < height) {
                    grid[y][x] = true;
                }
            }
        }
    });
    
    for(let y = base.y - 1; y < base.y + base.height + 1; y++) {
        for(let x = base.x - 1; x < base.x + base.width + 1; x++) {
            if(x >= 0 && x < width && y >= 0 && y < height) {
                if(x >= base.x && x < base.x + base.width && 
                   y >= base.y && y < base.y + base.height) {
                    grid[y][x] = true;
                }
            }
        }
    }
    
    const directions = [[0,1], [1,0], [0,-1], [-1,0]];
    
    let startPoints = [];
    
    if(grid[spawn.y][spawn.x]) {
        startPoints.push([spawn.x, spawn.y]);
    } else {
        for(const [dx, dy] of directions) {
            const nx = spawn.x + dx;
            const ny = spawn.y + dy;
            if(nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx]) {
                startPoints.push([nx, ny]);
            }
        }
    }
    
    if(startPoints.length === 0) {
        logEvent('❌ Spawn no conectado', 'error');
        return false;
    }
    
    const visited = new Set();
    const queue = [...startPoints];
    startPoints.forEach(p => visited.add(`${p[0]},${p[1]}`));
    
    while(queue.length > 0) {
        const [x, y] = queue.shift();
        
        if(x >= base.x && x < base.x + base.width &&
           y >= base.y && y < base.y + base.height) {
            return true;
        }
        
        for(const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            
            if(nx >= 0 && nx < width && ny >= 0 && ny < height &&
               !visited.has(key) && grid[ny][nx]) {
                visited.add(key);
                queue.push([nx, ny]);
            }
        }
    }
    
    return false;
}

function calculatePathSequence() {
    const spawn = state.project.entities.find(e => e.type === 'spawn' && e.player === 1);
    const base = state.project.entities.find(e => e.type === 'base' && e.player === 1);
    const pathTiles = state.project.entities.filter(e => e.type === 'path');
    
    if(!spawn || !base || pathTiles.length === 0) {
        return [];
    }
    
    const width = state.project.width;
    const height = state.project.height;
    const grid = Array(height).fill().map(() => Array(width).fill(false));
    
    pathTiles.forEach(path => {
        for(let y = path.y; y < path.y + path.height; y++) {
            for(let x = path.x; x < path.x + path.width; x++) {
                if(x >= 0 && x < width && y >= 0 && y < height) {
                    grid[y][x] = true;
                }
            }
        }
    });
    
    for(let y = base.y; y < base.y + base.height; y++) {
        for(let x = base.x; x < base.x + base.width; x++) {
            if(x >= 0 && x < width && y >= 0 && y < height) {
                grid[y][x] = true;
            }
        }
    }
    
    const start = {x: spawn.x, y: spawn.y};
    const end = {x: base.x + Math.floor(base.width/2), y: base.y + Math.floor(base.height/2)};
    
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    gScore.set(`${start.x},${start.y}`, 0);
    fScore.set(`${start.x},${start.y}`, heuristic(start, end));
    
    const directions = [[0,1], [1,0], [0,-1], [-1,0]];
    
    while(openSet.length > 0) {
        openSet.sort((a, b) => {
            const fA = fScore.get(`${a.x},${a.y}`) || Infinity;
            const fB = fScore.get(`${b.x},${b.y}`) || Infinity;
            return fA - fB;
        });
        
        const current = openSet.shift();
        
        if(current.x >= base.x && current.x < base.x + base.width &&
           current.y >= base.y && current.y < base.y + base.height) {
            return reconstructPath(cameFrom, current);
        }
        
        for(const [dx, dy] of directions) {
            const neighbor = {x: current.x + dx, y: current.y + dy};
            
            if(neighbor.x < 0 || neighbor.x >= width || 
               neighbor.y < 0 || neighbor.y >= height) {
                continue;
            }
            
            if(!grid[neighbor.y][neighbor.x]) {
                continue;
            }
            
            const tentativeGScore = (gScore.get(`${current.x},${current.y}`) || 0) + 1;
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            if(tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
                
                if(!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    return [];
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    let currentKey = `${current.x},${current.y}`;
    
    while(cameFrom.has(currentKey)) {
        current = cameFrom.get(currentKey);
        path.unshift(current);
        currentKey = `${current.x},${current.y}`;
    }
    
    return path;
}

// ============================================
// SISTEMA DE HISTORIAL
// ============================================
function saveStateToHistory(description = 'Cambio') {
    if(!state.history.enabled || state.game.testing) return;
    
    const stateCopy = {
        project: JSON.parse(JSON.stringify(state.project)),
        timestamp: Date.now(),
        description: description
    };
    
    state.history.undoStack.push(stateCopy);
    
    if(state.history.undoStack.length > CONFIG.MAX_HISTORY_STATES) {
        state.history.undoStack.shift();
    }
    
    state.history.redoStack = [];
    
    return true;
}

function undo() {
    if(state.history.undoStack.length === 0 || state.game.testing) {
        audio.playError();
        logEvent('❌ No hay acciones para deshacer', 'warning');
        return false;
    }
    
    const currentState = {
        project: JSON.parse(JSON.stringify(state.project)),
        timestamp: Date.now(),
        description: 'Antes de deshacer'
    };
    
    state.history.redoStack.push(currentState);
    
    const previousState = state.history.undoStack.pop();
    state.project = previousState.project;
    state.project.pathDirty = true;
    
    audio.playUndo();
    logEvent(`↶ Deshacer: ${previousState.description || 'acción anterior'}`);
    updateUI();
    state.ui.needsRender = true;
    
    autoSave();
    
    return true;
}

function redo() {
    if(state.history.redoStack.length === 0 || state.game.testing) {
        audio.playError();
        logEvent('❌ No hay acciones para rehacer', 'warning');
        return false;
    }
    
    const currentState = {
        project: JSON.parse(JSON.stringify(state.project)),
        timestamp: Date.now(),
        description: 'Antes de rehacer'
    };
    
    state.history.undoStack.push(currentState);
    
    const nextState = state.history.redoStack.pop();
    state.project = nextState.project;
    state.project.pathDirty = true;
    
    audio.playRedo();
    logEvent(`↷ Rehacer: ${nextState.description || 'acción siguiente'}`);
    updateUI();
    state.ui.needsRender = true;
    
    autoSave();
    
    return true;
}

// ============================================
// SISTEMA DE AUTO-SAVE
// ============================================
function autoSave() {
    try {
        const now = Date.now();
        if(now - state.history.lastSaveTime < 2000) return;
        
        const autoSaveData = {
            project: JSON.parse(JSON.stringify(state.project)),
            ui: {
                tool: state.ui.tool,
                player: state.ui.player,
                showRange: state.settings.showRange
            },
            timestamp: now,
            version: '3.6'
        };
        
        localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, JSON.stringify(autoSaveData));
        state.history.lastSaveTime = now;
        
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = Math.floor((Date.now() - now) / 1000) + 's';
        }
        
    } catch(e) {
        console.warn('Error en auto-save:', e);
    }
}

function tryLoadAutoSave() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
        if(saved) {
            const data = JSON.parse(saved);
            const now = Date.now();
            const hoursSinceSave = (now - data.timestamp) / (1000 * 60 * 60);
            
            if(hoursSinceSave < 24) {
                const minutes = Math.round(hoursSinceSave * 60);
                if(minutes < 1) {
                    state.project = data.project;
                    state.ui.tool = data.ui.tool || 'select';
                    state.ui.player = data.ui.player || 1;
                    state.settings.showRange = data.ui.showRange !== undefined ? data.ui.showRange : true;
                    
                    if (!state.project.customFunctions) {
                        state.project.customFunctions = [];
                    }
                    if (!state.project.customWaves) {
                        state.project.customWaves = [];
                    }
                    state.project.pathDirty = true;
                    
                    return true;
                } else if(confirm(`¿Recuperar auto-save del editor?\n(Guardado hace ${minutes} minutos)`)) {
                    state.project = data.project;
                    state.ui.tool = data.ui.tool || 'select';
                    state.ui.player = data.ui.player || 1;
                    state.settings.showRange = data.ui.showRange !== undefined ? data.ui.showRange : true;
                    
                    if (!state.project.customFunctions) {
                        state.project.customFunctions = [];
                    }
                    if (!state.project.customWaves) {
                        state.project.customWaves = [];
                    }
                    state.project.pathDirty = true;
                    
                    return true;
                }
            }
        }
    } catch(e) {
        console.warn('Error al cargar auto-save:', e);
    }
    return false;
}

function hasMapRequirements() {
    const hasPath = state.project.entities.some(e => e.type === 'path');
    const hasSpawn = state.project.entities.some(e => e.type === 'spawn' && e.player === 1);
    const hasBase = state.project.entities.some(e => e.type === 'base' && e.player === 1);
    
    return { hasPath, hasSpawn, hasBase, all: hasPath && hasSpawn && hasBase };
}

// ============================================
// INICIALIZACIÓN
// ============================================
function init() {
    console.log('🚀 Inicializando Tower Defense Editor v3.6...');
    
    try {
        loadSettings();
        
        const loadedAutoSave = tryLoadAutoSave();
        
        setupCanvases();
        
        if(!loadedAutoSave) {
            createDefaultMap();
        }
        
        setupEvents();
        setupButtonEvents();
        
        resizeCanvas();
        
        renderEditor();
        updateUI();
        updateWavePreview();
        
        startAutoSaveInterval();
        requestAnimationFrame(animationFrame);
        updateMemoryUsage();
        
        // NUEVO: Inicializar minimapa
        window.MiniMap.init();
        
        logEvent('✅ Editor v3.6 cargado correctamente', 'success');
        audio.playSuccess();
        
    } catch(error) {
        console.error('❌ Error de inicialización:', error);
        logEvent(`❌ Error de inicialización: ${error.message}`, 'error');
        alert('Error al inicializar el editor. Por favor, recarga la página.');
    }
}

function setupCanvases() {
    state.canvas = {
        editor: document.getElementById('gameCanvas'),
        editorCtx: document.getElementById('gameCanvas').getContext('2d'),
        game: document.getElementById('playCanvas'),
        gameCtx: document.getElementById('playCanvas')?.getContext('2d')
    };
}

function setupEvents() {
    const canvas = state.canvas.editor;
    
    if (canvas) {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', () => {
            state.ui.dragging = false;
            pathDrag.active = false;
            hideTowerRangePreview();
            canvas.style.cursor = 'default';
        });
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // NUEVO: Eventos de cámara para editor
        canvas.addEventListener('mousedown', handleEditorCameraMouseDown);
        canvas.addEventListener('wheel', handleEditorCameraWheel);
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        if(state.game.testing) resizeGameCanvas();
        state.ui.needsRender = true;
    });
    
    setupWaveEditorEvents();
    
    setInterval(updatePerformanceStats, 1000);
    
    // NUEVO: Eventos de teclado para cámara
    document.addEventListener('keydown', handleCameraKeys);
}

// ============================================
// EVENTOS DE CÁMARA (NUEVO)
// ============================================
function handleEditorCameraMouseDown(e) {
    if (state.game.testing) return;
    
    // Clic derecho (button 2) para arrastrar vista en editor
    if (e.button === 2) {
        e.preventDefault();
        state.ui.dragging = true;
        const rect = state.canvas.editor.getBoundingClientRect();
        state.ui.dragStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        state.canvas.editor.style.cursor = 'grabbing';
    }
}

function handleEditorCameraWheel(e) {
    if (state.game.testing) return;
    
    e.preventDefault();
    const oldZoom = state.ui.zoom;
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    state.ui.zoom = Math.max(0.25, Math.min(4, state.ui.zoom + zoomDelta));
    
    const rect = state.canvas.editor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    state.ui.offsetX = mouseX - (mouseX - state.ui.offsetX) * (state.ui.zoom / oldZoom);
    state.ui.offsetY = mouseY - (mouseY - state.ui.offsetY) * (state.ui.zoom / oldZoom);
    
    const zoomLevelEl = document.getElementById('zoomLevel');
    if (zoomLevelEl) zoomLevelEl.textContent = state.ui.zoom.toFixed(2) + 'x';
    state.ui.needsRender = true;
}

function handleCameraKeys(e) {
    // Tecla R para resetear cámara
    if (e.key === 'r' || e.key === 'R') {
        if (state.game.testing) {
            // Resetear cámara del juego
            window.GameCamera.reset();
            showGameMessage("🎥 Cámara del juego resetada");
        } else {
            // Resetear cámara del editor
            state.ui.offsetX = 0;
            state.ui.offsetY = 0;
            state.ui.zoom = 1;
            const zoomLevelEl = document.getElementById('zoomLevel');
            if (zoomLevelEl) zoomLevelEl.textContent = '1.00x';
            state.ui.needsRender = true;
            logEvent("🎥 Cámara del editor resetada", "info");
        }
        audio.playClick();
    }
    
    // Tecla M para alternar minimapa
    if (e.key === 'm' || e.key === 'M') {
        state.settings.showMiniMap = !state.settings.showMiniMap;
        const miniMapCanvas = document.getElementById('miniMapCanvas');
        const gameMiniMapCanvas = document.getElementById('gameMiniMapCanvas');
        
        if (miniMapCanvas) {
            miniMapCanvas.style.display = state.settings.showMiniMap ? 'block' : 'none';
        }
        if (gameMiniMapCanvas) {
            gameMiniMapCanvas.style.display = state.settings.showMiniMap ? 'block' : 'none';
        }
        
        const message = state.settings.showMiniMap ? "🗺️ Minimapa activado" : "🗺️ Minimapa desactivado";
        if (state.game.testing) {
            showGameMessage(message);
        } else {
            logEvent(message, "info");
        }
        audio.playClick();
    }
}

// ============================================
// EVENTOS DEL JUEGO PARA CÁMARA (NUEVO)
// ============================================
function setupGameCameraEvents() {
    const canvas = state.canvas.game;
    if (!canvas) return;
    
    // Mouse down para arrastrar cámara
    canvas.addEventListener('mousedown', function(e) {
        if (!state.game.testing) return;
        
        // Clic derecho (button 2) para arrastrar cámara
        if (e.button === 2) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            window.GameCamera.startDrag(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
            canvas.style.cursor = 'grabbing';
        }
    });
    
    // Mouse move para arrastrar cámara
    canvas.addEventListener('mousemove', function(e) {
        if (!state.game.testing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        window.GameCamera.drag(x, y);
    });
    
    // Mouse up para soltar cámara
    canvas.addEventListener('mouseup', function(e) {
        if (!state.game.testing) return;
        
        if (e.button === 2) {
            window.GameCamera.stopDrag();
            canvas.style.cursor = 'default';
        }
    });
    
    // Wheel para zoom
    canvas.addEventListener('wheel', function(e) {
        if (!state.game.testing) return;
        
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        window.GameCamera.applyZoom(
            e.deltaY,
            e.clientX - rect.left,
            e.clientY - rect.top,
            canvas.width,
            canvas.height
        );
    });
    
    // Prevenir menú contextual
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

function setupWaveEditorEvents() {
    const inputs = ['waveFastCount', 'waveTankCount', 'waveBossCount', 'waveMultiplier'];
    const ranges = ['waveFastCountRange', 'waveTankCountRange', 'waveBossCountRange', 'waveMultiplierRange'];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if(input) {
            input.addEventListener('input', updateWavePreview);
        }
    });
    
    ranges.forEach(id => {
        const range = document.getElementById(id);
        if(range) {
            range.addEventListener('input', function() {
                const targetId = id.replace('Range', '');
                const target = document.getElementById(targetId);
                if(target) {
                    target.value = this.value;
                    updateWavePreview();
                }
            });
        }
    });
}

// ============================================
// SISTEMA DE EVENTOS DE BOTONES
// ============================================
function setupButtonEvents() {
    const actionHandlers = {
        'menuNew': menuNew,
        'saveProject': saveProject,
        'loadProject': loadProject,
        'openFunctionEditor': openFunctionEditor,
        'openWaveEditor': openWaveEditor,
        'testMap': testMap,
        'toggleAudio': toggleAudio,
        'setTool': setTool,
        'selectPlayer': selectPlayer,
        'placeTower': placeTower,
        'placeEnemy': placeEnemy,
        'clearEvents': clearEvents,
        'newFunction': newFunction,
        'exportFunctions': exportFunctions,
        'importFunctions': importFunctions,
        'addNewWave': addNewWave,
        'loadPredefinedWaveSet': loadPredefinedWaveSet
    };
    
    document.addEventListener('click', function(e) {
        let target = e.target;
        let actionElement = null;
        
        while (target && target !== document) {
            if (target.hasAttribute('data-action')) {
                actionElement = target;
                break;
            }
            target = target.parentElement;
        }
        
        if (actionElement) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = actionElement.getAttribute('data-action');
            const arg = actionElement.getAttribute('data-arg');
            
            if (actionHandlers[action]) {
                if (arg !== null && arg !== undefined) {
                    actionHandlers[action](arg);
                } else {
                    actionHandlers[action]();
                }
            }
            return;
        }
        
        if (e.target.id === 'audioBtn' || e.target.closest('#audioBtn')) {
            e.preventDefault();
            e.stopPropagation();
            toggleAudio();
            return;
        }
        
        if (e.target.classList.contains('speed-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const onclick = e.target.getAttribute('onclick');
            if (onclick) {
                try {
                    const match = onclick.match(/setGameSpeed\(([^)]+)\)/);
                    if (match) {
                        const speed = parseFloat(match[1]);
                        setGameSpeed(speed, e.target);
                    }
                } catch (err) {}
            }
            return;
        }
        
        if (e.target.closest('.shop-item')) {
            e.preventDefault();
            e.stopPropagation();
            const shopItem = e.target.closest('.shop-item');
            const onclick = shopItem.getAttribute('onclick');
            if (onclick && onclick.includes('buyTower')) {
                try {
                    eval(onclick);
                } catch (err) {}
            }
            return;
        }
        
        if (e.target.closest('.player-item')) {
            e.preventDefault();
            e.stopPropagation();
            const playerItem = e.target.closest('.player-item');
            const player = playerItem.getAttribute('data-player');
            if (player) {
                selectPlayer(parseInt(player));
            }
            return;
        }
    });
    
    const rangeToggle = document.getElementById('showRangeToggle');
    if (rangeToggle) {
        rangeToggle.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleRangeDisplay();
        });
    }
    
    document.addEventListener('mouseover', function(e) {
        const shopItem = e.target.closest('.shop-item');
        if (shopItem && state.game.testing) {
            const onclick = shopItem.getAttribute('onclick');
            const towerTypeMatch = onclick?.match(/buyTower\('(\w+)'\)/);
            if (towerTypeMatch) {
                const towerType = towerTypeMatch[1];
                showTowerRange(towerType);
            }
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.shop-item')) {
            hideTowerRange();
        }
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

function startAutoSaveInterval() {
    if(autoSaveTimer) clearInterval(autoSaveTimer);
    
    autoSaveTimer = setInterval(() => {
        if(!state.game.testing) {
            autoSave();
        }
    }, CONFIG.AUTO_SAVE_INTERVAL);
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if(saved) {
            const settings = JSON.parse(saved);
            audio.enabled = settings.audio !== undefined ? settings.audio : true;
            audio.volume = settings.volume || 0.3;
            
            state.settings.gridLabels = settings.showGridLabels !== undefined ? settings.showGridLabels : true;
            state.settings.pathNumbers = settings.showPathNumbers !== undefined ? settings.showPathNumbers : true;
            state.settings.showMiniMap = settings.showMiniMap !== undefined ? settings.showMiniMap : true;
            
            const btn = document.getElementById('audioBtn');
            if(btn) {
                btn.textContent = audio.enabled ? '🔊' : '🔇';
            }
            
            const rangeToggle = document.getElementById('showRangeToggle');
            if (rangeToggle) {
                rangeToggle.checked = state.settings.showRange;
            }
        }
    } catch(e) {
        console.warn('Error al cargar configuraciones:', e);
    }
}

// ============================================
// ANIMATION FRAME CON RENDER CONDICIONAL
// ============================================
function animationFrame(timestamp) {
    const frameDuration = 1000 / CONFIG.TARGET_FPS;
    
    if (!state.game.testing) {
        if (state.ui.needsRender) {
            renderEditor();
            state.ui.needsRender = false;
        }
        
        // Actualizar minimapa del editor
        if (state.settings.showMiniMap) {
            window.MiniMap.update();
        }
    } else {
        if (!state.game.paused) {
            const deltaTime = timestamp - state.game.lastUpdateTime;
            state.game.lastUpdateTime = timestamp;
            state.game.updateAccumulator += deltaTime;
            
            while (state.game.updateAccumulator >= frameDuration) {
                updateGame(frameDuration / 1000);
                state.game.updateAccumulator -= frameDuration;
            }
            
            renderGame();
            
            // Actualizar minimapa del juego
            if (state.settings.showMiniMap) {
                window.MiniMap.update();
            }
        }
    }
    
    state.performance.frameCount++;
    requestAnimationFrame(animationFrame);
}

function updatePerformanceStats() {
    const now = Date.now();
    
    if(state.performance.lastFPSUpdate > 0) {
        const elapsed = (now - state.performance.lastFPSUpdate) / 1000;
        state.performance.fps = Math.round(state.performance.frameCount / elapsed);
        state.performance.frameCount = 0;
    }
    state.performance.lastFPSUpdate = now;
    
    const fpsDisplay = document.getElementById('fpsDisplay');
    const fpsCounter = document.getElementById('fpsCounter');
    const gameFPS = document.getElementById('gameFPS');
    
    if(fpsDisplay) fpsDisplay.textContent = state.performance.fps;
    if(fpsCounter) fpsCounter.textContent = state.performance.fps;
    if(gameFPS && state.game.testing) gameFPS.textContent = state.performance.fps;
    
    updateMemoryUsage();
}

function updateMemoryUsage() {
    try {
        if(window.performance && window.performance.memory) {
            const usedMB = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
            const memoryEl = document.getElementById('memoryUsage');
            if (memoryEl) memoryEl.textContent = usedMB + ' MB';
        } else {
            const jsonSize = JSON.stringify(state.project).length;
            const kb = Math.round(jsonSize / 1024);
            const memoryEl = document.getElementById('memoryUsage');
            if (memoryEl) memoryEl.textContent = kb + ' KB';
        }
    } catch(e) {
        const memoryEl = document.getElementById('memoryUsage');
        if (memoryEl) memoryEl.textContent = 'N/A';
    }
}

// ============================================
// EDITOR DE OLEADAS
// ============================================
function updateWavePreview() {
    const fast = parseInt(document.getElementById('waveFastCount').value) || 0;
    const tank = parseInt(document.getElementById('waveTankCount').value) || 0;
    const boss = parseInt(document.getElementById('waveBossCount').value) || 0;
    const multiplier = parseFloat(document.getElementById('waveMultiplier').value) || 1.0;
    
    const totalEnemies = fast + tank + boss;
    const fastReward = fast * 15;
    const tankReward = tank * 40;
    const bossReward = boss * 100;
    const totalReward = Math.round((fastReward + tankReward + bossReward) * multiplier);
    
    const preview = document.getElementById('wavePreview');
    if(preview) {
        preview.innerHTML = `
            👻 Rápidos: ${fast} | 🛡️ Tanques: ${tank} | 👹 Jefes: ${boss}<br>
            🎯 Total: ${totalEnemies} enemigos | 💰 Recompensa: ~$${totalReward} (x${multiplier.toFixed(1)})
        `;
    }
    
    const spawnTime = (fast * 0.5) + (tank * 0.8) + (boss * 1.2);
    const battleTime = totalEnemies * 3;
    const totalTime = Math.round(spawnTime + battleTime);
    const timeEstimateEl = document.getElementById('waveTimeEstimate');
    if (timeEstimateEl) timeEstimateEl.textContent = `${totalTime}s`;
    
    const difficulty = totalEnemies * multiplier;
    let difficultyText = 'Fácil';
    if(difficulty > 50) difficultyText = 'Media';
    if(difficulty > 100) difficultyText = 'Difícil';
    if(difficulty > 200) difficultyText = 'Extrema';
    const difficultyEl = document.getElementById('waveDifficulty');
    if (difficultyEl) difficultyEl.textContent = difficultyText;
}

function openWaveEditor() {
    const modal = document.getElementById('waveEditorModal');
    if (modal) modal.style.display = 'flex';
    
    const currentWaveEdit = document.getElementById('currentWaveEdit');
    if (currentWaveEdit) currentWaveEdit.textContent = state.game?.wave || 1;
    
    if(state.project.customWaves && state.project.customWaves.length > 0) {
        loadWaveIntoEditor(0);
    } else {
        const ids = ['waveFastCount', 'waveTankCount', 'waveBossCount', 'waveMultiplier'];
        const ranges = ['waveFastCountRange', 'waveTankCountRange', 'waveBossCountRange', 'waveMultiplierRange'];
        const values = [5, 0, 0, 1.0];
        
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = values[i];
        });
        
        ranges.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = values[i];
        });
    }
    
    updateWavePreview();
    updateSavedWavesList();
    audio.playClick();
}

function loadWaveIntoEditor(index) {
    if(state.project.customWaves && state.project.customWaves[index]) {
        const wave = state.project.customWaves[index];
        const ids = ['waveFastCount', 'waveTankCount', 'waveBossCount', 'waveMultiplier'];
        const ranges = ['waveFastCountRange', 'waveTankCountRange', 'waveBossCountRange', 'waveMultiplierRange'];
        const values = [wave.fast || 0, wave.tank || 0, wave.boss || 0, wave.rewardMult || 1.0];
        
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = values[i];
        });
        
        ranges.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = values[i];
        });
        
        updateWavePreview();
    }
}

function saveCurrentWave() {
    const fast = parseInt(document.getElementById('waveFastCount').value) || 0;
    const tank = parseInt(document.getElementById('waveTankCount').value) || 0;
    const boss = parseInt(document.getElementById('waveBossCount').value) || 0;
    const multiplier = parseFloat(document.getElementById('waveMultiplier').value) || 1.0;
    
    const wave = {
        id: Date.now(),
        fast: fast,
        tank: tank,
        boss: boss,
        rewardMult: multiplier,
        name: `Oleada ${state.project.customWaves.length + 1}`
    };
    
    state.project.customWaves.push(wave);
    updateSavedWavesList();
    logEvent(`💾 Oleada guardada`, 'success');
    audio.playSuccess();
}

function updateSavedWavesList() {
    const list = document.getElementById('savedWavesList');
    const count = document.getElementById('savedWaveCount');
    
    if(!list) return;
    
    list.innerHTML = '';
    if (count) count.textContent = state.project.customWaves.length;
    
    if(state.project.customWaves.length === 0) {
        list.innerHTML = '<div style="color:#aaa;text-align:center;padding:20px">No hay oleadas guardadas</div>';
        return;
    }
    
    state.project.customWaves.forEach((wave, index) => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.style.cssText = 'margin-bottom:5px;padding:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center';
        div.innerHTML = `
            <div>
                <strong>${wave.name}</strong>
                <div style="font-size:10px;color:#aaa">${wave.fast}👻 ${wave.tank}🛡️ ${wave.boss}👹 x${wave.rewardMult.toFixed(1)}</div>
            </div>
            <div style="display:flex;gap:5px">
                <button class="wave-btn" data-index="${index}" style="padding:2px 8px;background:#2c5282;border:none;color:white;border-radius:3px;font-size:10px;cursor:pointer">Cargar</button>
                <button class="wave-btn-delete" data-index="${index}" style="padding:2px 8px;background:#742a2a;border:none;color:white;border-radius:3px;font-size:10px;cursor:pointer">Eliminar</button>
            </div>
        `;
        list.appendChild(div);
    });
    
    setTimeout(() => {
        list.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                loadSavedWave(index);
            });
        });
        
        list.querySelectorAll('.wave-btn-delete').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                deleteSavedWave(index);
            });
        });
    }, 10);
}

function loadSavedWave(index) {
    if(state.project.customWaves[index]) {
        loadWaveIntoEditor(index);
        audio.playSelect();
    }
}

function deleteSavedWave(index) {
    if(confirm('¿Eliminar esta oleada?')) {
        state.project.customWaves.splice(index, 1);
        updateSavedWavesList();
        audio.playDelete();
    }
}

function addNewWave() {
    const waveNumber = state.project.customWaves.length + 1;
    const fast = Math.min(100, 5 + (waveNumber * 2));
    const tank = Math.min(50, Math.floor(waveNumber / 2));
    const boss = waveNumber >= 5 ? Math.floor((waveNumber - 4) / 3) : 0;
    const multiplier = 1.0 + (waveNumber * 0.05);
    
    document.getElementById('waveFastCount').value = fast;
    document.getElementById('waveFastCountRange').value = fast;
    document.getElementById('waveTankCount').value = tank;
    document.getElementById('waveTankCountRange').value = tank;
    document.getElementById('waveBossCount').value = boss;
    document.getElementById('waveBossCountRange').value = boss;
    document.getElementById('waveMultiplier').value = multiplier.toFixed(2);
    document.getElementById('waveMultiplierRange').value = multiplier.toFixed(2);
    
    updateWavePreview();
    logEvent(`➕ Nueva oleada generada`, 'success');
    audio.playSuccess();
}

function loadPredefinedWaveSet() {
    state.project.customWaves = JSON.parse(JSON.stringify(CONFIG.WAVE_CONFIG.predefined));
    updateSavedWavesList();
    logEvent('📋 Set predefinido de oleadas cargado', 'success');
    audio.playSuccess();
}

function loadPredefinedWave() {
    const waveNum = Math.min(state.project.customWaves.length + 1, CONFIG.WAVE_CONFIG.predefined.length);
    const wave = CONFIG.WAVE_CONFIG.predefined[waveNum - 1];
    
    if(wave) {
        document.getElementById('waveFastCount').value = wave.fast;
        document.getElementById('waveFastCountRange').value = wave.fast;
        document.getElementById('waveTankCount').value = wave.tank;
        document.getElementById('waveTankCountRange').value = wave.tank;
        document.getElementById('waveBossCount').value = wave.boss;
        document.getElementById('waveBossCountRange').value = wave.boss;
        document.getElementById('waveMultiplier').value = wave.rewardMult;
        document.getElementById('waveMultiplierRange').value = wave.rewardMult;
        
        updateWavePreview();
        audio.playClick();
    }
}

function duplicateCurrentWave() {
    const fast = parseInt(document.getElementById('waveFastCount').value) || 0;
    const tank = parseInt(document.getElementById('waveTankCount').value) || 0;
    const boss = parseInt(document.getElementById('waveBossCount').value) || 0;
    const multiplier = parseFloat(document.getElementById('waveMultiplier').value) || 1.0;
    
    const wave = {
        id: Date.now(),
        fast: fast,
        tank: tank,
        boss: boss,
        rewardMult: multiplier,
        name: `Oleada ${state.project.customWaves.length + 1} (Copia)`
    };
    
    state.project.customWaves.push(wave);
    updateSavedWavesList();
    logEvent('📄 Oleada duplicada', 'success');
    audio.playSuccess();
}

function exportWaves() {
    const dataStr = JSON.stringify(state.project.customWaves, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'oleadas_tower_defense.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    logEvent('📤 Oleadas exportadas', 'success');
    audio.playSuccess();
}

function importWaves() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const waves = JSON.parse(event.target.result);
                state.project.customWaves = waves;
                updateSavedWavesList();
                logEvent('📥 Oleadas importadas correctamente', 'success');
                audio.playSuccess();
            } catch(error) {
                logEvent('❌ Error al importar: archivo inválido', 'error');
                audio.playError();
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllWaves() {
    if(confirm('¿Eliminar TODAS las oleadas guardadas?')) {
        state.project.customWaves = [];
        updateSavedWavesList();
        logEvent('🗑️ Todas las oleadas eliminadas', 'warning');
        audio.playDelete();
    }
}

// ============================================
// SISTEMA DE FUNCIONES PERSONALIZADAS
// ============================================
function openFunctionEditor() {
    const modal = document.getElementById('functionEditorModal');
    if (modal) modal.style.display = 'flex';
    updateFunctionList();
    audio.playClick();
}

function updateFunctionList() {
    const list = document.getElementById('functionsList');
    const count = document.getElementById('functionCount');
    
    if(!list) return;
    
    list.innerHTML = '';
    if (count) count.textContent = state.functionSystem.customFunctions.length;
    
    if(state.functionSystem.customFunctions.length === 0) {
        list.innerHTML = '<div style="color:#aaa;text-align:center;padding:20px">No hay funciones personalizadas</div>';
        return;
    }
    
    state.functionSystem.customFunctions.forEach((func) => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.style.cssText = 'margin-bottom:5px;padding:8px;border-left:4px solid ' + 
            (func.enabled ? '#48bb78' : '#ccc') + ';';
        div.innerHTML = `
            <div>
                <strong>${func.name}</strong>
                <div style="font-size:10px;color:#aaa">Evento: ${func.event} | ${func.enabled ? '🟢 Activa' : '⚫ Inactiva'}</div>
                <div style="font-size:9px;color:#777;margin-top:3px">${func.description || 'Sin descripción'}</div>
            </div>
            <div style="display:flex;gap:5px;margin-top:5px">
                <button class="func-edit-btn" data-id="${func.id}" style="padding:2px 8px;background:#2c5282;border:none;color:white;border-radius:3px;font-size:10px;cursor:pointer">Editar</button>
                <button class="func-toggle-btn" data-id="${func.id}" style="padding:2px 8px;background:#${func.enabled ? '718096' : '38a169'};border:none;color:white;border-radius:3px;font-size:10px;cursor:pointer">${func.enabled ? 'Desactivar' : 'Activar'}</button>
                <button class="func-delete-btn" data-id="${func.id}" style="padding:2px 8px;background:#742a2a;border:none;color:white;border-radius:3px;font-size:10px;cursor:pointer">Eliminar</button>
            </div>
        `;
        list.appendChild(div);
    });
    
    setTimeout(() => {
        list.querySelectorAll('.func-edit-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                editFunction(id);
            });
        });
        
        list.querySelectorAll('.func-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                toggleFunction(id);
            });
        });
        
        list.querySelectorAll('.func-delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                deleteFunction(id);
            });
        });
    }, 10);
}

function newFunction() {
    const editorModal = document.getElementById('functionEditorModal');
    const editModal = document.getElementById('functionEditModal');
    
    if (editorModal) editorModal.style.display = 'none';
    if (editModal) editModal.style.display = 'flex';
    
    document.getElementById('funcId').value = '';
    document.getElementById('funcName').value = '';
    document.getElementById('funcDescription').value = '';
    document.getElementById('funcEvent').value = FUNCTION_SYSTEM.EVENTS.onWaveStart;
    document.getElementById('funcCode').value = `// Variables: getWave(), getGold(), getLife(), getEnemyCount(), getTowerCount()
// Acciones: addGold(), addLife(), spawnEnemy(), showMessage(), createEffect(), setGameSpeed()

log("Función ejecutada en oleada " + getWave());`;
    document.getElementById('funcEnabled').checked = true;
    
    audio.playClick();
}

function editFunction(id) {
    const func = functionSystem.getFunction(id);
    if(!func) return;
    
    const editorModal = document.getElementById('functionEditorModal');
    const editModal = document.getElementById('functionEditModal');
    
    if (editorModal) editorModal.style.display = 'none';
    if (editModal) editModal.style.display = 'flex';
    
    document.getElementById('funcId').value = func.id;
    document.getElementById('funcName').value = func.name;
    document.getElementById('funcDescription').value = func.description || '';
    document.getElementById('funcEvent').value = func.event;
    document.getElementById('funcCode').value = func.code;
    document.getElementById('funcEnabled').checked = func.enabled;
    
    audio.playSelect();
}

function saveFunction() {
    const id = document.getElementById('funcId').value;
    const name = document.getElementById('funcName').value.trim();
    const description = document.getElementById('funcDescription').value.trim();
    const event = document.getElementById('funcEvent').value;
    const code = document.getElementById('funcCode').value;
    const enabled = document.getElementById('funcEnabled').checked;
    
    if(!name || !event || !code) {
        alert('Faltan campos requeridos');
        return;
    }
    
    try {
        functionSystem.validateCode(code);
        
        const funcData = {
            name,
            description,
            event,
            code,
            enabled
        };
        
        let success;
        if(id) {
            success = functionSystem.updateFunction(id, funcData);
        } else {
            success = functionSystem.addFunction(funcData);
        }
        
        if(success) {
            updateFunctionList();
            closeModal();
            logEvent(`💾 Función "${name}" guardada`, 'success');
            audio.playSuccess();
        }
    } catch(error) {
        alert(`Error: ${error.message}`);
        audio.playError();
    }
}

function deleteFunction(id) {
    if(confirm('¿Eliminar esta función?')) {
        const func = functionSystem.getFunction(id);
        if(func && functionSystem.deleteFunction(id)) {
            updateFunctionList();
            logEvent(`🗑️ Función "${func.name}" eliminada`, 'warning');
            audio.playDelete();
        }
    }
}

function toggleFunction(id) {
    const func = functionSystem.getFunction(id);
    if(func) {
        func.enabled = !func.enabled;
        functionSystem.updateFunction(id, { enabled: func.enabled });
        updateFunctionList();
        logEvent(`🔄 Función "${func.name}" ${func.enabled ? 'activada' : 'desactivada'}`, 'info');
        audio.playClick();
    }
}

function loadFunctionTemplate(templateName) {
    const template = functionSystem.getFunctionTemplate(templateName);
    
    document.getElementById('funcName').value = template.name;
    document.getElementById('funcDescription').value = template.description;
    document.getElementById('funcEvent').value = template.event;
    document.getElementById('funcCode').value = template.code;
    
    logEvent(`📋 Plantilla "${template.name}" cargada`, 'info');
    audio.playSelect();
}

function testFunctionCode() {
    const code = document.getElementById('funcCode').value;
    
    try {
        functionSystem.validateCode(code);
        
        const testCode = `
            try {
                ${code}
                log("✅ Prueba exitosa", "success");
                showMessage("Prueba exitosa");
            } catch(e) {
                log("❌ Error en prueba: " + e.message, "error");
                showMessage("Error: " + e.message);
            }
        `;
        
        const funcWrapper = new Function('sandbox', `
            with (sandbox) {
                ${testCode}
            }
        `);
        
        funcWrapper(functionSystem.sandbox);
        
    } catch(error) {
        alert(`Error de validación: ${error.message}`);
        audio.playError();
    }
}

function exportFunctions() {
    const dataStr = functionSystem.exportFunctions();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'funciones_tower_defense.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    logEvent('📤 Funciones exportadas', 'success');
    audio.playSuccess();
}

function importFunctions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const count = functionSystem.importFunctions(event.target.result);
                updateFunctionList();
                logEvent(`📥 ${count} funciones importadas correctamente`, 'success');
                audio.playSuccess();
            } catch(error) {
                alert(`Error al importar: ${error.message}`);
                audio.playError();
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllFunctions() {
    if(confirm('¿Eliminar TODAS las funciones personalizadas?')) {
        state.functionSystem.customFunctions = [];
        functionSystem.organizeFunctionsByEvent();
        functionSystem.saveFunctions();
        updateFunctionList();
        logEvent('🗑️ Todas las funciones eliminadas', 'warning');
        audio.playDelete();
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function getEntityName(type) {
    const names = {
        path: 'Camino',
        spawn: 'Spawn',
        base: 'Base',
        tower: 'Torre',
        enemy: 'Enemigo'
    };
    return names[type] || type;
}

function getToolName(tool) {
    const names = {
        select: 'Seleccionar',
        path: 'Camino',
        spawn: 'Spawn',
        base: 'Base',
        erase: 'Borrar',
        place_tower: 'Colocar Torre',
        place_enemy: 'Colocar Enemigo'
    };
    return names[tool] || tool;
}

function isPositionValid(x, y, width = 1, height = 1) {
    if(x < 0 || y < 0 || x + width > state.project.width || y + height > state.project.height) {
        return false;
    }
    
    for(const entity of state.project.entities) {
        if(entity.type === 'path' || entity.type === 'spawn' || entity.type === 'base' || entity.type === 'tower') {
            if(x < entity.x + entity.width && x + width > entity.x &&
               y < entity.y + entity.height && y + height > entity.y) {
                return false;
            }
        }
    }
    
    return true;
}

// ============================================
// EDITOR - FUNCIONES PRINCIPALES
// ============================================
function setTool(tool) {
    state.ui.tool = tool;
    state.ui.placingType = null;
    state.ui.hoveringTower = null;
    hideTowerRangePreview();
    updateUI();
    audio.playClick();
}

function selectPlayer(player) {
    state.ui.player = player;
    document.querySelectorAll('.player-item').forEach(item => {
        const itemPlayer = parseInt(item.dataset.player);
        item.classList.toggle('active', itemPlayer === player);
    });
    updateUI();
    audio.playSelect();
}

function placeTower(type) {
    state.ui.tool = 'place_tower';
    state.ui.placingType = type;
    updateUI();
    audio.playClick();
}

function placeEnemy(type) {
    state.ui.tool = 'place_enemy';
    state.ui.placingType = type;
    updateUI();
    audio.playClick();
}

function toggleRangeDisplay() {
    state.settings.showRange = !state.settings.showRange;
    const toggle = document.getElementById('showRangeToggle');
    if (toggle) toggle.checked = state.settings.showRange;
    const rangeVisible = document.getElementById('rangeVisible');
    if (rangeVisible) rangeVisible.textContent = state.settings.showRange ? 'Sí' : 'No';
    state.ui.needsRender = true;
    audio.playClick();
}

function toggleGameRange() {
    state.settings.showRange = !state.settings.showRange;
    const btn = document.getElementById('toggleRangeBtn');
    if (btn) {
        btn.textContent = state.settings.showRange ? '📐 Ocultar Rangos' : '📐 Mostrar Rangos';
    }
    audio.playClick();
}

// ============================================
// EVENTOS DEL MOUSE - EDITOR
// ============================================
let pathDrag = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    tiles: []
};

function handleMouseDown(e) {
    if(state.game.testing) return;
    
    if (e.target.closest('.sc-modal')) {
        return;
    }
    
    const rect = state.canvas.editor.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const worldX = (x - state.ui.offsetX) / state.ui.zoom;
    const worldY = (y - state.ui.offsetY) / state.ui.zoom;
    
    const tileX = Math.floor(worldX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldY / CONFIG.TILE_SIZE);
    
    state.ui.mouseX = tileX;
    state.ui.mouseY = tileY;
    
    if(e.button === 0) {
        if(state.ui.tool === 'path') {
            pathDrag.active = true;
            pathDrag.startX = tileX;
            pathDrag.startY = tileY;
            pathDrag.currentX = tileX;
            pathDrag.currentY = tileY;
            pathDrag.tiles = [{x: tileX, y: tileY}];
            
            if(isPositionValid(tileX, tileY)) {
                addEntity('path', tileX, tileY);
            }
            
            state.canvas.editor.style.cursor = 'crosshair';
            e.preventDefault();
        } else {
            handleMapClick(tileX, tileY);
            e.preventDefault();
        }
    }
}

function handleMouseMove(e) {
    if(state.game.testing) return;
    
    if (e.target.closest('.sc-modal')) {
        if (state.canvas.editor) {
            state.canvas.editor.style.cursor = 'default';
        }
        return;
    }
    
    const rect = state.canvas.editor.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const worldX = (x - state.ui.offsetX) / state.ui.zoom;
    const worldY = (y - state.ui.offsetY) / state.ui.zoom;
    
    const tileX = Math.floor(worldX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldY / CONFIG.TILE_SIZE);
    
    const cursorPosEl = document.getElementById('cursorPos');
    if (cursorPosEl) cursorPosEl.textContent = `(${getColumnLabel(tileX-1)}${tileY+1})`;
    
    if(state.ui.dragging) {
        const dx = x - state.ui.dragStart.x;
        const dy = y - state.ui.dragStart.y;
        state.ui.offsetX += dx;
        state.ui.offsetY += dy;
        state.ui.dragStart = {x, y};
        state.ui.needsRender = true;
        e.preventDefault();
    }
    
    if(pathDrag.active && state.ui.tool === 'path') {
        pathDrag.currentX = tileX;
        pathDrag.currentY = tileY;
        
        const newTiles = bresenhamLine(
            pathDrag.startX, pathDrag.startY,
            pathDrag.currentX, pathDrag.currentY
        );
        
        newTiles.forEach(tile => {
            const exists = pathDrag.tiles.some(t => t.x === tile.x && t.y === tile.y);
            if(!exists && isPositionValid(tile.x, tile.y)) {
                pathDrag.tiles.push(tile);
                addEntity('path', tile.x, tile.y);
            }
        });
        
        pathDrag.startX = tileX;
        pathDrag.startY = tileY;
        e.preventDefault();
    }
    
    const entities = getEntitiesAt(tileX, tileY);
    const tower = entities.find(e => e.type === 'tower');
    
    if(state.ui.tool === 'place_tower' && state.ui.placingType) {
        if(state.ui.hoveringTower) {
            state.ui.hoveringTower = null;
            hideRangeOverlay();
        }
        state.ui.mouseX = tileX;
        state.ui.mouseY = tileY;
        updatePlacementOverlay();
        showTowerRangePreview(tileX, tileY, state.ui.placingType);
    } 
    else if(tower && state.settings.showRange) {
        state.ui.hoveringTower = tower;
        showRangeOverlay(tower);
        state.ui.mouseX = tileX;
        state.ui.mouseY = tileY;
        updatePlacementOverlay();
    } 
    else if(state.ui.hoveringTower && !tower) {
        state.ui.hoveringTower = null;
        hideRangeOverlay();
        state.ui.mouseX = tileX;
        state.ui.mouseY = tileY;
        updatePlacementOverlay();
    }
    else {
        state.ui.mouseX = tileX;
        state.ui.mouseY = tileY;
        updatePlacementOverlay();
    }
    
    state.ui.needsRender = true;
}

function handleMouseUp(e) {
    if(state.game.testing) return;
    
    if(e.button === 0 && pathDrag.active) {
        pathDrag.active = false;
        pathDrag.tiles = [];
        if (state.canvas.editor) {
            state.canvas.editor.style.cursor = 'default';
        }
        state.ui.needsRender = true;
    }
    
    if (e.button === 2) {
        state.ui.dragging = false;
        if (state.canvas.editor) {
            state.canvas.editor.style.cursor = 'default';
        }
    }
}

function handleWheel(e) {
    if(state.game.testing) return;
    
    e.preventDefault();
    const oldZoom = state.ui.zoom;
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    state.ui.zoom = Math.max(0.25, Math.min(4, state.ui.zoom + zoomDelta));
    
    const rect = state.canvas.editor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    state.ui.offsetX = mouseX - (mouseX - state.ui.offsetX) * (state.ui.zoom / oldZoom);
    state.ui.offsetY = mouseY - (mouseY - state.ui.offsetY) * (state.ui.zoom / oldZoom);
    
    const zoomLevelEl = document.getElementById('zoomLevel');
    if (zoomLevelEl) zoomLevelEl.textContent = state.ui.zoom.toFixed(2) + 'x';
    state.ui.needsRender = true;
}

function handleMapClick(x, y) {
    if(x < 0 || x >= state.project.width || y < 0 || y >= state.project.height) {
        audio.playError();
        logEvent(`❌ Posición fuera del mapa`, 'error');
        return;
    }
    
    switch(state.ui.tool) {
        case 'select':
            selectEntityAt(x, y);
            break;
            
        case 'path':
            if(isPositionValid(x, y)) {
                addEntity('path', x, y);
            } else {
                audio.playError();
                logEvent('❌ No se puede colocar camino aquí', 'error');
            }
            break;
            
        case 'spawn':
            if(isPositionValid(x, y)) {
                addEntity('spawn', x, y, state.ui.player);
            } else {
                audio.playError();
                logEvent('❌ No se puede colocar spawn aquí', 'error');
            }
            break;
            
        case 'base':
            if(isPositionValid(x, y, 2, 2)) {
                addEntity('base', x, y, state.ui.player, 2, 2);
            } else {
                audio.playError();
                logEvent('❌ No se puede colocar base aquí', 'error');
            }
            break;
            
        case 'erase':
            removeEntityAt(x, y);
            break;
            
        case 'place_tower':
            if(isPositionValid(x, y) && state.ui.placingType) {
                addEntity('tower', x, y, state.ui.player, 1, 1, state.ui.placingType);
                state.ui.tool = 'select';
                state.ui.placingType = null;
                hidePlacementOverlay();
                hideTowerRangePreview();
            } else {
                audio.playError();
                logEvent('❌ No se puede colocar torre aquí', 'error');
            }
            break;
            
        case 'place_enemy':
            if(state.ui.placingType) {
                addEntity('enemy', x, y, 0, 1, 1, state.ui.placingType);
                state.ui.tool = 'select';
                state.ui.placingType = null;
                hidePlacementOverlay();
            }
            break;
    }
    
    updateUI();
    state.ui.needsRender = true;
}

// ============================================
// MANEJO DE ENTIDADES
// ============================================
function addEntity(type, x, y, player = 0, width = 1, height = 1, subtype = null) {
    if(state.project.entities.length >= CONFIG.MAX_ENTITIES) {
        logEvent('❌ Límite de entidades alcanzado', 'error');
        audio.playError();
        return null;
    }
    
    saveStateToHistory(`Agregar ${getEntityName(type)} en (${x}, ${y})`);
    
    if(type === 'spawn' || type === 'base') {
        state.project.entities = state.project.entities.filter(e => 
            !(e.type === type && e.player === player)
        );
    }
    
    const entity = {
        id: Date.now() + Math.random(),
        type, x, y, width, height, player,
        subtype,
        color: type === 'spawn' || type === 'base' ? CONFIG.PLAYER_COLORS[player-1] : '#4a5568'
    };
    
    state.project.entities.push(entity);
    
    if (type === 'path' || type === 'spawn' || type === 'base') {
        state.project.pathDirty = true;
    }
    
    logEvent(`${getEntityName(type)} ${subtype || ''} en (${x}, ${y})`);
    audio.playPlace();
    
    autoSave();
    
    return entity;
}

function removeEntity(entity) {
    saveStateToHistory(`Eliminar ${getEntityName(entity.type)} de (${entity.x}, ${entity.y})`);
    
    const index = state.project.entities.indexOf(entity);
    if(index !== -1) {
        state.project.entities.splice(index, 1);
        if(state.ui.selected === entity) {
            state.ui.selected = null;
        }
        
        if (entity.type === 'path' || entity.type === 'spawn' || entity.type === 'base') {
            state.project.pathDirty = true;
        }
        
        audio.playDelete();
        autoSave();
    }
}

function removeEntityAt(x, y) {
    const entities = getEntitiesAt(x, y);
    if(entities.length > 0) {
        removeEntity(entities[0]);
        return true;
    }
    return false;
}

function getEntitiesAt(x, y) {
    return state.project.entities.filter(e => 
        x >= e.x && x < e.x + e.width &&
        y >= e.y && y < e.y + e.height
    );
}

function selectEntityAt(x, y) {
    const entities = getEntitiesAt(x, y);
    if(entities.length > 0) {
        state.ui.selected = entities[0];
        audio.playSelect();
    } else {
        state.ui.selected = null;
    }
}

// ============================================
// RENDER EDITOR CON CÁMARA
// ============================================
function resizeCanvas() {
    const container = document.getElementById('mapContainer');
    if(!container) return;
    
    const canvas = state.canvas.editor;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    state.ui.needsRender = true;
}

function renderEditor() {
    const startTime = performance.now();
    const ctx = state.canvas.editorCtx;
    const canvas = state.canvas.editor;
    
    if (!ctx || !canvas) return;
    
    // Limpiar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar transformaciones de cámara
    ctx.save();
    ctx.translate(state.ui.offsetX, state.ui.offsetY);
    ctx.scale(state.ui.zoom, state.ui.zoom);
    
    // Dibujar elementos
    drawGrid(ctx);
    drawEntities(ctx);
    
    if(state.ui.selected) {
        drawSelection(ctx, state.ui.selected);
    }
    
    if(state.settings.showRange) {
        drawTowerRanges(ctx);
    }
    
    ctx.restore();
    
    // Dibujar HUD
    drawHUD(ctx);
    
    const renderTime = performance.now() - startTime;
    state.performance.renderTime = Math.round(renderTime * 100) / 100;
    const renderTimeEl = document.getElementById('renderTime');
    if (renderTimeEl) renderTimeEl.textContent = state.performance.renderTime + 'ms';
}

function drawGrid(ctx) {
    if(!state.settings.showGrid) return;
    
    const tileSize = CONFIG.TILE_SIZE;
    const width = state.project.width;
    const height = state.project.height;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    
    if (state.settings.gridLabels) {
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    }
    
    for(let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, height * tileSize);
        ctx.stroke();
        
        if(state.settings.gridLabels && x < width) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const columnLabel = getColumnLabel(x);
            ctx.fillText(
                columnLabel,
                x * tileSize + tileSize/2,
                10
            );
        }
    }
    
    for(let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(width * tileSize, y * tileSize);
        ctx.stroke();
        
        if(state.settings.gridLabels && y < height) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText(
                (y + 1).toString(),
                10,
                y * tileSize + tileSize/2
            );
        }
    }
}

function drawEntities(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    let pathSequence = [];
    if(state.settings.pathNumbers) {
        pathSequence = getCachedPath();
    }
    
    state.project.entities.forEach(entity => {
        ctx.fillStyle = entity.color;
        ctx.fillRect(
            entity.x * tileSize,
            entity.y * tileSize,
            entity.width * tileSize,
            entity.height * tileSize
        );
        
        const icon = getEntityIcon(entity);
        if(icon) {
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                icon,
                entity.x * tileSize + (entity.width * tileSize) / 2,
                entity.y * tileSize + (entity.height * tileSize) / 2
            );
        }
        
        if(state.settings.pathNumbers) {
            if(entity.type === 'path') {
                const seqNum = pathSequence.findIndex(p => p.x === entity.x && p.y === entity.y);
                if(seqNum !== -1) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(
                        (seqNum + 1).toString(),
                        entity.x * tileSize + 2,
                        entity.y * tileSize + 2
                    );
                }
            } else if(entity.type === 'spawn' && entity.player === 1) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(
                    '0',
                    (entity.x + 1) * tileSize - 2,
                    (entity.y + 1) * tileSize - 2
                );
            } else if(entity.type === 'base' && entity.player === 1) {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(
                    'FIN',
                    (entity.x + entity.width) * tileSize - 2,
                    (entity.y + entity.height) * tileSize - 2
                );
            }
        }
    });
}

function getEntityIcon(entity) {
    const iconMap = {
        path: '🛣️',
        spawn: '🚩',
        base: '🏰',
        tower_basic: '🏹',
        tower_cannon: '💣',
        tower_magic: '🔮',
        tower_sniper: '🎯',
        enemy_fast: '👻',
        enemy_tank: '🛡️',
        enemy_boss: '👹'
    };
    
    let iconKey = entity.type;
    if (entity.subtype) {
        iconKey = `${entity.type}_${entity.subtype}`;
    }
    
    return iconMap[iconKey] || '?';
}

function drawTowerRanges(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    state.project.entities.forEach(entity => {
        if(entity.type === 'tower' && entity.subtype) {
            const towerType = CONFIG.TOWER_TYPES[entity.subtype];
            if(towerType) {
                const centerX = entity.x * tileSize + tileSize/2;
                const centerY = entity.y * tileSize + tileSize/2;
                const range = towerType.range * tileSize;
                
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = towerType.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = towerType.color;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.globalAlpha = 1.0;
            }
        }
    });
    
    if(state.ui.hoveringTower && state.ui.hoveringTower.subtype) {
        const towerType = CONFIG.TOWER_TYPES[state.ui.hoveringTower.subtype];
        if(towerType) {
            const centerX = state.ui.hoveringTower.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
            const centerY = state.ui.hoveringTower.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
            const range = towerType.range * CONFIG.TILE_SIZE;
            
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = towerType.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = towerType.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
        }
    }
}

function drawSelection(ctx, entity) {
    const tileSize = CONFIG.TILE_SIZE;
    
    ctx.strokeStyle = '#4299e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(
        entity.x * tileSize,
        entity.y * tileSize,
        entity.width * tileSize,
        entity.height * tileSize
    );
    ctx.setLineDash([]);
}

function drawHUD(ctx) {
    const info = [
        `Zoom: ${state.ui.zoom.toFixed(2)}x`,
        `Pos: (${getColumnLabel(state.ui.mouseX-1)}${state.ui.mouseY+1})`,
        `Herramienta: ${getToolName(state.ui.tool)}`,
        `Rango: ${state.settings.showRange ? 'ON' : 'OFF'}`,
        `Minimapa: ${state.settings.showMiniMap ? 'ON' : 'OFF'} (M)`
    ];
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 180, info.length * 20 + 10);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    info.forEach((text, i) => {
        ctx.fillText(text, 20, 20 + i * 20);
    });
}

function showTowerRangePreview(x, y, towerTypeId) {
    const overlay = document.getElementById('rangeOverlay');
    if(!overlay) return;
    
    const towerType = CONFIG.TOWER_TYPES[towerTypeId];
    if(!towerType) return;
    
    const tileSize = CONFIG.TILE_SIZE * state.ui.zoom;
    const rangePx = towerType.range * tileSize;
    const centerX = x * tileSize + tileSize/2 + state.ui.offsetX;
    const centerY = y * tileSize + tileSize/2 + state.ui.offsetY;
    
    overlay.style.display = 'block';
    overlay.style.left = (centerX - rangePx) + 'px';
    overlay.style.top = (centerY - rangePx) + 'px';
    overlay.style.width = (rangePx * 2) + 'px';
    overlay.style.height = (rangePx * 2) + 'px';
    overlay.style.border = `2px dashed ${towerType.color.replace(')', ',0.7)').replace('rgb', 'rgba')}`;
    overlay.style.background = towerType.color.replace(')', ',0.2)').replace('rgb', 'rgba');
}

function hideTowerRangePreview() {
    const overlay = document.getElementById('rangeOverlay');
    if(overlay) overlay.style.display = 'none';
}

function showRangeOverlay(tower) {
    const overlay = document.getElementById('rangeOverlay');
    if(!overlay || !tower.subtype) return;
    
    const towerType = CONFIG.TOWER_TYPES[tower.subtype];
    if(!towerType) return;
    
    const tileSize = CONFIG.TILE_SIZE * state.ui.zoom;
    const rangePx = towerType.range * tileSize;
    const centerX = tower.x * tileSize + tileSize/2 + state.ui.offsetX;
    const centerY = tower.y * tileSize + tileSize/2 + state.ui.offsetY;
    
    overlay.style.display = 'block';
    overlay.style.left = (centerX - rangePx) + 'px';
    overlay.style.top = (centerY - rangePx) + 'px';
    overlay.style.width = (rangePx * 2) + 'px';
    overlay.style.height = (rangePx * 2) + 'px';
    overlay.style.border = `2px dashed ${towerType.color.replace(')', ',0.7)').replace('rgb', 'rgba')}`;
    overlay.style.background = towerType.color.replace(')', ',0.2)').replace('rgb', 'rgba');
}

function hideRangeOverlay() {
    const overlay = document.getElementById('rangeOverlay');
    if(overlay) overlay.style.display = 'none';
}

function updatePlacementOverlay() {
    const overlay = document.getElementById('placementOverlay');
    if(!overlay || !state.ui.placingType) {
        if (overlay) overlay.style.display = 'none';
        return;
    }
    
    const tileSize = CONFIG.TILE_SIZE * state.ui.zoom;
    const screenX = state.ui.mouseX * tileSize + state.ui.offsetX;
    const screenY = state.ui.mouseY * tileSize + state.ui.offsetY;
    
    const isValid = isPositionValid(state.ui.mouseX, state.ui.mouseY);
    
    overlay.style.display = 'block';
    overlay.style.left = screenX + 'px';
    overlay.style.top = screenY + 'px';
    overlay.style.width = tileSize + 'px';
    overlay.style.height = tileSize + 'px';
    overlay.className = `placement-overlay ${isValid ? 'placement-valid' : 'placement-invalid'}`;
    
    overlay.innerHTML = `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px">
            ${state.ui.tool === 'place_tower' ? CONFIG.TOWER_TYPES[state.ui.placingType]?.icon : 
              state.ui.tool === 'place_enemy' ? CONFIG.ENEMY_TYPES[state.ui.placingType]?.icon : '?'}
        </div>
    `;
    
    if(state.ui.tool === 'place_tower' && state.ui.placingType) {
        showTowerRangePreview(state.ui.mouseX, state.ui.mouseY, state.ui.placingType);
    } else {
        hideTowerRangePreview();
    }
}

function hidePlacementOverlay() {
    const overlay = document.getElementById('placementOverlay');
    if(overlay) overlay.style.display = 'none';
}

// ============================================
// FUNCIONES DE RANGO EN EL JUEGO
// ============================================
function showTowerRange(type) {
    if (!state.game.testing) return;
    
    const towerType = CONFIG.TOWER_TYPES[type];
    if (!towerType) return;
    
    const overlay = document.getElementById('gameRangeOverlay');
    if (!overlay) return;
    
    const canvas = state.canvas.game;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const rangePx = towerType.range * CONFIG.TILE_SIZE;
    
    overlay.style.display = 'block';
    overlay.style.left = (centerX - rangePx) + 'px';
    overlay.style.top = (centerY - rangePx) + 'px';
    overlay.style.width = (rangePx * 2) + 'px';
    overlay.style.height = (rangePx * 2) + 'px';
    overlay.style.border = `2px dashed ${towerType.color.replace(')', ',0.7)').replace('rgb', 'rgba')}`;
    overlay.style.background = towerType.color.replace(')', ',0.2)').replace('rgb', 'rgba');
}

function hideTowerRange() {
    const overlay = document.getElementById('gameRangeOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ============================================
// JUEGO - SISTEMA UPDATE/RENDER CON CÁMARA
// ============================================
function testMap() {
    const requirements = hasMapRequirements();
    
    if(!requirements.all) {
        let errorMsg = '❌ Faltan requisitos:';
        if(!requirements.hasPath) errorMsg += ' camino,';
        if(!requirements.hasSpawn) errorMsg += ' spawn,';
        if(!requirements.hasBase) errorMsg += ' base';
        logEvent(errorMsg.slice(0, -1), 'error');
        audio.playError();
        return;
    }
    
    const isValid = validateMapConnectivity();
    if(!isValid) {
        logEvent('❌ Error: No hay camino válido desde el spawn a la base', 'error');
        audio.playError();
        return;
    }
    
    const editor = document.getElementById('editor');
    const gameMode = document.getElementById('gameMode');
    
    if (editor) editor.style.display = 'none';
    if (gameMode) gameMode.style.display = 'block';
    
    setupGame();
    
    logEvent('🎮 Modo juego iniciado', 'success');
    audio.playSuccess();
    
    functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onGameStart);
}

function setupGame() {
    state.game.testing = true;
    state.game.speed = 1;
    state.game.life = 100;
    state.game.gold = 200;
    state.game.wave = 1;
    state.game.paused = false;
    state.game.waveActive = false;
    state.game.enemiesSpawned = 0;
    state.game.enemiesToSpawn = 0;
    state.game.placingTower = null;
    state.game.towers = [];
    state.game.enemies = [];
    state.game.bullets = [];
    state.game.path = [];
    state.game.spawn = null;
    state.game.base = null;
    state.game.waveTimers = [];
    state.game.nextEnemyId = 1;
    state.game.score = 0;
    state.game.baseBeingAttacked = false;
    state.game.baseAttackTimer = 0;
    state.game.functionTimers = [];
    state.game.lastUpdateTime = 0;
    state.game.updateAccumulator = 0;
    
    // NUEVO: Resetear cámara del juego
    window.GameCamera.reset();
    
    animationSystem.clear();
    hideGamePlacementOverlay();
    hideGameRangeOverlay();
    
    state.project.entities.forEach(entity => {
        switch(entity.type) {
            case 'path':
                state.game.path.push({ x: entity.x, y: entity.y });
                break;
                
            case 'spawn':
                if(entity.player === 1) {
                    state.game.spawn = { 
                        x: entity.x, 
                        y: entity.y,
                        centerX: entity.x + 0.5,
                        centerY: entity.y + 0.5
                    };
                }
                break;
                
            case 'base':
                if(entity.player === 1) {
                    state.game.base = {
                        x: entity.x,
                        y: entity.y,
                        width: entity.width,
                        height: entity.height,
                        centerX: entity.x + entity.width/2,
                        centerY: entity.y + entity.height/2,
                        entryX: entity.x + Math.floor(entity.width/2),
                        entryY: entity.y + Math.floor(entity.height/2)
                    };
                }
                break;
                
            case 'tower':
                if(entity.player === 1) {
                    const towerType = CONFIG.TOWER_TYPES[entity.subtype];
                    if(towerType) {
                        state.game.towers.push({
                            id: entity.id,
                            x: entity.x,
                            y: entity.y,
                            type: entity.subtype,
                            damage: towerType.damage,
                            range: towerType.range,
                            cooldown: 0,
                            maxCooldown: towerType.cooldown,
                            color: towerType.color,
                            icon: towerType.icon
                        });
                    }
                }
                break;
        }
    });
    
    if(state.game.path.length > 0 && state.game.spawn && state.game.base) {
        state.game.path = getCachedPath();
        
        if(state.game.path.length > 0) {
            const lastPoint = state.game.path[state.game.path.length - 1];
            if(!(lastPoint.x >= state.game.base.x && lastPoint.x < state.game.base.x + state.game.base.width &&
                 lastPoint.y >= state.game.base.y && lastPoint.y < state.game.base.y + state.game.base.height)) {
                state.game.path.push({
                    x: state.game.base.entryX,
                    y: state.game.base.entryY
                });
            }
        }
    }
    
    resizeGameCanvas();
    updateGameUI();
    updateWaveInfo();
    
    const gameTitle = document.getElementById('gameTitle');
    if (gameTitle) gameTitle.textContent = state.project.name;
    
    const waveStatus = document.getElementById('waveStatus');
    if (waveStatus) {
        waveStatus.textContent = 'Próxima';
        waveStatus.style.color = '#48bb78';
    }
    
    updateEnemyCount();
    
    setupGameCanvasEvents();
    // NUEVO: Configurar eventos de cámara
    setupGameCameraEvents();
    
    const toggleRangeBtn = document.getElementById('toggleRangeBtn');
    if (toggleRangeBtn) {
        toggleRangeBtn.textContent = state.settings.showRange ? '📐 Ocultar Rangos' : '📐 Mostrar Rangos';
    }
    
    // NUEVO: Mostrar controles de cámara
    showGameMessage("🎮 Controles:\n• Clic derecho + arrastrar: Mover cámara\n• Rueda: Zoom\n• R: Resetear cámara\n• M: Alternar minimapa");
}

function resizeGameCanvas() {
    const canvas = state.canvas.game;
    const container = document.querySelector('.game-area');
    
    if (!canvas || !container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function setupGameCanvasEvents() {
    const canvas = state.canvas.game;
    if (!canvas) return;
    
    canvas.addEventListener('click', handleGameClick);
    canvas.addEventListener('mousemove', handleGameMouseMove);
    canvas.addEventListener('mouseleave', () => {
        state.game.placingTower = null;
        hideGamePlacementOverlay();
        hideGameRangeOverlay();
    });
}

function handleGameClick(e) {
    if (!state.game.testing) return;
    
    const rect = state.canvas.game.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Ajustar por cámara
    const worldX = (x - window.GameCamera.offsetX) / window.GameCamera.zoom;
    const worldY = (y - window.GameCamera.offsetY) / window.GameCamera.zoom;
    
    const tileX = Math.floor(worldX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldY / CONFIG.TILE_SIZE);
    
    if (state.game.placingTower) {
        if (isPositionValid(tileX, tileY)) {
            const towerType = CONFIG.TOWER_TYPES[state.game.placingTower];
            if (towerType && state.game.gold >= towerType.cost) {
                state.game.gold -= towerType.cost;
                state.game.towers.push({
                    id: Date.now(),
                    x: tileX,
                    y: tileY,
                    type: state.game.placingTower,
                    damage: towerType.damage,
                    range: towerType.range,
                    cooldown: 0,
                    maxCooldown: towerType.cooldown,
                    color: towerType.color,
                    icon: towerType.icon
                });
                
                functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onTowerPlace, {
                    towerType: state.game.placingTower,
                    x: tileX,
                    y: tileY
                });
                
                state.game.placingTower = null;
                hideGamePlacementOverlay();
                updateGameUI();
                audio.playPlace();
            }
        }
    }
}

function handleGameMouseMove(e) {
    if (!state.game.testing) return;
    
    const rect = state.canvas.game.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Ajustar por cámara
    const worldX = (x - window.GameCamera.offsetX) / window.GameCamera.zoom;
    const worldY = (y - window.GameCamera.offsetY) / window.GameCamera.zoom;
    
    const tileX = Math.floor(worldX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldY / CONFIG.TILE_SIZE);
    
    if (state.game.placingTower) {
        updateGamePlacementOverlay(tileX, tileY);
        
        const towerType = CONFIG.TOWER_TYPES[state.game.placingTower];
        if (towerType) {
            showGameRangeOverlay(tileX, tileY, towerType.range);
        }
    } else {
        hideGamePlacementOverlay();
        hideGameRangeOverlay();
    }
}

function updateGamePlacementOverlay(x, y) {
    const overlay = document.getElementById('gamePlacementOverlay');
    if (!overlay) return;
    
    const isValid = isPositionValid(x, y);
    const towerType = CONFIG.TOWER_TYPES[state.game.placingTower];
    
    // Convertir a coordenadas de pantalla
    const screenX = x * CONFIG.TILE_SIZE * window.GameCamera.zoom + window.GameCamera.offsetX;
    const screenY = y * CONFIG.TILE_SIZE * window.GameCamera.zoom + window.GameCamera.offsetY;
    const size = CONFIG.TILE_SIZE * window.GameCamera.zoom;
    
    overlay.style.display = 'block';
    overlay.style.left = screenX + 'px';
    overlay.style.top = screenY + 'px';
    overlay.style.width = size + 'px';
    overlay.style.height = size + 'px';
    overlay.className = `placement-overlay ${isValid ? 'placement-valid' : 'placement-invalid'}`;
    
    overlay.innerHTML = `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${24 * window.GameCamera.zoom}px">
            ${towerType?.icon || '?'}
        </div>
    `;
}

function hideGamePlacementOverlay() {
    const overlay = document.getElementById('gamePlacementOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showGameRangeOverlay(x, y, range) {
    const overlay = document.getElementById('gameRangeOverlay');
    if (!overlay) return;
    
    const rangePx = range * CONFIG.TILE_SIZE * window.GameCamera.zoom;
    const centerX = x * CONFIG.TILE_SIZE * window.GameCamera.zoom + 
                    CONFIG.TILE_SIZE/2 * window.GameCamera.zoom + 
                    window.GameCamera.offsetX;
    const centerY = y * CONFIG.TILE_SIZE * window.GameCamera.zoom + 
                    CONFIG.TILE_SIZE/2 * window.GameCamera.zoom + 
                    window.GameCamera.offsetY;
    
    overlay.style.display = 'block';
    overlay.style.left = (centerX - rangePx) + 'px';
    overlay.style.top = (centerY - rangePx) + 'px';
    overlay.style.width = (rangePx * 2) + 'px';
    overlay.style.height = (rangePx * 2) + 'px';
    overlay.style.border = '2px dashed rgba(66,153,225,0.7)';
    overlay.style.background = 'rgba(66,153,225,0.2)';
}

function hideGameRangeOverlay() {
    const overlay = document.getElementById('gameRangeOverlay');
    if (overlay) overlay.style.display = 'none';
}

function buyTower(type) {
    if (!state.game.testing) return;
    
    const towerType = CONFIG.TOWER_TYPES[type];
    if (!towerType) return;
    
    if (state.game.gold >= towerType.cost) {
        state.game.placingTower = type;
        audio.playSelect();
    } else {
        audio.playError();
        showGameMessage('¡No tienes suficiente oro!');
    }
}

// ============================================
// RENDERIZADO DEL JUEGO CON CÁMARA
// ============================================
function renderGame() {
    const ctx = state.canvas.gameCtx;
    const canvas = state.canvas.game;
    
    if (!ctx || !canvas) return;
    
    const startTime = performance.now();
    
    // Limpiar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar transformaciones de cámara
    ctx.save();
    ctx.translate(window.GameCamera.offsetX, window.GameCamera.offsetY);
    ctx.scale(window.GameCamera.zoom, window.GameCamera.zoom);
    
    // Dibujar elementos del juego
    drawGameGrid(ctx);
    drawGamePath(ctx);
    drawGameTowers(ctx);
    drawGameEnemies(ctx);
    drawGameBullets(ctx);
    drawGameBase(ctx);
    animationSystem.render(ctx);
    
    if (state.settings.showRange) {
        drawGameTowerRanges(ctx);
    }
    
    ctx.restore();
    
    state.performance.updateTime = performance.now() - startTime;
}

function drawGameGrid(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= state.project.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, state.project.height * tileSize);
        ctx.stroke();
    }
    
    for (let y = 0; y <= state.project.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(state.project.width * tileSize, y * tileSize);
        ctx.stroke();
    }
}

function drawGamePath(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    state.game.path.forEach(point => {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(point.x * tileSize, point.y * tileSize, tileSize, tileSize);
        
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛣️', point.x * tileSize + tileSize/2, point.y * tileSize + tileSize/2);
    });
    
    if (state.settings.pathNumbers) {
        state.game.path.forEach((point, index) => {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                (index + 1).toString(),
                point.x * tileSize + tileSize/2,
                point.y * tileSize + tileSize/2
            );
        });
    }
}

function drawGameTowers(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    state.game.towers.forEach(tower => {
        ctx.fillStyle = tower.color;
        ctx.fillRect(tower.x * tileSize, tower.y * tileSize, tileSize, tileSize);
        
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tower.icon, tower.x * tileSize + tileSize/2, tower.y * tileSize + tileSize/2);
    });
}

function drawGameEnemies(ctx) {
    const tileSize = CONFIG.TILE_SIZE;
    
    state.game.enemies.forEach(enemy => {
        const enemyType = CONFIG.ENEMY_TYPES[enemy.type];
        ctx.fillStyle = enemyType.color;
        ctx.fillRect(
            (enemy.x - 0.5) * tileSize + tileSize * 0.1,
            (enemy.y - 0.5) * tileSize + tileSize * 0.1,
            tileSize * 0.8,
            tileSize * 0.8
        );
        
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            enemyType.icon,
            enemy.x * tileSize,
            enemy.y * tileSize
        );
        
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(
            (enemy.x - 0.5) * tileSize,
            (enemy.y - 0.5) * tileSize - 5,
            tileSize * healthPercent,
            3
        );
    });
}

function drawGameBullets(ctx) {
    state.game.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawGameBase(ctx) {
    if (!state.game.base) return;
    
    const tileSize = CONFIG.TILE_SIZE;
    
    ctx.fillStyle = '#e53e3e';
    ctx.fillRect(
        state.game.base.x * tileSize,
        state.game.base.y * tileSize,
        state.game.base.width * tileSize,
        state.game.base.height * tileSize
    );
    
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰',
        state.game.base.x * tileSize + (state.game.base.width * tileSize) / 2,
        state.game.base.y * tileSize + (state.game.base.height * tileSize) / 2
    );
}

function drawGameTowerRanges(ctx) {
    if (state.settings.performanceMode) return;
    
    const tileSize = CONFIG.TILE_SIZE;
    
    state.game.towers.forEach(tower => {
        const centerX = tower.x * tileSize + tileSize/2;
        const centerY = tower.y * tileSize + tileSize/2;
        const range = tower.range * tileSize;
        
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = tower.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// ============================================
// SISTEMA DE OLEADAS
// ============================================
function getCurrentWaveData() {
    let waveData;
    
    if (state.project.customWaves.length > 0) {
        const waveIndex = (state.game.wave - 1) % state.project.customWaves.length;
        waveData = state.project.customWaves[waveIndex];
    } else {
        const waveIndex = Math.min(state.game.wave - 1, CONFIG.WAVE_CONFIG.predefined.length - 1);
        if (waveIndex >= 0) {
            waveData = CONFIG.WAVE_CONFIG.predefined[waveIndex];
        }
    }
    
    if (!waveData) {
        waveData = {
            fast: Math.min(100, 5 + state.game.wave * 2),
            tank: Math.min(50, Math.floor(state.game.wave / 2)),
            boss: Math.max(0, Math.floor((state.game.wave - 4) / 3)),
            rewardMult: 1.0 + (state.game.wave * 0.05),
            name: `Oleada ${state.game.wave}`
        };
    }
    
    return waveData;
}

function startWave() {
    if (!state.game.testing) {
        audio.playError();
        showGameMessage("¡No estás en modo prueba!");
        return;
    }
    
    if (state.game.waveActive) {
        audio.playError();
        showGameMessage("¡Ya hay una oleada en progreso!");
        return;
    }
    
    if (!state.game.spawn || !state.game.base || state.game.path.length === 0) {
        audio.playError();
        showGameMessage("¡Error: Mapa incompleto!");
        return;
    }
    
    state.game.waveActive = true;
    state.game.enemiesSpawned = 0;
    
    let waveData = getCurrentWaveData();
    if (!waveData) {
        audio.playError();
        showGameMessage("¡Error: No hay datos para esta oleada!");
        state.game.waveActive = false;
        return;
    }
    
    state.game.enemiesToSpawn = (waveData.fast || 0) + (waveData.tank || 0) + (waveData.boss || 0);
    
    const startWaveBtn = document.getElementById('startWaveBtn');
    if (startWaveBtn) {
        startWaveBtn.disabled = true;
        startWaveBtn.textContent = `⏳ Oleada ${state.game.wave}`;
        startWaveBtn.style.opacity = '0.7';
    }
    
    functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onWaveStart, {
        wave: state.game.wave,
        fast: waveData.fast,
        tank: waveData.tank,
        boss: waveData.boss
    });
    
    let spawnCounter = 0;
    
    const spawnEnemy = (type, delay) => {
        setTimeout(() => {
            if (state.game.testing && state.game.spawn && state.game.waveActive) {
                const enemyType = CONFIG.ENEMY_TYPES[type];
                const enemy = {
                    id: state.game.nextEnemyId++,
                    x: state.game.spawn.centerX,
                    y: state.game.spawn.centerY,
                    type: type,
                    health: enemyType.health,
                    maxHealth: enemyType.health,
                    speed: enemyType.speed,
                    reward: enemyType.reward,
                    baseDamage: enemyType.baseDamage,
                    pathIndex: 0,
                    reachedBase: false,
                    reachedBaseProcessed: false
                };
                
                state.game.enemies.push(enemy);
                state.game.enemiesSpawned++;
                spawnCounter++;
                
                updateEnemyCount();
            }
        }, delay);
    };
    
    for (let i = 0; i < (waveData.fast || 0); i++) {
        spawnEnemy('fast', i * CONFIG.ENEMY_TYPES.fast.waitTime);
    }
    
    for (let i = 0; i < (waveData.tank || 0); i++) {
        spawnEnemy('tank', (waveData.fast || 0) * CONFIG.ENEMY_TYPES.fast.waitTime + i * CONFIG.ENEMY_TYPES.tank.waitTime);
    }
    
    for (let i = 0; i < (waveData.boss || 0); i++) {
        spawnEnemy('boss', 
            (waveData.fast || 0) * CONFIG.ENEMY_TYPES.fast.waitTime + 
            (waveData.tank || 0) * CONFIG.ENEMY_TYPES.tank.waitTime + 
            i * CONFIG.ENEMY_TYPES.boss.waitTime
        );
    }
    
    const waveStatus = document.getElementById('waveStatus');
    if (waveStatus) {
        waveStatus.textContent = 'En progreso';
        waveStatus.style.color = '#ed8936';
    }
    
    audio.playWaveStart();
    showGameMessage(`¡Oleada ${state.game.wave} iniciada!`);
}

function checkWaveComplete() {
    const allEnemiesSpawned = state.game.enemiesSpawned >= state.game.enemiesToSpawn;
    const noEnemiesAlive = state.game.enemies.length === 0;
    
    if (state.game.waveActive && noEnemiesAlive && allEnemiesSpawned) {
        const waveData = getCurrentWaveData();
        const fastReward = (waveData.fast || 0) * 15;
        const tankReward = (waveData.tank || 0) * 40;
        const bossReward = (waveData.boss || 0) * 100;
        const totalReward = Math.round((fastReward + tankReward + bossReward) * (waveData.rewardMult || 1.0));
        
        state.game.gold += totalReward;
        state.game.score += totalReward;
        
        state.game.waveActive = false;
        state.game.wave++;
        
        const startWaveBtn = document.getElementById('startWaveBtn');
        if (startWaveBtn) {
            startWaveBtn.disabled = false;
            startWaveBtn.textContent = '▶️ Iniciar Oleada';
            startWaveBtn.style.opacity = '1';
        }
        
        functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onWaveEnd, {
            wave: state.game.wave - 1,
            nextWave: state.game.wave,
            reward: totalReward
        });
        
        updateWaveInfo();
        updateGameUI();
        
        const waveStatus = document.getElementById('waveStatus');
        if (waveStatus) {
            waveStatus.textContent = 'Próxima';
            waveStatus.style.color = '#48bb78';
        }
        
        showGameMessage(`¡Oleada ${state.game.wave - 1} completada! +$${totalReward}`);
        audio.playSuccess();
        
        if (state.game.base) {
            animationSystem.addCoinEffect(state.game.base.centerX, state.game.base.centerY, totalReward);
        }
        
        return true;
    }
    
    return false;
}

function togglePause() {
    state.game.paused = !state.game.paused;
    const btn = document.getElementById('pauseBtn');
    if (btn) {
        btn.textContent = state.game.paused ? '▶️ Reanudar' : '⏸️ Pausa';
    }
    audio.playClick();
}

function toggleFastForward() {
    state.game.speed = state.game.speed === 1 ? 2 : 1;
    const btn = document.getElementById('fastForwardBtn');
    if (btn) {
        btn.textContent = state.game.speed === 2 ? '⏩ 2x' : '⏩ 1x';
    }
    audio.playClick();
}

function updateGame(delta) {
    animationSystem.update();
    
    if (state.game.waveActive && state.game.enemies.length === 0 && state.game.enemiesSpawned >= state.game.enemiesToSpawn) {
        checkWaveComplete();
    }
    
    updateTowers(delta);
    updateEnemies(delta);
    updateBullets(delta);
    
    if (state.game.baseBeingAttacked) {
        state.game.baseAttackTimer -= delta * 1000;
        if (state.game.baseAttackTimer <= 0) {
            state.game.baseBeingAttacked = false;
            const indicator = document.getElementById('baseAttackIndicator');
            if (indicator) indicator.style.display = 'none';
        }
    }
    
    functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onWaveTick, {
        wave: state.game.wave,
        time: Date.now()
    });
}

function updateTowers(delta) {
    state.game.towers.forEach(tower => {
        if (tower.cooldown > 0) {
            tower.cooldown -= delta * 60;
        } else {
            const target = findTargetForTower(tower);
            if (target) {
                shootAtTarget(tower, target);
                tower.cooldown = tower.maxCooldown;
            }
        }
    });
}

function findTargetForTower(tower) {
    let nearestEnemy = null;
    let nearestDist = Infinity;
    const rangePx = tower.range * CONFIG.TILE_SIZE;
    
    state.game.enemies.forEach(enemy => {
        if (enemy.reachedBase) return;
        
        const enemyX = enemy.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
        const enemyY = enemy.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
        const towerX = tower.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
        const towerY = tower.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
        
        const dx = enemyX - towerX;
        const dy = enemyY - towerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist <= rangePx && dist < nearestDist) {
            nearestEnemy = enemy;
            nearestDist = dist;
        }
    });
    
    return nearestEnemy;
}

function shootAtTarget(tower, target) {
    const bullet = {
        x: tower.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
        y: tower.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
        targetX: target.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
        targetY: target.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2,
        damage: tower.damage,
        speed: 10,
        color: tower.color
    };
    
    state.game.bullets.push(bullet);
    audio.playShoot();
}

function updateEnemies(delta) {
    for (let i = state.game.enemies.length - 1; i >= 0; i--) {
        const enemy = state.game.enemies[i];
        
        if (enemy.reachedBase) {
            continue;
        }
        
        if (enemy.pathIndex < state.game.path.length) {
            const targetPoint = state.game.path[enemy.pathIndex];
            const targetX = targetPoint.x + 0.5;
            const targetY = targetPoint.y + 0.5;
            
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 0.1) {
                enemy.pathIndex++;
                
                if (enemy.pathIndex >= state.game.path.length) {
                    enemy.reachedBase = true;
                    attackBase(enemy);
                    continue;
                }
            } else {
                enemy.x += (dx / dist) * enemy.speed * delta;
                enemy.y += (dy / dist) * enemy.speed * delta;
            }
        } else {
            enemy.reachedBase = true;
            attackBase(enemy);
        }
    }
}

function attackBase(enemy) {
    if (!state.game.base || enemy.reachedBaseProcessed) return;
    
    enemy.reachedBaseProcessed = true;
    
    const enemyType = CONFIG.ENEMY_TYPES[enemy.type];
    state.game.life -= enemyType.baseDamage;
    
    functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onBaseDamaged, {
        damage: enemyType.baseDamage,
        enemyType: enemy.type,
        remainingLife: state.game.life
    });
    
    state.game.baseBeingAttacked = true;
    state.game.baseAttackTimer = 2000;
    
    const indicator = document.getElementById('baseAttackIndicator');
    if (indicator) indicator.style.display = 'block';
    
    animationSystem.addBaseHitEffect(
        state.game.base.centerX,
        state.game.base.centerY,
        enemyType.baseDamage
    );
    
    audio.playBaseHit();
    
    const index = state.game.enemies.indexOf(enemy);
    if (index !== -1) {
        state.game.enemies.splice(index, 1);
        updateEnemyCount();
        updateGameUI();
    }
    
    if (state.game.life <= 0) {
        gameOver();
    }
}

function updateBullets(delta) {
    for (let i = state.game.bullets.length - 1; i >= 0; i--) {
        const bullet = state.game.bullets[i];
        
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < bullet.speed) {
            bullet.x = bullet.targetX;
            bullet.y = bullet.targetY;
            
            let hitEnemy = false;
            for (let j = state.game.enemies.length - 1; j >= 0; j--) {
                const enemy = state.game.enemies[j];
                if (enemy.reachedBase) continue;
                
                const enemyX = enemy.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
                const enemyY = enemy.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2;
                const bulletDist = Math.sqrt(
                    Math.pow(enemyX - bullet.x, 2) + Math.pow(enemyY - bullet.y, 2)
                );
                
                if (bulletDist < 20) {
                    enemy.health -= bullet.damage;
                    animationSystem.addHitEffect(enemy.x, enemy.y, bullet.damage, bullet.color);
                    audio.playHit();
                    hitEnemy = true;
                    
                    if (enemy.health <= 0) {
                        const enemyType = CONFIG.ENEMY_TYPES[enemy.type];
                        state.game.gold += enemyType.reward;
                        state.game.score += enemyType.reward;
                        
                        functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onEnemyKilled, {
                            enemyType: enemy.type,
                            reward: enemyType.reward,
                            gold: state.game.gold
                        });
                        
                        animationSystem.addCoinEffect(enemy.x, enemy.y, enemyType.reward);
                        audio.playCoin();
                        
                        state.game.enemies.splice(j, 1);
                        updateEnemyCount();
                        updateGameUI();
                    }
                    break;
                }
            }
            
            state.game.bullets.splice(i, 1);
        } else {
            bullet.x += (dx / dist) * bullet.speed;
            bullet.y += (dy / dist) * bullet.speed;
        }
    }
}

function gameOver() {
    state.game.testing = false;
    
    functionSystem.triggerEvent(FUNCTION_SYSTEM.EVENTS.onGameOver, {
        wave: state.game.wave,
        score: state.game.score,
        gold: state.game.gold
    });
    
    functionSystem.clearAllTimers();
    
    alert(`¡Juego Terminado!\nOleada alcanzada: ${state.game.wave}\nPuntuación: ${state.game.score}`);
    backToEditor();
}

function updateGameUI() {
    const lifeEl = document.getElementById('gameLife');
    const goldEl = document.getElementById('gameGold');
    const waveEl = document.getElementById('gameWave');
    
    if (lifeEl) lifeEl.textContent = Math.max(0, Math.round(state.game.life));
    if (goldEl) goldEl.textContent = state.game.gold;
    if (waveEl) waveEl.textContent = state.game.wave;
}

function updateWaveInfo() {
    let waveData = getCurrentWaveData();
    
    if (!waveData) {
        waveData = { fast: 5 + state.game.wave * 2, tank: Math.floor(state.game.wave / 2), boss: 0, rewardMult: 1.0 };
    }
    
    const waveFastEl = document.getElementById('waveFast');
    const waveTankEl = document.getElementById('waveTank');
    const waveBossEl = document.getElementById('waveBoss');
    const waveBonusEl = document.getElementById('waveBonus');
    const currentWaveNumEl = document.getElementById('currentWaveNum');
    const estimatedRewardEl = document.getElementById('estimatedReward');
    
    if (waveFastEl) waveFastEl.textContent = waveData.fast || 0;
    if (waveTankEl) waveTankEl.textContent = waveData.tank || 0;
    if (waveBossEl) waveBossEl.textContent = waveData.boss || 0;
    if (waveBonusEl) waveBonusEl.textContent = waveData.rewardMult ? waveData.rewardMult.toFixed(1) + 'x' : '1.0x';
    if (currentWaveNumEl) currentWaveNumEl.textContent = state.game.wave;
    
    if (estimatedRewardEl) {
        const fastReward = (waveData.fast || 0) * 15;
        const tankReward = (waveData.tank || 0) * 40;
        const bossReward = (waveData.boss || 0) * 100;
        const totalReward = Math.round((fastReward + tankReward + bossReward) * (waveData.rewardMult || 1.0));
        estimatedRewardEl.textContent = `$${totalReward}`;
    }
}

function updateEnemyCount() {
    const enemiesEl = document.getElementById('gameEnemies');
    if (enemiesEl) {
        enemiesEl.textContent = `${state.game.enemies.length}/${state.game.enemiesToSpawn}`;
    }
}

function showGameMessage(text) {
    const animationOverlay = document.getElementById('animationsOverlay');
    if (animationOverlay) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            border: 2px solid #4299e1;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 400;
            animation: fadeInOut 2s forwards;
        `;
        message.textContent = text;
        animationOverlay.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 2000);
    }
}

// ============================================
// FUNCIONES DEL EDITOR
// ============================================
function backToEditor() {
    const editor = document.getElementById('editor');
    const gameMode = document.getElementById('gameMode');
    
    if (editor) editor.style.display = 'grid';
    if (gameMode) gameMode.style.display = 'none';
    
    state.game.testing = false;
    functionSystem.clearAllTimers();
    
    resizeCanvas();
    state.ui.needsRender = true;
    logEvent('← Regresado al editor', 'info');
    audio.playSelect();
}

function menuNew() {
    const modal = document.getElementById('newMapModal');
    if (modal) modal.style.display = 'flex';
    audio.playClick();
}

function createNewMap() {
    const name = document.getElementById('mapNameInput').value.trim() || 'Nuevo Mapa';
    const width = parseInt(document.getElementById('mapWidthInput').value) || 64;
    const height = parseInt(document.getElementById('mapHeightInput').value) || 64;
    
    state.project = {
        name: name,
        width: Math.max(32, Math.min(128, width)),
        height: Math.max(32, Math.min(128, height)),
        entities: [],
        customWaves: [],
        customFunctions: [],
        version: '3.6',
        pathDirty: true,
        cachedPath: []
    };
    
    state.ui.tool = 'select';
    state.ui.offsetX = 0;
    state.ui.offsetY = 0;
    state.ui.zoom = 1;
    state.ui.selected = null;
    
    closeModal();
    resizeCanvas();
    state.ui.needsRender = true;
    updateUI();
    
    logEvent(`🗺️ Nuevo mapa creado: ${name} (${width}×${height})`, 'success');
    audio.playSuccess();
}

function createDefaultMap() {
    state.project = {
        name: 'Nuevo Mapa',
        width: 64,
        height: 64,
        entities: [],
        customWaves: [],
        customFunctions: [],
        version: '3.6',
        pathDirty: true,
        cachedPath: []
    };
    
    for (let i = 5; i < 15; i++) {
        addEntity('path', i, 10);
    }
    for (let i = 10; i < 20; i++) {
        addEntity('path', 14, i);
    }
    
    addEntity('spawn', 5, 10, 1);
    addEntity('base', 14, 19, 1, 2, 2);
    
    saveStateToHistory('Mapa inicial creado');
}

function saveProject() {
    try {
        const projectData = {
            project: JSON.parse(JSON.stringify(state.project)),
            version: '3.6',
            timestamp: Date.now()
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${state.project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_td_project.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        logEvent('💾 Proyecto guardado', 'success');
        audio.playSuccess();
    } catch(error) {
        logEvent('❌ Error al guardar proyecto', 'error');
        audio.playError();
    }
}

function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.project) {
                    state.project = data.project;
                    state.project.customFunctions = state.project.customFunctions || [];
                    state.project.customWaves = state.project.customWaves || [];
                    state.project.pathDirty = true;
                    state.project.cachedPath = [];
                    
                    state.functionSystem.customFunctions = state.project.customFunctions || [];
                    functionSystem.organizeFunctionsByEvent();
                    
                    state.ui.tool = 'select';
                    state.ui.offsetX = 0;
                    state.ui.offsetY = 0;
                    state.ui.zoom = 1;
                    state.ui.selected = null;
                    
                    resizeCanvas();
                    state.ui.needsRender = true;
                    updateUI();
                    updateFunctionList();
                    updateSavedWavesList();
                    
                    logEvent(`📂 Proyecto cargado: ${state.project.name}`, 'success');
                    audio.playSuccess();
                } else {
                    throw new Error('Formato de archivo inválido');
                }
            } catch(error) {
                logEvent('❌ Error al cargar proyecto: ' + error.message, 'error');
                audio.playError();
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function updateUI() {
    const entityCountEl = document.getElementById('entityCount');
    const unitCountEl = document.getElementById('unitCount');
    const functionCountEl = document.getElementById('functionCount');
    const functionCount2El = document.getElementById('functionCount2');
    
    if (entityCountEl) entityCountEl.textContent = state.project.entities.length;
    if (unitCountEl) unitCountEl.textContent = state.project.entities.length;
    if (functionCountEl) functionCountEl.textContent = state.functionSystem.customFunctions.length;
    if (functionCount2El) functionCount2El.textContent = state.functionSystem.customFunctions.length;
    
    const mapNameEl = document.getElementById('mapName');
    const mapSizeEl = document.getElementById('mapSize');
    
    if (mapNameEl) mapNameEl.textContent = state.project.name;
    if (mapSizeEl) mapSizeEl.textContent = `${state.project.width}×${state.project.height}`;
    
    const currentToolEl = document.getElementById('currentTool');
    if (currentToolEl) currentToolEl.textContent = getToolName(state.ui.tool);
    
    const currentPlayerEl = document.getElementById('currentPlayer');
    if (currentPlayerEl) currentPlayerEl.textContent = state.ui.player;
    
    const editorStateEl = document.getElementById('editorState');
    if (editorStateEl) editorStateEl.textContent = state.game.testing ? 'Probando' : 'Listo';
    
    document.querySelectorAll('.tool-button').forEach(btn => {
        const action = btn.getAttribute('data-action');
        const arg = btn.getAttribute('data-arg');
        
        if (action === 'setTool' && arg === state.ui.tool) {
            btn.classList.add('active');
        } else if (action === 'placeTower' && state.ui.tool === 'place_tower' && state.ui.placingType === arg) {
            btn.classList.add('active');
        } else if (action === 'placeEnemy' && state.ui.tool === 'place_enemy' && state.ui.placingType === arg) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const zoomLevelEl = document.getElementById('zoomLevel');
    if (zoomLevelEl) zoomLevelEl.textContent = state.ui.zoom.toFixed(2) + 'x';
    
    const rangeVisibleEl = document.getElementById('rangeVisible');
    if (rangeVisibleEl) rangeVisibleEl.textContent = state.settings.showRange ? 'Sí' : 'No';
}

function logEvent(message, type = 'info') {
    const eventsList = document.getElementById('eventsList');
    const eventCount = document.getElementById('eventCount');
    
    if (!eventsList) return;
    
    const eventItem = document.createElement('div');
    eventItem.className = `event-item ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    eventItem.innerHTML = `<span style="color:#aaa;font-size:9px">[${timestamp}]</span> ${message}`;
    
    eventsList.appendChild(eventItem);
    
    while (eventsList.children.length > 50) {
        eventsList.removeChild(eventsList.firstChild);
    }
    
    eventsList.scrollTop = eventsList.scrollHeight;
    
    if (eventCount) {
        const count = eventsList.children.length;
        eventCount.textContent = count;
    }
}

function clearEvents() {
    const eventsList = document.getElementById('eventsList');
    if (eventsList) {
        eventsList.innerHTML = '';
        const eventCount = document.getElementById('eventCount');
        if (eventCount) eventCount.textContent = '0';
        audio.playDelete();
    }
}

function toggleAudio() {
    const enabled = audio.toggle();
    logEvent(`Audio ${enabled ? 'activado' : 'desactivado'}`, 'info');
}

function setGameSpeed(speed, element) {
    if (!state.game.testing) return;
    
    state.game.speed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#2a2a2a';
        btn.style.borderColor = '#333';
        btn.style.color = '#ccc';
    });
    
    if (element) {
        element.classList.add('active');
        element.style.background = '#2c5282';
        element.style.borderColor = '#4299e1';
        element.style.color = '#fff';
    }
    
    logEvent(`Velocidad del juego: ${speed}x`, 'info');
    audio.playClick();
}

function togglePerformance() {
    state.settings.performanceMode = !state.settings.performanceMode;
    logEvent(`Modo rendimiento: ${state.settings.performanceMode ? 'ON' : 'OFF'}`, 'info');
    state.ui.needsRender = true;
    audio.playClick();
}

function closeModal() {
    document.querySelectorAll('.sc-modal').forEach(m => {
        m.style.display = 'none';
    });
}

// ============================================
// MANEJO DE TECLADO
// ============================================
function handleKeyDown(e) {
    if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
    }
    
    switch(e.key) {
        case '1':
            setTool('select');
            break;
        case '2':
            setTool('path');
            break;
        case '3':
            setTool('spawn');
            break;
        case '4':
            setTool('base');
            break;
        case '5':
            setTool('erase');
            break;
        case 'F5':
            if (!e.ctrlKey && !e.altKey) {
                e.preventDefault();
                testMap();
            }
            break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                saveProject();
            }
            break;
        case 'o':
            if (e.ctrlKey) {
                e.preventDefault();
                loadProject();
            }
            break;
        case 'n':
            if (e.ctrlKey) {
                e.preventDefault();
                menuNew();
            }
            break;
        case 'z':
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            break;
        case 'y':
            if (e.ctrlKey) {
                e.preventDefault();
                redo();
            }
            break;
        case 'r':
            if (!e.ctrlKey) {
                // 'R' ya está manejado por handleCameraKeys
                break;
            }
            break;
        case 'm':
        case 'M':
            // 'M' ya está manejado por handleCameraKeys
            break;
        case 'Escape':
            if (state.ui.placingType) {
                state.ui.tool = 'select';
                state.ui.placingType = null;
                hidePlacementOverlay();
                hideTowerRangePreview();
                updateUI();
                audio.playClick();
            }
            break;
    }
}

// ============================================
// FUNCIONES GLOBALES PARA HTML
// ============================================
window.loadTemplate = function(template) {
    switch(template) {
        case 'simple':
            document.getElementById('mapWidthInput').value = 64;
            document.getElementById('mapHeightInput').value = 48;
            break;
        case 'maze':
            document.getElementById('mapWidthInput').value = 80;
            document.getElementById('mapHeightInput').value = 80;
            break;
        case 'islands':
            document.getElementById('mapWidthInput').value = 96;
            document.getElementById('mapHeightInput').value = 64;
            break;
    }
    if (typeof audio !== 'undefined' && audio.playClick) {
        audio.playClick();
    }
};

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño retraso para asegurar que todo esté listo
    setTimeout(init, 100);
});

// ============================================
// HACER FUNCIONES DISPONIBLES GLOBALMENTE
// ============================================
window.setTool = setTool;
window.selectPlayer = selectPlayer;
window.placeTower = placeTower;
window.placeEnemy = placeEnemy;
window.toggleRangeDisplay = toggleRangeDisplay;
window.toggleGameRange = toggleGameRange;
window.openFunctionEditor = openFunctionEditor;
window.newFunction = newFunction;
window.exportFunctions = exportFunctions;
window.importFunctions = importFunctions;
window.openWaveEditor = openWaveEditor;
window.addNewWave = addNewWave;
window.loadPredefinedWaveSet = loadPredefinedWaveSet;
window.testMap = testMap;
window.toggleAudio = toggleAudio;
window.menuNew = menuNew;
window.saveProject = saveProject;
window.loadProject = loadProject;
window.undo = undo;
window.redo = redo;
window.clearEvents = clearEvents;
window.setGameSpeed = setGameSpeed;
window.togglePerformance = togglePerformance;
window.closeModal = closeModal;
window.createNewMap = createNewMap;
window.startWave = startWave;
window.togglePause = togglePause;
window.toggleFastForward = toggleFastForward;
window.backToEditor = backToEditor;
window.buyTower = buyTower;
window.showTowerRange = showTowerRange;
window.hideTowerRange = hideTowerRange;
window.loadFunctionTemplate = loadFunctionTemplate;
window.testFunctionCode = testFunctionCode;
window.saveFunction = saveFunction;
window.clearAllFunctions = clearAllFunctions;
window.clearAllWaves = clearAllWaves;
window.exportWaves = exportWaves;
window.importWaves = importWaves;
