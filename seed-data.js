const pool = require('./db');

async function seedDatabase() {
    const connection = await pool.getConnection();
    
    try {
    
        
        // 1. Генеруємо 10,000 користувачів
        console.log('Створюємо користувачів...');
        const userValues = [];
        for (let i = 1; i <= 10000; i++) {
            userValues.push([`user${i}`, `user${i}@example.com`]);
        }
        
        // Batch insert користувачів (по 1000 за раз)
        for (let i = 0; i < userValues.length; i += 1000) {
            const batch = userValues.slice(i, i + 1000);
            await connection.query(
                'INSERT INTO users (username, email) VALUES ?',
                [batch]
            );
            console.log(`  ✓ Створено ${Math.min(i + 1000, 10000)} користувачів`);
        }
        
        // 2. Генеруємо 50,000 розмов
        console.log('Створюємо розмови...');
        const conversationValues = [];
        for (let i = 1; i <= 50000; i++) {
            const type = i % 5 === 0 ? 'group' : 'direct'; // 20% group, 80% direct
            const name = type === 'group' ? `Group Chat ${i}` : null;
            const createdBy = Math.floor(Math.random() * 10000) + 1;
            conversationValues.push([type, name, createdBy]);
        }
        
        for (let i = 0; i < conversationValues.length; i += 1000) {
            const batch = conversationValues.slice(i, i + 1000);
            await connection.query(
                'INSERT INTO conversations (type, name, created_by) VALUES ?',
                [batch]
            );
            console.log(`  ✓ Створено ${Math.min(i + 1000, 50000)} розмов`);
        }
        
        // 3. Додаємо учасників до розмов
        console.log('Додаємо учасників...');
        const participantValues = [];
        for (let convId = 1; convId <= 50000; convId++) {
            // Кожна розмова має 2-5 учасників
            const participantCount = Math.floor(Math.random() * 4) + 2;
            const participants = new Set();
            
            while (participants.size < participantCount) {
                participants.add(Math.floor(Math.random() * 10000) + 1);
            }
            
            Array.from(participants).forEach((userId, index) => {
                participantValues.push([convId, userId, index === 0]);
            });
        }
        
        for (let i = 0; i < participantValues.length; i += 5000) {
            const batch = participantValues.slice(i, i + 5000);
            await connection.query(
                'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ?',
                [batch]
            );
            console.log(`  ✓ Додано ${Math.min(i + 5000, participantValues.length)} учасників`);
        }
        
        // 4. Генеруємо 1,000,000 повідомлень
        console.log('Створюємо повідомлення');
        const messageTexts = [
            'Hello!', 'How are you?', 'What\'s up?', 'See you later',
            'Thanks!', 'Got it', 'Sure thing', 'Let me check',
            'Sounds good', 'I agree', 'No problem', 'On my way'
        ];
        
        for (let i = 0; i < 1000000; i += 5000) {
            const batch = [];
            for (let j = 0; j < 5000 && (i + j) < 1000000; j++) {
                const convId = Math.floor(Math.random() * 50000) + 1;
                const senderId = Math.floor(Math.random() * 10000) + 1;
                const content = messageTexts[Math.floor(Math.random() * messageTexts.length)];
                batch.push([convId, senderId, content, 'text', null, false]);
            }
            
            await connection.query(
                'INSERT INTO messages (conversation_id, sender_id, content, type, metadata, is_deleted) VALUES ?',
                [batch]
            );
            console.log(`  ✓ Створено ${Math.min(i + 5000, 1000000)} повідомлень`);
        }
        
        // 5. Оновлюємо last_message_at для розмов
        console.log('Оновлюємо статистику розмов...');
        await connection.query(`
            UPDATE conversations c
            SET last_message_at = (
                SELECT MAX(created_at)
                FROM messages m
                WHERE m.conversation_id = c.id
            )
        `);
        
        
        
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [convCount] = await connection.query('SELECT COUNT(*) as count FROM conversations');
        const [msgCount] = await connection.query('SELECT COUNT(*) as count FROM messages');
        
        console.log(`   Користувачів: ${userCount[0].count}`);
        console.log(`   Розмов: ${convCount[0].count}`);
        console.log(`   Повідомлень: ${msgCount[0].count}`);
        
    } catch (error) {
        console.error('❌ Помилка:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

seedDatabase();