"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileText, Download, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface ProjectCSVImporterProps {
    onImport: (data: {
        title: string
        description: string
        coverImage?: string
        category?: string
        tags?: string[]
        sections: Array<{
            order: number
            title: string
            content: string
            images?: string[]
            videoUrl?: string
        }>
    }) => void
}

export function ProjectCSVImporter({ onImport }: ProjectCSVImporterProps) {
    const [csvText, setCSVText] = useState("")

    const aiPrompt = `You are a project content generator. Generate a CSV file for a project with the following format:

**CSV Format:**
\`\`\`
title,description,coverImage,category,tags,sectionOrder,sectionTitle,sectionContent,sectionImages,sectionVideo
"Project Title","Project description here","https://example.com/cover.jpg","Web Development","react,nextjs,typescript",1,"Introduction","Content for introduction section","https://example.com/img1.jpg|https://example.com/img2.jpg","https://youtube.com/watch?v=..."
"","","","","",2,"Features","Content for features section","https://example.com/img3.jpg",""
"","","","","",3,"Conclusion","Content for conclusion section","",""
\`\`\`

**Rules:**
1. First row must contain the project's basic info (title, description, coverImage, category, tags)
2. Subsequent rows are for sections (leave basic info columns empty except sectionOrder, sectionTitle, sectionContent, etc.)
3. Tags should be comma-separated within the cell (e.g., "react,nextjs,typescript")
4. Section images should be pipe-separated URLs (e.g., "url1|url2|url3")
5. Maximum 3 images per section
6. All image URLs must be valid and accessible
7. Cover image is optional but recommended
8. Category options: Web Development, Mobile Development, Data Science, Machine Learning, Game Development, Design, Other

**Example Project:**
Generate a CSV for a "Full Stack E-commerce Platform" project with:
- Cover image URL
- 5 sections: Introduction, Tech Stack, Features, Architecture, Deployment
- Relevant images for each section
- Tags: react, nodejs, mongodb, stripe
- Category: Web Development

Please generate the CSV content following the exact format above.`

    const copyAIPrompt = () => {
        navigator.clipboard.writeText(aiPrompt)
        toast.success("AI Prompt copied to clipboard!")
    }

    const downloadTemplate = () => {
        const template = `title,description,coverImage,category,tags,sectionOrder,sectionTitle,sectionContent,sectionImages,sectionVideo
"My Awesome Project","A comprehensive description of the project","https://example.com/cover.jpg","Web Development","react,nextjs,typescript",1,"Introduction","This is the introduction section content","https://example.com/img1.jpg|https://example.com/img2.jpg","https://youtube.com/watch?v=example"
"","","","","",2,"Features","This is the features section content","https://example.com/img3.jpg",""
"","","","","",3,"Conclusion","This is the conclusion section content","",""`

        const blob = new Blob([template], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "project_template.csv"
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Template downloaded!")
    }

    const parseCSV = (text: string) => {
        const lines = text.trim().split("\n")
        if (lines.length < 2) {
            throw new Error("CSV must have at least a header and one data row")
        }

        // Remove header
        const dataLines = lines.slice(1)

        let title = ""
        let description = ""
        let coverImage = ""
        let category = ""
        let tags: string[] = []
        const sections: Array<{
            order: number
            title: string
            content: string
            images?: string[]
            videoUrl?: string
        }> = []

        dataLines.forEach((line, index) => {
            // Simple CSV parsing (handles quoted fields)
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
            if (!matches || matches.length < 10) {
                throw new Error(`Invalid CSV format at line ${index + 2}`)
            }

            const fields = matches.map((field) => field.replace(/^"|"$/g, "").trim())

            // First row contains project info
            if (index === 0) {
                title = fields[0]
                description = fields[1]
                coverImage = fields[2]
                category = fields[3]
                tags = fields[4] ? fields[4].split(",").map((t) => t.trim()).filter(Boolean) : []
            }

            // All rows contain section info
            const sectionOrder = parseInt(fields[5])
            const sectionTitle = fields[6]
            const sectionContent = fields[7]
            const sectionImages = fields[8] ? fields[8].split("|").map((url) => url.trim()).filter(Boolean) : []
            const sectionVideo = fields[9]

            if (sectionTitle && sectionContent) {
                if (sectionImages.length > 3) {
                    throw new Error(`Section "${sectionTitle}" has more than 3 images`)
                }

                sections.push({
                    order: sectionOrder,
                    title: sectionTitle,
                    content: sectionContent,
                    images: sectionImages.length > 0 ? sectionImages : undefined,
                    videoUrl: sectionVideo || undefined,
                })
            }
        })

        if (!title || !description) {
            throw new Error("Title and description are required")
        }

        if (sections.length === 0) {
            throw new Error("At least one section is required")
        }

        return {
            title,
            description,
            coverImage: coverImage || undefined,
            category: category || undefined,
            tags: tags.length > 0 ? tags : undefined,
            sections,
        }
    }

    const handleImport = () => {
        try {
            const data = parseCSV(csvText)
            onImport(data)
            toast.success("CSV imported successfully!")
            setCSVText("")
        } catch (error: any) {
            toast.error(error.message || "Failed to parse CSV")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Import from CSV
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyAIPrompt}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Copy AI Prompt for Project
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="csv-input">Paste CSV Content</Label>
                    <Textarea
                        id="csv-input"
                        value={csvText}
                        onChange={(e) => setCSVText(e.target.value)}
                        placeholder="Paste your CSV content here..."
                        rows={10}
                        className="font-mono text-sm"
                    />
                </div>

                <Button
                    type="button"
                    onClick={handleImport}
                    disabled={!csvText.trim()}
                    className="w-full"
                >
                    Import Project from CSV
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                    <p>• CSV must include: title, description, and at least one section</p>
                    <p>• Images can be provided as URLs (pipe-separated for multiple)</p>
                    <p>• Maximum 3 images per section</p>
                    <p>• After import, you can edit all fields before publishing</p>
                </div>
            </CardContent>
        </Card>
    )
}
