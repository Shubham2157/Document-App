import { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const SAVED_INTERVAL_MS = 2000
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ]

export default function TextEditor() {
    const { id: documentId } = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    //console.log(documentId);

    useEffect(() => {
        // server url
        const s = io('http://localhost:3001')
        setSocket(s)

        return() => {
            s.disconnect()
        }
    }, [])

    // for saving document

    useEffect(() => {
        if(socket == null || quill == null) return

        const interval = setInterval(() =>{
            socket.emit('save-document', quill.getContents())
        }, SAVED_INTERVAL_MS)

        return()=> {
            clearInterval(interval)
        }
    },[socket, quill])

    useEffect(() => {
        if(socket == null || quill == null) return

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })
        socket.emit('get-document', documentId)
    }, [socket, quill, documentId])

    useEffect(() => {
        if(socket == null || quill == null) return

        // https://quilljs.com/docs/api/#text-change
        const handler = (delta) => {
            quill.updateContents(delta)
        }
        socket.on('receive-changes', handler)
        return() => {
            socket.off('receive-changes', handler)
        }
    },[socket, quill])
    

    useEffect(() => {
        if(socket == null || quill == null) return

        // https://quilljs.com/docs/api/#text-change
        const handler = (delta, oldDelta, source) => {
            if(source !== 'user') return
            socket.emit('send-changes', delta)
        }
        quill.on('text-change', handler)
        return() => {
            quill.off('text-change', handler)
        }
    },[socket, quill])


    // for cleaning up previously rendered editor 
    const wrapperRef = useCallback((wrapper) => {
        const editor = document.createElement('div')
        if (wrapper == null) return
        wrapper.innerHTML = ''
        wrapper.append(editor)
        const q = new Quill(editor, { theme: 'snow', modules: { toolbar: TOOLBAR_OPTIONS } }) 
        q.disable()
        q.setText('Loading...')
        setQuill(q)
        return() => {
            wrapperRef.innerHTML = ''
            //sh
        }
    }, [])
    return (
        <div className="container" ref={wrapperRef}></div>
    )
}
