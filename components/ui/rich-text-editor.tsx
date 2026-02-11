"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { TextAlign } from "@tiptap/extension-text-align"
import { Link } from "@tiptap/extension-link"
import { Youtube } from "@tiptap/extension-youtube"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Youtube as YoutubeIcon,
    Smile,
    Redo,
    Undo,
} from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({
    content,
    onChange,
    placeholder,
    className,
}: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline cursor-pointer",
                },
            }),
            Youtube.configure({
                controls: false,
                nocookie: true,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-3 py-2",
                    className
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    const [linkUrl, setLinkUrl] = useState("")

    if (!mounted || !editor) {
        return (
            <div className={cn(
                "border rounded-md bg-background min-h-[150px] animate-pulse",
                className
            )} />
        )
    }

    const setLink = () => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
            setLinkUrl("")
        }
    }

    const addYoutubeVideo = () => {
        const url = prompt("Enter YouTube URL")
        if (url) {
            editor.commands.setYoutubeVideo({
                src: url,
            })
        }
    }

    const onEmojiClick = (emojiData: EmojiClickData) => {
        editor.chain().focus().insertContent(emojiData.emoji).run()
    }

    return (
        <div className="border rounded-md bg-background flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/40 items-center">
                <Toggle
                    size="sm"
                    pressed={editor.isActive("bold")}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("underline")}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Toggle underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    aria-label="Toggle strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("code")}
                    onPressedChange={() => editor.chain().focus().toggleCode().run()}
                    aria-label="Toggle code"
                >
                    <Code className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    aria-label="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    aria-label="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    aria-label="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: "left" })}
                    onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
                    aria-label="Align left"
                >
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: "center" })}
                    onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
                    aria-label="Align center"
                >
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: "right" })}
                    onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
                    aria-label="Align right"
                >
                    <AlignRight className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: "justify" })}
                    onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
                    aria-label="Justify"
                >
                    <AlignJustify className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive("bulletList")}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Bullet list"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("orderedList")}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Ordered list"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("blockquote")}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Blockquote"
                >
                    <Quote className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                <Popover>
                    <PopoverTrigger asChild>
                        <Toggle size="sm" pressed={editor.isActive("link")} aria-label="Insert Link">
                            <LinkIcon className="h-4 w-4" />
                        </Toggle>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                            <Button size="sm" onClick={setLink}>Add</Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={addYoutubeVideo}
                    className={cn(editor.isActive("youtube") && "bg-accent")}
                    title="Insert YouTube Video"
                >
                    <YoutubeIcon className="h-4 w-4" />
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" title="Insert Emoji">
                            <Smile className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-none">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </PopoverContent>
                </Popover>

                <div className="flex-1" />

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
                <EditorContent editor={editor} className="min-h-[150px] p-0" />
            </div>
        </div>
    )
}
