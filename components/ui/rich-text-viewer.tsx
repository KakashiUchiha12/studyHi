"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { TextAlign } from "@tiptap/extension-text-align"
import { Link } from "@tiptap/extension-link"
import { Youtube } from "@tiptap/extension-youtube"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface RichTextViewerProps {
    content: string
    className?: string
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const editor = useEditor({
        immediatelyRender: false,
        editable: false,
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: "text-primary underline cursor-pointer",
                    target: "_blank",
                },
            }),
            Youtube.configure({
                controls: true,
                nocookie: true,
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none",
                    className
                ),
            },
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!mounted || !editor) return null

    return (
        <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
            <EditorContent editor={editor} />
        </div>
    )
}
