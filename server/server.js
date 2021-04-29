const mongoose = require('mongoose')
require('dotenv').config()
const Document = require('./Document')

mongoose.connect(process.env.database_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

const io = require('socket.io')(3001, {
    cors: {
        // client url 
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

const defaultValue = ''

io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrCreate(documentId)
        socket.join(documentId)
        socket.emit('load-document', document.data)
        socket.on('send-changes', delta => {
            //console.log(delta);
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        })

        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    }) 
})


async function findOrCreate(id){
    if(id === null) return

    const document = await Document.findById(id)
    if(document) return document
    return await Document.create({ _id: id, data: defaultValue })
}