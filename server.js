// 使用 import 替换 require
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Filter } from 'bad-words'; // 注意这里的解构写法

const app = express();
app.use(cors());
const server = createServer(app); // 注意这里直接使用 createServer

const filter = new Filter();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- 以下逻辑保持不变 ---
const animals = ['海马', '考拉', '企鹅', '猫头鹰', '流浪猫', '旅人'];
const adjectives = ['勇敢的', '静静的', '迷茫的', '寻找方向的', '路过的'];

app.get('/health', (req, res) => res.send('OK'));

io.on('connection', (socket) => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const nickname = adjectives[Math.floor(Math.random() * adjectives.length)] + 
                     animals[Math.floor(Math.random() * animals.length)] + 
                     "#" + randomNumber;
    
    console.log(`用户 ${nickname} 已连接`);
    socket.emit('assigned_nickname', nickname);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('system_message', `${nickname} 悄悄进入了房间`);
    });

    socket.on('send_message', (data) => {
        if (!data.text) return;
        let cleanContent;
        try {
            cleanContent = filter.clean(data.text);
        } catch {
            cleanContent = data.text;
        }

        const messagePayload = {
            id: Date.now(),
            author: nickname,
            text: cleanContent,
            time: new Date().toLocaleTimeString()
        };
        io.to(data.roomId).emit('receive_message', messagePayload);
    });

    socket.on('disconnect', () => {
        console.log(`${nickname} 离开了`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口: ${PORT}`);
});