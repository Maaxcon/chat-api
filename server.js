const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());

// === GLOBAL METRICS & STATE ===
const metrics = {
    start_time: Date.now(),
    total_requests: 0,
    active_connections: 0,
    errors: 0,
    response_times: []
};
let chaosEnabled = false;

// === 1. MIDDLEWARE: LOGGING & METRICS ===
app.use((req, res, next) => {
    metrics.total_requests++;
    metrics.active_connections++;
    const start = process.hrtime();

    const originalJson = res.json;
    res.json = function (body) {
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
        
        // Зберігаємо час відповіді для метрик
        metrics.response_times.push(parseFloat(duration));
        if (metrics.response_times.length > 100) {
            metrics.response_times.shift();
        }
        
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Server-Id', process.env.SERVER_ID || 'node-server');
        
        return originalJson.call(this, body);
    };

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
        metrics.active_connections--;

        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration_ms: duration,
            server_id: process.env.SERVER_ID || 'node-server'
        };
        console.log(JSON.stringify(logEntry));
    });
    next();
});

// === 2. CHAOS MONKEY MIDDLEWARE ===
app.use((req, res, next) => {
    if (chaosEnabled && Math.random() < 0.1) {
        metrics.errors++;
        return res.status(500).json({ error: 'Chaos monkey strike!' });
    }
    next();
});

// === LATENCY SIMULATOR ===
const simulateLatency = async (type = 'read') => {
    const ms = type === 'read' ? 50 : 100;
    return new Promise(resolve => setTimeout(resolve, ms));
};

// === SYSTEM ENDPOINTS ===
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server_id: process.env.SERVER_ID || 'node-server',
        uptime_seconds: (Date.now() - metrics.start_time) / 1000,
        request_count: metrics.total_requests
    });
});

app.get('/api/metrics', (req, res) => {
    const avgResponseTime = metrics.response_times.length > 0
        ? metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length
        : 0;
    
    const uptime = (Date.now() - metrics.start_time) / 1000;
    const rps = metrics.total_requests / uptime;
    
    res.json({
        total_requests: metrics.total_requests,
        requests_per_second: rps.toFixed(2),
        average_response_time: avgResponseTime.toFixed(2),
        error_rate: (metrics.errors / Math.max(metrics.total_requests, 1)).toFixed(4),
        active_connections: metrics.active_connections,
        uptime_seconds: uptime.toFixed(2)
    });
});

app.get('/api/chaos/enable', (req, res) => {
    chaosEnabled = true;
    res.json({ message: 'Chaos mode enabled' });
});

app.get('/api/chaos/disable', (req, res) => {
    chaosEnabled = false;
    res.json({ message: 'Chaos mode disabled' });
});

// ==========================================
// BUSINESS LOGIC (ALL 10 ENDPOINTS) - З РЕАЛЬНОЮ БД
// ==========================================

// 1. GET /api/conversations (List user's conversations)
app.get('/api/conversations', async (req, res) => {
    try {
        await simulateLatency('read');
        const userId = req.query.user_id || 1; // В реальності з токена
        
        const [rows] = await pool.query(`
            SELECT c.*, COUNT(m.id) as message_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE cp.user_id = ?
            GROUP BY c.id
            ORDER BY c.last_message_at DESC
            LIMIT 20
        `, [userId]);
        
        res.json(rows);
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 2. GET /api/conversations/:id/messages (Get messages paginated)
app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
        await simulateLatency('read');
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.query(`
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ? AND m.is_deleted = FALSE
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.params.id, limit, offset]);
        
        res.json({
            conversation_id: req.params.id,
            page: page,
            messages: rows
        });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 3. POST /api/messages/send (Send message)
app.post('/api/messages/send', async (req, res) => {
    try {
        await simulateLatency('write');
        const { conversation_id, sender_id, content, type = 'text' } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO messages (conversation_id, sender_id, content, type)
            VALUES (?, ?, ?, ?)
        `, [conversation_id, sender_id, content, type]);
        
        // Оновлюємо last_message_at
        await pool.query(`
            UPDATE conversations
            SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [conversation_id]);
        
        res.status(201).json({
            status: "sent",
            message_id: result.insertId,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 4. PUT /api/messages/:id/read (Mark as read)
app.put('/api/messages/:id/read', async (req, res) => {
    try {
        await simulateLatency('write');
        const { user_id } = req.body;
        
        await pool.query(`
            INSERT INTO message_status (message_id, user_id, is_read, read_at)
            VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE is_read = TRUE, read_at = CURRENT_TIMESTAMP
        `, [req.params.id, user_id]);
        
        res.json({ status: "read", message_id: req.params.id });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 5. GET /api/messages/unread (Get unread count)
app.get('/api/messages/unread', async (req, res) => {
    try {
        await simulateLatency('read');
        const userId = req.query.user_id || 1;
        
        const [rows] = await pool.query(`
            SELECT COUNT(*) as unread_count
            FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            LEFT JOIN message_status ms ON m.id = ms.message_id AND ms.user_id = ?
            WHERE cp.user_id = ? 
                AND m.sender_id != ?
                AND (ms.is_read IS NULL OR ms.is_read = FALSE)
        `, [userId, userId, userId]);
        
        res.json({ unread_count: rows[0].unread_count });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 6. POST /api/conversations/create (Create group chat)
app.post('/api/conversations/create', async (req, res) => {
    try {
        await simulateLatency('write');
        const { name, type = 'group', created_by, participants = [] } = req.body;
        
        const [result] = await pool.query(`
            INSERT INTO conversations (name, type, created_by)
            VALUES (?, ?, ?)
        `, [name, type, created_by]);
        
        const conversationId = result.insertId;
        
        // Додаємо учасників
        if (participants.length > 0) {
            const values = participants.map(userId => [conversationId, userId, userId === created_by]);
            await pool.query(`
                INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
                VALUES ?
            `, [values]);
        }
        
        res.status(201).json({
            id: conversationId,
            name: name,
            type: type
        });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 7. POST /api/conversations/:id/typing (Send typing indicator)
app.post('/api/conversations/:id/typing', async (req, res) => {
    await simulateLatency('write');
    // В реальності тут буде WebSocket або Server-Sent Events
    res.json({
        status: "typing_sent",
        conversation_id: req.params.id,
        user_id: req.body.user_id
    });
});

// 8. GET /api/messages/search (Search messages)
app.get('/api/messages/search', async (req, res) => {
    try {
        await simulateLatency('read');
        const query = req.query.q;
        const userId = req.query.user_id || 1;
        
        if (!query) {
            return res.json({ results: [], query: query });
        }
        
        const [rows] = await pool.query(`
            SELECT m.*, c.name as conversation_name, u.username as sender_name
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            JOIN users u ON m.sender_id = u.id
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ? 
                AND MATCH(m.content) AGAINST(? IN NATURAL LANGUAGE MODE)
                AND m.is_deleted = FALSE
            LIMIT 50
        `, [userId, query]);
        
        res.json({ results: rows, query: query });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 9. DELETE /api/messages/:id (Delete message - soft delete)
app.delete('/api/messages/:id', async (req, res) => {
    try {
        await simulateLatency('write');
        
        await pool.query(`
            UPDATE messages
            SET is_deleted = TRUE
            WHERE id = ?
        `, [req.params.id]);
        
        res.json({ status: "deleted", id: req.params.id });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// 10. GET /api/conversations/:id/media (Get shared media)
app.get('/api/conversations/:id/media', async (req, res) => {
    try {
        await simulateLatency('read');
        
        const [rows] = await pool.query(`
            SELECT id, sender_id, type, metadata, created_at
            FROM messages
            WHERE conversation_id = ? 
                AND type IN ('image', 'file')
                AND is_deleted = FALSE
            ORDER BY created_at DESC
            LIMIT 100
        `, [req.params.id]);
        
        res.json({ media: rows });
    } catch (error) {
        metrics.errors++;
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
});