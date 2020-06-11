const http=require('http')
const path=require('path')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)  //socketio expects to be called with raw http server so we refactored the code with http server

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('Admin',"Welcome!!!"))

        //BY this method event will be sent to all sockets except the one that broadcasted the event
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!!!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()  //Acknowlegement event
    })

    socket.on('sendLocation',(position,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
           
        }
    })
})

server.listen(port,()=>{
    console.log('Server is running!!!')
})
