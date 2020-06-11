const socket=io()

//Elements
const messageForm=document.querySelector('#message')
const messageInput=messageForm.querySelector('input')
const messageBtn=messageForm.querySelector('button')
const locationBtn=document.querySelector('#location')
const messages=document.querySelector('#messages')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML


//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll=()=>{
    //New message element
    const newMessage=messages.lastElementChild

    //Height of new message
    const newMessageStyles=getComputedStyle(newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight=messages.offsetHeight

    //height of messages container
    const containerHeight=messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset=messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        messages.scrollTop=messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm A')   
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage',(message)=>{
    const html=Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm A')

    })
    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,users
    })
    document.querySelector('#sidebar').innerHTML=html
})

messageForm.addEventListener('submit',(evt)=>{
    evt.preventDefault()
    
    //disable the button while sending a message
    messageBtn.setAttribute('disabled','disabled')

    const message =evt.target.elements.message.value

    socket.emit('sendMessage',message,(error)=>{
        
        //enable
        messageBtn.removeAttribute('disabled')
        messageInput.value=''
        messageInput.focus()
        if(error){
           return console.log(error)
        }
        console.log('The message was delievered')
    })
})


locationBtn.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    //disale the button
    locationBtn.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
    
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{

            //enabling the button
            locationBtn.removeAttribute('disabled')
            console.log('Location shared')
        })

        //The issue with the position object/result that we get from calling
        // navigator.geolocation.getCurrentPosition is that it's properties 
        //are not enumerable, meaning that we can't easily "stringify" the 
        //object and pass it along with our socket.emit call, which is why
        // we're getting an empty object as a result.
    })
})

socket.emit('join',{ username,room },(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})