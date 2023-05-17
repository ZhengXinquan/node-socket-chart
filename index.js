const PORT = 3003;
var express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
var path = require('path');
const publicPath = path.join(__dirname, '/client');
console.log(publicPath);

app.use('/', express.static(publicPath));

//在线用户
const ONLINE = {
  users: [],
  add(user) {
    const flag = this.users.find(u => u.userId == user.userId);
    if (!flag) this.users.push(user);
    return {
      onlineUsers: this.getRoomUsers(user.roomNum),
      onlineCount: this.count(user.roomNum),
      user,
    };
  },
  getUser(userId) {
    return this.users.find(u => u.userId == userId);
  },
  getRoomUsers(roomNum) {
    return this.users.filter(u => u.roomNum == roomNum);
  },
  count(roomNum) {
    if (roomNum) {
      return this.getRoomUsers(roomNum).length;
    } else {
      return this.users.length;
    }
  },
  remove(user) {
    if (user.userId) {
      const i = this.users.findIndex(u => u.userId == user.userId);
      if (i > -1) this.users.splice(i, 1);
    }
    return {
      onlineUsers: this.getRoomUsers(user.roomNum),
      onlineCount: this.count(user.roomNum),
      user,
    };
  },
};
io.on('connection', function (socket) {
  console.log('a user connected');

  //监听新用户加入
  socket.on('login', function (obj) {
    //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
    socket.userId = obj.userId;
    socket.roomNum = obj.roomNum;
    io.in(socket.id).socketsJoin(socket.roomNum);
    io.to(socket.roomNum).emit('login', ONLINE.add({ ...obj }));
    console.log(obj.username + '加入了聊天室');
  });

  //监听用户退出
  socket.on('disconnect', function () {
    //退出用户的信息
    const user = ONLINE.getUser(socket.userId);
    if (user) {
      //将退出的用户从在线列表中删除
      //在线人数-1
      //向所有客户端广播用户退出
      io.to(socket.roomNum).emit('logout', ONLINE.remove(user));
      console.log(user.username + '退出了聊天室');
    }
  });

  //监听用户发布聊天内容
  socket.on('message', function (obj) {
    //向所有客户端广播发布的消息
    console.log('socket.roomNum', socket.roomNum);
    console.log('socket.rooms', socket.rooms);
    io.to(socket.roomNum).emit('message', obj);
    console.log(obj.username + '说：' + obj.content);
  });
});

server.listen(PORT, function () {
  console.log('listening on *:' + PORT);
});
