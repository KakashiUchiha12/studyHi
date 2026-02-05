"use client";

import {
    Youtube,
    Instagram,
    Globe,
    Github,
    Linkedin,
    Twitter,
    Smartphone,
    Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfileSocialLinksProps {
    socialProfile: any;
}

export function ProfileSocialLinks({ socialProfile }: ProfileSocialLinksProps) {
    if (!socialProfile) return null;

    const links = [
        {
            url: socialProfile.youtubeUrl,
            label: socialProfile.youtubeLabel || "YouTube",
            icon: Youtube,
            color: "text-red-600",
            bg: "bg-red-50",
        },
        {
            url: socialProfile.instagramUrl,
            label: socialProfile.instagramLabel || "Instagram",
            icon: Instagram,
            color: "text-pink-600",
            bg: "bg-pink-50",
        },
        {
            url: socialProfile.whatsappUrl,
            label: socialProfile.whatsappLabel || "WhatsApp",
            icon: Smartphone,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            url: socialProfile.website,
            label: socialProfile.websiteLabel || "Website",
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            url: socialProfile.websiteUrl2,
            label: socialProfile.websiteLabel2 || "Second Website",
            icon: LinkIcon,
            color: "text-slate-600",
            bg: "bg-slate-50",
        },
        {
            url: socialProfile.githubUrl,
            label: "GitHub",
            icon: Github,
            color: "text-slate-900",
            bg: "bg-slate-100",
        },
        {
            url: socialProfile.linkedinUrl,
            label: "LinkedIn",
            icon: Linkedin,
            color: "text-blue-700",
            bg: "bg-blue-50",
        },
        {
            url: socialProfile.twitterUrl,
            label: "Twitter",
            icon: Twitter,
            color: "text-sky-500",
            bg: "bg-sky-50",
        },
    ].filter(link => link.url);

    if (links.length === 0) return null;

    return (
        <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
            <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Connect
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-2 pb-6">
                {links.map((link, idx) => {
                    const Icon = link.icon;
                    // Handle WhatsApp khusus if it's just a number
                    let href = link.url;
                    if (link.icon === Smartphone && !href.startsWith('http') && !href.startsWith('wa.me')) {
                        href = `https://wa.me/${href.replace(/\D/g, '')}`;
                    } else if (!href.startsWith('http')) {
                        href = `https://${href}`;
                    }

                    return (
                        <a
                            key={idx}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                            <div className={cn("p-2 rounded-md transition-transform group-hover:scale-110", link.bg)}>
                                <Icon className={cn("w-4 h-4", link.color)} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                                {link.label}
                            </span>
                        </a>
                    );
                })}
            </CardContent>
        </Card>
    );
}
