"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ChannelList } from "./channel-list";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileNavProps {
    communityId: string;
    channels: any[];
    isAdmin: boolean;
    communityName: string;
    children?: React.ReactNode;
}

export function MobileNav({
    communityId,
    channels,
    isAdmin,
    communityName,
    children
}: MobileNavProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col w-80">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-left truncate">{communityName}</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <ChannelList
                            communityId={communityId}
                            initialChannels={channels}
                            isAdmin={isAdmin}
                        />
                        {children}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
