"use client";

import { useEffect, useState } from "react";
// import CreateEventModal from "../modals/create-event-modal";
import { useModal } from "@/hooks/use-modal";
import ConfirmModal from "../modals/confirm-modal";
import EventModal from "../modals/event-modal";

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);
    
    const {isOpen, type} = useModal();

    useEffect(() => {
        setIsMounted(true);
    }, [])

    if(!isMounted) return null;
    
    return (
        <>
            {/* {isOpen && type === "create-event-modal" && <CreateEventModal />} */}
            {isOpen && type === "confirm-modal" && <ConfirmModal />}
            {isOpen && type === "event-modal" && <EventModal />}
        </>
    )
}