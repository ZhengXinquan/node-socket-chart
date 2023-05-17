var titleInit = document.title,
  isCurrent = true,
  isNewMsg = false;

window.onload = () => {
  document.getElementById('roomNum').value = new URLSearchParams(location.search).get('r');
  document.getElementById('username').value = new URLSearchParams(location.search).get('n');
};
(function () {
  setInterval(function () {
    var title = document.title;
    if (isCurrent == false && isNewMsg == true) {
      if (/新/.test(title) == false) {
        document.title = '【你有新消息】';
      } else {
        document.title = '【　　　　　】';
      }
    } else {
      document.title = titleInit;
    }
  }, 500);

  // for Chrome and FireFox
  window.onfocus = function () {
    console.log('  window.onfocus');
    isCurrent = true;
    isNewMsg = false;
  };
  window.onblur = function () {
    console.log('  window.onblur 离开');
    isCurrent = false;
  };
  // for IE
  document.onfocusin = function () {
    console.log('  window.onfocus in');
    isCurrent = true;
    isNewMsg = false;
  };
  document.onfocusout = function () {
    console.log('  window.onfocus out 离开');
    isCurrent = false;
  };
})();

function sendNotification(title, body, callback) {
  console.log(isCurrent, isNewMsg);
  if (isCurrent === true) {
    // 当前页显示，不用弹出通知
    return;
  }

  isNewMsg = true;

  // 先检查浏览器是否支持
  if (!('Notification' in window)) {
    // IE浏览器不支持发送Notification通知!
    return;
  }

  if (Notification.permission === 'denied') {
    // 如果用户已拒绝显示通知
    return;
  }

  if (Notification.permission === 'granted') {
    //用户已授权，直接发送通知
    notify();
  } else {
    // 默认，先向用户询问是否允许显示通知
    Notification.requestPermission(function (permission) {
      // 如果用户同意，就可以直接发送通知
      if (permission === 'granted') {
        notify();
      }
    });
  }

  function notify() {
    let notification = new Notification(title, {
      icon: 'https://chart.nanshanqiao.com/favicon.ico',
      body: body,
    });
    notification.onclick = function () {
      callback && callback();
      console.log('单击通知框');
    };
    notification.onclose = function () {
      console.log('关闭通知框');
    };
  }

  console.log(isCurrent, isNewMsg);
}

(function () {
  const URL = location.origin.replace('http', 'ws');
  var d = document,
    w = window,
    p = parseInt,
    dd = d.documentElement,
    db = d.body,
    dc = d.compatMode == 'CSS1Compat',
    dx = dc ? dd : db,
    ec = encodeURIComponent;

  w.CHAT = {
    msgObj: d.getElementById('message'),
    screenheight: w.innerHeight ? w.innerHeight : dx.clientHeight,
    roomNum: null,
    username: null,
    userId: null,
    socket: null,
    //让浏览器滚动条保持在最低部
    scrollToBottom: function () {
      w.scrollTo(0, this.msgObj.clientHeight);
    },
    //退出，本例只是一个简单的刷新
    logout: function () {
      //this.socket.disconnect();
      location.reload();
    },
    //提交聊天消息内容
    submit: function () {
      var content = d.getElementById('content').value;
      if (content != '') {
        var obj = {
          userId: this.userId,
          username: this.username,
          content: content,
        };
        this.socket.emit('message', obj);
        d.getElementById('content').value = '';
      }
      return false;
    },
    genUid: function () {
      return new Date().getTime() + '' + Math.floor(Math.random() * 899 + 100);
    },
    //更新系统消息，本例中在用户加入、退出的时候调用
    updateSysMsg: function (o, action) {
      //当前在线用户列表
      var onlineUsers = o.onlineUsers;
      //当前在线人数
      var onlineCount = o.onlineCount;
      //新加入用户的信息
      var user = o.user;

      sendNotification('系统通知', `${user.username} ${action == 'login' ? ' 来了' : ' 退出'} `);

      //更新在线人数
      var usersHtml = onlineUsers.map(e => e.username).join('、');
      d.getElementById('onlinecount').innerHTML =
        '当前共有 ' + onlineCount + ' 人在线，在线列表：' + usersHtml;

      //添加系统消息
      var html = '';
      html += '<div class="msg-system">';
      html += user.username;
      html += action == 'login' ? ' 加入了聊天室' : ' 退出了聊天室';
      html += '</div>';
      var section = d.createElement('section');
      section.className = 'system J-mjrlinkWrap J-cutMsg';
      section.innerHTML = html;
      this.msgObj.appendChild(section);
      this.scrollToBottom();
    },
    //第一个界面用户提交用户名
    usernameSubmit: function () {
      var roomNum = d.getElementById('roomNum').value;
      var username = d.getElementById('username').value;
      if (!(roomNum && roomNum == Number(roomNum))) {
        return false;
      }

      if (username != '') {
        d.getElementById('roomNum').value = '';
        d.getElementById('username').value = '';
        d.getElementById('loginbox').style.display = 'none';
        d.getElementById('chatbox').style.display = 'block';
        this.init(username, roomNum);
      }
      return false;
    },
    init: function (username, roomNum) {
      /*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/

      this.userId = this.genUid();
      this.username = username;
      this.roomNum = roomNum;

      d.getElementById('showRoomNum').innerHTML = this.roomNum;
      d.getElementById('showusername').innerHTML = this.username;

      document.title = '第' + roomNum + '号房间';
      titleInit = document.title;
      //this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
      this.scrollToBottom();

      //连接websocket后端服务器
      this.socket = io(URL);

      //告诉服务器端有用户登录
      this.socket.emit('login', {
        userId: this.userId,
        username: this.username,
        roomNum: this.roomNum,
      });

      //监听新用户登录
      this.socket.on('login', function (o) {
        console.log('login', o);
        CHAT.updateSysMsg(o, 'login');
      });

      //监听用户退出
      this.socket.on('logout', function (o) {
        console.log('login', o);
        CHAT.updateSysMsg(o, 'logout');
      });

      //监听消息发送
      this.socket.on('message', function (obj) {
        var isme = obj.userId == CHAT.userId ? true : false;
        var contentDiv = '<div>' + obj.content + '</div>';
        var usernameDiv = '<span>' + obj.username + '</span>';

        var section = d.createElement('section');
        if (isme) {
          section.className = 'user';
          section.innerHTML = contentDiv + usernameDiv;
        } else {
          section.className = 'service';
          section.innerHTML = usernameDiv + contentDiv;
          sendNotification(obj.username, obj.content);
        }

        CHAT.msgObj.appendChild(section);
        CHAT.scrollToBottom();
      });
    },
  };
  //通过“回车”提交用户名
  d.getElementById('username').onkeydown = function (e) {
    e = e || event;
    if (e.keyCode === 13) {
      CHAT.usernameSubmit();
    }
  };
  //通过“回车”提交信息
  d.getElementById('content').onkeydown = function (e) {
    e = e || event;
    if (e.keyCode === 13) {
      CHAT.submit();
    }
  };
})();
